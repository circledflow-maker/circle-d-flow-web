#!/usr/bin/env python3
"""Directed Lapa71 YouTube cut  -  user shot-list + music-led night tail.

Opening spine (after intro cards + moodboard):
  919 â†’ nested Rene 8180 â†’ 920 â†’ 921 (+1474 9:16 PiP @56s + @arpanito)
  â†’ nested silent 922 Ã—2 + comfort text â†’ Arif + @eskalahonthebeat
  â†’ 0923 + Arpan IMG_8921@57s nested â†’ Rene split / 3-up / PiP
  â†’ greeting break 928/925 â†’ flow 930+8193+1493 â†’ Isaac/Zema 1497
  â†’ night Stages music-led (no talk-first audio)

Audio rule: keep song/music beds; mute nested/guest PiP and greeting talk beds.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import BRAND, INTRO, MOODBOARD, MOODBOARD_SAFE_END, OUT, WORK  # noqa: E402

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore

# Reuse intro helpers from chrono assembler
from assemble_chronological_youtube import (  # noqa: E402
    crop_intro_png,
    credits_card,
    moodboard_card,
    probe_dur,
    probe_rotation,
    probe_wh,
    display_wh,
    still_card,
    text_card,
    run,
    esc,
    FONT_B,
    FONT_R,
    W,
    H,
    XFADE,
)

FT = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes")
ARPAN = FT / "Arpan Upload"
WORK_D = WORK / "youtube_directed_v4"
OUT_NAME = "Lapa71_TagusDropRhythm_Aftermovie_FULL_YouTube_16x9.mp4"

# ~1 cm outline on 1080p â‰ˆ 36"“48 px â†’ ~0.94"“0.95 scale (screenshot style)
NEST_SCALE = 0.94
NEST_SCALE_DEEP = 0.88  # second nested layer

HANDLES = {
    "Mr_Isaac": "@mistah_isaac",
    "Zema": "Zema",
    "Ana": "@memyself.ana",
    "Arpanito": "@arpanito",
    "Maryna_Vadini": "@soulvoice_vadini",
    "Elisa": "@elisa.cas8",
    "Leonnardo_Melo": "@meloleonnardo",
    "Arif": "@eskalahonthebeat",
    "Humble": "@_humble_project_",
    "Manu": "@manuallegro",
}


def vf_fit() -> str:
    return (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},setsar=1,"
        "eq=contrast=1.06:brightness=0.01:saturation=0.97:gamma=1.03,"
        "hqdn3d=1.1:0.8:2.0:1.4,fps=25,format=yuv420p"
    )


def af_music(mute: bool = False) -> str:
    if mute:
        return "anullsrc=r=48000:cl=stereo,aformat=sample_rates=48000:channel_layouts=stereo"
    return (
        "aformat=sample_rates=48000:channel_layouts=stereo,"
        "highpass=f=80,lowpass=f=14000,"
        "loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.96"
    )


def draw_ig(handle: str, line2: str | None = None) -> str:
    """Lower-left Instagram-style handle."""
    t1 = esc(handle if handle.startswith("@") else f"@{handle}")
    parts = [
        f"drawtext=fontfile='{FONT_B}':text='{t1}':fontsize=42:"
        f"fontcolor=white:borderw=2:bordercolor=black@0.55:"
        f"x=72:y=h-140"
    ]
    if line2:
        parts.append(
            f"drawtext=fontfile='{FONT_R}':text='{esc(line2)}':fontsize=28:"
            f"fontcolor=white@0.92:borderw=1:bordercolor=black@0.5:"
            f"x=72:y=h-90"
        )
    return ",".join(parts)


def draw_center_line(text: str, fs: int = 44) -> str:
    return (
        f"drawtext=fontfile='{FONT_B}':text='{esc(text)}':fontsize={fs}:"
        f"fontcolor=white:borderw=2:bordercolor=black@0.6:"
        f"x=(w-text_w)/2:y=h*0.78"
    )


def render_plain(src: Path, out: Path, ss: float, take: float, *, mute: bool = False, vf_extra: str = "") -> Path:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    vf = vf_fit()
    if vf_extra:
        vf = f"{vf},{vf_extra}"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{ss:.2f}", "-t", f"{take:.2f}", "-i", str(src),
    ]
    if mute:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
    cmd += ["-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
            "-pix_fmt", "yuv420p", "-threads", "2"]
    if mute:
        cmd += ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        cmd += ["-af", af_music(False), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
    cmd.append(str(out))
    run(cmd)
    return out


def ensure_1080(src: Path, work: Path) -> Path:
    """Downscale 4K guest clips once so nested encodes don't OOM."""
    w, h = probe_wh(src)
    if max(w, h) <= 1920:
        return src
    dest = work / f"_s1080_{src.stem}.mp4"
    if dest.exists() and dest.stat().st_size > 80_000:
        return dest
    print(f"  scale1080 {src.name}", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-threads", "1", "-i", str(src),
        "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=25,format=yuv420p",
        "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
        "-threads", "1", str(dest),
    ])
    return dest


