#!/usr/bin/env python3
"""
Organize Botanica / Wako Kungo footage into artist folders with face matching.

Run on the Windows PC that has D: (permission granted by owner):

  cd D:\\circle-d-flow-web
  pip install opencv-python-headless numpy Pillow
  python scripts/botanica_90s_recap/organize_artists_face.py --force

Focus source (default):
  D:\\Wakungo_Content_Studio\\Botanica\\Wako Kungo

Outputs (Drive-ready):
  Botanica\\DRIVE_UPLOAD\\ARTISTS\\<folder>\\
    00_REF\\
    01_VIDEOS_PERFORMANCE\\   stabilized clips where face matched
    02_PORTRAITS\\            graded stills / portraits
    03_FRAMES\\               graded frames from video
  Botanica\\ARTISTS\\…        mirror
  Botanica\\DRIVE_UPLOAD\\_UNASSIGNED_REVIEW\\
  Then cleanup of empty / redundant folders.
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
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import numpy as np

try:
    import cv2
except ImportError:
    print("ERROR: pip install opencv-python-headless numpy Pillow")
    sys.exit(2)

from PIL import Image

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

# Keep only these Drive subfolders (cleanup removes empty legacy ones)
KEEP_SUBS = (
    "00_REF",
    "01_VIDEOS_PERFORMANCE",
    "02_PORTRAITS",
    "03_FRAMES",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(">", " ".join(str(c) for c in cmd[:12]), "…" if len(cmd) > 12 else "")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def load_seed(repo: Path) -> dict[str, Any]:
    p = repo / "scripts" / "botanica_90s_recap" / "artist_seed.json"
    return json.loads(p.read_text(encoding="utf-8"))


def artist_folder(a: dict[str, Any]) -> str:
    return a.get("folder") or a["id"]


def face_cascade() -> cv2.CascadeClassifier:
    path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    casc = cv2.CascadeClassifier(path)
    if casc.empty():
        raise RuntimeError("OpenCV face cascade missing")
    return casc


def detect_faces_bgr(img_bgr: np.ndarray, casc: cv2.CascadeClassifier) -> list[tuple[int, int, int, int]]:
    if img_bgr is None or img_bgr.size == 0:
        return []
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = casc.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(64, 64))
    # largest first
    boxes = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
    boxes.sort(key=lambda b: b[2] * b[3], reverse=True)
    return boxes


def face_descriptor(img_bgr: np.ndarray, box: tuple[int, int, int, int]) -> Optional[np.ndarray]:
    x, y, w, h = box
    pad = int(0.15 * max(w, h))
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(img_bgr.shape[1], x + w + pad)
    y1 = min(img_bgr.shape[0], y + h + pad)
    crop = img_bgr[y0:y1, x0:x1]
    if crop.size == 0:
        return None
    face = cv2.resize(crop, (96, 96), interpolation=cv2.INTER_AREA)
    face = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
    # concatenated histograms — robust enough for stage/ref matching without dlib
    hist_h = cv2.calcHist([face], [0], None, [32], [0, 180])
    hist_s = cv2.calcHist([face], [1], None, [32], [0, 256])
    hist_v = cv2.calcHist([face], [2], None, [32], [0, 256])
    desc = np.concatenate([hist_h, hist_s, hist_v]).flatten().astype(np.float32)
    desc /= np.linalg.norm(desc) + 1e-6
    # also add small grayscale vector for structure
    g = cv2.cvtColor(cv2.resize(crop, (32, 32)), cv2.COLOR_BGR2GRAY).astype(np.float32).flatten()
    g = (g - g.mean()) / (g.std() + 1e-6)
    g = g / (np.linalg.norm(g) + 1e-6)
    return np.concatenate([desc * 0.65, g * 0.35])


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / ((np.linalg.norm(a) * np.linalg.norm(b)) + 1e-6))


def load_image_bgr(path: Path) -> Optional[np.ndarray]:
    data = np.fromfile(str(path), dtype=np.uint8)
    if data.size == 0:
        return None
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def build_artist_galleries(seed: dict[str, Any], repo: Path, casc: cv2.CascadeClassifier) -> dict[str, list[np.ndarray]]:
    galleries: dict[str, list[np.ndarray]] = {}
    for a in seed.get("artists", []):
        folder = artist_folder(a)
        galleries[folder] = []
        ref = a.get("ref_image")
        paths: list[Path] = []
        if ref:
            paths.append(repo / ref)
        # also any files already in ARTISTS/*/00_REF if present later
        for p in paths:
            if not p.exists():
                continue
            img = load_image_bgr(p)
            if img is None:
                continue
            boxes = detect_faces_bgr(img, casc)
            if not boxes:
                # flyer / stylized — use center crop as weak descriptor
                h, w = img.shape[:2]
                box = (w // 4, h // 8, w // 2, int(h * 0.55))
                boxes = [box]
            for box in boxes[:2]:
                d = face_descriptor(img, box)
                if d is not None:
                    galleries[folder].append(d)
        print(f"   gallery {folder}: {len(galleries[folder])} face desc (ref={bool(ref)})")
    return galleries


def match_artist(
    desc: np.ndarray,
    galleries: dict[str, list[np.ndarray]],
    threshold: float = 0.42,
) -> Optional[tuple[str, float]]:
    best_folder = None
    best_score = -1.0
    for folder, gal in galleries.items():
        if not gal:
            continue
        score = max(cosine(desc, g) for g in gal)
        if score > best_score:
            best_score = score
            best_folder = folder
    if best_folder is None or best_score < threshold:
        return None
    return best_folder, best_score


def match_by_alias(path: Path, artists: list[dict[str, Any]]) -> Optional[str]:
    hay = str(path).lower().replace("\\", "/")
    scored: list[tuple[int, str]] = []
    for a in artists:
        aliases = list(a.get("aliases") or []) + [a.get("handle", ""), a.get("display_name", ""), a.get("short_name", "")]
        for al in aliases:
            if not al:
                continue
            token = str(al).lower()
            if token and token in hay:
                scored.append((len(token), artist_folder(a)))
    if not scored:
        return None
    scored.sort(reverse=True)
    return scored[0][1]


def inventory_sources(root: Path, prefer: Optional[Path]) -> tuple[list[Path], list[Path]]:
    videos: list[Path] = []
    photos: list[Path] = []
    roots = []
    if prefer and prefer.exists():
        roots.append(prefer)
    roots.append(root)

    seen: set[str] = set()
    for base in roots:
        for p in sorted(base.rglob("*")):
            if not p.is_file():
                continue
            try:
                rel = p.relative_to(root)
                if any(part in SKIP_DIR_NAMES for part in rel.parts):
                    continue
            except ValueError:
                # under prefer which is inside root usually
                if any(part in SKIP_DIR_NAMES for part in p.parts):
                    continue
            key = str(p.resolve()).lower()
            if key in seen:
                continue
            seen.add(key)
            ext = p.suffix.lower()
            if "concept9-16" in p.name.lower():
                continue
            if ext in VIDEO_EXT:
                videos.append(p)
            elif ext in PHOTO_EXT:
                photos.append(p)
    return videos, photos


def ensure_artist_dirs(root: Path, seed: dict[str, Any], repo: Path) -> None:
    for a in seed.get("artists", []):
        folder = artist_folder(a)
        for base in (root / "ARTISTS" / folder, root / "DRIVE_UPLOAD" / "ARTISTS" / folder):
            for sub in KEEP_SUBS:
                (base / sub).mkdir(parents=True, exist_ok=True)
            meta = {**a, "updated_at": utc_now()}
            (base / "artist.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
            ref = a.get("ref_image")
            if ref:
                src = repo / ref
                if src.exists():
                    dest = base / "00_REF" / src.name
                    if not dest.exists():
                        shutil.copy2(src, dest)
    for sub in ("VIDEOS", "PHOTOS", "FRAMES"):
        (root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / sub).mkdir(parents=True, exist_ok=True)


def photo_grade_bgr(img: np.ndarray) -> np.ndarray:
    """Warm botanical grade in OpenCV."""
    out = cv2.bilateralFilter(img, 5, 40, 40)
    out = cv2.convertScaleAbs(out, alpha=1.08, beta=8)
    hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] *= 0.94
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.03, 0, 255)
    out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    # slight warm push on red channel
    b, g, r = cv2.split(out)
    r = np.clip(r.astype(np.int16) + 6, 0, 255).astype(np.uint8)
    b = np.clip(b.astype(np.int16) - 4, 0, 255).astype(np.uint8)
    return cv2.merge([b, g, r])


def save_jpg(path: Path, img_bgr: np.ndarray, quality: int = 92) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ok, buf = cv2.imencode(".jpg", img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if ok:
        buf.tofile(str(path))


def ffprobe_duration(path: Path) -> float:
    try:
        r = run(
            [
                "ffprobe",
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                str(path),
            ]
        )
        return float(json.loads(r.stdout or "{}").get("format", {}).get("duration") or 0)
    except Exception:
        return 0.0


def stabilize_clip(src: Path, out: Path, start: float, dur: float, force: bool) -> bool:
    if out.exists() and out.stat().st_size > 40_000 and not force:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    vf = (
        "deshake=rx=32:ry=32:edge=mirror,"
        "hqdn3d=1.0:1.0:2.5:2.5,"
        "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease,"
        "eq=contrast=1.06:brightness=0.03:saturation=0.95"
    )
    try:
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
        print("WARN stabilize:", src.name, (e.stderr or "")[-200:])
        return False


def extract_frame_ffmpeg(src: Path, t: float, tmp: Path) -> Optional[np.ndarray]:
    tmp.parent.mkdir(parents=True, exist_ok=True)
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
                "-q:v",
                "2",
                str(tmp),
            ]
        )
        return load_image_bgr(tmp) if tmp.exists() else None
    except subprocess.CalledProcessError:
        return None


def place_for_artist(root: Path, folder: str, kind: str, src_file: Path, force: bool) -> Path:
    """kind: video|portrait|frame"""
    sub = {
        "video": "01_VIDEOS_PERFORMANCE",
        "portrait": "02_PORTRAITS",
        "frame": "03_FRAMES",
    }[kind]
    dests = [
        root / "DRIVE_UPLOAD" / "ARTISTS" / folder / sub / src_file.name,
        root / "ARTISTS" / folder / sub / src_file.name,
    ]
    primary = dests[0]
    primary.parent.mkdir(parents=True, exist_ok=True)
    if force or not primary.exists():
        if src_file.resolve() != primary.resolve():
            shutil.copy2(src_file, primary)
    # mirror
    m = dests[1]
    m.parent.mkdir(parents=True, exist_ok=True)
    if force or not m.exists():
        shutil.copy2(primary, m)
    return primary


def process_videos(
    videos: list[Path],
    root: Path,
    work: Path,
    galleries: dict[str, list[np.ndarray]],
    artists: list[dict[str, Any]],
    casc: cv2.CascadeClassifier,
    force: bool,
    samples_per_video: int = 8,
) -> dict[str, Any]:
    stats = defaultdict(int)
    match_log: list[dict[str, Any]] = []

    # longest first
    scored = [(ffprobe_duration(v), v) for v in videos]
    scored.sort(reverse=True)

    for dur, src in scored[:60]:
        if dur < 2.5:
            continue
        alias_folder = match_by_alias(src, artists)
        # sample mid band
        hits: dict[str, list[float]] = defaultdict(list)
        for k in range(samples_per_video):
            t = max(1.0, dur * (0.15 + 0.7 * (k + 0.5) / samples_per_video))
            tmp = work / "frames" / f"{src.stem[:30]}_{k:02d}.jpg"
            img = extract_frame_ffmpeg(src, t, tmp)
            if img is None:
                continue
            boxes = detect_faces_bgr(img, casc)
            folder = alias_folder
            score = None
            if boxes:
                d = face_descriptor(img, boxes[0])
                if d is not None:
                    m = match_artist(d, galleries, threshold=0.40)
                    if m:
                        folder, score = m
            if folder:
                hits[folder].append(t)
                graded = photo_grade_bgr(img)
                out_frame = work / "graded" / f"{src.stem[:30]}_{k:02d}_{folder}.jpg"
                save_jpg(out_frame, graded)
                place_for_artist(root, folder, "frame", out_frame, force)
                # portraits = larger face share
                if boxes and boxes[0][2] * boxes[0][3] > 0.04 * img.shape[0] * img.shape[1]:
                    place_for_artist(root, folder, "portrait", out_frame, force)
                    stats["portraits"] += 1
                stats["frames"] += 1
                match_log.append(
                    {
                        "source": str(src),
                        "t": t,
                        "folder": folder,
                        "score": score,
                        "alias": alias_folder == folder,
                    }
                )
            else:
                # keep a few unassigned frames for review
                if k % 3 == 0:
                    graded = photo_grade_bgr(img)
                    out_u = root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "FRAMES" / f"{src.stem[:30]}_{k:02d}.jpg"
                    save_jpg(out_u, graded)
                    stats["unassigned_frames"] += 1

        # stabilize best windows per matched artist
        for folder, times in hits.items():
            # pick up to 3 distinct moments
            times = sorted(set(round(t, 1) for t in times))[:3]
            for i, t0 in enumerate(times):
                start = max(0.5, t0 - 1.2)
                out = work / "clips" / f"{src.stem[:28]}_{folder[-12:]}_{i:02d}_stable.mp4"
                if stabilize_clip(src, out, start, 3.8, force):
                    place_for_artist(root, folder, "video", out, force)
                    stats["videos"] += 1
                    stats[f"artist:{folder}"] += 1

    (root / "ANALYSIS").mkdir(exist_ok=True)
    (root / "ANALYSIS" / "face_match_log.json").write_text(
        json.dumps({"created_at": utc_now(), "matches": match_log[:2000], "stats": dict(stats)}, indent=2),
        encoding="utf-8",
    )
    return dict(stats)


def process_photos(
    photos: list[Path],
    root: Path,
    galleries: dict[str, list[np.ndarray]],
    artists: list[dict[str, Any]],
    casc: cv2.CascadeClassifier,
    force: bool,
) -> dict[str, Any]:
    stats = defaultdict(int)
    for src in photos[:300]:
        img = load_image_bgr(src)
        if img is None:
            continue
        folder = match_by_alias(src, artists)
        boxes = detect_faces_bgr(img, casc)
        score = None
        if boxes:
            d = face_descriptor(img, boxes[0])
            if d is not None:
                m = match_artist(d, galleries, threshold=0.40)
                if m:
                    folder, score = m
        graded = photo_grade_bgr(img)
        stem = re.sub(r"[^\w\-]+", "_", src.stem)[:50]
        tmp = root / "00_work" / "artist_face_tmp" / "photos" / f"{stem}_edit.jpg"
        save_jpg(tmp, graded)
        if folder:
            place_for_artist(root, folder, "portrait", tmp, force)
            place_for_artist(root, folder, "frame", tmp, force)
            stats["matched_photos"] += 1
        else:
            dest = root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW" / "PHOTOS" / f"{stem}_edit.jpg"
            save_jpg(dest, graded)
            stats["unassigned_photos"] += 1
    return dict(stats)


def cleanup_tree(root: Path) -> dict[str, int]:
    """Remove empty dirs, legacy empty subs, redundant _needs_sort if parent has real files."""
    removed = 0
    drive = root / "DRIVE_UPLOAD" / "ARTISTS"
    artists = root / "ARTISTS"
    legacy = {
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
        "_needs_sort",
    }

    for base in (drive, artists):
        if not base.exists():
            continue
        for artist_dir in list(base.iterdir()):
            if not artist_dir.is_dir():
                continue
            # migrate legacy → new if new empty
            for old, new in (
                ("01_VIDEOS_STABILIZED", "01_VIDEOS_PERFORMANCE"),
                ("02_PHOTOS_EDITED", "02_PORTRAITS"),
                ("03_FRAMES_FROM_VIDEO", "03_FRAMES"),
                ("PORTRAIT", "02_PORTRAITS"),
                ("PERFORMANCE", "01_VIDEOS_PERFORMANCE"),
                ("STILLS", "03_FRAMES"),
            ):
                op = artist_dir / old
                np_ = artist_dir / new
                if op.exists():
                    np_.mkdir(parents=True, exist_ok=True)
                    for f in op.rglob("*"):
                        if f.is_file():
                            dest = np_ / f.relative_to(op)
                            dest.parent.mkdir(parents=True, exist_ok=True)
                            if not dest.exists():
                                shutil.move(str(f), str(dest))
            # remove empty legacy dirs
            for name in legacy:
                p = artist_dir / name
                if p.exists() and p.is_dir():
                    # if empty (or only empty nested), remove
                    has_files = any(x.is_file() for x in p.rglob("*"))
                    if not has_files:
                        shutil.rmtree(p, ignore_errors=True)
                        removed += 1
                    elif name == "_needs_sort":
                        # if parent already has non-needs_sort media, drop needs_sort duplicates
                        parent_files = [
                            x
                            for x in (artist_dir / "01_VIDEOS_PERFORMANCE").glob("*")
                            if x.is_file()
                        ] + [
                            x for x in (artist_dir / "02_PORTRAITS").glob("*") if x.is_file()
                        ]
                        if len(parent_files) >= 3:
                            shutil.rmtree(p, ignore_errors=True)
                            removed += 1

    # prune empty dirs bottom-up under DRIVE_UPLOAD/ARTISTS and ARTISTS
    for base in (drive, artists, root / "DRIVE_UPLOAD" / "_UNASSIGNED_REVIEW"):
        if not base.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(base, topdown=False):
            p = Path(dirpath)
            if p == base:
                continue
            try:
                if not any(p.iterdir()):
                    p.rmdir()
                    removed += 1
            except OSError:
                pass

    return {"removed_empty_or_legacy": removed}


def write_readme(root: Path, seed: dict[str, Any], stats: dict[str, Any]) -> None:
    drive = root / "DRIVE_UPLOAD"
    lines = [
        "BOTANICA — Drive upload pack (face-organized)",
        f"Generated: {utc_now()}",
        f"Source focus: Wako Kungo + Botanica media",
        "",
        "Per artist:",
        "  00_REF/                 Instagram / flyer references",
        "  01_VIDEOS_PERFORMANCE/  deshaken performance clips (face-matched)",
        "  02_PORTRAITS/           graded portraits / close faces",
        "  03_FRAMES/              graded frames from video",
        "",
        "Artists:",
    ]
    for a in seed.get("artists", []):
        folder = artist_folder(a)
        v = len(list((drive / "ARTISTS" / folder / "01_VIDEOS_PERFORMANCE").glob("*.mp4"))) if (drive / "ARTISTS" / folder).exists() else 0
        p = len(list((drive / "ARTISTS" / folder / "02_PORTRAITS").glob("*.jpg"))) if (drive / "ARTISTS" / folder).exists() else 0
        f = len(list((drive / "ARTISTS" / folder / "03_FRAMES").glob("*.jpg"))) if (drive / "ARTISTS" / folder).exists() else 0
        lines.append(f"  - {folder}  videos={v} portraits={p} frames={f}")
    lines += ["", "Stats:", json.dumps(stats, indent=2), ""]
    (drive / "README_UPLOAD.txt").write_text("\n".join(lines), encoding="utf-8")
    (drive / "MANIFEST.json").write_text(
        json.dumps({"created_at": utc_now(), "stats": stats}, indent=2), encoding="utf-8"
    )


def default_root() -> Path:
    env = os.environ.get("BOTANICA_ROOT")
    if env:
        return Path(env)
    for c in (
        Path(r"D:/Wakungo_Content_Studio/Botanica"),
        Path("/mnt/d/Wakungo_Content_Studio/Botanica"),
    ):
        if c.exists():
            return c
    return Path(r"D:/Wakungo_Content_Studio/Botanica")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=None)
    ap.add_argument("--repo", type=Path, default=None)
    ap.add_argument(
        "--source",
        type=Path,
        default=None,
        help="Prefer this folder first (default: <root>/Wako Kungo)",
    )
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--samples", type=int, default=8)
    args = ap.parse_args()

    if not which("ffmpeg") or not which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe on PATH required")
        return 2

    root = args.root or default_root()
    repo = args.repo or Path(__file__).resolve().parents[2]
    source = args.source or (root / "Wako Kungo")
    print(f"Root: {root}")
    print(f"Prefer source: {source}  exists={source.exists()}")
    if not root.exists():
        print("BLOCKER: Botanica root missing — run on PC with D:")
        return 3

    seed = load_seed(repo)
    work = root / "00_work" / "artist_face_tmp"
    work.mkdir(parents=True, exist_ok=True)

    print("01 — Artist folders…")
    ensure_artist_dirs(root, seed, repo)

    print("02 — Build face galleries from IG refs…")
    casc = face_cascade()
    galleries = build_artist_galleries(seed, repo, casc)

    print("03 — Inventory (Wako Kungo first)…")
    videos, photos = inventory_sources(root, source if source.exists() else None)
    print(f"   videos={len(videos)} photos={len(photos)}")
    if not videos and not photos:
        print("BLOCKER: no media found under Botanica / Wako Kungo")
        return 4

    print("04 — Face-match videos → stabilize + portraits/frames…")
    vstats = process_videos(
        videos, root, work, galleries, seed.get("artists") or [], casc, args.force, args.samples
    )
    print("   ", vstats)

    print("05 — Face-match / grade photos…")
    pstats = process_photos(photos, root, galleries, seed.get("artists") or [], casc, args.force)
    print("   ", pstats)

    print("06 — Cleanup empty / legacy folders…")
    cstats = cleanup_tree(root)
    print("   ", cstats)

    stats = {"videos": vstats, "photos": pstats, "cleanup": cstats}
    write_readme(root, seed, stats)
    print(f"\nDONE → {root / 'DRIVE_UPLOAD'}")
    print("Open DRIVE_UPLOAD\\ARTISTS — each artist should have videos/portraits/frames.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
