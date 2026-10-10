#!/usr/bin/env python3
"""
Content Pipeline — EARS (lightweight audio listening).

Uses ffmpeg/ffprobe only (no full decode library required).
Listens to a short sample (default first 45s) to classify:
  speech | music | mixed | silence | no_audio

Also estimates loudness (ebur128) and silence ratio for format routing:
  speech-heavy → Flow Talk / Akademie / Podcast
  music-heavy  → Performance - CircleDStages / Just in Flow with the beat
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any, Optional


def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def run_capture(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=False, capture_output=True, text=True)


def _safe_float(text: Optional[str]) -> Optional[float]:
    """Parse ffmpeg metric tokens; reject '-', '-inf', blank, etc."""
    if text is None:
        return None
    s = str(text).strip().lower()
    if not s or s in {"-", "-inf", "+inf", "inf", "nan", "."}:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def probe_has_audio(path: Path) -> dict[str, Any]:
    if not which("ffprobe"):
        return {"has_audio": False, "error": "ffprobe missing"}
    r = run_capture(
        [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ]
    )
    if r.returncode != 0:
        return {"has_audio": False, "error": (r.stderr or "")[-200:]}
    info = json.loads(r.stdout or "{}")
    streams = info.get("streams") or []
    a = next((s for s in streams if s.get("codec_type") == "audio"), None)
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    dur = float(info.get("format", {}).get("duration") or 0)
    return {
        "has_audio": bool(a),
        "duration": dur,
        "audio_codec": (a or {}).get("codec_name"),
        "sample_rate": int((a or {}).get("sample_rate") or 0),
        "channels": int((a or {}).get("channels") or 0),
        "width": int((v or {}).get("width") or 0),
        "height": int((v or {}).get("height") or 0),
        "has_video": bool(v),
    }


def listen(
    path: Path,
    sample_seconds: float = 45.0,
    start_at: float = 2.0,
) -> dict[str, Any]:
    """
    Listen to a short window — never requires full-file decode to disk.
    ffmpeg reads from source with -t sample_seconds only.
    """
    meta = probe_has_audio(path)
    out: dict[str, Any] = {
        "path": str(path),
        "name": path.name,
        "probe": meta,
        "ears": "offline",
    }
    if not meta.get("has_audio"):
        out["class"] = "no_audio"
        out["format_hint"] = "events"  # visual-only → events / stills lane
        out["confidence"] = 0.9
        return out
    if not which("ffmpeg"):
        out["class"] = "unknown"
        out["error"] = "ffmpeg missing"
        return out

    dur = float(meta.get("duration") or 0)
    ss = 0.0 if dur and dur < start_at + 5 else start_at
    t = min(sample_seconds, max(3.0, dur - ss)) if dur else sample_seconds

    # silencedetect + ebur128 + astats on short sample
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-ss",
        f"{ss:.2f}",
        "-t",
        f"{t:.2f}",
        "-i",
        str(path),
        "-vn",
        "-af",
        "silencedetect=noise=-35dB:d=0.4,ebur128=framelog=verbose,astats=metadata=1:reset=1",
        "-f",
        "null",
        "-",
    ]
    r = run_capture(cmd)
    log = (r.stderr or "") + "\n" + (r.stdout or "")

    silence_starts = [
        v for x in re.findall(r"silence_start:\s*([0-9.]+)", log) if (v := _safe_float(x)) is not None
    ]
    silence_ends = [
        v for x in re.findall(r"silence_end:\s*([0-9.]+)", log) if (v := _safe_float(x)) is not None
    ]
    silence_durs = [
        v
        for x in re.findall(r"silence_duration:\s*([0-9.]+)", log)
        if (v := _safe_float(x)) is not None
    ]
    silent_total = sum(silence_durs) if silence_durs else 0.0
    silence_ratio = min(1.0, silent_total / max(t, 0.1))

    # Integrated loudness (ffmpeg may print "I:   - LUFS" when undefined)
    i_lufs = None
    m = re.search(r"I:\s*([^\s]+)\s*LUFS", log)
    if m:
        i_lufs = _safe_float(m.group(1))

    # RMS / peak from astats (may be "-" for silent / odd streams)
    rms = None
    m = re.search(r"RMS level dB:\s*(\S+)", log)
    if m:
        rms = _safe_float(m.group(1))
    peak = None
    m = re.search(r"Peak level dB:\s*(\S+)", log)
    if m:
        peak = _safe_float(m.group(1))

    # Dynamic range proxy: peak - rms (music often wider; speech mid)
    dyn = None
    if peak is not None and rms is not None:
        dyn = peak - rms

    # Heuristic classification (ears)
    # Silence-heavy → silence
    # Loud + moderate silence → music (stages)
    # Mid loudness + more silence gaps → speech (flowtalk/akademie)
    cls = "mixed"
    conf = 0.55
    format_hint = "events"

    if silence_ratio > 0.85 or (i_lufs is not None and i_lufs < -45):
        cls = "silence"
        conf = 0.85
        format_hint = "events"
    elif i_lufs is not None and i_lufs > -22 and silence_ratio < 0.25:
        cls = "music"
        conf = 0.72
        format_hint = "Performance - CircleDStages"
    elif silence_ratio > 0.35 or (dyn is not None and dyn < 12 and silence_ratio > 0.2):
        cls = "speech"
        conf = 0.68
        format_hint = "Flow Talk"
    elif i_lufs is not None and -28 <= i_lufs <= -18:
        cls = "mixed"
        conf = 0.6
        format_hint = "Just in Flow with the beat"
    else:
        cls = "mixed"
        format_hint = "events"

    # Akademie cue: speech + long duration often teaching
    if cls == "speech" and dur and dur > 180:
        format_hint = "Wisdom to share- Akademie"
        conf = max(conf, 0.7)

    out.update(
        {
            "ears": "ffmpeg_sample",
            "sample_start": ss,
            "sample_seconds": t,
            "silence_ratio": round(silence_ratio, 3),
            "silence_segments": len(silence_starts),
            "integrated_lufs": i_lufs,
            "rms_db": rms,
            "peak_db": peak,
            "dynamic_proxy": round(dyn, 2) if dyn is not None else None,
            "class": cls,
            "format_hint": format_hint,
            "confidence": round(conf, 2),
        }
    )
    return out


def format_bucket_for_artist(ears: dict[str, Any], event_name: Optional[str] = None) -> str:
    """Map ears + optional event name → Arpan-style artist subfolder."""
    hint = ears.get("format_hint") or "events"
    cls = ears.get("class")
    if event_name:
        # Event uploads land under events/<EventName>/ (caller creates leaf)
        if cls in ("no_audio", "silence") or hint == "events":
            return f"events/{event_name}"
    return hint


if __name__ == "__main__":
    import sys
    import traceback

    p = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not p or not p.exists():
        print("Usage: python ears.py <mediafile>")
        raise SystemExit(2)
    try:
        print(json.dumps(listen(p), indent=2))
    except Exception as e:  # noqa: BLE001
        print(
            json.dumps(
                {
                    "path": str(p),
                    "name": p.name,
                    "class": "unknown",
                    "error": f"{type(e).__name__}: {e}",
                    "ears": "error",
                },
                indent=2,
            )
        )
        traceback.print_exc()
        raise SystemExit(1)