def cut_clip(src: Path, work: Path, ss: float, take: float, tag: str) -> Path:
    """Extract a short 1080p body so later nest/split stays light on RAM."""
    dest = work / f"_cut_{tag}_{int(ss)}_{int(take)}.mp4"
    if dest.exists() and dest.stat().st_size > 40_000:
        return dest
    print(f"  cut {tag} @{ss:.0f}+{take:.0f}", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{ss:.2f}", "-t", f"{take:.2f}", "-i", str(src),
        "-vf", vf_fit(),
        "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
        "-threads", "1", str(dest),
    ])
    return dest


def _scale_box(pw: int, ph: int) -> str:
    return (
        f"scale={pw}:{ph}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph},setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=0:y=0:w={pw}:h={ph}:color=white@0.25:t=2"
    )


def render_nested(
    main: Path,
    overlay: Path,
    out: Path,
    take: float,
    *,
    main_ss: float = 0.0,
    over_ss: float = 0.0,
    scale: float = NEST_SCALE,
    mute_main: bool = False,
    vf_extra: str = "",
    deep: bool = False,
    deep_src: Path | None = None,
    deep_ss: float = 0.0,
) -> Path:
    """Main full-bleed; overlay(s) centered so ~1cm of main shows as outline."""
    if out.exists() and out.stat().st_size > 80_000:
        return out
    ow = int(W * scale) // 2 * 2
    oh = int(H * scale) // 2 * 2
    ox, oy = (W - ow) // 2, (H - oh) // 2
    inputs: list[str] = [
        "-ss", f"{main_ss:.2f}", "-t", f"{take:.2f}", "-i", str(main),
        "-ss", f"{over_ss:.2f}", "-t", f"{take:.2f}", "-i", str(overlay),
    ]
    if deep:
        ds = deep_src or overlay
        dw = int(W * NEST_SCALE_DEEP) // 2 * 2
        dh = int(H * NEST_SCALE_DEEP) // 2 * 2
        dx, dy = (W - dw) // 2, (H - dh) // 2
        inputs += ["-ss", f"{deep_ss:.2f}", "-t", f"{take:.2f}", "-i", str(ds)]
        fc = (
            f"[0:v]{vf_fit()}[base];"
            f"[1:v]{_scale_box(ow, oh)}[mid];"
            f"[2:v]{_scale_box(dw, dh)}[inn];"
            f"[base][mid]overlay={ox}:{oy}[m1];"
            f"[m1][inn]overlay={dx}:{dy}[pre]"
        )
        n_vid = 3
    else:
        fc = (
            f"[0:v]{vf_fit()}[base];"
            f"[1:v]{_scale_box(ow, oh)}[pip];"
            f"[base][pip]overlay={ox}:{oy}[pre]"
        )
        n_vid = 2
    if vf_extra:
        fc += f";[pre]{vf_extra}[v]"
    else:
        fc += ";[pre]format=yuv420p[v]"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        *inputs,
    ]
    if mute_main:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
    cmd += [
        "-filter_complex", fc,
        "-map", "[v]",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", "1",
    ]
    if mute_main:
        cmd += ["-map", f"{n_vid}:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        cmd += [
            "-map", "0:a", "-af", af_music(False),
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest",
        ]
    cmd.append(str(out))
    run(cmd)
    return out


