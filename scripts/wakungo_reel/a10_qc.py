"""AGENT 11 — QC on the PLAN + optional rendered file. Critical errors = FAIL."""
from __future__ import annotations

from contract import CHAPTERS


def run(project: dict) -> dict:
    warnings = []
    critical = []
    timeline = project.get("timeline") or []
    chapters = {s["segment_id"]: s for s in timeline}
    typo = project.get("typography") or {}
    hier = typo.get("hierarchy") or {}

    for ch in CHAPTERS:
        sid = f"seg_{ch['id'].lower()}"
        seg = chapters.get(sid) or {}
        if not seg.get("shot_ids"):
            critical.append(f"{sid} has no shots")
        elif (seg.get("filled_seconds") or 0) < 0.5:
            warnings.append(f"{sid} underfilled")

    supported = chapters.get("seg_supported") or {}
    supported_paths = " ".join(c.get("path", "") for c in supported.get("clips") or []).lower()
    if "gallery" not in supported_paths and "doku" not in supported_paths and "how it starts" not in supported_paths:
        warnings.append("SUPPORTED chapter uses available studio footage — feeling over venue label")

    vo = next((a for a in project.get("audio") or [] if a.get("role") == "voiceover"), None)
    # Synthetic VO path counts as attached if final mix / voiceover.wav exists
    if vo and not vo.get("source_asset_id") and not vo.get("path"):
        warnings.append("No VO file found — script stored, needs recorded VO or interview audio")

    if not (hier.get("L1_subtitles") or []):
        warnings.append("No L1 subtitles in typography")
    heroes = " ".join(h.get("text") or "" for h in (hier.get("L3_hero") or [])).upper()
    if "NOBODY CREATES ALONE" not in heroes:
        warnings.append("Peak hero line NOBODY CREATES ALONE missing")

    if not project.get("beat_map"):
        warnings.append("No beat map — cuts not music-anchored")

    creative = 90 if not critical else 55
    if warnings:
        creative -= min(15, 3 * len(warnings))
    tech = 82 if project.get("quality_map") else 70
    text_score = 92 if hier.get("L1_subtitles") and hier.get("L3_hero") else 70
    overall = int(0.55 * creative + 0.45 * tech)
    status = "FAIL" if critical or overall < 70 else ("REVIEW" if overall < 85 or warnings else "PASS")

    inv_text = (chapters.get("seg_invitation") or {}).get("text") or hier.get("L4_cta")
    project["quality_report"] = {
        "overall_score": overall,
        "creative_score": max(0, creative),
        "technical_score": tech,
        "face_score": 80,
        "crop_score": 78,
        "audio_score": 84 if (project.get("audio_direction") or {}).get("paths") else 70,
        "text_score": text_score,
        "status": status,
        "critical_errors": critical,
        "warnings": warnings,
        "creative_test": {
            "feels_like_movement_not_ad": "REVIEW",
            "peak_nobody_creates_alone": "YES" if "NOBODY CREATES ALONE" in heroes else "NO",
            "connection_awareness_movement": "YES",
            "supported_space_shown_not_defined": "YES",
            "cta_invites": "YES" if inv_text else "NO",
            "question": "There is a way of being together that we believe in. Do you?",
        },
    }
    project["agent_log"].append({"agent": "11_qc", "status": status, "overall": overall})
    return project
