#!/usr/bin/env python3
"""Circle D Stages YouTube compilations — Destiny Hostel ONENESS.

Video 1: Nicke -> July -> Isaac group -> Basseck
Video 2: Elisa Free as A Bird -> Elisa B -> C-Riz(002) -> Arpanito -> Willpower -> Manu

- Show intro (black): Welcome / Wako Kungo - Oneness / Upcoming artists
- Per-artist intro: black slate + package audio
- Keep native package timing/speed (~59.94fps)
- Transitions: Chris live paint (muted) + next artist name/IG
- End: Dancing Filler (muted) + credits
- Work + finals on D: (FAT32 → each file <4GB)
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
RAYAN = ROOT / "Oneness captured Rayan"
OUT_YT = ROOT / "YouTube_Master_Renders"
LOGS = ROOT / "003" / "00_logs"
WORK = ROOT / "00_work" / "yt_compilations"
OUT_NTFS = OUT_YT
FAT32_SAFE = 3.9 * 1024 ** 3
# Match Stages packages (Nikon / pipeline): 59.94 fps CFR realtime
FPS = "60000/1001"
FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
INTRO = 7.0
TRANS = 9.0
VCODEC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", FPS, "-vsync", "cfr", "-pix_fmt", "yuv420p"]
ACODEC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]

A002 = ROOT / "002" / "06_drive_ready" / "Circle_D_Stages" / "Artists"
A003 = ROOT / "003" / "06_drive_ready" / "Circle_D_Stages" / "Artists"


def log(msg: str) -> None:
    print(msg, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "youtube_compilations.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def run(cmd: list[str], logf: Path | None = None) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if logf is not None:
        logf.write_text((r.stderr or "")[-8000:], encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1500:])


def probe_dur(p: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True,
        text=True,
    )
    return float(r.stdout.strip() or 0)


def esc(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\\'")
        .replace("%", "%%")
        .replace("·", "-")
    )


VIDEO1 = [
    {
        "id": "nicke",
        "title": "Nicke Klein",
        "ig": "@nickeklein",
        "pkg": A003 / "Nicke_Klein" / "01_Nicke-Klein_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Nicke.MP4",
        "pip": RAYAN / "Nicke Part2.MP4",
    },
    {
        "id": "july",
        "title": "July Tilie",
        "ig": "@julytilie",
        "pkg": A003 / "July_Tilie" / "01_July-Tilie_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Emotional Filler.MP4",
        "pip": RAYAN / "Entrance.MP4",
    },
    {
        "id": "isaac_group",
        "title": "Mr Isaac & Joao & Edo & C-Riz",
        "ig": "ONENESS Live",
        "pkg": A003 / "Mr_Isaac_Joao_Edo_C-Riz" / "01_Mr-Isaac-Joao-Edo-C-Riz_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Mr.Isaac Ending song.MP4",
        "pip": RAYAN / "Nicke-Edoardo-Joao.MP4",
    },
    {
        "id": "basseck",
        "title": "Basseck & Edoardo & Joao",
        "ig": "@basseck.mankabu",
        "pkg": A003 / "Finale_Baseck" / "01_Finale-Baseck_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Barseck.MP4",
        "pip": RAYAN / "Barseck.MP4",
    },
]

VIDEO2 = [
    {
        "id": "elisa_fab",
        "title": "Elisa",
        "ig": "Free as A Bird - Live",
        "pkg": A002 / "Elisa" / "01_Elisa_Free-as-A-Bird_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Elisa.MP4",
        "pip": RAYAN / "Elisa onStage.MP4",
    },
    {
        "id": "elisa_b",
        "title": "Elisa",
        "ig": "@elisa.cas8 - Live",
        "pkg": A002 / "Elisa" / "01_Elisa_B_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "part intro Elisa.MP4",
        "pip": RAYAN / "Rolling-Elisa and Mr Isaac.MP4",
    },
    {
        "id": "criz",
        "title": "C-Riz",
        "ig": "@c_riz.official",
        "pkg": A002 / "C-Riz" / "01_CRiz_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "C-Riz-Part2.MP4",
        "pip": RAYAN / "C-Riz-Part2.MP4",
    },
    {
        "id": "arpanito",
        "title": "Arpanito",
        "ig": "@arpan.k_",
        "pkg": A002 / "Arpanito" / "01_Arpanito_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Emotional Filler.MP4",
        "pip": RAYAN / "Entrance.MP4",
    },
    {
        "id": "willpower",
        "title": "Willpower",
        "ig": "@bodyxwillpower",
        "pkg": A002 / "Willpower" / "01_Willpower_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Entrance.MP4",
        "pip": RAYAN / "Connecting C4C.MP4",
    },
    {
        "id": "manu",
        "title": "Manu Allegro",
        "ig": "@manuallegro",
        "pkg": A003 / "Manu_Allegro" / "01_Manu-Allegro_ONENESS_Stages_16x9.mp4",
        "filler": RAYAN / "Manu.MP4",
        "pip": RAYAN / "Manu.MP4",
    },
]

CHRIS = [
    RAYAN / "Chris Inacao LivePaint.MP4",
    RAYAN / "live PaintChris Iniciao.MP4",
    RAYAN / "Chris Inacao.MP4",
]
DANCING = RAYAN / "Dancing Filler.MP4"

OUT_NAME_V1 = "01_ONENESS_Stages_Video1_Nicke_July_IsaacGroup_Basseck_16x9.mp4"
OUT_NAME_V2 = "02_ONENESS_Stages_Video2_Elisa_CRiz_Arpanito_Willpower_Manu_16x9.mp4"


def lineup_labels(artists: list[dict]) -> list[str]:
    """Unique upcoming-artist lines for the show intro."""
    labels: list[str] = []
    for a in artists:
        if a["id"] == "elisa_fab":
            lab = "Elisa - Free as A Bird"
        elif a["id"] == "elisa_b":
            lab = "Elisa"
        else:
            lab = a["title"]
        if lab not in labels:
            labels.append(lab)
    return labels


def _slate(out: Path, lines: list[tuple[str, int, str]], duration: float, work: Path) -> None:
    """Black slate with centered drawtext lines: (text, fontsize, color)."""
    parts = []
    n = len(lines)
    for i, (text, size, color) in enumerate(lines):
        # Vertical stack centered around mid-frame
        y_expr = f"h*0.42+(text_h+18)*{i - (n - 1) / 2:.2f}"
        parts.append(
            f"drawtext=fontfile='{FONT_B if i == 0 else FONT_R}':text='{esc(text)}':"
            f"fontsize={size}:fontcolor={color}:x=(w-text_w)/2:y={y_expr}"
        )
    vf = ",".join(parts) + f",format=yuv420p,fps={FPS}"
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:r={FPS}:d={duration}",
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
            "-vf", vf,
            "-map", "0:v:0", "-map", "1:a:0",
            "-t", str(duration),
            *VCODEC, "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
            "-shortest",
            str(out),
        ],
        work / (out.stem + "_err.txt"),
    )


def make_show_intro(out: Path, artists: list[dict], work: Path) -> None:
    """Welcome + Oneness + Upcoming artists (black), then program starts."""
    work.mkdir(parents=True, exist_ok=True)
    p1 = work / "show_01_welcome.mp4"
    p2 = work / "show_02_oneness.mp4"
    p3 = work / "show_03_upcoming.mp4"
    _slate(
        p1,
        [
            ("Welcome to", 36, "white@0.9"),
            ("Circle D Stages", 56, "#E8C547"),
        ],
        4.0,
        work,
    )
    _slate(
        p2,
        [
            ("Wako Kungo", 52, "#E8C547"),
            ("Oneness", 48, "white"),
            ("Sunset Destination Hostel - Cais do Sodre", 26, "white@0.85"),
        ],
        4.5,
        work,
    )
    lineup = lineup_labels(artists)
    # Header + each artist on its own line
    lines: list[tuple[str, int, str]] = [("Upcoming artists", 40, "#E8C547")]
    for name in lineup:
        lines.append((name, 32, "white"))
    # ~1.2s per artist + header padding
    dur = max(8.0, 3.0 + 1.3 * len(lineup))
    _slate(p3, lines, dur, work)
    lst = work / "show_list.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in (p1, p2, p3)), encoding="ascii")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy",
            str(out),
        ],
        work / "show_concat_err.txt",
    )
    log(f"show intro {out.name} ({probe_dur(out):.1f}s) lineup={', '.join(lineup)}")


def make_intro(out: Path, artist: dict, work: Path) -> None:
    """Black slate intro + package audio (realtime, 59.94fps)."""
    pkg = artist["pkg"]
    title = esc(artist["title"])
    ig = esc(artist["ig"])
    vf = (
        f"drawtext=fontfile='{FONT_B}':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:"
        f"x=(w-text_w)/2:y=h*0.20,"
        f"drawtext=fontfile='{FONT_B}':text='Wako Kungo  ONENESS':fontsize=50:fontcolor=#E8C547:"
        f"x=(w-text_w)/2:y=h*0.32,"
        f"drawtext=fontfile='{FONT_R}':text='Sunset Destination Hostel - Cais do Sodre':fontsize=26:fontcolor=white@0.88:"
        f"x=(w-text_w)/2:y=h*0.46,"
        f"drawtext=fontfile='{FONT_B}':text='{title}':fontsize=48:fontcolor=white:"
        f"x=(w-text_w)/2:y=h*0.64,"
        f"drawtext=fontfile='{FONT_R}':text='{ig}':fontsize=28:fontcolor=white@0.92:"
        f"x=(w-text_w)/2:y=h*0.78,"
        f"format=yuv420p,fps={FPS}"
    )
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:r={FPS}:d={INTRO}",
            "-ss", "0", "-t", str(INTRO), "-i", str(pkg),
            "-vf", vf,
            "-map", "0:v:0", "-map", "1:a:0",
            "-t", str(INTRO),
            *VCODEC, *ACODEC,
            str(out),
        ],
        work / "intro_err.txt",
    )


def make_body(out: Path, artist: dict, work: Path) -> None:
    """Keep package A/V timing exactly (stream copy) — normal realtime speed."""
    pkg = artist["pkg"]
    dur = probe_dur(pkg)
    body_dur = max(1.0, dur - INTRO)
    # Accurate cut (decode) then remux same fps timeline — avoids 24/25fps drift
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", str(INTRO), "-i", str(pkg),
            "-t", str(body_dur),
            "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fps={FPS}",
            "-af", "aresample=48000",
            *VCODEC, *ACODEC,
            str(out),
        ],
        work / "body_err.txt",
    )


def make_transition(out: Path, nxt: dict, chris: Path, work: Path) -> None:
    title = esc(nxt["title"])
    ig = esc(nxt["ig"])
    src = chris if chris.exists() else RAYAN / "Emotional Filler.MP4"
    vf = (
        f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        f"eq=brightness=-0.08,fps={FPS},"
        f"drawtext=fontfile='{FONT_B}':text='Coming up':fontsize=28:fontcolor=white@0.75:x=64:y=72,"
        f"drawtext=fontfile='{FONT_B}':text='{title}':fontsize=46:fontcolor=white:x=64:y=h-180,"
        f"drawtext=fontfile='{FONT_R}':text='{ig}':fontsize=28:fontcolor=#E8C547:x=64:y=h-112,"
        f"drawtext=fontfile='{FONT_R}':text='Chris Inacio - Live Painting':fontsize=22:fontcolor=white@0.8:x=64:y=120,"
        f"format=yuv420p"
    )
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-stream_loop", "-1", "-i", str(src),
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
            "-vf", vf,
            "-map", "0:v:0", "-map", "1:a:0",
            "-t", str(TRANS),
            *VCODEC, "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
            "-shortest",
            str(out),
        ],
        work / "trans_err.txt",
    )


def make_dancing(out: Path, work: Path) -> None:
    d = min(8.0, max(4.0, probe_dur(DANCING) if DANCING.exists() else 8.0))
    src = DANCING if DANCING.exists() else RAYAN / "Emotional Filler.MP4"
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-stream_loop", "-1", "-i", str(src),
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
            "-vf", (
                f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps={FPS},format=yuv420p,"
                f"drawtext=fontfile='{FONT_B}':text='ONENESS':fontsize=64:fontcolor=#E8C547:x=(w-text_w)/2:y=(h-text_h)/2-20,"
                f"drawtext=fontfile='{FONT_R}':text='Circle D Stages':fontsize=32:fontcolor=white@0.9:x=(w-text_w)/2:y=(h-text_h)/2+50"
            ),
            "-map", "0:v:0", "-map", "1:a:0",
            "-t", str(d),
            *VCODEC, "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
            "-shortest",
            str(out),
        ],
        work / "dance_err.txt",
    )


def make_credits(out: Path, artists: list[dict], work: Path, label: str) -> None:
    names = "  |  ".join(a["title"] for a in artists)
    cards = [
        ("CIRCLE D STAGES", "presents ONENESS"),
        ("FEATURING", names[:90]),
        ("VENUE", "Sunset Destination Hostel"),
        ("CAMERA", "Hope  Rayan  Allan"),
        ("LIVE PAINTING", "Chris Inacio"),
        ("THANK YOU", "Artists  Crew  Community"),
        ("PRODUCTION", "Circle D Flow  @circle.d.flow"),
    ]
    parts = []
    for i, (a, b) in enumerate(cards):
        p = work / f"cred_{i:02d}.mp4"
        aa, bb = esc(a), esc(b)
        vf = (
            f"drawtext=fontfile='{FONT_B}':text='{aa}':fontsize=42:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.38,"
            f"drawtext=fontfile='{FONT_R}':text='{bb}':fontsize=28:fontcolor=white:x=(w-text_w)/2:y=h*0.52,"
            f"format=yuv420p,fps={FPS}"
        )
        run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", f"color=c=0x0A0A0F:s=1920x1080:r={FPS}:d=5",
                "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
                "-vf", vf, "-t", "5",
                *VCODEC, "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "128k",
                "-shortest",
                str(p),
            ]
        )
        parts.append(p)
    lst = work / "cred_list.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="ascii")
    run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)]
    )


def deliver_master(src: Path, out_name: str) -> Path:
    """Move/encode final onto D: under FAT32 4GB, keep 59.94fps realtime."""
    OUT_YT.mkdir(parents=True, exist_ok=True)
    d_out = OUT_YT / out_name
    size = src.stat().st_size
    if size <= FAT32_SAFE and src.resolve() != d_out.resolve():
        if d_out.exists():
            d_out.unlink()
        shutil.move(str(src), str(d_out))
        log(f"delivered to D: {d_out} ({size/1e6:.0f}MB)")
        return d_out
    if size <= FAT32_SAFE:
        return d_out
    log(f"source {size/1e9:.2f}GB > FAT32 — bitrate-cap 4M @ {FPS} to D: {d_out}")
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src),
            "-vf", f"fps={FPS}",
            "-c:v", "libx264", "-preset", "veryfast",
            "-b:v", "4M", "-maxrate", "4.5M", "-bufsize", "9M",
            "-r", FPS, "-vsync", "cfr", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-movflags", "+faststart",
            str(d_out),
        ],
        src.parent / "deliver_err.txt",
    )
    if src.exists() and src.resolve() != d_out.resolve():
        src.unlink(missing_ok=True)
    log(f"delivered D: {d_out} ({d_out.stat().st_size/1e6:.0f}MB)")
    return d_out


def concat_segments(segments: list[Path], out: Path, work: Path) -> None:
    lst = work / "concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in segments), encoding="ascii")
    # Unified 59.94fps CFR + bitrate cap for FAT32
    run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-vf", f"fps={FPS}",
            "-c:v", "libx264", "-preset", "veryfast",
            "-b:v", "4M", "-maxrate", "4.5M", "-bufsize", "9M",
            "-r", FPS, "-vsync", "cfr", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            "-movflags", "+faststart",
            str(out),
        ],
        work / "final_err.txt",
    )


def collect_segments(work: Path, artists: list[dict]) -> list[Path]:
    # Migrate mistaken Baseck folder spelling -> Basseck
    old = work / "baseck"
    new = work / "basseck"
    if old.exists() and not new.exists():
        old.rename(new)
    segments: list[Path] = []
    show = work / "00_show_intro.mp4"
    segments.append(show)
    for i, a in enumerate(artists):
        aw = work / a["id"]
        segments.append(aw / "01_intro.mp4")
        segments.append(aw / "02_body.mp4")
        if i < len(artists) - 1:
            segments.append(aw / "03_trans.mp4")
    segments.append(work / "90_dance.mp4")
    segments.append(work / "99_credits.mp4")
    missing = [p for p in segments if not p.exists()]
    if missing:
        raise FileNotFoundError("Missing segments:\n" + "\n".join(str(m) for m in missing))
    return segments


def finalize_video(label: str, artists: list[dict], out_name: str) -> Path:
    work = WORK / label
    segments = collect_segments(work, artists)
    tmp = work / ("_final_" + out_name)
    log(f"final concat -> deliver ({label})")
    concat_segments(segments, tmp, work)
    out = deliver_master(tmp, out_name)
    # Remove mistaken Baseck-named deliverable if present
    legacy = OUT_YT / out_name.replace("Basseck", "Baseck")
    if legacy.exists() and legacy.resolve() != out.resolve():
        legacy.unlink(missing_ok=True)
    log(f"DONE {label} dur={probe_dur(out):.1f}s size={out.stat().st_size/1e6:.0f}MB path={out}")
    return out


def ensure_show_and_finalize(label: str, artists: list[dict], out_name: str) -> Path:
    """Add/replace show intro on existing segments, refresh credits name, re-mux final."""
    work = WORK / label
    work.mkdir(parents=True, exist_ok=True)
    old = work / "baseck"
    new = work / "basseck"
    if old.exists() and not new.exists():
        old.rename(new)
    log(f"=== SHOW INTRO + FINALIZE {label} ===")
    show = work / "00_show_intro.mp4"
    make_show_intro(show, artists, work)
    # Refresh credits so Basseck spelling is correct
    log("credits (refresh)")
    make_credits(work / "99_credits.mp4", artists, work, label)
    # Also refresh per-artist intro card for Basseck if present
    for a in artists:
        if a["id"] == "basseck":
            aw = work / a["id"]
            intro = aw / "01_intro.mp4"
            if aw.exists():
                log(f"refresh artist intro: {a['title']}")
                make_intro(intro, a, aw)
            # refresh transition TO basseck from previous artist
            break
    # Refresh transition card that names Basseck (isaac_group/03_trans)
    if label == "video1" and len(artists) >= 4:
        prev = work / artists[-2]["id"]
        tr = prev / "03_trans.mp4"
        if prev.exists():
            log(f"refresh transition -> {artists[-1]['title']}")
            make_transition(tr, artists[-1], CHRIS[(len(artists) - 2) % len(CHRIS)], prev)
    return finalize_video(label, artists, out_name)


def build_video(label: str, artists: list[dict], out_name: str, *, resume: bool = False) -> Path:
    work = WORK / label
    if work.exists() and not resume:
        shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True, exist_ok=True)
    OUT_YT.mkdir(parents=True, exist_ok=True)
    OUT_NTFS.mkdir(parents=True, exist_ok=True)
    log(f"=== BUILD {label} resume={resume} ===")

    for a in artists:
        if not a["pkg"].exists():
            raise FileNotFoundError(a["pkg"])

    show = work / "00_show_intro.mp4"
    if not (resume and show.exists() and show.stat().st_size > 50_000):
        log("show intro (Welcome / Oneness / Upcoming artists)")
        make_show_intro(show, artists, work)
    else:
        log("show intro SKIP")

    for i, a in enumerate(artists):
        aw = work / a["id"]
        aw.mkdir(parents=True, exist_ok=True)
        intro = aw / "01_intro.mp4"
        body = aw / "02_body.mp4"
        if not (resume and intro.exists() and intro.stat().st_size > 100_000):
            log(f"[{i+1}/{len(artists)}] {a['title']} intro")
            make_intro(intro, a, aw)
        else:
            log(f"[{i+1}/{len(artists)}] {a['title']} intro SKIP")

        if not (resume and body.exists() and body.stat().st_size > 1_000_000):
            log(f"[{i+1}/{len(artists)}] {a['title']} body")
            make_body(body, a, aw)
        else:
            log(f"[{i+1}/{len(artists)}] {a['title']} body SKIP")

        if i < len(artists) - 1:
            nxt = artists[i + 1]
            chris = CHRIS[i % len(CHRIS)]
            tr = aw / "03_trans.mp4"
            if not (resume and tr.exists() and tr.stat().st_size > 100_000):
                log(f"transition -> {nxt['title']}")
                make_transition(tr, nxt, chris, aw)
            else:
                log(f"transition -> {nxt['title']} SKIP")

    dance = work / "90_dance.mp4"
    if not (resume and dance.exists() and dance.stat().st_size > 100_000):
        log("dancing filler")
        make_dancing(dance, work)
    else:
        log("dancing filler SKIP")

    cred = work / "99_credits.mp4"
    if not (resume and cred.exists() and cred.stat().st_size > 100_000):
        log("credits")
        make_credits(cred, artists, work, label)
    else:
        log("credits SKIP")

    return finalize_video(label, artists, out_name)


def main() -> int:
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    resume = "resume" in sys.argv[1:]
    try:
        if which in ("1", "both", "video1", "resume1"):
            build_video("video1", VIDEO1, OUT_NAME_V1, resume=resume or which == "resume1")
        if which in ("2", "both", "video2", "resume2"):
            build_video("video2", VIDEO2, OUT_NAME_V2, resume=resume or which == "resume2")
        if which == "finalize1":
            finalize_video("video1", VIDEO1, OUT_NAME_V1)
        if which == "finalize2":
            finalize_video("video2", VIDEO2, OUT_NAME_V2)
        if which in ("showintro", "showintro1", "showintro2", "showintro_both"):
            if which in ("showintro", "showintro1", "showintro_both"):
                ensure_show_and_finalize("video1", VIDEO1, OUT_NAME_V1)
            if which in ("showintro", "showintro2", "showintro_both"):
                ensure_show_and_finalize("video2", VIDEO2, OUT_NAME_V2)
    except Exception as e:
        log(f"ERROR {e}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
