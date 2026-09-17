#!/usr/bin/env python3
"""Wako Kungo × Circle.D.Flow — 30s vertical reel pipeline contract.

Core philosophy (short form for the Reel):
  CONNECTION → AWARENESS → MOVEMENT

Long form (not spoken as NGO copy):
  We create spaces where people can come together, learn from each other,
  teach each other, express themselves, and grow together.

Never invent people, events, or footage.
"""
from __future__ import annotations

from pathlib import Path

STUDIO = Path(r"D:\Wakungo_Content_Studio")
OUT = STUDIO / "_wakungo_reel"
PROJECT_PATH = OUT / "project.json"
HUMAN_REVIEW = OUT / "human_review.json"

# Reel source allowlist — only these trees (plus explicit hero assets)
REEL_SOURCE_ROOTS = [
    STUDIO / "Lapa71",
    STUDIO / "Destination Hostel" / "Oneness captured Rayan",
]
REEL_HERO_ASSETS = [
    STUDIO / "Lapa71" / "04_videos_compressed" / "Full_Takes" / "lapa71 Moodboard by Arif.mp4",
]

PROJECT_ID = "wk_circle_d_flow_reel_30s"
TITLE = "Wako Kungo × Circle.D.Flow"

CORE_VALUES = [
    {"id": "PURPOSE", "question": "Why are we creating?"},
    {"id": "UNITY", "line": "We are stronger together.", "hero": "NOBODY CREATES ALONE."},
    {"id": "LEARN_TEACH", "line": "Everyone has something to give and something to learn."},
    {"id": "EXPRESSION", "line": "Create without needing to fit a predefined box."},
    {"id": "SUPPORTED_SPACE", "line": "A space where you can express, explore, and become.", "show_dont_tell": True},
]

NARRATIVE_ARC = ["CONNECTION", "AWARENESS", "MOVEMENT"]

VO_SCRIPT = (
    "Maybe culture isn't meant to be watched. "
    "Maybe it's meant to be experienced. To share. To listen. To connect. "
    "To learn from each other. And to teach each other. "
    "Because nobody creates alone. We grow when we move together. "
    "A space where you can express, explore, and become. "
    "This is Wako Kungo × Circle.D.Flow. "
    "Come as you are. Add what you have. And let's create what's next."
)

# Visual chapters follow the spoken emotional arc (not a promo countdown)
CHAPTERS = [
    {"id": "ATTENTION", "start": 0.0, "end": 5.0, "pacing": "HOOK", "intent": "Culture isn't meant to be watched.", "value": "PURPOSE"},
    {"id": "CONNECTION", "start": 5.0, "end": 10.0, "pacing": "OPEN", "intent": "Experience. Share. Listen. Connect.", "value": "EXPRESSION"},
    {"id": "LEARNING", "start": 10.0, "end": 16.0, "pacing": "HUMAN", "intent": "Learn from each other. Teach each other.", "value": "LEARN_TEACH"},
    {"id": "UNITY", "start": 16.0, "end": 21.0, "pacing": "PEAK", "intent": "Nobody creates alone. We grow when we move together.", "value": "UNITY"},
    {"id": "SUPPORTED", "start": 21.0, "end": 26.0, "pacing": "SOFT", "intent": "Show supported space as feeling — express, explore, become.", "value": "SUPPORTED_SPACE"},
    {"id": "INVITATION", "start": 26.0, "end": 30.0, "pacing": "INVITE", "intent": "Brand + come as you are. Not a hard sell.", "value": "PURPOSE"},
]

# Folder → narrative chapter (known studio layout only)
FOLDER_CHAPTER = {
    "destiny": "ATTENTION",
    "destination hostel": "ATTENTION",
    "oneness captured rayan": "CONNECTION",
    "sofar lisbon content": "CONNECTION",
    "lapa71": "LEARNING",
    "04_artists": "UNITY",
    "04_videos_compressed": "ATTENTION",
    "full_takes": "ATTENTION",
    "filler": "UNITY",
    "how it starts- voice over and doku material": "SUPPORTED",
    "_drive_move_art_gallery": "SUPPORTED",
    "move art gallery": "SUPPORTED",
    "move_art_gallery": "SUPPORTED",
}

SKIP_DIR_NAMES = {
    "00_logs", "00_artist_refs", "00_event", "face_frames", "__pycache__",
    "_wakungo_reel", "00_work",
}

empty_project = lambda: {
    "project": {
        "project_id": PROJECT_ID,
        "title": TITLE,
        "format": "reel",
        "duration_seconds": 30,
        "aspect_ratio": "9:16",
        "resolution": {"width": 1080, "height": 1920},
        "fps": 30,
        "language": "en",
        "creative_arc": NARRATIVE_ARC,
        "core_values": CORE_VALUES,
        "philosophy": (
            "We create spaces where people can come together, learn from each other, "
            "teach each other, express themselves, and grow together."
        ),
        "question": "There is a way of being together that we believe in. Do you?",
        "studio_root": str(STUDIO),
        "chapters": CHAPTERS,
        "vo_script": VO_SCRIPT,
    },
    "assets": [],
    "people": [],
    "locations": [],
    "shots": [],
    "audio": [],
    "typography": {},
    "timeline": [],
    "quality_report": {},
    "revision_history": [],
    "agent_log": [],
}
