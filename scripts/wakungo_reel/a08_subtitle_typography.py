#!/usr/bin/env python3
"""AGENT 08 — Subtitle & Typography (dramaturgy fallback).

Final VO-timed subtitles come from a07_audio_director.
This agent provides draft hierarchy + core-value awareness before VO exists.
"""
from __future__ import annotations

import json
from pathlib import Path

from contract import CORE_VALUES, OUT, VO_SCRIPT

SUBTITLE_CUES = [
    {"subtitle_id": "sub_01", "start": 0.00, "end": 4.80, "text": "MAYBE CULTURE ISN'T\nMEANT TO BE WATCHED.", "importance": 0.95},
    {"subtitle_id": "sub_02", "start": 5.10, "end": 7.40, "text": "MAYBE IT'S MEANT\nTO BE EXPERIENCED.", "importance": 0.9},
    {"subtitle_id": "sub_03", "start": 7.40, "end": 9.80, "text": "TO SHARE. TO LISTEN.\nTO CONNECT.", "importance": 0.9},
    {"subtitle_id": "sub_04", "start": 10.10, "end": 12.80, "text": "TO LEARN FROM\nEACH OTHER.", "importance": 0.9},
    {"subtitle_id": "sub_05", "start": 12.90, "end": 15.70, "text": "AND TO TEACH\nEACH OTHER.", "importance": 0.9},
    {"subtitle_id": "sub_06", "start": 16.10, "end": 18.40, "text": "BECAUSE NOBODY\nCREATES ALONE.", "importance": 1.0},
    {"subtitle_id": "sub_07", "start": 18.50, "end": 20.80, "text": "WE GROW WHEN WE\nMOVE TOGETHER.", "importance": 0.95},
    {"subtitle_id": "sub_08", "start": 21.10, "end": 25.70, "text": "A SPACE WHERE YOU CAN\nEXPRESS, EXPLORE, AND BECOME.", "importance": 0.9},
    {"subtitle_id": "sub_09", "start": 26.10, "end": 27.80, "text": "THIS IS WAKO KUNGO\n× CIRCLE.D.FLOW.", "importance": 0.95},
    {"subtitle_id": "sub_10", "start": 27.90, "end": 30.00, "text": "COME AS YOU ARE.\nADD WHAT YOU HAVE.", "importance": 0.9},
]

EDITORIAL = [
    {"text_id": "ed_learn", "start": 10.2, "end": 12.6, "text": "WE LEARN FROM EACH OTHER", "level": 2},
    {"text_id": "ed_teach", "start": 13.0, "end": 15.5, "text": "WE TEACH EACH OTHER", "level": 2},
    {"text_id": "ed_grow", "start": 18.6, "end": 20.7, "text": "WE GROW TOGETHER", "level": 2},
]

HERO = [
    {"text_id": "hero_alone", "start": 16.15, "end": 18.30, "text": "NOBODY CREATES ALONE.", "level": 3},
    {"text_id": "hero_brand", "start": 26.15, "end": 28.20, "text": "WAKO KUNGO × CIRCLE.D.FLOW", "level": 3},
]

CTA = [
    {"text_id": "cta_come", "start": 28.3, "end": 30.0, "text": "COME AS YOU ARE", "level": 4},
]


def _density_ok(layers: list[dict], t: float) -> bool:
    active_sub = sum(1 for x in layers if x.get("level") == 1 and x["start"] <= t < x["end"])
    active_l2 = any(x.get("level") == 2 and x["start"] <= t < x["end"] for x in layers)
    active_l3 = any(x.get("level") == 3 and x["start"] <= t < x["end"] for x in layers)
    active_l4 = any(x.get("level") == 4 and x["start"] <= t < x["end"] for x in layers)
    other = int(active_l2) + int(active_l3) + int(active_l4)
    return active_sub <= 1 and other <= 1


def run(project: dict) -> dict:
    # Prefer VO-timed typography if audio director already ran
    if (project.get("typography") or {}).get("timing_source") == "vo_word_timestamps":
        project["agent_log"].append({
            "agent": "08_subtitle_typography",
            "skipped": "vo_timed_typography_present",
        })
        return project

    subtitles = [dict(x, level=1, role="subtitle") for x in SUBTITLE_CUES]
    editorial = [dict(x, role="editorial") for x in EDITORIAL]
    hero = [dict(x, role="hero") for x in HERO]
    cta = [dict(x, role="cta") for x in CTA]

    filtered_ed = []
    for ed in editorial:
        conflict = any(h["start"] < ed["end"] and ed["start"] < h["end"] for h in hero)
        if not conflict:
            filtered_ed.append(ed)

    typography = {
        "vo_script": VO_SCRIPT,
        "timing_source": "dramaturgy_map",
        "core_values": CORE_VALUES,
        "peak_line": "NOBODY CREATES ALONE.",
        "hierarchy": {
            "L1_subtitles": subtitles,
            "L2_editorial": filtered_ed,
            "L3_hero": hero,
            "L4_cta": cta,
        },
        "rules": {
            "max_simultaneous": "1 subtitle + 1 editorial_or_hero_or_cta",
            "supported_space": "show_dont_tell",
            "no_ngo_language": True,
        },
    }
    project["typography"] = typography
    stamp_timeline_text(project)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "typography.json").write_text(json.dumps(typography, indent=2), encoding="utf-8")

    violations = 0
    all_layers = subtitles + filtered_ed + hero + cta
    for i in range(0, 61):
        if not _density_ok(all_layers, i * 0.5):
            violations += 1

    project["agent_log"].append({
        "agent": "08_subtitle_typography",
        "subtitles": len(subtitles),
        "editorial": len(filtered_ed),
        "hero": len(hero),
        "cta": len(cta),
        "density_violations_0_5s": violations,
    })
    return project


def stamp_timeline_text(project: dict) -> None:
    typo = project.get("typography") or {}
    hier = typo.get("hierarchy") or {}
    layers = []
    for key in ("L1_subtitles", "L2_editorial", "L3_hero", "L4_cta"):
        layers.extend(hier.get(key) or [])
    if not layers:
        return
    for seg in project.get("timeline") or []:
        s0, s1 = float(seg.get("start") or 0), float(seg.get("end") or 30)
        seg_text = []
        for layer in layers:
            if layer["end"] <= s0 or layer["start"] >= s1:
                continue
            seg_text.append({
                "t": layer["start"],
                "end": layer["end"],
                "text": layer["text"],
                "role": layer.get("role"),
                "level": layer.get("level"),
            })
        seg["text"] = seg_text
