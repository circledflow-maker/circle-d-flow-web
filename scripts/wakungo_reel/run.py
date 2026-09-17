#!/usr/bin/env python3
"""Run agents 01→12. Writes D:\\Wakungo_Content_Studio\\_wakungo_reel\\project.json

Pipeline:
  01 ingest → 02 vision → 03 quality → 04 director → 05 composition → 06 edit
  → 07 audio → 07b beat map → 08 subtitle/typography → 09 timeline
  → 10 color → 11 qc → 12 revision → 11 qc
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import a01_ingest
import a02_vision
import a03_quality
import a04_director
import a05_composition
import a06_edit
import a07_audio
import a07b_beat_map
import a08_subtitle_typography
import a08_timeline
import a09_color
import a10_qc
import a11_revision
import a07_audio_director
from contract import HUMAN_REVIEW, OUT, PROJECT_PATH, empty_project


def save(project: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PROJECT_PATH.write_text(json.dumps(project, indent=2), encoding="utf-8")
    hr = project.get("human_review")
    if hr:
        HUMAN_REVIEW.write_text(json.dumps(hr, indent=2), encoding="utf-8")


def main() -> int:
    print("Wako Kungo reel — ingest studio…", flush=True)
    project = empty_project()
    project = a01_ingest.run(project)
    save(project)
    print(f"  assets={len(project['assets'])} people={len(project['people'])} locations={len(project['locations'])}", flush=True)

    project = a02_vision.run(project)
    print("  vision attached", flush=True)
    project = a03_quality.run(project, limit=60)
    print("  quality scored", flush=True)
    project = a04_director.run(project)
    project = a05_composition.run(project)
    project = a06_edit.run(project)
    project = a07_audio.run(project)
    project = a07b_beat_map.run(project)
    print("  beat map", flush=True)
    project = a08_subtitle_typography.run(project)
    print("  typography (draft dramaturgy)", flush=True)
    project = a08_timeline.run(project)
    project = a09_color.run(project)
    project = a10_qc.run(project)
    project = a11_revision.run(project)
    # Final audio director: inventory → VO → music phases → mix → VO-timed subtitles
    print("  audio director (VO + mix)…", flush=True)
    project = a07_audio_director.run(project)
    a08_subtitle_typography.stamp_timeline_text(project)
    project = a10_qc.run(project)
    save(project)

    report = project.get("quality_report") or {}
    print(json.dumps({
        "status": report.get("status"),
        "overall": report.get("overall_score"),
        "warnings": report.get("warnings"),
        "critical": report.get("critical_errors"),
        "out": str(PROJECT_PATH),
        "typography": bool(project.get("typography")),
        "beats": len((project.get("beat_map") or {}).get("beats") or []),
        "picks": {k: len(v) for k, v in ((project.get("director_plan") or {}).get("chapters") or {}).items()},
    }, indent=2), flush=True)
    return 0 if report.get("status") != "FAIL" else 1


if __name__ == "__main__":
    raise SystemExit(main())
