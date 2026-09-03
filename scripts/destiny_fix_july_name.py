#!/usr/bin/env python3
"""Fix July Tilie lower-third (Julie -> July Tilie) and refresh Video1 july segment."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July")
WORK = ROOT / "00_work" / "july_name_fix"
LOGS = ROOT / "003" / "00_logs"
DRIVE = ROOT / "003" / "06_drive_ready" / "Circle_D_Stages" / "Artists" / "July_Tilie"
COMP = ROOT / "003" / "04_videos_compressed" / "Artists" / "July_Tilie"
FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
# Package: 7s black intro + body lower-third at body t=1..10 => package t=8..17
T0, T1 = 8.0, 17.0


def log(msg: str) -> None:
    print(msg, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "july_name_fix.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def run(cmd: list[str], err: Path | None = None) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if err is not None:
        err.write_text((r.stderr or "")[-8000:], encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-2000:])


def fix_16x9(src: Path, dst: Path) -> None:
    """Only re-encode the lower-third window; stream-copy the rest (faster)."""
    head = WORK / "july16_head.mp4"
    tail = WORK / "july16_tail.mp4"
    vf = (
        f"drawbox=x=40:y=ih-205:w=560:h=55:color=black@0.82:t=fill:enable='between(t\\,{T0}\\,{T1})',"
        f"drawtext=fontfile='{FONT_B}':text='July Tilie':fontsize=46:fontcolor=white:"
        f"borderw=2:bordercolor=black@0.65:x=56:y=h-168:enable='between(t\\,{T0}\\,{T1})',"
        f"format=yuv420p"
    )
    log("fix 16x9 head (0-17s)")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src), "-t", str(T1),
            "-vf", vf,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            str(head),
        ],
        WORK / "fix16_head_err.txt",
    )
    log("stream-copy 16x9 tail")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", str(T1), "-i", str(src),
            "-c", "copy",
            str(tail),
        ],
        WORK / "fix16_tail_err.txt",
    )
    lst = WORK / "july16_list.txt"
    lst.write_text(f"file '{head.as_posix()}'\nfile '{tail.as_posix()}'\n", encoding="ascii")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy",
            "-movflags", "+faststart",
            str(dst),
        ],
        WORK / "fix16_concat_err.txt",
    )


def fix_9x16(src: Path, dst: Path) -> None:
    head = WORK / "july916_head.mp4"
    tail = WORK / "july916_tail.mp4"
    vf = (
        f"drawbox=x=28:y=ih-320:w=700:h=70:color=black@0.82:t=fill:enable='between(t\\,{T0}\\,{T1})',"
        f"drawtext=fontfile='{FONT_B}':text='July Tilie':fontsize=52:fontcolor=white:"
        f"borderw=2:bordercolor=black@0.65:x=40:y=h-270:enable='between(t\\,{T0}\\,{T1})',"
        f"format=yuv420p"
    )
    log("fix 9x16 head (0-17s)")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src), "-t", str(T1),
            "-vf", vf,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            str(head),
        ],
        WORK / "fix916_head_err.txt",
    )
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", str(T1), "-i", str(src),
            "-c", "copy",
            str(tail),
        ],
        WORK / "fix916_tail_err.txt",
    )
    lst = WORK / "july916_list.txt"
    lst.write_text(f"file '{head.as_posix()}'\nfile '{tail.as_posix()}'\n", encoding="ascii")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy",
            "-movflags", "+faststart",
            str(dst),
        ],
        WORK / "fix916_concat_err.txt",
    )


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    try:
        src16 = DRIVE / "01_July-Tilie_ONENESS_Stages_16x9.mp4"
        src916 = DRIVE / "01_July-Tilie_ONENESS_Stages_9x16.mp4"
        out16 = WORK / "01_July-Tilie_ONENESS_Stages_16x9.mp4"
        out916 = WORK / "01_July-Tilie_ONENESS_Stages_9x16.mp4"

        fix_16x9(src16, out16)
        if src916.exists():
            fix_9x16(src916, out916)

        for base in (DRIVE, COMP):
            base.mkdir(parents=True, exist_ok=True)
            shutil.copy2(out16, base / out16.name)
            log(f"installed {base / out16.name}")
            if out916.exists():
                shutil.copy2(out916, base / out916.name)
                log(f"installed {base / out916.name}")

        # Spot-check frame
        check = WORK / "frame_fixed.jpg"
        run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", "10", "-i", str(out16), "-frames:v", "1", str(check),
            ]
        )
        log(f"spotcheck {check}")

        # Refresh Video1 july body + artist intro + finalize
        sys.path.insert(0, r"D:\circle-d-flow-web\scripts")
        import destiny_youtube_compilations as m

        july = next(a for a in m.VIDEO1 if a["id"] == "july")
        aw = m.WORK / "video1" / "july"
        aw.mkdir(parents=True, exist_ok=True)
        log("refresh Video1 july intro+body")
        m.make_intro(aw / "01_intro.mp4", july, aw)
        m.make_body(aw / "02_body.mp4", july, aw)
        # Show intro already says July Tilie; refresh credits anyway
        m.make_credits(m.WORK / "video1" / "99_credits.mp4", m.VIDEO1, m.WORK / "video1", "video1")
        log("finalize Video1")
        m.finalize_video("video1", m.VIDEO1, m.OUT_NAME_V1)
        log("DONE July Tilie name fix")
        return 0
    except Exception as e:
        log(f"ERROR {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
