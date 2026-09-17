#!/usr/bin/env python3
"""Full-length Lapa71 Cinematic Festival Aftermovie (YouTube 16:9).

EDIT THE EVENT — fluid aftermovie, NOT sequential full performances.
- Every artist appears once as hero (highlight window)
- No mainroll / Full_Takes clip reused as fullscreen later
- Second angles always PiP / ViV / split — never plain replay
- TOD locked: outdoor afternoon → jam → night → peak → credits
- Length may exceed 30 min; ends with Abspann

Sources: Full_Takes + _Artists_Library/*/Lapa71/Stages (+ legacy 04_Artists)
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import BRAND, INTRO, OUT, STUDIO, WORK  # noqa: E402
from media import list_proxies, probe_dur  # noqa: E402
from assemble_chronological_youtube import crop_intro_png, credits_card  # noqa: E402

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore

FT = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes")
LIB = STUDIO / "_Artists_Library"
LEGACY = STUDIO / "Lapa71" / "04_Artists"
WORK_D = WORK / "full_aftermovie_yt_v3"
W, H = 1920, 1080
THREADS = "1"
FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"

# Hero order = story (early outdoor → night). One fluid block each.
# Takes sized so full aftermovie lands ~32–38 min (not 15 min highlight).
EARLY_HEROES = [
    ("Zema", 48.0),
    ("Mr_Isaac", 140.0),
    ("Maryna_Vadini", 85.0),
    ("Arif", 48.0),
]
NIGHT_HEROES = [
    ("Maryna_Vadini", 145.0),
    ("Ana", 165.0),
    ("Elisa", 95.0),
    ("Leonnardo_Melo", 210.0),
    ("Humble", 55.0),
    ("Manu", 270.0),
    ("Arpanito", 270.0),
    ("Arif", 240.0),
]


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1600:])


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:").replace("%", "\\%")


def af() -> str:
    return (
        "aformat=sample_rates=48000:channel_layouts=stereo,"
        "highpass=f=70,lowpass=f=14000,"
        "loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.95"
    )


def enc() -> list[str]:
    return ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-threads", THREADS]


def vf_fs() -> str:
    return (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},setsar=1,"
        "eq=contrast=1.07:brightness=0.012:saturation=0.97:gamma=1.03,"
        "hqdn3d=1.0:0.7:1.8:1.2,fps=25,format=yuv420p"
    )


def has_audio(path: Path) -> bool:
    try:
        o = subprocess.check_output(
            ["ffprobe", "-v", "error", "-select_streams", "a:0",
             "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(path)],
            text=True,
        ).strip()
        return bool(o)
    except Exception:
        return False


def ensure_1080(src: Path) -> Path:
    try:
        w = int(subprocess.check_output(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width", "-of", "csv=p=0", str(src)],
            text=True,
        ).strip().split(",")[0] or "1920")
    except Exception:
        w = 1920
    if w <= 1920:
        return src
    dest = WORK_D / f"_s1080_{src.stem}.mp4"
    if dest.exists() and dest.stat().st_size > 80_000:
        return dest
    print(f"  scale1080 {src.name}", flush=True)
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(src),
        "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=25,format=yuv420p",
        *enc(),
    ]
    if has_audio(src):
        cmd += ["-af", "aformat=sample_rates=48000:channel_layouts=stereo", "-c:a", "aac", "-b:a", "128k"]
    else:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a",
                "-c:a", "aac", "-b:a", "128k", "-shortest"]
    cmd.append(str(dest))
    run(cmd)
    return dest


def dsc_num(name: str) -> int:
    m = re.search(r"DSC_(\d+)", name, re.I)
    return int(m.group(1)) if m else 10**9


def best_stages(artist: str, *, prefer_night: bool) -> Path | None:
    roots = []
    for base in (LIB / artist / "Lapa71" / "Stages", LEGACY / artist / "Stages"):
        if base.exists():
            roots.append(base)
    # alt spellings
    if artist == "Mr_Isaac":
        for p in LIB.glob("Mr*/Lapa71/Stages"):
            roots.append(p)
    cands: list[tuple[float, Path]] = []
    for root in roots:
        for f in root.glob("*.mp4"):
            d = dsc_num(f.name)
            night = d >= 1400
            if prefer_night and not night and d < 10**9:
                continue
            if not prefer_night and night:
                continue
            try:
                dur = probe_dur(f)
            except Exception:
                continue
            if dur < 12:
                continue
            # prefer longer usable masters (full aftermovie needs room)
            score = min(dur, 420.0) + (20 if "Stages" in f.name else 0)
            cands.append((score, f))
    if not cands and prefer_night:
        return best_stages(artist, prefer_night=False)
    if not cands:
        return None
    cands.sort(key=lambda x: -x[0])
    return cands[0][1]


def as_clip(path: Path) -> dict:
    p = ensure_1080(path)
    return {"path": p, "duration": probe_dur(p), "name": path.name}


def ss_take(c: dict, prefer: float, take: float) -> tuple[float, float]:
    d = float(c["duration"])
    take = min(take, max(1.0, d - 0.2))
    # skip Stages lower-thirds (~5s)
    strip = 5.0 if "Stages" in c.get("name", "") or "Stages" in c["path"].name else 0.0
    ss = max(strip, min(d - take - 0.05, strip + (d - strip) * prefer))
    if ss + take > d:
        take = max(1.0, d - ss - 0.05)
    return ss, take


def render_fs(
    c: dict,
    out: Path,
    take: float,
    prefer: float = 0.2,
    mute: bool = False,
    *,
    ss_abs: float | None = None,
) -> Path:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    if ss_abs is None:
        ss, take = ss_take(c, prefer, take)
    else:
        d = float(c["duration"])
        take = min(take, max(1.0, d - ss_abs - 0.05))
        ss = ss_abs
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss:.2f}", "-t", f"{take:.2f}", "-i", str(c["path"]),
    ]
    if mute or not has_audio(c["path"]):
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
        cmd += ["-vf", vf_fs(), *enc(), "-map", "0:v", "-map", "1:a",
                "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        cmd += ["-vf", vf_fs(), "-af", af(), *enc(), "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    cmd.append(str(out))
    run(cmd)
    return out


def render_float_pip(
    main: dict,
    over: dict,
    out: Path,
    take: float,
    corner: str = "br",
    *,
    ss_main: float | None = None,
    ss_over: float | None = None,
    prefer_main: float = 0.25,
) -> Path:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    pw, ph = 520, 292
    pos = {
        "br": (W - pw - 56, H - ph - 48),
        "tr": (W - pw - 56, 48),
        "tl": (56, 48),
        "bl": (56, H - ph - 48),
    }
    mx, my = pos.get(corner, pos["br"])
    if ss_main is None:
        ss0, t0 = ss_take(main, prefer_main, take)
    else:
        d = float(main["duration"])
        t0 = min(take, max(1.0, d - ss_main - 0.05))
        ss0 = ss_main
    if ss_over is None:
        ss1, _ = ss_take(over, 0.35, t0)
    else:
        d1 = float(over["duration"])
        ss1 = min(ss_over, max(0.0, d1 - t0 - 0.05))
    pip = (
        f"scale={pw}:{ph}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph},setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={pw}:h={ph}:color=white@0.28:t=2"
    )
    fc = f"[0:v]{vf_fs()}[base];[1:v]{pip}[p];[base][p]overlay={mx}:{my}[v]"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss0:.2f}", "-t", f"{t0:.2f}", "-i", str(main["path"]),
        "-ss", f"{ss1:.2f}", "-t", f"{t0:.2f}", "-i", str(over["path"]),
        "-filter_complex", fc, "-map", "[v]",
    ]
    if has_audio(main["path"]):
        cmd += ["-map", "0:a", "-af", af(), "-c:a", "aac", "-b:a", "192k"]
    else:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "2:a",
                "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += [*enc(), "-shortest", str(out)]
    run(cmd)
    return out


def render_center_pip(
    main: dict,
    over: dict,
    out: Path,
    take: float,
    scale: float = 0.92,
    *,
    ss_main: float | None = None,
    ss_over: float | None = None,
    prefer_main: float = 0.3,
) -> Path:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    ow, oh = int(W * scale) // 2 * 2, int(H * scale) // 2 * 2
    ox, oy = (W - ow) // 2, (H - oh) // 2
    if ss_main is None:
        ss0, t0 = ss_take(main, prefer_main, take)
    else:
        d = float(main["duration"])
        t0 = min(take, max(1.0, d - ss_main - 0.05))
        ss0 = ss_main
    if ss_over is None:
        ss1, _ = ss_take(over, 0.4, t0)
    else:
        d1 = float(over["duration"])
        ss1 = min(ss_over, max(0.0, d1 - t0 - 0.05))
    box = (
        f"scale={ow}:{oh}:force_original_aspect_ratio=increase,"
        f"crop={ow}:{oh},setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={ow}:h={oh}:color=white@0.22:t=2"
    )
    fc = f"[0:v]{vf_fs()}[base];[1:v]{box}[p];[base][p]overlay={ox}:{oy}[v]"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss0:.2f}", "-t", f"{t0:.2f}", "-i", str(main["path"]),
        "-ss", f"{ss1:.2f}", "-t", f"{t0:.2f}", "-i", str(over["path"]),
        "-filter_complex", fc, "-map", "[v]",
    ]
    if has_audio(main["path"]):
        cmd += ["-map", "0:a", "-af", af(), "-c:a", "aac", "-b:a", "192k"]
    else:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "2:a",
                "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += [*enc(), "-shortest", str(out)]
    run(cmd)
    return out


def render_vsplit(
    a: dict,
    b: dict,
    out: Path,
    take: float,
    *,
    ss_a: float | None = None,
    prefer_a: float = 0.3,
) -> Path:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    hw = W // 2
    cell = f"scale={hw}:{H}:force_original_aspect_ratio=increase,crop={hw}:{H},setsar=1,fps=25,format=yuv420p"
    if ss_a is None:
        ss0, t0 = ss_take(a, prefer_a, take)
    else:
        d = float(a["duration"])
        t0 = min(take, max(1.0, d - ss_a - 0.05))
        ss0 = ss_a
    ss1, _ = ss_take(b, 0.35, t0)
    fc = f"[0:v]{cell}[L];[1:v]{cell}[R];[L][R]hstack=inputs=2[v]"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss0:.2f}", "-t", f"{t0:.2f}", "-i", str(a["path"]),
        "-ss", f"{ss1:.2f}", "-t", f"{t0:.2f}", "-i", str(b["path"]),
        "-filter_complex", fc, "-map", "[v]",
    ]
    if has_audio(a["path"]):
        cmd += ["-map", "0:a", "-af", af(), "-c:a", "aac", "-b:a", "192k"]
    else:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "2:a",
                "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += [*enc(), "-shortest", str(out)]
    run(cmd)
    return out


def render_text_break(word: str, out: Path, dur: float, bg: dict) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    ss, t = ss_take(bg, 0.5, dur)
    draw = (
        f"drawtext=fontfile='{FONT_B}':text='{esc(word)}':fontsize=70:"
        f"fontcolor=white:borderw=3:bordercolor=black@0.55:"
        f"x=(w-text_w)/2:y=(h-text_h)/2"
    )
    vf = f"{vf_fs()},eq=brightness=-0.3:saturation=0.7,{draw}"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss:.2f}", "-t", f"{t:.2f}", "-i", str(bg["path"]),
        "-vf", vf, "-af", "volume=0.2," + af(),
        *enc(), "-c:a", "aac", "-b:a", "192k", str(out),
    ])
    return out


def burn(src: Path, out: Path, lines: list[tuple[str, str]]) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draws = []
    y0 = 820
    for i, (text, role) in enumerate(lines):
        fs, color, font = (
            (52, "white", FONT_B) if role == "brush" else
            (34, "#E8C547", FONT_B) if role == "gold" else
            (26, "white@0.92", FONT_R)
        )
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(text)}':fontsize={fs}:"
            f"fontcolor={color}:borderw=2:bordercolor=black@0.5:"
            f"x=(w-text_w)/2:y={y0 + i * 56}"
        )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(src), "-vf", ",".join(draws), *enc(), "-c:a", "copy", str(out),
    ])
    return out


def pill_still(img: Path, out: Path, sec: float, scale: float = 0.72) -> Path:
    if out.exists() and out.stat().st_size > 200_000:
        return out
    if Image is None:
        raise RuntimeError("PIL required")
    src = Image.open(img).convert("RGBA")
    canvas = Image.new("RGB", (W, H), (0, 0, 0))
    src.thumbnail((int(W * scale), int(H * scale)), Image.Resampling.LANCZOS)
    canvas.paste(src, ((W - src.size[0]) // 2, (H - src.size[1]) // 2), src)
    png = out.with_suffix(".png")
    canvas.save(png)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(png),
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", f"{sec:.2f}", *enc(), "-c:a", "aac", "-b:a", "128k", "-shortest", str(out),
    ])
    return out


def xfade(parts: list[Path], out: Path, fade: float = 0.25) -> Path:
    if len(parts) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(parts[0]), "-c", "copy", str(out)])
        return out
    batch = 6
    current = parts
    round_i = 0
    while len(current) > 1:
        nxt: list[Path] = []
        for i in range(0, len(current), batch):
            chunk = current[i:i + batch]
            cout = out.parent / f"_fullxf_r{round_i}_{i}.mp4"
            if len(chunk) == 1:
                nxt.append(chunk[0])
                continue
            if cout.exists() and cout.stat().st_size > 200_000:
                try:
                    if probe_dur(cout) > 2:
                        nxt.append(cout)
                        continue
                except Exception:
                    cout.unlink(missing_ok=True)
            durs = [probe_dur(p) for p in chunk]
            inputs: list[str] = []
            for p in chunk:
                inputs += ["-i", str(p)]
            vfs, afs = [], []
            vl, al, acc = "0:v", "0:a", durs[0]
            for j in range(1, len(chunk)):
                off = max(0.05, acc - fade)
                vo, ao = f"v{j}", f"a{j}"
                vfs.append(f"[{vl}][{j}:v]xfade=transition=fade:duration={fade:.2f}:offset={off:.3f}[{vo}]")
                afs.append(f"[{al}][{j}:a]acrossfade=d={fade:.2f}:c1=tri:c2=tri[{ao}]")
                vl, al, acc = vo, ao, off + durs[j]
            print(f"  xfade r{round_i} n={len(chunk)}", flush=True)
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
                *inputs, "-filter_complex", ";".join(vfs + afs),
                "-map", f"[{vl}]", "-map", f"[{al}]",
                *enc(), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(cout),
            ])
            nxt.append(cout)
        current = nxt
        round_i += 1
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(current[0]), "-c", "copy", str(out)])
    return out


def path_key(p: Path | str) -> str:
    return str(Path(p).resolve())


def pick_broll(pool: list[dict], used: set[str], era: str | None = None) -> dict | None:
    for r in pool:
        key = path_key(r["path"])
        if key in used:
            continue
        if era and r.get("era") != era:
            continue
        used.add(key)
        return {"path": ensure_1080(r["path"]), "duration": r["duration"], "name": r["path"].name}
    return None


def pick_unused_row(rows: list[dict], used: set[str], *, min_dur: float = 4.0) -> dict | None:
    """Fresh background — never reuse a claimed mainroll/broll path."""
    for r in rows:
        key = path_key(r["path"])
        if key in used:
            continue
        if float(r.get("duration") or 0) < min_dur:
            continue
        used.add(key)
        return as_clip(r["path"])
    return None


def claim_path(p: Path, used: set[str]) -> None:
    used.add(path_key(p))


def hero_block(
    artist: str,
    take: float,
    prefer_night: bool,
    used_main: set[str],
    broll_pool: list[dict],
    used_broll: set[str],
    nxt,
    parts: list[Path],
    label_prefix: str,
) -> None:
    """One fluid hero: FS → float PiP → (optional) center/split — advancing timeline, no repeat."""
    src = best_stages(artist, prefer_night=prefer_night)
    if src is None:
        print(f"  skip {artist}: no stages", flush=True)
        return
    key = str(src.resolve())
    if key in used_main:
        # try alternate Stages file
        alt = best_stages(artist, prefer_night=not prefer_night)
        if alt is None or str(alt.resolve()) in used_main:
            print(f"  skip {artist}: already used", flush=True)
            return
        src = alt
        key = str(src.resolve())
    used_main.add(key)
    main = as_clip(src)
    strip = 5.0 if "Stages" in src.name else 0.5
    usable = max(10.0, float(main["duration"]) - strip - 0.4)
    take = min(take, usable)
    print(f"  HERO {artist} {take:.0f}s <- {src.name}", flush=True)

    # sequential non-overlapping windows through the same performance
    t_fs = take * 0.42
    t_pip = take * 0.36
    t_end = take - t_fs - t_pip
    if t_end < 8:
        t_end = 0
        t_fs = take * 0.55
        t_pip = take - t_fs
    cursor = strip

    parts.append(render_fs(main, nxt(f"{label_prefix}_{artist}_fs"), t_fs, ss_abs=cursor))
    cursor += t_fs

    b = pick_broll(broll_pool, used_broll, era="night" if prefer_night else "early")
    if b is None:
        b = pick_broll(broll_pool, used_broll)
    if b:
        corner = "br" if hash(artist) % 2 == 0 else "tl"
        parts.append(
            render_float_pip(
                main, b, nxt(f"{label_prefix}_{artist}_pip"), t_pip, corner, ss_main=cursor
            )
        )
    else:
        # no free B-roll → Video-in-Video (fake multi-cam), never second plain FS of same hero
        parts.append(
            render_center_pip(
                main, main, nxt(f"{label_prefix}_{artist}_viv"), t_pip, 0.88,
                ss_main=cursor, ss_over=cursor,
            )
        )
    cursor += t_pip

    if t_end >= 8:
        b2 = pick_broll(broll_pool, used_broll)
        vs = min(14.0, t_end)
        if b2 and prefer_night:
            parts.append(
                render_vsplit(main, b2, nxt(f"{label_prefix}_{artist}_vs"), vs, ss_a=cursor)
            )
            rem = t_end - vs
            if rem >= 6:
                # residual as float PiP over advancing main — avoid long FS tail repeats
                b3 = pick_broll(broll_pool, used_broll)
                if b3:
                    parts.append(
                        render_float_pip(
                            main, b3, nxt(f"{label_prefix}_{artist}_out"), rem, "tr",
                            ss_main=cursor + vs,
                        )
                    )
                else:
                    parts.append(
                        render_center_pip(
                            main, main, nxt(f"{label_prefix}_{artist}_out"), rem, 0.90,
                            ss_main=cursor + vs, ss_over=cursor + vs,
                        )
                    )
        elif b2:
            parts.append(
                render_center_pip(
                    main, b2, nxt(f"{label_prefix}_{artist}_cen"), t_end, 0.93, ss_main=cursor
                )
            )
        else:
            parts.append(
                render_center_pip(
                    main, main, nxt(f"{label_prefix}_{artist}_viv2"), t_end, 0.90,
                    ss_main=cursor, ss_over=cursor,
                )
            )


def main() -> int:
    WORK_D.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    print("catalog…", flush=True)
    rows = list_proxies()
    d850 = [r for r in rows if r["camera"] == "D850"]
    guests = [r for r in rows if r["camera"] in ("GUEST", "PHONE")]
    z_early = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "early"]
    crowd = [r for r in rows if r["artist"] in ("Event_Broll", "Guest_Broll") or "GUEST" in r["path"].name.upper()]
    broll_early = d850 + [r for r in z_early if r["artist"] == "Event_Broll"] + guests[:20]
    broll_night = [r for r in guests if r["era"] == "night"] + crowd + d850

    parts: list[Path] = []
    n = 0
    used_main: set[str] = set()
    used_broll: set[str] = set()

    def nxt(label: str) -> Path:
        nonlocal n
        n += 1
        return WORK_D / f"{n:03d}_{label}.mp4"

    # INTRO
    print("INTRO", flush=True)
    cdf, stages = INTRO / "01_circle_d_flow_presents.png", INTRO / "02_circle_d_stages.png"
    if cdf.exists():
        parts.append(pill_still(crop_intro_png(cdf, WORK_D / "cdf.png"), nxt("cdf"), 2.0, 0.70))
    if stages.exists():
        parts.append(pill_still(crop_intro_png(stages, WORK_D / "stages.png"), nxt("stages"), 2.2, 0.78))

    # ARRIVAL outdoor — short fluid, no long dumps
    print("ARRIVAL", flush=True)
    for dsc, take, pref in ((918, 10.0, 0.1), (919, 12.0, 0.15), (920, 6.0, 0.1), (921, 14.0, 0.08)):
        hit = next((r for r in z_early if r["dsc"] == dsc), None)
        if not hit:
            continue
        key = path_key(hit["path"])
        if key in used_main:
            continue
        used_main.add(key)
        c = as_clip(hit["path"])
        if dsc == 919:
            rene = FT / "GUEST_RENE_IMG_8180.mov"
            if rene.exists():
                claim_path(rene, used_broll)
                parts.append(render_center_pip(c, as_clip(rene), nxt("arr_nest"), min(take, 8.0), 0.93))
                continue
        parts.append(render_fs(c, nxt(f"arr_{dsc}"), take, pref))

    # Title on FRESH unused early roll — never replay DSC_921 as FS
    title_bg = pick_unused_row(z_early, used_main, min_dur=5.0)
    if title_bg is None:
        title_bg = pick_unused_row(broll_early, used_broll, min_dur=5.0)
    if title_bg is None:
        title_bg = as_clip(next(r["path"] for r in z_early))
    tr = render_fs(title_bg, nxt("title_raw"), 3.5, 0.2)
    parts.append(burn(tr, nxt("title"), [("WAKO KUNGO", "brush"), ("LIVE IN LAPA71", "gold")]))

    # EARLY HEROES
    print("EARLY HEROES", flush=True)
    for artist, take in EARLY_HEROES:
        hero_block(artist, take, False, used_main, broll_early, used_broll, nxt, parts, "early")

    exp_bg = pick_unused_row(broll_early + crowd, used_broll, min_dur=3.0) or title_bg
    parts.append(render_text_break("EXPERIENCE.", nxt("experience"), 1.5, exp_bg))

    # Comfort bridge — main + guest PiP (never self-over-self unless last resort)
    c922 = next((r for r in z_early if r["dsc"] == 922), None)
    if c922 and path_key(c922["path"]) not in used_main:
        used_main.add(path_key(c922["path"]))
        over = pick_broll(broll_early, used_broll) or pick_broll(guests, used_broll)
        if over:
            raw = render_center_pip(as_clip(c922["path"]), over, nxt("comfort_raw"), 8.0, 0.90)
        else:
            raw = render_center_pip(
                as_clip(c922["path"]), as_clip(c922["path"]), nxt("comfort_raw"), 8.0, 0.90,
                ss_main=0.5, ss_over=0.5,
            )
        parts.append(burn(raw, nxt("comfort"), [("Make yourself comfortable and enjoy the flow!", "body")]))

    # René energy bridge (guest only once each)
    print("RENE BRIDGE", flush=True)
    for a, b, lab in (
        ("8184", "8185", "rene_vs"),
        ("8186", "8187", "rene_ab"),
    ):
        pa, pb = FT / f"GUEST_RENE_IMG_{a}.mov", FT / f"GUEST_RENE_IMG_{b}.mov"
        if pa.exists() and pb.exists():
            claim_path(pa, used_broll)
            claim_path(pb, used_broll)
            parts.append(render_vsplit(as_clip(pa), as_clip(pb), nxt(lab), 4.0))
    r90 = FT / "GUEST_RENE_IMG_8190.mov"
    if r90.exists():
        claim_path(r90, used_broll)
        rene_base = pick_unused_row(broll_early + d850, used_broll, min_dur=5.0) or title_bg
        parts.append(render_float_pip(rene_base, as_clip(r90), nxt("rene_float"), 5.0, "br"))

    nob_bg = pick_unused_row(broll_night + crowd + d850, used_broll, min_dur=3.0) or title_bg
    parts.append(render_text_break("NOBODY CREATES ALONE.", nxt("nobody"), 1.6, nob_bg))

    # NIGHT HEROES — all artists, fluid PiP language
    print("NIGHT HEROES", flush=True)
    for artist, take in NIGHT_HEROES:
        hero_block(artist, take, True, used_main, broll_night, used_broll, nxt, parts, "night")

    # Peak / jam / statements — each source once; second angles only as PiP/ViV
    print("OUTRO", flush=True)
    night_z = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "night"]
    peak_row = next((r for r in night_z if path_key(r["path"]) not in used_main), None)
    peak_clip = None
    if peak_row:
        used_main.add(path_key(peak_row["path"]))
        peak_clip = as_clip(peak_row["path"])
        parts.append(render_fs(peak_clip, nxt("peak_fs"), 45.0, 0.35))

    jam_candidates = sorted(
        [p for p in FT.glob("GUEST_CHRIS_*.mp4") if path_key(p) not in used_broll],
        key=lambda p: p.name,
    )
    jam_ok: list[Path] = []
    for p in jam_candidates:
        if len(jam_ok) >= 3:
            break
        claim_path(p, used_broll)
        jam_ok.append(p)
    if len(jam_ok) >= 2:
        parts.append(
            render_float_pip(as_clip(jam_ok[0]), as_clip(jam_ok[1]), nxt("jam_pip"), 18.0, "tr")
        )
        if len(jam_ok) >= 3:
            parts.append(render_vsplit(as_clip(jam_ok[1]), as_clip(jam_ok[2]), nxt("jam_vs"), 12.0))
        else:
            extra = next((p for p in jam_candidates if path_key(p) not in used_broll), None)
            if extra:
                claim_path(extra, used_broll)
                parts.append(render_vsplit(as_clip(jam_ok[0]), as_clip(extra), nxt("jam_vs"), 12.0))

    breath = pick_unused_row(broll_night + crowd, used_broll, min_dur=8.0)
    if breath:
        parts.append(render_fs(breath, nxt("breath"), 20.0, 0.3))

    come_bg = pick_unused_row(broll_night + d850 + crowd, used_broll, min_dur=5.0)
    if come_bg is None:
        come_bg = pick_unused_row(guests, used_broll, min_dur=5.0)
    if come_bg:
        come = render_fs(come_bg, nxt("come_raw"), 5.0, 0.4)
        parts.append(burn(come, nxt("come"), [("COME AS YOU ARE.", "brush")]))

    brand_bg = pick_unused_row(broll_night + crowd + d850, used_broll, min_dur=4.0)
    if brand_bg is None:
        brand_bg = pick_unused_row(guests, used_broll, min_dur=4.0)
    if brand_bg:
        brand = render_fs(brand_bg, nxt("brand_raw"), 4.0, 0.5)
        parts.append(burn(brand, nxt("brand"), [(BRAND, "gold")]))
    elif peak_clip is not None:
        g = pick_broll(guests, used_broll)
        if g:
            brand = render_float_pip(peak_clip, g, nxt("brand_raw"), 4.0, "br", prefer_main=0.8)
            parts.append(burn(brand, nxt("brand"), [(BRAND, "gold")]))

    artists = [
        "Zema", "Mr Isaac", "Maryna Vadini", "Arif / @eskalahonthebeat",
        "Ana", "Elisa", "Leonnardo Melo", "Humble", "Manu", "Arpanito",
        "René (guest)", "Circle D Flow · Lapa71",
    ]
    parts.append(credits_card(artists, nxt("credits"), 18.0))

    print(f"xfade {len(parts)} parts", flush=True)
    body = WORK_D / "full_aftermovie_body.mp4"
    xfade(parts, body)
    dur = probe_dur(body)

    final = OUT / "Lapa71_TagusDropRhythm_Aftermovie_FULL_YouTube_16x9.mp4"
    alias = OUT.parent / "YouTube" / "Lapa71_TagusDropRhythm_YouTube_16x9.mp4"
    alias.parent.mkdir(parents=True, exist_ok=True)
    print(f"body {dur/60:.1f} min - final encode", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(body),
        "-vf", f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.0, dur-1.4):.2f}:d=1.3,format=yuv420p",
        "-af", f"afade=t=in:st=0:d=0.25,afade=t=out:st={max(0.0, dur-1.4):.2f}:d=1.3",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(final),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(final), "-c", "copy", str(alias)])

    masters = Path(r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\YouTube")
    masters.mkdir(parents=True, exist_ok=True)
    master = masters / "Lapa71_TagusDropRhythm_YouTube_MASTER_16x9.mp4"
    print("master CRF18…", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(final),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-threads", THREADS,
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
        str(master),
    ])

    meta = {
        "title": "Tagus Drop Rhythm — Full Cinematic Aftermovie",
        "brand": BRAND,
        "duration_sec": probe_dur(final),
        "artists_early": [a for a, _ in EARLY_HEROES],
        "artists_night": [a for a, _ in NIGHT_HEROES],
        "rules": [
            "no_mainroll_reuse",
            "no_fullscreen_clip_replay",
            "hero_highlight_fluid_aftermovie",
            "sequential_windows_no_time_overlap",
            "pip_viv_instead_of_repeat",
            "tod_locked_phases",
            "credits_abspann",
            "target_gt_30min",
        ],
        "output": str(final),
        "master": str(master),
        "previous_master_sec": 1121.8,
        "v1_body_sec": 914.12,
    }
    (OUT / "full_aftermovie_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {final} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
