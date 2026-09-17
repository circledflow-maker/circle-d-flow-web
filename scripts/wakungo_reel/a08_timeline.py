#!/usr/bin/env python3
"""AGENT 09 — Assemble 30s timeline JSON from director + edit decisions.

Text layers are owned by AGENT 08 (subtitle & typography).
Clip boundaries snap lightly to the beat map when available.
"""
from __future__ import annotations

from contract import CHAPTERS


def _snap(t: float, beats: list[float], max_delta: float = 0.2) -> float:
    if not beats:
        return t
    best = min(beats, key=lambda b: abs(b - t))
    return best if abs(best - t) <= max_delta else t


def run(project: dict) -> dict:
    chapters = (project.get("director_plan") or {}).get("chapters") or {}
    beats = ((project.get("beat_map") or {}).get("beats")) or []
    timeline = []
    for ch in CHAPTERS:
        cid = ch["id"]
        picks = chapters.get(cid) or []
        window = ch["end"] - ch["start"]
        if not picks:
            timeline.append({
                "segment_id": f"seg_{cid.lower()}",
                "start": ch["start"],
                "end": ch["end"],
                "shot_ids": [],
                "audio_ids": ["aud_nat_stages", "aud_music"] if cid == "ATTENTION" else ["aud_vo", "aud_music"],
                "text": [],
                "transition": "hard_cut",
                "crop": {},
                "effects": [],
                "warning": "no shots assigned",
            })
            continue
        t = ch["start"]
        used = []
        for p in picks:
            take = float((p.get("edit") or {}).get("take") or 0.6)
            if t >= ch["end"] - 0.05:
                break
            # Prefer ending a clip on a beat when close
            raw_end = min(t + take, ch["end"])
            snapped_end = _snap(raw_end, beats, 0.22)
            if snapped_end > t + 0.25 and snapped_end <= ch["end"] + 0.01:
                take = min(snapped_end, ch["end"]) - t
            else:
                take = min(take, ch["end"] - t)
            used.append({
                "shot_id": p["shot_id"],
                "asset_id": p["asset_id"],
                "path": p["path"],
                "in": (p.get("edit") or {}).get("in", 0),
                "take": round(take, 2),
                "crop": p.get("crop") or {},
            })
            t += take
        timeline.append({
            "segment_id": f"seg_{cid.lower()}",
            "start": ch["start"],
            "end": ch["end"],
            "shot_ids": [u["shot_id"] for u in used],
            "clips": used,
            "audio_ids": ["aud_nat_stages", "aud_music"] if cid == "ATTENTION" else ["aud_vo", "aud_music"],
            "text": [],  # filled by a08_subtitle_typography
            "transition": "hard_cut",
            "crop": {},
            "effects": ["grade_normalize"],
            "filled_seconds": round(t - ch["start"], 2),
            "window_seconds": window,
        })
    project["timeline"] = timeline
    # If typography already ran, stamp segment text for QC / assemble helpers
    try:
        from a08_subtitle_typography import stamp_timeline_text
        stamp_timeline_text(project)
    except Exception:
        pass
    project["agent_log"].append({"agent": "09_timeline", "segments": len(timeline), "beat_snap": bool(beats)})
    return project
