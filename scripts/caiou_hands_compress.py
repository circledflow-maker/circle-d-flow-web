#!/usr/bin/env python3
"""Compress SD folder -> CircleDStages/Caiou/Hands around mz chest on Verbatim HD.

Stages-grade H.264 1080p proxies. Encode to TEMP, then copy to Verbatim HD.
Default SRC: F:\\DCIM\\104ND850 (override with env CAIOU_SRC / CAIOU_DEST).
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

SRC = Path(os.environ.get("CAIOU_SRC", r"F:\DCIM\104ND850"))

def _find_dest() -> Path:
    env = os.environ.get("CAIOU_DEST")
    if env:
        return Path(env)
    rel = Path(r"CircleDStages") / "Caiou" / "Hands around mz chest"
    for letter in "HDEIJK":
        candidate = Path(f"{letter}:/") / rel
        if candidate.exists() or (Path(f"{letter}:/") / "CircleDStages").exists():
            return candidate
    # Prefer current Verbatim letter if present
    for letter in "HDEIJK":
        root = Path(f"{letter}:/")
        if root.exists():
            return root / rel
    return Path(r"D:\CircleDStages\Caiou\Hands around mz chest")

DEST = _find_dest()

def _find_tmp(dest: Path) -> Path:
    # Prefer temp on same Verbatim volume as DEST
    drive = dest.drive  # e.g. 'D:'
    if drive:
        return Path(drive + "/") / "caiou_hands_proxies_tmp"
    if Path("E:/").exists():
        return Path("E:/caiou_hands_proxies")
    return Path(os.environ.get("TEMP", r"C:\Users\user\AppData\Local\Temp")) / "caiou_hands_proxies"

TMP_DIR = _find_tmp(DEST)
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


def wait_for_dest(timeout_s: int = 180) -> bool:
    for _ in range(max(1, timeout_s // 3)):
        if DEST.exists() or DEST.parent.exists():
            return True
        time.sleep(3)
    return DEST.exists() or DEST.parent.exists()


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


def list_unique_movs(folder: Path) -> list[Path]:
    seen: set[str] = set()
    out: list[Path] = []
    try:
        entries = list(folder.iterdir())
    except OSError as e:
        log(f"FAIL list dir {folder}: {e}")
        return out
    for p in sorted(entries, key=lambda x: x.name.lower()):
        try:
            if not p.is_file():
                continue
            if p.suffix.lower() != ".mov":
                continue
            key = p.name.lower()
            if key in seen:
                continue
            # Touch size early to skip corrupted SD entries
            _ = p.stat().st_size
            seen.add(key)
            out.append(p)
        except OSError as e:
            log(f"skip unreadable MOV {p.name}: {e}")
    return out


def list_unique_jpgs(folder: Path) -> list[Path]:
    seen: set[str] = set()
    out: list[Path] = []
    try:
        entries = list(folder.iterdir())
    except OSError as e:
        log(f"FAIL list dir {folder}: {e}")
        return out
    for p in sorted(entries, key=lambda x: x.name.lower()):
        try:
            if not p.is_file():
                continue
            if p.suffix.lower() not in {".jpg", ".jpeg"}:
                continue
            key = p.name.lower()
            if key in seen:
                continue
            _ = p.stat().st_size
            seen.add(key)
            out.append(p)
        except OSError as e:
            log(f"skip unreadable JPG {p.name}: {e}")
    return out


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
        if not wait_for_dest():
            log(f"dest offline waiting copy {dst.name} attempt {i}")
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
    try:
        src_size = src.stat().st_size
    except OSError as e:
        log(f"FAIL unreadable source {src.name}: {e}")
        return False
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    tmp = TMP_DIR / f"{dst.stem}.partial.mp4"
    tmp.unlink(missing_ok=True)
    huge = src_size > 1_500_000_000
    attempts = ((1, "ultrafast"),) if huge else ((2, "veryfast"), (1, "ultrafast"))
    last_err = ""
    for i, (threads, preset) in enumerate(attempts, start=1):
        tmp.unlink(missing_ok=True)
        log(f"encode {src.name} ({src_size/1e6:.0f}MB) t={threads} {preset}")
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
    for p in list_unique_jpgs(SRC):
        dst = raw / p.name
        try:
            if dst.exists() and dst.stat().st_size == p.stat().st_size:
                continue
        except OSError:
            continue
        if copy_with_retry(p, dst):
            n += 1
            log(f"photo {p.name}")
    return n


def main() -> int:
    if not SRC.exists():
        print(f"missing source {SRC}")
        return 2
    if not wait_for_dest():
        print(f"dest not available: {DEST}")
        return 3
    log(f"SRC={SRC}")
    log(f"DEST={DEST}")
    log(f"TMP={TMP_DIR}")
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "04_videos_compressed").mkdir(parents=True, exist_ok=True)
    (DEST / "02_Raw_Photos").mkdir(parents=True, exist_ok=True)
    log("=== Caiou Hands around mz chest compress start ===")
    photos = copy_stills()
    log(f"photos copied/new={photos}")
    movs = list_unique_movs(SRC)
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
