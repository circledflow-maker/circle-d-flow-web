"""AGENT 10 — Color / finishing instructions (no beauty filter, location atmosphere kept)."""
from __future__ import annotations


def run(project: dict) -> dict:
    project["finishing"] = {
        "normalize": {"exposure": True, "white_balance": True, "contrast": "mild", "skin": "preserve_texture"},
        "beauty_filter": False,
        "location_match": "unify without erasing venue atmosphere",
        "future_chapter": {"cinematic_extra": "slight", "must_still_match_project": True},
        "ffmpeg_filter": (
            "eq=contrast=1.06:brightness=0.02:saturation=0.96:gamma=1.04,"
            "hqdn3d=1.4:1.1:2.4:2.0"
        ),
        "audio_loudnorm": "I=-14:TP=-1.5:LRA=9",
    }
    project["agent_log"].append({"agent": "10_color"})
    return project
