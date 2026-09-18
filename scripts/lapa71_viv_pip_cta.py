#!/usr/bin/env python3
"""
Lapa71 Moodboard ViV — portrait PiP between 1s–4s + larger spaced Follow / Join / Support CTA.

Run on the Windows machine where the master lives (D:):

  python scripts/lapa71_viv_pip_cta.py

Source (default):
  D:\\Wakungo_Content_Studio\\Lapa71\\05_Reels\\Lapa71_Moodboard_ViV_35s_KissYourHeart_9x16.mp4

PiP = lifestyle portraits ONLY (cine_01…cine_05). Never membership UI screenshots
(pip_plans / pip_member / pip_admin*).
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SRC = Path(
    r"D:\Wakungo_Content_Studio\Lapa71\05_Reels\Lapa71_Moodboard_ViV_35s_KissYourHeart_9x16.mp4"
)
OUT = Path(
    r"D:\Wakungo_Content_Studio\Lapa71\05_Reels\Lapa71_Moodboard_ViV_35s_KissYourHeart_9x16_pip_cta.mp4"
)
REPO_INTRO = Path(__file__).resolve().parents[1] / "Assets" / "membership" / "intro"
WORK = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\viv_pip")

# Portraits only — NOT the last two membership UI shots
PORTRAITS = [
    "cine_01_cafe.png",
    "cine_02_handpan.png",
    "cine_03_smile.png",
    "cine_04_gallery.png",
    "cine_05_lapa71.png",
]


def run(cmd: list[str]) -> None:
    print("+", " ".join(str(c) for c in cmd))
    subprocess.check_call(cmd)


def find_font() -> str:
    candidates = [
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for p in candidates:
        if p.exists():
            return str(p).replace("\\", "/").replace(":", "\\:")
    return ""


def main() -> int:
    if not SRC.exists():
        print(f"MISSING source: {SRC}", file=sys.stderr)
        print("Copy the reel onto this machine or run on Windows with D: mounted.", file=sys.stderr)
        return 1

    if not shutil.which("ffmpeg"):
        print("ffmpeg not found on PATH", file=sys.stderr)
        return 1

    WORK.mkdir(parents=True, exist_ok=True)
    portraits: list[Path] = []
    for name in PORTRAITS:
        p = REPO_INTRO / name
        if not p.exists():
            p = SRC.parent / name
        if p.exists():
            portraits.append(p)
            print("PiP source:", p)
        else:
            print("skip missing", name)

    if len(portraits) < 3:
        print("Need at least 3 portrait PNGs for PiP", file=sys.stderr)
        return 1

    # 3s PiP strip (covers 1s→4s): ~0.6s per portrait @ 360x640
    pip_mp4 = WORK / "pip_strip_3s.mp4"
    list_file = WORK / "pip_list.txt"
    segs: list[Path] = []
    for i, img in enumerate(portraits[:5]):
        seg = WORK / f"seg_{i:02d}.mp4"
        run(
            [
                "ffmpeg",
                "-y",
                "-loop",
                "1",
                "-i",
                str(img),
                "-t",
                "0.6",
                "-vf",
                "scale=360:640:force_original_aspect_ratio=increase,crop=360:640,fps=30,format=yuv420p",
                "-an",
                str(seg),
            ]
        )
        segs.append(seg)

    with list_file.open("w", encoding="utf-8") as f:
        for s in segs:
            # Windows concat needs escaped quotes; posix-style paths work with ffmpeg
            f.write(f"file '{s.as_posix()}'\n")

    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            str(pip_mp4),
        ]
    )

    font = find_font()
    font_opt = f":fontfile='{font}'" if font else ""

    # Larger Follow / Join / Support with more vertical gap (~last 6s of ~35s)
    # Line gap ≈ 96px between baselines for breathing room
    vf = (
        f"[1:v]format=yuva420p,fade=t=in:st=0:d=0.15,fade=t=out:st=2.85:d=0.15[pip];"
        f"[0:v][pip]overlay=W-w-48:H-h-240:enable='between(t,1,4)'[v0];"
        f"[v0]drawtext=text='Follow'{font_opt}:fontsize=72:fontcolor=0xF0D78C:borderw=3:"
        f"bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.58:enable='gte(t,29)',"
        f"drawtext=text='Join'{font_opt}:fontsize=72:fontcolor=0xF0D78C:borderw=3:"
        f"bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.58+96:enable='gte(t,29)',"
        f"drawtext=text='Support'{font_opt}:fontsize=72:fontcolor=0xF0D78C:borderw=3:"
        f"bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.58+192:enable='gte(t,29)'[vout]"
    )

    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(SRC),
            "-i",
            str(pip_mp4),
            "-filter_complex",
            vf,
            "-map",
            "[vout]",
            "-map",
            "0:a?",
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "copy",
            "-movflags",
            "+faststart",
            str(OUT),
        ]
    )
    print("DONE", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
