#!/usr/bin/env python3
"""Compress + light Stages grade for F:\\DCIM\\106NZ502 event folders onto D:.

Encode to NTFS TEMP first (D: is FAT32). Copy JPGs and small MOVs as raw.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

STUDIO = Path(r"D:\Wakungo_Content_Studio")
F_ROOT = Path(r"F:\DCIM\106NZ502")
TMP_DIR = Path(os.environ.get("TEMP", r"C:\Users\user\AppData\Local\Temp")) / "destiny_sd_proxies"
LOG = STUDIO / "SD_106NZ502_July2026" / "00_logs" / "compress_edit.log"

# Circle D Stages: lift shadows, tame club red, denoise; music loudnorm
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
PRESET = "veryfast"
RAW_COPY_MAX = 1_500_000_000  # skip huge HEVC masters onto FAT32

JOBS = [
    (F_ROOT / "Home coming", STUDIO / "SD_106NZ502_July2026" / "Homecoming"),
    (F_ROOT / "Destination Hostel", STUDIO / "SD_106NZ502_July2026" / "Destination_Hostel"),
    (F_ROOT / "OTW Lapa71", STUDIO / "SD_106NZ502_July2026" / "OTW_Lapa71"),
]


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
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
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
    for stale in (dst.with_suffix(".partial.mp4"), TMP_DIR / f"{dst.stem}.partial.mp4"):
        stale.unlink(missing_ok=True)
    tmp = TMP_DIR / f"{dst.stem}.partial.mp4"
    last_err = ""
    for i, (threads, preset) in enumerate(((2, PRESET), (1, "ultrafast")), start=1):
        tmp.unlink(missing_ok=True)
        log(f"encode {src.name} ({src.stat().st_size/1e6:.0f}MB) t={threads} {preset} -> {dst}")
        r = subprocess.run(ffmpeg_cmd(src, tmp, threads=threads, preset=preset), capture_output=True, text=True)
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


def copy_stills(src_dir: Path, dst_dir: Path) -> int:
    dst_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for src in sorted(src_dir.glob("*.JPG")) + sorted(src_dir.glob("*.jpg")):
        dst = dst_dir / src.name
        if dst.exists() and dst.stat().st_size == src.stat().st_size:
            continue
        try:
            shutil.copy2(src, dst)
            n += 1
            log(f"copied still {src.name}")
        except OSError as e:
            log(f"FAIL still {src.name}: {e}")
    return n


def copy_small_raw(src: Path, dst_dir: Path) -> None:
    if src.stat().st_size > RAW_COPY_MAX:
        log(f"skip raw copy {src.name} (too large for FAT32-safe copy)")
        return
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst = dst_dir / src.name
    if dst.exists() and dst.stat().st_size == src.stat().st_size:
        return
    try:
        shutil.copy2(src, dst)
        log(f"copied raw {src.name} ({src.stat().st_size/1e6:.0f}MB)")
    except OSError as e:
        log(f"FAIL raw {src.name}: {e}")


def list_movs(src_dir: Path) -> list[Path]:
    seen: set[str] = set()
    out: list[Path] = []
    for p in sorted(src_dir.glob("*.MOV")) + sorted(src_dir.glob("*.mov")):
        key = p.name.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


def main() -> int:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    args = [a.lower() for a in sys.argv[1:]]
    encode_only = "--encode-only" in args
    only = {a for a in args if not a.startswith("--")}
    log("=== SD event folders compress+grade start ===")
    log(f"encode_only={encode_only}")
    ok = fail = skip = stills = 0
    queued: list[tuple[Path, Path]] = []
    for src_dir, out_root in JOBS:
        raw_v = out_root / "01_Raw_Video"
        raw_p = out_root / "02_Raw_Photos"
        vid_c = out_root / "04_videos_compressed"
        log(f"--- job {src_dir.name} exists={src_dir.exists()} -> {out_root}")
        if not src_dir.exists():
            log(f"missing source {src_dir}")
            fail += 1
            continue
        if not encode_only:
            stills += copy_stills(src_dir, raw_p)
        for src in list_movs(src_dir):
            if not encode_only:
                copy_small_raw(src, raw_v)
            queued.append((src, vid_c / f"{src.stem}_proxy_1080p.mp4"))
    seen_dst: set[str] = set()
    for src, dst in queued:
        key = str(dst).lower()
        if key in seen_dst:
            continue
        seen_dst.add(key)
        if only and src.name.lower() not in only and src.stem.lower() not in only:
            continue
        if dst.exists() and probe_ok(dst):
            log(f"skip {dst.name}")
            skip += 1
            continue
        if compress(src, dst):
            ok += 1
        else:
            fail += 1
    log(f"=== done ok={ok} fail={fail} skip={skip} stills={stills} ===")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
