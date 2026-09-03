#!/usr/bin/env python3
"""DSC_0322 cut plan: DeepFace when available; silence-snap fallback near user hints."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

OUT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\003")
LOGS = OUT / "00_logs"
MASTER = Path(r"F:\DCIM\106NZ502\DSC_0322.MOV")

# Soft hints only — DeepFace owns transitions. Baseck closes 0322.
# Soft hints — Baseck + Edoardo + Joao jam together at the end (one Finale package)
HINTS = [
    ("Nicke_Klein", 0, 900),
    ("July_Tilie", 900, 1440),
    ("Mistah_Isaac", 1440, 1800),
    ("C-Riz", 1800, 1980),
    ("Finale_Baseck", 1980, 2694),
]

SNAP_WINDOW = 90.0  # seconds to search for silence near hint boundary


def log(msg: str) -> None:
    print(msg, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "cut_plan_0322.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        text=True,
    ).strip()
    return float(out)


def try_deepface_segments(duration: float) -> list[dict] | None:
    try:
        import destiny_0324_face_assign as fa  # noqa: WPS433
        import destiny_0322_face_assign as cfg  # noqa: WPS433
    except Exception as e:
        log(f"DeepFace path unavailable: {e}")
        return None
    try:
        fa.OUT_ROOT = OUT
        fa.MASTER = MASTER
        fa.SOURCE = MASTER
        fa.REFS = OUT / "00_artist_refs"
        fa.FACE_DB = OUT / "00_artist_refs" / "face_db"
        fa.FRAMES = OUT / "00_logs" / "face_frames_0322"
        fa.LOGS = LOGS
        fa.SAMPLE_EVERY = 15.0
        fa.MIN_SET = 45.0
        fa.REF_MAP["14_Manu_Allegro"] = "Manu_Allegro"
        fa.META["Manu_Allegro"] = "@manuallegro"
        fa.ensure_dirs()
        ready = fa.build_face_db()
        if len(ready) < 3:
            return None
        frames = fa.extract_sample_frames(duration)
        timeline = fa.build_timeline(frames)
        segments = fa.timeline_to_segments(timeline, duration)
        return cfg.nudge_segments(segments, duration)
    except Exception as e:
        log(f"DeepFace run failed: {e}")
        return None


def silence_ends_window(path: Path, center: float, window: float = 120.0) -> list[float]:
    """Silence detect only around a hint boundary (fast on SD)."""
    ss = max(0.0, center - window)
    raw = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-ss", f"{ss:.3f}", "-t", str(window * 2),
            "-i", str(path), "-af", "silencedetect=noise=-38dB:d=2.5", "-f", "null", "-",
        ],
        capture_output=True, text=True,
    )
    ends: list[float] = []
    for line in (raw.stderr or "").splitlines():
        m = re.search(r"silence_end:\s*([0-9.]+)", line)
        if m:
            ends.append(ss + float(m.group(1)))
    return ends


def snap(target: float, silences: list[float], lo: float, hi: float) -> float:
    cands = [t for t in silences if lo <= t <= hi and abs(t - target) <= SNAP_WINDOW]
    if not cands:
        return target
    return min(cands, key=lambda t: abs(t - target))


def build_from_hints(duration: float, silences: list[float]) -> list[dict]:
    boundaries = [h[2] for h in HINTS[:-1]]
    snapped = [snap(b, silences, b - SNAP_WINDOW, b + SNAP_WINDOW) for b in boundaries]
    log(f"silence snap boundaries: {[round(x, 1) for x in snapped]}")

    segs: list[dict] = []
    for i, (artist, _hint_start, _hint_end) in enumerate(HINTS):
        start = 0.0 if i == 0 else snapped[i - 1]
        end = duration if i == len(HINTS) - 1 else snapped[i]
        segs.append({
            "artist": artist,
            "start": round(start, 2),
            "end": round(end, 2),
            "dur": round(end - start, 2),
            "source": "hint+silence",
        })
    return segs


def main() -> int:
    LOGS.mkdir(parents=True, exist_ok=True)
    if not MASTER.exists():
        log(f"ERROR missing {MASTER}")
        return 2
    duration = probe_duration(MASTER)
    log(f"DSC_0322 dur={duration:.1f}s")

    segments = try_deepface_segments(duration)
    method = "deepface"
    if not segments:
        log("fallback: hint boundaries + windowed silence snap")
        boundaries = [h[2] for h in HINTS[:-1]]
        silences: list[float] = []
        for b in boundaries:
            silences.extend(silence_ends_window(MASTER, b, 120.0))
        silences = sorted(set(silences))
        log(f"windowed silence hits: {len(silences)}")
        segments = build_from_hints(duration, silences)
        method = "hint+silence"

    out = LOGS / "face_segments_0322.json"
    out.write_text(json.dumps(segments, indent=2), encoding="utf-8")
    (LOGS / "DSC0322_FACE_COMPLETE.flag").write_text(f"method={method}\n", encoding="utf-8")
    for s in segments:
        log(f"  {s['artist']}: {s['start']:.0f}-{s['end']:.0f}s ({s['dur']:.0f}s) [{s.get('source', method)}]")
    log(f"DONE method={method} segments={len(segments)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
