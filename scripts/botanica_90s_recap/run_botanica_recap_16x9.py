#!/usr/bin/env python3
"""
Botanica 90s reel — 16:9 FULL FRAME (no crop).

Keeps the entire source image: scale to fit inside 1920x1080, pad with black
if needed (never crop). Soft grade + light denoise only.

  python scripts/botanica_90s_recap/run_botanica_recap_16x9.py --root "D:\\Wakungo_Content_Studio\\Botanica" --force

Sources (in order):
  1) Raw / artist / work clips under Botanica
  2) FALLBACK: existing 9:16 master → pillarbox to 16:9 (one-pass, keeps edit)

Output:
  Botanica/EXPORT/BOTANICA_90s_RECAP_16x9.mp4
  Botanica/DRIVE_UPLOAD/EVENT/BOTANICA_90s_RECAP_16x9.mp4
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm", ".mts", ".mxf"}
SKIP_DIR_NAMES = {
    "ANALYSIS",
    "EDIT",
    "__pycache__",
    ".git",
}
PREFER_PATH_HINTS = (
    "wako kungo",
    "assets",
    "raw",
    "01_raw",
    "01_videos_performance",
    "event_selects",
    "artists",
)
DEPRIORITIZE_HINTS = ("letterbox_reel_tmp", "engaging_letterbox", "recap_16x9_tmp")

# Finished masters we never re-ingest as "raw" (but may use as last-resort fallback)
MASTER_NAME_PREFIX = "botanica_90s"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(">", " ".join(str(c) for c in cmd[:12]), "…" if len(cmd) > 12 else "")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


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


def is_finished_master_name(name: str) -> bool:
    n = name.lower()
    return n.startswith(MASTER_NAME_PREFIX) and n.endswith((".mp4", ".mov", ".m4v"))


def should_skip_as_raw(path: Path, root: Path) -> bool:
    """Skip finished masters and junk trees when looking for raw source clips."""
    try:
        rel = path.relative_to(root)
    except ValueError:
        return True
    if any(p in SKIP_DIR_NAMES for p in rel.parts):
        return True
    name_l = path.name.lower()
    if is_finished_master_name(name_l):
        return True
    if "concept9-16" in name_l:
        return True
    if name_l.endswith("_silent.mp4"):
        return True
    return False


def probe_video(path: Path) -> Optional[dict[str, Any]]:
    if path.stat().st_size < 30_000:
        return None
    try:
        info = ffprobe(path)
    except Exception:
        return None
    dur = float(info.get("format", {}).get("duration") or 0)
    if dur < 1.2:
        return None
    vs = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    as_ = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
    path_l = str(path).lower().replace("\\", "/")
    name_l = path.name.lower()
    prefer = any(h in path_l for h in PREFER_PATH_HINTS)
    depri = any(h in path_l or h in name_l for h in DEPRIORITIZE_HINTS)
    return {
        "path": str(path),
        "name": path.name,
        "duration": dur,
        "width": int(vs.get("width") or 0),
        "height": int(vs.get("height") or 0),
        "has_audio": bool(as_),
        "bitrate": int(info.get("format", {}).get("bit_rate") or 0),
        "prefer": prefer,
        "depri": depri,
    }


def count_video_files(root: Path) -> dict[str, int]:
    """Cheap extension count by top-level folder (no ffprobe)."""
    counts: dict[str, int] = {}
    for p in root.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in VIDEO_EXT:
            continue
        try:
            top = p.relative_to(root).parts[0]
        except (ValueError, IndexError):
            top = "?"
        counts[top] = counts.get(top, 0) + 1
    return counts


def inventory_raw_videos(root: Path) -> list[dict[str, Any]]:
    """Scan Botanica for usable raw/artist/work clips (not finished masters)."""
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    print("   scanning for .mp4/.mov under Botanica (this can take a minute)…")
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in VIDEO_EXT:
            continue
        if should_skip_as_raw(p, root):
            continue
        key = str(p.resolve()).lower()
        if key in seen:
            continue
        seen.add(key)
        meta = probe_video(p)
        if meta:
            items.append(meta)
            if len(items) <= 12:
                print(f"   + {meta['name']}  {meta['duration']:.1f}s  {p.parent.name}")

    items.sort(
        key=lambda v: (
            0 if v.get("depri") else 1,
            1 if v.get("prefer") else 0,
            v.get("width", 0) * v.get("height", 0),
            v.get("duration", 0),
            v.get("bitrate", 0),
        ),
        reverse=True,
    )
    return items


def find_9x16_master(root: Path) -> Optional[Path]:
    """Locate existing finished 9:16 (or letterbox) reel to pillarbox into 16:9."""
    candidates = [
        root / "DRIVE_UPLOAD" / "EVENT" / "BOTANICA_90s_RECAP_9x16.mp4",
        root / "EXPORT" / "BOTANICA_90s_RECAP_9x16.mp4",
        root / "DRIVE_UPLOAD" / "EVENT" / "BOTANICA_90s_RECAP_ENGAGING_LETTERBOX.mp4",
        root / "EXPORT" / "BOTANICA_90s_RECAP_ENGAGING_LETTERBOX.mp4",
        root / "DRIVE_UPLOAD" / "EVENT" / "BOTANICA_90s_RECAP_LETTERBOX.mp4",
        root / "EXPORT" / "BOTANICA_90s_RECAP_LETTERBOX.mp4",
    ]
    for c in candidates:
        if c.exists() and c.stat().st_size > 50_000:
            return c
    # Any botanica_90s*.mp4 that is NOT already 16x9
    for base in (root / "DRIVE_UPLOAD" / "EVENT", root / "EXPORT"):
        if not base.exists():
            continue
        for p in sorted(base.glob("BOTANICA_90s*.mp4"), key=lambda x: x.stat().st_size, reverse=True):
            n = p.name.lower()
            if "16x9" in n or "16_9" in n:
                continue
            if p.stat().st_size > 50_000:
                return p
    return None


def vf_full_16x9() -> str:
    """Fit entire frame into 1920x1080 — NO crop."""
    return (
        "scale=1920:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,"
        "setsar=1,"
        "hqdn3d=0.8:0.8:2:2,"
        "eq=contrast=1.04:brightness=0.015:saturation=0.97:gamma=1.02"
    )


def convert_master_to_16x9(src: Path, master: Path, seconds: float, force: bool) -> bool:
    """One-pass: existing 9:16/letterbox reel → 16:9 pillarbox (keeps edit + audio)."""
    if master.exists() and master.stat().st_size > 200_000 and not force:
        print(f"   keep existing: {master}")
        return True
    master.parent.mkdir(parents=True, exist_ok=True)
    print(f"   FALLBACK source: {src}")
    print("   converting 9:16 → 16:9 pillarbox (full frame, no crop)…")
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src),
        "-t",
        f"{seconds:.2f}",
        "-vf",
        vf_full_16x9() + ",fps=30,format=yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "256k",
        "-movflags",
        "+faststart",
        str(master),
    ]
    try:
        run(cmd)
    except subprocess.CalledProcessError as e:
        print("ERROR convert failed:", (e.stderr or "")[-400:])
        return False
    ok = master.exists() and master.stat().st_size > 100_000
    if ok:
        print(f"   wrote {master.stat().st_size // 1024} KB")
    return ok


def plan_segments(videos: list[dict[str, Any]], target: float = 90.0) -> list[dict[str, Any]]:
    if not videos:
        return []
    primary = [v for v in videos if not v.get("depri")] or videos
    pool = primary[:18] or primary
    total = sum(v["duration"] for v in pool) or 1.0
    n = 36
    segs: list[dict[str, Any]] = []
    shot_i = 0
    for v in pool:
        share = max(1, int(round(n * (v["duration"] / total))))
        dur = float(v["duration"])
        u0 = max(1.0, dur * 0.10)
        u1 = max(u0 + 3.0, dur * 0.90)
        span = u1 - u0
        for k in range(share):
            if shot_i >= n:
                break
            t0 = u0 + span * ((k + 0.35) / max(share, 1))
            length = 2.2 + (shot_i % 3) * 0.35
            t1 = min(u1 - 0.1, t0 + length)
            if t1 - t0 < 0.8:
                continue
            segs.append({"source": v["path"], "in": round(t0, 3), "out": round(t1, 3), "i": shot_i})
            shot_i += 1
        if shot_i >= n:
            break

    acc = 0.0
    kept = []
    for s in segs:
        d = s["out"] - s["in"]
        if acc + d > target + 2:
            break
        kept.append(s)
        acc += d
    return kept


def render_clip(seg: dict[str, Any], out: Path, force: bool) -> bool:
    if out.exists() and out.stat().st_size > 40_000 and not force:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    dur = max(0.8, seg["out"] - seg["in"])
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
        vf_full_16x9(),
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
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
        print("WARN render failed:", (e.stderr or "")[-240:])
        return False


def extract_audio(videos: list[dict[str, Any]], work: Path, seconds: float) -> Optional[Path]:
    pool = [v for v in videos if v.get("has_audio") and not v.get("depri")] or [
        v for v in videos if v.get("has_audio")
    ]
    if not pool:
        return None
    src = max(pool, key=lambda v: v.get("duration", 0))
    out = work / "audio_bed_16x9_90s.m4a"
    dur = float(src.get("duration") or 120)
    start = max(0.0, min(dur * 0.28, max(0.0, dur - seconds - 1)))
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
    concat = work / "concat_16x9.txt"
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


def publish(master: Path, root: Path) -> Path:
    drive = root / "DRIVE_UPLOAD" / "EVENT"
    drive.mkdir(parents=True, exist_ok=True)
    dest = drive / master.name
    shutil.copy2(master, dest)
    return dest


def main() -> int:
    ap = argparse.ArgumentParser(description="Botanica 90s 16:9 full-frame reel (no crop)")
    ap.add_argument("--root", type=Path, default=None)
    ap.add_argument("--seconds", type=float, default=90.0)
    ap.add_argument("--force", action="store_true")
    ap.add_argument(
        "--from-9x16",
        action="store_true",
        help="Force convert existing 9:16 master → 16:9 pillarbox (skip raw scan)",
    )
    args = ap.parse_args()

    if not which("ffmpeg") or not which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe required")
        return 2

    root = args.root or default_root()
    print(f"Root: {root}")
    print("Mode: 16:9 FULL FRAME — scale+pad, never crop")
    print(f"Script: {Path(__file__).resolve()}")
    if not root.exists():
        print("BLOCKER: Botanica root missing")
        return 3

    work = root / "00_work" / "recap_16x9_tmp"
    export = root / "EXPORT"
    export.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    clips_dir = work / "clips"
    if args.force and clips_dir.exists():
        shutil.rmtree(clips_dir, ignore_errors=True)
    clips_dir.mkdir(parents=True, exist_ok=True)

    master = export / "BOTANICA_90s_RECAP_16x9.mp4"

    print("01 — Inventory…")
    for label in ("ARTISTS", "DRIVE_UPLOAD", "00_work", "EVENT_SELECTS", "ASSETS", "Wako Kungo", "EXPORT"):
        p = root / label
        print(f"   folder {label}: {'OK' if p.exists() else 'missing'}")

    raw_counts = count_video_files(root)
    if raw_counts:
        print("   video files by folder (extension count, before filter):")
        for k, n in sorted(raw_counts.items(), key=lambda kv: (-kv[1], kv[0])):
            print(f"     {k}: {n}")
    else:
        print("   video files by folder: NONE under Botanica")

    # Force path: convert finished 9:16 immediately
    if args.from_9x16:
        src9 = find_9x16_master(root)
        if not src9:
            print("BLOCKER: --from-9x16 but no 9:16 master found under DRIVE_UPLOAD/EVENT or EXPORT")
            return 4
        print("02 — Forced fallback from 9:16 master…")
        if not convert_master_to_16x9(src9, master, args.seconds, args.force):
            return 5
        dest = publish(master, root)
        print(f"\nDONE → {master}")
        print(f"Also  → {dest}")
        print("1920x1080 · full frame · no crop · from 9:16 master")
        return 0

    videos = inventory_raw_videos(root)
    print(f"   usable raw source videos={len(videos)}")

    if not videos:
        print("   no raw clips — trying FALLBACK from finished 9:16 reel…")
        src9 = find_9x16_master(root)
        if not src9:
            print("BLOCKER: no source clips and no 9:16 master under Botanica.")
            print("  Restore raw footage into Botanica\\Wako Kungo\\ then re-run,")
            print("  or place BOTANICA_90s_RECAP_9x16.mp4 in DRIVE_UPLOAD\\EVENT\\")
            return 4
        print("02 — FALLBACK convert (keeps existing edit, pads to 16:9)…")
        if not convert_master_to_16x9(src9, master, args.seconds, args.force):
            return 5
        dest = publish(master, root)
        (root / "ANALYSIS").mkdir(exist_ok=True)
        (root / "ANALYSIS" / "recap_16x9_plan.json").write_text(
            json.dumps(
                {
                    "created_at": utc_now(),
                    "master": str(master),
                    "no_crop": True,
                    "mode": "fallback_from_9x16",
                    "source": str(src9),
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        print(f"\nDONE → {master}")
        print(f"Also  → {dest}")
        print("1920x1080 · full frame · no crop · FALLBACK from 9:16")
        return 0

    segs = plan_segments(videos, args.seconds)
    print(f"02 — Planned {len(segs)} full-frame segments")

    print("03 — Render 1920x1080 (no crop)…")
    outs: list[Path] = []
    for s in segs:
        out = clips_dir / f"ff_{s['i']:03d}.mp4"
        if render_clip(s, out, args.force):
            outs.append(out)
    print(f"   rendered {len(outs)}/{len(segs)}")
    if not outs:
        return 5

    print("04 — Audio…")
    audio = extract_audio(videos, work, args.seconds)

    print("05 — Assemble…")
    assemble(outs, audio, master, args.seconds, work)
    dest = publish(master, root)

    (root / "ANALYSIS").mkdir(exist_ok=True)
    (root / "ANALYSIS" / "recap_16x9_plan.json").write_text(
        json.dumps(
            {
                "created_at": utc_now(),
                "master": str(master),
                "no_crop": True,
                "mode": "from_raw_clips",
                "segments": segs,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\nDONE → {master}")
    print(f"Also  → {dest}")
    print("1920x1080 · full frame · no crop")
    return 0


if __name__ == "__main__":
    sys.exit(main())