def render_split2(
    left: Path,
    right: Path,
    out: Path,
    take: float,
    *,
    ss_l: float = 0.0,
    ss_r: float = 0.0,
    outline_main: Path | None = None,
) -> Path:
    """Side-by-side; optional nest inside main outline."""
    if out.exists() and out.stat().st_size > 80_000:
        return out
    if outline_main:
        iw, ih = int(W * NEST_SCALE) // 2 * 2, int(H * NEST_SCALE) // 2 * 2
        ox, oy = (W - iw) // 2, (H - ih) // 2
        chw = (iw // 2) // 2 * 2
        cell = (
            f"scale={chw}:{ih}:force_original_aspect_ratio=increase,"
            f"crop={chw}:{ih},setsar=1,fps=25,format=yuv420p"
        )
        fc = (
            f"[1:v]{cell}[L];[2:v]{cell}[R];[L][R]hstack=inputs=2[stack];"
            f"[0:v]{vf_fit()}[base];[base][stack]overlay={ox}:{oy}[v]"
        )
        inputs = [
            "-t", f"{take:.2f}", "-i", str(outline_main),
            "-ss", f"{ss_l:.2f}", "-t", f"{take:.2f}", "-i", str(left),
            "-ss", f"{ss_r:.2f}", "-t", f"{take:.2f}", "-i", str(right),
        ]
        n_in = 3
    else:
        hw = W // 2
        cell = (
            f"scale={hw}:{H}:force_original_aspect_ratio=increase,"
            f"crop={hw}:{H},setsar=1,fps=25,format=yuv420p"
        )
        fc = f"[0:v]{cell}[L];[1:v]{cell}[R];[L][R]hstack=inputs=2[v]"
        inputs = [
            "-ss", f"{ss_l:.2f}", "-t", f"{take:.2f}", "-i", str(left),
            "-ss", f"{ss_r:.2f}", "-t", f"{take:.2f}", "-i", str(right),
        ]
        n_in = 2
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        *inputs,
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex", fc,
        "-map", "[v]", "-map", f"{n_in}:a",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", "2",
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def render_split3(a: Path, b: Path, c: Path, out: Path, take: float, *, outline_main: Path) -> Path:
    """3 vertical columns nested in main outline."""
    if out.exists() and out.stat().st_size > 80_000:
        return out
    iw, ih = int(W * NEST_SCALE) // 2 * 2, int(H * NEST_SCALE) // 2 * 2
    ox, oy = (W - iw) // 2, (H - ih) // 2
    cw = (iw // 3) // 2 * 2
    cell = (
        f"scale={cw}:{ih}:force_original_aspect_ratio=increase,"
        f"crop={cw}:{ih},setsar=1,fps=25,format=yuv420p"
    )
    fc = (
        f"[1:v]{cell}[A];[2:v]{cell}[B];[3:v]{cell}[C];"
        f"[A][B][C]hstack=inputs=3[stack];"
        f"[0:v]{vf_fit()}[base];[base][stack]overlay={ox}:{oy}[v]"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-t", f"{take:.2f}", "-i", str(outline_main),
        "-t", f"{take:.2f}", "-i", str(a),
        "-t", f"{take:.2f}", "-i", str(b),
        "-t", f"{take:.2f}", "-i", str(c),
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex", fc,
        "-map", "[v]", "-map", "4:a",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", "2",
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def xfade_concat(parts: list[Path], out: Path, fade: float = XFADE) -> Path:
    if len(parts) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(parts[0]), "-c", "copy", str(out)])
        return out
    batch_size = 8
    current = parts
    round_i = 0
    while len(current) > 1:
        next_round: list[Path] = []
        for i in range(0, len(current), batch_size):
            chunk = current[i:i + batch_size]
            chunk_out = out.parent / f"_xf_d_r{round_i}_{i}.mp4"
            if len(chunk) == 1:
                next_round.append(chunk[0])
                continue
            if chunk_out.exists() and chunk_out.stat().st_size > 80_000:
                next_round.append(chunk_out)
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
            print(f"  xfade r{round_i} n={len(chunk)}", flush=True)
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


def night_guest_pool() -> list[Path]:
    """Night/indoor matching B-roll: Chris + late Rene (same evening energy)."""
    pool: list[Path] = []
    for p in sorted(FT.glob("GUEST_CHRIS_*.mp4")):
        pool.append(p)
    for k in (8195, 8196, 8197, 8198, 8199):
        p = FT / f"GUEST_RENE_IMG_{k}.mov"
        if p.exists():
            pool.append(p)
    for p in sorted(ARPAN.glob("*.MOV")) + sorted(ARPAN.glob("*.mp4")):
        if "8921" not in p.name:  # 8921 reserved for opening nest
            pool.append(p)
    return pool


def render_float_ig(
    main: Path,
    over: Path,
    out: Path,
    take: float,
    *,
    main_ss: float = 0.0,
    over_ss: float = 0.0,
    handle: str = "",
    line2: str | None = None,
    corner: str = "br",
) -> Path:
    """Fullscreen main + float PiP (TOD-matched guest) + Instagram burn."""
    if out.exists() and out.stat().st_size > 80_000:
        return out
    pw, ph = 480, 270
    pos = {
        "br": (W - pw - 48, H - ph - 40),
        "tr": (W - pw - 48, 48),
        "tl": (48, 48),
    }
    mx, my = pos.get(corner, pos["br"])
    over = ensure_1080(over, WORK_D)
    if handle:
        txt = draw_ig(handle, line2)
        fc = (
            f"[0:v]{vf_fit()}[base];"
            f"[1:v]{_scale_box(pw, ph)}[p];"
            f"[base][p]overlay={mx}:{my}[pre];"
            f"[pre]{txt}[v]"
        )
    else:
        fc = (
            f"[0:v]{vf_fit()}[base];"
            f"[1:v]{_scale_box(pw, ph)}[p];"
            f"[base][p]overlay={mx}:{my}[v]"
        )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{main_ss:.2f}", "-t", f"{take:.2f}", "-i", str(main),
        "-ss", f"{over_ss:.2f}", "-t", f"{take:.2f}", "-i", str(over),
        "-filter_complex", fc,
        "-map", "[v]", "-map", "0:a",
        "-af", af_music(False),
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", "1",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest",
        str(out),
    ])
    return out


