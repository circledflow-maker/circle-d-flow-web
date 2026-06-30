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


def detect_artist(path: Path) -> str | None:
    blob = normalize_name(str(path))
    for key, artist in ARTIST_ALIASES.items():
        if key in blob:
            return artist
    # Parent folder as artist if not generic
    generic = {"photos", "videos", "pics", "raw", "exports", "c4c", "cdfevent", "event", "media"}
    for part in reversed(path.parts):
        p = normalize_name(part)
        if p and p not in generic and len(p) > 2:
            return part.replace("_", " ").title()
    return None


def detect_moment(path: Path) -> str | None:
    blob = normalize_name(str(path))
    for key, label in MOMENT_KEYWORDS.items():
        if key in blob:
            return label
    return None


def scan_source(source: Path) -> dict:
    artists: dict[str, list] = defaultdict(list)
    moments: dict[str, list] = defaultdict(list)
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
        entry = {
            "path": str(f),
            "name": f.name,
            "type": "video" if f.suffix.lower() in {".mp4", ".mov", ".m4v", ".avi", ".mkv"} else "photo",
            "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
        }
        artist = detect_artist(f)
        moment = detect_moment(f)

        if artist:
            artists[artist].append(entry)
        elif moment:
            moments[moment].append(entry)
        else:
            unassigned.append(entry)

    return {
        "source": str(source),
        "scanned_at": datetime.utcnow().isoformat() + "Z",
        "artists": dict(artists),
        "moments": dict(moments),
        "unassigned": unassigned,
        "stats": {
            "total_files": sum(len(v) for v in artists.values()) + sum(len(v) for v in moments.values()) + len(unassigned),
            "artist_count": len(artists),
            "moment_categories": len(moments),
        },
    }


def build_caption_stubs(data: dict) -> dict:
    captions = {"instagram": [], "youtube": []}
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

    lines = [
        "# C for C Event — Content Structure",
        f"Scanned: `{data.get('source', 'n/a')}`",
        f"Total files: {data.get('stats', {}).get('total_files', 0)}",
        "",
        "## Artists",
    ]
    for artist, files in sorted(data.get("artists", {}).items()):
        lines.append(f"- **{artist}** — {len(files)} files ({sum(1 for x in files if x['type']=='photo')} photos, {sum(1 for x in files if x['type']=='video')} videos)")
    lines.append("\n## Event Moments")
    for moment, files in sorted(data.get("moments", {}).items()):
        lines.append(f"- **{moment}** — {len(files)} files")
    if data.get("unassigned"):
        lines.append(f"\n## Unassigned — {len(data['unassigned'])} files (review manually)")
    lines.append("\n## Next: Video Production")
    lines.append("- One Reel/Short per artist (from artist folders)")
    lines.append("- One full aftermovie (artists + moments interleaved)")
    (out / "STRUCTURE_OVERVIEW.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Organize C for C event media")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()

    print(f"Scanning: {args.source}")
    data = scan_source(args.source)
    if "error" in data:
        print(f"WARNING: {data['error']}")
        print("Update --source path or copy media into the project.")

    captions = build_caption_stubs(data)
    write_report(data, captions, OUTPUT_DIR)
    print(f"Done -> {OUTPUT_DIR}")
    print(f"Artists: {data.get('stats', {}).get('artist_count', 0)} | Files: {data.get('stats', {}).get('total_files', 0)}")


if __name__ == "__main__":
    main()
