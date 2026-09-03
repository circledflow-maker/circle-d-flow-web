#!/usr/bin/env python3
"""Compress Nikon Z50_2 rescued / SD MOV to playable H.264 proxies.

Source preference: F:\\DCIM\\106NZ502 (if readable), else D rescue folder.
Output: D:\\...\\_SD_Rescue\\NIKON_Z50_2_20260814\\03_Proxies_Compressed\\
- 1080p keep, 59.94 CFR, libx264 CRF 20, AAC 160k, yuv420p
- No +faststart (D: is FAT32)
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

F_SRC = Path(r"F:\DCIM\106NZ502")
D_SRC = Path(r"D:\Wakungo_Content_Studio\_SD_Rescue\NIKON_Z50_2_20260814\DCIM\106NZ502")
EXTRA_REL = "On Flow Jordy Arpanito Hope"
F_EXTRA = F_SRC / EXTRA_REL
D_EXTRA = D_SRC / EXTRA_REL
OUT = Path(r"D:\Wakungo_Content_Studio\_SD_Rescue\NIKON_Z50_2_20260814\03_Proxies_Compressed")
OUT_EXTRA = OUT / "On_Flow_Jordy_Arpanito_Hope"
LOG = Path(r"D:\Wakungo_Content_Studio\_SD_Rescue\NIKON_Z50_2_20260814\compress_playable.log")
SRC_ROOTS = (F_SRC, D_SRC, F_EXTRA, D_EXTRA)
# Encode to NTFS temp first — D: FAT32 often drops mid-write on large files
TMP_DIR = Path(os.environ.get("TEMP", r"C:\Users\user\AppData\Local\Temp")) / "destiny_sd_proxies"

FPS = "60000/1001"
CRF = "20"
PRESET = "veryfast"


def log(msg: str) -> None:
    print(msg, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def probe_ok(p: Path) -> bool:
    if not p.exists() or p.stat().st_size < 100_000:
        return False
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True, text=True,
    )
    try:
        return float(r.stdout.strip() or 0) > 0.5
    except ValueError:
        return False


def pick_src(name: str) -> Path | None:
    for root in SRC_ROOTS:
        p = root / name
        if p.exists() and p.stat().st_size > 100_000:
            return p
    return None


def list_mov_names() -> list[str]:
    names: set[str] = set()
    for root in SRC_ROOTS:
        if not root.exists():
            continue
        for p in root.glob("*.MOV"):
            names.add(p.name)
        for p in root.glob("*.mov"):
            names.add(p.name)
    return sorted(names)


def proxy_dst(src: Path, name: str) -> Path:
    stem = Path(name).stem
    if src.parent in (F_EXTRA, D_EXTRA):
        return OUT_EXTRA / f"{stem}_proxy_1080p.mp4"
    return OUT / f"{stem}_proxy_1080p.mp4"


def archive_original(src: Path) -> None:
    """Copy one extra MOV onto D: after encode, so FAT32 copy cannot stall the batch."""
    if src.parent != F_EXTRA:
        return
    D_EXTRA.mkdir(parents=True, exist_ok=True)
    dst = D_EXTRA / src.name
    if dst.exists() and dst.stat().st_size == src.stat().st_size:
        return
    try:
        shutil.copy2(src, dst)
        log(f"copied original {src.name} ({src.stat().st_size/1e6:.0f}MB) -> {dst}")
    except OSError as e:
        log(f"FAIL copy original {src.name}: {e}")


def ffmpeg_cmd(src: Path, tmp: Path, *, threads: int, preset: str) -> list[str]:
    """Software decode/encode — DXVA2 hwaccel OOM'd HEVC on this machine."""
    vf = (
        "scale=1920:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p"
    )
    x264 = f"threads={threads}:sliced-threads=1:sync-lookahead=0:rc-lookahead=10"
    return [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-threads", str(threads),
        "-filter_threads", "1",
        "-i", str(src),
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", vf,
        "-c:v", "libx264", "-preset", preset, "-crf", CRF,
        "-x264-params", x264,
        "-r", FPS, "-fps_mode", "cfr",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
        "-pix_fmt", "yuv420p",
        "-max_muxing_queue_size", "1024",
        str(tmp),
    ]


