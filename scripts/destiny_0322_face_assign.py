#!/usr/bin/env python3
"""DSC_0322: DeepFace artist segments for face-guided Stages cuts (batch 003)."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Reuse battle-tested 0324 logic
sys.path.insert(0, str(Path(__file__).resolve().parent))
import destiny_0324_face_assign as fa  # noqa: E402

OUT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\003")
MASTER = Path(r"F:\DCIM\106NZ502\DSC_0322.MOV")

# Override module paths
fa.OUT_ROOT = OUT
fa.MASTER = MASTER
fa.SOURCE = MASTER
fa.REFS = OUT / "00_artist_refs"
fa.FACE_DB = OUT / "00_artist_refs" / "face_db"
fa.FRAMES = OUT / "00_logs" / "face_frames_0322"
fa.LOGS = OUT / "00_logs"
fa.SAMPLE_EVERY = 15.0
fa.MIN_SET = 45.0

# Add Manu Allegro (@manuallegro)
fa.REF_MAP["14_Manu_Allegro"] = "Manu_Allegro"
fa.META["Manu_Allegro"] = "@manuallegro"
fa.BAND = {"Nicke_Klein", "Edoardo_Statuto", "Mistah_Isaac", "Joao_Redondo", "Arpanito"}

# User soft-cut hints (seconds) — used to nudge segment edges after face timeline
# Soft hints — after C-Riz: Baseck + Edoardo + Joao jam together (one package)
HINTS = [
    ("Nicke_Klein", 0, 900),
    ("July_Tilie", 900, 1440),
    ("Mistah_Isaac", 1440, 1800),
    ("C-Riz", 1800, 1980),
    ("Finale_Baseck", 1980, 2694),
]
FINALE_SLUGS = {"Edoardo_Statuto", "Joao_Redondo", "Basseck_Mankabu", "Wako_Kungo", "Finale_Baseck"}
FINALE_START = 1980.0


def nudge_segments(segments: list[dict], duration: float) -> list[dict]:
    """Snap face segments toward user hint windows; merge end-of-set trio into one Finale."""
    if not segments:
        return segments
    hint_map = {a: (s, e) for a, s, e in HINTS}
    out = []
    for seg in segments:
        artist = seg["artist"]
        a, b = float(seg["start"]), float(seg["end"])
        if artist in hint_map:
            hs, he = hint_map[artist]
            oa, ob = max(a, hs), min(b, he)
            if ob - oa > 60:
                a = max(a, hs - 30)
                b = min(b, he + 30)
        # Map late-set band/Baseck hits into shared Finale package
        if artist in FINALE_SLUGS and a >= (FINALE_START - 60):
            artist = "Finale_Baseck"
        out.append({"artist": artist, "start": round(a, 2), "end": round(b, 2), "dur": round(b - a, 2)})

    cleaned = []
    for s in out:
        if s["artist"] == "Wako_Kungo" and s["dur"] < 90 and cleaned:
            prev = cleaned[-1]
            prev["end"] = s["end"]
            prev["dur"] = round(prev["end"] - prev["start"], 2)
        elif cleaned and cleaned[-1]["artist"] == s["artist"]:
            cleaned[-1]["end"] = s["end"]
            cleaned[-1]["dur"] = round(cleaned[-1]["end"] - cleaned[-1]["start"], 2)
        else:
            cleaned.append(s)

    # Force one Finale from first Finale_Baseck / late band hit through end
    finale_i = next((i for i, s in enumerate(cleaned) if s["artist"] == "Finale_Baseck"), None)
    if finale_i is None:
        # if face ID never tagged them, still add Finale from hint if duration allows
        if duration > FINALE_START + 60:
            cleaned.append({
                "artist": "Finale_Baseck",
                "start": FINALE_START,
                "end": round(duration, 2),
                "dur": round(duration - FINALE_START, 2),
            })
    else:
        start = min(cleaned[finale_i]["start"], FINALE_START)
        cleaned = cleaned[:finale_i]
        cleaned.append({
            "artist": "Finale_Baseck",
            "start": round(start, 2),
            "end": round(duration, 2),
            "dur": round(duration - start, 2),
        })
    return cleaned


def main() -> int:
    fa.ensure_dirs()
    log = fa.log
    log("=== DSC_0322 face-assign start (batch 003) ===")
    if not MASTER.exists():
        log(f"ERROR missing {MASTER}")
        return 2
    duration = fa.probe_duration(MASTER)
    log(f"source={MASTER} dur={duration:.1f}s (~{duration/60:.1f}min)")

    log("1) Build face DB (incl. Manu @manuallegro)...")
    ready = fa.build_face_db()
    log(f"   artists with faces: {ready}")
    if "Manu_Allegro" not in ready:
        log("WARN: Manu_Allegro face ref missing — check 14_Manu_Allegro.png")
    if len(ready) < 3:
        log("ERROR: too few reference faces")
        return 3

    log("2) Sample frames...")
    frames = fa.extract_sample_frames(duration)

    log("3) Identify faces...")
    timeline = fa.build_timeline(frames)
    (fa.LOGS / "face_timeline_0322.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")

    log("4) Build segments...")
    segments = fa.timeline_to_segments(timeline, duration)
    segments = nudge_segments(segments, duration)
    (fa.LOGS / "face_segments_0322.json").write_text(json.dumps(segments, indent=2), encoding="utf-8")
    for s in segments:
        log(f"   SEG {s['artist']}: {s['start']:.0f}-{s['end']:.0f}s ({s['dur']:.0f}s)")

    (fa.LOGS / "DSC0322_FACE_COMPLETE.flag").write_text("ok\n", encoding="utf-8")
    log(f"DONE segments={len(segments)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
