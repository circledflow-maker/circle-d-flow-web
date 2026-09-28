#!/usr/bin/env python3
"""
Botanica → Google-Drive-ready artist packs

On the Windows PC with D: (ffmpeg required):

  python scripts/botanica_90s_recap/prepare_artist_drive_pack.py ^
    --root "D:\\Wakungo_Content_Studio\\Botanica" --force

Creates / refreshes:
  Botanica/ARTISTS/<folder>/…
  Botanica/DRIVE_UPLOAD/ARTISTS/<folder>/{00_REF,01_VIDEOS_STABILIZED,02_PHOTOS_EDITED,03_FRAMES_FROM_VIDEO}
  Botanica/DRIVE_UPLOAD/_UNASSIGNED_REVIEW/
  Botanica/DRIVE_UPLOAD/README_UPLOAD.txt

Steps:
  1) Ensure artist folders for full IG line-up (incl. Mistah Isaac + Edo)
  2) Inventory event videos + photos (skip work/export trees)
  3) Stabilize short clips (deshake / vidstab) → less shake
  4) Extract + grade frames → photos
  5) Grade existing still photos
  6) Assign by filename/path aliases; leftovers → _UNASSIGNED_REVIEW
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".mts", ".mxf", ".webm"}
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
SKIP_DIR_NAMES = {
    "ANALYSIS",
    "ARTISTS",
    "EVENT_SELECTS",
    "STILLS",
    "EDIT",
    "EXPORT",
    "DRIVE_UPLOAD",
    "00_work",
    "03_Proxies_Compressed",
    "__pycache__",
    ".git",
}

ARTIST_SUBS = (
    "00_REF",
    "01_VIDEOS_STABILIZED",
    "02_PHOTOS_EDITED",
    "03_FRAMES_FROM_VIDEO",
    "PORTRAIT",
    "PERFORMANCE",
    "DETAIL",
    "INTERACTION",
    "VIRTUAL_CAMERA",
    "STILLS",
    "CONTEXT",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(">", " ".join(str(c) for c in cmd[:14]), "…" if len(cmd) > 14 else "")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def ffprobe(path: Path) -> dict[str, Any]:
    r = run(
        [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ]
    )
    return json.loads(r.stdout or "{}")


def load_seed(repo: Path) -> dict[str, Any]:
    p = repo / "scripts" / "botanica_90s_recap" / "artist_seed.json"
    return json.loads(p.read_text(encoding="utf-8"))


def is_skipped(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return True
    return any(part in SKIP_DIR_NAMES for part in rel.parts)


def inventory(root: Path) -> tuple[list[Path], list[Path]]:
    videos: list[Path] = []
    photos: list[Path] = []
    for p in sorted(root.rglob("*")):
        if not p.is_file() or is_skipped(p, root):
            continue
        ext = p.suffix.lower()
        name = p.name.lower()
        if "concept9-16" in name:
            continue
        if ext in VIDEO_EXT:
            videos.append(p)
        elif ext in PHOTO_EXT:
            photos.append(p)
    return videos, photos


def artist_folder_name(a: dict[str, Any]) -> str:
    return a.get("folder") or f"{a['id']}_{a.get('handle', 'artist')}"


def ensure_artist_trees(root: Path, seed: dict[str, Any], repo: Path) -> dict[str, Path]:
    """Create ARTISTS + DRIVE_UPLOAD trees; copy refs; return folder→drive path map."""
    artists_root = root / "ARTISTS"
    drive_root = root / "DRIVE_UPLOAD" / "ARTISTS"
    artists_root.mkdir(parents=True, exist_ok=True)
    drive_root.mkdir(parents=True, exist_ok=True)
    mapping: dict[str, Path] = {}

    for a in seed.get("artists", []):
        folder = artist_folder_name(a)
        art = artists_root / folder
        drv = drive_root / folder
        for sub in ARTIST_SUBS:
            (art / sub).mkdir(parents=True, exist_ok=True)
            if sub.startswith("0") or sub in ("PORTRAIT", "PERFORMANCE", "STILLS", "CONTEXT"):
                (drv / sub).mkdir(parents=True, exist_ok=True)
        for base in (art, drv):
            for sub in ("00_REF", "01_VIDEOS_STABILIZED", "02_PHOTOS_EDITED", "03_FRAMES_FROM_VIDEO"):
                (base / sub).mkdir(parents=True, exist_ok=True)

        meta = {
            **a,
            "created_at": utc_now(),
            "drive_ready": True,
            "paths": {
                "artists": str(art),
                "drive_upload": str(drv),
            },
        }
        (art / "artist.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        (drv / "artist.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

        # Copy IG reference into 00_REF
        ref = a.get("ref_image")
        if ref:
            src = repo / ref
            if src.exists():
                for dest_base in (art, drv):
                    dest = dest_base / "00_REF" / src.name
                    if not dest.exists():
                        shutil.copy2(src, dest)

        # Placeholder note for artists without ref yet
        note = drv / "00_REF" / "README.txt"
        if not note.exists():
            note.write_text(
                f"Artist: {a.get('display_name')} (@{a.get('handle')})\n"
                f"Short: {a.get('short_name', '')}\n"
                f"Aliases: {', '.join(a.get('aliases') or [])}\n"
                f"{a.get('notes', '')}\n",
                encoding="utf-8",
            )

        mapping[folder] = drv

    # Unassigned review bucket
    un = root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW"
    for sub in ("VIDEOS", "PHOTOS", "FRAMES"):
        (un / sub).mkdir(parents=True, exist_ok=True)
    return mapping


def match_artist(path: Path, artists: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    hay = str(path).lower().replace("\\", "/")
    # Prefer longer aliases first
    scored: list[tuple[int, dict[str, Any]]] = []
    for a in artists:
        aliases = list(a.get("aliases") or [])
        aliases += [a.get("handle", ""), a.get("display_name", ""), a.get("short_name", "")]
        for al in aliases:
            if not al:
                continue
            token = str(al).lower()
            if token and token in hay:
                scored.append((len(token), a))
    if not scored:
        return None
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]


def photo_grade_vf() -> str:
    """Warm botanical still grade — soft, upload-ready."""
    return (
        "hqdn3d=1.2:1.2:3:3,"
        "eq=contrast=1.07:brightness=0.03:saturation=0.95:gamma=1.04,"
        "colorbalance=rs=0.03:gs=-0.01:bs=-0.025:rm=0.015:bm=-0.01,"
        "unsharp=3:3:0.25"
    )


def stabilize_available() -> str:
    """Prefer deshake on Windows paths; vidstab when transform path is safe."""
    r = subprocess.run(["ffmpeg", "-filters"], capture_output=True, text=True, check=False)
    blob = (r.stdout or "") + (r.stderr or "")
    # deshake is more reliable with Windows drive letters in filter graphs
    if os.name == "nt":
        return "deshake"
    if "vidstabtransform" in blob and "vidstabdetect" in blob:
        return "vidstab"
    return "deshake"


def render_stabilized_clip(
    src: Path,
    out: Path,
    start: float,
    dur: float,
    mode: str,
    work: Path,
    force: bool,
) -> bool:
    if out.exists() and out.stat().st_size > 40_000 and not force:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    # Mild export (keep source AR, max 1920 on long side) + light grade
    scale = "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease"
    vf = (
        f"deshake=rx=32:ry=32:edge=mirror,"
        f"hqdn3d=1.0:1.0:2.5:2.5,{scale},{photo_grade_vf()}"
    )

    try:
        if mode == "vidstab":
            trf = work / f"transforms_{out.stem}.trf"
            # CWD=work so transform filenames have no Windows drive-colon issues
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-ss",
                    f"{start:.2f}",
                    "-i",
                    str(src.resolve()),
                    "-t",
                    f"{dur:.2f}",
                    "-vf",
                    f"vidstabdetect=shakiness=6:accuracy=12:result={trf.name}",
                    "-f",
                    "null",
                    "-",
                ],
                check=True,
                capture_output=True,
                text=True,
                cwd=str(work),
            )
            vf = (
                f"vidstabtransform=input={trf.name}:smoothing=12:crop=black,"
                f"hqdn3d=1.0:1.0:2.5:2.5,{scale},{photo_grade_vf()}"
            )
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-ss",
                    f"{start:.2f}",
                    "-i",
                    str(src.resolve()),
                    "-t",
                    f"{dur:.2f}",
                    "-vf",
                    vf,
                    "-an",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "fast",
                    "-crf",
                    "18",
                    "-pix_fmt",
                    "yuv420p",
                    "-movflags",
                    "+faststart",
                    str(out.resolve()),
                ],
                check=True,
                capture_output=True,
                text=True,
                cwd=str(work),
            )
            return out.exists() and out.stat().st_size > 20_000

        run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                f"{start:.2f}",
                "-i",
                str(src),
                "-t",
                f"{dur:.2f}",
                "-vf",
                vf,
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "18",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(out),
            ]
        )
        return out.exists() and out.stat().st_size > 20_000
    except subprocess.CalledProcessError as e:
        print("WARN stabilize failed:", src.name, (e.stderr or "")[-240:])
        return False


def extract_graded_frame(src: Path, out: Path, t: float, force: bool) -> bool:
    if out.exists() and out.stat().st_size > 8_000 and not force:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    vf = f"{photo_grade_vf()},scale='min(2048,iw)':'-2'"
    try:
        run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                f"{t:.2f}",
                "-i",
                str(src),
                "-frames:v",
                "1",
                "-vf",
                vf,
                "-q:v",
                "2",
                str(out),
            ]
        )
        return out.exists() and out.stat().st_size > 5_000
    except subprocess.CalledProcessError:
        return False


def grade_photo(src: Path, out: Path, force: bool) -> bool:
    if out.exists() and out.stat().st_size > 8_000 and not force:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(src),
                "-vf",
                f"{photo_grade_vf()},scale='min(2400,iw)':'-2'",
                "-q:v",
                "2",
                str(out),
            ]
        )
        return out.exists()
    except subprocess.CalledProcessError:
        return False


def distribute_round_robin(items: list[Path], artists: list[dict[str, Any]]) -> dict[str, list[Path]]:
    """Give every artist some material when auto-match fails (manual sort later)."""
    buckets: dict[str, list[Path]] = {artist_folder_name(a): [] for a in artists}
    if not artists or not items:
        return buckets
    keys = list(buckets.keys())
    for i, p in enumerate(items):
        buckets[keys[i % len(keys)]].append(p)
    return buckets


def write_upload_readme(drive: Path, seed: dict[str, Any]) -> None:
    lines = [
        "BOTANICA — Google Drive upload pack",
        f"Generated: {utc_now()}",
        f"Event: {seed.get('event', {}).get('title')} @ {seed.get('event', {}).get('venue')}",
        "",
        "Structure:",
        "  ARTISTS/<folder>/",
        "    00_REF/                 Instagram / flyer references",
        "    01_VIDEOS_STABILIZED/   short deshaken performance clips",
        "    02_PHOTOS_EDITED/       graded still photos",
        "    03_FRAMES_FROM_VIDEO/   graded frames pulled from footage",
        "    artist.json",
        "  _UNASSIGNED_REVIEW/      needs human sort to artist folders",
        "",
        "Artists (IG line-up):",
    ]
    for a in seed.get("artists", []):
        short = f" (Edo)" if a.get("short_name") == "Edo" else ""
        lines.append(f"  - {artist_folder_name(a)}  @{a.get('handle')}{short}")
    lines += [
        "",
        "Tips:",
        "  1) Upload the whole DRIVE_UPLOAD folder.",
        "  2) Sort anything in _UNASSIGNED_REVIEW into the right artist.",
        "  3) Prefer 01_VIDEOS_STABILIZED + 02/03 photos for posts.",
        "",
    ]
    (drive / "README_UPLOAD.txt").write_text("\n".join(lines), encoding="utf-8")


def process_videos(
    videos: list[Path],
    seed: dict[str, Any],
    root: Path,
    work: Path,
    force: bool,
    clips_per_source: int = 3,
    clip_dur: float = 4.0,
) -> dict[str, Any]:
    artists = seed.get("artists") or []
    mode = stabilize_available()
    print(f"Stabilize mode: {mode}")
    stats = {"stabilized": 0, "frames": 0, "matched": 0, "unassigned_videos": 0}
    unassigned_vids: list[Path] = []
    unassigned_frames: list[Path] = []

    # Prefer longer / larger files first
    scored = []
    for v in videos:
        try:
            info = ffprobe(v)
            dur = float(info.get("format", {}).get("duration") or 0)
        except Exception:
            dur = 0
        scored.append((dur, v.stat().st_size, v))
    scored.sort(reverse=True)

    for dur, _sz, src in scored[:40]:
        if dur < 3:
            continue
        artist = match_artist(src, artists)
        # Sample mid-band points
        starts = []
        for k in range(clips_per_source):
            t0 = max(1.0, dur * (0.18 + 0.55 * (k + 0.5) / clips_per_source))
            if t0 + clip_dur < dur - 0.5:
                starts.append(t0)

        for i, t0 in enumerate(starts):
            stem = f"{src.stem[:40]}_{i:02d}"
            if artist:
                folder = artist_folder_name(artist)
                v_out = root / "DRIVE_UPLOAD" / "ARTISTS" / folder / "01_VIDEOS_STABILIZED" / f"{stem}_stable.mp4"
                f_out = root / "DRIVE_UPLOAD" / "ARTISTS" / folder / "03_FRAMES_FROM_VIDEO" / f"{stem}_frame.jpg"
                # Mirror into ARTISTS tree
                v_out2 = root / "ARTISTS" / folder / "01_VIDEOS_STABILIZED" / f"{stem}_stable.mp4"
                f_out2 = root / "ARTISTS" / folder / "03_FRAMES_FROM_VIDEO" / f"{stem}_frame.jpg"
                stats["matched"] += 1
            else:
                v_out = root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "VIDEOS" / f"{stem}_stable.mp4"
                f_out = root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "FRAMES" / f"{stem}_frame.jpg"
                v_out2 = f_out2 = None
                unassigned_vids.append(v_out)
                stats["unassigned_videos"] += 1

            if render_stabilized_clip(src, v_out, t0, clip_dur, mode, work, force):
                stats["stabilized"] += 1
                if v_out2 and (force or not v_out2.exists()):
                    v_out2.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(v_out, v_out2)
            if extract_graded_frame(src, f_out, t0 + clip_dur * 0.45, force):
                stats["frames"] += 1
                unassigned_frames.append(f_out)
                if f_out2 and (force or not f_out2.exists()):
                    f_out2.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(f_out, f_out2)

    # Round-robin copy a share of unassigned frames into every artist so packs aren't empty
    orphans = [
        p
        for p in (root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "FRAMES").glob("*.jpg")
        if p.is_file()
    ]
    # Also share stabilized unassigned clips lightly
    orphan_vids = list((root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "VIDEOS").glob("*.mp4"))
    rr_frames = distribute_round_robin(orphans[: max(len(artists) * 4, 0)], artists)
    rr_vids = distribute_round_robin(orphan_vids[: max(len(artists) * 2, 0)], artists)
    for folder, paths in rr_frames.items():
        dest_dir = root / "DRIVE_UPLOAD" / "ARTISTS" / folder / "03_FRAMES_FROM_VIDEO" / "_needs_sort"
        dest_dir.mkdir(parents=True, exist_ok=True)
        for p in paths:
            dest = dest_dir / p.name
            if not dest.exists():
                shutil.copy2(p, dest)
    for folder, paths in rr_vids.items():
        dest_dir = root / "DRIVE_UPLOAD" / "ARTISTS" / folder / "01_VIDEOS_STABILIZED" / "_needs_sort"
        dest_dir.mkdir(parents=True, exist_ok=True)
        for p in paths:
            dest = dest_dir / p.name
            if not dest.exists():
                shutil.copy2(p, dest)

    stats["stabilize_mode"] = mode
    return stats


def process_photos(photos: list[Path], seed: dict[str, Any], root: Path, force: bool) -> dict[str, Any]:
    artists = seed.get("artists") or []
    stats = {"graded": 0, "matched": 0, "unassigned": 0}
    for src in photos[:200]:
        artist = match_artist(src, artists)
        stem = src.stem[:50]
        if artist:
            folder = artist_folder_name(artist)
            out = root / "DRIVE_UPLOAD" / "ARTISTS" / folder / "02_PHOTOS_EDITED" / f"{stem}_edit.jpg"
            out2 = root / "ARTISTS" / folder / "02_PHOTOS_EDITED" / f"{stem}_edit.jpg"
            stats["matched"] += 1
        else:
            out = root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "PHOTOS" / f"{stem}_edit.jpg"
            out2 = None
            stats["unassigned"] += 1
        if grade_photo(src, out, force):
            stats["graded"] += 1
            if out2 and (force or not out2.exists()):
                out2.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(out, out2)

    # Seed each artist pack with graded copies of shared event stills if empty
    for a in artists:
        folder = artist_folder_name(a)
        dest = root / "DRIVE_UPLOAD" / "ARTISTS" / folder / "02_PHOTOS_EDITED"
        if not any(dest.glob("*.jpg")):
            # pull a few from unassigned
            pool = list((root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "PHOTOS").glob("*.jpg"))[:3]
            ns = dest / "_needs_sort"
            ns.mkdir(parents=True, exist_ok=True)
            for p in pool:
                d = ns / p.name
                if not d.exists():
                    shutil.copy2(p, d)
    return stats


def copy_recap_if_present(root: Path) -> None:
    export = root / "EXPORT" / "BOTANICA_90s_RECAP_9x16.mp4"
    dest_dir = root / "DRIVE_UPLOAD" / "EVENT"
    dest_dir.mkdir(parents=True, exist_ok=True)
    if export.exists():
        dest = dest_dir / export.name
        if not dest.exists() or dest.stat().st_size != export.stat().st_size:
            shutil.copy2(export, dest)


def default_root() -> Path:
    env = os.environ.get("BOTANICA_ROOT")
    if env:
        return Path(env)
    for c in (
        Path(r"D:/Wakungo_Content_Studio/Botanica"),
        Path("/mnt/d/Wakungo_Content_Studio/Botanica"),
        Path.cwd() / "Botanica",
    ):
        if c.exists():
            return c
    return Path(r"D:/Wakungo_Content_Studio/Botanica")


def main() -> int:
    ap = argparse.ArgumentParser(description="Botanica artist Drive pack (stabilize + photos)")
    ap.add_argument("--root", type=Path, default=None)
    ap.add_argument("--repo", type=Path, default=None)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--clips-per-source", type=int, default=3)
    args = ap.parse_args()

    if not which("ffmpeg") or not which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe required")
        return 2

    root = args.root or default_root()
    repo = args.repo or Path(__file__).resolve().parents[2]
    print(f"Root: {root}")
    if not root.exists():
        print("BLOCKER: Botanica root not found — run on the PC with D:")
        return 3

    seed = load_seed(repo)
    work = root / "00_work" / "artist_pack_tmp"
    work.mkdir(parents=True, exist_ok=True)

    print("01 — Artist folders (incl. Mistah Isaac + Edo)…")
    ensure_artist_trees(root, seed, repo)

    print("02 — Inventory…")
    videos, photos = inventory(root)
    print(f"   videos={len(videos)} photos={len(photos)}")

    print("03 — Stabilize clips + extract graded frames…")
    vstats = process_videos(
        videos, seed, root, work, args.force, clips_per_source=args.clips_per_source
    )
    print("   ", vstats)

    print("04 — Grade photos…")
    pstats = process_photos(photos, seed, root, args.force)
    print("   ", pstats)

    print("05 — Event recap into DRIVE_UPLOAD/EVENT…")
    copy_recap_if_present(root)

    drive = root / "DRIVE_UPLOAD"
    write_upload_readme(drive, seed)
    manifest = {
        "created_at": utc_now(),
        "root": str(root),
        "video_stats": vstats,
        "photo_stats": pstats,
        "artists": [artist_folder_name(a) for a in seed.get("artists", [])],
        "upload_root": str(drive),
    }
    (drive / "MANIFEST.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (root / "ANALYSIS").mkdir(exist_ok=True)
    (root / "ANALYSIS" / "drive_pack_manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )

    print(f"\nDONE → {drive}")
    print("Upload folder: DRIVE_UPLOAD/  (see README_UPLOAD.txt)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
