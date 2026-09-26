#!/usr/bin/env python3
"""
BOTANICA — 90s CINEMATIC EVENT RECAP pipeline
One-camera source → virtual crops → 9:16 master on D:\\Wakungo_Content_Studio\\Botanica

Run on the machine that has D: (Windows) or a mounted path:

  python scripts/botanica_90s_recap/run_botanica_recap.py
  python scripts/botanica_90s_recap/run_botanica_recap.py --root "D:/Wakungo_Content_Studio/Botanica"

Requires: ffmpeg, ffprobe (on PATH). Optional: opencv for face helpers.
NEVER overwrites originals — writes under Botanica/ANALYSIS|ARTISTS|EDIT|EXPORT|…
"""
from __future__ import annotations

import argparse
import json
import math
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

VIRTUAL_CROPS = {
    "WIDE": {"w": 1.0, "h": 1.0, "x": 0.0, "y": 0.0},
    "MEDIUM": {"w": 0.72, "h": 0.72, "x": 0.14, "y": 0.12},
    "CLOSE_UP": {"w": 0.48, "h": 0.48, "x": 0.26, "y": 0.18},
    "PORTRAIT": {"w": 0.42, "h": 0.72, "x": 0.29, "y": 0.08},
    "DETAIL": {"w": 0.38, "h": 0.38, "x": 0.31, "y": 0.42},
    "CROWD": {"w": 0.55, "h": 0.45, "x": 0.40, "y": 0.48},
    "INSTRUMENT": {"w": 0.50, "h": 0.40, "x": 0.20, "y": 0.45},
    "ENVIRONMENT": {"w": 0.90, "h": 0.55, "x": 0.05, "y": 0.05},
}


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
    # Prefer highest bitrate / resolution as "best" per stem
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
        base = artists_root / a["id"]
        for sub in (
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


def pick_source_videos(inventory: list[dict[str, Any]], concept_name: str = "concept9-16") -> list[dict[str, Any]]:
    vids = [
        v
        for v in inventory
        if v["kind"] == "video"
        and v.get("quality_rank") in ("best", "unique", None)
        and v.get("duration", 0) > 2
    ]
    # Exclude concept reference from event selects (still analyze it)
    event = [v for v in vids if concept_name not in Path(v["name"]).stem.lower()]
    concept = [v for v in vids if concept_name in Path(v["name"]).stem.lower()]
    # Prefer longer / higher res event clips
    event.sort(key=lambda v: (v.get("width", 0) * v.get("height", 0), v.get("duration", 0)), reverse=True)
    return {"event": event, "concept": concept, "all": vids}  # type: ignore


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
    """Build ffmpeg filter: crop relative box from source then scale to 9:16 with letterbox pad if needed."""
    # Crop using relative expressions on input w/h
    cw = crop["w"]
    ch = crop["h"]
    cx = crop["x"]
    cy = crop["y"]
    # Gentle denoise + grade (Stages / low-light safe)
    # Zoom max ~115% via crop size (never below 0.85 of frame for quality)
    cw = max(cw, 0.80)
    ch = max(ch, 0.55)
    return (
        f"crop=w=iw*{cw}:h=ih*{ch}:x=iw*{cx}:y=ih*{cy},"
        f"scale={out_w}:{out_h}:force_original_aspect_ratio=increase,"
        f"crop={out_w}:{out_h},"
        f"hqdn3d=1.2:1.2:3:3,"
        f"eq=contrast=1.06:brightness=0.02:saturation=0.96,"
        f"colorbalance=rs=0.02:gs=-0.01:bs=-0.02:rm=0.01:bm=-0.01,"
        f"unsharp=3:3:0.35"
    )


def render_clip(job: ClipJob, work: Path) -> bool:
    out = Path(job.out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 10_000:
        return True
    crop = {
        "w": job.crop_width,
        "h": job.crop_height,
        "x": job.crop_x,
        "y": job.crop_y,
    }
    dur = max(0.4, job.source_out - job.source_in)
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
        "veryfast",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        str(out),
    ]
    try:
        run(cmd)
        return out.exists()
    except subprocess.CalledProcessError as e:
        print("WARN render failed:", e.stderr[-400:] if e.stderr else e)
        return False


def plan_jobs(
    event_videos: list[dict[str, Any]],
    tree: dict[str, Path],
    seed: dict[str, Any],
    target_seconds: float = 90.0,
) -> list[ClipJob]:
    """Heuristic planner: sample moments across longest clips + virtual crop variety."""
    jobs: list[ClipJob] = []
    if not event_videos:
        return jobs

    chapters = seed.get("story_chapters") or []
    crop_cycle = ["WIDE", "MEDIUM", "CLOSE_UP", "PORTRAIT", "DETAIL", "CROWD", "INSTRUMENT", "ENVIRONMENT"]
    # Budget ~2.2s average shot → ~40 shots for 90s
    n_shots = 40
    # Weight toward longest / highest-res sources
    pool = event_videos[:12] or event_videos
    total_dur = sum(v.get("duration", 0) for v in pool) or 1.0

    shot_i = 0
    for v in pool:
        share = max(1, int(n_shots * (v.get("duration", 1) / total_dur)))
        dur = float(v.get("duration") or 30)
        for k in range(share):
            if shot_i >= n_shots:
                break
            # Spread sample points avoiding edges
            t0 = 1.0 + (dur - 4.0) * (k + 0.5) / max(share, 1)
            t0 = max(0.5, min(dur - 2.5, t0))
            length = 2.0 + (shot_i % 3) * 0.35  # 2.0–2.7s
            t1 = min(dur - 0.2, t0 + length)
            crop_name = crop_cycle[shot_i % len(crop_cycle)]
            c = VIRTUAL_CROPS[crop_name]
            # Slight left/right bias for variety (not always centered)
            bias = ((shot_i % 5) - 2) * 0.03
            cx = min(max(c["x"] + bias, 0.0), 1.0 - c["w"])
            chapter = chapters[min(len(chapters) - 1, shot_i * len(chapters) // n_shots)]["id"] if chapters else "performance"
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
                    quality_score=0.75,
                    chapter=chapter,
                    out_path=str(out),
                )
            )
            shot_i += 1
        if shot_i >= n_shots:
            break
    return jobs


def extract_audio_bed(event_videos: list[dict[str, Any]], work: Path, seconds: float = 90.0) -> Optional[Path]:
    """Build ~90s audio bed from longest event clip (music priority)."""
    if not event_videos:
        return None
    src = max(event_videos, key=lambda v: v.get("duration", 0))
    out = work / "audio_bed_90s.m4a"
    # Prefer a energetic mid section
    dur = float(src.get("duration") or 120)
    start = max(0.0, min(dur * 0.25, dur - seconds - 1))
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
        "loudnorm=I=-14:TP=-1.5:LRA=11",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        str(out),
    ]
    try:
        run(cmd)
        return out if out.exists() else None
    except subprocess.CalledProcessError:
        return None


