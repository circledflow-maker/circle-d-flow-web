#!/usr/bin/env python3
"""Refresh emotional arc on existing project.json — no full re-ingest.

Re-runs: director → composition → edit → timeline → audio director → QC
Then assemble separately.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import a04_director
import a05_composition
import a06_edit
import a07_audio
import a07b_beat_map
import a07_audio_director
import a08_subtitle_typography
import a08_timeline
import a09_color
import a10_qc
import a11_revision
from contract import CHAPTERS, CORE_VALUES, NARRATIVE_ARC, PROJECT_PATH, TITLE, VO_SCRIPT, empty_project


def main() -> int:
    if not PROJECT_PATH.exists():
        print("missing project.json — run run.py first")
        return 2
    project = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    # Refresh project meta without wiping assets
    meta = project.setdefault("project", {})
    meta["title"] = TITLE
    meta["vo_script"] = VO_SCRIPT
    meta["chapters"] = CHAPTERS
    meta["creative_arc"] = NARRATIVE_ARC
    meta["core_values"] = CORE_VALUES
    meta["philosophy"] = (
        "We create spaces where people can come together, learn from each other, "
        "teach each other, express themselves, and grow together."
    )
    meta["question"] = "There is a way of being together that we believe in. Do you?"

    print("director…", flush=True)
    project = a04_director.run(project)
    project = a05_composition.run(project)
    project = a06_edit.run(project)
    project = a07_audio.run(project)
    project = a07b_beat_map.run(project)
    project = a08_subtitle_typography.run(project)
    project = a08_timeline.run(project)
    project = a09_color.run(project)
    project = a10_qc.run(project)
    project = a11_revision.run(project)
    # Rebuild timeline if revision filled chapters
    project = a08_timeline.run(project)
    print("audio director…", flush=True)
    project = a07_audio_director.run(project)
    a08_subtitle_typography.stamp_timeline_text(project)
    project = a10_qc.run(project)
    PROJECT_PATH.write_text(json.dumps(project, indent=2), encoding="utf-8")
    report = project.get("quality_report") or {}
    print(json.dumps({
        "status": report.get("status"),
        "overall": report.get("overall_score"),
        "warnings": report.get("warnings"),
        "critical": report.get("critical_errors"),
        "picks": {k: len(v) for k, v in ((project.get("director_plan") or {}).get("chapters") or {}).items()},
        "peak": ((project.get("director_plan") or {}).get("peak_line")),
        "vo": ((project.get("audio_direction") or {}).get("voiceover") or {}).get("voice_id"),
    }, indent=2), flush=True)
    return 0 if report.get("status") != "FAIL" else 1


if __name__ == "__main__":
    raise SystemExit(main())
