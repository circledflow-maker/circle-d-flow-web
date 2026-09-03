#!/usr/bin/env python3
"""Compress F:\\DCIM\\On Tour KW29 -> D:\\D Circle on tour\\On_Tour_KW29 (playable proxies).

Encode to NTFS TEMP first (D: is unstable/FAT32). Copy JPGs; skip huge raw MOVs on D.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

SRC = Path(r"F:\DCIM\On Tour KW29")
DEST = Path(r"D:\D Circle on tour\On_Tour_KW29")
TMP_DIR = Path(os.environ.get("TEMP", r"C:\Users\user\AppData\Local\Temp")) / "on_tour_kw29_proxies"
LOG = DEST / "00_logs" / "compress.log"

VF = (
    "scale=1920:1080:force_original_aspect_ratio=decrease,"
    "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
    "hqdn3d=2.0:1.5:3.2:2.6,"
    "eq=contrast=1.08:brightness=0.02:saturation=0.95:gamma=1.05,"
    "format=yuv420p"
)
AF = (
    "highpass=f=50,lowpass=f=16000,afftdn=nf=-22:nt=w:tn=1:om=o,"
    "acompressor=threshold=-18dB:ratio=1.9:attack=22:release=260:makeup=2.2:knee=8,"
    "alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"
)
FPS = "60000/1001"
CRF = "20"


def log(msg: str) -> None:
    print(msg, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def wait_for_d(timeout_s: int = 180) -> bool:
    for _ in range(timeout_s // 3):
        if DEST.parent.exists():
            return True
        time.sleep(3)
    return DEST.parent.exists()


def probe_ok(p: Path) -> bool:
    if not p.exists() or p.stat().st_size < 50_000:
        return False
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True, text=True,
    )
    try:
        return float(r.stdout.strip() or 0) > 0.4
    except ValueError:
        return False


def ffmpeg_cmd(src: Path, tmp: Path, *, threads: int, preset: str) -> list[str]:
    x264 = f"threads={threads}:sliced-threads=1:sync-lookahead=0:rc-lookahead=10"
    return [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-threads", str(threads), "-filter_threads", "1",
        "-i", str(src),
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", VF, "-af", AF,
        "-c:v", "libx264", "-preset", preset, "-crf", CRF,
        "-x264-params", x264,
        "-r", FPS, "-fps_mode", "cfr",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
        "-pix_fmt", "yuv420p",
        "-max_muxing_queue_size", "1024",
        str(tmp),
    ]


def copy_with_retry(src: Path, dst: Path, tries: int = 6) -> bool:
    for i in range(1, tries + 1):
        if not wait_for_d():
            log(f"D: offline waiting copy {dst.name} attempt {i}")
            continue
        try:
            dst.parent.mkdir(parents=True, exist_ok=True)
            if dst.exists():
                dst.unlink()
            shutil.copy2(src, dst)
            return True
        except OSError as e:
            log(f"copy retry {i}/{tries} {dst.name}: {e}")
            time.sleep(4 * i)
    return False


def compress(src: Path, dst: Path) -> bool:
    if dst.exists() and probe_ok(dst):
        log(f"skip {dst.name}")
        return True
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    tmp = TMP_DIR / f"{dst.stem}.partial.mp4"
    tmp.unlink(missing_ok=True)
    # Huge masters: start ultrafast to save RAM/C: space
    huge = src.stat().st_size > 2_000_000_000
    attempts = ((1, "ultrafast"),) if huge else ((2, "veryfast"), (1, "ultrafast"))
    last_err = ""
    for i, (threads, preset) in enumerate(attempts, start=1):
        tmp.unlink(missing_ok=True)
        log(f"encode {src.name} ({src.stat().st_size/1e6:.0f}MB) t={threads} {preset}")
        r = subprocess.run(ffmpeg_cmd(src, tmp, threads=threads, preset=preset), capture_output=True, text=True)
        if r.returncode == 0 and tmp.exists() and tmp.stat().st_size >= 50_000:
            break
        last_err = (r.stderr or r.stdout or "")[-800:]
        log(f"retryable FAIL {src.name} attempt {i}: {last_err}")
        tmp.unlink(missing_ok=True)
    else:
        log(f"FAIL {src.name}: {last_err}")
        return False
    if not copy_with_retry(tmp, dst):
        log(f"FAIL copy {dst.name} (temp kept: {tmp})")
        return False
    tmp.unlink(missing_ok=True)
    if not probe_ok(dst):
        # D may have corrupted — re-check after brief wait
        time.sleep(2)
        if not probe_ok(dst):
            log(f"FAIL probe {dst.name}")
            try:
                dst.unlink(missing_ok=True)
            except OSError:
                pass
            return False
    log(f"OK {dst.name} ({dst.stat().st_size/1e6:.0f}MB)")
    return True


def copy_stills() -> int:
    raw = DEST / "02_Raw_Photos"
    n = 0
    for p in sorted(SRC.glob("*.JPG")) + sorted(SRC.glob("*.jpg")) + sorted(SRC.glob("*.JPEG")):
        dst = raw / p.name
        if dst.exists() and dst.stat().st_size == p.stat().st_size:
            continue
        if copy_with_retry(p, dst):
            n += 1
            log(f"photo {p.name}")
    return n


def main() -> int:
    if not SRC.exists():
        print(f"missing source {SRC}")
        return 2
    if not wait_for_d():
        print("D: not available")
        return 3
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "04_videos_compressed").mkdir(parents=True, exist_ok=True)
    (DEST / "02_Raw_Photos").mkdir(parents=True, exist_ok=True)
    log("=== On Tour KW29 compress start ===")
    photos = copy_stills()
    log(f"photos copied/new={photos}")
    movs = sorted(SRC.glob("*.MOV")) + sorted(SRC.glob("*.mov"))
    ok = fail = skip = 0
    for i, src in enumerate(movs, 1):
        dst = DEST / "04_videos_compressed" / f"{src.stem}_proxy_1080p.mp4"
        log(f"[{i}/{len(movs)}] {src.name}")
        if dst.exists() and probe_ok(dst):
            skip += 1
            log(f"skip {dst.name}")
            continue
        if compress(src, dst):
            ok += 1
        else:
            fail += 1
    log(f"=== done ok={ok} skip={skip} fail={fail} total={len(movs)} ===")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
