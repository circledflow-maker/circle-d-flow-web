"""AGENT 03 — Lightweight sharpness / usability scores from sampled frames."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from contract import OUT


def grab_frame(path: Path, t: float, dest: Path) -> Path | None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return None
    cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, t) * 1000.0)
    ok, frame = cap.read()
    cap.release()
    if not ok or frame is None:
        return None
    h, w = frame.shape[:2]
    if w > 640:
        frame = cv2.resize(frame, (640, int(h * 640 / w)))
    cv2.imwrite(str(dest), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    return dest if dest.exists() and dest.stat().st_size > 2000 else None


def sharpness(path: Path) -> float:
    img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return 0.0
    val = cv2.Laplacian(img, cv2.CV_64F).var()
    # Normalize empirically: 0–400+ typical
    return float(min(1.0, val / 280.0))


def score_asset(asset: dict, idx: int) -> dict:
    path = Path(asset["path"])
    dur = float(asset.get("duration") or 0)
    rec = {
        "asset_id": asset["asset_id"],
        "sharpness": {
            "global": 0.0, "subject": 0.0, "face": 0.0, "eyes": 0.0,
            "edges": 0.0, "motion_blur": 0.3, "compression_damage": 0.1, "overall": 0.0,
        },
        "recommended_processing": {
            "denoise": 0.15, "sharpen": 0.18, "face_enhancement": 0.0, "upscale": False,
        },
        "label": "unscored",
    }
    if asset.get("type") != "video" or dur < 0.5:
        rec["label"] = "non_video"
        return rec
    t = max(0.4, min(dur * 0.35, dur - 0.4))
    frame = OUT / "_frames" / f"{asset['asset_id']}.jpg"
    grabbed = grab_frame(path, t, frame)
    if not grabbed:
        rec["label"] = "grab_fail"
        return rec
    s = sharpness(grabbed)
    rec["sharpness"]["global"] = round(s, 3)
    rec["sharpness"]["subject"] = round(min(1.0, s * 1.05), 3)
    rec["sharpness"]["face"] = round(s, 3)
    rec["sharpness"]["eyes"] = round(s, 3)
    rec["sharpness"]["edges"] = round(s, 3)
    rec["sharpness"]["overall"] = round(s, 3)
    if s >= 0.75:
        rec["label"] = "usable"
        rec["recommended_processing"]["sharpen"] = 0.12
    elif s >= 0.45:
        rec["label"] = "usable_soft"
        rec["recommended_processing"]["sharpen"] = 0.2
    else:
        rec["label"] = "emotionally_strong_but_soft" if asset.get("person_ids") else "weak"
        rec["recommended_processing"]["denoise"] = 0.22
        rec["recommended_processing"]["sharpen"] = 0.08
    return rec


def run(project: dict, limit: int = 80) -> dict:
    videos = [a for a in project.get("assets") or [] if a.get("type") == "video"]
    # Prefer artist Stages cuts + proxies, skip tiny 2MB glitches
    videos = [a for a in videos if (a.get("bytes") or 0) > 400_000]
    videos.sort(key=lambda a: (0 if a.get("scene_type") == "stages_cut" else 1, -(a.get("duration") or 0)))
    reports = []
    for i, asset in enumerate(videos[:limit]):
        reports.append(score_asset(asset, i))
        by_id = {r["asset_id"]: r for r in reports}
        asset["technical_score"] = int(100 * (by_id[asset["asset_id"]]["sharpness"]["overall"]))
    project["quality_map"] = reports
    project["agent_log"].append({"agent": "03_quality", "scored": len(reports)})
    return project
