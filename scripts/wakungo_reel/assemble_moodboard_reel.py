#!/usr/bin/env python3
"""Instagram 30s reel v4 — movement / connection over manifesto.

- Open on human (face/hand/movement), never black or empty architecture
- Few BIG TEXT punches; footage proves the idea
- Emotional centre: THIS IS A SUPPORTIVE SPACE → WE GROW WHEN WE MOVE TOGETHER
- Rhythm: GRAB → FLOW → BREATHE → BUILD → RELEASE
- CapCut outro stripped; light grade arc; keep human imperfections
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import OUT, PROJECT_PATH, REEL_HERO_ASSETS  # noqa: E402

STUDIO = Path(r"D:\Wakungo_Content_Studio")
LAPA = STUDIO / "Lapa71"
ARTISTS = LAPA / "04_Artists"
MOODBOARD = REEL_HERO_ASSETS[0]
WORK = OUT / "preview_work_moodboard_v4"
FINAL = OUT / "WK_LAPA71_MOODBOARD_REEL_30s_9x16.mp4"
FINAL_ALIAS = OUT / "WK_MOVE_ART_GALLERY_30s_9x16.mp4"

W, H = 1080, 1920
TARGET = 30.0
MOODBOARD_SAFE_END = 27.40
CAPCUT_DELOGO = "delogo=x=8:y=8:w=170:h=55:show=0"

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

# Subtitles = spoken only (accessibility). Keep sparse.
VO_CUES = [
    (0.15, 2.50, "Maybe culture isn't meant to be watched."),
    (2.60, 5.10, "Maybe it's meant to be experienced."),
    (5.20, 8.00, "To share. To listen. To connect."),
    (8.10, 12.20, "To learn from each other. And teach each other."),
    (12.40, 14.90, "This is a supportive space."),
    (15.10, 17.80, "We grow when we move together."),
    (18.00, 22.20, "We create space to express, explore and become."),
    (22.40, 25.20, "Come as you are. Bring what you have."),
    (25.40, 27.60, "Create what's next."),
]

# Only emotional punches — not a value checklist
BIG_TEXT = [
    (3.20, 5.00, "EXPERIENCED."),
    (12.50, 15.20, "THIS IS A SUPPORTIVE SPACE"),
    (15.40, 18.00, "WE GROW WHEN WE MOVE TOGETHER."),
    (18.40, 21.80, "WE CREATE SPACE TO EXPRESS."),
    (22.60, 24.60, "COME AS YOU ARE."),
    (24.80, 26.80, "BRING WHAT YOU HAVE."),
    (27.00, 28.90, "WHAT WILL YOU BRING TO THE CIRCLE?"),
    (29.00, 29.95, "WAKO KUNGO × CIRCLE.D.FLOW"),
]

CROPS = {
    "wide": f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}",
    "close": (
        f"scale={int(W*1.42)}:{int(H*1.42)}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H}"
    ),
    "tight": (
        f"scale={int(W*1.65)}:{int(H*1.65)}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H}"
    ),
    "left": (
        f"scale={int(W*1.42)}:{int(H*1.42)}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H}:0:(ih-{H})/2"
    ),
    "right": (
        f"scale={int(W*1.42)}:{int(H*1.42)}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H}:(iw-{W}):(ih-{H})/2"
    ),
    "hands": (
        f"scale={int(W*1.58)}:{int(H*1.58)}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.58"
    ),
    "eyes": (
        f"scale={int(W*1.78)}:{int(H*1.78)}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.18"
    ),
    "feet_move": (
        f"scale={int(W*1.5)}:{int(H*1.5)}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.72"
    ),
}

# Subtle arc — not one Instagram filter on everything
GRADES = {
    "hook": "eq=contrast=1.12:brightness=-0.01:saturation=0.95:gamma=1.02",
    "exp": "eq=contrast=1.08:brightness=0.01:saturation=0.97:gamma=1.03",
    "conn": "eq=contrast=1.05:brightness=0.02:saturation=0.98:gamma=1.04",
    "learn": "eq=contrast=1.04:brightness=0.015:saturation=0.96:gamma=1.04",
    "thesis": "eq=contrast=1.06:brightness=0.01:saturation=1.00:gamma=1.03",
    "move": "eq=contrast=1.09:brightness=0.015:saturation=1.06:gamma=1.02",
    "breath": "eq=contrast=1.03:brightness=0.005:saturation=0.90:gamma=1.05",
    "invite": "eq=contrast=1.08:brightness=0.01:saturation=1.05:gamma=1.02",
}


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1400:])


def probe_dur(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out or 0)


def stages(slug: str) -> list[Path]:
    d = ARTISTS / slug / "Stages"
    return sorted(d.glob("*.mp4")) if d.exists() else []


def best_clip(
    slug: str,
    min_d: float = 10.0,
    prefer: str = "",
    avoid: str = r"filler|sneaker|shoe|conversatione|miccheck|break",
) -> Path | None:
    scored = []
    av = re.compile(avoid, re.I) if avoid else None
    for p in stages(slug):
        name = p.name.lower()
        if av and av.search(name):
            continue
        if p.stat().st_size < 80_000:
            continue
        try:
            d = probe_dur(p)
        except Exception:
            continue
        if d < min_d:
            continue
        score = d
        if prefer and prefer.lower() in name:
            score += 80
        if 12 <= d <= 100:
            score += 25
        scored.append((score, p))
    scored.sort(key=lambda x: -x[0])
    return scored[0][1] if scored else None


def photo_faces(n: int = 4) -> list[Path]:
    ports: list[Path] = []
    for a in ("Elisa", "Ana", "Maryna_Vadini", "Arpanito", "Manu", "Event_Broll"):
        d = ARTISTS / a / "Portraits"
        if d.exists():
            ports.extend(d.glob("*.jpg"))
    uniq = {p.resolve(): p for p in ports}
    return sorted(uniq.values(), key=lambda p: -p.stat().st_size)[:n]


def render_clip(
    src: Path,
    out: Path,
    ss: float,
    take: float,
    *,
    crop: str,
    grade: str,
    hard: bool = False,
) -> Path | None:
    if not src.exists():
        return None
    dur = probe_dur(src)
    is_mb = src.resolve() == MOODBOARD.resolve()
    if is_mb:
        dur = min(dur, MOODBOARD_SAFE_END)
    if dur < 0.55 or take < 0.22:
        return None
    ss = max(0.0, min(ss, max(0.0, dur - take - 0.05)))
    if ss + take > dur:
        take = max(0.22, dur - ss)

    parts = []
    if is_mb:
        parts.append(CAPCUT_DELOGO)
    parts.append(CROPS.get(crop, CROPS["close"]))
    parts.append(GRADES.get(grade, GRADES["exp"]))
    # Light denoise only — keep grain / handheld soul
    parts.append("hqdn3d=0.8:0.6:1.4:1.1,fps=30,format=yuv420p")
    if not hard:
        fo = max(0.0, take - 0.08)
        parts.append(f"fade=t=in:st=0:d=0.04,fade=t=out:st={fo:.2f}:d=0.06")
    vf = ",".join(parts)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{ss:.3f}", "-i", str(src), "-t", f"{take:.3f}",
        "-vf", vf, "-an",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        str(out),
    ])
    return out if out.exists() and out.stat().st_size > 12_000 else None


def render_photo(src: Path, out: Path, take: float, *, crop: str, grade: str) -> Path | None:
    if not src.exists():
        return None
    vf = (
        f"{CROPS.get(crop, CROPS['tight'])},{GRADES.get(grade, GRADES['conn'])},"
        f"fps=30,format=yuv420p"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(src), "-t", f"{take:.2f}",
        "-vf", vf, "-an",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        str(out),
    ])
    return out if out.exists() and out.stat().st_size > 8_000 else None


def concat_hard(parts: list[Path], out: Path) -> Path:
    lst = out.with_suffix(".txt")
    lines = [
        f"file '{str(p.resolve()).replace(chr(92), '/').replace(chr(39), r"'\\''")}'"
        for p in parts
    ]
    lst.write_text("\n".join(lines) + "\n", encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
        "-an", str(out),
    ])
    return out


def xfade_chain(parts: list[Path], out: Path, fade: float = 0.18) -> Path:
    if len(parts) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(parts[0]), "-c", "copy", str(out)])
        return out
    durs = [probe_dur(p) for p in parts]
    inputs: list[str] = []
    for p in parts:
        inputs += ["-i", str(p)]
    filters = []
    vlabel = "0:v"
    acc = durs[0]
    for i in range(1, len(parts)):
        offset = max(0.05, acc - fade)
        out_l = f"vx{i}"
        # softdissolve keeps energy better than long fade for IG
        filters.append(
            f"[{vlabel}][{i}:v]xfade=transition=fade:duration={fade:.2f}:offset={offset:.3f}[{out_l}]"
        )
        vlabel = out_l
        acc = offset + durs[i]
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        *inputs,
        "-filter_complex", ";".join(filters),
        "-map", f"[{vlabel}]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
        "-an", str(out),
    ])
    return out


def make_vo(out_wav: Path) -> Path:
    mp3 = WORK / "vo_edge.mp3"
    r = subprocess.run(
        [
            "edge-tts",
            "--voice", "en-US-GuyNeural",
            "--rate=+6%",
            "--pitch=-10Hz",
            f"--text={VO_SCRIPT}",
            f"--write-media={mp3}",
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0 or not mp3.exists():
        raise RuntimeError(f"edge-tts failed: {(r.stderr or r.stdout)[-600:]}")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(mp3),
        "-af", (
            "loudnorm=I=-16:TP=-1.5:LRA=11,"
            "afade=t=in:st=0:d=0.08,afade=t=out:st=28.7:d=1.1,"
            "alimiter=limit=0.95,apad=whole_dur=30"
        ),
        "-t", f"{TARGET:.2f}", "-ar", "48000", "-ac", "1",
        str(out_wav),
    ])
    return out_wav


def extract_nat_sfx(clips: list[Path], out: Path) -> Path | None:
    usable = [c for c in clips if c and c.exists()][:5]
    if not usable:
        return None
    parts = []
    for i, src in enumerate(usable):
        wav = WORK / f"sfx_{i}.wav"
        ss = min(10.0, max(0.8, probe_dur(src) * 0.3))
        try:
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", f"{ss:.2f}", "-t", "3.8", "-i", str(src),
                "-vn",
                "-af", "highpass=f=70,volume=0.42,afade=t=in:st=0:d=0.15,afade=t=out:st=3.3:d=0.4",
                "-ar", "48000", "-ac", "1", str(wav),
            ])
            if wav.exists():
                parts.append(wav)
        except Exception:
            continue
    if not parts:
        return None
    lst = WORK / "sfx.txt"
    lst.write_text(
        "\n".join(f"file '{str(p.resolve()).replace(chr(92), '/')}'" for p in parts) + "\n",
        encoding="utf-8",
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-af", "apad=whole_dur=30,volume=0.62,alimiter=limit=0.82",
        "-t", f"{TARGET:.2f}", "-ar", "48000", "-ac", "1",
        str(out),
    ])
    return out if out.exists() else None


def mix_audio(vo: Path, sfx: Path | None, out: Path) -> Path:
    if sfx and sfx.exists():
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(vo), "-i", str(sfx),
            "-filter_complex",
            "[0:a]volume=1.0[v];[1:a]volume=0.32[s];"
            "[v][s]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[a]",
            "-map", "[a]", "-t", f"{TARGET:.2f}",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(out),
        ])
    else:
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(vo), "-t", f"{TARGET:.2f}",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(out),
        ])
    return out


def build_ass(path: Path) -> Path:
    def tfmt(t: float) -> str:
        t = max(0.0, min(t, 30.0))
        h = int(t // 3600)
        m = int((t % 3600) // 60)
        s = t % 60
        return f"{h}:{m:02d}:{s:05.2f}"

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Arial,34,&H00E8E8E8,&H000000FF,&H64000000,&H46000000,-1,0,0,0,100,100,0,0,1,1.4,0,2,55,55,110,1
Style: Big,Arial,64,&H00FFFFFF,&H000000FF,&H80000000,&H5A000000,-1,0,0,0,100,100,1.5,0,1,2.8,0,5,60,60,0,1
Style: Brand,Arial,36,&H00FFFFFF,&H000000FF,&H80000000,&H50000000,-1,0,0,0,100,100,1,0,1,2,0,2,70,70,220,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    for start, end, text in VO_CUES:
        lines.append(
            f"Dialogue: 0,{tfmt(start)},{tfmt(end)},Sub,,0,0,0,,{text.replace(chr(10), r'\\N')}\n"
        )
    for start, end, text in BIG_TEXT:
        style = "Brand" if "WAKO" in text else "Big"
        lines.append(
            f"Dialogue: 1,{tfmt(start)},{tfmt(end)},{style},,0,0,0,,{text.replace(chr(10), r'\\N')}\n"
        )
    path.write_text("".join(lines), encoding="utf-8-sig")
    return path


def main() -> int:
    if WORK.exists():
        for old in WORK.glob("*"):
            if old.is_file():
                old.unlink(missing_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)

    elisa = best_clip("Elisa")
    manu = best_clip("Manu", min_d=30)
    arpan = best_clip("Arpanito", min_d=18)
    maryna = best_clip("Maryna_Vadini")
    ana = best_clip("Ana")
    arif = best_clip("Arif")
    crowd = best_clip("Event_Broll", min_d=8, prefer="jam")
    jam = best_clip("Event_Broll", min_d=10, prefer="wako") or crowd
    faces = photo_faces(3)

    print("sources:", flush=True)
    for n, p in [
        ("Elisa", elisa), ("Manu", manu), ("Arpanito", arpan), ("Maryna", maryna),
        ("Ana", ana), ("Arif", arif), ("Crowd", crowd), ("Jam", jam),
    ]:
        print(f"  {n}: {p.name if p else 'NONE'}", flush=True)

    # (band, src, ss, take, crop, grade, hard)
    # Prefer humans. Architecture only as short breath. No sneaker unless feet_move→body.
    plan = [
        # 0:00–0:02 HOOK — extreme human, hard cuts
        ("hook", elisa, 14.0, 0.45, "eyes", "hook", True),
        ("hook", arpan, 40.0, 0.40, "hands", "hook", True),
        ("hook", manu, 85.0, 0.45, "tight", "hook", True),
        ("hook", maryna, 20.0, 0.40, "eyes", "hook", True),
        ("hook", ana, 24.0, 0.38, "close", "hook", True),
        # 0:02–0:04 fast human/env open into watched line
        ("hook", crowd, 7.0, 0.45, "close", "hook", True),
        ("hook", arif, 15.0, 0.45, "tight", "hook", True),
        # 0:04–0:07 EXPERIENCED — musician / people
        ("exp", manu, 100.0, 1.55, "wide", "exp", False),
        ("exp", elisa, 30.0, 1.35, "close", "exp", False),
        # 0:07–0:10 CONNECTION — woman / reaction / interaction (faces prove SHARE/LISTEN)
        ("conn", ana, 28.0, 1.20, "eyes", "conn", False),
        ("conn", faces[0] if faces else maryna, 0.0, 0.85, "tight", "conn", False),
        ("conn", maryna, 32.0, 1.15, "close", "conn", False),
        ("conn", crowd, 12.0, 1.00, "left", "conn", False),
        # 0:10–0:14 LEARN — observing / participating
        ("learn", arpan, 70.0, 1.25, "close", "learn", False),
        ("learn", elisa, 50.0, 1.15, "right", "learn", False),
        ("learn", ana, 40.0, 1.20, "eyes", "learn", False),
        # 0:14–0:17 TEACH / exchange into thesis setup
        ("learn", manu, 140.0, 1.35, "hands", "learn", False),
        ("learn", jam, 8.0, 1.20, "wide", "learn", False),
        # 0:14–0:17 SUPPORTIVE SPACE — people (no edge-fade → avoids black flashes)
        ("thesis", ana, 35.0, 1.20, "eyes", "thesis", True),
        ("thesis", elisa, 55.0, 1.15, "close", "thesis", True),
        ("thesis", jam, 10.0, 1.20, "wide", "thesis", True),
        # 0:17–0:20 MOVE TOGETHER — clear human movement
        ("move", manu, 110.0, 1.05, "close", "move", True),
        ("move", crowd, 9.0, 1.10, "close", "move", True),
        ("move", maryna, 38.0, 1.05, "left", "move", True),
        ("move", arpan, 95.0, 1.10, "right", "move", True),
        # 0:23–0:25 BREATH — short place (MUD/moodboard), then back to human
        ("breath", MOODBOARD, 16.5, 1.15, "wide", "breath", False),
        ("breath", elisa, 80.0, 0.95, "eyes", "breath", False),
        # 0:25–0:30 INVITATION / payoff
        ("invite", ana, 50.0, 1.15, "eyes", "invite", False),
        ("invite", arpan, 150.0, 1.10, "close", "invite", False),
        ("invite", maryna, 55.0, 1.05, "tight", "invite", False),
        ("invite", manu, 200.0, 1.20, "close", "invite", False),
        ("invite", MOODBOARD, 22.5, 1.35, "wide", "invite", False),
    ]

    hard_parts: list[Path] = []
    flow_parts: list[Path] = []
    sfx_src: list[Path] = []
    n = 0
    for band, src, ss, take, crop, grade, hard in plan:
        if src is None:
            src = elisa or MOODBOARD
        n += 1
        out = WORK / f"{n:03d}_{band}.mp4"
        ok = None
        if isinstance(src, Path) and src.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            ok = render_photo(src, out, take, crop=crop, grade=grade)
        else:
            ok = render_clip(src, out, ss, take, crop=crop, grade=grade, hard=hard)
        if not ok:
            ok = render_clip(
                MOODBOARD, out, min(12.0, MOODBOARD_SAFE_END - take), take,
                crop="close", grade=grade, hard=hard,
            )
        if not ok:
            continue
        if band == "hook":
            hard_parts.append(ok)
        else:
            flow_parts.append(ok)
        if isinstance(src, Path) and src.suffix.lower() == ".mp4":
            sfx_src.append(src)
        print(f"  {n:02d} {band:6} {crop:9} {probe_dur(ok):.2f}s", flush=True)

    if not hard_parts:
        print("no hook")
        return 1

    hook_vid = WORK / "hook.mp4"
    print("hook hard cuts", flush=True)
    concat_hard(hard_parts, hook_vid)

    chunks: list[Path] = [hook_vid]
    block_a = [p for p in flow_parts if any(x in p.name for x in ("_exp", "_conn", "_learn"))]
    block_b = [p for p in flow_parts if any(x in p.name for x in ("_thesis", "_move"))]
    block_c = [p for p in flow_parts if any(x in p.name for x in ("_breath", "_invite"))]
    if block_a:
        a = WORK / "body_a.mp4"
        xfade_chain(block_a, a, fade=0.16)
        chunks.append(a)
    if block_b:
        b = WORK / "body_b.mp4"
        # short xfade avoids black flash at hard demuxer joins
        xfade_chain(block_b, b, fade=0.10)
        chunks.append(b)
    if block_c:
        c = WORK / "body_c.mp4"
        xfade_chain(block_c, c, fade=0.20)
        chunks.append(c)

    pictured = WORK / "picture.mp4"
    concat_hard(chunks, pictured)
    print(f"picture raw {probe_dur(pictured):.2f}s", flush=True)

    pad_i = 0
    while probe_dur(pictured) < TARGET - 0.4 and pad_i < 6:
        pad_i += 1
        need = min(2.2, TARGET - probe_dur(pictured) + 0.25)
        src = [elisa, manu, arpan, maryna, ana, crowd][pad_i % 6] or MOODBOARD
        pad = WORK / f"pad_{pad_i}.mp4"
        ok = render_clip(src, pad, 25 + pad_i * 9, need, crop="close", grade="invite", hard=False)
        if not ok:
            break
        merged = WORK / f"pic_pad_{pad_i}.mp4"
        concat_hard([pictured, ok], merged)
        pictured = merged

    pictured30 = WORK / "picture_30.mp4"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(pictured),
        "-vf", "fade=t=in:st=0:d=0.05,fade=t=out:st=29.0:d=0.9,format=yuv420p",
        "-t", f"{TARGET:.2f}", "-an",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        str(pictured30),
    ])
    pictured = pictured30
    print(f"picture {probe_dur(pictured):.2f}s", flush=True)

    print("VO", flush=True)
    vo = make_vo(WORK / "vo.wav")
    sfx = extract_nat_sfx(sfx_src, WORK / "nat.wav")
    mix = mix_audio(vo, sfx, WORK / "mix.m4a")

    ass = build_ass(WORK / "typo.ass")
    ass_esc = str(ass).replace("\\", "/").replace(":", r"\:")
    titled = WORK / "titled.mp4"
    r = subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(pictured),
        "-vf", f"ass='{ass_esc}'",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-an", "-t", f"{TARGET:.2f}",
        str(titled),
    ], capture_output=True, text=True)
    if r.returncode != 0 or not titled.exists():
        titled = pictured

    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(titled), "-i", str(mix),
        "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-t", f"{TARGET:.2f}", "-shortest",
        str(FINAL),
    ])
    if FINAL.exists():
        if FINAL_ALIAS.exists():
            FINAL_ALIAS.unlink()
        FINAL_ALIAS.write_bytes(FINAL.read_bytes())

    if PROJECT_PATH.exists():
        project = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))
        project["reel_assembly"] = {
            "version": 4,
            "principle": "connection_over_perfection",
            "thesis": "THIS IS A SUPPORTIVE SPACE",
            "vo": VO_SCRIPT,
            "big_text_only_punches": True,
            "output": str(FINAL),
        }
        PROJECT_PATH.write_text(json.dumps(project, indent=2), encoding="utf-8")

    print("DONE", FINAL, "MB", round(FINAL.stat().st_size / 1e6, 1), "dur", round(probe_dur(FINAL), 2))
    return 0 if FINAL.exists() else 1


if __name__ == "__main__":
    raise SystemExit(main())
