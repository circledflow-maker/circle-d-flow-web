#!/usr/bin/env python3
"""
BOTANICA — 90s CINEMATIC EVENT RECAP pipeline (v2 quality + empty-content fix)
One-camera source → virtual crops → 9:16 master on D:\\Wakungo_Content_Studio\\Botanica

  python scripts/botanica_90s_recap/run_botanica_recap.py --root "D:/Wakungo_Content_Studio/Botanica" --force

Requires: ffmpeg, ffprobe (on PATH).
NEVER overwrites originals — writes under Botanica/ANALYSIS|ARTISTS|EDIT|EXPORT|…
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".mts", ".mxf", ".webm"}
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic"}
SKIP_DIR_NAMES = {
    "ANALYSIS",
    "ARTISTS",
    "EVENT_SELECTS",
    "STILLS",
    "EDIT",
    "EXPORT",
    "00_work",
    "03_Proxies_Compressed",
    "__pycache__",
    ".git",
}

# Safer digital zoom: avoid muddy ultra-tight crops on soft low-light sources
VIRTUAL_CROPS = {
    "WIDE": {"w": 1.0, "h": 1.0, "x": 0.0, "y": 0.0},
    "MEDIUM": {"w": 0.78, "h": 0.78, "x": 0.11, "y": 0.10},
    "CLOSE_UP": {"w": 0.58, "h": 0.58, "x": 0.21, "y": 0.14},
    "PORTRAIT": {"w": 0.50, "h": 0.78, "x": 0.25, "y": 0.06},
    "DETAIL": {"w": 0.46, "h": 0.46, "x": 0.27, "y": 0.38},
    "CROWD": {"w": 0.62, "h": 0.50, "x": 0.30, "y": 0.42},
    "INSTRUMENT": {"w": 0.55, "h": 0.45, "x": 0.18, "y": 0.40},
    "ENVIRONMENT": {"w": 0.92, "h": 0.58, "x": 0.04, "y": 0.04},
}

CHAPTER_CROPS = {
    "arrival": ["ENVIRONMENT", "WIDE", "MEDIUM"],
    "venue": ["WIDE", "ENVIRONMENT", "DETAIL"],
    "people": ["CROWD", "MEDIUM", "PORTRAIT"],
    "artists": ["PORTRAIT", "CLOSE_UP", "MEDIUM"],
    "performance": ["CLOSE_UP", "MEDIUM", "INSTRUMENT", "WIDE"],
    "audience": ["CROWD", "WIDE", "MEDIUM"],
    "peak": ["CLOSE_UP", "MEDIUM", "CROWD", "WIDE"],
    "closing": ["WIDE", "ENVIRONMENT", "PORTRAIT"],
}

FONT_CANDIDATES = [
    Path(r"C:/Windows/Fonts/arialbd.ttf"),
    Path(r"C:/Windows/Fonts/arial.ttf"),
    Path(r"C:/Windows/Fonts/segoeuib.ttf"),
    Path(r"C:/Windows/Fonts/segoeui.ttf"),
    Path(r"C:/Windows/Fonts/calibrib.ttf"),
    Path(r"C:/Windows/Fonts/calibri.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(">", " ".join(str(c) for c in cmd[:12]), "…" if len(cmd) > 12 else "")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def ffprobe_json(path: Path) -> dict[str, Any]:
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


def find_font() -> Optional[Path]:
    env = os.environ.get("BOTANICA_FONT")
    if env and Path(env).exists():
        return Path(env)
    for p in FONT_CANDIDATES:
        if p.exists():
            return p
    return None


def ffmpeg_fontfile_arg(font: Path) -> str:
    # drawtext fontfile needs escaped drive colon on Windows
    s = font.resolve().as_posix()
    if re.match(r"^[A-Za-z]:/", s):
        s = s[0] + "\\:" + s[2:]
    return s


def ensure_dirs(root: Path) -> dict[str, Path]:
    tree = {
        "ANALYSIS": root / "ANALYSIS",
        "ARTISTS": root / "ARTISTS",
        "EVENT_SELECTS": root / "EVENT_SELECTS",
        "STILLS": root / "STILLS",
        "EDIT": root / "EDIT" / "90s_MASTER",
        "EDIT_PROJECT": root / "EDIT" / "PROJECT_FILE",
        "EXPORT": root / "EXPORT",
        "EXPORT_ARTISTS": root / "EXPORT" / "ARTIST_CONTENT",
        "WORK": root / "00_work" / "recap_tmp",
    }
    for p in tree.values():
        p.mkdir(parents=True, exist_ok=True)
    for sub in (
        "BAND",
        "CROWD_WIDE",
        "CROWD_CLOSE",
        "DANCE",
        "VENUE",
        "PERFORMANCE",
        "DETAILS",
        "ATMOSPHERE",
    ):
        (tree["EVENT_SELECTS"] / sub).mkdir(parents=True, exist_ok=True)
    for sub in ("ARTISTS", "BAND", "CROWD", "DANCE", "VENUE", "PERFORMANCE", "DETAILS"):
        (tree["STILLS"] / sub).mkdir(parents=True, exist_ok=True)
    return tree


def is_under_skip(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return True
    return any(part in SKIP_DIR_NAMES for part in rel.parts)


def inventory_media(root: Path) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        if is_under_skip(p, root):
            continue
        ext = p.suffix.lower()
        kind = "video" if ext in VIDEO_EXT else "photo" if ext in PHOTO_EXT else None
        if not kind:
            continue
        meta: dict[str, Any] = {
            "path": str(p),
            "name": p.name,
            "kind": kind,
            "ext": ext,
            "bytes": p.stat().st_size,
            "mtime": datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).isoformat(),
        }
        if kind == "video":
            try:
                info = ffprobe_json(p)
                vs = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
                as_ = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
                meta.update(
                    {
                        "duration": float(info.get("format", {}).get("duration") or 0),
                        "width": int(vs.get("width") or 0),
                        "height": int(vs.get("height") or 0),
                        "codec": vs.get("codec_name"),
                        "fps": vs.get("r_frame_rate"),
                        "has_audio": bool(as_),
                        "bitrate": int(info.get("format", {}).get("bit_rate") or 0),
                    }
                )
            except Exception as e:
                meta["probe_error"] = str(e)
        items.append(meta)
    by_stem: dict[str, list[dict[str, Any]]] = {}
    for it in items:
        stem = Path(it["name"]).stem.lower()
        stem = re.sub(r"(_proxy|_low|_small|_comp|_compressed)$", "", stem)
        by_stem.setdefault(stem, []).append(it)
    for stem, group in by_stem.items():
        if len(group) < 2:
            for g in group:
                g["quality_rank"] = "unique"
            continue

        def score(g: dict[str, Any]) -> tuple:
            return (
                g.get("width", 0) * g.get("height", 0),
                g.get("bitrate", 0),
                g.get("bytes", 0),
            )

        best = max(group, key=score)
        for g in group:
            g["quality_rank"] = "best" if g is best else "duplicate_or_proxy"
            g["best_of_stem"] = best["path"]
    return items


def load_artist_seed(repo_root: Path) -> dict[str, Any]:
    seed = repo_root / "scripts" / "botanica_90s_recap" / "artist_seed.json"
    if seed.exists():
        return json.loads(seed.read_text(encoding="utf-8"))
    return {"artists": [], "story_chapters": [], "text_interruptions": []}


def seed_artist_folders(artists_root: Path, seed: dict[str, Any]) -> None:
    for a in seed.get("artists", []):
        folder = a.get("folder") or a["id"]
        base = artists_root / folder
        for sub in (
            "00_REF",
            "01_VIDEOS_STABILIZED",
            "02_PHOTOS_EDITED",
            "03_FRAMES_FROM_VIDEO",
            "PORTRAIT",
            "PERFORMANCE",
            "DETAIL",
            "INTERACTION",
            "VIRTUAL_CAMERA",
            "STILLS",
            "CONTEXT",
        ):
            (base / sub).mkdir(parents=True, exist_ok=True)
        meta = {
            **a,
            "created_at": utc_now(),
            "status": "seeded — match in footage during selects",
        }
        (base / "artist.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


def pick_source_videos(
    inventory: list[dict[str, Any]],
    concept_name: str = "concept9-16",
    prefer_subdir: str = "wako kungo",
) -> dict[str, Any]:
    vids = [
        v
        for v in inventory
        if v["kind"] == "video"
        and v.get("quality_rank") in ("best", "unique", None)
        and v.get("duration", 0) > 2
    ]
    event = [v for v in vids if concept_name not in Path(v["name"]).stem.lower()]
    concept = [v for v in vids if concept_name in Path(v["name"]).stem.lower()]

    def in_prefer(v: dict[str, Any]) -> bool:
        p = str(v.get("path", "")).lower().replace("\\", "/")
        return prefer_subdir.lower() in p if prefer_subdir else False

    preferred = [v for v in event if in_prefer(v)]
    others = [v for v in event if not in_prefer(v)]

    def qkey(v: dict[str, Any]) -> tuple:
        return (
            v.get("width", 0) * v.get("height", 0),
            v.get("duration", 0),
            v.get("bitrate", 0),
        )

    preferred.sort(key=qkey, reverse=True)
    others.sort(key=qkey, reverse=True)
    # Wako Kungo first (primary event footage), then anything else under Botanica
    event = preferred + others
    print(f"   prefer '{prefer_subdir}': {len(preferred)} clips | other: {len(others)}")
    return {"event": event, "concept": concept, "all": vids, "preferred": preferred}


@dataclass
class ClipJob:
    source_file: str
    source_in: float
    source_out: float
    virtual_crop: str
    crop_x: float
    crop_y: float
    crop_width: float
    crop_height: float
    artist_id: Optional[str]
    content_type: str
    quality_score: float
    chapter: str
    out_path: str


def vf_vertical_crop(crop: dict[str, float], out_w: int = 1080, out_h: int = 1920) -> str:
    """Crop → 9:16, light denoise, warm live grade, gentle sharpen."""
    cw = max(crop["w"], 0.82)
    ch = max(crop["h"], 0.58)
    cx = crop["x"]
    cy = crop["y"]
    return (
        f"crop=w=iw*{cw}:h=ih*{ch}:x=iw*{cx}:y=ih*{cy},"
        f"scale={out_w}:{out_h}:force_original_aspect_ratio=increase,"
        f"crop={out_w}:{out_h},"
        # Club/low-light: light denoise, lift shadows, warm skin, controlled sat
        f"hqdn3d=1.0:1.0:2.5:2.5,"
        f"eq=contrast=1.08:brightness=0.035:saturation=0.94:gamma=1.05,"
        f"colorbalance=rs=0.03:gs=-0.01:bs=-0.03:rm=0.02:bm=-0.015,"
        f"unsharp=3:3:0.28:3:3:0.0"
    )


def clip_is_usable(path: Path, min_bytes: int = 25_000) -> bool:
    """Reject missing, tiny, or mostly-black (empty) clips."""
    if not path.exists() or path.stat().st_size < min_bytes:
        return False
    try:
        info = ffprobe_json(path)
        dur = float(info.get("format", {}).get("duration") or 0)
        if dur < 0.35:
            return False
    except Exception:
        return False
    # Sample mid-frame brightness via blackframe filter
    r = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "info",
            "-ss",
            str(max(0.0, dur * 0.4)),
            "-i",
            str(path),
            "-frames:v",
            "8",
            "-vf",
            "blackframe=amount=98:threshold=24",
            "-f",
            "null",
            "-",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    err = (r.stderr or "") + (r.stdout or "")
    black_hits = len(re.findall(r"pblack:9[0-9]\.", err)) + err.count("pblack:100")
    # If most sampled frames are near-black → empty content
    if black_hits >= 6:
        print(f"   skip empty/black: {path.name}")
        return False
    return True


def render_clip(job: ClipJob, work: Path, force: bool = False) -> bool:
    out = Path(job.out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    if not force and out.exists() and clip_is_usable(out):
        return True
    if force and out.exists():
        out.unlink(missing_ok=True)
    crop = {
        "w": job.crop_width,
        "h": job.crop_height,
        "x": job.crop_x,
        "y": job.crop_y,
    }
    dur = max(0.5, job.source_out - job.source_in)
    vf = vf_vertical_crop(crop)
    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        f"{job.source_in:.3f}",
        "-i",
        job.source_file,
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
        ok = clip_is_usable(out)
        if not ok and out.exists():
            out.unlink(missing_ok=True)
        return ok
    except subprocess.CalledProcessError as e:
        print("WARN render failed:", e.stderr[-400:] if e.stderr else e)
        return False


def plan_jobs(
    event_videos: list[dict[str, Any]],
    tree: dict[str, Path],
    seed: dict[str, Any],
    target_seconds: float = 90.0,
) -> list[ClipJob]:
    """Chapter-aware planner: mid-clip samples, Stages pacing (~1.5–2.4s)."""
    jobs: list[ClipJob] = []
    if not event_videos:
        return jobs

    chapters = seed.get("story_chapters") or []
    # ~1.9s avg → ~42 picture shots + text cards ≈ 90s
    n_shots = 42
    pool = event_videos[:14] or event_videos
    total_dur = sum(v.get("duration", 0) for v in pool) or 1.0

    shot_i = 0
    for v in pool:
        share = max(1, int(round(n_shots * (v.get("duration", 1) / total_dur))))
        dur = float(v.get("duration") or 30)
        # Stay in energetic mid band — avoid black heads/tails
        usable_start = max(1.0, dur * 0.12)
        usable_end = max(usable_start + 3.0, dur * 0.88)
        usable_span = max(2.0, usable_end - usable_start)

        for k in range(share):
            if shot_i >= n_shots:
                break
            chapter = (
                chapters[min(len(chapters) - 1, shot_i * len(chapters) // n_shots)]["id"]
                if chapters
                else "performance"
            )
            crop_opts = CHAPTER_CROPS.get(chapter, ["MEDIUM", "CLOSE_UP", "WIDE"])
            crop_name = crop_opts[shot_i % len(crop_opts)]
            c = VIRTUAL_CROPS[crop_name]

            t0 = usable_start + usable_span * ((k + 0.35) / max(share, 1))
            # Peak chapter: slightly longer holds; arrival/people: snappier
            if chapter in ("peak", "performance", "artists"):
                length = 1.85 + (shot_i % 3) * 0.28  # ~1.85–2.4
            elif chapter in ("arrival", "people", "audience"):
                length = 1.45 + (shot_i % 3) * 0.25  # ~1.45–1.95
            else:
                length = 1.7 + (shot_i % 3) * 0.3
            t1 = min(usable_end - 0.15, t0 + length)
            if t1 - t0 < 0.55:
                continue

            bias = ((shot_i % 5) - 2) * 0.025
            cx = min(max(c["x"] + bias, 0.0), max(0.0, 1.0 - c["w"]))
            out = tree["WORK"] / "clips" / f"shot_{shot_i:03d}_{crop_name.lower()}.mp4"
            jobs.append(
                ClipJob(
                    source_file=v["path"],
                    source_in=round(t0, 3),
                    source_out=round(t1, 3),
                    virtual_crop=crop_name,
                    crop_x=round(cx, 4),
                    crop_y=c["y"],
                    crop_width=c["w"],
                    crop_height=c["h"],
                    artist_id=None,
                    content_type=crop_name,
                    quality_score=0.82,
                    chapter=chapter,
                    out_path=str(out),
                )
            )
            shot_i += 1
        if shot_i >= n_shots:
            break
    return jobs


def extract_audio_bed(event_videos: list[dict[str, Any]], work: Path, seconds: float = 90.0) -> Optional[Path]:
    """Build ~90s audio bed from longest clip with audio; loudnorm + soft fade."""
    if not event_videos:
        return None
    with_audio = [v for v in event_videos if v.get("has_audio")]
    src = max(with_audio or event_videos, key=lambda v: v.get("duration", 0))
    out = work / "audio_bed_90s.m4a"
    dur = float(src.get("duration") or 120)
    start = max(0.0, min(dur * 0.28, max(0.0, dur - seconds - 1)))
    fade_out_start = max(0.0, seconds - 2.2)
    cmd = [
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
        f"loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.8,afade=t=out:st={fade_out_start:.2f}:d=2.0",
        "-c:a",
        "aac",
        "-b:a",
        "256k",
        str(out),
    ]
    try:
        run(cmd)
        return out if out.exists() else None
    except subprocess.CalledProcessError:
        return None


def make_text_card(work: Path, text: str, idx: int, dur: float = 1.15, force: bool = False) -> Optional[Path]:
    """Gold title on dark plate — NEVER returns a blank card (empty-content fix)."""
    out = work / "cards" / f"text_{idx:02d}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    if not force and out.exists() and clip_is_usable(out, min_bytes=8_000):
        # Still verify it is not a solid empty plate from old failed runs
        if _card_has_signal(out):
            return out
        out.unlink(missing_ok=True)

    font = find_font()
    if not font:
        print("WARN: no system font found — skipping text card (avoids empty plate):", text)
        return None

    safe = (
        text.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\u2019")
        .replace("%", "\\%")
    )
    # Multi-line friendly: split long phrases
    if len(text) > 14 and " " in text:
        parts = text.split(" ", 1)
        safe = f"{parts[0]}\\n{parts[1]}".replace(":", "\\:")

    fontfile = ffmpeg_fontfile_arg(font)
    fontsize = 70 if len(text) < 12 else 56 if len(text) < 20 else 48
    vf = (
        f"drawtext=fontfile='{fontfile}':text='{safe}':"
        f"fontcolor=0xe8c76a:fontsize={fontsize}:"
        f"x=(w-text_w)/2:y=(h-text_h)/2:"
        f"borderw=2:bordercolor=0x0a0f1a@0.85:"
        f"shadowcolor=0x000000@0.55:shadowx=2:shadowy=3"
    )
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"color=c=0x0a0f1a:s=1080x1920:d={dur}",
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "16",
        "-pix_fmt",
        "yuv420p",
        "-t",
        str(dur),
        str(out),
    ]
    try:
        run(cmd)
    except subprocess.CalledProcessError as e:
        print("WARN text card failed:", text, (e.stderr or "")[-300:])
        if out.exists():
            out.unlink(missing_ok=True)
        return None

    if out.exists() and _card_has_signal(out):
        return out
    print("WARN empty text card discarded:", text)
    if out.exists():
        out.unlink(missing_ok=True)
    return None


def _card_has_signal(path: Path) -> bool:
    """True if card is not a flat empty color plate (text/graphics present).

    Solid lavfi color plates compress tiny (~3–5 KB/s). Gold drawtext cards
    are typically ≥9 KB even for short durations — that split is reliable on
    Windows/Linux where signalstats YAVG of 0x0a0f1a already sits ~29.
    """
    size = path.stat().st_size
    if size < 7000:
        return False
    r = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-vf",
            "signalstats,metadata=print:file=-",
            "-frames:v",
            "2",
            "-f",
            "null",
            "-",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    blob = (r.stdout or "") + (r.stderr or "")
    yavgs = [float(x) for x in re.findall(r"lavfi\.signalstats\.YAVG=([0-9.]+)", blob)]
    # Text cards lift YAVG a bit above the solid plate (~29 → ~30+)
    if yavgs and max(yavgs) >= 29.4:
        return True
    return size >= 9000


def assemble_master(
    jobs: list[ClipJob],
    tree: dict[str, Path],
    seed: dict[str, Any],
    audio: Optional[Path],
    target: float = 90.0,
    force: bool = False,
) -> Path:
    work = tree["WORK"]
    cards_dir = work / "cards"
    cards_dir.mkdir(exist_ok=True)

    event = seed.get("event") or {}
    phrases = seed.get("text_interruptions") or [
        "EXPERIENCE",
        "CONNECT",
        "MOVE",
        "BOTÂNICA",
    ]
    # Prefer short punchy cards for reel; drop ultra-long if font fails
    phrases = [p for p in phrases if len(p) <= 22][:6]

    sequence: list[Path] = []
    t_acc = 0.0
    text_i = 0

    # Opening title (brand) — only if text renders
    opener = make_text_card(work, "BOTÂNICA", 90, dur=1.25, force=force)
    if opener:
        sequence.append(opener)
        t_acc += 1.35

    usable_jobs = 0
    for i, job in enumerate(jobs):
        p = Path(job.out_path)
        if not clip_is_usable(p):
            continue
        sequence.append(p)
        usable_jobs += 1
        t_acc += job.source_out - job.source_in
        # Text interruption every ~7 picture clips — skip if empty
        if usable_jobs > 0 and usable_jobs % 7 == 0 and text_i < len(phrases):
            card = make_text_card(work, phrases[text_i], text_i, dur=1.05, force=force)
            if card:
                sequence.append(card)
                t_acc += 1.05
                text_i += 1
        if t_acc >= target + 2:
            break

    # Closing brand card
    closer = make_text_card(work, "WAKO KUNGO", 99, dur=1.4, force=force)
    if closer and t_acc < target + 3:
        sequence.append(closer)
        t_acc += 1.4

    if not sequence:
        raise SystemExit("No usable clips rendered — check source videos under Botanica.")

    print(f"   assemble sequence: {len(sequence)} segments (~{t_acc:.1f}s before trim)")

    concat_list = work / "concat.txt"
    lines = []
    for p in sequence:
        ap = str(p.resolve()).replace("'", "'\\''")
        lines.append(f"file '{ap}'")
    concat_list.write_text("\n".join(lines) + "\n", encoding="utf-8")

    silent = tree["EXPORT"] / "BOTANICA_90s_RECAP_9x16_silent.mp4"
    master = tree["EXPORT"] / "BOTANICA_90s_RECAP_9x16.mp4"

    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
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

    # QC stub
    qc = {
        "created_at": utc_now(),
        "master": str(master),
        "segments": len(sequence),
        "usable_picture_clips": usable_jobs,
        "text_cards_used": text_i + (1 if opener else 0) + (1 if closer else 0),
        "font": str(find_font() or ""),
        "notes": [
            "Empty/black clips filtered",
            "Blank text plates never inserted",
            "CRF 17 / medium final encode",
        ],
    }
    (tree["ANALYSIS"] / "export_qc.json").write_text(json.dumps(qc, indent=2), encoding="utf-8")
    return master


def write_edit_decisions(jobs: list[ClipJob], tree: dict[str, Path], master: Path) -> None:
    edl = {
        "created_at": utc_now(),
        "master": str(master),
        "camera_count": 1,
        "note": "Virtual crops from single camera — not multi-cam continuity",
        "clips": [asdict(j) for j in jobs],
    }
    (tree["EDIT"].parent / "EDIT_DECISIONS.json").write_text(
        json.dumps(edl, indent=2), encoding="utf-8"
    )
    (tree["ANALYSIS"] / "virtual_crop_database.json").write_text(
        json.dumps({"crops": [asdict(j) for j in jobs]}, indent=2), encoding="utf-8"
    )


def copy_selects(jobs: list[ClipJob], tree: dict[str, Path]) -> None:
    mapping = {
        "WIDE": "PERFORMANCE",
        "MEDIUM": "PERFORMANCE",
        "CLOSE_UP": "PERFORMANCE",
        "PORTRAIT": "PERFORMANCE",
        "DETAIL": "DETAILS",
        "CROWD": "CROWD_WIDE",
        "INSTRUMENT": "DETAILS",
        "ENVIRONMENT": "VENUE",
    }
    for j in jobs:
        src = Path(j.out_path)
        if not clip_is_usable(src):
            continue
        dest_dir = tree["EVENT_SELECTS"] / mapping.get(j.virtual_crop, "ATMOSPHERE")
        dest = dest_dir / src.name
        if not dest.exists():
            shutil.copy2(src, dest)


def still_from_clip(job: ClipJob, stills: Path) -> None:
    src = Path(job.out_path)
    if not clip_is_usable(src):
        return
    mid = max(0.1, (job.source_out - job.source_in) / 2)
    out = stills / "PERFORMANCE" / f"{src.stem}.jpg"
    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        f"{mid:.2f}",
        "-i",
        str(src),
        "-frames:v",
        "1",
        "-q:v",
        "2",
        str(out),
    ]
    try:
        run(cmd)
    except subprocess.CalledProcessError:
        pass


def analyze_concept(concept_vids: list[dict[str, Any]], analysis: Path) -> None:
    note = {
        "created_at": utc_now(),
        "concept_files": concept_vids,
        "observe": [
            "editing rhythm / pacing",
            "video-in-video & split screens",
            "centered overlays",
            "vertical vs horizontal compositions",
            "typography / text interruptions",
            "color grading / image treatment",
            "festival cinematic feeling",
        ],
        "instruction": "Match Concept9-16.mp4 visual language; do not copy copyrighted frames.",
        "v2_fixes": [
            "Windows fontfile for text cards (no empty plates)",
            "black/empty clip filter",
            "chapter-aware crop + mid-band sampling",
            "CRF 17 quality encode",
        ],
    }
    (analysis / "concept_analysis.json").write_text(json.dumps(note, indent=2), encoding="utf-8")


def default_root() -> Path:
    env = os.environ.get("BOTANICA_ROOT")
    if env:
        return Path(env)
    candidates = [
        Path(r"D:/Wakungo_Content_Studio/Botanica"),
        Path("/mnt/d/Wakungo_Content_Studio/Botanica"),
        Path("/mnt/D/Wakungo_Content_Studio/Botanica"),
        Path.cwd() / "Botanica",
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]


def clear_work_cache(work: Path) -> None:
    for sub in ("clips", "cards"):
        d = work / sub
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
            d.mkdir(parents=True, exist_ok=True)
    for name in ("concat.txt", "audio_bed_90s.m4a"):
        p = work / name
        if p.exists():
            p.unlink(missing_ok=True)
    print("   cleared work cache (clips/cards/audio)")


def main() -> int:
    ap = argparse.ArgumentParser(description="Botanica 90s cinematic recap pipeline v2")
    ap.add_argument("--root", type=Path, default=None, help="Botanica project root on D:")
    ap.add_argument("--repo", type=Path, default=None, help="circle-d-flow-web repo root")
    ap.add_argument("--seconds", type=float, default=90.0)
    ap.add_argument("--inventory-only", action="store_true")
    ap.add_argument(
        "--force",
        action="store_true",
        help="Re-render all clips/cards (fixes empty text plates from v1)",
    )
    ap.add_argument(
        "--prefer-subdir",
        default="wako kungo",
        help="Prioritize videos under this folder name (default: Wako Kungo)",
    )
    args = ap.parse_args()

    if not which("ffmpeg") or not which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe required on PATH")
        return 2

    root = args.root or default_root()
    repo = args.repo or Path(__file__).resolve().parents[2]

    print(f"Botanica root: {root}")
    print(f"Font: {find_font() or 'NONE — text cards will be skipped'}")
    if not root.exists():
        print(
            "\nBLOCKER: Botanica folder not found.\n"
            "  Expected: D:\\\\Wakungo_Content_Studio\\\\Botanica\n"
            "  Run on the Windows PC with D:.\n"
        )
        stub = Path(__file__).resolve().parent / "LAST_RUN_BLOCKED.json"
        stub.write_text(
            json.dumps(
                {
                    "blocked": True,
                    "reason": "Botanica root missing",
                    "expected": str(root),
                    "at": utc_now(),
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        return 3

    tree = ensure_dirs(root)
    if args.force:
        clear_work_cache(tree["WORK"])

    seed = load_artist_seed(repo)
    seed_artist_folders(tree["ARTISTS"], seed)

    print("01 — Media inventory…")
    inv = inventory_media(root)
    (tree["ANALYSIS"] / "media_inventory.json").write_text(
        json.dumps({"created_at": utc_now(), "count": len(inv), "items": inv}, indent=2),
        encoding="utf-8",
    )
    (tree["ANALYSIS"] / "artist_database.json").write_text(
        json.dumps(seed, indent=2), encoding="utf-8"
    )
    (tree["ANALYSIS"] / "event_timeline.json").write_text(
        json.dumps({"chapters": seed.get("story_chapters", []), "created_at": utc_now()}, indent=2),
        encoding="utf-8",
    )

    picked = pick_source_videos(inv, prefer_subdir=args.prefer_subdir)
    analyze_concept(picked["concept"], tree["ANALYSIS"])
    event_videos = picked["event"]
    preferred = picked.get("preferred") or []
    print(
        f"   videos={sum(1 for i in inv if i['kind']=='video')} "
        f"photos={sum(1 for i in inv if i['kind']=='photo')}"
    )
    print(f"   event source clips used: {len(event_videos)} (from Wako Kungo pool: {len(preferred)})")

    if args.inventory_only:
        print("Inventory only — done.")
        return 0

    if not event_videos:
        print("BLOCKER: No event video files found under Botanica (excluding Concept).")
        print("  Expected footage in: <root>\\Wako Kungo\\*.MOV / *.mp4")
        return 4

    # Build the 90s reel primarily from Wako Kungo when available
    reel_sources = preferred if preferred else event_videos
    print(f"   90s reel source clips: {len(reel_sources)}")

    print("05/09 — Plan + render virtual camera clips…")
    jobs = plan_jobs(reel_sources, tree, seed, args.seconds)
    ok = 0
    for j in jobs:
        if render_clip(j, tree["WORK"], force=args.force):
            ok += 1
            still_from_clip(j, tree["STILLS"])
    print(f"   rendered usable {ok}/{len(jobs)} clips")

    copy_selects(jobs, tree)
    write_edit_decisions(jobs, tree, tree["EXPORT"] / "BOTANICA_90s_RECAP_9x16.mp4")

    print("22 — Audio bed…")
    audio = extract_audio_bed(reel_sources, tree["WORK"], args.seconds)

    print("17/24 — Assemble 90s master (skip empty content)…")
    master = assemble_master(jobs, tree, seed, audio, args.seconds, force=args.force)
    print(f"\nDONE → {master}")
    print(f"Analysis → {tree['ANALYSIS']}")
    print(f"QC       → {tree['ANALYSIS'] / 'export_qc.json'}")
    print(f"Selects  → {tree['EVENT_SELECTS']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