def compress(src: Path, dst: Path) -> bool:
    dst.parent.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    if dst.exists() and probe_ok(dst) and dst.stat().st_size > 200_000:
        log(f"skip {dst.name}")
        return True
    # Clear stale partials on D: and in TEMP
    for stale in (dst.with_suffix(".partial.mp4"), TMP_DIR / f"{dst.stem}.partial.mp4"):
        stale.unlink(missing_ok=True)
    tmp = TMP_DIR / f"{dst.stem}.partial.mp4"
    attempts = (
        (2, PRESET),
        (1, "ultrafast"),
    )
    last_err = ""
    for i, (threads, preset) in enumerate(attempts, start=1):
        tmp.unlink(missing_ok=True)
        cmd = ffmpeg_cmd(src, tmp, threads=threads, preset=preset)
        log(
            f"encode {src.name} ({src.stat().st_size/1e6:.0f}MB) "
            f"t={threads} {preset} -> TEMP then {dst.name}"
        )
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode == 0 and tmp.exists() and tmp.stat().st_size >= 100_000:
            break
        last_err = (r.stderr or r.stdout or "")[-800:]
        log(f"retryable FAIL {src.name} attempt {i}: {last_err}")
        tmp.unlink(missing_ok=True)
    else:
        log(f"FAIL {src.name}: {last_err}")
        return False
    try:
        if dst.exists():
            dst.unlink(missing_ok=True)
        shutil.copy2(tmp, dst)
        tmp.unlink(missing_ok=True)
    except OSError as e:
        log(f"FAIL copy to D {dst.name}: {e}")
        return False
    if not probe_ok(dst):
        log(f"FAIL probe {dst.name}")
        dst.unlink(missing_ok=True)
        return False
    log(f"OK {dst.name} ({dst.stat().st_size/1e6:.0f}MB)")
    return True


def copy_jpgs() -> int:
    """Copy JPGs from F or D into proxies folder (already playable)."""
    n = 0
    names: set[str] = set()
    for root in (F_SRC, D_SRC):
        if not root.exists():
            continue
        for p in list(root.glob("*.JPG")) + list(root.glob("*.jpg")):
            names.add(p.name)
    out_jpg = OUT / "stills"
    out_jpg.mkdir(parents=True, exist_ok=True)
    for name in sorted(names):
        src = pick_src(name)
        if not src:
            continue
        dst = out_jpg / name
        if dst.exists() and dst.stat().st_size == src.stat().st_size:
            continue
        try:
            dst.write_bytes(src.read_bytes())
            n += 1
        except OSError as e:
            log(f"JPG fail {name}: {e}")
    return n


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    only = {a.lower() for a in sys.argv[1:]} if len(sys.argv) > 1 else set()
    log("=== compress playable start ===")
    log(f"F exists={F_SRC.exists()} D exists={D_SRC.exists()} extra={F_EXTRA.exists()}")
    names = list_mov_names()
    log(f"MOV candidates={len(names)}")
    ok = fail = skip = 0
    for name in names:
        if only and name.lower() not in only and Path(name).stem.lower() not in only:
            continue
        src = pick_src(name)
        if not src:
            log(f"missing src {name}")
            fail += 1
            continue
        dst = proxy_dst(src, name)
        if dst.exists() and probe_ok(dst):
            skip += 1
            continue
        if compress(src, dst):
            ok += 1
            archive_original(src)
        else:
            alt = None
            if src.parent == F_EXTRA:
                alt = D_EXTRA / name
            elif src.parent == F_SRC:
                alt = D_SRC / name
            elif src.parent == D_EXTRA:
                alt = F_EXTRA / name
            elif src.parent == D_SRC:
                alt = F_SRC / name
            if alt and alt.exists() and alt != src:
                log(f"retry from {alt}")
                if compress(alt, dst):
                    ok += 1
                    continue
            fail += 1
    jpg_n = 0 if only else copy_jpgs()
    log(f"=== done ok={ok} fail={fail} skip={skip} jpg_copied={jpg_n} ===")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
