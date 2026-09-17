#!/usr/bin/env python3
"""Cinematic Festival Aftermovie 30s — Wako Kungo × Circle.D.Flow / Lapa71.

DO NOT EDIT CLIPS IN ISOLATION. EDIT THE EVENT.
Viewer must feel physically present at Lapa71.

Visual rotation (music-motivated):
  FULLSCREEN → CENTER PiP → FULLSCREEN → V-SPLIT → H-SPLIT →
  FLOAT PiP → 3-WAY (1–2s peaks only) → TEXT BREAK → FULLSCREEN

Camera: Z50II = story backbone · D850 = cinematic detail · Phone/Guest = raw energy
Time: early outdoor → title → jam → night energy → breath → brand
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import BRAND, OUT, PROXIES, REEL_OUT, WORK  # noqa: E402
from media import list_proxies  # noqa: E402

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
W, H = 1080, 1920  # 9:16
TARGET = 30.0
THREADS = "1"


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1600:])


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:").replace("%", "\\%")


def grade() -> str:
    return "eq=contrast=1.08:brightness=0.015:saturation=0.96:gamma=1.03,hqdn3d=1.0:0.7:1.8:1.2"


def vf_fs(crop: str = "center") -> str:
    if crop == "hands":
        sc = f"scale={int(W*1.55)}:{int(H*1.55)}:force_original_aspect_ratio=increase"
        cr = f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.55"
    elif crop == "face":
        sc = f"scale={int(W*1.5)}:{int(H*1.5)}:force_original_aspect_ratio=increase"
        cr = f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.18"
    elif crop == "wide":
        sc = f"scale={W}:{H}:force_original_aspect_ratio=increase"
        cr = f"crop={W}:{H}"
    else:
        sc = f"scale={int(W*1.28)}:{int(H*1.28)}:force_original_aspect_ratio=increase"
        cr = f"crop={W}:{H}"
    return f"{sc},{cr},setsar=1,{grade()},fps=25,format=yuv420p"


def af_music() -> str:
    return (
        "aformat=sample_rates=48000:channel_layouts=stereo,"
        "highpass=f=70,lowpass=f=14500,"
        "loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.95"
    )


def enc() -> list[str]:
    return ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "19",
            "-pix_fmt", "yuv420p", "-threads", THREADS]


def pick(rows: list[dict]) -> dict:
    z_e = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "early" and not r.get("filler")]
    z_n = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "night" and not r.get("filler")]
    d850 = [r for r in rows if r["camera"] == "D850"]
    guests = [r for r in rows if r["camera"] in ("GUEST", "PHONE")]
    g_n = [g for g in guests if g["era"] == "night"]
    # Prefer known strong DSC beats from directed cut
    by_dsc = {r["dsc"]: r for r in rows if r.get("dsc", 10**9) < 10**9}

    def need(dsc: int, fallback: list[dict], i: int = 0) -> dict:
        if dsc in by_dsc:
            return by_dsc[dsc]
        return fallback[min(i, len(fallback) - 1)]

    arrival = [need(918, z_e, 0), need(919, z_e, 1), need(920, z_e, 2)]
    jam = need(921, z_e, 3)
    jam_pip = next((d for d in d850 if d["era"] == "early"), d850[0] if d850 else jam)
    night = [need(1497, z_n, 0), need(1493, z_n, 1), need(1498, z_n, 2), need(1500, z_n, 3)]
    crowd = [g for g in g_n if "CHRIS" in g["path"].name.upper()] or g_n
    rene = [g for g in g_n if "RENE" in g["path"].name.upper()] or g_n
    phone = [g for g in g_n if g["camera"] == "PHONE"] or g_n
    return {
        "arrival": arrival,
        "jam": jam,
        "jam_pip": jam_pip,
        "night": night,
        "crowd": crowd,
        "rene": rene,
        "phone": phone,
        "d850": d850,
        "z_n": z_n,
    }


def ss(clip: dict, prefer: float = 0.25, take: float = 2.0) -> float:
    d = float(clip["duration"])
    take = min(take, max(0.8, d - 0.15))
    return max(0.0, min(d - take - 0.05, d * prefer))


# ─── Layout renders ───────────────────────────────────────────────────────────

def render_fs(clip: dict, out: Path, take: float, prefer: float = 0.25, crop: str = "center",
              mute: bool = False) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-threads", THREADS,
        "-ss", f"{ss(clip, prefer, take):.2f}", "-t", f"{take:.2f}", "-i", str(clip["path"]),
    ]
    if mute:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
    cmd += ["-vf", vf_fs(crop), *enc()]
    if mute:
        cmd += ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        cmd += ["-af", af_music(), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
    cmd.append(str(out))
    run(cmd)
    return out


def render_center_pip(main: dict, over: dict, out: Path, take: float,
                      *, scale: float = 0.72, main_prefer: float = 0.3, over_prefer: float = 0.35) -> Path:
    """Background atmosphere + centered performance/detail (1cm-ish outline feel)."""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    ow = int(W * scale) // 2 * 2
    oh = int(H * scale) // 2 * 2
    ox, oy = (W - ow) // 2, (H - oh) // 2
    box = (
        f"scale={ow}:{oh}:force_original_aspect_ratio=increase,"
        f"crop={ow}:{oh},setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={ow}:h={oh}:color=white@0.28:t=2"
    )
    fc = (
        f"[0:v]{vf_fs('wide')}[base];"
        f"[1:v]{box}[pip];"
        f"[base][pip]overlay={ox}:{oy}[v]"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss(main, main_prefer, take):.2f}", "-t", f"{take:.2f}", "-i", str(main["path"]),
        "-ss", f"{ss(over, over_prefer, take):.2f}", "-t", f"{take:.2f}", "-i", str(over["path"]),
        "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
        "-af", af_music(), *enc(),
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def render_float_pip(main: dict, over: dict, out: Path, take: float, *, corner: str = "br") -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    pw, ph = 360, 560
    if corner == "br":
        mx, my = W - pw - 40, H - ph - 100
    elif corner == "tr":
        mx, my = W - pw - 40, 120
    elif corner == "tl":
        mx, my = 40, 120
    else:
        mx, my = 40, H - ph - 100
    pip = (
        f"scale={int(pw*1.4)}:{int(ph*1.4)}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph},setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={pw}:h={ph}:color=white@0.3:t=2"
    )
    fc = (
        f"[0:v]{vf_fs('center')}[base];"
        f"[1:v]{pip}[p];"
        f"[base][p]overlay={mx}:{my}[v]"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss(main, 0.28, take):.2f}", "-t", f"{take:.2f}", "-i", str(main["path"]),
        "-ss", f"{ss(over, 0.4, take):.2f}", "-t", f"{take:.2f}", "-i", str(over["path"]),
        "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
        "-af", af_music(), *enc(),
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def render_vsplit(a: dict, b: dict, out: Path, take: float) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    hw = W // 2
    cell = (
        f"scale={hw}:{H}:force_original_aspect_ratio=increase,"
        f"crop={hw}:{H},setsar=1,fps=25,format=yuv420p"
    )
    fc = f"[0:v]{cell}[L];[1:v]{cell}[R];[L][R]hstack=inputs=2[v]"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss(a, 0.3, take):.2f}", "-t", f"{take:.2f}", "-i", str(a["path"]),
        "-ss", f"{ss(b, 0.35, take):.2f}", "-t", f"{take:.2f}", "-i", str(b["path"]),
        "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
        "-af", af_music(), *enc(),
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def render_hsplit(top: dict, bot: dict, out: Path, take: float) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    hh = H // 2
    cell = (
        f"scale={W}:{hh}:force_original_aspect_ratio=increase,"
        f"crop={W}:{hh},setsar=1,fps=25,format=yuv420p"
    )
    fc = f"[0:v]{cell}[T];[1:v]{cell}[B];[T][B]vstack=inputs=2[v]"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss(top, 0.25, take):.2f}", "-t", f"{take:.2f}", "-i", str(top["path"]),
        "-ss", f"{ss(bot, 0.45, take):.2f}", "-t", f"{take:.2f}", "-i", str(bot["path"]),
        "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
        "-af", af_music(), *enc(),
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def render_three(a: dict, b: dict, c: dict, out: Path, take: float = 1.6) -> Path:
    """Peak-only 3 vertical panels — max ~1.6s."""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    take = min(take, 1.8)
    cw = (W // 3) // 2 * 2
    cell = (
        f"scale={cw}:{H}:force_original_aspect_ratio=increase,"
        f"crop={cw}:{H},setsar=1,fps=25,format=yuv420p"
    )
    fc = f"[0:v]{cell}[A];[1:v]{cell}[B];[2:v]{cell}[C];[A][B][C]hstack=inputs=3[v]"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-ss", f"{ss(a, 0.35, take):.2f}", "-t", f"{take:.2f}", "-i", str(a["path"]),
        "-ss", f"{ss(b, 0.4, take):.2f}", "-t", f"{take:.2f}", "-i", str(b["path"]),
        "-ss", f"{ss(c, 0.3, take):.2f}", "-t", f"{take:.2f}", "-i", str(c["path"]),
        "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
        "-af", af_music(), *enc(),
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def render_text_break(word: str, out: Path, dur: float = 1.0, bg: dict | None = None) -> Path:
    """Musical break: dark flash + editorial word."""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draw = (
        f"drawtext=fontfile='{FONT_B}':text='{esc(word)}':fontsize=78:"
        f"fontcolor=white:borderw=3:bordercolor=black@0.55:"
        f"x=(w-text_w)/2:y=(h-text_h)/2"
    )
    if bg is not None:
        vf = f"{vf_fs('wide')},eq=brightness=-0.35:saturation=0.7,{draw}"
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
            "-ss", f"{ss(bg, 0.5, dur):.2f}", "-t", f"{dur:.2f}", "-i", str(bg["path"]),
            "-vf", vf, "-af", "volume=0.15," + af_music(),
            *enc(), "-c:a", "aac", "-b:a", "192k",
            str(out),
        ])
    else:
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d={dur:.2f}:r=25",
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
            "-vf", draw, *enc(),
            "-c:a", "aac", "-b:a", "128k", "-shortest", "-t", f"{dur:.2f}",
            str(out),
        ])
    return out


def burn_overlay(src: Path, out: Path, lines: list[tuple[str, str]]) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draws = []
    y0 = 780 if len(lines) <= 2 else 700
    for i, (text, role) in enumerate(lines):
        if role == "brush":
            fs, color, font = 64, "white", FONT_B
        elif role == "gold":
            fs, color, font = 40, "#E8C547", FONT_B
        elif role == "title":
            fs, color, font = 70, "white", FONT_B
        else:
            fs, color, font = 34, "white@0.92", FONT_R
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(text)}':fontsize={fs}:"
            f"fontcolor={color}:borderw=2:bordercolor=black@0.5:"
            f"x=(w-text_w)/2:y={y0 + i * 72}"
        )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(src), "-vf", ",".join(draws),
        *enc(), "-c:a", "copy",
        str(out),
    ])
    return out


def concat_xfade(parts: list[Path], out: Path, fade: float = 0.12) -> Path:
    if len(parts) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(parts[0]), "-c", "copy", str(out)])
        return out
    # probe durs
    durs = []
    for p in parts:
        d = float(subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(p)], text=True).strip() or 0)
        durs.append(d)
    inputs: list[str] = []
    for p in parts:
        inputs += ["-i", str(p)]
    vfilters, afilters = [], []
    vlabel, alabel = "0:v", "0:a"
    acc = durs[0]
    for j in range(1, len(parts)):
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
    # chunk if too many
    if len(parts) > 12:
        mid = len(parts) // 2
        a = out.parent / "_am_half_a.mp4"
        b = out.parent / "_am_half_b.mp4"
        concat_xfade(parts[:mid], a, fade)
        concat_xfade(parts[mid:], b, fade)
        return concat_xfade([a, b], out, fade)
    fc = ";".join(vfilters + afilters)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        *inputs, "-filter_complex", fc,
        "-map", f"[{vlabel}]", "-map", f"[{alabel}]",
        *enc(), "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(out),
    ])
    return out


def build_parts(work: Path, pool: dict) -> list[tuple[str, Path]]:
    work.mkdir(parents=True, exist_ok=True)
    for old in work.glob("*.mp4"):
        if old.stat().st_size < 20_000:
            old.unlink(missing_ok=True)

    arr = pool["arrival"]
    jam, jam_pip = pool["jam"], pool["jam_pip"]
    night = pool["night"]
    crowd = pool["crowd"]
    rene = pool["rene"]
    phone = pool["phone"]
    d850 = pool["d850"]

    parts: list[tuple[str, Path]] = []
    n = 0

    def nxt(label: str) -> Path:
        nonlocal n
        n += 1
        return work / f"{n:02d}_{label}.mp4"

    # 0:00–0:03 ARRIVAL outdoor fullscreen micro-cuts
    print("ARRIVAL", flush=True)
    a1 = render_fs(arr[0], nxt("arr1"), 1.1, prefer=0.15, crop="wide")
    a2 = render_fs(arr[1], nxt("arr2"), 1.0, prefer=0.2, crop="center")
    a3 = render_fs(arr[min(2, len(arr)-1)], nxt("arr3"), 0.9, prefer=0.25, crop="wide")
    parts += [("arr1", a1), ("arr2", a2), ("arr3", a3)]

    # 0:03–0:05 TITLE
    print("TITLE", flush=True)
    title_raw = render_fs(arr[1], nxt("title_raw"), 2.0, prefer=0.4, crop="center")
    title = burn_overlay(title_raw, nxt("title"), [
        ("WAKO KUNGO", "brush"), ("LIVE IN LAPA71", "gold"),
    ])
    parts.append(("title", title))

    # 0:05–0:10 PERFORMANCE + float PiP detail then center PiP
    print("PERFORMANCE", flush=True)
    p_float = render_float_pip(jam, jam_pip, nxt("jam_float"), 2.5, corner="br")
    p_center = render_center_pip(
        jam, (d850[1] if len(d850) > 1 else jam_pip), nxt("jam_center"), 2.5, scale=0.74
    )
    parts += [("jam_float", p_float), ("jam_center", p_center)]

    # 0:10–0:13 MULTI-CAM splits
    print("MULTICAM", flush=True)
    n0 = night[0]
    c0 = crowd[0] if crowd else n0
    r0 = rene[0] if rene else c0
    vsp = render_vsplit(n0, c0, nxt("vsplit"), 1.5)
    hsp = render_hsplit(n0, (d850[-1] if d850 else r0), nxt("hsplit"), 1.5)
    parts += [("vsplit", vsp), ("hsplit", hsp)]

    # 0:13–0:14 BREAK EXPERIENCE
    print("EXPERIENCE", flush=True)
    parts.append(("exp", render_text_break("EXPERIENCE.", nxt("experience"), 1.0, bg=n0)))

    # 0:14–0:19 people / performance rotation
    print("PEOPLE", flush=True)
    n1 = night[1] if len(night) > 1 else n0
    c1 = crowd[1] if len(crowd) > 1 else c0
    ph = phone[0] if phone else r0
    parts.append(("fs_face", render_fs(n1, nxt("face"), 1.6, prefer=0.3, crop="face")))
    parts.append(("float_tl", render_float_pip(n1, ph, nxt("float_tl"), 1.6, corner="tl")))
    parts.append(("vsplit2", render_vsplit(n1, c1, nxt("vsplit2"), 1.8)))

    # 0:19–0:20 BREAK NOBODY CREATES ALONE
    print("NOBODY", flush=True)
    parts.append(("nobody", render_text_break("NOBODY CREATES ALONE.", nxt("nobody"), 1.0, bg=n1)))

    # 0:20–0:25 ENERGY PEAK
    print("PEAK", flush=True)
    n2 = night[2] if len(night) > 2 else n1
    c2 = crowd[2] if len(crowd) > 2 else c1
    r1 = rene[1] if len(rene) > 1 else r0
    parts.append(("peak_fs", render_fs(n2, nxt("peak_fs"), 1.2, prefer=0.35, crop="center")))
    parts.append(("peak_3", render_three(n2, c2, r1, nxt("peak_3"), take=1.5)))
    parts.append(("peak_pip", render_center_pip(n2, c2, nxt("peak_pip"), 1.3, scale=0.7)))
    parts.append(("peak_vs", render_vsplit(n2, r1, nxt("peak_vs"), 1.0)))

    # 0:25–0:27 BREATH venue
    print("BREATH", flush=True)
    breath_src = phone[1] if len(phone) > 1 else (crowd[-1] if crowd else n2)
    parts.append(("breath", render_fs(breath_src, nxt("breath"), 2.0, prefer=0.4, crop="wide")))

    # 0:27–0:29 COME AS YOU ARE + 0:29–0:30 brand
    print("PAYOFF", flush=True)
    pay_raw = render_fs(n0, nxt("pay_raw"), 2.0, prefer=0.55, crop="face")
    pay = burn_overlay(pay_raw, nxt("pay"), [("COME AS YOU ARE.", "brush")])
    parts.append(("pay", pay))
    brand_raw = render_fs(n1, nxt("brand_raw"), 1.2, prefer=0.7, crop="wide")
    brand = burn_overlay(brand_raw, nxt("brand"), [(BRAND, "gold")])
    parts.append(("brand", brand))

    return parts


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    REEL_OUT.mkdir(parents=True, exist_ok=True)
    work = WORK / "aftermovie_30s"
    work.mkdir(parents=True, exist_ok=True)

    print("catalog Full_Takes…", flush=True)
    rows = list_proxies()
    pool = pick(rows)
    print(
        f"arrival={ [a['dsc'] for a in pool['arrival']] } "
        f"jam={pool['jam']['dsc']} night={[n['dsc'] for n in pool['night']]}",
        flush=True,
    )

    parts = build_parts(work, pool)
    paths = [p for _, p in parts]
    total = 0.0
    for label, p in parts:
        d = float(subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(p)], text=True).strip() or 0)
        total += d
        print(f"  {label}: {d:.2f}s", flush=True)
    print(f"parts sum ~{total:.1f}s (target {TARGET})", flush=True)

    body = work / "aftermovie_body.mp4"
    print("xfade assemble…", flush=True)
    concat_xfade(paths, body, fade=0.10)
    dur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(body)], text=True).strip() or 0)

    # Trim / pad to ~30s
    draft = OUT / "Lapa71_Aftermovie_30s_9x16.mp4"
    ig = REEL_OUT / "WK_LAPA71_AFTERMOVIE_30s_IG_9x16.mp4"
    yt = REEL_OUT / "WK_LAPA71_AFTERMOVIE_30s_YT_9x16.mp4"
    print(f"body {dur:.1f}s -> finalize 30s", flush=True)
    take = min(30.2, dur)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(body), "-t", f"{take:.2f}",
        "-vf", f"fade=t=in:st=0:d=0.25,fade=t=out:st={max(0.0, take-0.6):.2f}:d=0.55,format=yuv420p",
        "-af", f"afade=t=in:st=0:d=0.2,afade=t=out:st={max(0.0, take-0.6):.2f}:d=0.55",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart",
        str(draft),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(draft), "-c", "copy", str(ig)])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(draft), "-c", "copy", str(yt)])

    masters = Path(r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\Reels")
    masters.mkdir(parents=True, exist_ok=True)
    master = masters / "Lapa71_Aftermovie_30s_MASTER_9x16.mp4"
    print("master CRF18…", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats", "-threads", THREADS,
        "-i", str(draft),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-threads", THREADS,
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
        "-movflags", "+faststart",
        str(master),
    ])

    meta = {
        "title": "Lapa71 Cinematic Festival Aftermovie 30s",
        "brand": BRAND,
        "duration_sec": float(subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(draft)], text=True).strip() or 0),
        "visual_rotation": [
            "fullscreen", "center_pip", "float_pip", "v_split", "h_split",
            "three_way_peak", "text_break",
        ],
        "statements": ["EXPERIENCE.", "NOBODY CREATES ALONE.", "COME AS YOU ARE."],
        "parts": [label for label, _ in parts],
        "output": str(draft),
        "ig": str(ig),
        "yt": str(yt),
        "master": str(master),
        "rule": "EDIT THE EVENT — every layout change music/story motivated",
    }
    (OUT / "aftermovie_30s_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {draft} {meta['duration_sec']:.1f}s", flush=True)
    print(f"MASTER {master}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
