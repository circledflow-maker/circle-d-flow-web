#!/usr/bin/env python3
"""
C4C Face-based artist classifier (v30)
- Learns face references from each artist folder in cdfevent
- Classifies root pool media by face similarity
- Exports graded share packs per artist (_ReadyToShare)
- Writes face_buckets.json for social curator

Usage:
  python scripts/v30_c4c_face_classifier.py
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r"D:\cdf27jue\cdfevent")
MAP_FILE = ROOT / "01_AGENT_PROCESSING" / "C4C_Event" / "artists_map.json"
OUT_META = ROOT / "01_AGENT_PROCESSING" / "C4C_Event"
SHARE_SUB = "_ReadyToShare"

MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".m4v"}
VIDEO_EXT = {".mp4", ".mov", ".m4v"}
SKIP_DIRS = {"105nz502_compressed", SHARE_SUB.lower()}
MATCH_THRESHOLD = 0.38

FACE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def load_map() -> dict:
    return json.loads(MAP_FILE.read_text(encoding="utf-8"))


def artist_folders(artist_map: dict) -> dict[str, str]:
    """folder_name -> display artist name"""
    mapping = {}
    aliases = artist_map.get("folder_aliases", {})
    for folder, name in aliases.items():
        mapping[folder] = name
    for a in artist_map.get("artists", []):
        for f in a.get("folders", []):
            mapping[f] = a["name"]
    # crew / food folders
    mapping.setdefault("Akwabafood", "Akwaba — Taste")
    mapping.setdefault("Sandu", "Sandu — Gatekeeper")
    for name in os.listdir(SOURCE):
        p = SOURCE / name
        if p.is_dir() and name not in SKIP_DIRS and not name.startswith("."):
            mapping.setdefault(name, aliases.get(name, name))
    return mapping


def list_artist_dirs() -> list[str]:
    dirs = []
    for name in os.listdir(SOURCE):
        p = SOURCE / name
        if p.is_dir() and name.lower() not in SKIP_DIRS and SHARE_SUB not in name:
            dirs.append(name)
    return sorted(dirs)


def face_hist(frame: np.ndarray) -> np.ndarray | None:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
    faces = FACE.detectMultiScale(gray, 1.15, 5, minSize=(40, 40))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
    roi = gray[y : y + h, x : x + w]
    roi = cv2.resize(roi, (64, 64))
    hist = cv2.calcHist([roi], [0], None, [32], [0, 256])
    cv2.normalize(hist, hist)
    return hist


def hist_from_image(path: Path) -> np.ndarray | None:
    try:
        if path.suffix.lower() in VIDEO_EXT:
            cap = cv2.VideoCapture(str(path))
            for ms in (500, 2000, 4000):
                cap.set(cv2.CAP_PROP_POS_MSEC, ms)
                ret, frame = cap.read()
                if ret:
                    h = face_hist(frame)
                    if h is not None:
                        cap.release()
                        return h
            cap.release()
            return None
        img = cv2.imread(str(path))
        return face_hist(img) if img is not None else None
    except Exception:
        return None


def build_references(artist_dirs: list[str]) -> dict[str, np.ndarray]:
    refs = {}
    for folder in artist_dirs:
        folder_path = SOURCE / folder
        hists = []
        for dp, _, files in os.walk(folder_path):
            if SHARE_SUB in dp:
                continue
            for fn in files:
                if os.path.splitext(fn)[1].lower() not in MEDIA_EXT:
                    continue
                h = hist_from_image(Path(dp) / fn)
                if h is not None:
                    hists.append(h)
        if hists:
            avg = np.mean(hists, axis=0)
            cv2.normalize(avg, avg)
            refs[folder] = avg
            print(f"  [ref] {folder}: {len(hists)} face samples")
        else:
            print(f"  [ref] {folder}: no faces (folder-only match)")
    return refs


def classify_file(path: Path, refs: dict[str, np.ndarray], folder_map: dict[str, str]) -> tuple[str | None, float]:
    h = hist_from_image(path)
    if h is None:
        return None, 0.0
    best_folder, best_score = None, -1.0
    for folder, ref in refs.items():
        score = cv2.compareHist(h, ref, cv2.HISTCMP_CORREL)
        if score > best_score:
            best_score = score
            best_folder = folder
    if best_folder and best_score >= MATCH_THRESHOLD:
        return folder_map.get(best_folder, best_folder), best_score
    return None, best_score


def grade_photo(src: Path, dest: Path) -> None:
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
        img = ImageOps.autocontrast(img, cutoff=1)
        img = ImageEnhance.Contrast(img).enhance(1.1)
        img = ImageEnhance.Color(img).enhance(1.04)
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, quality=92, optimize=True)


def grade_video(src: Path, dest: Path, ffmpeg: str, max_sec: float = 12.0) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg, "-y", "-i", str(src), "-t", str(max_sec),
        "-vf", "eq=contrast=1.08:brightness=0.02:saturation=1.05,scale=1080:-2",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        str(dest),
    ]
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=180)
        return dest.exists()
    except Exception:
        shutil.copy2(src, dest)
        return dest.exists()


def ffmpeg_bin() -> str:
    r = subprocess.run(["where", "ffmpeg"], capture_output=True, text=True, shell=True)
    return r.stdout.strip().splitlines()[0]


def is_root_file(path: Path) -> bool:
    try:
        rel = path.relative_to(SOURCE)
        return len(rel.parts) == 1
    except ValueError:
        return False


def main():
    artist_map = load_map()
    folder_map = artist_folders(artist_map)
    artist_dirs = list_artist_dirs()
    ff = ffmpeg_bin()

    print(f"Artist folders: {artist_dirs}")
    print("Building face references...")
    refs = build_references(artist_dirs)

    buckets: dict[str, list] = defaultdict(list)
    assignments = []

    # Files already in artist folders belong to that artist
    for folder in artist_dirs:
        artist_name = folder_map.get(folder, folder)
        folder_path = SOURCE / folder
        for dp, _, files in os.walk(folder_path):
            if SHARE_SUB in dp:
                continue
            for fn in files:
                ext = os.path.splitext(fn)[1].lower()
                if ext not in MEDIA_EXT:
                    continue
                p = Path(dp) / fn
                buckets[f"artist_{artist_name}"].append({
                    "path": str(p),
                    "artist": artist_name,
                    "folder": folder,
                    "source": "folder",
                    "score": 1.0,
                    "type": "video" if ext in VIDEO_EXT else "photo",
                })

    # Classify root pool
    print("Classifying root pool by face...")
    root_files = [SOURCE / f for f in os.listdir(SOURCE) if is_root_file(SOURCE / f) and os.path.splitext(f)[1].lower() in MEDIA_EXT]
    for i, p in enumerate(root_files):
        if i % 50 == 0:
            print(f"  ... {i}/{len(root_files)}")
        artist, score = classify_file(p, refs, folder_map)
        ext = p.suffix.lower()
        entry = {
            "path": str(p),
            "artist": artist,
            "score": round(float(score), 3),
            "source": "face" if artist else "unassigned",
            "type": "video" if ext in VIDEO_EXT else "photo",
        }
        assignments.append(entry)
        if artist:
            buckets[f"artist_{artist}"].append(entry)

    # Export _ReadyToShare per artist folder
    print("Exporting _ReadyToShare packs...")
    for folder in artist_dirs:
        artist_name = folder_map.get(folder, folder)
        items = buckets.get(f"artist_{artist_name}", [])
        # also items classified to this folder name
        share_dir = SOURCE / folder / SHARE_SUB
        if share_dir.exists():
            shutil.rmtree(share_dir)
        share_dir.mkdir(parents=True, exist_ok=True)

        # sort by score, pick top
        photos = sorted([x for x in items if x["type"] == "photo"], key=lambda x: x.get("score", 0), reverse=True)[:8]
        videos = sorted([x for x in items if x["type"] == "video"], key=lambda x: x.get("score", 0), reverse=True)[:4]
        selected = photos + videos
        if not selected:
            continue

        manifest_lines = [f"# {artist_name} — Ready to Share", f"Generated: {datetime.utcnow().isoformat()}Z", ""]
        for j, item in enumerate(selected, 1):
            src = Path(item["path"])
            ext = ".mp4" if item["type"] == "video" else ".jpg"
            dest = share_dir / f"{j:02d}_{item['type']}{ext}"
            if item["type"] == "photo":
                grade_photo(src, dest)
            else:
                grade_video(src, dest, ff)
            manifest_lines.append(f"- {dest.name} <- {src.name} (score {item.get('score',0)})")

        (share_dir / "README.txt").write_text("\n".join(manifest_lines), encoding="utf-8")
        (share_dir / "caption_en.txt").write_text(
            f"C for C — {artist_name}. Culture for Community, Lisbon. #CircleDFlow #CforC #{artist_name.replace(' ', '')}",
            encoding="utf-8",
        )
        print(f"  [pack] {folder} / {SHARE_SUB}: {len(selected)} files")

    # Save buckets for curator
    face_buckets_path = OUT_META / "face_buckets.json"
    serializable = {k: v for k, v in buckets.items()}
    face_buckets_path.write_text(json.dumps(serializable, indent=2), encoding="utf-8")

    assign_path = OUT_META / "face_assignments.json"
    assign_path.write_text(json.dumps(assignments, indent=2), encoding="utf-8")

    summary = OUT_META / "FACE_CLASSIFY_OVERVIEW.md"
    lines = ["# C4C Face Classification", f"Root files scanned: {len(root_files)}", ""]
    for k in sorted(buckets.keys()):
        lines.append(f"- **{k}**: {len(buckets[k])} files")
    lines.append(f"\nShare packs: `{{artist_folder}}/{SHARE_SUB}/`")
    summary.write_text("\n".join(lines), encoding="utf-8")

    print(f"\nDone. face_buckets -> {face_buckets_path}")


if __name__ == "__main__":
    main()
