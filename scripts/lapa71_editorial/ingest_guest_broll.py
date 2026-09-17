#!/usr/bin/env python3
"""Ingest guest B-roll (Chris / René / Phone) into Full_Takes + match to Z50 spine.

Copies/renames extracted media into:
  Full_Takes/GUEST_<SOURCE>_<stem>.mp4

Writes match report using:
  - file mtime / embedded creation time as TOD proxy
  - librosa BPM/energy vs nearby Z50 proxies
  - DSC neighborhood heuristics for PiP pairing
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import OUT, PROXIES, START_DSC, WORK  # noqa: E402
from media import list_proxies, lighting_era, probe_dur  # noqa: E402

STAGE = WORK.parent / "ingest_guest_zips"
REPORT = OUT / "guest_broll_match_report.json"


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def probe_creation(path: Path) -> str | None:
    r = run([
        "ffprobe", "-v", "error", "-show_entries",
        "format_tags=creation_time:stream_tags=creation_time",
        "-of", "json", str(path),
    ])
    if r.returncode != 0:
        return None
    try:
        data = json.loads(r.stdout or "{}")
        tags = (data.get("format") or {}).get("tags") or {}
        if tags.get("creation_time"):
            return tags["creation_time"]
        for s in data.get("streams") or []:
            t = (s.get("tags") or {}).get("creation_time")
            if t:
                return t
    except Exception:
        return None
    return None


def source_of(path: Path) -> str:
    s = str(path).upper()
    if "CHRIS" in s or "INACIO" in s:
        return "CHRIS"
    if "PHONE" in s:
        return "PHONE"
    if "RENE" in s or "RENÉ" in s or "REN" in s:
        # folder label RENE_part
        if "RENE" in s or "RENÉ" in Path(path).as_posix().upper():
            return "RENE"
    # walk parents
    for p in path.parents:
        n = p.name.upper()
        if n.startswith("CHRIS"):
            return "CHRIS"
        if n.startswith("PHONE"):
            return "PHONE"
        if n.startswith("RENE"):
            return "RENE"
    return "GUEST"


def safe_stem(name: str) -> str:
    stem = Path(name).stem
    stem = re.sub(r"[^\w\-]+", "_", stem)
    return stem[:80]


def collect_guest_media() -> list[Path]:
    if not STAGE.exists():
        return []
    exts = {".mp4", ".mov", ".m4v", ".MP4", ".MOV", ".M4V"}
    out = []
    for p in STAGE.rglob("*"):
        if not p.is_file() or p.suffix not in exts:
            continue
        if p.stat().st_size < 500_000:  # skip Drive stubs / empty
            continue
        out.append(p)
    return sorted(out, key=lambda p: p.name)


def copy_into_full_takes(src: Path, source: str) -> Path:
    PROXIES.mkdir(parents=True, exist_ok=True)
    dest = PROXIES / f"GUEST_{source}_{safe_stem(src.name)}{src.suffix.lower()}"
    if dest.exists() and dest.stat().st_size == src.stat().st_size:
        return dest
    # Prefer hardlink/copy; on FAT32 copy is fine
    print(f"  copy {src.name} -> {dest.name}", flush=True)
    shutil.copy2(src, dest)
    return dest


def audio_profile_safe(path: Path, duration: float) -> dict:
    code = (
        "import json,sys; from pathlib import Path; "
        f"sys.path.insert(0, r'{HERE.as_posix()}'); "
        "from sessions import audio_profile; "
        "print(json.dumps(audio_profile(Path(sys.argv[1]), float(sys.argv[2]))))"
    )
    # sessions lives in lapa71_youtube — try local stub first
    try:
        sys.path.insert(0, str(HERE.parent / "lapa71_youtube"))
        from sessions import audio_profile, song_similarity  # type: ignore
        return audio_profile(path, duration), song_similarity
    except Exception:
        pass
    return {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}, None


def match_guest_to_spine(guest: dict, spine: list[dict], song_similarity) -> list[dict]:
    """Score guest against chronological Z50 clips for PiP/splitscreen."""
    hits = []
    for main in spine:
        if main["camera"] != "Z50II":
            continue
        score = 0.0
        reasons = []
        # Prefer same lighting era when we can infer guest era from filename time
        # Phone filenames often YYYYMMDD_HHMMSS
        gname = guest["path"].name
        m = re.search(r"(20\d{6})_(\d{6})", gname)
        guest_hour = None
        if m:
            guest_hour = int(m.group(2)[:2])
            # evening/night jam ~18-03
            guest_era = "night" if guest_hour >= 19 or guest_hour < 5 else "early"
            if guest_era == main["era"]:
                score += 0.35
                reasons.append(f"tod_hour_{guest_hour}_{guest_era}")
            elif guest_era != main["era"]:
                score -= 0.5
                reasons.append("tod_mismatch")

        if song_similarity and guest.get("audio") and main.get("audio"):
            sim = song_similarity(guest["audio"], main.get("audio") or {})
            score += 0.35 * sim
            reasons.append(f"audio_sim_{sim:.2f}")
        else:
            score += 0.1
            reasons.append("audio_unknown")

        # Source diversity bonus for PiP (phone/chris/rene vs Z50)
        if guest["source"] in ("PHONE", "CHRIS", "RENE"):
            score += 0.15
            reasons.append("alt_camera")

        # Duration usable for PiP
        if guest["duration"] >= 4:
            score += 0.1

        hits.append({
            "main_dsc": main.get("dsc"),
            "main_artist": main.get("artist"),
            "main_era": main.get("era"),
            "main_path": str(main["path"]),
            "score": round(score, 3),
            "reasons": reasons,
            "use": "pip" if score >= 0.45 else ("reject" if score < 0.2 else "maybe"),
        })
    hits.sort(key=lambda h: -h["score"])
    return hits[:8]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    media = collect_guest_media()
    print(f"guest media found={len(media)} in {STAGE}", flush=True)
    if not media:
        print("no guest media — extract zips first", flush=True)
        return 1

    ingested = []
    for src in media:
        source = source_of(src)
        try:
            dur = probe_dur(src)
        except Exception as e:
            print(f"  skip bad {src.name}: {e}", flush=True)
            continue
        if dur < 2:
            continue
        # Skip files > 3.8GB on FAT32 destination risk
        if src.stat().st_size > 3.8 * 1024**3:
            print(f"  skip oversized FAT32 {src.name}", flush=True)
            continue
        dest = copy_into_full_takes(src, source)
        creation = probe_creation(src)
        ingested.append({
            "source": source,
            "src": str(src),
            "path": dest,
            "name": dest.name,
            "duration": dur,
            "creation_time": creation,
            "camera": "PHONE" if source == "PHONE" else ("BROLL" if source in ("CHRIS", "RENE") else "GUEST"),
            "era": "unknown",
        })

    print("load Z50 spine proxies…", flush=True)
    spine = [r for r in list_proxies(START_DSC) if r["camera"] == "Z50II"]
    print(f"  spine_z50={len(spine)}", flush=True)

    # Audio profiles for guests + sampled spine
    sys.path.insert(0, str(HERE.parent / "lapa71_youtube"))
    try:
        from sessions import audio_profile, song_similarity
    except Exception:
        audio_profile = None
        song_similarity = None

    if audio_profile:
        # Cap for speed — prioritize Chris + longer clips
        guests_for_audio = sorted(ingested, key=lambda g: (-(1 if g["source"] == "CHRIS" else 0), -g["duration"]))[:28]
        for i, g in enumerate(guests_for_audio):
            print(f"  audio guest {i+1}/{len(guests_for_audio)} {g['name']}", flush=True)
            try:
                code = (
                    "import json,sys; from pathlib import Path; "
                    f"sys.path.insert(0, r'{str(HERE.parent / 'lapa71_youtube')}'); "
                    "from sessions import audio_profile; "
                    "print(json.dumps(audio_profile(Path(sys.argv[1]), float(sys.argv[2]))))"
                )
                proc = subprocess.run(
                    [sys.executable, "-c", code, str(g["path"]), str(g["duration"])],
                    capture_output=True, text=True, timeout=90,
                )
                if proc.returncode == 0 and proc.stdout.strip():
                    g["audio"] = json.loads(proc.stdout.strip().splitlines()[-1])
                else:
                    g["audio"] = {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}
            except Exception:
                g["audio"] = {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}

        step = max(1, len(spine) // 20)
        for i, m in enumerate(spine[::step][:20]):
            print(f"  audio spine {i+1} DSC{m['dsc']}", flush=True)
            try:
                code = (
                    "import json,sys; from pathlib import Path; "
                    f"sys.path.insert(0, r'{str(HERE.parent / 'lapa71_youtube')}'); "
                    "from sessions import audio_profile; "
                    "print(json.dumps(audio_profile(Path(sys.argv[1]), float(sys.argv[2]))))"
                )
                proc = subprocess.run(
                    [sys.executable, "-c", code, str(m["path"]), str(m["duration"])],
                    capture_output=True, text=True, timeout=90,
                )
                if proc.returncode == 0 and proc.stdout.strip():
                    m["audio"] = json.loads(proc.stdout.strip().splitlines()[-1])
            except Exception:
                m["audio"] = {"bpm": 0.0, "energy": 0.0, "confidence": 0.0}

    # Face / framing proxy (portrait = likely people/reaction for PiP)
    for g in ingested:
        r = run([
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height", "-of", "csv=p=0", str(g["path"]),
        ])
        portrait = False
        try:
            wh = (r.stdout or "").strip().split(",")
            w, h = int(wh[0]), int(wh[1])
            portrait = h > w
            g["width"], g["height"] = w, h
        except Exception:
            g["width"] = g["height"] = 0
        g["face_proxy"] = "portrait_people" if portrait else "landscape_scene"
        g["pip_role"] = (
            "reaction_close" if portrait
            else ("alt_angle" if g["source"] == "CHRIS" else "spatial_broll")
        )

    # Infer era from filename hour for guests
    for g in ingested:
        m = re.search(r"(20\d{6})_(\d{6})", g["name"])
        if m:
            hour = int(m.group(2)[:2])
            g["era"] = "night" if hour >= 19 or hour < 5 else "early"
            g["hour"] = hour

    matches = []
    for g in ingested:
        hits = match_guest_to_spine(g, spine, song_similarity)
        best = hits[0] if hits else None
        matches.append({
            "guest": g["name"],
            "source": g["source"],
            "duration": g["duration"],
            "era": g.get("era"),
            "hour": g.get("hour"),
            "creation_time": g.get("creation_time"),
            "best": best,
            "candidates": hits,
            "pip_ok": bool(best and best["use"] == "pip"),
        })
        print(
            f"  MATCH {g['source']} {g['name'][:40]} -> "
            f"DSC{best['main_dsc'] if best else '?'} "
            f"artist={best['main_artist'] if best else '?'} "
            f"score={best['score'] if best else 0} "
            f"use={best['use'] if best else 'none'}",
            flush=True,
        )

    report = {
        "stage": str(STAGE),
        "ingested_count": len(ingested),
        "pip_ready": sum(1 for m in matches if m["pip_ok"]),
        "matches": matches,
        "rule": "PiP=INFORMATION; no day/night mix; guest cams for second perspective",
    }
    # JSON-serialize paths
    for m in report["matches"]:
        pass
    serial = json.loads(json.dumps(report, default=str))
    REPORT.write_text(json.dumps(serial, indent=2), encoding="utf-8")
    print("REPORT", REPORT, f"pip_ready={report['pip_ready']}/{report['ingested_count']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