def make_text_card(work: Path, text: str, idx: int, dur: float = 1.2) -> Path:
    out = work / "cards" / f"text_{idx:02d}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    # Escape for drawtext
    safe = text.replace(":", "\\:").replace("'", "")
    vf = (
        f"color=c=0x0a0f1a:s=1080x1920:d={dur},"
        f"drawtext=text='{safe}':fontcolor=0xd4af37:fontsize=72:"
        f"x=(w-text_w)/2:y=(h-text_h)/2:font=Sans"
    )
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"color=c=0x0a0f1a:s=1080x1920:d={dur}",
        "-vf",
        f"drawtext=text='{safe}':fontcolor=0xd4af37:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-t",
        str(dur),
        str(out),
    ]
    try:
        run(cmd)
    except subprocess.CalledProcessError:
        # Fallback without drawtext font issues
        run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                f"color=c=0x12243d:s=1080x1920:d={dur}",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(out),
            ]
        )
    return out


def assemble_master(
    jobs: list[ClipJob],
    tree: dict[str, Path],
    seed: dict[str, Any],
    audio: Optional[Path],
    target: float = 90.0,
) -> Path:
    work = tree["WORK"]
    cards_dir = work / "cards"
    cards_dir.mkdir(exist_ok=True)
    phrases = seed.get("text_interruptions") or ["EXPERIENCE", "CONNECT", "TOGETHER"]
    # Insert text cards every ~8 clips
    sequence: list[Path] = []
    t_acc = 0.0
    text_i = 0
    for i, job in enumerate(jobs):
        p = Path(job.out_path)
        if p.exists():
            sequence.append(p)
            t_acc += job.source_out - job.source_in
        if i > 0 and i % 8 == 0 and text_i < len(phrases):
            card = make_text_card(work, phrases[text_i], text_i, dur=1.1)
            if card.exists():
                sequence.append(card)
                t_acc += 1.1
                text_i += 1
        if t_acc >= target + 4:
            break

    if not sequence:
        raise SystemExit("No clips rendered — check source videos under Botanica.")

    concat_list = work / "concat.txt"
    lines = []
    for p in sequence:
        # ffmpeg concat demuxer needs escaped single quotes
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
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "18",
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
                "192k",
                "-shortest",
                "-movflags",
                "+faststart",
                str(master),
            ]
        )
    else:
        shutil.copy2(silent, master)

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
        if not src.exists():
            continue
        dest_dir = tree["EVENT_SELECTS"] / mapping.get(j.virtual_crop, "ATMOSPHERE")
        dest = dest_dir / src.name
        if not dest.exists():
            shutil.copy2(src, dest)


