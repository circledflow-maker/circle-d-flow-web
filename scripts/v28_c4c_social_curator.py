#!/usr/bin/env python3
"""
C4C Social Media Curator (v28)
Scans artist folders + root pool, scores media, grades contrast,
creates short clips, and packages dated channel folders.

Usage:
  python scripts/v28_c4c_social_curator.py
  python scripts/v28_c4c_social_curator.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError:
    print("opencv-python required: pip install opencv-python")
    sys.exit(1)

try:
    from PIL import Image, ImageOps, ImageEnhance, ImageFile
    ImageFile.LOAD_TRUNCATED_IMAGES = True
except ImportError:
    print("Pillow required: pip install Pillow")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r"D:\cdf27jue\cdfevent")
MAP_FILE = ROOT / "01_AGENT_PROCESSING" / "C4C_Event" / "artists_map.json"
OUTPUT_BASE = Path(r"D:\KYHeart_Social_Media\C4C_ReadyToPost")
META_DIR = ROOT / "01_AGENT_PROCESSING" / "C4C_Event"

MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".m4v"}
VIDEO_EXT = {".mp4", ".mov", ".m4v"}

# Posts start day after scan
START_DATE = date.today() + timedelta(days=1)

CAPTIONS = {
    "venue": "ClimaLabs breathes. C for C — Culture for Community. #CircleDFlow #CforC #Lisbon #ClimaLabs",
    "crowd": "The room moves as one. Pure Lisbon underground energy. #CircleDFlow #CforC #NightCulture",
    "emotion": "Moments that stay. Gratitude, flow, connection. #CircleDFlow #CforC #Community",
    "details_locals": "Details tell the story. Local culture, raw texture. #CircleDFlow #CforC #LisbonCulture",
    "food_community": "Taste meets tribe. Community at the table. #CircleDFlow #CforC #Akwaba",
    "backstage": "Behind the signal. Gatekeepers & builders. #CircleDFlow #CforC #BTS",
}


def dsc_num(name: str) -> int | None:
    m = re.search(r"DSC[_\s]?(\d+)", name, re.I)
    return int(m.group(1)) if m else None


def in_ranges(n: int | None, ranges: list) -> bool:
    if n is None:
        return False
    return any(lo <= n <= hi for lo, hi in ranges)


def find_ffmpeg() -> str | None:
    try:
        r = subprocess.run(["where", "ffmpeg"], capture_output=True, text=True, shell=True)
        if r.returncode == 0:
            return r.stdout.strip().splitlines()[0]
    except Exception:
        pass
    return None


def score_image(path: Path) -> float:
    try:
        img = cv2.imread(str(path))
        if img is None:
            return 0.0
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        sharp = cv2.Laplacian(gray, cv2.CV_64F).var()
        mean = float(np.mean(gray))
        # Prefer sharp, not blown out
        exposure_penalty = abs(mean - 110) / 110
        return max(0.0, sharp / 100.0 - exposure_penalty * 0.5)
    except Exception:
        return 0.0


def score_video(path: Path) -> float:
    try:
        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            return 0.0
        frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 24
        duration = frames / fps if fps else 0
        cap.release()
        # Prefer 2-30s clips
        if duration < 1:
            return 0.2
        if duration > 120:
            return 0.5
        return min(2.0, 0.8 + duration / 30.0)
    except Exception:
        return 0.3


def grade_photo(src: Path, dest: Path) -> None:
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
        img = ImageOps.autocontrast(img, cutoff=1)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.12)
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.05)
        # Social vertical crop option for IG (keep center)
        w, h = img.size
        if w > h and h >= 1080:
            target_ratio = 4 / 5
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, quality=92, optimize=True)


def cut_video_clip(src: Path, dest: Path, ffmpeg: str, max_sec: float = 8.0) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg, "-y", "-i", str(src),
        "-t", str(max_sec),
        "-vf", "eq=contrast=1.08:brightness=0.02:saturation=1.05,scale=1080:-2",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-an", str(dest),
    ]
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=120)
        return dest.exists()
    except Exception:
        return False


def collect_files(source: Path) -> list[dict]:
    items = []
    for f in sorted(source.rglob("*")):
        if not f.is_file() or f.suffix.lower() not in MEDIA_EXT:
            continue
        rel = str(f.relative_to(source))
        top = rel.split(os.sep)[0] if os.sep in rel else "root"
        if top.startswith("DSC_"):
            top = "root"
        items.append({
            "path": f,
            "rel": rel,
            "top": top,
            "name": f.name,
            "dsc": dsc_num(f.name),
            "type": "video" if f.suffix.lower() in VIDEO_EXT else "photo",
        })
    return items


def assign_items(items: list, artist_map: dict) -> dict[str, list]:
    buckets: dict[str, list] = defaultdict(list)
    aliases = artist_map.get("folder_aliases", {})

    for item in items:
        path = item["path"]
        top = item["top"]
        num = item["dsc"]
        assigned = False

        for artist in artist_map.get("artists", []):
            name = artist["name"]
            folders = artist.get("folders", [])
            folder_match = top in folders or aliases.get(top) == name
            range_match = in_ranges(num, artist.get("dsc_ranges", []))
            if folder_match or (top == "root" and range_match):
                item = {**item, "score": score_video(path) if item["type"] == "video" else score_image(path)}
                buckets[f"artist_{name}"].append(item)
                assigned = True
                break

        if assigned:
            continue

        for moment in artist_map.get("moments", []):
            key = moment["name"]
            folders = moment.get("folders", [])
            folder_match = top in folders
            range_match = in_ranges(num, moment.get("dsc_ranges", []))
            if folder_match or (top == "root" and range_match):
                item = {**item, "score": score_video(path) if item["type"] == "video" else score_image(path)}
                buckets[f"moment_{key}"].append(item)
                assigned = True
                break

        if not assigned and top == "root":
            item = {**item, "score": score_video(path) if item["type"] == "video" else score_image(path)}
            buckets["moment_venue"].append(item)

    return buckets


def pick_top(items: list, photos: int = 4, videos: int = 2) -> list:
    photos_sorted = sorted([x for x in items if x["type"] == "photo"], key=lambda x: x.get("score", 0), reverse=True)
    videos_sorted = sorted([x for x in items if x["type"] == "video"], key=lambda x: x.get("score", 0), reverse=True)
    return photos_sorted[:photos] + videos_sorted[:videos]


def build_calendar(buckets: dict, artist_map: dict) -> list[dict]:
    calendar = []
    day = START_DATE
    schedule = []

    for moment in artist_map.get("moments", []):
        key = f"moment_{moment['name']}"
        if buckets.get(key):
            schedule.append(("instagram", moment["name"], moment["label"], key))

    for artist in artist_map.get("artists", []):
        key = f"artist_{artist['name']}"
        if buckets.get(key):
            schedule.append(("instagram", artist["name"], "artist_reel", key))
            schedule.append(("tiktok", artist["name"], "artist_short", key))

    schedule.append(("youtube", "C4C", "aftermovie_teaser", None))

    for i, (platform, slug, fmt, bucket_key) in enumerate(schedule):
        post_date = day + timedelta(days=i * 2)
        calendar.append({
            "post_date": post_date.isoformat(),
            "platform": platform,
            "slug": slug,
            "format": fmt,
            "folder": f"{post_date.isoformat()}_{platform}_{fmt}_{slug.replace(' ', '_').replace('/', '_').replace('.', '')}",
            "caption_en": CAPTIONS.get(slug, f"C for C — {slug}. Culture for Community, Lisbon. #CircleDFlow #CforC"),
        })

    return calendar


def process_bucket(bucket_key: str, items: list, out_dir: Path, ffmpeg: str | None, dry_run: bool) -> dict:
    selected = pick_top(items)
    manifest = {"bucket": bucket_key, "files": []}
    if dry_run:
        manifest["selected"] = [x["rel"] for x in selected]
        return manifest

    for i, item in enumerate(selected):
        src = item["path"]
        ext = ".mp4" if item["type"] == "video" else ".jpg"
        dest = out_dir / f"{i+1:02d}_{item['type']}{ext}"
        if item["type"] == "photo":
            grade_photo(src, dest)
        elif ffmpeg:
            cut_video_clip(src, dest, ffmpeg)
        else:
            shutil.copy2(src, dest)
        manifest["files"].append({"source": item["rel"], "output": str(dest), "score": round(item.get("score", 0), 2)})

    # Montage reel if multiple videos
    if ffmpeg and sum(1 for x in selected if x["type"] == "video") >= 2:
        reel = out_dir / "reel_montage.mp4"
        vids = sorted(out_dir.glob("*_video.mp4"))
        if len(vids) >= 2:
            list_file = out_dir / "concat.txt"
            list_file.write_text("\n".join(f"file '{v}'" for v in vids), encoding="utf-8")
            try:
                subprocess.run([
                    ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
                    "-c", "copy", str(reel)
                ], capture_output=True, check=True, timeout=180)
                manifest["reel"] = str(reel)
            except Exception:
                pass
            list_file.unlink(missing_ok=True)

    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--output", type=Path, default=OUTPUT_BASE)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.source.exists():
        print(f"Source not found: {args.source}")
        sys.exit(1)

    artist_map = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    ffmpeg = find_ffmpeg()
    print(f"Source: {args.source}")
    print(f"Output: {args.output}")
    print(f"FFmpeg: {ffmpeg or 'not found (videos copied raw)'}")

    items = collect_files(args.source)
    print(f"Scanned {len(items)} media files")
    buckets = assign_items(items, artist_map)

    calendar = build_calendar(buckets, artist_map)
    master_manifest = {"calendar": calendar, "buckets": {}}

    for entry in calendar:
        folder_name = entry["folder"]
        out_dir = args.output / folder_name
        bucket_key = None
        if entry["format"] in ("artist_reel", "artist_short"):
            bucket_key = f"artist_{entry['slug']}"
        elif entry["format"] == "aftermovie_teaser":
            bucket_key = None
        else:
            bucket_key = f"moment_{entry['slug']}"

        if bucket_key and buckets.get(bucket_key):
            print(f"Processing {folder_name}...")
            if not args.dry_run:
                out_dir.mkdir(parents=True, exist_ok=True)
                (out_dir / "caption_en.txt").write_text(entry["caption_en"], encoding="utf-8")
                (out_dir / "POST_READY.txt").write_text(
                    f"Platform: {entry['platform']}\nDate: {entry['post_date']}\nFormat: {entry['format']}\n",
                    encoding="utf-8",
                )
            master_manifest["buckets"][folder_name] = process_bucket(
                bucket_key, buckets[bucket_key], out_dir, ffmpeg, args.dry_run
            )
        elif entry.get("slug") and entry["format"] not in ("artist_reel", "artist_short", "aftermovie_teaser"):
            alt_key = f"moment_{entry['slug']}"
            if buckets.get(alt_key):
                print(f"Processing {folder_name} (moment)...")
                if not args.dry_run:
                    out_dir.mkdir(parents=True, exist_ok=True)
                    cap = CAPTIONS.get(entry["slug"], entry["caption_en"])
                    (out_dir / "caption_en.txt").write_text(cap, encoding="utf-8")
                    (out_dir / "POST_READY.txt").write_text(
                        f"Platform: {entry['platform']}\nDate: {entry['post_date']}\nFormat: {entry['format']}\n",
                        encoding="utf-8",
                    )
                master_manifest["buckets"][folder_name] = process_bucket(
                    alt_key, buckets[alt_key], out_dir, ffmpeg, args.dry_run
                )

    # YouTube aftermovie teaser folder
    yt_entry = next((e for e in calendar if e["platform"] == "youtube"), None)
    if yt_entry and not args.dry_run:
        yt_dir = args.output / yt_entry["folder"]
        yt_dir.mkdir(parents=True, exist_ok=True)
        teaser_sources = []
        for moment in ["moment_emotion", "moment_crowd", "moment_venue"]:
            teaser_sources.extend(pick_top(buckets.get(moment, []), photos=1, videos=1))
        for i, item in enumerate(teaser_sources[:6]):
            dest = yt_dir / f"teaser_{i+1:02d}{'.mp4' if item['type']=='video' else '.jpg'}"
            if item["type"] == "photo":
                grade_photo(item["path"], dest)
            elif ffmpeg:
                cut_video_clip(item["path"], dest, ffmpeg, max_sec=5.0)
        (yt_dir / "caption_en.txt").write_text(
            "C for C — Full Aftermovie coming soon. Culture for Community at ClimaLabs, Lisbon. #CircleDFlow #CforC",
            encoding="utf-8",
        )

    report_path = META_DIR / "SOCIAL_OUTPUT_MANIFEST.json"
    overview_path = META_DIR / "SOCIAL_OUTPUT_OVERVIEW.md"
    report_path.write_text(json.dumps(master_manifest, indent=2), encoding="utf-8")

    lines = [
        "# C4C Social Media — Ready to Post",
        f"Output: `{args.output}`",
        f"Generated: {date.today().isoformat()}",
        "",
        "## Posting Calendar",
    ]
    for e in calendar:
        lines.append(f"- **{e['post_date']}** | {e['platform'].upper()} | {e['format']} | `{e['folder']}/`")
    lines.append("\n## Bucket Stats")
    for k, v in sorted(buckets.items()):
        lines.append(f"- {k}: {len(v)} source files")
    overview_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"\nDone. Manifest: {report_path}")
    print(f"Overview: {overview_path}")
    print(f"Folders: {len(calendar)} scheduled")


if __name__ == "__main__":
    main()
