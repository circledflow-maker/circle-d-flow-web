#!/usr/bin/env python3
"""ONENESS teasers v2 — flow, energy, 30-60s.

Per-artist (~45s): Chris live paint hook -> song peak block -> paint beat ->
rhythm hits -> endcard. 9x16 uses finished Stages 9x16 packages (face-forward crop).

Compilation / IG hero: faster beat cuts, all artists, paint + crowd intercuts.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

os.environ["FONTCONFIG_FILE"] = r"D:\circle-d-flow-web\scripts\fonts\fonts.conf"
os.environ["FONTCONFIG_PATH"] = r"D:\circle-d-flow-web\scripts\fonts"

ROOT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July")
RAYAN = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\Oneness captured Rayan")
if not RAYAN.exists():
    RAYAN = ROOT / "Oneness captured Rayan"

A002 = ROOT / "002" / "06_drive_ready" / "Circle_D_Stages" / "Artists"
A003 = ROOT / "003" / "06_drive_ready" / "Circle_D_Stages" / "Artists"
OUT = ROOT / "YouTube_Master_Renders" / "Teasers"
WORK = ROOT / "00_work" / "teasers_v2"
LOGS = ROOT / "00_logs"

FPS = "60000/1001"
FONT_CLEAN = r"C\:/Windows/Fonts/calibrib.ttf"
FONT_BODY = r"C\:/Windows/Fonts/calibri.ttf"
FONT_KEY = r"C\:/Windows/Fonts/georgiab.ttf"
FONT_BRAND = r"C\:/Windows/Fonts/impact.ttf"

GRADE = "eq=contrast=1.12:brightness=0.03:saturation=1.05:gamma=1.02"
GRADE_PAINT = "eq=contrast=1.08:brightness=0.04:saturation=1.08:gamma=1.0"

VCODEC = [
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
    "-r", FPS, "-fps_mode", "cfr", "-pix_fmt", "yuv420p",
]
ACODEC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]

# peak = main song block start (after package intro slate ~7s)
# hits = extra rhythm cuts (seconds into same source)
# paint_ss = Chris live paint in-point
ARTISTS = [
    {
        "id": "nicke",
        "title": "Nicke Klein",
        "ig": "@nickeklein",
        "pkg": A003 / "Nicke_Klein" / "01_Nicke-Klein_ONENESS_Stages_16x9.mp4",
        "pkg_916": A003 / "Nicke_Klein" / "01_Nicke-Klein_ONENESS_Stages_9x16.mp4",
        "peak": 118.0,
        "hits": [145.0, 168.0, 192.0, 215.0],
        "paint_ss": 6.0,
        "filler": RAYAN / "Nicke.MP4",
        "video": 1,
    },
    {
        "id": "july",
        "title": "July Tilie",
        "ig": "@julytilie",
        "pkg": A003 / "July_Tilie" / "01_July-Tilie_ONENESS_Stages_16x9.mp4",
        "pkg_916": A003 / "July_Tilie" / "01_July-Tilie_ONENESS_Stages_9x16.mp4",
        "peak": 88.0,
        "hits": [112.0, 136.0, 158.0, 182.0],
        "paint_ss": 10.0,
        "filler": RAYAN / "Emotional Filler.MP4",
        "video": 1,
    },
    {
        "id": "isaac_group",
        "title": "Mr Isaac & Joao & Edo & C-Riz",
        "ig": "ONENESS Live",
        "pkg": A003 / "Mr_Isaac_Joao_Edo_C-Riz" / "01_Mr-Isaac-Joao-Edo-C-Riz_ONENESS_Stages_16x9.mp4",
        "pkg_916": A003 / "Mr_Isaac_Joao_Edo_C-Riz" / "01_Mr-Isaac-Joao-Edo-C-Riz_ONENESS_Stages_9x16.mp4",
        "peak": 128.0,
        "hits": [152.0, 176.0, 198.0, 222.0],
        "paint_ss": 14.0,
        "filler": RAYAN / "Mr.Isaac Ending song.MP4",
        "video": 1,
    },
    {
        "id": "basseck",
        "title": "Basseck",
        "ig": "@basseck.mankabu",
        "pkg": A003 / "Finale_Baseck" / "01_Finale-Baseck_ONENESS_Stages_16x9.mp4",
        "pkg_916": A003 / "Finale_Baseck" / "01_Finale-Baseck_ONENESS_Stages_9x16.mp4",
        "peak": 98.0,
        "hits": [122.0, 146.0, 170.0, 194.0],
        "paint_ss": 8.0,
        "filler": RAYAN / "Barseck.MP4",
        "video": 1,
    },
    {
        "id": "elisa",
        "title": "Elisa",
        "ig": "@elisa.cas8",
        "pkg": A002 / "Elisa" / "01_Elisa_Free-as-A-Bird_ONENESS_Stages_16x9.mp4",
        "pkg_916": A002 / "Elisa" / "01_Elisa_Free-as-A-Bird_ONENESS_Stages_9x16.mp4",
        "peak": 72.0,
        "hits": [96.0, 118.0, 142.0, 166.0],
        "paint_ss": 5.0,
        "filler": RAYAN / "Elisa.MP4",
        "video": 2,
    },
    {
        "id": "criz",
        "title": "C-Riz",
        "ig": "@c_riz.official",
        "pkg": A002 / "C-Riz" / "01_CRiz_ONENESS_Stages_16x9.mp4",
        "pkg_916": A002 / "C-Riz" / "01_CRiz_ONENESS_Stages_9x16.mp4",
        "peak": 108.0,
        "hits": [132.0, 156.0, 180.0, 204.0],
        "paint_ss": 12.0,
        "filler": RAYAN / "C-Riz-Part2.MP4",
        "video": 2,
    },
    {
        "id": "arpanito",
        "title": "Arpanito",
        "ig": "@arpan.k_",
        "pkg": A002 / "Arpanito" / "01_Arpanito_ONENESS_Stages_16x9.mp4",
        "pkg_916": A002 / "Arpanito" / "01_Arpanito_ONENESS_Stages_9x16.mp4",
        # core vocal section (boosted window ~74-238s) — avoid tail where he leaves frame
        "peak": 138.0,
        "hits": [162.0, 186.0, 208.0, 228.0],
        "paint_ss": 18.0,
        "filler": RAYAN / "Emotional Filler.MP4",
        "video": 2,
    },
    {
        "id": "willpower",
        "title": "Willpower",
        "ig": "@bodyxwillpower",
        "pkg": A002 / "Willpower" / "01_Willpower_ONENESS_Stages_16x9.mp4",
        "pkg_916": A002 / "Willpower" / "01_Willpower_ONENESS_Stages_9x16.mp4",
        "peak": 102.0,
        "hits": [126.0, 150.0, 174.0, 198.0],
        "paint_ss": 9.0,
        "filler": RAYAN / "Entrance.MP4",
        "video": 2,
    },
    {
        "id": "manu",
        "title": "Manu Allegro",
        "ig": "@manuallegro",
        "pkg": A003 / "Manu_Allegro" / "01_Manu-Allegro_ONENESS_Stages_16x9.mp4",
        "pkg_916": A003 / "Manu_Allegro" / "01_Manu-Allegro_ONENESS_Stages_9x16.mp4",
        "peak": 108.0,  # after trimmed package start (~72s content)
        "hits": [132.0, 156.0, 180.0, 204.0],
        "paint_ss": 7.0,
        "filler": RAYAN / "Manu.MP4",
        "video": 2,
    },
]

PAINT = RAYAN / "Chris Inacao LivePaint.MP4"
PAINT2 = RAYAN / "live PaintChris Iniciao.MP4"
DANCE = RAYAN / "Dancing Filler.MP4"
CONNECT = RAYAN / "Connecting C4C.MP4"
EMOTION = RAYAN / "Emotional Filler.MP4"
ENTRANCE = RAYAN / "Entrance.MP4"

MIN_ARTIST_DUR = 28.0
MIN_COMP_DUR = 35.0
MIN_IG_DUR = 30.0


def log(msg: str) -> None:
    print(msg, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "oneness_teasers.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def run(cmd: list[str], err: Path | None = None) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if err is not None:
        err.write_text((r.stderr or r.stdout or "")[-12000:], encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1600:])


def esc(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "")
        .replace("’", "")
        .replace("‘", "")
        .replace("%", "%%")
        .replace("·", " - ")
        .replace("…", "...")
        .replace("é", "e")
        .replace("É", "E")
    )


def probe_dur(p: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True,
        text=True,
    )
    return float(r.stdout.strip() or 0)


def safe_ss(src: Path, want: float, clip: float) -> float:
    dur = probe_dur(src)
    if dur <= clip + 0.5:
        return 0.0
    return max(0.0, min(want, dur - clip - 0.25))


def artist_src(a: dict, aspect: str) -> Path:
    if aspect == "9x16":
        p = a.get("pkg_916")
        if p and Path(p).exists():
            return Path(p)
    return Path(a["pkg"])


def vf_for(w: int, h: int, *, mode: str = "wide", grade: str = GRADE) -> str:
    """wide = letterbox crop. close = tight upper-stage crop for 9x16 from 16x9."""
    if mode == "close" and w < h:
        # mic / face zone — upper-middle of stage frame
        return (
            f"scale=1920:1080:force_original_aspect_ratio=increase,"
            f"crop=864:1536:(iw-864)/2:ih*0.06,"
            f"scale={w}:{h},{grade},format=yuv420p"
        )
    if mode == "paint":
        return (
            f"scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h},{GRADE_PAINT},format=yuv420p"
        )
    return (
        f"scale={w}:{h}:force_original_aspect_ratio=increase,"
        f"crop={w}:{h},{grade},format=yuv420p"
    )


def cut_clip(
    src: Path,
    out: Path,
    ss: float,
    dur: float,
    w: int,
    h: int,
    *,
    mute: bool = False,
    mode: str = "wide",
    af: str | None = None,
) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 80_000:
        return out
    ss = safe_ss(src, ss, dur)
    audio_f = (
        "volume=0,aresample=48000:async=1:first_pts=0"
        if mute
        else (af or "highpass=f=70,alimiter=limit=0.95,aresample=48000:async=1:first_pts=0")
    )
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", f"{ss:.3f}", "-i", str(src), "-t", f"{dur:.3f}",
        "-vf", vf_for(w, h, mode=mode),
        "-af", audio_f,
        *VCODEC, *ACODEC, str(out),
    ]
    log(f"  cut {out.name} <- {src.name} @{ss:.1f}s ({dur:.1f}s) [{mode}]")
    run(cmd, WORK / f"{out.stem}_err.txt")
    if not out.exists() or out.stat().st_size < 40_000:
        raise RuntimeError(f"clip too small: {out}")
    if out.stat().st_size > 120_000_000:
        sz = out.stat().st_size
        out.unlink(missing_ok=True)
        raise RuntimeError(f"runaway clip size {sz} for {out.name}")
    return out


def concat(clips: list[Path], out: Path) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 100_000:
        return out
    lst = out.with_suffix(".txt")
    lines = []
    for c in clips:
        p = c.resolve().as_posix().replace("'", r"'\''")
        lines.append(f"file '{p}'")
    lst.write_text("\n".join(lines) + "\n", encoding="utf-8")
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        *VCODEC, *ACODEC, str(out),
    ]
    run(cmd, WORK / f"{out.stem}_concat_err.txt")
    return out


def burn_overlay(src: Path, out: Path, draw: str) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_size > 100_000:
        return out
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src),
        "-vf", f"{draw},format=yuv420p",
        "-c:a", "copy",
        *VCODEC, str(out),
    ]
    try:
        run(cmd, WORK / f"{out.stem}_burn_err.txt")
    except RuntimeError:
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src),
            "-vf", f"{draw},format=yuv420p",
            "-af", "aresample=48000",
            *VCODEC, *ACODEC, str(out),
        ]
        run(cmd, WORK / f"{out.stem}_burn2_err.txt")
    return out


def endcard(out: Path, w: int, h: int, lines: list[tuple[str, int, str, str]], dur: float = 3.0) -> Path:
    if out.exists() and out.stat().st_size > 20_000:
        return out
    parts = []
    n = len(lines)
    for i, (text, size, color, font) in enumerate(lines):
        y = f"h*0.38+(text_h+22)*{i - (n - 1) / 2:.2f}"
        parts.append(
            f"drawtext=fontfile='{font}':text='{esc(text)}':fontsize={size}:"
            f"fontcolor={color}:x=(w-text_w)/2:y={y}"
        )
    vf = ",".join(parts) + ",format=yuv420p"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=black:s={w}x{h}:r=60000/1001",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", f"{dur:.2f}", "-vf", vf, *VCODEC, *ACODEC, str(out),
    ]
    run(cmd, WORK / f"{out.stem}_end_err.txt")
    return out


def should_skip(path: Path, min_dur: float, force: bool) -> bool:
    if force or not path.exists() or path.stat().st_size < 200_000:
        return False
    return probe_dur(path) >= min_dur


def artist_overlay(w: int, h: int, title: str, ig: str, body_dur: float) -> str:
    """Corner labels only — no big words over faces."""
    t = esc(title)
    i = esc(ig)
    fs = 26 if w > 1200 else 24
    fade_out = max(body_dur - 0.8, 1.0)
    return (
        f"drawtext=fontfile='{FONT_CLEAN}':text='Circle D Stages':fontsize={fs}:"
        f"fontcolor=white@0.75:x=40:y=40:enable='between(t\\,0.3\\,4)',"
        f"drawtext=fontfile='{FONT_KEY}':text='ONENESS':fontsize={fs + 8}:"
        f"fontcolor=#E8C547:x=40:y=78:enable='between(t\\,0.5\\,5)',"
        f"drawtext=fontfile='{FONT_CLEAN}':text='{t}':fontsize={fs + 14}:"
        f"fontcolor=white:borderw=2:bordercolor=black@0.5:x=40:y=h-200:"
        f"enable='between(t\\,6\\,{fade_out:.1f})',"
        f"drawtext=fontfile='{FONT_BODY}':text='{i}':fontsize={fs}:"
        f"fontcolor=#E8C547:x=40:y=h-145:enable='between(t\\,6.2\\,{fade_out:.1f})',"
        f"drawtext=fontfile='{FONT_BODY}':text='Destination Hostel - Lisboa':fontsize={fs - 2}:"
        f"fontcolor=white@0.7:x=40:y=h-95:enable='between(t\\,6.4\\,{fade_out:.1f})',"
        f"fade=t=in:st=0:d=0.15,fade=t=out:st={fade_out:.1f}:d=0.5"
    )


def artist_teaser(a: dict, aspect: str, force: bool = False) -> Path:
    w, h = (1920, 1080) if aspect == "16x9" else (1080, 1920)
    work = WORK / "artists" / a["id"] / aspect
    work.mkdir(parents=True, exist_ok=True)
    safe_title = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in a["title"].replace(" ", "-"))
    final = OUT / "Artists" / aspect / f"{a['id']}_{safe_title}_teaser_{aspect}.mp4"

    if should_skip(final, MIN_ARTIST_DUR, force):
        log(f"skip artist {final.name} ({probe_dur(final):.0f}s)")
        return final

    src = artist_src(a, aspect)
    if not src.exists():
        log(f"MISSING src {src}")
        return final

    use916 = aspect == "9x16" and src == Path(a.get("pkg_916", ""))
    perf_mode = "wide" if use916 or aspect == "16x9" else "close"

    paint_src = PAINT2 if PAINT2.exists() else PAINT
    paint_ss = float(a.get("paint_ss", 6.0))
    peak = float(a["peak"])
    hits: list[float] = list(a.get("hits", [peak + 24, peak + 48, peak + 72]))

    clips: list[Path] = []
    # Phase 1 — flow hook (Chris paint, room tone)
    if paint_src.exists():
        clips.append(cut_clip(paint_src, work / "01_paint_hook.mp4", paint_ss, 2.8, w, h, mute=True, mode="paint"))
        clips.append(cut_clip(paint_src, work / "02_paint_detail.mp4", paint_ss + 4.0, 1.8, w, h, mute=True, mode="paint"))

    # Phase 2 — main song block (continuous performance audio)
    clips.append(cut_clip(src, work / "03_song_main.mp4", peak, 20.0, w, h, mode=perf_mode))

    # Phase 3 — Chris paint on the beat (visual bridge, keep performance audio feel)
    if paint_src.exists():
        clips.append(cut_clip(paint_src, work / "04_paint_beat.mp4", paint_ss + 12.0, 2.5, w, h, mute=True, mode="paint"))

    # Phase 4 — rhythm hits (short peak moments)
    for i, t in enumerate(hits[:4]):
        clips.append(cut_clip(src, work / f"05_hit_{i+1:02d}.mp4", t, 2.2, w, h, mode=perf_mode))

    # Phase 5 — crowd flash
    filler = a["filler"] if a["filler"].exists() else EMOTION
    clips.append(cut_clip(filler, work / "06_crowd.mp4", 1.2, 1.4, w, h, mute=True))

    # Phase 6 — closing peak
    clips.append(cut_clip(src, work / "07_close.mp4", hits[-1] + 8.0 if hits else peak + 30, 5.0, w, h, mode=perf_mode))

    raw = work / "raw.mp4"
    if raw.exists():
        raw.unlink()
    concat(clips, raw)
    body_dur = probe_dur(raw)

    mid = work / "mid.mp4"
    if mid.exists():
        mid.unlink()
    burn_overlay(raw, mid, artist_overlay(w, h, a["title"], a["ig"], body_dur))

    end = work / "end.mp4"
    if end.exists():
        end.unlink()
    end = endcard(
        end,
        w,
        h,
        [
            ("CIRCLE D STAGES", 42 if w > 1200 else 36, "#E8C547", FONT_BRAND),
            ("Wako Kungo - ONENESS", 32 if w > 1200 else 28, "white", FONT_CLEAN),
            ("Destination Hostel - Lisboa", 26 if w > 1200 else 22, "white@0.85", FONT_BODY),
            ("Full set on YouTube", 24 if w > 1200 else 20, "white@0.75", FONT_BODY),
        ],
        dur=3.0,
    )
    if final.exists():
        final.unlink()
    concat([mid, end], final)
    log(f"OK artist {final.name} ({probe_dur(final):.0f}s)")
    return final


def compilation_teaser(video: int, aspect: str, force: bool = False) -> Path:
    w, h = (1920, 1080) if aspect == "16x9" else (1080, 1920)
    arts = [a for a in ARTISTS if a["video"] == video]
    work = WORK / f"video{video}" / aspect
    work.mkdir(parents=True, exist_ok=True)
    name = f"0{video}_ONENESS_Video{video}_teaser_{aspect}.mp4"
    final = OUT / "YouTube" / aspect / name

    if should_skip(final, MIN_COMP_DUR, force):
        log(f"skip {final.name} ({probe_dur(final):.0f}s)")
        return final

    clips: list[Path] = []
    paint_src = PAINT2 if PAINT2.exists() else PAINT
    if paint_src.exists():
        clips.append(cut_clip(paint_src, work / "00_paint.mp4", 2.0, 3.0, w, h, mute=True, mode="paint"))
    clips.append(cut_clip(EMOTION if EMOTION.exists() else ENTRANCE, work / "01_emo.mp4", 0.5, 2.0, w, h, mute=True))

    for i, a in enumerate(arts):
        src = artist_src(a, aspect)
        if not src.exists():
            continue
        mode = "wide" if (aspect == "16x9" or src == Path(a.get("pkg_916", ""))) else "close"
        clips.append(cut_clip(src, work / f"a{i:02d}_main.mp4", a["peak"], 3.5, w, h, mode=mode))
        if paint_src.exists() and i % 2 == 1:
            clips.append(cut_clip(paint_src, work / f"p{i:02d}.mp4", 6.0 + i, 1.2, w, h, mute=True, mode="paint"))
        if a["filler"].exists():
            clips.append(cut_clip(a["filler"], work / f"f{i:02d}.mp4", 1.5, 0.9, w, h, mute=True))
        clips.append(cut_clip(src, work / f"a{i:02d}_hit.mp4", a["hits"][0], 1.8, w, h, mode=mode))

    if DANCE.exists():
        clips.append(cut_clip(DANCE, work / "90_dance.mp4", 0.5, 2.5, w, h))

    raw = work / "raw.mp4"
    if raw.exists():
        raw.unlink()
    concat(clips, raw)
    body_dur = probe_dur(raw)

    hook1 = esc("True connection is not forced...")
    hook2 = esc("it flows.")
    headline = (
        "Nicke - July - Isaac - Basseck" if video == 1
        else "Elisa - C-Riz - Arpanito - Willpower - Manu"
    )
    draw = (
        f"drawtext=fontfile='{FONT_BODY}':text='{hook1}':fontsize={30 if w > 1200 else 26}:"
        f"fontcolor=white:borderw=2:bordercolor=black@0.5:x=40:y=40:enable='between(t\\,0.2\\,3.5)',"
        f"drawtext=fontfile='{FONT_KEY}':text='{hook2}':fontsize={48 if w > 1200 else 42}:"
        f"fontcolor=#E8C547:x=40:y=90:enable='between(t\\,1.5\\,4.5)',"
        f"drawtext=fontfile='{FONT_KEY}':text='ONENESS':fontsize={56 if w > 1200 else 48}:"
        f"fontcolor=#E8C547:x=40:y=150:enable='between(t\\,4\\,8)',"
        f"drawtext=fontfile='{FONT_CLEAN}':text='{esc(headline)}':fontsize={24 if w > 1200 else 20}:"
        f"fontcolor=white@0.9:x=40:y=h-80:enable='between(t\\,5\\,{body_dur - 1:.0f})',"
        f"fade=t=in:st=0:d=0.2,fade=t=out:st={body_dur - 0.7:.1f}:d=0.6"
    )
    mid = work / "mid.mp4"
    if mid.exists():
        mid.unlink()
    burn_overlay(raw, mid, draw)

    end = endcard(
        work / "end.mp4",
        w,
        h,
        [
            ("WATCH THE FULL SET", 36 if w > 1200 else 30, "white", FONT_CLEAN),
            ("CIRCLE D STAGES", 44 if w > 1200 else 36, "#E8C547", FONT_BRAND),
            ("Destination Hostel - Lisboa", 24 if w > 1200 else 20, "white@0.85", FONT_BODY),
            (f"YouTube Compilation 0{video}", 22 if w > 1200 else 18, "white@0.7", FONT_BODY),
        ],
        dur=3.0,
    )
    if final.exists():
        final.unlink()
    concat([mid, end], final)
    log(f"OK compilation {final.name} ({probe_dur(final):.0f}s)")
    return final


def ig_stages_hero(force: bool = False) -> Path:
    w, h = 1080, 1920
    work = WORK / "ig_stages_hero"
    work.mkdir(parents=True, exist_ok=True)
    final = OUT / "Instagram" / "9x16" / "CircleD_Stages_ONENESS_IG_Teaser_9x16.mp4"

    if should_skip(final, MIN_IG_DUR, force):
        log(f"skip {final.name} ({probe_dur(final):.0f}s)")
        return final

    paint_src = PAINT2 if PAINT2.exists() else PAINT
    clips: list[Path] = []
    if paint_src.exists():
        clips.append(cut_clip(paint_src, work / "01_paint.mp4", 1.5, 3.5, w, h, mute=True, mode="paint"))
        clips.append(cut_clip(paint_src, work / "01b_paint.mp4", 8.0, 2.0, w, h, mute=True, mode="paint"))
    clips.append(cut_clip(EMOTION if EMOTION.exists() else ENTRANCE, work / "02_emo.mp4", 0.6, 2.2, w, h, mute=True))

    # Every artist: main peak + hit + paint/crowd bridges (~35-40s body)
    for i, a in enumerate(ARTISTS):
        src = artist_src(a, "9x16")
        if not src.exists():
            continue
        clips.append(cut_clip(src, work / f"a{i:02d}.mp4", a["peak"], 2.0, w, h, mode="wide"))
        clips.append(cut_clip(src, work / f"h{i:02d}.mp4", a["hits"][0], 1.2, w, h, mode="wide"))
        if i % 3 == 1 and paint_src.exists():
            clips.append(cut_clip(paint_src, work / f"p{i:02d}.mp4", 5.0 + i, 1.2, w, h, mute=True, mode="paint"))
        if i % 4 == 2 and CONNECT.exists():
            clips.append(cut_clip(CONNECT, work / f"c{i:02d}.mp4", 0.5, 1.0, w, h, mute=True))

    if DANCE.exists():
        clips.append(cut_clip(DANCE, work / "90_dance.mp4", 1.0, 2.5, w, h))

    raw = work / "raw.mp4"
    if raw.exists():
        raw.unlink()
    concat(clips, raw)
    body_dur = probe_dur(raw)

    hook1 = esc("True connection is not forced...")
    hook2 = esc("it flows.")
    draw = (
        f"drawtext=fontfile='{FONT_BODY}':text='{hook1}':fontsize=30:"
        f"fontcolor=white:borderw=2:bordercolor=black@0.55:x=40:y=120:enable='between(t\\,0.2\\,2.8)',"
        f"drawtext=fontfile='{FONT_KEY}':text='{hook2}':fontsize=52:fontcolor=#E8C547:"
        f"x=40:y=175:enable='between(t\\,1.2\\,3.5)',"
        f"drawtext=fontfile='{FONT_KEY}':text='FLOW STATE':fontsize=40:fontcolor=#E8C547:"
        f"x=40:y=240:enable='between(t\\,3.6\\,5.5)',"
        f"drawtext=fontfile='{FONT_KEY}':text='ONENESS':fontsize=56:fontcolor=#E8C547:"
        f"x=40:y=300:enable='between(t\\,5.6\\,8)',"
        f"drawtext=fontfile='{FONT_KEY}':text='INTRINSIC ENERGY':fontsize=36:fontcolor=#E8C547:"
        f"x=40:y=370:enable='between(t\\,8.5\\,11)',"
        f"drawtext=fontfile='{FONT_CLEAN}':text='Circle D Flow - C4C':fontsize=24:fontcolor=white@0.85:"
        f"x=40:y=56:enable='between(t\\,0.2\\,{body_dur - 1:.0f})',"
        f"fade=t=in:st=0:d=0.15,fade=t=out:st={body_dur - 0.6:.1f}:d=0.5"
    )
    mid = work / "mid.mp4"
    if mid.exists():
        mid.unlink()
    burn_overlay(raw, mid, draw)

    end = endcard(
        work / "end.mp4",
        w,
        h,
        [
            ("CIRCLE D STAGES", 40, "#E8C547", FONT_BRAND),
            ("Wako Kungo presents ONENESS", 26, "white@0.9", FONT_CLEAN),
            ("Destination Hostel - Lisboa", 24, "white@0.85", FONT_BODY),
            ("Full sets on YouTube", 22, "white@0.7", FONT_BODY),
        ],
        dur=3.0,
    )
    if final.exists():
        final.unlink()
    concat([mid, end], final)

    drive = ROOT / "003" / "06_drive_ready" / "Circle_D_Stages" / "Social_Teasers"
    drive.mkdir(parents=True, exist_ok=True)
    shutil.copy2(final, drive / final.name)
    log(f"OK IG hero {final.name} ({probe_dur(final):.0f}s)")
    return final


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    args = sys.argv[1:]
    force = "--force" in args
    only = {a for a in args if a != "--force"}

    artist_ids = {a["id"] for a in ARTISTS}
    want_artists = (not only) or ("artists" in only) or ("all" in only) or bool(only & artist_ids)
    want_comp = (not only) or ("comp" in only) or ("all" in only)
    want_ig = (not only) or ("ig" in only) or ("all" in only)

    log("=== ONENESS teasers v2 start ===")
    if not RAYAN.exists():
        log(f"FATAL missing Rayan folder: {RAYAN}")
        return 1

    if want_comp:
        for v in (1, 2):
            for aspect in ("16x9", "9x16"):
                try:
                    compilation_teaser(v, aspect, force=force)
                except Exception as e:
                    log(f"FAIL video{v} {aspect}: {e}")

    if want_artists:
        for a in ARTISTS:
            if only and a["id"] not in only and "artists" not in only and "all" not in only:
                continue
            for aspect in ("16x9", "9x16"):
                try:
                    log(f"-- artist {a['id']} {aspect}")
                    artist_teaser(a, aspect, force=force)
                except Exception as e:
                    log(f"FAIL artist {a['id']} {aspect}: {e}")

    if want_ig:
        try:
            log("-- ig hero")
            ig_stages_hero(force=force)
        except Exception as e:
            log(f"FAIL ig hero: {e}")

    log("=== ONENESS teasers v2 done ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
