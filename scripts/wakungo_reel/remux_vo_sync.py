#!/usr/bin/env python3
"""Remux reel: deep Guy VO (Freeman-adjacent), VTT-synced captions, wrapped BIG TEXT.

Reuses existing picture_30.mp4 — no full re-edit.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

OUT = Path(r"D:\Wakungo_Content_Studio\_wakungo_reel")
WORK = OUT / "preview_work_moodboard_v4"
PICTURE = WORK / "picture_30.mp4"
FINAL = OUT / "WK_LAPA71_MOODBOARD_REEL_30s_9x16.mp4"
FINAL_ALIAS = OUT / "WK_MOVE_ART_GALLERY_30s_9x16.mp4"

W, H = 1080, 1920
TARGET = 30.0

VO_SCRIPT = (
    "Maybe culture isn't meant to be watched. "
    "Maybe it's meant to be experienced. "
    "To share. To listen. To connect. "
    "To learn from each other. And teach each other. "
    "This is a supportive space. "
    "We grow when we move together. "
    "We create space to express, explore and become. "
    "Come as you are. Bring what you have. "
    "Create what's next."
)

# Map spoken cue -> optional BIG punch (multiline-safe)
BIG_MAP = {
    "maybe it's meant to be experienced": "EXPERIENCED.",
    "this is a supportive space": "THIS IS A\nSUPPORTIVE SPACE",
    "we grow when we move together": "WE GROW WHEN WE\nMOVE TOGETHER.",
    "we create space to express, explore and become": "WE CREATE SPACE\nTO EXPRESS.",
    "come as you are": "COME AS YOU ARE.",
    "bring what you have": "BRING WHAT\nYOU HAVE.",
    "create what's next": "WHAT WILL YOU BRING\nTO THE CIRCLE?",
}


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1200:])


def probe_dur(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out or 0)


def parse_vtt(path: Path) -> list[tuple[float, float, str]]:
    text = path.read_text(encoding="utf-8")
    cues = []
    blocks = re.split(r"\n\s*\n", text.strip())
    for b in blocks:
        lines = [ln.strip() for ln in b.splitlines() if ln.strip()]
        if len(lines) < 2:
            continue
        # skip index-only first line
        if re.fullmatch(r"\d+", lines[0]):
            lines = lines[1:]
        if not lines:
            continue
        m = re.match(
            r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})",
            lines[0],
        )
        if not m:
            continue
        h1, m1, s1, ms1, h2, m2, s2, ms2 = map(int, m.groups())
        start = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000
        end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000
        body = " ".join(lines[1:]).strip()
        if body:
            cues.append((start, end, body))
    return cues


def tfmt(t: float) -> str:
    t = max(0.0, min(t, TARGET))
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def ass_escape(text: str) -> str:
    # ASS newline is \N — never leave a lone backslash visible
    return text.replace("\\", "").replace("\n", r"\N").replace("{", "(").replace("}", ")")


def build_ass(cues: list[tuple[float, float, str]], path: Path) -> Path:
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Arial,30,&H00F2F2F2,&H000000FF,&H78000000,&H50000000,-1,0,0,0,100,100,0,0,1,1.5,0,2,80,80,220,1
Style: Big,Arial,48,&H00FFFFFF,&H000000FF,&H90000000,&H64000000,-1,0,0,0,100,100,1,0,1,2.4,0,5,100,100,0,1
Style: Brand,Arial,32,&H00FFFFFF,&H000000FF,&H80000000,&H55000000,-1,0,0,0,100,100,1,0,1,2,0,2,90,90,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    for start, end, text in cues:
        # keep subtitle on screen a touch after speech for readability
        end = min(TARGET - 0.05, max(end, start + 0.35) + 0.12)
        lines.append(
            f"Dialogue: 0,{tfmt(start)},{tfmt(end)},Sub,,0,0,0,,{ass_escape(text)}\n"
        )
        key = text.lower().rstrip(".")
        punch = None
        for k, v in BIG_MAP.items():
            if key == k or key.startswith(k):
                punch = v
                break
        if punch:
            # punch slightly after speech starts; end with cue
            ps = min(start + 0.08, end - 0.25)
            pe = min(TARGET - 0.05, end + 0.15)
            lines.append(
                f"Dialogue: 1,{tfmt(ps)},{tfmt(pe)},Big,,0,0,0,,{ass_escape(punch)}\n"
            )

    # Brand after VO settles
    vo_end = cues[-1][1] if cues else 27.5
    brand_start = min(28.55, max(vo_end + 0.15, 27.8))
    lines.append(
        f"Dialogue: 1,{tfmt(brand_start)},{tfmt(TARGET - 0.05)},Brand,,0,0,0,,"
        f"{ass_escape('WAKO KUNGO × CIRCLE.D.FLOW')}\n"
    )
    path.write_text("".join(lines), encoding="utf-8-sig")
    return path


def main() -> int:
    if not PICTURE.exists():
        print("missing picture", PICTURE)
        return 1

    WORK.mkdir(parents=True, exist_ok=True)
    mp3 = WORK / "vo_guy_fit.mp3"
    vtt = WORK / "vo_guy_fit.vtt"

    # Deep, measured delivery (Morgan Freeman-adjacent). No Jamaican neural voice available.
    print("generate GuyNeural VO + VTT", flush=True)
    r = subprocess.run(
        [
            "edge-tts",
            "--voice", "en-US-GuyNeural",
            "--rate=+6%",
            "--pitch=-10Hz",
            f"--text={VO_SCRIPT}",
            f"--write-media={mp3}",
            f"--write-subtitles={vtt}",
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0 or not mp3.exists():
        raise RuntimeError((r.stderr or r.stdout or "tts fail")[-800:])

    cues = parse_vtt(vtt)
    print(f"  cues={len(cues)} vo_raw={probe_dur(mp3):.2f}s", flush=True)
    for s, e, t in cues:
        print(f"  {s:5.2f}-{e:5.2f}  {t}", flush=True)

    vo_wav = WORK / "vo_synced.wav"
    # Pad to 30s; keep natural pace (no time-stretch warble)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(mp3),
        "-af", (
            "loudnorm=I=-16:TP=-1.5:LRA=11,"
            "afade=t=in:st=0:d=0.06,"
            "apad=whole_dur=30,"
            "afade=t=out:st=28.9:d=1.0,"
            "alimiter=limit=0.95"
        ),
        "-t", f"{TARGET:.2f}", "-ar", "48000", "-ac", "1",
        str(vo_wav),
    ])

    # Light natural bed if present
    sfx = WORK / "nat.wav"
    mix = WORK / "mix_synced.m4a"
    if sfx.exists():
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(vo_wav), "-i", str(sfx),
            "-filter_complex",
            "[0:a]volume=1.0[v];[1:a]volume=0.26[s];"
            "[v][s]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[a]",
            "-map", "[a]", "-t", f"{TARGET:.2f}",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(mix),
        ])
    else:
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(vo_wav), "-t", f"{TARGET:.2f}",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(mix),
        ])

    ass = build_ass(cues, WORK / "typo_synced.ass")
    ass_esc = str(ass).replace("\\", "/").replace(":", r"\:")
    titled = WORK / "titled_synced.mp4"
    print("burn synced typography (wrapped)", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(PICTURE),
        "-vf", f"ass='{ass_esc}'",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-an", "-t", f"{TARGET:.2f}",
        str(titled),
    ])

    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(titled), "-i", str(mix),
        "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-t", f"{TARGET:.2f}", "-shortest",
        str(FINAL),
    ])
    if FINAL_ALIAS.exists():
        FINAL_ALIAS.unlink()
    FINAL_ALIAS.write_bytes(FINAL.read_bytes())

    # QC frames for cut-off text
    qc = WORK / "qc_sync"
    qc.mkdir(exist_ok=True)
    for t in (4.0, 14.5, 17.0, 20.0, 24.0, 28.8):
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", str(t), "-i", str(FINAL), "-frames:v", "1",
            str(qc / f"t{t:.1f}.jpg"),
        ])

    print("DONE", FINAL, "MB", round(FINAL.stat().st_size / 1e6, 1), "dur", round(probe_dur(FINAL), 2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
