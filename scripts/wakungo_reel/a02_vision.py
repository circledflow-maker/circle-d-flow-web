"""AGENT 02 — Attach people/face metadata from existing Lapa71 sorts (no invented IDs)."""
from __future__ import annotations

import json
from pathlib import Path

from contract import STUDIO


def load_timelines() -> dict[str, list]:
    logs = STUDIO / "Lapa71" / "00_logs"
    out = {}
    if not logs.exists():
        return out
    for p in logs.glob("timeline_*.json"):
        try:
            out[p.stem.replace("timeline_", "")] = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
    return out


def run(project: dict) -> dict:
    timelines = load_timelines()
    shots = []
    for asset in project.get("assets") or []:
        if asset.get("type") != "video":
            continue
        stem = Path(asset["filename"]).stem.replace("_proxy_1080p", "").replace("_full_proxy", "")
        # DSC_1507_set01_Maryna_Vadini_Stages_1080p → clip stem
        shot = {
            "shot_id": "shot_" + asset["asset_id"].replace("asset_", ""),
            "asset_id": asset["asset_id"],
            "person_ids": list(asset.get("person_ids") or []),
            "location_id": asset.get("location_id"),
            "chapter_hint": asset.get("chapter_hint"),
            "scene_type": asset.get("scene_type"),
            "duration": asset.get("duration") or 0,
            "faces": [],
            "people": {
                "primary": (asset.get("person_ids") or [None])[0],
                "secondary": (asset.get("person_ids") or [])[1:],
                "interaction_score": 0.5 if asset.get("person_ids") else 0.0,
            },
            "gaze_direction": "ambiguous",
            "source_timeline": None,
        }
        key = stem.split("_set")[0]
        if key in timelines:
            labels = [lab for _, lab in timelines[key] if lab not in ("Unknown", "Event_Broll")]
            shot["source_timeline"] = key
            if labels:
                from collections import Counter
                top = Counter(labels).most_common(3)
                shot["people"]["primary"] = "person_" + top[0][0].lower()
                shot["people"]["secondary"] = ["person_" + t[0].lower() for t, _ in top[1:]]
                shot["people"]["interaction_score"] = 0.7 if len(top) > 1 else 0.4
        shots.append(shot)
    project["shots"] = shots
    project["agent_log"].append({"agent": "02_vision", "shots": len(shots), "timelines_used": len(timelines)})
    return project
