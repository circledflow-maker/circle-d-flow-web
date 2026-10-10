#!/usr/bin/env python3
"""
Botanica 90s — lightweight YouTube 16:9 DRAFT (1280x720).

Reuses chapter/crop language from run_botanica_recap.py.
Does NOT write to EXPORT/, Drive, ARTISTS/, or EVENT_SELECTS/.
Does NOT use -shortest for final mux (explicit -t).

  python scripts/botanica_90s_recap/run_botanica_draft_16x9.py --root "D:\\Wakungo_Content_Studio\\Botanica" --plan-only
  python scripts/botanica_90s_recap/run_botanica_draft_16x9.py --root "D:\\Wakungo_Content_Studio\\Botanica" --render
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import run_botanica_recap as recap  # noqa: E402

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv"}
EXCLUDE_NAME_HINTS = (
    "concept9-16",
    "botanica_90s_recap",
    "botanica_12s_",
    "botanica_90s_youtube_draft",
    "_silent.mp4",
    "preview_720",
)
SKIP_DIRS = {
    "ANALYSIS",
    "EDIT",
    "EXPORT",
    "__pycache__",
    ".git",
    "test_render",
    "recap_tmp",
    "recap_16x9_tmp",
    "draft_16x9_tmp",
    "letterbox_reel_tmp",
}

# Editorial chapters aligned to production brief (may adjust slightly vs seed)
STORY = [
    {"id": "hook", "t": [0, 10], "label": "HOOK", "crops": ["ENVIRONMENT", "WIDE", "MEDIUM"]},
    {"id": "welcome", "t": [10, 25], "label": "WELCOME", "crops": ["WIDE", "MEDIUM", "CROWD"]},
    {"id": "connect", "t": [25, 45], "label": "CONNECT", "crops": ["MEDIUM", "PORTRAIT", "CLOSE_UP"]},
    {"id": "performance", "t": [45, 65], "label": "PERFORMANCE", "crops": ["CLOSE_UP", "INSTRUMENT", "MEDIUM", "WIDE"]},
    {"id": "peak", "t": [65, 82], "label": "PEAK", "crops": ["CLOSE_UP", "CROWD", "MEDIUM", "WIDE"]},
    {"id": "closing", "t": [82, 90], "label": "CLOSING", "crops": ["WIDE", "ENVIRONMENT", "MEDIUM"]},
]

CAPTIONS = [
    {"text": "WELCOME TO THE FLOW", "t0": 11.0, "t1": 16.5},
    {"text": "COME AS YOU ARE", "t0": 18.0, "t1": 23.0},
    {"text": "EACH ONE, TEACH ONE", "t0": 28.0, "t1": 34.0},
    {"text": "A SPACE TO CREATE", "t0": 48.0, "t1": 54.0},
    {"text": "WE GROW TOGETHER", "t0": 66.0, "t1": 72.0},
    {"text": "NO ONE CREATES ALONE", "t0": 82.5, "t1": 88.5},
]

# PiP moments: overlay a second (later) sample from same or alternate clip — not simultaneous cameras
PIP_AT_CHAPTER = {"connect", "performance", "peak"}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(">", " ".join(str(c) for c in cmd[:14]), "…" if len(cmd) > 14 else "")
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


def default_root() -> Path:
    env = os.environ.get("BOTANICA_ROOT")
    if env:
        return Path(env)
    for c in (Path(r"D:/Wakungo_Content_Studio/Botanica"), Path("/mnt/d/Wakungo_Content_Studio/Botanica")):
        if c.exists():
            return c
    return Path(r"D:/Wakungo_Content_Studio/Botanica")


def excluded_name(name: str) -> bool:
    n = name.lower()
    return any(h in n for h in EXCLUDE_NAME_HINTS)


def load_inventory(root: Path) -> list[dict[str, Any]]:
    inv_path = root / "ANALYSIS" / "media_inventory.json"
    items: list[dict[str, Any]] = []
    if inv_path.exists():
        try:
            data = json.loads(inv_path.read_text(encoding="utf-8"))
            rows = data if isinstance(data, list) else data.get("videos") or data.get("items") or []
            for row in rows:
                path = Path(row.get("path") or row.get("local_path") or row.get("source") or "")
                if not path.name or excluded_name(path.name):
                    continue
                if path.suffix.lower() not in VIDEO_EXT:
                    continue
                if not path.exists():
                    # try relative under root
                    alt = root / str(row.get("rel") or row.get("relative_path") or "")
                    if alt.exists():
                        path = alt
                    else:
                        continue
                dur = float(row.get("duration") or row.get("duration_sec") or 0)
                w = int(row.get("width") or 0)
                h = int(row.get("height") or 0)
                has_audio = bool(row.get("has_audio", True))
                prefer = "wako kungo" in str(path).lower().replace("\\", "/")
                if dur < 2.0:
                    continue
                items.append(
                    {
                        "path": str(path),
                        "name": path.name,
                        "duration": dur,
                        "width": w,
                        "height": h,
                        "has_audio": has_audio,
                        "prefer": prefer,
                    }
                )
        except Exception as e:
            print("WARN inventory parse failed:", e)

    if items:
        items.sort(key=lambda v: (1 if v.get("prefer") else 0, v.get("duration", 0)), reverse=True)
        return items

    # Fallback: scan preferred folder only (fast)
    candidates = [
        root / "DRIVE_UPLOAD" / "Wako Kungo",
        root / "Wako Kungo",
    ]
    seen: set[str] = set()
    for base in candidates:
        if not base.exists():
            continue
        for p in sorted(base.iterdir()):
            if not p.is_file() or p.suffix.lower() not in VIDEO_EXT:
                continue
            if excluded_name(p.name):
                continue
            key = str(p.resolve()).lower()
            if key in seen:
                continue
            seen.add(key)
            try:
                info = ffprobe(p)
            except Exception:
                continue
            dur = float(info.get("format", {}).get("duration") or 0)
            if dur < 2.0:
                continue
            vs = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
            as_ = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
            items.append(
                {
                    "path": str(p),
                    "name": p.name,
                    "duration": dur,
                    "width": int(vs.get("width") or 0),
                    "height": int(vs.get("height") or 0),
                    "has_audio": bool(as_),
                    "prefer": True,
                }
            )
    items.sort(key=lambda v: v.get("duration", 0), reverse=True)
    return items


def chapter_at(t: float) -> dict[str, Any]:
    for ch in STORY:
        a, b = ch["t"]
        if a <= t < b or (ch["id"] == "closing" and t >= a):
            return ch
    return STORY[-1]


def plan_edl(videos: list[dict[str, Any]], target: float = 90.0) -> list[dict[str, Any]]:
    """Build ~90s picture EDL from preferred Full HD pool."""
    pool = [v for v in videos if v.get("prefer")] or videos
    # Prefer longer clips for variety; keep short clips usable once
    pool = sorted(pool, key=lambda v: v.get("duration", 0), reverse=True)[:22]
    if not pool:
        return []

    n_shots = 34
    total = sum(v["duration"] for v in pool) or 1.0
    shots: list[dict[str, Any]] = []
    shot_i = 0
    used_windows: dict[str, list[tuple[float, float]]] = {v["path"]: [] for v in pool}

    for v in pool:
        share = max(1, int(round(n_shots * (v["duration"] / total))))
        dur = float(v["duration"])
        u0 = max(0.8, dur * 0.12)
        u1 = max(u0 + 2.5, dur * 0.88)
        span = max(2.0, u1 - u0)
        for k in range(share):
            if shot_i >= n_shots:
                break
            # provisional timeline position for chapter choice
            approx_t = (shot_i / n_shots) * target
            ch = chapter_at(approx_t)
            crops = ch["crops"]
            crop_name = crops[shot_i % len(crops)]
            c = recap.VIRTUAL_CROPS[crop_name]
            length = 2.15 + (shot_i % 4) * 0.28  # ~2.15–3.0
            if ch["id"] in ("hook", "closing"):
                length = 2.4 + (shot_i % 3) * 0.25
            t0 = u0 + span * ((k + 0.32) / max(share, 1))
            t1 = min(u1 - 0.05, t0 + length)
            if t1 - t0 < 0.9:
                continue
            # avoid heavy overlap on same source
            overlap = False
            for a, b in used_windows[v["path"]]:
                if not (t1 <= a or t0 >= b):
                    overlap = True
                    break
            if overlap:
                t0 = min(u1 - length - 0.2, t0 + length * 0.7)
                t1 = min(u1 - 0.05, t0 + length)
                if t1 - t0 < 0.9:
                    continue
            used_windows[v["path"]].append((t0, t1))
            shots.append(
                {
                    "i": shot_i,
                    "source": v["path"],
                    "source_name": v["name"],
                    "in": round(t0, 3),
                    "out": round(t1, 3),
                    "len": round(t1 - t0, 3),
                    "crop": crop_name,
                    "crop_w": c["w"],
                    "crop_h": c["h"],
                    "crop_x": c["x"],
                    "crop_y": c["y"],
                    "chapter": ch["id"],
                    "pip": False,
                    "pip_source": None,
                    "pip_in": None,
                    "caption": None,
                    "artist_id": None,
                    "transition": "cut",
                }
            )
            shot_i += 1
        if shot_i >= n_shots:
            break

    # Assign timeline positions and trim to ~target
    t = 0.0
    kept: list[dict[str, Any]] = []
    for s in shots:
        if t >= target - 0.3:
            break
        d = s["len"]
        if t + d > target:
            d = max(0.9, target - t)
            s["out"] = round(s["in"] + d, 3)
            s["len"] = round(d, 3)
        s["tl_in"] = round(t, 3)
        s["tl_out"] = round(t + s["len"], 3)
        kept.append(s)
        t += s["len"]

    # Mark PiP on 4 meaningful shots (connection, not gimmick)
    pip_candidates = [s for s in kept if s["chapter"] in PIP_AT_CHAPTER and s["len"] >= 2.0]
    # pick spaced indices
    pip_picks: list[dict[str, Any]] = []
    for s in pip_candidates:
        if not pip_picks or (s["tl_in"] - pip_picks[-1]["tl_in"]) >= 10.0:
            pip_picks.append(s)
        if len(pip_picks) >= 4:
            break
    for s in pip_picks:
        # overlay from a different source when possible (same event, not live multi-cam)
        alt = next((x for x in kept if x["source"] != s["source"] and x["chapter"] == s["chapter"]), None)
        if not alt:
            alt = next((x for x in kept if x["source"] != s["source"]), None)
        if not alt:
            continue
        s["pip"] = True
        s["pip_source"] = alt["source"]
        s["pip_in"] = alt["in"]
        s["pip_note"] = "editorial dual-moment (single-camera event — not simultaneous angles)"

    # Attach captions to shots whose timeline overlaps caption window
    for cap in CAPTIONS:
        host = None
        for s in kept:
            if s["tl_in"] <= cap["t0"] < s["tl_out"] or s["tl_in"] < cap["t1"] <= s["tl_out"]:
                host = s
                break
        if host is not None:
            host["caption"] = cap["text"]
            host["caption_t0"] = cap["t0"]
            host["caption_t1"] = cap["t1"]

    # Closing identity on last shot
    if kept:
        kept[-1]["closing_card"] = True
        kept[-1]["caption"] = kept[-1].get("caption") or "NO ONE CREATES ALONE"

    return kept


def pick_audio(videos: list[dict[str, Any]], seconds: float = 90.0) -> dict[str, Any]:
    pool = [v for v in videos if v.get("has_audio") and v.get("duration", 0) >= seconds + 2]
    if not pool:
        pool = [v for v in videos if v.get("has_audio")]
    if not pool:
        raise RuntimeError("No audio-capable source clips")
    # Prefer known-good long performance clip name if present
    prefer_names = ("DSC_1598", "DSC_1590", "DSC_1596", "DSC_1594")
    for pref in prefer_names:
        for v in pool:
            if pref.lower() in v["name"].lower() and v["duration"] >= seconds + 2:
                src = v
                break
        else:
            continue
        break
    else:
        src = max(pool, key=lambda v: v.get("duration", 0))
    dur = float(src["duration"])
    # Prefer ~28% in, but ensure remainder >= seconds
    start = max(0.0, min(dur * 0.28, max(0.0, dur - seconds - 1.0)))
    if dur - start < seconds:
        start = max(0.0, dur - seconds - 0.5)
    if dur - start < seconds - 0.25:
        raise RuntimeError(
            f"Audio remainder too short: {src['name']} dur={dur:.2f} ss={start:.2f} need={seconds}"
        )
    return {"source": src["path"], "source_name": src["name"], "ss": round(start, 3), "len": seconds, "duration": dur}


def vf_base_16x9() -> str:
    # Full-frame fit for landscape sources (primary format). Light grade, no AI, no heavy denoise.
    return (
        "scale=1280:720:force_original_aspect_ratio=increase,"
        "crop=1280:720,"
        "eq=contrast=1.05:brightness=0.02:saturation=0.96,"
        "fps=30,format=yuv420p"
    )


def escape_drawtext(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\u2019")
        .replace("%", "\\%")
    )


def caption_filter(text: str, local_t0: float, local_t1: float, fontfile: Optional[str]) -> str:
    if not fontfile:
        return ""
    safe = escape_drawtext(text)
    # Lower-third style, restrained
    enable = f"between(t\\,{local_t0:.2f}\\,{local_t1:.2f})"
    return (
        f",drawtext=fontfile='{fontfile}':text='{safe}':"
        f"fontcolor=0xf2e6c8:fontsize=36:"
        f"x=(w-text_w)/2:y=h-92:"
        f"borderw=2:bordercolor=0x0a0f1a@0.80:"
        f"shadowcolor=0x000000@0.45:shadowx=1:shadowy=2:"
        f"enable='{enable}'"
    )


def closing_filter(fontfile: Optional[str], dur: float) -> str:
    if not fontfile:
        return ""
    lines = [
        ("WAKO KUNGO × BOTANICA", 0.15, max(0.2, dur - 0.2), 42, 0.38),
        ("Supported by Circle D Flow", 0.8, max(0.2, dur - 0.2), 28, 0.50),
        ("NO ONE CREATES ALONE.", 1.4, max(0.2, dur - 0.2), 34, 0.62),
        ("BE PART OF THE FLOW.", 2.0, max(0.2, dur - 0.15), 30, 0.74),
    ]
    parts = []
    for text, a, b, size, yfrac in lines:
        safe = escape_drawtext(text)
        enable = f"between(t\\,{a:.2f}\\,{b:.2f})"
        parts.append(
            f",drawtext=fontfile='{fontfile}':text='{safe}':"
            f"fontcolor=0xe8c76a:fontsize={size}:"
            f"x=(w-text_w)/2:y=h*{yfrac:.2f}:"
            f"borderw=2:bordercolor=0x0a0f1a@0.85:"
            f"enable='{enable}'"
        )
    return "".join(parts)


def _shot_text_chain(shot: dict[str, Any], dur: float, fontfile: Optional[str]) -> str:
    """Return optional drawtext suffix (leading commas) for a simple -vf chain."""
    parts = ""
    if shot.get("closing_card"):
        parts += closing_filter(fontfile, dur)
        return parts
    if shot.get("caption") and fontfile:
        lt0 = max(0.15, float(shot.get("caption_t0", shot["tl_in"])) - float(shot["tl_in"]))
        lt1 = min(dur - 0.1, float(shot.get("caption_t1", shot["tl_out"])) - float(shot["tl_in"]))
        if lt1 > lt0 + 0.4:
            parts += caption_filter(shot["caption"], lt0, lt1, fontfile)
    return parts


def render_shot(shot: dict[str, Any], out: Path, fontfile: Optional[str], threads: int = 2) -> bool:
    out.parent.mkdir(parents=True, exist_ok=True)
    dur = float(shot["len"])
    text_chain = _shot_text_chain(shot, dur, fontfile)
    ss = float(shot["in"])
    # Decode-accurate trim inside filter (safer than -ss-before-i on Nikon MOV edit lists)
    trim0 = f"trim=start={ss:.3f}:duration={dur:.3f},setpts=PTS-STARTPTS"

    cmd: list[str] = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-y",
        "-threads",
        str(threads),
        "-i",
        shot["source"],
    ]

    if shot.get("pip") and shot.get("pip_source"):
        pip_ss = float(shot["pip_in"])
        trim1 = f"trim=start={pip_ss:.3f}:duration={dur:.3f},setpts=PTS-STARTPTS"
        cmd += ["-i", shot["pip_source"]]
        post = text_chain.lstrip(",")
        if post:
            fc = (
                f"[0:v]{trim0},{vf_base_16x9()}[main];"
                f"[1:v]{trim1},scale=420:236:force_original_aspect_ratio=increase,crop=420:236,"
                f"eq=contrast=1.04:brightness=0.01:saturation=0.95,fps=30,format=yuv420p,"
                f"pad=428:244:4:4:0x0a0f1a[pip];"
                f"[main][pip]overlay=W-w-28:H-h-28:format=auto,{post}[vout]"
            )
        else:
            fc = (
                f"[0:v]{trim0},{vf_base_16x9()}[main];"
                f"[1:v]{trim1},scale=420:236:force_original_aspect_ratio=increase,crop=420:236,"
                f"eq=contrast=1.04:brightness=0.01:saturation=0.95,fps=30,format=yuv420p,"
                f"pad=428:244:4:4:0x0a0f1a[pip];"
                f"[main][pip]overlay=W-w-28:H-h-28:format=auto[vout]"
            )
        cmd += ["-filter_complex", fc, "-map", "[vout]"]
    else:
        # Single input: -ss after -i (proven on dual-format 12s) + short -t
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "warning",
            "-y",
            "-threads",
            str(threads),
            "-i",
            shot["source"],
            "-ss",
            f"{ss:.3f}",
            "-t",
            f"{dur:.3f}",
            "-vf",
            vf_base_16x9() + text_chain,
        ]

    cmd += [
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-t",
        f"{dur:.3f}",
        str(out),
    ]
    try:
        run(cmd)
        return out.exists() and out.stat().st_size > 20_000
    except subprocess.CalledProcessError as e:
        print("WARN shot failed:", shot.get("source_name"), (e.stderr or "")[-300:])
        return False


def extract_audio(audio: dict[str, Any], out: Path, threads: int = 2) -> bool:
    # -ss AFTER -i for Nikon MOV accuracy
    fade_out = max(0.0, float(audio["len"]) - 2.2)
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-y",
        "-threads",
        str(threads),
        "-i",
        audio["source"],
        "-ss",
        f"{audio['ss']:.3f}",
        "-t",
        f"{audio['len']:.3f}",
        "-vn",
        "-af",
        f"loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.8,afade=t=out:st={fade_out:.2f}:d=2.0",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        str(out),
    ]
    try:
        run(cmd)
        return out.exists() and out.stat().st_size > 10_000
    except subprocess.CalledProcessError as e:
        print("ERROR audio bed:", (e.stderr or "")[-300:])
        return False


def assemble(parts: list[Path], audio: Path, master: Path, target: float, work: Path) -> bool:
    concat = work / "concat.txt"
    lines = []
    for p in parts:
        ap = str(p.resolve()).replace("'", "'\\''")
        lines.append(f"file '{ap}'")
    concat.write_text("\n".join(lines) + "\n", encoding="utf-8")
    # Explicit -t; NO -shortest
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "warning",
        "-y",
        "-threads",
        "2",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat),
        "-i",
        str(audio),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        f"{target:.3f}",
        "-fflags",
        "+genpts",
        "-avoid_negative_ts",
        "make_zero",
        "-movflags",
        "+faststart",
        str(master),
    ]
    try:
        run(cmd)
        return master.exists() and master.stat().st_size > 100_000
    except subprocess.CalledProcessError as e:
        print("ERROR assemble:", (e.stderr or "")[-400:])
        return False


def probe_qa(path: Path) -> dict[str, Any]:
    info = ffprobe(path)
    v = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    a = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
    dur = float(info.get("format", {}).get("duration") or 0)
    ok = True
    notes: list[str] = []
    if dur < 88.0 or dur > 92.5:
        ok = False
        notes.append(f"duration out of range: {dur:.3f}")
    if int(v.get("width") or 0) != 1280 or int(v.get("height") or 0) != 720:
        ok = False
        notes.append("resolution mismatch")
    if (v.get("codec_name") or "") != "h264":
        ok = False
        notes.append("video not h264")
    if not a or (a.get("codec_name") or "") != "aac":
        ok = False
        notes.append("audio missing/not aac")
    a_dur = float(a.get("duration") or dur) if a else 0.0
    if a_dur < 88.0:
        ok = False
        notes.append(f"audio truncated: {a_dur:.3f}")
    return {
        "path": str(path),
        "ok": ok,
        "duration": dur,
        "width": int(v.get("width") or 0),
        "height": int(v.get("height") or 0),
        "fps": v.get("r_frame_rate"),
        "video": v.get("codec_name"),
        "audio": (a or {}).get("codec_name"),
        "audio_duration": a_dur,
        "bytes": path.stat().st_size,
        "notes": notes,
    }


def write_edl_markdown(edl: list[dict[str, Any]], audio: dict[str, Any], out_md: Path, root: Path) -> None:
    lines = [
        "# Botanica 90s — Master EDL (YouTube 16:9 draft)",
        "",
        f"**Created:** {utc_now()}",
        f"**Root:** `{root}`",
        "**Primary format:** 1280×720 @ 30fps (draft) → final target 1920×1080 later",
        "**Audio rule:** `-ss` after `-i`, explicit `-t 90`, **no** `-shortest`",
        "**Safety:** no Drive / ARTISTS / EXPORT writes; no artist auto-ID",
        "",
        "## Story chapters",
        "",
        "| Chapter | Time | Intent |",
        "|---------|------|--------|",
    ]
    for ch in STORY:
        lines.append(f"| {ch['id']} | {ch['t'][0]}–{ch['t'][1]}s | {ch['label']} |")
    lines += [
        "",
        "## Audio bed",
        "",
        f"- Source: `{audio['source_name']}`",
        f"- In: `{audio['ss']}`  Len: `{audio['len']}`  Source dur: `{audio['duration']:.2f}`",
        f"- Remainder after seek: `{audio['duration'] - audio['ss']:.2f}`s",
        "",
        "## Picture EDL",
        "",
        "| # | TL | Source | In–Out | Crop | Cap | PiP | Chapter |",
        "|---|----|--------|--------|------|-----|-----|---------|",
    ]
    for s in edl:
        cap = s.get("caption") or ""
        pip = "Y" if s.get("pip") else ""
        lines.append(
            f"| {s['i']:02d} | {s['tl_in']:.1f}–{s['tl_out']:.1f} | {s['source_name']} | "
            f"{s['in']:.2f}–{s['out']:.2f} | {s['crop']} | {cap} | {pip} | {s['chapter']} |"
        )
    lines += [
        "",
        "## Captions (editorial, not speech subtitles)",
        "",
    ]
    for c in CAPTIONS:
        lines.append(f"- `{c['t0']:.0f}–{c['t1']:.0f}s` — {c['text']}")
    lines += [
        "",
        "## Closing identity",
        "",
        "WAKO KUNGO × BOTANICA",
        "Supported by Circle D Flow",
        "NO ONE CREATES ALONE.",
        "BE PART OF THE FLOW.",
        "",
        "## Exclusions",
        "",
        "- Concept9-16.mp4",
        "- Prior BOTANICA_90s_RECAP_* masters",
        "- Prior 12s preview exports",
        "",
        "## Notes",
        "",
        "- Single-camera event: PiP is editorial dual-moment, not live multi-cam.",
        "- `artist_id` left null — no unverified face assignment.",
        "- Draft uses light grade only; no AI upscale / no membership UI.",
        "",
    ]
    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Botanica 90s lightweight 16:9 draft (1280x720)")
    ap.add_argument("--root", type=Path, default=None)
    ap.add_argument("--seconds", type=float, default=90.0)
    ap.add_argument("--plan-only", action="store_true")
    ap.add_argument("--render", action="store_true", help="Encode one 1280x720 draft after preflight")
    ap.add_argument("--threads", type=int, default=2)
    args = ap.parse_args()

    if not args.plan_only and not args.render:
        # default: plan + render when authorized via --render; else plan-only safe
        args.plan_only = True

    if not which("ffmpeg") or not which("ffprobe"):
        print("ERROR: ffmpeg/ffprobe required")
        return 2

    root = args.root or default_root()
    print("=== Botanica 90s DRAFT 16:9 (1280x720) ===")
    print(f"Root: {root}")
    print(f"Script: {Path(__file__).resolve()}")
    if not root.exists():
        print("BLOCKER: Botanica root missing — cannot preflight/render from this environment")
        return 3

    preview_dir = root / "00_work" / "preview"
    work = root / "00_work" / "draft_16x9_tmp"
    analysis = root / "ANALYSIS"
    preview_dir.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    analysis.mkdir(parents=True, exist_ok=True)

    print("01 — Preflight inventory…")
    videos = load_inventory(root)
    prefer = [v for v in videos if v.get("prefer")]
    print(f"   videos usable={len(videos)} prefer_wako={len(prefer)}")
    if len(videos) < 5:
        print("BLOCKER: insufficient source videos")
        return 4

    print("02 — Plan EDL + audio…")
    edl = plan_edl(videos, args.seconds)
    if not edl:
        print("BLOCKER: empty EDL")
        return 5
    try:
        audio = pick_audio(videos, args.seconds)
    except RuntimeError as e:
        print("BLOCKER:", e)
        return 6

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    edl_json = analysis / f"BOTANICA_90S_DRAFT_EDL_{stamp}.json"
    edl_md_repo = Path(__file__).resolve().parents[2] / "pipeline" / "reports" / "BOTANICA_90S_MASTER_EDL.md"
    edl_md_local = analysis / "BOTANICA_90S_MASTER_EDL.md"
    payload = {
        "created_at": utc_now(),
        "seconds": args.seconds,
        "width": 1280,
        "height": 720,
        "fps": 30,
        "audio": audio,
        "captions": CAPTIONS,
        "story": STORY,
        "shots": edl,
        "exclusions": list(EXCLUDE_NAME_HINTS),
        "safety": {
            "no_drive_write": True,
            "no_export_master": True,
            "no_shortest": True,
            "ss_after_i": True,
            "artist_id": None,
        },
    }
    edl_json.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    write_edl_markdown(edl, audio, edl_md_local, root)
    try:
        write_edl_markdown(edl, audio, edl_md_repo, root)
    except Exception as e:
        print("WARN could not write repo EDL md:", e)

    tl = edl[-1]["tl_out"] if edl else 0
    pip_n = sum(1 for s in edl if s.get("pip"))
    print(f"   shots={len(edl)} timeline≈{tl:.1f}s pip={pip_n}")
    print(f"   audio={audio['source_name']} ss={audio['ss']} remain={audio['duration']-audio['ss']:.1f}s")
    print(f"   EDL json → {edl_json}")
    print(f"   EDL md   → {edl_md_local}")

    if args.plan_only and not args.render:
        print("PLAN-ONLY complete. Pass --render to encode draft.")
        return 0

    print("03 — Extract audio bed…")
    bed = work / f"audio_bed_{stamp}.m4a"
    t0 = time.time()
    if not extract_audio(audio, bed, threads=args.threads):
        return 7
    print(f"   audio bed ok ({time.time()-t0:.1f}s)")

    font = recap.find_font()
    fontfile = recap.ffmpeg_fontfile_arg(font) if font else None
    print(f"   font: {font or 'NONE (captions skipped)'}")

    print("04 — Render shots (veryfast / CRF23 / threads={})…".format(args.threads))
    clips_dir = work / f"clips_{stamp}"
    clips_dir.mkdir(parents=True, exist_ok=True)
    parts: list[Path] = []
    for s in edl:
        out = clips_dir / f"shot_{s['i']:03d}.mp4"
        print(f"   shot {s['i']:02d} {s['chapter']} {s['source_name']} pip={bool(s.get('pip'))}")
        if render_shot(s, out, fontfile, threads=args.threads):
            parts.append(out)
        else:
            print("   SKIP failed shot", s["i"])
    if len(parts) < 8:
        print("BLOCKER: too few rendered parts", len(parts))
        return 8

    master = preview_dir / f"BOTANICA_90s_YOUTUBE_DRAFT_16x9_{stamp}.mp4"
    if master.exists():
        print("BLOCKER: output exists", master)
        return 9

    print("05 — Assemble (explicit -t, no -shortest)…")
    t1 = time.time()
    if not assemble(parts, bed, master, args.seconds, work):
        return 10
    wall = time.time() - t0
    assemble_s = time.time() - t1

    print("06 — QA ffprobe…")
    qa = probe_qa(master)
    report = {
        "created_at": utc_now(),
        "status": "ok" if qa["ok"] else "qa_flags",
        "wall_seconds": round(wall, 1),
        "assemble_seconds": round(assemble_s, 1),
        "master": str(master),
        "edl_json": str(edl_json),
        "audio": audio,
        "shots_planned": len(edl),
        "shots_rendered": len(parts),
        "pip_count": pip_n,
        "qa": qa,
        "improvements_for_final": [
            "Re-cut peak chapter against musical accents after listening pass",
            "Upgrade to 1920x1080 CRF 17–19 / AAC 256–320k",
            "Optional light hqdn3d only on noisy stage clips",
            "Replace weak short openers (e.g. <5s clips) with stronger hooks",
            "Manual PiP pair selection after visual review",
            "Verify caption timing against lyrical rests",
        ],
    }
    report_json = preview_dir / f"BOTANICA_90s_DRAFT_QA_{stamp}.json"
    report_md = preview_dir / f"BOTANICA_90s_DRAFT_QA_{stamp}.md"
    report_json.write_text(json.dumps(report, indent=2), encoding="utf-8")
    report_md.write_text(
        "\n".join(
            [
                "# Botanica 90s draft — QA",
                "",
                f"- Status: {report['status']}",
                f"- Master: `{master}`",
                f"- Wall: {report['wall_seconds']}s",
                f"- Duration: {qa['duration']:.3f}s",
                f"- Res: {qa['width']}x{qa['height']} @ {qa['fps']}",
                f"- Codecs: {qa['video']} + {qa['audio']} (a_dur={qa['audio_duration']:.3f})",
                f"- Bytes: {qa['bytes']}",
                f"- Notes: {'; '.join(qa['notes']) or 'none'}",
                "",
                "STOP — await approval before final 1080p / 9:16 / artist pack.",
            ]
        ),
        encoding="utf-8",
    )

    # Also mirror brief QA into repo reports if writable
    try:
        repo_qa = Path(__file__).resolve().parents[2] / "pipeline" / "reports" / "BOTANICA_90S_DRAFT_QA.md"
        shutil.copy2(report_md, repo_qa)
    except Exception:
        pass

    print("")
    print("RESULT")
    print(f"MASTER={master}")
    print(f"OK={qa['ok']} DUR={qa['duration']:.3f} RES={qa['width']}x{qa['height']} BYTES={qa['bytes']} WALL={report['wall_seconds']}")
    print(f"QA={report_md}")
    print("STOP — draft complete. No final / no 9:16 / no artist pack / no Drive upload.")
    return 0 if qa["ok"] else 11


if __name__ == "__main__":
    sys.exit(main())