def stage_hero(
    main: Path,
    out_fs: Path,
    out_pip: Path | None,
    take: float,
    *,
    handle: str,
    line2: str | None,
    guest: Path | None,
    ss: float = 4.0,
    used_guest: set[str],
) -> list[Path]:
    """Artist stage: clean FS first 3s (no ViV), then FS+handle, then guest PiP."""
    outs: list[Path] = []
    d = probe_dur(main)
    take = min(take, max(8.0, d - ss - 0.2))
    t_open = min(3.0, max(2.0, take * 0.12))
    t_fs = max(t_open + 4.0, take * 0.55)
    if t_fs >= take:
        t_fs = max(t_open + 3.0, take * 0.6)
    t_pip = take - t_fs
    out_open = out_fs.with_name(out_fs.name.replace("_fs", "_open"))
    if out_open == out_fs:
        out_open = out_fs.with_name(out_fs.stem + "_open" + out_fs.suffix)
    # Clean opening: no PiP for first ~3s
    outs.append(render_plain(main, out_open, ss, t_open))
    outs.append(render_plain(
        main, out_fs, ss + t_open, max(0.5, t_fs - t_open),
        vf_extra=draw_ig(handle, line2) if handle else "",
    ))
    if out_pip and guest and t_pip >= 6:
        key = str(guest.resolve())
        if key not in used_guest:
            used_guest.add(key)
            outs.append(render_float_ig(
                main, guest, out_pip, t_pip,
                main_ss=ss + t_fs,
                handle=handle,
                line2=line2,
                corner="br" if hash(handle) % 2 == 0 else "tl",
            ))
        else:
            outs.append(render_plain(
                main, out_pip, ss + t_fs, t_pip,
                vf_extra=draw_ig(handle, line2) if handle else "",
            ))
    return outs



