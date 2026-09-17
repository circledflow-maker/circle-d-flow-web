#!/usr/bin/env python3
"""Lapa71 YouTube multi-cam contract — CONNECTION OVER PERFECTION.

Z50II = MAINROLL spine (chronology, performance, audio).
D850 / phone = B-roll only after mainroll exists, and only when
ARTIST + TIME + (SONG/SESSION) correlation is strong enough.
When uncertain: KEEP THE Z50II MAINROLL.
"""
from __future__ import annotations

from pathlib import Path

STUDIO = Path(r"D:\Wakungo_Content_Studio")
LAPA = STUDIO / "Lapa71"
PROXIES = LAPA / "04_videos_compressed" / "Full_Takes"
ARTISTS = LAPA / "04_Artists"
INTRO = LAPA / "00_event" / "intro_cards"
REGISTRY = LAPA / "00_event" / "artists_registry.json"
OUT = LAPA / "05_Format_Drafts" / "YouTube"
WORK = LAPA / "00_work" / "youtube_multicam"
CATALOG = OUT / "media_catalog.json"
PROJECT = OUT / "youtube_project.json"
FINAL = OUT / "Lapa71_TagusDropRhythm_YouTube_16x9.mp4"

W, H = 1920, 1080
FPS = 25
TARGET_MIN = 11.0
TARGET_MAX = 14.0

# Score weights for B-roll (must beat KEEP_MAINROLL_THRESHOLD)
WEIGHTS = {
    "artist": 0.25,
    "song": 0.20,
    "time": 0.15,
    "performance": 0.15,
    "emotion": 0.10,
    "angle": 0.05,
    "movement": 0.05,
    "quality": 0.05,
}
KEEP_MAINROLL_THRESHOLD = 0.62
MIN_CONFIDENCE_TO_INSERT = 0.70

# Lighting eras — NEVER mix day/early with late night in one continuous cut.
# DSC ~900s = early/day-adjacent; DSC >= 1400 = night performance.
LIGHTING_NIGHT_DSC_MIN = 1400
LIGHTING_EARLY_DSC_MAX = 999
# YouTube main cut stays in one lighting world (night = core Tagus Drop Rhythm).
YOUTUBE_LIGHTING_ERA = "night"  # "night" | "early"

CAMERA_ROLES = {
    "Z50II": "MAINROLL",
    "D850": "BROLL",
    "IPHONE": "BROLL",
    "PHONE": "BROLL",
    "UNKNOWN": "BROLL",
}

STORY_BEATS = [
    {"id": "HOOK", "intent": "Immediate human energy"},
    {"id": "EXPERIENCE", "intent": "Performance + music"},
    {"id": "CONNECTION", "intent": "Faces + interaction"},
    {"id": "EXCHANGE", "intent": "Learn / teach"},
    {"id": "UNITY", "intent": "Multiple people / supportive space"},
    {"id": "INVITATION", "intent": "Come as you are / bring what you have"},
]

EVENT_TITLE = "Tagus Drop Rhythm"
EVENT_SUB = "Lapa71 · Lisboa"
BRAND = "WAKO KUNGO × CIRCLE.D.FLOW"
SERIES = "Circle D Stages"
