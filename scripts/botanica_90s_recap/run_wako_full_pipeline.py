#!/usr/bin/env python3
"""Full Botanica pipeline: sort artists + build 90s reels.

Works even when the original 'Wako Kungo' folder was moved/removed —
falls back to videos already under Botanica/ARTISTS and other folders.

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
SKIP_PARTS = {
    "EXPORT",
    "DRIVE_UPLOAD",
    "00_work",
    "ANALYSIS",
    "EDIT",
    "__pycache__",
    ".git",
}


def find_source(root: Path) -> Path:
    """Prefer Wako Kungo; else Botanica root (inventory skips export/work)."""
    candidates = [
        root / "Wako Kungo",
        root / "Wako_Kungo",
        root / "wako kungo",
        root / "WakoKungo",
        root / "ASSETS" / "Wako Kungo",
        root / "00_work" / "Wako Kungo",
    ]
    for c in candidates:
        if c.is_dir():
            vids = [p for p in c.rglob("*") if p.is_file() and p.suffix.lower() in VIDEO_EXT]
            if vids:
                return c
    return root


def count_media(base: Path) -> tuple[list[Path], list[Path]]:
    vids: list[Path] = []
    photos: list[Path] = []
    if not base.exists():
        return vids, photos
    for p in base.rglob("*"):
        if not p.is_file():
            continue
        try:
            rel = p.relative_to(base if base.name.lower() != "botanica" else base)
        except ValueError:
            rel = p
        parts = set(rel.parts) if hasattr(rel, "parts") else set()
        # When scanning Botanica root, skip generated trees
        if base.name.lower() == "botanica" or str(base).lower().endswith("botanica"):
            if any(part in SKIP_PARTS for part in p.parts):
                # allow ARTISTS as source
                if "ARTISTS" not in p.parts and "STILLS" not in p.parts and "ASSETS" not in p.parts:
                    if any(s in p.parts for s in SKIP_PARTS):
                        continue
        if any(s in p.parts for s in ("EXPORT", "DRIVE_UPLOAD", "00_work", "ANALYSIS", "EDIT")):
            continue
        ext = p.suffix.lower()
        if ext in VIDEO_EXT:
            vids.append(p)
        elif ext in PHOTO_EXT:
            photos.append(p)
    return vids, photos


def sync_existing_masters_to_export(root: Path) -> list[Path]:
    """Copy already-rendered masters into Botanica/EXPORT (user looks here)."""
    export = root / "EXPORT"
    export.mkdir(parents=True, exist_ok=True)
    found: list[Path] = []
    patterns = (
        "BOTANICA_90s_RECAP_9x16.mp4",
        "BOTANICA_90s_ENGAGING_LETTERBOX_9x16.mp4",
        "BOTANICA_90s_RECAP_9x16_silent.mp4",
    )
    search_roots = [
        root / "DRIVE_UPLOAD",
        root / "00_work",
        root / "EDIT",
        root,
    ]
    for name in patterns:
        dest = export / name
        if dest.exists() and dest.stat().st_size > 1_000_000:
            found.append(dest)
            continue
        for base in search_roots:
            if not base.exists():
                continue
            for hit in base.rglob(name):
                if "EXPORT" in hit.parts and hit.parent == export:
                    continue
                if hit.stat().st_size < 500_000:
                    continue
                shutil.copy2(hit, dest)
                print(f"   synced -> {dest}  (from {hit})")
                found.append(dest)
                break
    return found


def main() -> int:
    here = Path(__file__).resolve().parent
    repo = here.parents[1]
    root = Path(os.environ.get("BOTANICA_ROOT", r"D:\Wakungo_Content_Studio\Botanica"))

    print("========================================")
    print(" Botanica FULL pipeline")
    print(f" Root:   {root}")
    print(f" Repo:   {repo}")
    print("========================================")

    if not root.exists():
        print(f"ERROR: Botanica root not found: {root}")
        return 3
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe not on PATH")
        return 2

    # Show existing masters first (user asked where the video is)
    print("\nSTEP 0 - Locate / sync existing reels into EXPORT...")
    existing = sync_existing_masters_to_export(root)
    if existing:
        print("   Already available:")
        for p in existing:
            print(f"   - {p}  ({p.stat().st_size/1e6:.1f} MB)")
    else:
        print("   (no existing master found yet)")

    source = find_source(root)
    print(f"\nSource folder: {source}")
    if source == root:
        print("   NOTE: 'Wako Kungo' folder missing — using all Botanica source media (ARTISTS/ASSETS/...).")

    vids, photos = count_media(source)
    # If source is root, count_media already skips export/work
    if source != root and not vids:
        vids, photos = count_media(root)

    print(f"Media: {len(vids)} videos, {len(photos)} photos")
    if not vids:
        print("ERROR: No source videos found under Botanica.")
        print("Open existing reel if present:")
        reel = root / "DRIVE_UPLOAD" / "EVENT" / "BOTANICA_90s_RECAP_9x16.mp4"
        print(f"  {reel}  exists={reel.exists()}")
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
    face_cmd = [
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
    ]
    r = subprocess.run(face_cmd, check=False)
    if r.returncode != 0:
        print("WARN: face sort failed — continuing to reel build")

    prefer = "wako kungo" if "wako" in source.name.lower() else "artists"
    print(f"\nSTEP C - Build 90s full-bleed reel (prefer={prefer})...")
    r = subprocess.run(
        [
            sys.executable,
            str(here / "run_botanica_recap.py"),
            "--root",
            str(root),
            "--repo",
            str(repo),
            "--prefer-subdir",
            prefer,
            "--seconds",
            "90",
            "--force",
        ],
        check=False,
    )
    if r.returncode != 0:
        print("WARN: full-bleed reel failed")

    print("\nSTEP D - Build second 90s Engaging letterbox reel...")
    r = subprocess.run(
        [
            sys.executable,
            str(here / "run_botanica_letterbox_reel.py"),
            "--root",
            str(root),
            "--repo",
            str(repo),
            "--seconds",
            "90",
            "--force",
        ],
        check=False,
    )
    if r.returncode != 0:
        print("WARN: letterbox reel failed")

    # Final sync + report
    sync_existing_masters_to_export(root)
    reel = root / "EXPORT" / "BOTANICA_90s_RECAP_9x16.mp4"
    reel2 = root / "EXPORT" / "BOTANICA_90s_ENGAGING_LETTERBOX_9x16.mp4"
    event_dir = root / "DRIVE_UPLOAD" / "EVENT"
    event_dir.mkdir(parents=True, exist_ok=True)

    # Also copy FROM drive_upload event into export if export still empty
    drive_reel = event_dir / "BOTANICA_90s_RECAP_9x16.mp4"
    if not reel.exists() and drive_reel.exists():
        shutil.copy2(drive_reel, reel)

    if reel.exists():
        shutil.copy2(reel, event_dir / reel.name)
    if reel2.exists():
        shutil.copy2(reel2, event_dir / reel2.name)

    print("\nDONE — open these:")
    print(f"  EXPORT reel 1: {reel}  exists={reel.exists()}")
    print(f"  EXPORT reel 2: {reel2}  exists={reel2.exists()}")
    print(f"  DRIVE EVENT:   {drive_reel}  exists={drive_reel.exists()}")
    print(f"  Artists:       {root / 'DRIVE_UPLOAD' / 'ARTISTS'}")

    if os.name == "nt":
        export = root / "EXPORT"
        os.startfile(str(export if any(export.glob('*.mp4')) else event_dir))  # type: ignore[attr-defined]
        play = reel2 if reel2.exists() else reel if reel.exists() else drive_reel
        if play.exists():
            os.startfile(str(play))  # type: ignore[attr-defined]

    if not reel.exists() and not drive_reel.exists() and not reel2.exists():
        return 5
    return 0


if __name__ == "__main__":
    sys.exit(main())
