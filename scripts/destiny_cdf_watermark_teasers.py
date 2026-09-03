#!/usr/bin/env python3
"""Burn a light Circle D Flow logo into the bottom-right corner of teaser videos.

Default logo: pages/CDF LOGO Hot.png (falls back to CDF Black.logo.png)
Output: Teasers/*_CDF/ sibling folders OR overwrite with --inplace
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\circle-d-flow-web")
LOGO_CANDIDATES = [
    ROOT / "pages" / "CDF LOGO Hot.png",
    ROOT / "pages" / "CDF Black.logo.png",
    ROOT / "Docs" / "Logo.png",
]
TEASERS = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\YouTube_Master_Renders\Teasers")
OUT = TEASERS / "Watermarked_CDF"
LOG = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\00_logs\cdf_watermark.log")

# Light watermark: ~9% width, 55% opacity, 28px from edges
LOGO_W_PCT = 0.09
OPACITY = 0.55
MARGIN = 28


def log(msg: str) -> None:
    print(msg, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def pick_logo() -> Path:
    for p in LOGO_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("No CDF logo found")


def probe_size(video: Path) -> tuple[int, int]:
    r = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x",
            str(video),
        ],
        capture_output=True,
        text=True,
    )
    w, h = r.stdout.strip().split("x")
    return int(w), int(h)


def watermark(src: Path, dst: Path, logo: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and dst.stat().st_size > 100_000:
        log(f"skip {dst.name}")
        return
    vw, vh = probe_size(src)
    lw = max(64, int(vw * LOGO_W_PCT))
    # scale logo, apply alpha, overlay bottom-right
    fc = (
        f"[1:v]scale={lw}:-1,format=rgba,colorchannelmixer=aa={OPACITY}[lg];"
        f"[0:v][lg]overlay=W-w-{MARGIN}:H-h-{MARGIN}:format=auto[v]"
    )
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src), "-i", str(logo),
        "-filter_complex", fc,
        "-map", "[v]", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        "-movflags", "+faststart",
        str(dst),
    ]
    log(f"wm {src.name} -> {dst.relative_to(OUT) if dst.is_relative_to(OUT) else dst.name}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[-1200:] or "ffmpeg failed")


def main() -> int:
    logo = pick_logo()
    log(f"=== CDF watermark logo={logo} ===")
    OUT.mkdir(parents=True, exist_ok=True)
    videos = sorted(TEASERS.rglob("*.mp4"))
    # skip already watermarked tree
    videos = [v for v in videos if "Watermarked_CDF" not in v.parts]
    only = set(sys.argv[1:]) if len(sys.argv) > 1 else set()
    n = 0
    for src in videos:
        if only and not any(tok in src.name.lower() for tok in only):
            continue
        rel = src.relative_to(TEASERS)
        dst = OUT / rel
        try:
            watermark(src, dst, logo)
            n += 1
        except Exception as e:
            log(f"FAIL {src.name}: {e}")
    log(f"=== done ({n} videos) ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
