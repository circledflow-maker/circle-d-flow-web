"""AGENT 01 — Asset ingest & catalog. No creative decisions."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from contract import (
    FOLDER_CHAPTER,
    OUT,
    PROJECT_PATH,
    REEL_HERO_ASSETS,
    REEL_SOURCE_ROOTS,
    SKIP_DIR_NAMES,
    STUDIO,
    empty_project,
)

VIDEO_EXT = {".mp4", ".mov", ".m4v"}
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp"}
AUDIO_EXT = {".wav", ".mp3", ".m4a", ".aac"}
# Skip SD-size masters sitting on D:; proxies/cuts are the working set
MAX_BYTES = 3_800_000_000
HERO_MAX_BYTES = 8_000_000_000


def chapter_for(path: Path) -> str:
    try:
        rel = path.relative_to(STUDIO).parts
    except ValueError:
        return "UNKNOWN"
    if not rel:
        return "UNKNOWN"
    # Prefer deeper path hints (artists / full takes / moodboard folders)
    for part in reversed(rel):
        key = part.lower()
        if key in FOLDER_CHAPTER:
            return FOLDER_CHAPTER[key]
    top = rel[0].lower()
    return FOLDER_CHAPTER.get(top, "UNKNOWN")


def camera_from_name(name: str) -> str:
    n = name.upper()
    if "D850" in n or "ND850" in n:
        return "Nikon_D850"
    if "NZ502" in n or "Z50" in n:
        return "Nikon_Z50II"
    if name.upper().startswith("DSC_"):
        return "Nikon"
    return ""


def probe_video(path: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_format", "-show_streams", str(path),
    ]
    try:
        raw = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL, timeout=25)
        data = json.loads(raw or "{}")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return {}
    streams = data.get("streams") or []
    v = next((s for s in streams if s.get("codec_type") == "video"), None) or {}
    a = next((s for s in streams if s.get("codec_type") == "audio"), None)
    fmt = data.get("format") or {}
    w = int(v.get("width") or 0)
    h = int(v.get("height") or 0)
    fps_s = str(v.get("r_frame_rate") or v.get("avg_frame_rate") or "0/1")
    try:
        num, den = fps_s.split("/")
        fps = float(num) / float(den or 1)
    except Exception:
        fps = 0.0
    try:
        duration = float(fmt.get("duration") or v.get("duration") or 0)
    except (TypeError, ValueError):
        duration = 0.0
    orientation = "landscape" if w >= h else "portrait" if h > w else "unknown"
    return {
        "codec": v.get("codec_name") or "",
        "resolution": {"width": w, "height": h},
        "fps": round(fps, 3),
        "duration": round(duration, 2),
        "orientation": orientation,
        "audio": bool(a),
        "format": fmt.get("format_name") or path.suffix.lower().lstrip("."),
    }


def artist_from_path(path: Path) -> str:
    parts = path.parts
    if "04_Artists" in parts:
        i = parts.index("04_Artists")
        if i + 1 < len(parts):
            return parts[i + 1]
    return ""


def scene_type(path: Path, artist: str) -> str:
    n = path.name.lower()
    if "stages" in n:
        return "stages_cut"
    if "full_proxy" in n or "proxy_1080p" in n:
        return "full_take_proxy"
    if path.suffix.lower() in PHOTO_EXT:
        return "portrait" if "portrait" in n else "photo"
    if artist:
        return "artist_clip"
    if "filler" in str(path).lower() or "broll" in n:
        return "broll"
    if "vo" in n or "voice" in n:
        return "voiceover"
    return "clip"


def should_skip(path: Path, *, hero: bool = False) -> bool:
    if any(p in SKIP_DIR_NAMES for p in path.parts):
        return True
    if path.name.startswith("."):
        return True
    try:
        limit = HERO_MAX_BYTES if hero else MAX_BYTES
        if path.stat().st_size > limit:
            return True
    except OSError:
        return True
    return False


def iter_media() -> list[Path]:
    """Walk only REEL_SOURCE_ROOTS; always include REEL_HERO_ASSETS (up to 8GB)."""
    out: list[Path] = []
    seen: set[Path] = set()

    def add(path: Path, *, hero: bool = False) -> None:
        if not path.is_file():
            return
        if path.suffix.lower() not in VIDEO_EXT | PHOTO_EXT | AUDIO_EXT:
            return
        if should_skip(path, hero=hero):
            return
        try:
            key = path.resolve()
        except OSError:
            key = path
        if key in seen:
            return
        seen.add(key)
        out.append(path)

    for root in REEL_SOURCE_ROOTS:
        if not root.exists():
            continue
        for p in root.rglob("*"):
            add(p)

    for hero in REEL_HERO_ASSETS:
        if hero.exists():
            add(hero, hero=True)

    return sorted(out)


def run(project: dict) -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    assets = []
    locations = {}
    people = {}
    n = 0
    for path in iter_media():
        n += 1
        ext = path.suffix.lower()
        kind = "video" if ext in VIDEO_EXT else "audio" if ext in AUDIO_EXT else "photo"
        artist = artist_from_path(path)
        loc_name = path.relative_to(STUDIO).parts[0]
        loc_id = "loc_" + loc_name.lower().replace(" ", "_")[:40]
        locations[loc_id] = {
            "location_id": loc_id,
            "name": loc_name,
            "path": str(STUDIO / loc_name),
            "chapter_hint": chapter_for(path),
        }
        person_ids = []
        if artist and artist not in ("Unknown", "Event_Broll"):
            pid = "person_" + artist.lower()
            people[pid] = {
                "person_id": pid,
                "name": artist.replace("_", " "),
                "slug": artist,
                "source": "folder_sort",
            }
            person_ids = [pid]
        meta = {
            "asset_id": f"asset_{len(assets)+1:04d}",
            "filename": path.name,
            "path": str(path),
            "type": kind,
            "chapter_hint": chapter_for(path),
            "location_id": loc_id,
            "person_ids": person_ids,
            "artist_slug": artist,
            "scene_type": scene_type(path, artist),
            "camera": camera_from_name(path.name),
            "bytes": path.stat().st_size,
            "technical_score": 0,
            "creative_score": 0,
        }
        if kind == "video":
            probed = probe_video(path)
            meta.update(probed)
            if not probed:
                meta["duration"] = 0
                meta["resolution"] = {"width": 0, "height": 0}
                meta["orientation"] = "unknown"
        elif kind == "photo":
            meta["duration"] = 0
            meta["orientation"] = "unknown"
        else:
            meta["duration"] = 0
        assets.append(meta)
        if n % 40 == 0:
            print(f"  ingest {n} files…", flush=True)

    project["assets"] = assets
    project["locations"] = list(locations.values())
    project["people"] = list(people.values())
    project["agent_log"].append({
        "agent": "01_ingest",
        "files_scanned": n,
        "assets": len(assets),
        "people": len(people),
        "locations": len(locations),
    })
    return project


def main() -> int:
    project = empty_project()
    project = run(project)
    OUT.mkdir(parents=True, exist_ok=True)
    PROJECT_PATH.write_text(json.dumps(project, indent=2), encoding="utf-8")
    print(f"wrote {PROJECT_PATH} ({len(project['assets'])} assets)")
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
