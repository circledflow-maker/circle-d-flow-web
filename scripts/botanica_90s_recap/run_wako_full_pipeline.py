#!/usr/bin/env python3
"""Full Botanica pipeline: face-sort Wako Kungo + build 90s reel.

Run on Windows (D:):

  cd D:\\circle-d-flow-web
  python scripts\\botanica_90s_recap\\run_wako_full_pipeline.py
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv"}
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def main() -> int:
    here = Path(__file__).resolve().parent
    repo = here.parents[1]
    root = Path(os.environ.get("BOTANICA_ROOT", r"D:\Wakungo_Content_Studio\Botanica"))
    source = root / "Wako Kungo"

    print("========================================")
    print(" Botanica FULL pipeline")
    print(f" Root:   {root}")
    print(f" Source: {source}")
    print(f" Repo:   {repo}")
    print("========================================")

    if not root.exists():
        print(f"ERROR: Botanica root not found: {root}")
        return 3
    if not source.exists():
        print(f"ERROR: Wako Kungo folder not found: {source}")
        return 3
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe not on PATH")
        return 2

    vids = [p for p in source.rglob("*") if p.is_file() and p.suffix.lower() in VIDEO_EXT]
    photos = [p for p in source.rglob("*") if p.is_file() and p.suffix.lower() in PHOTO_EXT]
    print(f"Wako Kungo media: {len(vids)} videos, {len(photos)} photos")
    if not vids:
        print("ERROR: No videos inside Wako Kungo - nothing to analyze.")
        return 4
    print("Sample files:")
    for p in vids[:8]:
        print(f"  - {p}")

    print("\nSTEP A - pip deps for face sort...")
    r = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--quiet", "opencv-python-headless", "numpy", "Pillow"],
        check=False,
    )
    if r.returncode != 0:
        return r.returncode

    print("\nSTEP B - Face-analyze + sort into ARTISTS / DRIVE_UPLOAD...")
    r = subprocess.run(
        [
            sys.executable,
            str(here / "organize_artists_face.py"),
            "--root",
            str(root),
            "--repo",
            str(repo),
            "--source",
            str(source),
            "--samples",
            "14",
            "--force",
        ],
        check=False,
    )
    if r.returncode != 0:
        return r.returncode

    print("\nSTEP C - Build 90s cinematic reel (9:16) from Wako Kungo...")
    r = subprocess.run(
        [
            sys.executable,
            str(here / "run_botanica_recap.py"),
            "--root",
            str(root),
            "--repo",
            str(repo),
            "--prefer-subdir",
            "wako kungo",
            "--seconds",
            "90",
            "--force",
        ],
        check=False,
    )
    if r.returncode != 0:
        return r.returncode

    reel = root / "EXPORT" / "BOTANICA_90s_RECAP_9x16.mp4"
    event_dir = root / "DRIVE_UPLOAD" / "EVENT"
    event_dir.mkdir(parents=True, exist_ok=True)
    if not reel.exists():
        print(f"WARN: reel file missing at {reel}")
        return 5

    shutil.copy2(reel, event_dir / reel.name)
    print("\nDONE")
    print(f"  Reel:    {reel}")
    print(f"  Artists: {root / 'DRIVE_UPLOAD' / 'ARTISTS'}")
    print(f"  Log:     {root / 'ANALYSIS' / 'face_match_log.json'}")

    # Best-effort open folders on Windows
    if os.name == "nt":
        os.startfile(str(root / "DRIVE_UPLOAD"))  # type: ignore[attr-defined]
        os.startfile(str(reel))  # type: ignore[attr-defined]
    return 0


if __name__ == "__main__":
    sys.exit(main())
