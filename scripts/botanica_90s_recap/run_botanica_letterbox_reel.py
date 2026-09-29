#!/usr/bin/env python3
"""
Second Botanica 90s reel — vertical story / CapCut-style layout (screenshot look):

  - 1080x1920 black canvas
  - landscape clip centered (letterboxed)
  - top-left red badge + "Engaging"
  - large white word captions in the lower band
  - ~90s, Stages pacing, loudnorm audio

Sources: all event footage under Botanica (prefers Wako Kungo, then other folders).

  python scripts/botanica_90s_recap/run_botanica_letterbox_reel.py --root "D:\\Wakungo_Content_Studio\\Botanica" --force

Output:
  Botanica/EXPORT/BOTANICA_90s_ENGAGING_LETTERBOX_9x16.mp4
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm"}
SKIP_DIR_NAMES = {
    "ANALYSIS",
    "ARTISTS",
    "EVENT_SELECTS",
    "STILLS",
    "EDIT",
    "EXPORT",
    "DRIVE_UPLOAD",
    "00_work",
    "03_Proxies_Compressed",
    "__pycache__",
    ".git",
}

# Single-word captions like the screenshot ("so")
DEFAULT_CAPTIONS = [
    "LIVE",
    "SO",
    "FEEL",
    "NOW",
    "MOVE",
    "BREATHE",
    "TOGETHER",
    "ENERGY",
    "LISBON",
    "GROOVE",
    "SOUND",
    "NIGHT",
    "HEART",
    "BOTANICA",
    "WAKO",
]

FONT_CANDIDATES = [
    Path(r"C:/Windows/Fonts/arialbd.ttf"),
    Path(r"C:/Windows/Fonts/arial.ttf"),
    Path(r"C:/Windows/Fonts/segoeuib.ttf"),
    Path(r"C:/Windows/Fonts/segoeui.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(">", " ".join(str(c) for c in cmd[:14]), "…" if len(cmd) > 14 else "")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def find_font() -> Optional[Path]:
    env = os.environ.get("BOTANICA_FONT")
    if env and Path(env).exists():
        return Path(env)
    for p in FONT_CANDIDATES:
        if p.exists():
            return p
    return None


def ffmpeg_fontfile_arg(font: Path) -> str:
    s = font.resolve().as_posix()
    if re.match(r"^[A-Za-z]:/", s):
        s = s[0] + "\\:" + s[2:]
    return s


def ffprobe(path: Path) -> dict[str, Any]:
    r = run(
        [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ]
    )
    return json.loads(r.stdout or "{}")


def is_skipped(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return True
    return any(part in SKIP_DIR_NAMES for part in rel.parts)


def inventory_videos(root: Path) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for p in sorted(root.rglob("*")):
        if not p.is_file() or is_skipped(p, root):
            continue
        if p.suffix.lower() not in VIDEO_EXT:
            continue
        if "concept9-16" in p.name.lower():
            continue
        try:
            info = ffprobe(p)
            vs = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
            as_ = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
            items.append(
                {
                    "path": str(p),
                    "name": p.name,
                    "duration": float(info.get("format", {}).get("duration") or 0),
                    "width": int(vs.get("width") or 0),
                    "height": int(vs.get("height") or 0),
                    "has_audio": bool(as_),
                    "bitrate": int(info.get("format", {}).get("bit_rate") or 0),
                    "in_wako": "wako kungo" in str(p).lower().replace("\\", "/"),
                }
            )
        except Exception as e:
            items.append({"path": str(p), "name": p.name, "duration": 0, "error": str(e), "in_wako": False})
    items = [v for v in items if v.get("duration", 0) > 2.5]
    items.sort(
        key=lambda v: (
            1 if v.get("in_wako") else 0,
            v.get("width", 0) * v.get("height", 0),
            v.get("duration", 0),
        ),
        reverse=True,
    )
    return items


def load_captions(repo: Path) -> list[str]:
    seed = repo / "scripts" / "botanica_90s_recap" / "artist_seed.json"
    if seed.exists():
        data = json.loads(seed.read_text(encoding="utf-8"))
        words = data.get("letterbox_captions") or []
        # also split text_interruptions into short words
        for t in data.get("text_interruptions") or []:
            for part in re.split(r"\s+", t.strip()):
                if 2 <= len(part) <= 12:
                    words.append(part.upper())
        cleaned = []
        seen = set()
        for w in words + DEFAULT_CAPTIONS:
            w = re.sub(r"[^A-Za-zÀ-ÿ0-9]", "", w).upper()
            if w and w not in seen:
                seen.add(w)
                cleaned.append(w)
        if cleaned:
            return cleaned
    return DEFAULT_CAPTIONS


def plan_segments(videos: list[dict[str, Any]], captions: list[str], target: float = 90.0) -> list[dict[str, Any]]:
    """~2.0–2.6s shots across many source files + rotating caption words."""
    if not videos:
        return []
    segs: list[dict[str, Any]] = []
    pool = videos[:20] or videos
    total = sum(v["duration"] for v in pool) or 1.0
    n = 40
    shot_i = 0
    for v in pool:
        share = max(1, int(round(n * (v["duration"] / total))))
        dur = float(v["duration"])
        usable0 = max(1.0, dur * 0.12)
        usable1 = max(usable0 + 3.0, dur * 0.88)
        span = usable1 - usable0
        for k in range(share):
            if shot_i >= n:
                break
            t0 = usable0 + span * ((k + 0.4) / max(share, 1))
            length = 1.9 + (shot_i % 4) * 0.2  # 1.9–2.5
            t1 = min(usable1 - 0.1, t0 + length)
            if t1 - t0 < 0.7:
                continue
            word = captions[shot_i % len(captions)]
            segs.append(
                {
                    "source": v["path"],
                    "in": round(t0, 3),
                    "out": round(t1, 3),
                    "caption": word,
                    "badge": "Engaging",
                    "i": shot_i,
                }
            )
            shot_i += 1
        if shot_i >= n:
            break

    # trim to ~target seconds
    acc = 0.0
    kept = []
    for s in segs:
        d = s["out"] - s["in"]
        if acc + d > target + 2:
            break
        kept.append(s)
        acc += d
    return kept


def render_letterbox_clip(
    seg: dict[str, Any],
    out: Path,
    font: Optional[Path],
    force: bool,
) -> bool:
    if out.exists() and out.stat().st_size > 30_000 and not force:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    dur = max(0.7, seg["out"] - seg["in"])
    caption = seg["caption"].replace(":", "\\:").replace("'", "")
    badge = seg.get("badge", "Engaging").replace(":", "\\:").replace("'", "")

    # Landscape fit width 1080, pad to 9:16 black; video sits upper-mid; caption lower
    # overlay y ≈ (1920-608)/2 - 80 ≈ 576 for 16:9 → shift up a bit
    font_arg = ""
    if font:
        font_arg = f":fontfile='{ffmpeg_fontfile_arg(font)}'"

    # Badge: red rounded-ish box via drawbox + white label
    # Caption: large white centered in lower third
    vf = (
        f"scale=1080:-2:force_original_aspect_ratio=decrease,"
        f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2-140:black,"
        f"hqdn3d=1.0:1.0:2.5:2.5,"
        f"eq=contrast=1.06:brightness=0.02:saturation=0.96,"
        # red badge plate
        f"drawbox=x=48:y=72:w=220:h=56:color=0xE03131@1:t=fill,"
        # badge text
        f"drawtext=text='{badge}'{font_arg}:fontcolor=white:fontsize=28:"
        f"x=70:y=86,"
        # big caption word
        f"drawtext=text='{caption}'{font_arg}:fontcolor=white:fontsize=96:"
        f"x=(w-text_w)/2:y=h-280:borderw=0"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        f"{seg['in']:.3f}",
        "-i",
        seg["source"],
        "-t",
        f"{dur:.3f}",
        "-vf",
        vf,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        str(out),
    ]
    try:
        run(cmd)
        return out.exists() and out.stat().st_size > 20_000
    except subprocess.CalledProcessError as e:
        # retry without drawtext if font/drawtext fails
        print("WARN letterbox drawtext failed, retry plain:", (e.stderr or "")[-220:])
        vf2 = (
            "scale=1080:-2:force_original_aspect_ratio=decrease,"
            "pad=1080:1920:(ow-iw)/2:(oh-ih)/2-140:black,"
            "hqdn3d=1.0:1.0:2.5:2.5"
        )
        try:
            run(
                [
                    "ffmpeg",
                    "-y",
                    "-ss",
                    f"{seg['in']:.3f}",
                    "-i",
                    seg["source"],
                    "-t",
                    f"{dur:.3f}",
                    "-vf",
                    vf2,
                    "-an",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "fast",
                    "-crf",
                    "17",
                    "-pix_fmt",
                    "yuv420p",
                    str(out),
                ]
            )
            return out.exists()
        except subprocess.CalledProcessError:
            return False


def extract_audio(videos: list[dict[str, Any]], work: Path, seconds: float) -> Optional[Path]:
    with_audio = [v for v in videos if v.get("has_audio")]
    if not (with_audio or videos):
        return None
    src = max(with_audio or videos, key=lambda v: v.get("duration", 0))
    out = work / "audio_bed_letterbox_90s.m4a"
    dur = float(src.get("duration") or 120)
    start = max(0.0, min(dur * 0.30, max(0.0, dur - seconds - 1)))
    fade = max(0.0, seconds - 2.0)
    try:
        run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                f"{start:.2f}",
                "-i",
                src["path"],
                "-t",
                f"{seconds:.2f}",
                "-vn",
                "-af",
                f"loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.7,afade=t=out:st={fade:.2f}:d=1.8",
                "-c:a",
                "aac",
                "-b:a",
                "256k",
                str(out),
            ]
        )
        return out if out.exists() else None
    except subprocess.CalledProcessError:
        return None


def assemble(clips: list[Path], audio: Optional[Path], master: Path, target: float, work: Path) -> Path:
    concat = work / "letterbox_concat.txt"
    lines = []
    for p in clips:
        ap = str(p.resolve()).replace("'", "'\\''")
        lines.append(f"file '{ap}'")
    concat.write_text("\n".join(lines) + "\n", encoding="utf-8")
    silent = master.with_name(master.stem + "_silent.mp4")
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat),
            "-vf",
            "fps=30,format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "17",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-t",
            str(target),
            str(silent),
        ]
    )
    if audio and audio.exists():
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(silent),
                "-i",
                str(audio),
                "-map",
                "0:v:0",
                "-map",
                "1:a:0",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-b:a",
                "256k",
                "-shortest",
                "-movflags",
                "+faststart",
                str(master),
            ]
        )
    else:
        shutil.copy2(silent, master)
    return master


def default_root() -> Path:
    env = os.environ.get("BOTANICA_ROOT")
    if env:
        return Path(env)
    for c in (Path(r"D:/Wakungo_Content_Studio/Botanica"), Path("/mnt/d/Wakungo_Content_Studio/Botanica")):
        if c.exists():
            return c
    return Path(r"D:/Wakungo_Content_Studio/Botanica")


def main() -> int:
    ap = argparse.ArgumentParser(description="Botanica 90s Engaging letterbox reel")
    ap.add_argument("--root", type=Path, default=None)
    ap.add_argument("--repo", type=Path, default=None)
    ap.add_argument("--seconds", type=float, default=90.0)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if not which("ffmpeg") or not which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe required")
        return 2

    root = args.root or default_root()
    repo = args.repo or Path(__file__).resolve().parents[2]
    print(f"Root: {root}")
    if not root.exists():
        print("BLOCKER: Botanica root missing — run on PC with D:")
        return 3

    work = root / "00_work" / "letterbox_reel_tmp"
    export = root / "EXPORT"
    export.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    clips_dir = work / "clips"
    if args.force and clips_dir.exists():
        shutil.rmtree(clips_dir, ignore_errors=True)
    clips_dir.mkdir(parents=True, exist_ok=True)

    font = find_font()
    print(f"Font: {font or 'NONE (badge/captions may be skipped)'}")

    print("01 — Inventory Botanica folders…")
    videos = inventory_videos(root)
    wako_n = sum(1 for v in videos if v.get("in_wako"))
    print(f"   videos={len(videos)} (Wako Kungo={wako_n})")
    if not videos:
        print("BLOCKER: no videos under Botanica")
        return 4

    captions = load_captions(repo)
    segs = plan_segments(videos, captions, args.seconds)
    print(f"02 — Planned {len(segs)} letterbox segments")

    print("03 — Render letterbox + Engaging badge + captions…")
    outs: list[Path] = []
    for s in segs:
        out = clips_dir / f"lb_{s['i']:03d}_{s['caption'].lower()}.mp4"
        if render_letterbox_clip(s, out, font, args.force):
            outs.append(out)
    print(f"   rendered {len(outs)}/{len(segs)}")
    if not outs:
        print("BLOCKER: no letterbox clips rendered")
        return 5

    print("04 — Audio bed…")
    audio = extract_audio(videos, work, args.seconds)

    master = export / "BOTANICA_90s_ENGAGING_LETTERBOX_9x16.mp4"
    print("05 — Assemble 90s master…")
    assemble(outs, audio, master, args.seconds, work)

    # Drive copy
    drive = root / "DRIVE_UPLOAD" / "EVENT"
    drive.mkdir(parents=True, exist_ok=True)
    shutil.copy2(master, drive / master.name)

    plan_path = root / "ANALYSIS" / "letterbox_reel_plan.json"
    plan_path.parent.mkdir(exist_ok=True)
    plan_path.write_text(
        json.dumps({"created_at": utc_now(), "master": str(master), "segments": segs}, indent=2),
        encoding="utf-8",
    )

    print(f"\nDONE → {master}")
    print(f"Also  → {drive / master.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
