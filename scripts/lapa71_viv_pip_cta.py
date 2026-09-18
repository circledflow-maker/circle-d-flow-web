#!/usr/bin/env python3
"""
Lapa71 Moodboard ViV — portrait PiP 1–4s + larger spaced Follow / Join / Support.

Windows (preferred):
  python scripts/lapa71_viv_pip_cta.py

Uses:
  D:\\Wakungo_Content_Studio\\Lapa71\\05_Reels\\Lapa71_Moodboard_ViV_35s_KissYourHeart_9x16.mp4
  PiP stills: Assets/membership/intro/pip_viv_01..05.png
  Optional clips: D:\\...\\04_videos_compressed\\Full_Takes
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
REPO_INTRO = REPO / "Assets" / "membership" / "intro"

STILL_NAMES = [
    "pip_viv_01.png",
    "pip_viv_02.png",
    "pip_viv_03.png",
    "pip_viv_04.png",
    "pip_viv_05.png",
]


def win_paths() -> tuple[Path, Path, Path, Path] | None:
    if os.name == "nt" and Path("D:/").exists():
        base = Path(r"D:\Wakungo_Content_Studio\Lapa71")
    elif Path("/mnt/d/Wakungo_Content_Studio/Lapa71").exists():
        base = Path("/mnt/d/Wakungo_Content_Studio/Lapa71")
    else:
        return None
    src = base / "05_Reels" / "Lapa71_Moodboard_ViV_35s_KissYourHeart_9x16.mp4"
    out = base / "05_Reels" / "Lapa71_Moodboard_ViV_35s_KissYourHeart_9x16_pip_cta.mp4"
    takes = base / "04_videos_compressed" / "Full_Takes"
    work = base / "00_work" / "viv_pip"
    return src, out, takes, work


def run(cmd: list[str]) -> None:
    print("+", " ".join(str(c) for c in cmd))
    subprocess.check_call(cmd)


def find_font() -> str:
    for p in (
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ):
        if p.exists():
            return str(p).replace("\\", "/").replace(":", "\\:")
    return ""


def collect_stills() -> list[Path]:
    return [REPO_INTRO / n for n in STILL_NAMES if (REPO_INTRO / n).exists()]


def collect_take_clips(takes: Path, limit: int = 5) -> list[Path]:
    if not takes.exists():
        return []
    clips: list[Path] = []
    for ext in ("*.mp4", "*.mov", "*.MP4", "*.MOV"):
        clips.extend(takes.glob(ext))
    return sorted(clips, key=lambda p: p.stat().st_mtime, reverse=True)[:limit]


def make_seg_from_image(img: Path, seg: Path) -> None:
    run(
        [
            "ffmpeg", "-y", "-loop", "1", "-i", str(img), "-t", "0.6",
            "-vf", "scale=360:640:force_original_aspect_ratio=increase,crop=360:640,fps=30,format=yuv420p",
            "-an", str(seg),
        ]
    )


def make_seg_from_clip(clip: Path, seg: Path, start: float) -> None:
    run(
        [
            "ffmpeg", "-y", "-ss", str(start), "-i", str(clip), "-t", "0.6",
            "-vf", "scale=360:640:force_original_aspect_ratio=increase,crop=360:640,fps=30,format=yuv420p",
            "-an", str(seg),
        ]
    )


def main() -> int:
    paths = win_paths()
    if not paths:
        print(
            "D: / Wakungo Lapa71 path not available in this environment.\n"
            "On Windows, run: python scripts/lapa71_viv_pip_cta.py",
            file=sys.stderr,
        )
        return 2
    src, out, takes, work = paths
    if not src.exists():
        print(f"MISSING source: {src}", file=sys.stderr)
        return 1
    if not shutil.which("ffmpeg"):
        print("ffmpeg not found", file=sys.stderr)
        return 1

    work.mkdir(parents=True, exist_ok=True)
    stills = collect_stills()
    clips = collect_take_clips(takes)
    print(f"stills={len(stills)} full_takes={len(clips)}")

    sources: list[tuple[str, Path]] = [("still", p) for p in stills]
    if len(sources) < 3:
        for c in clips:
            sources.append(("clip", c))
            if len(sources) >= 5:
                break
    if len(sources) < 3:
        print("Need ≥3 PiP sources", file=sys.stderr)
        return 1

    segs: list[Path] = []
    for i, (kind, path) in enumerate(sources[:5]):
        seg = work / f"seg_{i:02d}.mp4"
        print("PiP", i, kind, path)
        if kind == "still":
            make_seg_from_image(path, seg)
        else:
            make_seg_from_clip(path, seg, start=1.0 + i * 0.4)
        segs.append(seg)

    list_file = work / "pip_list.txt"
    with list_file.open("w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"file '{s.as_posix()}'\n")

    pip_mp4 = work / "pip_strip_3s.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(pip_mp4)])

    font = find_font()
    font_opt = f":fontfile='{font}'" if font else ""
    vf = (
        f"[1:v]format=yuva420p,fade=t=in:st=0:d=0.15,fade=t=out:st=2.85:d=0.15[pip];"
        f"[0:v][pip]overlay=W-w-48:H-h-240:enable='between(t,1,4)'[v0];"
        f"[v0]drawtext=text='Follow'{font_opt}:fontsize=76:fontcolor=0xF0D78C:borderw=3:"
        f"bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.56:enable='gte(t,29)',"
        f"drawtext=text='Join'{font_opt}:fontsize=76:fontcolor=0xF0D78C:borderw=3:"
        f"bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.56+104:enable='gte(t,29)',"
        f"drawtext=text='Support'{font_opt}:fontsize=76:fontcolor=0xF0D78C:borderw=3:"
        f"bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.56+208:enable='gte(t,29)'[vout]"
    )
    run(
        [
            "ffmpeg", "-y", "-i", str(src), "-i", str(pip_mp4),
            "-filter_complex", vf, "-map", "[vout]", "-map", "0:a?",
            "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-c:a", "copy", "-movflags", "+faststart", str(out),
        ]
    )
    print("DONE", out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
