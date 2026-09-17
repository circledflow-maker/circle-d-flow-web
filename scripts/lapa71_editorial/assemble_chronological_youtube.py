#!/usr/bin/env python3
"""Chronological Lapa71 YouTube 16:9 — full performance takes + fixed intro/PiP.

Fixes vs prior cut:
  - Circle D Stages card: crop empty left margin, center on black (no white bar)
  - Moodboard after intro cards (CapCut outro stripped)
  - Longer full-take mainroll segments (Stages preferred)
  - PiP: correct orientation (no forced portrait on landscape) + inset right
  - Keep thank-you / credits ending style
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import (  # noqa: E402
    BRAND,
    INTRO,
    MOODBOARD,
    MOODBOARD_SAFE_END,
    OUT,
    PROXIES,
    YOUTUBE_TARGET_MAX,
    WORK,
)
from media import list_proxies, probe_dur as media_probe  # noqa: E402

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
W, H = 1920, 1080
XFADE = 0.28
STRIP_STAGES = 5.0


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


def probe_wh(path: Path) -> tuple[int, int]:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=p=0", str(path),
        ],
        text=True,
    ).strip()
    try:
        w, h = out.split(",")[:2]
        return int(w), int(h)
    except Exception:
        return 1920, 1080


def probe_rotation(path: Path) -> int:
    """Return display rotation degrees (0/90/180/270) from tags or side data."""
    try:
        raw = subprocess.check_output(
            [
                "ffprobe", "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream_tags=rotate:stream_side_data=rotation",
                "-of", "json", str(path),
            ],
            text=True,
        )
        data = json.loads(raw)
        stream = (data.get("streams") or [{}])[0]
        tags = stream.get("tags") or {}
        if tags.get("rotate") not in (None, ""):
            return int(float(tags["rotate"])) % 360
        for sd in stream.get("side_data_list") or []:
            if sd.get("rotation") is not None:
                return int(float(sd["rotation"])) % 360
    except Exception:
        pass
    return 0


def display_wh(path: Path) -> tuple[int, int]:
    """Coded size adjusted for rotation metadata (ffmpeg autorotates on decode)."""
    w, h = probe_wh(path)
    rot = probe_rotation(path)
    if rot in (90, 270, -90, -270):
        return h, w
    return w, h


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:").replace("%", "\\%")


def vf_main() -> str:
    # increase+crop (not decrease+pad): pad fails on some D850/yuvj420p proxies
    return (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},"
        "setsar=1,"
        "eq=contrast=1.06:brightness=0.01:saturation=0.97:gamma=1.03,"
        "hqdn3d=1.1:0.8:2.0:1.4,fps=25,format=yuv420p"
    )


def crop_intro_png(src: Path, dest: Path) -> Path:
    """Crop to real logo art; strip thin left gray/white bar + near-black margins."""
    if dest.exists() and dest.stat().st_size > 10_000:
        return dest
    if Image is None:
        return src
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()

    def lum(x: int, y: int) -> float:
        r, g, b = px[x, y]
        return (r + g + b) / 3.0

    # Content = bright logo strokes (ignore faint gray bars ~30–90)
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if lum(x, y) >= 100:
                xs.append(x)
                ys.append(y)
    if not xs:
        # fallback: anything above near-black
        for y in range(h):
            for x in range(w):
                if lum(x, y) >= 40:
                    xs.append(x)
                    ys.append(y)
    if not xs:
        return src
    pad = 6
    left = max(0, min(xs) - pad)
    right = min(w, max(xs) + pad + 1)
    top = max(0, min(ys) - pad)
    bottom = min(h, max(ys) + pad + 1)
    # drop leftover faint vertical bars on the far left of the crop
    for _ in range(24):
        bright = sum(1 for y in range(top, bottom) if lum(left, y) > 22)
        if bright > (bottom - top) * 0.35 and left + 1 < right:
            left += 1
        else:
            break
    cropped = im.crop((left, top, right, bottom))
    # force pure black backdrop so scale/pad never shows gray edge
    out = Image.new("RGB", cropped.size, (0, 0, 0))
    cp = cropped.load()
    op = out.load()
    for y in range(cropped.size[1]):
        for x in range(cropped.size[0]):
            r, g, b = cp[x, y]
            if r < 22 and g < 22 and b < 22:
                op[x, y] = (0, 0, 0)
            else:
                op[x, y] = (r, g, b)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest)
    print(f"  cropped intro {src.name} {w}x{h} -> {out.size[0]}x{out.size[1]} (L={left})", flush=True)
    return dest


def still_card(img: Path, out: Path, sec: float, *, center_scale: float = 0.72) -> Path:
    """Center card on pure black via overlay (avoids pad edge artifacts / white bars)."""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    tw = int(W * center_scale)
    th = int(H * center_scale)
    fc = (
        f"[0:v]scale={tw}:{th}:force_original_aspect_ratio=decrease,"
        f"format=rgba,"
        f"fade=t=in:st=0:d=0.25:alpha=1,"
        f"fade=t=out:st={max(0.0, sec-0.35):.2f}:d=0.3:alpha=1[fg];"
        f"color=c=black:s={W}x{H}:d={sec:.2f}:r=25[bg];"
        f"[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[v]"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(img),
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex", fc,
        "-map", "[v]", "-map", "1:a",
        "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def text_card(lines: list[tuple[str, str]], out: Path, sec: float) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draws = []
    for i, (text, role) in enumerate(lines):
        fs, color, font = (56, "white", FONT_B) if role == "title" else (
            (36, "#E8C547", FONT_B) if role == "gold" else (28, "white@0.9", FONT_R)
        )
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(text)}':fontsize={fs}:"
            f"fontcolor={color}:x=(w-text_w)/2:y={340 + i * 70}"
        )
    draws.append(f"fade=t=in:st=0:d=0.3,fade=t=out:st={max(0.0, sec-0.4):.2f}:d=0.35")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d={sec:.2f}:r=25",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-vf", ",".join(draws), "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def moodboard_card(out: Path) -> Path | None:
    if not MOODBOARD.exists():
        print("  moodboard missing — skip", flush=True)
        return None
    if out.exists() and out.stat().st_size > 80_000:
        return out
    take = min(MOODBOARD_SAFE_END, probe_dur(MOODBOARD) - 0.05)
    if take < 5:
        return None
    # strip CapCut corner logo if present
    vf = (
        f"delogo=x=8:y=8:w=170:h=55:show=0,"
        f"{vf_main()},"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.0, take-0.6):.2f}:d=0.5"
    )
    af = (
        "aformat=sample_rates=48000:channel_layouts=stereo,"
        "loudnorm=I=-14:TP=-1.5:LRA=10,"
        f"afade=t=in:st=0:d=0.3,afade=t=out:st={max(0.0, take-0.6):.2f}:d=0.5"
    )
    print(f"  moodboard {take:.1f}s", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(MOODBOARD), "-t", f"{take:.2f}",
        "-vf", vf, "-af", af,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out if out.exists() else None


def credits_card(artists: list[str], out: Path, sec: float = 10.0) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    body = ["Thank you", "Tagus Drop Rhythm · Lapa71", ""] + artists[:12] + ["", BRAND]
    draws = []
    for i, line in enumerate(body):
        if not line:
            continue
        fs, color, font = (48, "white", FONT_B) if i == 0 else (
            (28, "#E8C547", FONT_B) if "Tagus" in line or line == BRAND else (24, "white@0.9", FONT_R)
        )
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(line)}':fontsize={fs}:"
            f"fontcolor={color}:x=(w-text_w)/2:y={140 + i * 48}"
        )
    draws.append(f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.0, sec-0.6):.2f}:d=0.5")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d={sec:.2f}:r=25",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-vf", ",".join(draws), "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def list_stages_library() -> list[dict]:
    """Longer Stage cuts from Artists Library (full performances)."""
    lib = Path(r"D:\Wakungo_Content_Studio\_Artists_Library")
    rows = []
    if not lib.exists():
        return rows
    for artist_dir in lib.iterdir():
        if not artist_dir.is_dir() or artist_dir.name in ("Unknown",):
            continue
        stages = artist_dir / "Lapa71" / "Stages"
        if not stages.exists():
            continue
        for p in stages.glob("*.mp4"):
            if p.stat().st_size < 200_000:
                continue
            try:
                d = probe_dur(p)
            except Exception:
                continue
            if d < 20:
                continue
            import re
            m = re.search(r"DSC_(\d+)", p.name, re.I)
            dsc = int(m.group(1)) if m else 10**9
            cam = "D850" if "D850" in p.name.upper() else "Z50II"
            era = "early" if dsc <= 999 else ("night" if dsc >= 1400 else "mid")
            if dsc >= 10**9:
                continue
            rows.append({
                "path": p,
                "dsc": dsc,
                "camera": cam,
                "duration": d,
                "artist": artist_dir.name,
                "era": era,
                "filler": "filler" in p.name.lower() or artist_dir.name == "Event_Broll",
                "source_kind": "stages",
            })
    rows.sort(key=lambda r: (r["dsc"], r["camera"] != "Z50II"))
    return rows


def pick_full_performance_spine(budget: float) -> list[dict]:
    """Prefer Stages full takes; fill gaps with Full_Takes proxies. Longer segments."""
    stages = [r for r in list_stages_library() if r["camera"] == "Z50II" and not r["filler"]]
    proxies = [r for r in list_proxies() if r["camera"] == "Z50II" and not r.get("filler") and r["duration"] >= 12]

    # Prefer stages when available (fuller performances)
    by_dsc: dict[int, dict] = {}
    for r in proxies:
        by_dsc[r["dsc"]] = {**r, "source_kind": "proxy"}
    for r in stages:
        # stages overwrite proxy for same DSC if longer
        prev = by_dsc.get(r["dsc"])
        if not prev or r["duration"] >= prev.get("duration", 0):
            by_dsc[r["dsc"]] = r

    z = sorted(by_dsc.values(), key=lambda r: r["dsc"])
    early = [r for r in z if r["era"] == "early"]
    night = [r for r in z if r["era"] == "night"]

    must_night = ["Manu", "Arpanito", "Elisa", "Ana", "Mr_Isaac", "Maryna_Vadini", "Arif", "Leonnardo_Melo"]
    picked: list[dict] = []
    used: set[str] = set()
    total = 0.0

    def add(r: dict, take_cap: float) -> float:
        nonlocal total
        key = str(r["path"])
        if key in used:
            return 0.0
        # Full-ish take: most of clip, strip burned intro on Stages
        strip = STRIP_STAGES if r.get("source_kind") == "stages" else max(0.0, r["duration"] * 0.08)
        avail = max(12.0, r["duration"] - strip - 0.5)
        take = min(take_cap, avail, max(40.0, r["duration"] * 0.85) if r["duration"] > 60 else avail)
        take = min(take, avail)
        if take < 12:
            return 0.0
        ss = strip if r["duration"] > strip + take + 1 else max(0.0, r["duration"] * 0.1)
        if ss + take > r["duration"]:
            take = max(12.0, r["duration"] - ss - 0.05)
        picked.append({**r, "ss": ss, "take": take, "role": "MAINROLL"})
        used.add(key)
        total += take
        return take

    # Early arrival / jam — shorter but still substantial
    for r in early:
        if total >= budget * 0.28:
            break
        add(r, 55.0)

    # Must-show night artists first (longest available)
    for artist in must_night:
        if total >= budget * 0.92:
            break
        cands = [r for r in night if r["artist"] == artist and str(r["path"]) not in used]
        if not cands:
            continue
        cands.sort(key=lambda r: -r["duration"])
        add(cands[0], 120.0)

    # Fill night chronologically with remaining strong takes
    for r in night:
        if total >= budget:
            break
        if str(r["path"]) in used:
            continue
        add(r, 90.0)

    picked.sort(key=lambda r: r["dsc"])
    return picked


def find_pip(main: dict, rows: list[dict], used: set[str]) -> dict | None:
    pool = [
        r for r in rows
        if r["camera"] in ("D850", "PHONE", "GUEST")
        and str(r["path"]) not in used
        and str(r["path"]) != str(main["path"])
        and r.get("era") == main.get("era")
        and r["duration"] >= 4
    ]
    scored = []
    for r in pool:
        score = 0
        name = r["path"].name.upper()
        if r["camera"] == "D850" and r.get("artist") == main.get("artist"):
            score += 8
        if "CHRIS" in name:
            score += 5
        if "RENE" in name:
            score += 4
        if r["camera"] == "PHONE":
            score += 3
        if r.get("artist") in ("Event_Broll", "Guest_Broll"):
            score += 2
        if score >= 3:
            scored.append((score, r))
    if not scored:
        return None
    scored.sort(key=lambda x: -x[0])
    best = scored[0][1]
    take = min(6.0, max(3.5, best["duration"] * 0.15), float(main["take"]))
    ss = max(0.0, min(best["duration"] - take - 0.05, best["duration"] * 0.3))
    return {**best, "ss": ss, "take": take, "role": "PIP"}


def pip_filter(path: Path, take: float) -> tuple[str, int, int, int, int]:
    """Return (vf, pw, ph, mx, my) with correct orientation + inset right placement.

    Do NOT transpose: ffmpeg already applies rotation side-data on decode.
    Extra transpose was what made guest PiP look sideways.
    """
    w, h = display_wh(path)
    portrait = h > w
    if portrait:
        # upright phone / Chris vertical — portrait PiP inset right
        pw, ph = 380, 640
    else:
        # landscape guest (René / D850) — landscape PiP, never force portrait box
        pw, ph = 560, 315
    vf = (
        f"scale={pw}:{ph}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph},"
        "setsar=1,"
        "eq=contrast=1.08:saturation=0.98,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={pw}:h={ph}:color=white@0.35:t=2"
    )
    # inset from right edge (not flush) + lower-third
    mx = W - pw - 72
    my = H - ph - 64
    return vf, pw, ph, mx, my


def render_plain(src: Path, out: Path, ss: float, take: float) -> Path | None:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    af = "aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.96"
    print(f"  render MAIN {src.name} @{ss:.1f}+{take:.1f}", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{ss:.2f}", "-i", str(src), "-t", f"{take:.2f}",
        "-vf", vf_main(), "-af", af,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out if out.exists() and out.stat().st_size > 50_000 else None


def render_with_pip(main: dict, pip: dict, out: Path) -> Path | None:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    take = float(main["take"])
    pip_vf, pw, ph, mx, my = pip_filter(pip["path"], take)
    main_vf = vf_main()
    # PiP visible mid-segment (not whole take) so performances stay primary
    pip_on = min(8.0, max(4.0, take * 0.22))
    pip_start = max(1.0, take * 0.35)
    pip_end = min(take - 0.4, pip_start + pip_on)
    fc = (
        f"[0:v]{main_vf}[base];"
        f"[1:v]{pip_vf}[pip];"
        f"[base][pip]overlay={mx}:{my}:enable='between(t,{pip_start:.2f},{pip_end:.2f})'[v];"
        f"[0:a]aformat=sample_rates=48000:channel_layouts=stereo,"
        f"loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.96[a]"
    )
    print(
        f"  render PIP main DSC{main['dsc']} + {pip['path'].name[:28]} "
        f"{pw}x{ph} @({mx},{my}) ({pip['camera']})",
        flush=True,
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{main['ss']:.2f}", "-t", f"{take:.2f}", "-i", str(main["path"]),
        "-ss", f"{pip['ss']:.2f}", "-t", f"{take:.2f}", "-i", str(pip["path"]),
        "-filter_complex", fc,
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest",
        str(out),
    ])
    return out if out.exists() and out.stat().st_size > 50_000 else None


def xfade_concat(parts: list[Path], out: Path, fade: float = XFADE) -> Path:
    if len(parts) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(parts[0]), "-c", "copy", str(out)])
        return out
    # chunk xfade in batches of 12 to avoid huge filter graphs / RAM
    batch_size = 10
    current = parts
    round_i = 0
    while len(current) > 1:
        next_round: list[Path] = []
        for i in range(0, len(current), batch_size):
            chunk = current[i:i + batch_size]
            chunk_out = out.parent / f"_xfade_r{round_i}_{i}.mp4"
            if len(chunk) == 1:
                next_round.append(chunk[0])
                continue
            durs = [probe_dur(p) for p in chunk]
            inputs: list[str] = []
            for p in chunk:
                inputs += ["-i", str(p)]
            vfilters, afilters = [], []
            vlabel, alabel = "0:v", "0:a"
            acc = durs[0]
            for j in range(1, len(chunk)):
                offset = max(0.05, acc - fade)
                vo, ao = f"v{j}", f"a{j}"
                vfilters.append(
                    f"[{vlabel}][{j}:v]xfade=transition=fade:duration={fade:.2f}:offset={offset:.3f}[{vo}]"
                )
                afilters.append(
                    f"[{alabel}][{j}:a]acrossfade=d={fade:.2f}:c1=tri:c2=tri[{ao}]"
                )
                vlabel, alabel = vo, ao
                acc = offset + durs[j]
            fc = ";".join(vfilters + afilters)
            print(f"  xfade batch r{round_i} n={len(chunk)}", flush=True)
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                *inputs, "-filter_complex", fc,
                "-map", f"[{vlabel}]", "-map", f"[{alabel}]",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                str(chunk_out),
            ])
            next_round.append(chunk_out)
        current = next_round
        round_i += 1
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(current[0]), "-c", "copy", str(out)])
    return out


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    work = WORK / "youtube_v2"
    if work.exists():
        for old in work.glob("*.mp4"):
            old.unlink(missing_ok=True)
        for old in work.glob("*.png"):
            old.unlink(missing_ok=True)
    work.mkdir(parents=True, exist_ok=True)

    budget = YOUTUBE_TARGET_MAX * 60 - 50
    print("pick full-performance spine…", flush=True)
    spine = pick_full_performance_spine(budget)
    print(
        f"spine={len(spine)} ~{sum(c['take'] for c in spine)/60:.1f} min "
        f"dsc {spine[0]['dsc']}->{spine[-1]['dsc']}",
        flush=True,
    )

    parts: list[Path] = []
    # Intro cards — Stages cleaned + centered
    cdf = INTRO / "01_circle_d_flow_presents.png"
    stages_src = INTRO / "02_circle_d_stages.png"
    stages_clean = crop_intro_png(stages_src, work / "02_circle_d_stages_clean.png") if stages_src.exists() else None
    if cdf.exists():
        cdf_clean = crop_intro_png(cdf, work / "01_cdf_clean.png")
        parts.append(still_card(cdf_clean, work / "00_cdf.mp4", 2.2, center_scale=0.70))
    if stages_clean:
        parts.append(still_card(stages_clean, work / "01_stages.mp4", 2.4, center_scale=0.78))

    # Moodboard AFTER intro cards
    mb = moodboard_card(work / "02_moodboard.mp4")
    if mb:
        parts.append(mb)

    parts.append(text_card([
        ("Wako Kungo presents", "title"),
        ("Tagus Drop Rhythm", "gold"),
        ("Lapa71 · Lisbon", "body"),
    ], work / "03_event.mp4", 3.0))

    # B-roll pool for PiP
    rows = list_proxies()
    decisions = []
    used_pip: set[str] = set()
    for i, main in enumerate(spine):
        out = work / f"{i+20:03d}_{main['artist'][:10]}_DSC{main['dsc']}.mp4"
        want_pip = (main["era"] == "early" and i % 2 == 0) or (main["era"] == "night" and i % 3 == 1)
        pip = find_pip(main, rows, used_pip) if want_pip else None
        if pip:
            used_pip.add(str(pip["path"]))
            ok = render_with_pip(main, pip, out)
            decisions.append({
                "dsc": main["dsc"], "artist": main["artist"], "era": main["era"],
                "take": main["take"], "source": main.get("source_kind"),
                "pip": pip["path"].name, "pip_camera": pip["camera"],
            })
        else:
            ok = render_plain(main["path"], out, main["ss"], main["take"])
            decisions.append({
                "dsc": main["dsc"], "artist": main["artist"], "era": main["era"],
                "take": main["take"], "source": main.get("source_kind"), "pip": None,
            })
        if ok:
            parts.append(ok)

    artists = []
    seen = set()
    for c in spine:
        if c["artist"] not in seen and c["artist"] not in ("Event_Broll", "Unknown", "Guest_Broll"):
            seen.add(c["artist"])
            artists.append(c["artist"].replace("_", " "))
    # Ending (same style user liked ~09:56)
    parts.append(credits_card(artists, work / "zz_credits.mp4", 12.0))

    print(f"xfade {len(parts)} parts", flush=True)
    body = work / "youtube_body.mp4"
    xfade_concat(parts, body)
    dur = probe_dur(body)
    final = OUT / "Lapa71_TagusDropRhythm_YouTube_Chrono_16x9.mp4"
    final_alias = OUT.parent / "YouTube" / "Lapa71_TagusDropRhythm_YouTube_16x9.mp4"
    final_alias.parent.mkdir(parents=True, exist_ok=True)
    print(f"body {dur/60:.1f} min — final encode", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(body),
        "-vf", f"fade=t=in:st=0:d=0.3,fade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1,format=yuv420p",
        "-af", f"afade=t=in:st=0:d=0.25,afade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(final),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(final), "-c", "copy", str(final_alias)])

    # Master encode
    masters = Path(r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\YouTube")
    masters.mkdir(parents=True, exist_ok=True)
    master = masters / "Lapa71_TagusDropRhythm_YouTube_MASTER_16x9.mp4"
    print("master CRF18…", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(final),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
        str(master),
    ])

    project = {
        "title": "Tagus Drop Rhythm — Full Performance Cut",
        "brand": BRAND,
        "fixes": [
            "stages_card_centered_no_left_bar",
            "moodboard_after_intro",
            "pip_orientation_and_inset_right",
            "longer_full_performance_takes",
            "credits_ending_preserved",
        ],
        "duration_sec": probe_dur(final),
        "output": str(final),
        "master": str(master),
        "stats": {
            "mainroll": len(spine),
            "pip_inserts": sum(1 for d in decisions if d.get("pip")),
            "artists": artists,
            "avg_take_sec": round(sum(c["take"] for c in spine) / max(1, len(spine)), 1),
        },
        "decisions": decisions,
    }
    (OUT / "youtube_chrono_project.json").write_text(json.dumps(project, indent=2), encoding="utf-8")
    print(
        "DONE", final,
        f"{project['duration_sec']/60:.1f} min",
        f"MB={final.stat().st_size/1e6:.0f}",
        f"master_MB={master.stat().st_size/1e6:.0f}",
        f"pip={project['stats']['pip_inserts']}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
