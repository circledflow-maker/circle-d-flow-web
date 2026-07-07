#!/usr/bin/env python3
"""
DCIM media pipeline for F:\\DCIM
- Mirrors originals into F:\\DCIM\\_compressed\\<relative-path> (visually lossless)
- Edited concert grade -> F:\\DCIM\\_edited\\...
- YouTube-ready Wakungo export -> F:\\DCIM\\_youtube_ready\\wakungo\\
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

DCIM_ROOT = Path(r"F:\DCIM")
COMPRESSED_ROOT = DCIM_ROOT / "_compressed"
EDITED_ROOT = DCIM_ROOT / "_edited"
YOUTUBE_ROOT = DCIM_ROOT / "_youtube_ready"
LOG = DCIM_ROOT / "_pipeline_log.jsonl"

IMG_EXT = {".jpg", ".jpeg", ".png"}
VID_EXT = {".mov", ".mp4", ".m4v"}
SKIP_DIRS = {"_compressed", "_edited", "_youtube_ready", "__pycache__"}
SKIP_EXT = {".dat", ".tmp", ".jsonl"}

WAKUNGO_KEY_PHOTOS = ("DSC_9375.JPG", "DSC_9395.JPG", "DSC_9441.JPG")
WAKUNGO_HERO_VIDEO = "DSC_9449.MOV"
WAKUNGO_CLIP_VIDEOS = (
    "DSC_9448.MOV",
    "DSC_9449.MOV",
    "DSC_9450.MOV",
    "DSC_9433.MOV",
    "DSC_9434.MOV",
    "DSC_9410.MOV",
)


def log(entry: dict) -> None:
    entry["ts"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(json.dumps(entry, ensure_ascii=False), flush=True)


def rel_path(path: Path) -> Path:
    return path.relative_to(DCIM_ROOT)


def out_compressed(path: Path) -> Path:
    return COMPRESSED_ROOT / rel_path(path)


def out_edited(path: Path) -> Path:
    return EDITED_ROOT / rel_path(path)


def iter_media(root: Path):
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.suffix.lower() in SKIP_EXT:
            continue
        if p.name.startswith("_") or ".__tmp__." in p.name:
            continue
        ext = p.suffix.lower()
        if ext in IMG_EXT or ext in VID_EXT:
            yield p


def run(cmd: list[str], timeout: int = 7200) -> None:
    subprocess.run(cmd, check=True, timeout=timeout)


def _video_codec(path: Path) -> str | None:
    try:
        out = subprocess.run(
            [
                "ffprobe", "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream=codec_name", "-of", "csv=p=0", str(path),
            ],
            capture_output=True, text=True, timeout=60, check=True,
        )
        return (out.stdout or "").strip().lower() or None
    except Exception:
        return None


def compress_jpg(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    orig = src.stat().st_size
    tmp = dst.parent / f"{dst.stem}.__tmp__{dst.suffix}"

    jpegtran = None
    for candidate in ("jpegtran", r"C:\libjpeg-turbo64\bin\jpegtran.exe"):
        try:
            subprocess.run([candidate, "-version"], capture_output=True, check=True, timeout=5)
            jpegtran = candidate
            break
        except Exception:
            continue

    try:
        if jpegtran:
            run([jpegtran, "-optimize", "-copy", "all", "-outfile", str(tmp), str(src)], timeout=180)
        else:
            run(
                ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(src), "-q:v", "1", str(tmp)],
                timeout=180,
            )
        if not tmp.exists():
            raise RuntimeError("no jpg output")
        new = tmp.stat().st_size
        if new <= orig:
            tmp.replace(dst)
            status = "compressed" if new < orig else "copied_optimal"
        else:
            import shutil
            shutil.copy2(src, dst)
            tmp.unlink(missing_ok=True)
            status = "copied_smaller_original"
            new = orig
        log({"phase": "compress", "file": str(rel_path(src)), "type": "jpg", "status": status, "before": orig, "after": new})
    except Exception as e:
        tmp.unlink(missing_ok=True)
        import shutil
        shutil.copy2(src, dst)
        log({"phase": "compress", "file": str(rel_path(src)), "type": "jpg", "status": "fallback_copy", "error": str(e)})


def compress_video(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    orig = src.stat().st_size
    codec = _video_codec(src)
    tmp = dst.parent / f"{dst.stem}.__tmp__{dst.suffix}"

    if codec in ("hevc", "h265"):
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src), "-map", "0", "-c", "copy", "-movflags", "+faststart", str(tmp),
        ]
    else:
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src),
            "-c:v", "libx265", "-crf", "20", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-tag:v", "hvc1",
            "-c:a", "aac", "-b:a", "160k",
            "-movflags", "+faststart", str(tmp),
        ]

    try:
        run(cmd, timeout=7200)
        if not tmp.exists() or tmp.stat().st_size == 0:
            raise RuntimeError("empty video output")
        new = tmp.stat().st_size
        if new < orig * 0.995:
            tmp.replace(dst)
            status = "compressed"
        else:
            import shutil
            shutil.copy2(src, dst)
            tmp.unlink(missing_ok=True)
            status = "copied"
            new = orig
        log({"phase": "compress", "file": str(rel_path(src)), "type": "mov", "codec": codec, "status": status, "before": orig, "after": new})
    except Exception as e:
        tmp.unlink(missing_ok=True)
        import shutil
        shutil.copy2(src, dst)
        log({"phase": "compress", "file": str(rel_path(src)), "type": "mov", "status": "fallback_copy", "error": str(e)})


def grade_concert_photo(src: Path, dst: Path, crop_sides: bool = False) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    base = Image.open(src).convert("RGB")
    img = base.copy()

    if crop_sides:
        w, h = img.size
        cut = int(w * 0.06)
        img = img.crop((cut, 0, w - cut, h))
        base = img.copy()

    tinted = ImageEnhance.Color(img).enhance(0.92)
    tinted = ImageOps.colorize(ImageOps.grayscale(tinted), "#0a1428", "#f0c878")
    img = Image.blend(base, tinted, 0.35)

    img = ImageEnhance.Brightness(img).enhance(1.04)
    img = ImageEnhance.Contrast(img).enhance(1.08)
    img = ImageEnhance.Sharpness(img).enhance(1.15)
    img = img.filter(ImageFilter.GaussianBlur(radius=0.4))
    img = ImageEnhance.Sharpness(img).enhance(1.25)

    img.save(dst, "JPEG", quality=95, optimize=True, subsampling=0)
    log({"phase": "edit", "file": str(rel_path(src)), "out": str(dst.relative_to(DCIM_ROOT)), "status": "graded"})


def grade_wakungo_video(src: Path, dst: Path, youtube: bool = False) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    vf = (
        "scale=1920:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
        "eq=brightness=0.03:contrast=1.08:saturation=0.95:gamma=1.02,"
        "colorbalance=rs=0.02:gs=-0.02:bs=0.06:rm=0.03:gm=-0.01:bm=0.04,"
        "unsharp=3:3:0.6:3:3:0.0,"
        "hqdn3d=2:1:3:2"
    )
    if not youtube:
        vf = (
            "eq=brightness=0.03:contrast=1.08:saturation=0.95,"
            "colorbalance=bs=0.05:bm=0.03,"
            "unsharp=3:3:0.5:3:3:0.0,"
            "hqdn3d=1.5:1:2:1.5"
        )

    af = "highpass=f=80,lowpass=f=12000,equalizer=f=120:t=q:w=1.5:g=-3,equalizer=f=2500:t=q:w=1.2:g=2"

    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src),
        "-vf", f"{vf},deshake",
        "-af", af,
        "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(dst),
    ]
    if youtube:
        cmd[6:6] = ["-t", "90"]

    try:
        run(cmd, timeout=10800)
        log({"phase": "edit", "file": str(rel_path(src)), "out": str(dst.relative_to(DCIM_ROOT)), "status": "video_graded", "youtube": youtube})
    except Exception as e:
        log({"phase": "edit", "file": str(rel_path(src)), "status": "error", "error": str(e)})


def build_youtube_montage(clips: list[Path], dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as tf:
        list_path = Path(tf.name)
        for clip in clips:
            if clip.exists():
                safe = str(clip).replace("'", "'\\''")
                tf.write(f"file '{safe}'\n")

    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(list_path),
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30",
        "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart",
        str(dst),
    ]
    try:
        run(cmd, timeout=14400)
        log({"phase": "youtube", "out": str(dst.relative_to(DCIM_ROOT)), "clips": [c.name for c in clips if c.exists()], "status": "done"})
    except Exception as e:
        log({"phase": "youtube", "status": "error", "error": str(e)})
    finally:
        list_path.unlink(missing_ok=True)


def cmd_compress_all() -> int:
    files = list(iter_media(DCIM_ROOT))
    log({"event": "compress_start", "count": len(files)})
    for i, src in enumerate(files, 1):
        dst = out_compressed(src)
        if dst.exists() and dst.stat().st_size > 0:
            continue
        print(f"[compress {i}/{len(files)}] {rel_path(src)}", flush=True)
        ext = src.suffix.lower()
        if ext in IMG_EXT:
            compress_jpg(src, dst)
        elif ext in VID_EXT:
            compress_video(src, dst)
    log({"event": "compress_done", "count": len(files)})
    return 0


def cmd_wakungo() -> int:
    wakungo = DCIM_ROOT / "105NZ502" / "Wakungo"
    if not wakungo.is_dir():
        log({"event": "wakungo_missing", "path": str(wakungo)})
        return 1

    for name in WAKUNGO_KEY_PHOTOS:
        src = wakungo / name
        if not src.exists():
            log({"phase": "edit", "file": name, "status": "missing"})
            continue
        grade_concert_photo(src, out_edited(src), crop_sides=(name == "DSC_9375.JPG"))

    hero = wakungo / WAKUNGO_HERO_VIDEO
    if hero.exists():
        grade_wakungo_video(hero, EDITED_ROOT / rel_path(hero).with_suffix(".mp4"), youtube=False)
        grade_wakungo_video(hero, YOUTUBE_ROOT / "wakungo" / "DSC_9449_youtube.mp4", youtube=True)

    edited_clips = []
    for name in WAKUNGO_CLIP_VIDEOS:
        src = wakungo / name
        if not src.exists():
            continue
        out = EDITED_ROOT / rel_path(src).with_suffix(".mp4")
        if not out.exists():
            grade_wakungo_video(src, out, youtube=False)
        edited_clips.append(out if out.exists() else src)

    montage_out = YOUTUBE_ROOT / "wakungo" / "Wakungo_YouTube_Ready.mp4"
    if not montage_out.exists():
        build_youtube_montage(edited_clips, montage_out)

    log({"event": "wakungo_done"})
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="DCIM compress + Wakungo edit pipeline")
    parser.add_argument("command", choices=["compress", "wakungo", "all"], nargs="?", default="all")
    args = parser.parse_args()

    if not DCIM_ROOT.is_dir():
        print(f"DCIM not found: {DCIM_ROOT}", file=sys.stderr)
        return 1

    if args.command in ("compress", "all"):
        cmd_compress_all()
    if args.command in ("wakungo", "all"):
        cmd_wakungo()
    return 0


if __name__ == "__main__":
    sys.exit(main())
