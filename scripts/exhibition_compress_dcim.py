#!/usr/bin/env python3
"""Compress F:\\DCIM\\106NZ502 → D:\\D Circle on tour\\exhibition (playable H.264 + JPG)."""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

SRC = Path(r"F:\DCIM\106NZ502")
DEST = Path(r"D:\D Circle on tour\exhibition")
VID_OUT = DEST / "01_videos"
PHOTO_OUT = DEST / "02_photos"
LOG = DEST / "00_logs" / "compress.log"
TMP = Path(r"D:\D Circle on tour\exhibition\00_work\tmp")

# Playable everywhere (HEVC→H.264). Light grade for exhibition screens.
VF = (
    "scale=1920:1080:force_original_aspect_ratio=decrease,"
    "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
    "hqdn3d=1.5:1.2:2.5:2.0,"
    "eq=contrast=1.06:brightness=0.015:saturation=0.96:gamma=1.04,"
    "format=yuv420p"
)
AF = "highpass=f=50,afftdn=nf=-22,alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"
CRF = "19"
PRESET = "veryfast"


def log(msg: str) -> None:
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    print(line, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def probe_ok(p: Path) -> bool:
    if not p.exists() or p.stat().st_size < 40_000:
        return False
    r = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(p),
        ],
        capture_output=True, text=True,
    )
    try:
        return float(r.stdout.strip() or 0) > 0.3
    except ValueError:
        return False


def compress_video(src: Path) -> bool:
    VID_OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    dst = VID_OUT / f"{src.stem}_1080p.mp4"
    if probe_ok(dst):
        log(f"skip video {dst.name}")
        return True
    tmp = TMP / f"_{src.stem}.mp4"
    log(f"encode {src.name} → {dst.name}")
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-i", str(src),
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", VF, "-af", AF,
        "-c:v", "libx264", "-preset", PRESET, "-crf", CRF,
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(tmp),
    ]
    r = subprocess.run(cmd)
    if r.returncode != 0 or not probe_ok(tmp):
        log(f"FAIL video {src.name}")
        tmp.unlink(missing_ok=True)
        return False
    tmp.replace(dst)
    return True


def compress_photo(src: Path) -> bool:
    PHOTO_OUT.mkdir(parents=True, exist_ok=True)
    dst = PHOTO_OUT / f"{src.stem}.jpg"
    if dst.exists() and dst.stat().st_size > 20_000:
        return True
    try:
        from PIL import Image, ImageEnhance, ImageOps

        img = Image.open(src).convert("RGB")
        img = ImageOps.exif_transpose(img)
        img = ImageEnhance.Contrast(img).enhance(1.05)
        img = ImageEnhance.Sharpness(img).enhance(1.08)
        long_edge = max(img.size)
        if long_edge > 2400:
            scale = 2400 / long_edge
            img = img.resize(
                (int(img.width * scale), int(img.height * scale)),
                Image.Resampling.LANCZOS,
            )
        img.save(dst, "JPEG", quality=90, optimize=True, progressive=True)
        return True
    except Exception as e:
        log(f"FAIL photo {src.name}: {e}")
        return False


def main() -> int:
    if not SRC.exists():
        log(f"SRC missing: {SRC}")
        return 2
    DEST.mkdir(parents=True, exist_ok=True)
    vids = sorted(list(SRC.glob("*.MOV")) + list(SRC.glob("*.mov")))
    jpgs = sorted(list(SRC.glob("*.JPG")) + list(SRC.glob("*.jpg")))
    log(f"start videos={len(vids)} photos={len(jpgs)} → {DEST}")

    ok_v = fail_v = 0
    for i, src in enumerate(vids, 1):
        log(f"[{i}/{len(vids)}] {src.name}")
        if compress_video(src):
            ok_v += 1
        else:
            fail_v += 1

    ok_p = fail_p = 0
    for i, src in enumerate(jpgs, 1):
        if i % 25 == 1 or i == len(jpgs):
            log(f"photos [{i}/{len(jpgs)}]")
        if compress_photo(src):
            ok_p += 1
        else:
            fail_p += 1

    readme = DEST / "README.txt"
    readme.write_text(
        "D Circle on tour — exhibition package\n"
        f"Source: {SRC}\n"
        "01_videos\\  H.264 1080p playable (CRF19, AAC 192k)\n"
        "02_photos\\  JPEG long-edge ≤2400px\n"
        f"Built: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Videos OK/FAIL: {ok_v}/{fail_v}  Photos OK/FAIL: {ok_p}/{fail_p}\n",
        encoding="utf-8",
    )
    # cleanup tmp
    shutil.rmtree(TMP, ignore_errors=True)
    log(f"DONE videos {ok_v}/{fail_v} photos {ok_p}/{fail_p}")
    (DEST / "00_logs" / "DONE.flag").write_text(time.strftime("%Y-%m-%dT%H:%M:%S"), encoding="utf-8")
    return 0 if fail_v == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
