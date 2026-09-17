"""AGENT 05 — 9:16 crop instructions. Eyes first; no invented tracking data."""
from __future__ import annotations


def crop_for(asset: dict, chapter: str) -> dict:
    res = asset.get("resolution") or {}
    w = int(res.get("width") or 1920)
    h = int(res.get("height") or 1080)
    target_w, target_h = 1080, 1920
    # Center-weighted vertical crop from landscape; gaze space reserved as metadata only
    if w >= h:
        crop_w = int(min(w, h * 9 / 16))
        crop_h = h
        x = max(0, (w - crop_w) // 2)
        y = 0
        zoom = min(1.15, max(1.0, w / max(crop_w, 1)))
    else:
        crop_w, crop_h, x, y, zoom = w, h, 0, 0, 1.0
    return {
        "target": {"width": target_w, "height": target_h},
        "source_crop": {"x": x, "y": y, "w": crop_w, "h": crop_h},
        "zoom": round(zoom, 3),
        "eye_line": "0.32 from top" if chapter in ("LEARNING", "UNITY", "SUPPORTED", "PRESENT", "FUTURE") else "0.28 from top",
        "priority": ["eyes", "face", "primary_subject", "hands", "instrument", "environment"],
        "digital_zoom_limit": 1.15,
    }


def run(project: dict) -> dict:
    assets = {a["asset_id"]: a for a in project.get("assets") or []}
    plan = project.get("director_plan") or {}
    for chapter, picks in (plan.get("chapters") or {}).items():
        for p in picks:
            a = assets.get(p["asset_id"]) or {}
            p["crop"] = crop_for(a, chapter)
    project["agent_log"].append({"agent": "05_composition"})
    return project
