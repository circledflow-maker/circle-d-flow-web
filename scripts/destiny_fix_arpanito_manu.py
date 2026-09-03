#!/usr/bin/env python3
"""Fix Arpanito quiet-voice section + trim Manu start; refresh Video2 segments.

Arpanito (Video2 wall 22:22-25:05) maps to package ~74.6s-237.6s — boost voice.
Manu should start at Video2 33:37 → package start ~72.2s (drop early lead-in).
All work/output on D:.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July")
WORK = ROOT / "00_work" / "audio_fix"
LOGS = ROOT / "003" / "00_logs"
A002 = ROOT / "002" / "06_drive_ready" / "Circle_D_Stages" / "Artists"
A003 = ROOT / "003" / "06_drive_ready" / "Circle_D_Stages" / "Artists"
COMP2 = ROOT / "002" / "04_videos_compressed" / "Artists"
COMP3 = ROOT / "003" / "04_videos_compressed" / "Artists"

# Mapped from delivered Video2 timeline
ARP_T0 = 74.6
ARP_T1 = 237.6
MANU_START = 72.2
FPS = "60000/1001"
INTRO = 7.0
FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"


def log(msg: str) -> None:
    print(msg, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "arpanito_manu_fix.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def run(cmd: list[str], err: Path | None = None) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if err is not None:
        err.write_text((r.stderr or "")[-12000:], encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-2000:])


def probe_dur(p: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True,
        text=True,
    )
    return float(r.stdout.strip() or 0)


def boost_arpanito(src: Path, dst: Path) -> None:
    """Keep video; boost voice band + gain only in quiet window."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    # +7dB overall in window + mid presence for spoken voice; limiter prevents peaks
    af = (
        f"equalizer=f=2000:t=h:width=2800:g=4:enable='between(t\\,{ARP_T0}\\,{ARP_T1})',"
        f"volume=enable='between(t\\,{ARP_T0}\\,{ARP_T1})':volume=6dB,"
        f"alimiter=limit=0.95"
    )
    log(f"Arpanito audio boost {ARP_T0}-{ARP_T1}s -> {dst.name}")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src),
            "-c:v", "copy",
            "-af", af,
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-movflags", "+faststart",
            str(dst),
        ],
        WORK / "arpanito_af_err.txt",
    )


def rebuild_manu(src: Path, dst: Path, title: str = "Manu Allegro", ig: str = "@manuallegro") -> None:
    """New package starting at MANU_START: black intro + body from that point."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    total = probe_dur(src)
    body_dur = max(1.0, total - MANU_START)
    intro = WORK / "manu_intro.mp4"
    body = WORK / "manu_body.mp4"
    vf_intro = (
        f"drawtext=fontfile='{FONT_B}':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:"
        f"x=(w-text_w)/2:y=h*0.20,"
        f"drawtext=fontfile='{FONT_B}':text='Wako Kungo  ONENESS':fontsize=50:fontcolor=#E8C547:"
        f"x=(w-text_w)/2:y=h*0.32,"
        f"drawtext=fontfile='{FONT_R}':text='Sunset Destination Hostel - Cais do Sodre':fontsize=26:fontcolor=white@0.88:"
        f"x=(w-text_w)/2:y=h*0.46,"
        f"drawtext=fontfile='{FONT_B}':text='{title}':fontsize=48:fontcolor=white:"
        f"x=(w-text_w)/2:y=h*0.64,"
        f"drawtext=fontfile='{FONT_R}':text='{ig}':fontsize=28:fontcolor=white@0.92:"
        f"x=(w-text_w)/2:y=h*0.78,"
        f"format=yuv420p,fps={FPS}"
    )
    log(f"Manu trim start={MANU_START}s intro")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:r={FPS}:d={INTRO}",
            "-ss", str(MANU_START), "-t", str(INTRO), "-i", str(src),
            "-vf", vf_intro,
            "-map", "0:v:0", "-map", "1:a:0",
            "-t", str(INTRO),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-r", FPS, "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            str(intro),
        ],
        WORK / "manu_intro_err.txt",
    )
    log(f"Manu body from {MANU_START:.1f}s dur={body_dur:.1f}s")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", str(MANU_START), "-i", str(src),
            "-t", str(body_dur),
            "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fps={FPS}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-r", FPS, "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            str(body),
        ],
        WORK / "manu_body_err.txt",
    )
    lst = WORK / "manu_concat.txt"
    lst.write_text(f"file '{intro.as_posix()}'\nfile '{body.as_posix()}'\n", encoding="ascii")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy",
            "-movflags", "+faststart",
            str(dst),
        ],
        WORK / "manu_concat_err.txt",
    )
    log(f"Manu new package dur={probe_dur(dst):.1f}s")


def install(src: Path, *dests: Path) -> None:
    for d in dests:
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, d)
        log(f"installed {d}")


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    try:
        arp_src = A002 / "Arpanito" / "01_Arpanito_ONENESS_Stages_16x9.mp4"
        arp_out = WORK / "01_Arpanito_ONENESS_Stages_16x9.mp4"
        boost_arpanito(arp_src, arp_out)
        install(
            arp_out,
            A002 / "Arpanito" / "01_Arpanito_ONENESS_Stages_16x9.mp4",
            COMP2 / "Arpanito" / "01_Arpanito_ONENESS_Stages_16x9.mp4",
        )
        # 9x16: audio-only remux if present
        arp_9 = A002 / "Arpanito" / "01_Arpanito_ONENESS_Stages_9x16.mp4"
        if arp_9.exists():
            # Map same absolute times (package aligned)
            out9 = WORK / "01_Arpanito_ONENESS_Stages_9x16.mp4"
            boost_arpanito(arp_9, out9)
            install(out9, arp_9, COMP2 / "Arpanito" / "01_Arpanito_ONENESS_Stages_9x16.mp4")

        manu_src = A003 / "Manu_Allegro" / "01_Manu-Allegro_ONENESS_Stages_16x9.mp4"
        # Keep backup of original once
        bak = A003 / "Manu_Allegro" / "01_Manu-Allegro_ONENESS_Stages_16x9_FULL_BACKUP.mp4"
        if not bak.exists():
            log(f"backup Manu -> {bak.name}")
            shutil.copy2(manu_src, bak)
        manu_out = WORK / "01_Manu-Allegro_ONENESS_Stages_16x9.mp4"
        rebuild_manu(bak if bak.exists() else manu_src, manu_out)
        install(
            manu_out,
            A003 / "Manu_Allegro" / "01_Manu-Allegro_ONENESS_Stages_16x9.mp4",
            COMP3 / "Manu_Allegro" / "01_Manu-Allegro_ONENESS_Stages_16x9.mp4",
        )
        log("DONE package fixes")
        return 0
    except Exception as e:
        log(f"ERROR {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
