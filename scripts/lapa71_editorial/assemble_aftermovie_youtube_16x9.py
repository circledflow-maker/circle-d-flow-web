#!/usr/bin/env python3
"""Full YouTube 16:9 Cinematic Festival Aftermovie — Lapa71 / Wako Kungo.

EDIT THE EVENT — not isolated clips.
Z50II = story backbone · D850 = detail · Phone/Guest = raw energy
Layouts rotate: FS → float PiP → center PiP → v/h split → 3-way (peaks) → text break

Phases (time-of-day locked):
  1 ARRIVAL outdoor afternoon
  2 TITLE + jam with B-roll match
  3 GROOVE multi-cam + EXPERIENCE
  4 BUILD people + NOBODY CREATES ALONE
  5 NIGHT performances with rotating layouts
  6 PEAK energy
  7 BREATH + COME AS YOU ARE + brand + credits
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import BRAND, INTRO, OUT, WORK  # noqa: E402
from media import list_proxies  # noqa: E402
from assemble_chronological_youtube import (  # noqa: E402
    crop_intro_png,
    credits_card,
    probe_dur,
)

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    Image = None  # type: ignore

FT = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes")
WORK_D = WORK / "aftermovie_yt16"
W, H = 1920, 1080
THREADS = "1"
FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
NEST = 0.94


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1600:])


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:").replace("%", "\\%")


def grade() -> str:
    return "eq=contrast=1.07:brightness=0.012:saturation=0.97:gamma=1.03,hqdn3d=1.0:0.7:1.8:1.2"


def vf_fs() -> str:
    return (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},setsar=1,{grade()},fps=25,format=yuv420p"
    )


def af() -> str:
    return (
        "aformat=sample_rates=48000:channel_layouts=stereo,"
        "highpass=f=70,lowpass=f=14500,"
        "loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.95"
    )


def has_audio(path: Path) -> bool:
    try:
        out = subprocess.check_output(
            ["ffprobe", "-v", "error", "-select_streams", "a:0",
             "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(path)],
            text=True,
        ).strip()
        return bool(out)
    except Exception:
        return False


def enc() -> list[str]:
    return ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-threads", THREADS]


def ensure_1080(src: Path) -> Path:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width", "-of", "csv=p=0", str(src)],
        text=True,
    ).strip()
    try:
        iw = int(out.split(",")[0] or 1920)
    except ValueError:
        iw = 1920
    if iw <= 1920:
        return src
    dest = WORK_D / f"_s1080_{src.stem}.mp4"
    if dest.exists() and dest.stat().st_size > 80_000:
        return dest
    print(f"  scale1080 {src.name}", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(src),
        "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=25,format=yuv420p",
        "-af", "aformat=sample_rates=48000:channel_layouts=stereo",
        *enc(), "-c:a", "aac", "-b:a", "128k", "-shortest", str(dest),
    ])
    return dest


def clip_from(path: Path) -> dict:
    p = ensure_1080(path)
    return {"path": p, "duration": probe_dur(p)}


def ss_of(c: dict, prefer: float, take: float) -> float:
    d = float(c["duration"])
    take = min(take, max(0.5, d - 0.1))
    return max(0.0, min(d - take - 0.05, d * prefer))


def render_fs(c: dict, out: Path, take: float, prefer: float = 0.25, mute: bool = False) -> Path:
    if out.exists() and out.stat().st_size > 60_000:
        return out
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss_of(c, prefer, take):.2f}", "-t", f"{take:.2f}", "-i", str(c["path"]),
    ]
    if mute:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
    cmd += ["-vf", vf_fs(), *enc()]
    if mute:
        cmd += ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        cmd += ["-af", af(), "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    cmd.append(str(out))
    run(cmd)
    return out


def render_center_pip(main: dict, over: dict, out: Path, take: float, scale: float = NEST) -> Path:
    if out.exists() and out.stat().st_size > 60_000:
        return out
    ow, oh = int(W * scale) // 2 * 2, int(H * scale) // 2 * 2
    ox, oy = (W - ow) // 2, (H - oh) // 2
    box = (
        f"scale={ow}:{oh}:force_original_aspect_ratio=increase,"
        f"crop={ow}:{oh},setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={ow}:h={oh}:color=white@0.25:t=2"
    )
    fc = f"[0:v]{vf_fs()}[base];[1:v]{box}[p];[base][p]overlay={ox}:{oy}[v]"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss_of(main, 0.3, take):.2f}", "-t", f"{take:.2f}", "-i", str(main["path"]),
        "-ss", f"{ss_of(over, 0.35, take):.2f}", "-t", f"{take:.2f}", "-i", str(over["path"]),
        "-filter_complex", fc, "-map", "[v]", "-map", "0:a", "-af", af(),
        *enc(), "-c:a", "aac", "-b:a", "192k", "-shortest", str(out),
    ])
    return out


def render_float_pip(main: dict, over: dict, out: Path, take: float, corner: str = "br") -> Path:
    if out.exists() and out.stat().st_size > 60_000:
        return out
    pw, ph = 480, 270
    pos = {
        "br": (W - pw - 64, H - ph - 56),
        "tr": (W - pw - 64, 56),
        "tl": (64, 56),
        "bl": (64, H - ph - 56),
    }
    mx, my = pos.get(corner, pos["br"])
    pip = (
        f"scale={pw}:{ph}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph},setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={pw}:h={ph}:color=white@0.3:t=2"
    )
    fc = f"[0:v]{vf_fs()}[base];[1:v]{pip}[p];[base][p]overlay={mx}:{my}[v]"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss_of(main, 0.28, take):.2f}", "-t", f"{take:.2f}", "-i", str(main["path"]),
        "-ss", f"{ss_of(over, 0.4, take):.2f}", "-t", f"{take:.2f}", "-i", str(over["path"]),
        "-filter_complex", fc, "-map", "[v]", "-map", "0:a", "-af", af(),
        *enc(), "-c:a", "aac", "-b:a", "192k", "-shortest", str(out),
    ])
    return out


def render_vsplit(a: dict, b: dict, out: Path, take: float) -> Path:
    if out.exists() and out.stat().st_size > 60_000:
        return out
    hw = W // 2
    cell = f"scale={hw}:{H}:force_original_aspect_ratio=increase,crop={hw}:{H},setsar=1,fps=25,format=yuv420p"
    fc = f"[0:v]{cell}[L];[1:v]{cell}[R];[L][R]hstack=inputs=2[v]"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss_of(a, 0.3, take):.2f}", "-t", f"{take:.2f}", "-i", str(a["path"]),
        "-ss", f"{ss_of(b, 0.35, take):.2f}", "-t", f"{take:.2f}", "-i", str(b["path"]),
    ]
    if not has_audio(a["path"]):
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
        amap = ["-map", "[v]", "-map", "2:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        amap = ["-map", "[v]", "-map", "0:a", "-af", af(), "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-filter_complex", fc, *amap, *enc(), str(out)]
    run(cmd)
    return out


def render_hsplit(top: dict, bot: dict, out: Path, take: float) -> Path:
    if out.exists() and out.stat().st_size > 60_000:
        return out
    hh = H // 2
    cell = f"scale={W}:{hh}:force_original_aspect_ratio=increase,crop={W}:{hh},setsar=1,fps=25,format=yuv420p"
    fc = f"[0:v]{cell}[T];[1:v]{cell}[B];[T][B]vstack=inputs=2[v]"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss_of(top, 0.25, take):.2f}", "-t", f"{take:.2f}", "-i", str(top["path"]),
        "-ss", f"{ss_of(bot, 0.45, take):.2f}", "-t", f"{take:.2f}", "-i", str(bot["path"]),
    ]
    if not has_audio(top["path"]):
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
        amap = ["-map", "[v]", "-map", "2:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        amap = ["-map", "[v]", "-map", "0:a", "-af", af(), "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-filter_complex", fc, *amap, *enc(), str(out)]
    run(cmd)
    return out


def render_three(a: dict, b: dict, c: dict, out: Path, take: float = 1.8) -> Path:
    if out.exists() and out.stat().st_size > 60_000:
        return out
    take = min(take, 2.0)
    cw = (W // 3) // 2 * 2
    cell = f"scale={cw}:{H}:force_original_aspect_ratio=increase,crop={cw}:{H},setsar=1,fps=25,format=yuv420p"
    fc = f"[0:v]{cell}[A];[1:v]{cell}[B];[2:v]{cell}[C];[A][B][C]hstack=inputs=3[v]"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss_of(a, 0.35, take):.2f}", "-t", f"{take:.2f}", "-i", str(a["path"]),
        "-ss", f"{ss_of(b, 0.4, take):.2f}", "-t", f"{take:.2f}", "-i", str(b["path"]),
        "-ss", f"{ss_of(c, 0.3, take):.2f}", "-t", f"{take:.2f}", "-i", str(c["path"]),
    ]
    if not has_audio(a["path"]):
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
        amap = ["-map", "[v]", "-map", "3:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        amap = ["-map", "[v]", "-map", "0:a", "-af", af(), "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-filter_complex", fc, *amap, *enc(), str(out)]
    run(cmd)
    return out


def render_text_break(word: str, out: Path, dur: float, bg: dict) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draw = (
        f"drawtext=fontfile='{FONT_B}':text='{esc(word)}':fontsize=72:"
        f"fontcolor=white:borderw=3:bordercolor=black@0.55:"
        f"x=(w-text_w)/2:y=(h-text_h)/2"
    )
    vf = f"{vf_fs()},eq=brightness=-0.32:saturation=0.65,{draw}"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss_of(bg, 0.5, dur):.2f}", "-t", f"{dur:.2f}", "-i", str(bg["path"]),
        "-vf", vf, "-af", "volume=0.18," + af(),
        *enc(), "-c:a", "aac", "-b:a", "192k", str(out),
    ])
    return out


def burn(src: Path, out: Path, lines: list[tuple[str, str]]) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draws = []
    y0 = 820 if len(lines) <= 2 else 760
    for i, (text, role) in enumerate(lines):
        fs, color, font = (
            (56, "white", FONT_B) if role == "brush" else
            (36, "#E8C547", FONT_B) if role == "gold" else
            (48, "white", FONT_B) if role == "title" else
            (28, "white@0.92", FONT_R)
        )
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(text)}':fontsize={fs}:"
            f"fontcolor={color}:borderw=2:bordercolor=black@0.5:"
            f"x=(w-text_w)/2:y={y0 + i * 60}"
        )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(src), "-vf", ",".join(draws), *enc(), "-c:a", "copy", str(out),
    ])
    return out


def pill_still(img: Path, out: Path, sec: float, scale: float = 0.72) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
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


def xfade(parts: list[Path], out: Path, fade: float = 0.22) -> Path:
    if len(parts) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(parts[0]), "-c", "copy", str(out)])
        return out
    batch = 8
    current = parts
    round_i = 0
    while len(current) > 1:
        nxt: list[Path] = []
        for i in range(0, len(current), batch):
            chunk = current[i:i + batch]
            cout = out.parent / f"_ytxf_r{round_i}_{i}.mp4"
            if len(chunk) == 1:
                nxt.append(chunk[0])
                continue
            if cout.exists() and cout.stat().st_size > 100_000:
                try:
                    if probe_dur(cout) > 1:
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


def by_dsc(rows: list[dict]) -> dict[int, dict]:
    return {r["dsc"]: r for r in rows if r.get("dsc", 10**9) < 10**9}


def main() -> int:
    WORK_D.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for bad in WORK_D.glob("*.mp4"):
        if bad.stat().st_size < 30_000 and not bad.name.startswith("_"):
            bad.unlink(missing_ok=True)

    print("catalog Full_Takes…", flush=True)
    rows = list_proxies()
    dsc = by_dsc(rows)
    z_e = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "early"]
    z_n = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "night"]
    d850 = [r for r in rows if r["camera"] == "D850"]
    guests = [r for r in rows if r["camera"] in ("GUEST", "PHONE") and r["era"] == "night"]
    chris = [g for g in guests if "CHRIS" in g["path"].name.upper()]
    rene = [g for g in guests if "RENE" in g["path"].name.upper()]
    phone = [g for g in guests if g["camera"] == "PHONE"]

    def D(n: int, fb: list[dict], i: int = 0) -> dict:
        return dsc.get(n) or fb[min(i, len(fb) - 1)]

    parts: list[Path] = []
    n = 0

    def nxt(label: str) -> Path:
        nonlocal n
        n += 1
        return WORK_D / f"{n:03d}_{label}.mp4"

    # Intro cards
    print("INTRO", flush=True)
    cdf = INTRO / "01_circle_d_flow_presents.png"
    stages = INTRO / "02_circle_d_stages.png"
    if cdf.exists():
        parts.append(pill_still(crop_intro_png(cdf, WORK_D / "cdf.png"), nxt("cdf"), 2.0, 0.70))
    if stages.exists():
        parts.append(pill_still(crop_intro_png(stages, WORK_D / "stages.png"), nxt("stages"), 2.2, 0.78))

    # PHASE 1 ARRIVAL
    print("PHASE1 ARRIVAL", flush=True)
    a918, a919, a920 = D(918, z_e, 0), D(919, z_e, 1), D(920, z_e, 2)
    parts.append(render_fs(a918, nxt("arr_fs"), 8.0, 0.1))
    r8180 = ensure_1080(FT / "GUEST_RENE_IMG_8180.mov")
    parts.append(render_center_pip(a919, {"path": r8180, "duration": probe_dur(r8180)}, nxt("arr_nest"), 7.0))
    parts.append(render_fs(a920, nxt("arr_920"), 4.0, 0.1))

    # PHASE 2 TITLE + JAM + D850 PiP
    print("PHASE2 JAM", flush=True)
    a921 = D(921, z_e, 3)
    title_raw = render_fs(a921, nxt("title_raw"), 3.0, 0.05)
    parts.append(burn(title_raw, nxt("title"), [("WAKO KUNGO", "brush"), ("LIVE IN LAPA71", "gold")]))
    d0 = d850[0] if d850 else a921
    parts.append(render_float_pip(a921, d0, nxt("jam_float"), 12.0, "br"))
    parts.append(render_center_pip(a921, d850[1] if len(d850) > 1 else d0, nxt("jam_center"), 10.0, 0.92))

    # PHASE 3 GROOVE + EXPERIENCE
    print("PHASE3 GROOVE", flush=True)
    a922, a923 = D(922, z_e, 4), D(923, z_e, 5)
    c0 = chris[0] if chris else (phone[0] if phone else a922)
    parts.append(render_vsplit(a922, c0, nxt("groove_vs"), 6.0))
    parts.append(render_hsplit(a923, d850[-1] if d850 else a922, nxt("groove_hs"), 6.0))
    parts.append(render_text_break("EXPERIENCE.", nxt("experience"), 1.4, a923))
    parts.append(render_fs(a923, nxt("groove_fs"), 14.0, 0.15))

    # Comfort nested silent-ish + Arif
    print("PHASE3b ARIF", flush=True)
    comfort = render_center_pip(a922, a922, nxt("comfort_raw"), 8.0, 0.90)
    parts.append(burn(comfort, nxt("comfort"), [("Make yourself comfortable and enjoy the flow!", "body")]))
    arif = dsc.get(912) or D(912, z_e, 2)
    # 912 is early Arif
    arif_p = next((r for r in rows if "0912" in r["path"].name and "Arif" in r["path"].name), None)
    if arif_p is None:
        arif_p = next((r for r in rows if r["dsc"] == 912), a921)
    arif_raw = render_fs(arif_p, nxt("arif_raw"), 28.0, 0.08)
    parts.append(burn(arif_raw, nxt("arif"), [("@eskalahonthebeat", "gold")]))

    # PHASE 4 René multi + CONNECT moment
    print("PHASE4 RENE / PEOPLE", flush=True)
    r84 = ensure_1080(FT / "GUEST_RENE_IMG_8184.mov")
    r85 = ensure_1080(FT / "GUEST_RENE_IMG_8185.mov")
    r86 = ensure_1080(FT / "GUEST_RENE_IMG_8186.mov")
    r87 = ensure_1080(FT / "GUEST_RENE_IMG_8187.mov")
    r90 = ensure_1080(FT / "GUEST_RENE_IMG_8190.mov")
    rd = lambda p: {"path": p, "duration": probe_dur(p)}
    parts.append(render_vsplit(rd(r84), rd(r85), nxt("rene_vs"), 4.5))
    parts.append(render_three(rd(r86), rd(r87), rd(r90), nxt("rene_3"), 1.8))
    parts.append(render_center_pip(a923, rd(ensure_1080(FT / "GUEST_RENE_IMG_8189.mov")), nxt("rene_pip"), 5.0))
    parts.append(render_text_break("NOBODY CREATES ALONE.", nxt("nobody"), 1.5, a923))

    # Greeting short
    a928, a925 = D(928, z_e, 6), D(925, z_e, 5)
    g1 = render_fs(a928, nxt("greet1_raw"), 8.0, 0.1, mute=True)
    parts.append(burn(g1, nxt("greet1"), [("Happy to see you — love & appreciation", "body")]))
    parts.append(render_fs(a925, nxt("greet2"), 5.0, 0.1, mute=True))

    # PHASE 5 NIGHT — rotating layouts on performances
    print("PHASE5 NIGHT", flush=True)
    night_mains = [D(d, z_n, i) for i, d in enumerate([1493, 1497, 1498, 1499, 1500, 1501, 1503, 1505])]
    layouts = ["fs", "float", "vs", "fs", "center", "hs", "fs", "three", "float", "fs"]
    for i, main in enumerate(night_mains):
        broll = chris[i % len(chris)] if chris else (rene[i % len(rene)] if rene else main)
        detail = d850[i % len(d850)] if d850 else broll
        take = min(42.0, max(18.0, main["duration"] * 0.35))
        label = f"night_{main['dsc']}"
        mode = layouts[i % len(layouts)]
        print(f"  {label} layout={mode} take={take:.0f}", flush=True)
        if mode == "fs":
            parts.append(render_fs(main, nxt(label), take, 0.12))
        elif mode == "float":
            parts.append(render_float_pip(main, broll, nxt(label), min(take, 28), "br" if i % 2 == 0 else "tl"))
        elif mode == "center":
            parts.append(render_center_pip(main, detail, nxt(label), min(take, 24), 0.92))
        elif mode == "vs":
            parts.append(render_vsplit(main, broll, nxt(label), min(take, 20)))
        elif mode == "hs":
            parts.append(render_hsplit(main, detail, nxt(label), min(take, 18)))
        else:
            parts.append(render_three(main, broll, detail, nxt(label), 1.8))
            parts.append(render_fs(main, nxt(label + "_hero"), min(take - 2, 30), 0.2))

    # PHASE 6 PEAK text + breath
    print("PHASE6 OUTRO", flush=True)
    peak = night_mains[1]
    parts.append(render_three(
        peak,
        chris[2] if len(chris) > 2 else peak,
        phone[0] if phone else peak,
        nxt("peak_3"), 1.8,
    ))
    parts.append(render_fs(peak, nxt("peak_fs"), 20.0, 0.4))
    breath = phone[1] if len(phone) > 1 else (chris[-1] if chris else peak)
    parts.append(render_fs(breath, nxt("breath"), 10.0, 0.3))
    come_raw = render_fs(night_mains[0], nxt("come_raw"), 6.0, 0.6)
    parts.append(burn(come_raw, nxt("come"), [("COME AS YOU ARE.", "brush")]))
    brand_raw = render_fs(night_mains[-1], nxt("brand_raw"), 4.0, 0.7)
    parts.append(burn(brand_raw, nxt("brand"), [(BRAND, "gold")]))

    artists = ["Maryna Vadini", "Arif / @eskalahonthebeat", "Arpanito", "Zema", "Mr Isaac",
               "Leonnardo Melo", "Ana", "Elisa", "René (guest)"]
    parts.append(credits_card(artists, nxt("credits"), 12.0))

    print(f"xfade {len(parts)} parts", flush=True)
    body = WORK_D / "aftermovie_yt_body.mp4"
    xfade(parts, body)
    dur = probe_dur(body)
    final = OUT / "Lapa71_TagusDropRhythm_Aftermovie_YouTube_16x9.mp4"
    alias = OUT.parent / "YouTube" / "Lapa71_TagusDropRhythm_YouTube_16x9.mp4"
    alias.parent.mkdir(parents=True, exist_ok=True)
    print(f"body {dur/60:.1f} min - final", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(body),
        "-vf", f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.0, dur-1.3):.2f}:d=1.2,format=yuv420p",
        "-af", f"afade=t=in:st=0:d=0.25,afade=t=out:st={max(0.0, dur-1.3):.2f}:d=1.2",
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
        "title": "Tagus Drop Rhythm — Cinematic Festival Aftermovie YouTube",
        "brand": BRAND,
        "duration_sec": probe_dur(final),
        "source_pool": "Full_Takes",
        "analyzed_previous_master_sec": 1121.8,
        "optimization": [
            "time_of_day_phases",
            "z50_backbone_broll_matching",
            "rotating_layouts_fs_pip_split_3way",
            "editorial_text_breaks",
            "music_led_mainroll_audio",
        ],
        "statements": ["EXPERIENCE.", "NOBODY CREATES ALONE.", "COME AS YOU ARE."],
        "output": str(final),
        "master": str(master),
    }
    (OUT / "aftermovie_youtube_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {final} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
