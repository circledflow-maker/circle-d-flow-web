#!/usr/bin/env python3
"""
C4C Video Master (v29)
- Stone-balanced color grade (warm, neutral mids)
- Interview preset (soft contrast, face-centered crop)
- Circle wipe transitions (xfade circleopen)
- 2x 15s reels with music + full aftermovie

Usage:
  python scripts/v29_c4c_video_master.py
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError:
    sys.exit("opencv-python required")

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(r"D:\cdf27jue\cdfevent")
MAP_FILE = ROOT / "01_AGENT_PROCESSING" / "C4C_Event" / "artists_map.json"
OUT = Path(r"D:\KYHeart_Social_Media\C4C_Video_Masters")
MUSIC = ROOT / "assets" / "audio" / "ambient.mp3"
VIDEO_EXT = {".mp4", ".mov", ".m4v"}

# Stone-mastered: balanced warm stone tone
GRADE_STONE = (
    "eq=brightness=0.03:contrast=1.08:saturation=0.94,"
    "colorbalance=rs=0.04:gs=0.02:bs=-0.03,"
    "curves=r='0/0.02 0.5/0.52 1/0.98':g='0/0.01 0.5/0.51 1/0.97':b='0/0 0.5/0.48 1/0.95'"
)
# Interview / conversation: softer, dialogue-friendly
GRADE_INTERVIEW = (
    "eq=brightness=0.05:contrast=1.02:saturation=0.88,"
    "unsharp=5:5:0.5:3:3:0.2"
)
XFADE = "circleopen"
XFADE_DUR = 0.45


def dsc_num(name: str) -> int | None:
    m = re.search(r"DSC[_\s]?(\d+)", name, re.I)
    return int(m.group(1)) if m else None


def ffmpeg() -> str:
    r = subprocess.run(["where", "ffmpeg"], capture_output=True, text=True, shell=True)
    if r.returncode != 0:
        sys.exit("ffmpeg not found")
    return r.stdout.strip().splitlines()[0]


def collect_videos(source: Path) -> list[dict]:
    items = []
    for f in sorted(source.rglob("*")):
        if f.suffix.lower() not in VIDEO_EXT:
            continue
        items.append({"path": f, "dsc": dsc_num(f.name), "name": f.name})
    return items


def face_center(path: Path) -> float:
    cap = cv2.VideoCapture(str(path))
    cap.set(cv2.CAP_PROP_POS_MSEC, 1500)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return 0.5
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml").detectMultiScale(gray, 1.2, 4)
    if len(faces) == 0:
        return 0.5
    x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
    return (x + w / 2) / frame.shape[1]


def crop_vf(cx: float, grade: str, interview: bool = False) -> str:
    """9:16 vertical crop centered on face for interviews."""
    grade_chain = GRADE_INTERVIEW if interview else GRADE_STONE
    return (
        f"scale=1080:1920:force_original_aspect_ratio=increase,"
        f"crop=1080:1920:max(0\\,min(iw-1080\\,iw*{cx:.3f}-540)):max(0\\,min(ih-1920\\,(ih-1920)/2)),"
        f"{grade_chain},format=yuv420p,fps=30"
    )


def render_clip(ffmpeg_bin: str, src: Path, dest: Path, duration: float, start: float, interview: bool) -> bool:
    cx = face_center(src) if interview else 0.5
    vf = crop_vf(cx, GRADE_STONE, interview=interview)
    cmd = [
        ffmpeg_bin, "-y", "-ss", str(start), "-t", str(duration),
        "-i", str(src), "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-an", str(dest),
    ]
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=180)
        return dest.exists() and dest.stat().st_size > 1000
    except Exception as e:
        print(f"  [!] clip fail {src.name}: {e}")
        return False


def concat_xfade(ffmpeg_bin: str, segments: list[Path], out: Path, seg_dur: float) -> bool:
    if not segments:
        return False
    if len(segments) == 1:
        shutil_copy(ffmpeg_bin, segments[0], out)
        return True

    inputs = []
    for s in segments:
        inputs.extend(["-i", str(s)])
    n = len(segments)
    d = XFADE_DUR
    # Chain xfade filters
    parts = []
    offset = seg_dur - d
    prev = "[0:v]"
    for i in range(1, n):
        nxt = f"[{i}:v]"
        outl = f"[v{i}]" if i < n - 1 else "[vout]"
        parts.append(f"{prev}{nxt}xfade=transition={XFADE}:duration={d}:offset={offset:.2f}{outl}")
        prev = outl
        offset += seg_dur - d
    fc = ";".join(parts)
    cmd = [ffmpeg_bin, "-y", *inputs, "-filter_complex", fc, "-map", "[vout]", "-c:v", "libx264", "-crf", "18", "-preset", "fast", str(out)]
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=300)
        return out.exists()
    except Exception as e:
        print(f"  [!] xfade fail, concat fallback: {e}")
        return concat_simple(ffmpeg_bin, segments, out)


def concat_simple(ffmpeg_bin: str, segments: list[Path], out: Path) -> bool:
    lst = out.parent / "concat_list.txt"
    lst.write_text("\n".join(f"file '{s.resolve().as_posix()}'" for s in segments), encoding="utf-8")
    cmd = [ffmpeg_bin, "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)]
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=120)
        return out.exists()
    except Exception:
        return False


def shutil_copy(ffmpeg_bin: str, src: Path, dest: Path) -> None:
    subprocess.run([ffmpeg_bin, "-y", "-i", str(src), "-c", "copy", str(dest)], capture_output=True)


def add_music(ffmpeg_bin: str, video: Path, audio: Path, out: Path, duration: float) -> bool:
    cmd = [
        ffmpeg_bin, "-y",
        "-i", str(video), "-i", str(audio),
        "-filter_complex", f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{duration},volume=0.55[a]",
        "-map", "0:v", "-map", "[a]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out),
    ]
    try:
        subprocess.run(cmd, capture_output=True, check=True, timeout=120)
        return out.exists()
    except Exception as e:
        print(f"  [!] music mux fail: {e}")
        return False


def pick_clips(videos: list, dsc_lo: int, dsc_hi: int, folder: str | None, limit: int) -> list:
    pool = []
    for v in videos:
        p = v["path"]
        rel = str(p.relative_to(SOURCE)) if p.is_relative_to(SOURCE) else p.name
        top = rel.split(os.sep)[0] if os.sep in rel else "root"
        in_range = v["dsc"] is not None and dsc_lo <= v["dsc"] <= dsc_hi
        in_folder = folder and top == folder
        if in_range or in_folder:
            pool.append(v)
    pool.sort(key=lambda x: x["dsc"] or 0)
    if not pool:
        pool = [v for v in videos if v["dsc"] and dsc_lo <= v["dsc"] <= dsc_hi]
    step = max(1, len(pool) // limit) if pool else 1
    return pool[::step][:limit]


def build_reel(ffmpeg_bin: str, name: str, clips: list, out_dir: Path, interview: bool, music: Path) -> Path | None:
    print(f"[*] Reel: {name} ({'interview' if interview else 'stone'})")
    temp = out_dir / f"_temp_{name}"
    temp.mkdir(parents=True, exist_ok=True)
    seg_dur = 3.8
    n_clips = 4
    selected = clips[:n_clips] if len(clips) >= n_clips else clips
    if len(selected) < 2:
        print(f"  [!] not enough clips for {name}")
        return None

    segments = []
    for i, c in enumerate(selected):
        seg = temp / f"seg_{i:03d}.mp4"
        if render_clip(ffmpeg_bin, c["path"], seg, seg_dur, 0.5, interview):
            segments.append(seg)

    if len(segments) < 2:
        return None

    silent = temp / "silent.mp4"
    if not concat_xfade(ffmpeg_bin, segments, silent, seg_dur):
        return None

    final = out_dir / f"{name}.mp4"
    if music.exists():
        add_music(ffmpeg_bin, silent, music, final, 15.0)
    else:
        subprocess.run([ffmpeg_bin, "-y", "-i", str(silent), "-t", "15", "-c", "copy", str(final)], capture_output=True)
    print(f"  [+] {final}")
    return final if final.exists() else None


def build_aftermovie(ffmpeg_bin: str, videos: list, out_dir: Path, music: Path) -> Path | None:
    print("[*] Aftermovie (60s, stone + circle transitions)")
    temp = out_dir / "_temp_aftermovie"
    temp.mkdir(parents=True, exist_ok=True)
    pool = [v for v in videos if v["dsc"] and 8909 <= v["dsc"] <= 9234]
    pool.sort(key=lambda x: x["dsc"])
    step = max(1, len(pool) // 24)
    selected = pool[::step][:24]
    seg_dur = 2.5
    segments = []
    for i, c in enumerate(selected):
        seg = temp / f"am_{i:03d}.mp4"
        interview = c["dsc"] and c["dsc"] < 8800
        if render_clip(ffmpeg_bin, c["path"], seg, seg_dur, 1.0, interview):
            segments.append(seg)
        if len(segments) >= 20:
            break

    if len(segments) < 3:
        print("  [!] aftermovie: insufficient segments")
        return None

    silent = temp / "after_silent.mp4"
    if not concat_xfade(ffmpeg_bin, segments[:12], silent, seg_dur):
        concat_simple(ffmpeg_bin, segments[:12], silent)

    final = out_dir / "C4C_Full_Aftermovie.mp4"
    dur = min(75.0, len(segments[:12]) * (seg_dur - XFADE_DUR) + seg_dur)
    if music.exists():
        add_music(ffmpeg_bin, silent, music, final, dur)
    else:
        subprocess.run([ffmpeg_bin, "-y", "-i", str(silent), "-t", str(dur), "-c", "copy", str(final)], capture_output=True)
    print(f"  [+] {final}")
    return final if final.exists() else None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ff = ffmpeg()
    videos = collect_videos(SOURCE)
    print(f"Found {len(videos)} videos in {SOURCE}")

    artist_map = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    criz = next((a for a in artist_map["artists"] if a["name"] == "C-Riz"), None)
    lo, hi = (8960, 9005)
    if criz and criz.get("dsc_ranges"):
        lo, hi = criz["dsc_ranges"][0]

    criz_clips = pick_clips(videos, lo, hi, "A", 8)
    crowd_clips = pick_clips(videos, 9023, 9170, None, 8)
    interview_clips = pick_clips(videos, 643, 752, "Sandu", 6) + pick_clips(videos, 8764, 8885, None, 4)

    results = {}
    results["reel_criz_stone"] = build_reel(ff, "2026-07-15_reel_15s_C-Riz_stone", criz_clips, OUT, False, MUSIC)
    results["reel_community_interview"] = build_reel(
        ff, "2026-07-19_reel_15s_community_interview",
        (interview_clips or crowd_clips)[:8], OUT, True, MUSIC
    )
    results["aftermovie"] = build_aftermovie(ff, videos, OUT, MUSIC)

    manifest = OUT / "VIDEO_MANIFEST.json"
    manifest.write_text(json.dumps({k: str(v) if v else None for k, v in results.items()}, indent=2), encoding="utf-8")
    print(f"\nDone -> {OUT}")
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
