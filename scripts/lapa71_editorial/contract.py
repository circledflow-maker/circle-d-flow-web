#!/usr/bin/env python3
"""Editorial Reel Engine — Wako Kungo × Circle.D.Flow / Lapa71.

PLACE → EVENT → PERFORMANCE → PEOPLE → CONNECTION → ENERGY → PHILOSOPHY

Rules:
  - Time-of-day is story: never jump night → day
  - Z50II = MAINROLL; D850/phone = PiP only when informational
  - PiP = INFORMATION, not decoration
  - Philosophy proves itself in faces — max 3 big statements
"""
from __future__ import annotations

from pathlib import Path

STUDIO = Path(r"D:\Wakungo_Content_Studio")
LAPA = STUDIO / "Lapa71"
PROXIES = LAPA / "04_videos_compressed" / "Full_Takes"
ARTISTS = LAPA / "04_Artists"
# Unified library (Artist / Location / Stages…)
ARTISTS_LIBRARY = STUDIO / "_Artists_Library"
ARTISTS_LAPA71 = ARTISTS_LIBRARY  # resolve via <Artist>/Lapa71/Stages
INTRO = LAPA / "00_event" / "intro_cards"
OUT = LAPA / "05_Format_Drafts" / "Editorial"
WORK = LAPA / "00_work" / "editorial"
REEL_OUT = STUDIO / "_wakungo_reel"

START_DSC = 918  # begin Full_Takes spine here
LIGHTING_EARLY_MAX = 999
LIGHTING_NIGHT_MIN = 1400

BRAND = "WAKO KUNGO × CIRCLE.D.FLOW"
EVENT_LINE = "LIVE IN LAPA71"
PLACE_LINE = "LAPA 71"
PLACE_SUB = "Lisbon"

# 30s cinematic festival aftermovie dramaturgy
REEL_BEATS = [
    {"id": "ARRIVAL", "start": 0.0, "end": 3.0, "layout": "fullscreen", "text": ("LAPA 71", "Lisbon")},
    {"id": "TITLE", "start": 3.0, "end": 5.0, "layout": "overlay", "text": ("WAKO KUNGO", "LIVE IN LAPA71")},
    {"id": "PERFORMANCE", "start": 5.0, "end": 10.0, "layout": "float_pip+center_pip", "text": None},
    {"id": "MULTICAM", "start": 10.0, "end": 13.0, "layout": "v_split+h_split", "text": None},
    {"id": "BREAK_1", "start": 13.0, "end": 14.0, "layout": "text", "text": ("EXPERIENCE.",)},
    {"id": "PEOPLE", "start": 14.0, "end": 19.0, "layout": "rotate", "text": None},
    {"id": "BREAK_2", "start": 19.0, "end": 20.0, "layout": "text", "text": ("NOBODY CREATES ALONE.",)},
    {"id": "PEAK", "start": 20.0, "end": 25.0, "layout": "peak_rotate", "text": None},
    {"id": "BREATH", "start": 25.0, "end": 27.0, "layout": "fullscreen", "text": None},
    {"id": "PAYOFF", "start": 27.0, "end": 29.0, "layout": "overlay", "text": ("COME AS YOU ARE.",)},
    {"id": "BRAND", "start": 29.0, "end": 30.0, "layout": "overlay", "text": (BRAND,)},
]

STATEMENT_EXPERIENCE = "EXPERIENCE."
STATEMENT_NOBODY = "NOBODY CREATES ALONE."
STATEMENT_COME = "COME AS YOU ARE."
STATEMENT_BRING = "BRING WHAT YOU HAVE."
STATEMENT_SPACE = "A SPACE TO CREATE."
STATEMENT_SUPPORTIVE = "SUPPORTIVE SPACE"

STYLE = "cinematic_festival"

YOUTUBE_TARGET_MIN = 18.0
YOUTUBE_TARGET_MAX = 28.0

MOODBOARD = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes\lapa71 Moodboard by Arif.mp4")
MOODBOARD_SAFE_END = 27.40  # CapCut outro starts after this


PIP_RULES = (
    "second_perspective",
    "second_person",
    "crowd_reaction",
    "performer_detail",
    "movement",
    "spatial_extension",
    "parallel_musical_action",
)
