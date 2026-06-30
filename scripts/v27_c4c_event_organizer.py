#!/usr/bin/env python3
"""
C for C Event — content organizer
Sorts media by artist (folder/filename) and event moments.
Outputs manifest JSON + English caption stubs for IG/YouTube calendar.

Usage:
  python scripts/v27_c4c_event_organizer.py
  python scripts/v27_c4c_event_organizer.py --source "D:/cdf27jue/cdfevent"
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# Default source (override via --source)
DEFAULT_SOURCE = Path(r"D:\cdf27jue\cdfevent")
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "01_AGENT_PROCESSING" / "C4C_Event"

MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".mp4", ".mov", ".m4v", ".avi", ".mkv"}

# Known artists / aliases (extend as needed)
ARTIST_ALIASES = {
    "circle d": "Circle D Flow",
    "circledflow": "Circle D Flow",
    "circle-d": "Circle D Flow",
    "african queen": "African Queen",
    "secret garden": "Secret Garden LX",
    "dj qter": "DJ QTER",
    "qter": "DJ QTER",
    "criz": "C-RIZ",
    "c-riz": "C-RIZ",
    "c riz": "C-RIZ",
    "kyheart": "KyheartLx",
    "muna": "Muna",
    "sarah": "Sarah / Kreativlon.Art",
    "kreativlon": "Sarah / Kreativlon.Art",
}

MOMENT_KEYWORDS = {
    "crowd": "Audience & Energy",
    "audience": "Audience & Energy",
    "public": "Audience & Energy",
    "venue": "Location & Atmosphere",
    "location": "Location & Atmosphere",
    "exterior": "Location & Atmosphere",
    "stage": "Stage & Performance",
    "performance": "Stage & Performance",
    "live": "Stage & Performance",
    "highlight": "Event Highlights",
    "emotion": "Emotional Moments",
    "backstage": "Behind the Scenes",
    "bts": "Behind the Scenes",
    "setup": "Behind the Scenes",
    "food": "Community & Vibes",
    "kitchen": "Community & Vibes",
    "bazaar": "Community & Vibes",
    "market": "Community & Vibes",
}


def normalize_name(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def dsc_number(name: str) -> int | None:
    m = re.search(r"DSC[_\s]?(\d+)", name, re.I)
    return int(m.group(1)) if m else None


def detect_artist(path: Path, source: Path, artist_map: dict | None = None) -> str | None:
    rel = path.relative_to(source) if path.is_relative_to(source) else path
    blob = normalize_name(str(rel))
    for key, artist in ARTIST_ALIASES.items():
        if key in blob:
            return artist
    num = dsc_number(path.name)
    if artist_map and num is not None:
        for entry in artist_map.get("artists", []):
            for lo, hi in entry.get("dsc_ranges", []):
                if lo <= num <= hi:
                    return entry["name"]
    generic = {
        "photos", "videos", "pics", "raw", "exports", "c4c", "cdfevent", "event", "media",
        "105nz502", "104nd850", "105nz502 compressed",
    }
    for part in reversed(rel.parts):
        p = normalize_name(part)
        if re.match(r"^dsc\s*\d+", p):
            continue
        if p and p not in generic and len(p) > 2 and not re.match(r"^\d+$", p):
            return part.replace("_", " ").title()
    return None


def classify_moment(path: Path) -> str:
    """Chronological + media-type moments when no keyword match."""
    num = dsc_number(path.name)
    is_video = path.suffix.lower() in {".mp4", ".mov", ".m4v", ".avi", ".mkv"}
    if num is None:
        return "Misc / Unsorted"
    if 643 <= num <= 752:
        return "A — Early Session (compressed roll, video-heavy)"
    if 8764 <= num <= 8885:
        return "B — Mid Event (arrival, warm-up, portraits)"
    if 8909 <= num <= 9022:
        return "C — Main Night (build-up & performances)"
    if 9023 <= num <= 9126:
        return "D — Peak Energy (stage, crowd, motion)"
    if 9127 <= num <= 9234:
        return "E — Closing & Afterglow"
    return "Misc / Unsorted"


def detect_moment(path: Path) -> str | None:
    blob = normalize_name(str(path))
    for key, label in MOMENT_KEYWORDS.items():
        if key in blob:
            return label
    return None


def load_artist_map(out_dir: Path) -> dict | None:
    for name in ("artists_map.json", "artists_map.example.json"):
        p = out_dir / name
        if p.exists() and name == "artists_map.json":
            return json.loads(p.read_text(encoding="utf-8"))
    return None


def scan_source(source: Path, artist_map: dict | None = None) -> dict:
    artists: dict[str, list] = defaultdict(list)
    moments: dict[str, list] = defaultdict(list)
    folders: dict[str, dict] = defaultdict(lambda: {"photos": 0, "videos": 0})
    unassigned: list = []

    if not source.exists():
        return {
            "error": f"Source not found: {source}",
            "artists": {},
            "moments": {},
            "unassigned": [],
        }

    for f in sorted(source.rglob("*")):
        if not f.is_file() or f.suffix.lower() not in MEDIA_EXT:
            continue
        rel = str(f.relative_to(source))
        top = rel.split("\\")[0].split("/")[0]
        if top.startswith("DSC_"):
            top = "root"
        is_video = f.suffix.lower() in {".mp4", ".mov", ".m4v", ".avi", ".mkv"}
        entry = {
            "path": str(f),
            "rel": rel,
            "name": f.name,
            "dsc": dsc_number(f.name),
            "type": "video" if is_video else "photo",
            "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
        }
        folders[top]["videos" if is_video else "photos"] += 1

        artist = detect_artist(f, source, artist_map)
        moment = detect_moment(f) or classify_moment(f)

        if artist:
            artists[artist].append(entry)
        moments[moment].append(entry)
        if not artist:
            unassigned.append(entry)

    total = sum(len(v) for v in moments.values())
    return {
        "source": str(source),
        "scanned_at": datetime.utcnow().isoformat() + "Z",
        "artists": dict(artists),
        "moments": dict(moments),
        "folders": dict(folders),
        "unassigned": unassigned,
        "artist_map_loaded": bool(artist_map),
        "stats": {
            "total_files": total,
            "photos": sum(1 for m in moments.values() for x in m if x["type"] == "photo"),
            "videos": sum(1 for m in moments.values() for x in m if x["type"] == "video"),
            "artist_count": len(artists),
            "moment_categories": len(moments),
            "pending_artist_tagging": len(unassigned),
        },
    }


def build_content_calendar(data: dict) -> list[dict]:
    """30-day IG + YT posting stubs from moments (English)."""
    calendar = []
    moment_captions = {
        "A — Early Session (compressed roll, video-heavy)": (
            "The room wakes up. C for C — Culture for Community begins. "
            "#CircleDFlow #CforC #Lisbon #UndergroundCulture #ClimaLabs"
        ),
        "B — Mid Event (arrival, warm-up, portraits)": (
            "Souls arriving. Warm-up energy before the night takes flight. "
            "#CircleDFlow #CforC #LisbonCulture #Community"
        ),
        "C — Main Night (build-up & performances)": (
            "Main stage. Cipher. Concert. Pure Lisbon flow. "
            "#CircleDFlow #CforC #LivePerformance #Lisbon"
        ),
        "D — Peak Energy (stage, crowd, motion)": (
            "Peak energy — crowd, stage, motion. This is C for C. "
            "#CircleDFlow #CforC #NightCulture #LisbonNights"
        ),
        "E — Closing & Afterglow": (
            "Afterglow. Gratitude. Community stays. "
            "#CircleDFlow #CforC #Aftermovie #Lisbon"
        ),
    }
    day = 1
    for moment, caption in moment_captions.items():
        files = data.get("moments", {}).get(moment, [])
        if not files:
            continue
        calendar.append({
            "day": day,
            "platform": "instagram",
            "format": "carousel_or_reel",
            "moment": moment,
            "file_count": len(files),
            "caption_en": caption,
        })
        day += 2
    for artist, files in sorted(data.get("artists", {}).items()):
        if not files:
            continue
        calendar.append({
            "day": day,
            "platform": "instagram",
            "format": "artist_reel",
            "artist": artist,
            "file_count": len(files),
            "caption_en": (
                f"C for C highlight — {artist}. Culture for Community, Lisbon. "
                f"#CircleDFlow #CforC #{artist.replace(' ', '')}"
            ),
        })
        day += 1
    calendar.append({
        "day": 30,
        "platform": "youtube",
        "format": "full_aftermovie",
        "title_en": "C for C — Full Aftermovie | Circle D Flow Lisbon",
        "description_en": (
            "The complete C for C experience at ClimaLabs Warehouse: "
            "cipher, concert, jam session & community. Circle D Flow."
        ),
    })
    return calendar


def build_caption_stubs(data: dict) -> dict:
    captions = {"instagram": [], "youtube": [], "content_calendar": build_content_calendar(data)}
    for artist, files in data.get("artists", {}).items():
        photos = sum(1 for x in files if x["type"] == "photo")
        videos = sum(1 for x in files if x["type"] == "video")
        captions["instagram"].append({
            "artist": artist,
            "type": "reel_short",
            "caption_en": (
                f"C for C · {artist} at Circle D Flow Lisbon. "
                f"Culture, craft & pure flow. {photos} frames · {videos} clips in the vault. "
                f"#CircleDFlow #CforC #Lisbon #UndergroundCulture #{artist.replace(' ', '')}"
            ),
        })
        captions["youtube"].append({
            "artist": artist,
            "type": "artist_highlight",
            "title_en": f"C for C — {artist} | Circle D Flow Aftermovie Cut",
            "description_en": (
                f"Highlight reel from C for C (Culture for Community), Lisbon. "
                f"Featuring {artist}. Part of the Circle D Flow ecosystem."
            ),
        })
    captions["youtube"].append({
        "type": "full_aftermovie",
        "title_en": "C for C — Full Aftermovie | Circle D Flow Lisbon",
        "description_en": (
            "The complete C for C experience: artists, crowd, location & flow. "
            "Circle D Flow bridges underground Lisbon culture and the digital realm."
        ),
    })
    return captions


def write_report(data: dict, captions: dict, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    (out / "manifest.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    (out / "captions_en.json").write_text(json.dumps(captions, indent=2), encoding="utf-8")

    stats = data.get("stats", {})
    lines = [
        "# C for C Event — Content Structure",
        f"Scanned: `{data.get('source', 'n/a')}`",
        f"Total files: {stats.get('total_files', 0)} ({stats.get('photos', 0)} photos, {stats.get('videos', 0)} videos)",
        "",
        "## Source layout",
        "Flat camera rolls (DSC_####) — no per-artist folders in source.",
    ]
    for folder, counts in sorted(data.get("folders", {}).items()):
        lines.append(f"- `{folder}` — {counts.get('photos', 0)} photos, {counts.get('videos', 0)} videos")
    lines.append("")
    lines.append("## Artists (auto-detected)")
    artists = data.get("artists", {})
    if artists:
        for artist, files in sorted(artists.items()):
            lines.append(
                f"- **{artist}** — {len(files)} files "
                f"({sum(1 for x in files if x['type']=='photo')} photos, "
                f"{sum(1 for x in files if x['type']=='video')} videos)"
            )
    else:
        lines.append("- *None yet* — add `artists_map.json` (DSC ranges) or run face-cluster pass (v28).")
    lines.append("\n## Event Moments (chronological)")
    for moment, files in sorted(data.get("moments", {}).items()):
        lines.append(
            f"- **{moment}** — {len(files)} files "
            f"({sum(1 for x in files if x['type']=='photo')} photos, "
            f"{sum(1 for x in files if x['type']=='video')} videos)"
        )
    pending = stats.get("pending_artist_tagging", 0)
    if pending:
        lines.append(f"\n## Pending artist tagging — {pending} files")
    lines.append("\n## Video plan (after artist map)")
    lines.append("1. One Reel/Short per confirmed artist")
    lines.append("2. Full aftermovie: A→E moments + artist highlights")
    lines.append("\n## Content calendar")
    lines.append("See `captions_en.json` → `content_calendar` (English IG/YouTube stubs)")
    (out / "STRUCTURE_OVERVIEW.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Organize C for C event media")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()

    print(f"Scanning: {args.source}")
    artist_map = load_artist_map(OUTPUT_DIR)
    data = scan_source(args.source, artist_map)
    if "error" in data:
        print(f"WARNING: {data['error']}")
        print("Update --source path or copy media into the project.")

    captions = build_caption_stubs(data)
    write_report(data, captions, OUTPUT_DIR)
    print(f"Done -> {OUTPUT_DIR}")
    print(f"Artists: {data.get('stats', {}).get('artist_count', 0)} | Files: {data.get('stats', {}).get('total_files', 0)}")


if __name__ == "__main__":
    main()
