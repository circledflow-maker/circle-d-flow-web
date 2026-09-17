#!/usr/bin/env python3
"""Performance session + light audio fingerprint (librosa).

Groups clips by artist + DSC neighborhood. Estimates BPM/energy so B-roll
scoring can prefer same-session material without inventing song titles.
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np

from contract import OUT, WORK


SESSIONS_PATH = OUT / "performance_sessions.json"


def _extract_wav(src: Path, ss: float, dur: float, wav: Path) -> bool:
    r = subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", f"{ss:.2f}", "-t", f"{dur:.2f}", "-i", str(src),
            "-vn", "-ac", "1", "-ar", "22050", str(wav),
        ],
        capture_output=True, text=True,
    )
    return r.returncode == 0 and wav.exists() and wav.stat().st_size > 1000


def audio_profile(src: Path, duration: float) -> dict:
    """BPM + energy fingerprint from mid window. Low confidence if fails."""
    try:
        import librosa
    except Exception:
        return {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}

    ss = max(0.0, min(duration * 0.35, max(0.0, duration - 12)))
    take = min(12.0, max(4.0, duration - ss - 0.5))
    WORK.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=str(WORK)) as td:
        wav = Path(td) / "a.wav"
        if not _extract_wav(src, ss, take, wav):
            return {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}
        try:
            y, sr = librosa.load(str(wav), sr=22050, mono=True)
            if y.size < sr * 2:
                return {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            bpm = float(np.atleast_1d(tempo)[0]) if tempo is not None else 0.0
            rms = float(np.sqrt(np.mean(np.square(y))))
            # spectral centroid as brightness proxy
            cent = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
            return {
                "bpm": round(bpm, 2),
                "energy": round(rms, 5),
                "brightness": round(cent, 1),
                "confidence": 0.72,
            }
        except Exception:
            return {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}


def song_similarity(a: dict, b: dict) -> float:
    """0–1 similarity without claiming song identity."""
    if (a.get("confidence") or 0) < 0.4 or (b.get("confidence") or 0) < 0.4:
        return 0.35  # unknown — do not invent
    bpm_a, bpm_b = a.get("bpm") or 0, b.get("bpm") or 0
    if bpm_a < 40 or bpm_b < 40:
        return 0.4
    bpm_diff = abs(bpm_a - bpm_b) / max(bpm_a, bpm_b)
    bpm_score = max(0.0, 1.0 - bpm_diff * 2.5)
    e_a, e_b = a.get("energy") or 0, b.get("energy") or 0
    e_score = 1.0 - min(1.0, abs(e_a - e_b) / max(0.02, max(e_a, e_b)))
    return round(0.65 * bpm_score + 0.35 * e_score, 3)


def assign_sessions(rows: list[dict], gap_dsc: int = 12) -> list[dict]:
    """Cluster same-artist clips that are close in DSC into sessions."""
    by_artist: dict[str, list[dict]] = {}
    for r in rows:
        if r.get("filler") and r.get("artist") != "Event_Broll":
            continue
        by_artist.setdefault(r["artist"], []).append(r)

    sessions = []
    sid = 0
    for artist, items in by_artist.items():
        items = sorted(items, key=lambda x: x["dsc"])
        cluster: list[dict] = []
        for r in items:
            if not cluster:
                cluster = [r]
                continue
            if r["dsc"] - cluster[-1]["dsc"] <= gap_dsc:
                cluster.append(r)
            else:
                sid += 1
                sessions.append(_session_dict(sid, artist, cluster))
                cluster = [r]
        if cluster:
            sid += 1
            sessions.append(_session_dict(sid, artist, cluster))

    # attach session_id onto rows (mutate copies via path key)
    path_to_session = {}
    for s in sessions:
        for src in s["sources"]:
            path_to_session[src] = s["session_id"]
    for r in rows:
        r["session_id"] = path_to_session.get(str(r["path"]))

    OUT.mkdir(parents=True, exist_ok=True)
    SESSIONS_PATH.write_text(json.dumps({"sessions": sessions}, indent=2), encoding="utf-8")
    return sessions


def _session_dict(sid: int, artist: str, cluster: list[dict]) -> dict:
    cams = sorted({c["camera"] for c in cluster})
    return {
        "session_id": f"SESSION_{sid:03d}",
        "artist": artist,
        "dsc_start": cluster[0]["dsc"],
        "dsc_end": cluster[-1]["dsc"],
        "time_band": (
            "EARLY" if cluster[0]["dsc"] < 1000
            else "LATE" if cluster[0]["dsc"] >= 1400
            else "MID"
        ),
        "cameras": cams,
        "clip_count": len(cluster),
        "sources": [str(c["path"]) for c in cluster],
    }


def enrich_audio_profiles(rows: list[dict], limit: int = 40) -> None:
    """Compute audio profiles for a capped set (main candidates + all D850).

    Each profile runs in a child process so a librosa/ffmpeg crash cannot
    kill the assemble parent (seen as Win32 0xC0000005).
    Caches results under OUT/audio_profiles.json for fast rebuilds.
    """
    import subprocess
    import sys

    cache_path = OUT / "audio_profiles.json"
    cache: dict = {}
    if cache_path.exists():
        try:
            cache = json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception:
            cache = {}

    d850 = [r for r in rows if r["camera"] == "D850"]
    z50 = sorted(
        [r for r in rows if r["camera"] == "Z50II" and not r.get("filler")],
        key=lambda r: r["dsc"],
    )
    step = max(1, len(z50) // max(1, limit - len(d850)))
    sample = d850 + z50[::step]
    sample = sample[:limit]
    for i, r in enumerate(sample):
        key = str(r["path"])
        if key in cache and (cache[key].get("confidence") or 0) > 0:
            r["audio"] = cache[key]
            continue
        print(f"  audio profile {i+1}/{len(sample)} {r['path'].name}", flush=True)
        try:
            code = (
                "import json,sys; from pathlib import Path; "
                "sys.path.insert(0, r'%s'); from sessions import audio_profile; "
                "print(json.dumps(audio_profile(Path(sys.argv[1]), float(sys.argv[2]))))"
            ) % str(Path(__file__).resolve().parent).replace("\\", "\\\\")
            proc = subprocess.run(
                [sys.executable, "-c", code, str(r["path"]), str(r["duration"])],
                capture_output=True,
                text=True,
                timeout=90,
            )
            if proc.returncode == 0 and proc.stdout.strip():
                r["audio"] = json.loads(proc.stdout.strip().splitlines()[-1])
            else:
                r["audio"] = {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}
        except Exception:
            r["audio"] = {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}
        cache[key] = r["audio"]

    OUT.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(cache, indent=2), encoding="utf-8")
    print(f"  audio cache entries={len(cache)} -> {cache_path.name}", flush=True)
