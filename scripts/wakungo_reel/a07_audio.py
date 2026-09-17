"""AGENT 07 — Audio plan stub; full mix via a07_audio_director after timeline exists."""
from __future__ import annotations

from contract import VO_SCRIPT


def run(project: dict) -> dict:
    audio_assets = [a for a in project.get("assets") or [] if a.get("type") == "audio"]
    vo_files = [a for a in audio_assets if "vo" in a["filename"].lower() or "voice" in a["filename"].lower()]
    music = [a for a in audio_assets if a not in vo_files]
    project["audio"] = [
        {
            "audio_id": "aud_nat_stages",
            "role": "natural",
            "priority": 2,
            "note": "Keep Stages/crowd/instrument hits as punctuation under VO.",
        },
        {
            "audio_id": "aud_vo",
            "role": "voiceover",
            "priority": 1,
            "script": VO_SCRIPT,
            "source_asset_id": vo_files[0]["asset_id"] if vo_files else None,
            "use_original_if_stronger": True,
            "style": "documentary",
            "no_spoken_link_in_bio": True,
        },
        {
            "audio_id": "aud_music",
            "role": "music",
            "priority": 3,
            "source_asset_id": music[0]["asset_id"] if music else None,
            "duck_under_speech": True,
            "loudness_lufs": -14,
            "identity": "afro_broken_beat_live_stages",
        },
    ]
    project["agent_log"].append({
        "agent": "07_audio",
        "vo_files": len(vo_files),
        "music_files": len(music),
        "vo_attached": bool(vo_files),
        "next": "a07_audio_director after timeline",
    })
    return project
