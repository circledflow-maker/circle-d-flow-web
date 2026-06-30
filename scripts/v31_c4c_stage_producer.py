#!/usr/bin/env python3
"""
C4C Stage Producer (v31)
- Jannes Tattoo Portfolio (Secret Garden LX)
- Full Aftermovie: intro/outro, profile cards, split-screen, stone grade

Usage:
  python scripts/v31_c4c_stage_producer.py
  python scripts/v31_c4c_stage_producer.py --jannes-only
  python scripts/v31_c4c_stage_producer.py --aftermovie-only
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import textwrap
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r"D:\cdf27jue\cdfevent")
META = ROOT / "01_AGENT_PROCESSING" / "C4C_Event"
OUT = Path(r"D:\KYHeart_Social_Media\C4C_Video_Masters")
MUSIC = ROOT / "assets" / "audio" / "ambient.mp3"
ROSTER = META / "event_roster.json"
FACE_BUCKETS = META / "face_buckets.json"

VIDEO_EXT = {".mp4", ".mov", ".m4v"}
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp"}
GRADE = "eq=contrast=1.1:brightness=0.03:saturation=0.95,format=yuv420p,fps=30"
W, H = 1080, 1920
CARD_SEC = 3.0
INTRO_SEC = 6.0
OUTRO_SEC = 5.0
CLIP_SEC = 3.5


def ff() -> str:
    r = subprocess.run(["where", "ffmpeg"], capture_output=True, text=True, shell=True)
    if r.returncode != 0:
        sys.exit("ffmpeg not found")
    return r.stdout.strip().splitlines()[0]


def run(cmd: list, timeout=300) -> bool:
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=timeout)
        return True
    except Exception as e:
        print(f"  [!] {e}")
        return False


def best_portrait(folder: str) -> Path | None:
    for sub in ("_ReadyToShare", ""):
        base = SOURCE / folder / sub if sub else SOURCE / folder
        if not base.exists():
            continue
        photos = sorted(
            [p for p in base.iterdir() if p.suffix.lower() in PHOTO_EXT],
            key=lambda p: p.stat().st_size,
            reverse=True,
        )
        if photos:
            return photos[0]
    return None


def make_title_card(
    out: Path,
    lines: list[str],
    subtitle: str = "",
    portrait: Path | None = None,
    flow_type: str = "",
    duration: float = CARD_SEC,
) -> bool:
    """Generate portrait title card video (1080x1920)."""
    img = Image.new("RGB", (W, H), (12, 12, 14))
    draw = ImageDraw.Draw(img)

    # Gold accent bar
    draw.rectangle([0, 0, W, 8], fill=(212, 175, 55))

    try:
        font_lg = ImageFont.truetype("arial.ttf", 52)
        font_md = ImageFont.truetype("arial.ttf", 36)
        font_sm = ImageFont.truetype("arial.ttf", 28)
    except Exception:
        font_lg = font_md = font_sm = ImageFont.load_default()

    y = 120
    if portrait and portrait.exists():
        with Image.open(portrait) as p:
            p = ImageOps.exif_transpose(p).convert("RGB")
            p = ImageEnhance.Contrast(p).enhance(1.08)
            p.thumbnail((720, 900), Image.Resampling.LANCZOS)
            px = (W - p.width) // 2
            img.paste(p, (px, 180))
            y = 180 + p.height + 40

    for i, line in enumerate(lines):
        f = font_lg if i == 0 else font_md
        tw = draw.textlength(line, font=f)
        draw.text(((W - tw) / 2, y), line, fill=(212, 175, 55) if i == 0 else (255, 255, 255), font=f)
        y += 70

    if flow_type:
        tw = draw.textlength(flow_type, font=font_sm)
        draw.text(((W - tw) / 2, y), flow_type, fill=(0, 255, 204), font=font_sm)
        y += 50

    if subtitle:
        for wrapped in textwrap.wrap(subtitle, 40):
            tw = draw.textlength(wrapped, font=font_sm)
            draw.text(((W - tw) / 2, y), wrapped, fill=(180, 180, 180), font=font_sm)
            y += 36

    draw.text((40, H - 60), "Circle D Flow  |  Secret Garden LX", fill=(100, 100, 100), font=font_sm)

    png = out.with_suffix(".png")
    img.save(png, quality=95)
    return image_to_video(png, out, duration)


def image_to_video(png: Path, out: Path, duration: float) -> bool:
    out.parent.mkdir(parents=True, exist_ok=True)
    return run([
        ff(), "-y", "-loop", "1", "-i", str(png), "-t", str(duration),
        "-vf", f"scale={W}:{H},{GRADE}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
        str(out),
    ])


def process_clip(src: Path, dest: Path, duration: float = CLIP_SEC, start: float = 0.5) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    return run([
        ff(), "-y", "-ss", str(start), "-t", str(duration), "-i", str(src),
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{GRADE}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        str(dest),
    ], timeout=180)


def split_screen(left: Path, right: Path, dest: Path, duration: float = CLIP_SEC) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    filt = (
        f"[0:v]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,{GRADE}[L];"
        f"[1:v]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,{GRADE}[R];"
        f"[L][R]hstack=inputs=2,scale={W}:{H}[v]"
    )
    return run([
        ff(), "-y",
        "-ss", "0.5", "-t", str(duration), "-i", str(left),
        "-ss", "0.5", "-t", str(duration), "-i", str(right),
        "-filter_complex", filt,
        "-map", "[v]", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(dest),
    ], timeout=240)


def concat_videos(segments: list[Path], out: Path) -> bool:
    if not segments:
        return False
    lst = out.parent / "concat.txt"
    lst.write_text("\n".join(f"file '{s.resolve().as_posix()}'" for s in segments), encoding="utf-8")
    return run([ff(), "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)], timeout=600)


def add_music(video: Path, audio: Path, out: Path, vol: float = 0.35) -> bool:
    if not video.exists() or video.stat().st_size < 1000:
        return False
    # detect audio stream
    probe = subprocess.run(
        [ff(), "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(video)],
        capture_output=True, text=True,
    )
    has_audio = "audio" in (probe.stdout or "")

    if not audio.exists():
        if video.resolve() != out.resolve():
            import shutil
            shutil.copy2(video, out)
        return out.exists()

    if has_audio:
        ok = run([
            ff(), "-y", "-i", str(video), "-i", str(audio),
            "-filter_complex",
            f"[1:a]aloop=loop=-1:size=2e+09,volume={vol}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
            str(out),
        ], timeout=300)
    else:
        ok = run([
            ff(), "-y", "-i", str(video), "-i", str(audio),
            "-filter_complex", f"[1:a]aloop=loop=-1:size=2e+09,volume={vol},atrim=0:300[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
            str(out),
        ], timeout=300)

    if not ok or not out.exists() or out.stat().st_size < 1000:
        import shutil
        shutil.copy2(video, out)
    return out.exists() and out.stat().st_size > 1000


def media_for_artist(artist: str, folder: str | None, buckets: dict) -> list[Path]:
    paths = []
    key = f"artist_{artist}"
    if key in buckets:
        for e in buckets[key]:
            paths.append(Path(e["path"]))
    if folder:
        share = SOURCE / folder / "_ReadyToShare"
        if share.exists():
            for p in sorted(share.iterdir()):
                if p.suffix.lower() in VIDEO_EXT | PHOTO_EXT:
                    paths.append(p)
        base = SOURCE / folder
        for p in sorted(base.iterdir()):
            if p.is_file() and p.suffix.lower() in VIDEO_EXT | PHOTO_EXT:
                paths.append(p)
    # dedupe
    seen, out = set(), []
    for p in paths:
        rp = str(p.resolve())
        if rp not in seen and p.exists():
            seen.add(rp)
            out.append(p)
    return out


def jannes_media(buckets: dict) -> list[Path]:
    """Tattoo artist: Jannes folder + mis-bucketed Kael paths + early session tattoo B-roll."""
    items = media_for_artist("Jannes", "Jannes", buckets)
    # Rename fix: content in artist_Kael that belongs to Jannes folder
    for e in buckets.get("artist_Kael", []):
        p = Path(e["path"])
        if "Jannes" in str(p) or p.name.lower().startswith("dsc_067") or p.name.lower().startswith("dsc_070"):
            items.append(p)
    # early compressed tattoo/session videos
    for p in SOURCE.glob("DSC_06*.mp4"):
        items.append(p)
    for p in SOURCE.glob("DSC_07*.mp4"):
        if dsc_num(p.name) and 670 <= dsc_num(p.name) <= 752:
            items.append(p)
    seen, out = set(), []
    for p in items:
        if str(p.resolve()) not in seen and p.exists():
            seen.add(str(p.resolve()))
            out.append(p)
    videos = [p for p in out if p.suffix.lower() in VIDEO_EXT]
    photos = [p for p in out if p.suffix.lower() in PHOTO_EXT]
    return videos + photos[:12]


def dsc_num(name: str) -> int | None:
    m = re.search(r"DSC[_\s]?(\d+)", name, re.I)
    return int(m.group(1)) if m else None


def clip_from_media(src: Path, dest: Path) -> bool:
    if src.suffix.lower() in PHOTO_EXT:
        png = dest.with_suffix(".png")
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            im = ImageEnhance.Contrast(im).enhance(1.1)
            im = im.resize((W, H), Image.Resampling.LANCZOS)
            im.save(png, quality=92)
        return image_to_video(png, dest, 2.5)
    return process_clip(src, dest, duration=4.0 if "MOV" in src.suffix.upper() else 3.5)


def build_jannes_portfolio(buckets: dict) -> Path | None:
    print("[*] Jannes Tattoo Portfolio — Secret Garden LX")
    temp = OUT / "_temp_jannes"
    temp.mkdir(parents=True, exist_ok=True)
    segments = []

    intro = temp / "00_intro.mp4"
    make_title_card(
        intro,
        ["JANNES", "Tattoo & Art"],
        subtitle="Secret Garden LX  |  C for C",
        portrait=best_portrait("Jannes"),
        flow_type="Tattoo-Flow",
        duration=4.0,
    )
    segments.append(intro)

    media = jannes_media(buckets)
    print(f"  {len(media)} assets for portfolio")
    for i, src in enumerate(media[:16]):
        seg = temp / f"clip_{i:03d}.mp4"
        if clip_from_media(src, seg):
            segments.append(seg)

    outro = temp / "99_outro.mp4"
    make_title_card(
        outro,
        ["JANNES", "Portfolio"],
        subtitle="Circle D Flow  |  Book your Tattoo-Flow",
        flow_type="circledflow.com",
        duration=3.5,
    )
    segments.append(outro)

    silent = temp / "portfolio_silent.mp4"
    if not concat_videos(segments, silent):
        return None
    final = OUT / "Jannes_Tattoo_Portfolio_SecretGardenLX.mp4"
    add_music(silent, MUSIC, final, vol=0.25)
    print(f"  [+] {final}")
    return final if final.exists() else None


def build_aftermovie(roster: dict, buckets: dict) -> Path | None:
    print("[*] C4C Full Aftermovie — Circle D Stage")
    temp = OUT / "_temp_aftermovie_v31"
    temp.mkdir(parents=True, exist_ok=True)
    segments = []

    intro = temp / "intro.mp4"
    make_title_card(
        intro,
        ["CIRCLE D FLOW", "Community for Connections"],
        subtitle=roster.get("tagline", "One beat. One microphone. One stage."),
        duration=INTRO_SEC,
    )
    segments.append(intro)

    make_title_card(
        temp / "intro2.mp4",
        ["C for C", "Culture for Community"],
        subtitle=roster.get("location", "Lisbon"),
        duration=3.0,
    )
    segments.append(temp / "intro2.mp4")

    artists_done = set()
    for block in roster.get("sequence", []):
        artist = block.get("artist")
        folder = block.get("folder")
        flow = block.get("flow", "Audio-Flow")
        moment = block.get("moment")

        if moment and not artist:
            # venue / emotion b-roll
            mkey = f"moment_{moment}"
            pool = [Path(e["path"]) for e in buckets.get(mkey, []) if Path(e["path"]).exists()][:2]
            for i, src in enumerate(pool):
                seg = temp / f"moment_{moment}_{i}.mp4"
                if clip_from_media(src, seg):
                    segments.append(seg)
            continue

        if not artist or artist in artists_done:
            continue
        if artist == "Secret Garden LX Crew":
            folders = block.get("folders", ["Toni", "Dennis", "elisa"])
            clips = []
            for f in folders:
                clips.extend(media_for_artist(f, f, buckets))
            media = [p for p in clips if p.suffix.lower() in VIDEO_EXT][:4]
            portrait = best_portrait(folders[0]) if folders else None
        else:
            media = [p for p in media_for_artist(artist, folder, buckets) if p.suffix.lower() in VIDEO_EXT][:4]
            portrait = best_portrait(folder) if folder else None

        card = temp / f"card_{artist.replace(' ', '_')}.mp4"
        make_title_card(
            card,
            [artist.upper()],
            subtitle=block.get("label", ""),
            portrait=portrait,
            flow_type=flow,
            duration=CARD_SEC,
        )
        segments.append(card)
        artists_done.add(artist)

        vids = media if media else [p for p in media_for_artist(artist, folder, buckets) if p.suffix.lower() in VIDEO_EXT][:3]
        for i, src in enumerate(vids[:3]):
            seg = temp / f"{artist.replace(' ', '_')}_{i}.mp4"
            if clip_from_media(src, seg):
                segments.append(seg)

        # split-screen when 2+ clips
        if len(vids) >= 2:
            split = temp / f"split_{artist.replace(' ', '_')}.mp4"
            if split_screen(vids[0], vids[1], split, duration=3.5):
                segments.append(split)

    outro = temp / "outro.mp4"
    make_title_card(
        outro,
        ["CIRCLE D STAGE"],
        subtitle="One beat. One mic. One stage.  |  Thank you for the flow.",
        flow_type="circledflow.com",
        duration=OUTRO_SEC,
    )
    segments.append(outro)

    silent = temp / "aftermovie_silent.mp4"
    if not concat_videos(segments, silent):
        return None
    final = OUT / "C4C_Full_Aftermovie_CircleDStage.mp4"
    add_music(silent, MUSIC, final, vol=0.3)

    # manifest
    manifest = OUT / "AFTERMOVIE_SEQUENCE.md"
    lines = ["# C4C Aftermovie Sequence", "", "## Intro", "- Circle D Flow — Community for Connections", f"- {roster.get('tagline')}", ""]
    for block in roster.get("sequence", []):
        if block.get("artist"):
            lines.append(f"- **{block.get('time', '')}** {block['artist']} ({block.get('flow', '')}) — {block.get('label', '')}")
        elif block.get("moment"):
            lines.append(f"- **{block.get('time', '')}** Moment: {block['moment']}")
    lines.append("\n## Outro\n- Circle D Stage concept")
    manifest.write_text("\n".join(lines), encoding="utf-8")
    print(f"  [+] {final}")
    print(f"  [+] {manifest}")
    return final if final.exists() else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--jannes-only", action="store_true")
    parser.add_argument("--aftermovie-only", action="store_true")
    args = parser.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    buckets = json.loads(FACE_BUCKETS.read_text(encoding="utf-8")) if FACE_BUCKETS.exists() else {}
    roster = json.loads(ROSTER.read_text(encoding="utf-8"))

    results = {}
    if not args.aftermovie_only:
        results["jannes"] = build_jannes_portfolio(buckets)
    if not args.jannes_only:
        results["aftermovie"] = build_aftermovie(roster, buckets)

    status = OUT / "RENDER_STATUS.json"
    status.write_text(json.dumps({k: str(v) if v else None for k, v in results.items()}, indent=2), encoding="utf-8")
    print("\n=== RENDER COMPLETE ===")
    for k, v in results.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
