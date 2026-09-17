"""AGENT 06 — Cut decisions. Hard cuts first. Each cut has a reason."""
from __future__ import annotations

PACING = {
    "ATTENTION": 0.55,
    "CONNECTION": 0.85,
    "LEARNING": 1.15,
    "UNITY": 1.0,
    "SUPPORTED": 1.5,
    "INVITATION": 0.85,
    # legacy
    "PAST": 0.55,
    "PRESENT": 1.1,
    "FUTURE": 1.6,
}


def run(project: dict) -> dict:
    chapters = (project.get("director_plan") or {}).get("chapters") or {}
    decisions = []
    for chapter, picks in chapters.items():
        dur = PACING.get(chapter, 1.0)
        for i, p in enumerate(picks):
            reason = (
                "beat" if chapter == "ATTENTION"
                else "human" if chapter in ("LEARNING", "UNITY")
                else "feeling" if chapter == "SUPPORTED"
                else "invite" if chapter == "INVITATION"
                else "movement_match"
            )
            if i == 0:
                reason = "chapter"
            src_dur = float(p.get("duration") or 8)
            in_point = min(2.0, max(0.0, src_dur * 0.2))
            take = min(dur, max(0.4, src_dur - in_point - 0.2))
            p["edit"] = {
                "cut_reason": reason,
                "confidence": 0.78,
                "in": round(in_point, 2),
                "take": round(take, 2),
                "transition": "hard_cut",
            }
            decisions.append({"shot_id": p["shot_id"], "chapter": chapter, **p["edit"]})
    project["edit_decisions"] = decisions
    project["agent_log"].append({"agent": "06_edit", "cuts": len(decisions)})
    return project
