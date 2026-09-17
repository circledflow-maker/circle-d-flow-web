"""AGENT 04 — Creative director: assign shots to the emotional arc.

ATTENTION → CONNECTION → LEARNING → UNITY → SUPPORTED → INVITATION
Does not invent events. Uses folder chapter_hint + scene_type only.
"""
from __future__ import annotations

CHAPTER_NEED = {
    "ATTENTION": 6,
    "CONNECTION": 5,
    "LEARNING": 6,
    "UNITY": 5,
    "SUPPORTED": 5,
    "INVITATION": 4,
}


def story_score(asset: dict, chapter: str) -> int:
    hint = asset.get("chapter_hint")
    scene = asset.get("scene_type") or ""
    path_l = (asset.get("path") or "").lower()
    score = 40
    if hint == chapter:
        score += 35
    # Legacy folder hints mapped loosely
    if hint == "PAST" and chapter in ("ATTENTION", "CONNECTION"):
        score += 20
    if hint == "PRESENT" and chapter in ("LEARNING", "UNITY", "CONNECTION"):
        score += 20
    if hint == "FUTURE" and chapter in ("SUPPORTED", "INVITATION"):
        score += 20

    if scene == "stages_cut" and chapter in ("ATTENTION", "CONNECTION", "UNITY"):
        score += 15
    if scene in ("broll", "photo") and chapter == "SUPPORTED":
        score += 12
    if asset.get("person_ids") and chapter in ("LEARNING", "UNITY", "CONNECTION"):
        score += 12
    if "full_take" in scene:
        score -= 10
    if chapter == "SUPPORTED" and ("_drive_move_art_gallery" in path_l or "doku" in path_l or "moodboard" in path_l):
        score += 25
    if chapter == "LEARNING" and ("akademie" in path_l or "talk" in path_l or "interview" in path_l):
        score += 15
    if chapter == "INVITATION" and ("_drive_move_art_gallery" in path_l or scene == "stages_cut"):
        score += 10
    return min(100, score)


def run(project: dict) -> dict:
    picks = {k: [] for k in CHAPTER_NEED}
    videos = [a for a in project.get("assets") or [] if a.get("type") == "video"]
    qmap = {q["asset_id"]: q for q in project.get("quality_map") or []}

    for chapter, need in CHAPTER_NEED.items():
        ranked = []
        for a in videos:
            tech = (qmap.get(a["asset_id"]) or {}).get("sharpness", {}).get("overall", 0.5)
            label = (qmap.get(a["asset_id"]) or {}).get("label")
            if label == "grab_fail":
                continue
            story = story_score(a, chapter)
            master = (
                0.15 * (a.get("technical_score") or tech * 100)
                + 0.15 * (70 if a.get("person_ids") else 40)
                + 0.15 * 60
                + 0.20 * story
                + 0.15 * (75 if a.get("scene_type") == "stages_cut" else 50)
                + 0.20 * story
            )
            ranked.append((master, a, story, tech))
        ranked.sort(key=lambda x: -x[0])
        seen = set()
        for master, a, story, tech in ranked:
            if a["asset_id"] in seen:
                continue
            already = sum(1 for ch, arr in picks.items() if any(x["asset_id"] == a["asset_id"] for x in arr))
            if already >= 1 and chapter != "INVITATION":
                continue
            who = (a.get("person_ids") or ["community"])[0]
            nxt = {
                "ATTENTION": "CONNECTION",
                "CONNECTION": "LEARNING",
                "LEARNING": "UNITY",
                "UNITY": "SUPPORTED",
                "SUPPORTED": "INVITATION",
                "INVITATION": "MOVEMENT",
            }.get(chapter, "MOVEMENT")
            picks[chapter].append({
                "asset_id": a["asset_id"],
                "shot_id": "shot_" + a["asset_id"].replace("asset_", ""),
                "chapter": chapter,
                "why": {
                    "WHO": who,
                    "WHERE": a.get("location_id"),
                    "WHAT": a.get("scene_type"),
                    "WHY": "folder-mapped chapter" if a.get("chapter_hint") == chapter else "supporting energy",
                    "WHATS_NEXT": nxt,
                },
                "path": a.get("path"),
                "story_score": story,
                "tech": tech,
            })
            seen.add(a["asset_id"])
            if len(picks[chapter]) >= need:
                break

    project["director_plan"] = {
        "chapters": picks,
        "arc": ["CONNECTION", "AWARENESS", "MOVEMENT"],
        "peak_line": "NOBODY CREATES ALONE.",
        "question": "There is a way of being together that we believe in. Do you?",
    }
    project["agent_log"].append({
        "agent": "04_director",
        "picks": {k: len(v) for k, v in picks.items()},
    })
    return project
