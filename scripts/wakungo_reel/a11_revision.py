"""AGENT 12 — Targeted revision. Does not rebuild the whole reel."""
from __future__ import annotations


def run(project: dict) -> dict:
    report = project.get("quality_report") or {}
    status = report.get("status")
    if status == "PASS":
        project["agent_log"].append({"agent": "12_revision", "action": "none"})
        return project

    history = project.get("revision_history") or []
    actions = []
    for err in report.get("critical_errors") or []:
        actions.append({"priority": 1, "issue": err, "fix": "pull next-ranked unused asset into that chapter"})
    for w in report.get("warnings") or []:
        fix = "prefer people / learn-teach / together moments already ingested"
        if "VO" in w or "vo" in w.lower():
            fix = "use Stages natural audio bed; run a07_audio_director for documentary VO"
        if "NOBODY CREATES ALONE" in w:
            fix = "ensure unity hero text in audio director typography"
        actions.append({"priority": 4, "issue": w, "fix": fix})

    plan = (project.get("director_plan") or {}).get("chapters") or {}
    used = {p["asset_id"] for arr in plan.values() for p in arr}
    leftovers = [
        a for a in project.get("assets") or []
        if a.get("type") == "video" and a["asset_id"] not in used and (a.get("duration") or 0) > 1
    ]
    leftovers.sort(key=lambda a: (
        0 if a.get("chapter_hint") in ("SUPPORTED", "FUTURE") else
        1 if a.get("chapter_hint") in ("LEARNING", "UNITY", "PRESENT") else 2,
        -(a.get("technical_score") or 50),
    ))

    for chapter in ("SUPPORTED", "UNITY", "LEARNING", "INVITATION"):
        picks = plan.get(chapter) or []
        if len(picks) >= 3:
            continue
        for a in list(leftovers):
            if len(picks) >= 5:
                break
            picks.append({
                "asset_id": a["asset_id"],
                "shot_id": "shot_" + a["asset_id"].replace("asset_", ""),
                "chapter": chapter,
                "why": {
                    "WHO": "community",
                    "WHERE": a.get("location_id"),
                    "WHAT": a.get("scene_type"),
                    "WHY": "best-available fill for emotional arc",
                    "WHATS_NEXT": "MOVEMENT",
                },
                "master_score": 70,
                "story_score": 55,
                "path": a["path"],
                "duration": a.get("duration") or 0,
            })
            leftovers.remove(a)
            actions.append({"priority": 2, "issue": f"{chapter} gap fill", "fix": a.get("filename")})
        plan[chapter] = picks

    if project.get("director_plan"):
        project["director_plan"]["chapters"] = plan

    for seg in project.get("timeline") or []:
        if seg.get("shot_ids"):
            continue
        if not leftovers:
            break
        a = leftovers.pop(0)
        clip = {
            "shot_id": "shot_" + a["asset_id"].replace("asset_", ""),
            "asset_id": a["asset_id"],
            "path": a["path"],
            "in": 0.5,
            "take": min(1.2, a.get("duration") or 1.2),
            "crop": {},
        }
        seg["clips"] = [clip]
        seg["shot_ids"] = [clip["shot_id"]]
        seg.pop("warning", None)
        actions.append({"priority": 1, "issue": f"filled {seg['segment_id']}", "fix": a["filename"]})

    history.append({"loop": len(history) + 1, "actions": actions[:12]})
    project["revision_history"] = history
    project["agent_log"].append({"agent": "12_revision", "loop": len(history), "actions": len(actions)})

    if len(history) >= 3 and (report.get("critical_errors") or status == "FAIL"):
        project["human_review"] = {
            "reason": "max automatic revision loops reached or remaining gaps",
            "affected_segments": [s["segment_id"] for s in project.get("timeline") or [] if not s.get("shot_ids")],
            "affected_assets": [],
            "recommended_action": (
                "Prefer footage of people learning, teaching, jamming, laughing — "
                "show supported space as feeling. Record human VO when ready."
            ),
            "severity": "medium",
        }
    return project