def still_from_clip(job: ClipJob, stills: Path) -> None:
    src = Path(job.out_path)
    if not src.exists():
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


def main() -> int:
    ap = argparse.ArgumentParser(description="Botanica 90s cinematic recap pipeline")
    ap.add_argument("--root", type=Path, default=None, help="Botanica project root on D:")
    ap.add_argument("--repo", type=Path, default=None, help="circle-d-flow-web repo root")
    ap.add_argument("--seconds", type=float, default=90.0)
    ap.add_argument("--inventory-only", action="store_true")
    args = ap.parse_args()

    if not which("ffmpeg") or not which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe required on PATH")
        return 2

    root = args.root or default_root()
    repo = args.repo or Path(__file__).resolve().parents[2]

    print(f"Botanica root: {root}")
    if not root.exists():
        print(
            "\nBLOCKER: Botanica folder not found.\n"
            "  Expected: D:\\\\Wakungo_Content_Studio\\\\Botanica\n"
            "  This Cloud Agent cannot see your D: drive.\n"
            "  Fix: run this script on the Windows PC with D:, OR\n"
            "       start a Cursor self-hosted worker on that machine, OR\n"
            "       sync/copy Botanica into the workspace and pass --root.\n"
        )
        # Still write a stub plan next to the script for guidance
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

    picked = pick_source_videos(inv)
    analyze_concept(picked["concept"], tree["ANALYSIS"])  # type: ignore
    event_videos = picked["event"]  # type: ignore
    print(f"   videos={sum(1 for i in inv if i['kind']=='video')} photos={sum(1 for i in inv if i['kind']=='photo')}")
    print(f"   event source clips used: {len(event_videos)}")

    if args.inventory_only:
        print("Inventory only — done.")
        return 0

    if not event_videos:
        print("BLOCKER: No event video files found under Botanica (excluding Concept).")
        return 4

    print("05/09 — Plan + render virtual camera clips…")
    jobs = plan_jobs(event_videos, tree, seed, args.seconds)
    ok = 0
    for j in jobs:
        if render_clip(j, tree["WORK"]):
            ok += 1
            still_from_clip(j, tree["STILLS"])
    print(f"   rendered {ok}/{len(jobs)} clips")

    copy_selects(jobs, tree)
    write_edit_decisions(jobs, tree, tree["EXPORT"] / "BOTANICA_90s_RECAP_9x16.mp4")

    print("22 — Audio bed…")
    audio = extract_audio_bed(event_videos, tree["WORK"], args.seconds)

    print("17/24 — Assemble 90s master…")
    master = assemble_master(jobs, tree, seed, audio, args.seconds)
    print(f"\nDONE → {master}")
    print(f"Analysis → {tree['ANALYSIS']}")
    print(f"Selects  → {tree['EVENT_SELECTS']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
