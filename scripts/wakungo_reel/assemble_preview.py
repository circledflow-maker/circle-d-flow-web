#!/usr/bin/env python3
"""Assemble 1080x1920 30s preview: picture + typography + final audio mix.

Prefer audio/final_mix from a07_audio_director. Run when ffmpeg is idle.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import OUT, PROJECT_PATH

VF_BASE = (
    "scale=1080:1920:force_original_aspect_ratio=increase,"
    "crop=1080:1920,"
    "eq=contrast=1.06:brightness=0.02:saturation=0.96:gamma=1.04,"
    "hqdn3d=1.4:1.1:2.4:2.0,fps=30,format=yuv420p"
)


def pick_final_mix(project: dict) -> Path | None:
    paths = ((project.get("audio_direction") or {}).get("paths")) or {}
    for key in ("final_mix_aac", "final_mix"):
        p = Path(paths.get(key) or "")
        if p.exists() and p.stat().st_size > 10_000:
            return p
    for a in project.get("audio") or []:
        if a.get("role") == "final_mix":
            p = Path(a.get("path") or "")
            if p.exists():
                return p
    return None


def _ass_time(t: float) -> str:
    if t < 0:
        t = 0
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def _ass_escape(text: str) -> str:
    return text.replace("\n", r"\N").replace("{", r"\{").replace("}", r"\}")


def build_ass(project: dict, out_path: Path) -> Path:
    hier = ((project.get("typography") or {}).get("hierarchy")) or {}
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Arial,50,&H00FFFFFF,&H000000FF,&H80000000,&H64000000,-1,0,0,0,100,100,0,0,1,2,0,2,70,70,150,1
Style: Editorial,Arial,42,&H00E8E8E8,&H000000FF,&H80000000,&H64000000,-1,0,0,0,100,100,1,0,1,2,0,8,80,80,210,1
Style: Hero,Arial,62,&H00FFFFFF,&H000000FF,&H80000000,&H64000000,-1,0,0,0,100,100,1,0,1,3,0,5,90,90,0,1
Style: CTA,Arial,46,&H00FFFFFF,&H000000FF,&H80000000,&H64000000,-1,0,0,0,100,100,1,0,1,2,0,8,80,80,270,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    mapping = [
        ("L1_subtitles", "Sub", 0),
        ("L2_editorial", "Editorial", 1),
        ("L3_hero", "Hero", 2),
        ("L4_cta", "CTA", 1),
    ]
    for key, style, layer in mapping:
        for cue in hier.get(key) or []:
            start = float(cue.get("start") or 0)
            end = float(cue.get("end") or start + 0.5)
            if end <= start:
                continue
            margin_v = 0
            pos = cue.get("position") or {}
            if pos.get("y") and float(pos["y"]) < 0.8:
                margin_v = int((1.0 - float(pos["y"])) * 1920 * 0.15)
            text = _ass_escape(str(cue.get("text") or "").strip())
            if not text:
                continue
            lines.append(
                f"Dialogue: {layer},{_ass_time(start)},{_ass_time(end)},{style},,0,0,{margin_v},,{text}\n"
            )
    out_path.write_text("".join(lines), encoding="utf-8-sig")
    return out_path


def main() -> int:
    if not PROJECT_PATH.exists():
        print("missing project.json — run run.py / a07_audio_director first")
        return 2
    project = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
    work = OUT / "preview_work"
    if work.exists():
        for old in work.glob("*.mp4"):
            old.unlink(missing_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    parts = []
    n = 0
    for seg in project.get("timeline") or []:
        for clip in seg.get("clips") or []:
            src = Path(clip["path"])
            if not src.exists():
                print("missing", src)
                continue
            n += 1
            out = work / f"{n:03d}.mp4"
            ss = float(clip.get("in") or 0)
            t = float(clip.get("take") or 0.6)
            cmd = [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                "-ss", f"{ss:.3f}", "-i", str(src), "-t", f"{t:.3f}",
                "-vf", VF_BASE, "-an",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
                str(out),
            ]
            print(f"clip {n} {src.name} {t:.2f}s", flush=True)
            r = subprocess.run(cmd)
            if r.returncode == 0 and out.exists():
                parts.append(out)
    if not parts:
        print("no clips rendered")
        return 1
    lst = work / "concat.txt"
    lines = []
    for p in parts:
        path = str(p).replace("\\", "/").replace("'", r"'\''")
        lines.append(f"file '{path}'\n")
    lst.write_text("".join(lines), encoding="utf-8")

    silent = work / "video_silent.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-an", "-t", "30",
        str(silent),
    ], check=False)
    if not silent.exists():
        print("silent concat failed")
        return 1

    pictured = work / "video_30.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(silent),
        "-vf", "tpad=stop_mode=clone:stop_duration=3",
        "-t", "30", "-an",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        str(pictured),
    ], check=False)
    if not pictured.exists():
        pictured = silent

    ass = build_ass(project, work / "typography.ass")
    ass_esc = str(ass).replace("\\", "/").replace(":", r"\:")
    titled = work / "video_titled.mp4"
    print("burn typography", ass.name, flush=True)
    r = subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(pictured),
        "-vf", f"ass='{ass_esc}'",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-an", "-t", "30",
        str(titled),
    ])
    if r.returncode != 0 or not titled.exists():
        print("ass burn failed — picture without titles", flush=True)
        titled = pictured

    final = OUT / "WK_MOVE_ART_GALLERY_30s_9x16.mp4"
    mix = pick_final_mix(project)
    if mix:
        print("final mix", mix, flush=True)
        r = subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-i", str(titled),
            "-i", str(mix),
            "-map", "0:v", "-map", "1:a",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-t", "30", "-shortest",
            str(final),
        ])
        if r.returncode != 0 or not final.exists():
            print("mux failed", flush=True)
            return 1
    else:
        print("no final mix — silent picture", flush=True)
        if final.exists():
            final.unlink()
        titled.replace(final)

    print(
        "wrote", final,
        "exists", final.exists(),
        "sizeMB", round(final.stat().st_size / 1e6, 1) if final.exists() else 0,
    )
    return 0 if final.exists() else 1


if __name__ == "__main__":
    raise SystemExit(main())