def pill_still_card(img: Path, out: Path, sec: float, *, center_scale: float = 0.72) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    if Image is None:
        return still_card(img, out, sec, center_scale=center_scale)
    from PIL import Image as PILImage
    src = PILImage.open(img).convert("RGBA")
    canvas = PILImage.new("RGB", (W, H), (0, 0, 0))
    tw = int(W * center_scale)
    th = int(H * center_scale)
    src.thumbnail((tw, th), PILImage.Resampling.LANCZOS)
    x = (W - src.size[0]) // 2
    y = (H - src.size[1]) // 2
    canvas.paste(src, (x, y), src if src.mode == "RGBA" else None)
    png = out.with_suffix(".png")
    canvas.save(png, optimize=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(png),
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-threads", "1",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def main() -> int:
    WORK_D.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for bad in WORK_D.glob("*.mp4"):
        if bad.stat().st_size < 40_000:
            bad.unlink(missing_ok=True)
    parts: list[Path] = []
    n = 0
    used_guest: set[str] = set()

    def nxt(label: str) -> Path:
        nonlocal n
        n += 1
        return WORK_D / f"{n:03d}_{label}.mp4"

    # --- Intro only (then shotlist) ---
    print("INTRO", flush=True)
    cdf = INTRO / "01_circle_d_flow_presents.png"
    stages = INTRO / "02_circle_d_stages.png"
    if cdf.exists():
        c = crop_intro_png(cdf, WORK_D / "cdf_clean.png")
        parts.append(pill_still_card(c, nxt("cdf"), 2.2, center_scale=0.70))
    if stages.exists():
        s = crop_intro_png(stages, WORK_D / "stages_clean.png")
        parts.append(pill_still_card(s, nxt("stages"), 2.4, center_scale=0.78))

    p919 = FT / "DSC_0919_proxy_1080p.mp4"
    p8180 = ensure_1080(FT / "GUEST_RENE_IMG_8180.mov", WORK_D)
    p920 = FT / "DSC_0920_proxy_1080p.mp4"
    p921 = FT / "DSC_0921_proxy_1080p.mp4"
    p1474 = FT / "DSC_1474_proxy_1080p.mp4"
    p922 = FT / "DSC_0922_proxy_1080p.mp4"
    p_arif = FT / "DSC_0912_Arif_1080p.mp4"
    p8921 = ARPAN / "IMG_8921.MOV"
    p923 = FT / "DSC_0923_proxy_1080p.mp4"
    rene = {
        k: ensure_1080(FT / f"GUEST_RENE_IMG_{k}.mov", WORK_D)
        for k in (8184, 8185, 8186, 8187, 8190, 8189, 8192, 8191, 8193)
    }
    p928 = FT / "DSC_0928_proxy_1080p.mp4"
    p925 = FT / "DSC_0925_proxy_1080p.mp4"
    p930 = FT / "DSC_0930_proxy_1080p.mp4"
    p1493 = FT / "DSC_1493_proxy_1080p.mp4"
    night_guests = list(night_guest_pool())

    def next_guest() -> Path | None:
        for g in night_guests:
            k = str(Path(g).resolve())
            if k not in used_guest:
                return ensure_1080(g, WORK_D)
        return None

    # 1) 919 full
    print("01 DSC_0919", flush=True)
    parts.append(render_plain(p919, nxt("919"), 0, min(18.0, probe_dur(p919) - 0.1)))

    # 2) nested Rene 8180 over 919  -  same outdoor TOD; 1cm outline (screenshot style)
    print("02 nested Rene 8180 over 919 (matched outdoor)", flush=True)
    take_n = min(probe_dur(p8180), 8.0)
    parts.append(render_nested(
        p919, p8180, nxt("919_8180_nest"), take_n,
        main_ss=max(0, probe_dur(p919) - take_n - 1),
        mute_main=False,
    ))

    # 3) 920
    print("03 DSC_0920", flush=True)
    parts.append(render_plain(p920, nxt("920"), 0, probe_dur(p920) - 0.05))

    # 4) 921 head until 56s
    print("04 DSC_0921 head", flush=True)
    parts.append(render_plain(p921, nxt("921_head"), 0, 56.0))

    # 5) 921 @56 for 14s + 1474 9:16 right silent + @arpanito arrived
    print("05 921@56 + 1474 PiP + @arpanito", flush=True)
    out_arpanito = nxt("921_1474_arpanito")
    if not (out_arpanito.exists() and out_arpanito.stat().st_size > 80_000):
        pw, ph = 380, 676
        mx, my = W - pw - 56, (H - ph) // 2
        pip_vf = (
            f"scale={pw}:{ph}:force_original_aspect_ratio=increase,"
            f"crop={pw}:{ph},setsar=1,fps=25,format=yuv420p,"
            f"drawbox=x=0:y=0:w={pw}:h={ph}:color=white@0.35:t=2"
        )
        txt = draw_ig("@arpanito", "Rapper · Scholar · Flow Creator")
        fc = (
            f"[0:v]{vf_fit()}[base];"
            f"[1:v]{pip_vf}[p];"
            f"[base][p]overlay={mx}:{my}[pre];"
            f"[pre]{txt}[v]"
        )
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-ss", "56", "-t", "14", "-i", str(p921),
            "-stream_loop", "2", "-i", str(p1474),
            "-filter_complex", fc,
            "-map", "[v]", "-map", "0:a",
            "-af", af_music(False),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
            "-c:a", "aac", "-b:a", "192k", "-t", "14",
            str(out_arpanito),
        ])
    parts.append(out_arpanito)

    # 6) nested silent 922x2 + comfort text
    print("06 nested 922 silent + comfort text", flush=True)
    take922 = min(12.0, probe_dur(p922) - 0.05)
    parts.append(render_nested(
        p922, p922, nxt("922_nested"), take922,
        main_ss=0, over_ss=1.0, deep=True, deep_src=p922, deep_ss=2.0,
        mute_main=True, scale=NEST_SCALE,
        vf_extra=draw_center_line("Make yourself comfortable and enjoy the flow!", 40),
    ))

    # 7) Arif with sound + @eskalahonthebeat
    print("07 Arif + @eskalahonthebeat", flush=True)
    take_arif = min(32.0, probe_dur(p_arif) - 0.1)
    parts.append(render_plain(
        p_arif, nxt("arif"), 2.0, take_arif,
        vf_extra=draw_ig("@eskalahonthebeat"),
    ))

    # 8) IMG_8921 @00:00:57 as MAIN outline + DSC_0923 centered ViV (same jam energy)
    print("08 IMG_8921@57s main + DSC_0923 centered nest", flush=True)
    take_combo = 22.0
    img_ss = 57.0
    if probe_dur(p8921) < img_ss + take_combo:
        img_ss = max(0.0, probe_dur(p8921) - take_combo - 0.5)
    parts.append(render_nested(
        p8921, p923, nxt("8921_923_nest"), take_combo,
        main_ss=img_ss, over_ss=12.0, mute_main=False,
    ))

    # 9-11) Rene layouts over 923 outline (same jam/outdoor continuity)
    print("09 Rene split 8184/8185", flush=True)
    t_sp = min(probe_dur(rene[8184]), probe_dur(rene[8185]), 4.8)
    parts.append(render_split2(
        rene[8184], rene[8185], nxt("rene_split2"), t_sp,
        outline_main=p923,
    ))
    print("10 Rene 3-up", flush=True)
    t3 = min(probe_dur(rene[8186]), probe_dur(rene[8187]), probe_dur(rene[8190]), 7.0)
    parts.append(render_split3(
        rene[8186], rene[8187], rene[8190], nxt("rene_3up"), t3,
        outline_main=p923,
    ))
    print("11 Rene 8189 / 8192 / 8191", flush=True)
    for k, ss_main in ((8189, 40.0), (8192, 50.0), (8191, 60.0)):
        tk = min(probe_dur(rene[k]), 10.0)
        parts.append(render_nested(
            p923, rene[k], nxt(f"rene_{k}"), tk,
            main_ss=ss_main,
        ))

    # 12) Greeting break
    print("12 greeting break", flush=True)
    parts.append(render_plain(
        p928, nxt("928_greet"), 0, min(10.0, probe_dur(p928) - 0.05),
        mute=True, vf_extra=draw_center_line("Happy to see you  -  love & appreciation", 36),
    ))
    parts.append(render_plain(
        p925, nxt("925_greet"), 0, probe_dur(p925) - 0.05, mute=True,
        vf_extra=draw_center_line("Grateful to have you here with us", 34),
    ))

    # 13) Flow break 930 + Rene 8193 + 1493
    print("13 flow 930 + 8193 + 1493", flush=True)
    parts.append(render_nested(
        p930, rene[8193], nxt("930_8193"), min(probe_dur(rene[8193]), 6.5),
        main_ss=8.0,
    ))
    t930 = min(45.0, probe_dur(p930) - 0.1)
    parts.append(render_plain(p930, nxt("930_flow"), 20.0, t930 - 20 if t930 > 25 else 20.0))
    # 1493 with matching guest PiP (not outdoor vs indoor mismatch)
    g1493 = next_guest()
    if g1493:
        parts.append(render_float_ig(
            p1493, g1493, nxt("1493_pip"), min(50.0, probe_dur(p1493) - 6),
            main_ss=5.0, handle="",
        ))
    else:
        parts.append(render_plain(p1493, nxt("1493"), 5.0, min(55.0, probe_dur(p1493) - 6)))

    # 14) STAGE ORDER (outdoorâ†’stage): Isaac/Zema â†’ Ana â†’ Arpan â†’ Maryna â†’ Elisa/Leo â†’ Jam â†’ Arif
    print("14 STAGE ORDER", flush=True)
    stages_plan = [
        ("1497", FT / "DSC_1497_proxy_1080p.mp4", 95.0, HANDLES["Mr_Isaac"], "Mr Isaac · Zema"),
        ("1499", FT / "DSC_1499_proxy_1080p.mp4", 110.0, HANDLES["Ana"], "Ana · Vocalist · Flow Creator"),
        ("1500", FT / "DSC_1500_proxy_1080p.mp4", 110.0, HANDLES["Arpanito"], "Rapper · Scholar · Flow Creator"),
        # 1502 is corrupt (~1s) - use 1501 Maryna
        ("1501", FT / "DSC_1501_proxy_1080p.mp4", 120.0, HANDLES["Maryna_Vadini"], "Maryna · Vocalist · Flow Creator"),
        ("1504", FT / "DSC_1504_proxy_1080p.mp4", 140.0, HANDLES["Elisa"], "Elisa · Leonnardo · Flow Creator"),
        ("1505", FT / "DSC_1505_proxy_1080p.mp4", 140.0, "WAKO KUNGO", "Jam"),
        ("1510", FT / "DSC_1510_proxy_1080p.mp4", 16.0, HANDLES["Arif"], "Arif · Flow Creator"),
    ]
    for tag, path, take, handle, line2 in stages_plan:
        if not path.exists() or probe_dur(path) < 5:
            print(f"  skip {tag} missing/short", flush=True)
            continue
        print(f"  STAGE {tag} {handle}", flush=True)
        g = next_guest()
        parts.extend(stage_hero(
            path, nxt(f"st_{tag}_fs"), nxt(f"st_{tag}_pip") if g else None,
            take, handle=handle, line2=line2, guest=g, ss=3.0, used_guest=used_guest,
        ))
        # Arif 1510 is short  -  extend with nested guest over remaining Arif energy from 1508 if needed
        if tag == "1510":
            p1508 = FT / "DSC_1508_proxy_1080p.mp4"
            if p1508.exists():
                g2 = next_guest()
                if g2:
                    parts.append(render_float_ig(
                        p1508, g2, nxt("arif_extend"), 70.0,
                        main_ss=10.0, handle=HANDLES["Arif"], line2="Arif",
                    ))

    # 15) Closing mosaic DSC_1512"“1544 (short highlights, no long dumps)
    print("15 closing 1512-1544", flush=True)
    close_ids = [1512, 1513, 1540, 1542, 1543, 1544]
    for dsc in close_ids:
        hits = list(FT.glob(f"DSC_{dsc}_proxy_1080p.mp4"))
        if not hits:
            continue
        p = hits[0]
        d = probe_dur(p)
        if d < 3:
            continue
        take = min(14.0, d - 0.2)
        g = next_guest()
        if g and d >= 8:
            parts.append(render_nested(p, g, nxt(f"end_{dsc}"), take, main_ss=0.5))
        else:
            parts.append(render_plain(p, nxt(f"end_{dsc}"), 0.3, take))

    artists = [
        "Mr Isaac / @mistah_isaac", "Zema", "Ana / @memyself.ana",
        "Arpanito / @arpanito", "Maryna Vadini / @soulvoice_vadini",
        "Elisa / @elisa.cas8", "Leonnardo Melo / @meloleonnardo",
        "Arif / @eskalahonthebeat", "Rene (guest)", "Circle D Flow Â· Lapa71",
    ]
    parts.append(credits_card(artists, nxt("credits"), 16.0))

    print(f"xfade {len(parts)} parts", flush=True)
    body = WORK_D / "directed_body.mp4"
    xfade_concat(parts, body)
    dur = probe_dur(body)
    final = OUT / OUT_NAME
    alias = OUT.parent / "YouTube" / "Lapa71_TagusDropRhythm_YouTube_16x9.mp4"
    alias.parent.mkdir(parents=True, exist_ok=True)
    print(f"body {dur/60:.1f} min - final", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(body),
        "-vf", f"fade=t=in:st=0:d=0.3,fade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1,format=yuv420p",
        "-af", f"afade=t=in:st=0:d=0.25,afade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", "1",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(final),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(final), "-c", "copy", str(alias)])

    masters = Path(r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\YouTube")
    masters.mkdir(parents=True, exist_ok=True)
    master = masters / "Lapa71_TagusDropRhythm_YouTube_MASTER_16x9.mp4"
    print("master CRF18...", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(final),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-threads", "1",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
        str(master),
    ])

    meta = {
        "title": "Tagus Drop Rhythm  -  Directed Full Aftermovie",
        "brand": BRAND,
        "duration_sec": probe_dur(final),
        "output": str(final),
        "master": str(master),
        "stage_order": [t[0] for t in stages_plan],
        "notes": [
            "Opening: 919 â†’ Rene8180 ViV (1cm outline) â†’ 920 â†’ 921+1474 @arpanito â†’ 922 comfort â†’ Arif",
            "IMG_8921 @00:00:57 as main + DSC_0923 centered nest (not 57:00)",
            "DSC_1502 corrupt â†’ Maryna via DSC_1501",
            "PiP/guest matched by evening energy (Chris/Rene/Arpan Upload)",
            "Instagram handles burned on stage blocks",
        ],
    }
    (OUT / "youtube_directed_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {final} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
