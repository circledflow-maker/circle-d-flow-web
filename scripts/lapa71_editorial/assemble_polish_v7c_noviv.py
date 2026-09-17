#!/usr/bin/env python3
"""v7c: from 03:28 no ViV, fix mute greetings, transparent logos (KH|Wako|MUDE|Humble)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from assemble_directed_youtube import (  # noqa: E402
    FT,
    HANDLES,
    WORK_D,
    draw_center_line,
    draw_ig,
    probe_dur,
    render_plain,
    run,
    xfade_concat,
)
from assemble_directed_polish_v5 import (  # noqa: E402
    ASSETS,
    H,
    OUT_ALIAS,
    OUT_DRAFT,
    OUT_MASTER,
    THREADS,
    W,
    make_kh_intro_card,
    make_transparent_logo,
    probe_dur as probe,
)
from _fix_logo_assets import fix_humble, fix_mude  # noqa: E402

WORK = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v7c")
BODY = WORK_D / "directed_body.mp4"
# Master clock 03:28; KH intro ~4.5s → directed cut
KH_SEC = 4.5
CUT_MASTER = 3 * 60 + 28.0  # 208
CUT_BODY = CUT_MASTER - KH_SEC  # ~203.5 → start of muted greet
LOGO_H = 56
MARGIN = 20
GAP = 14


def knock_white(im_path: Path, out: Path, thr: int = 245) -> Path:
    from PIL import Image

    im = Image.open(im_path).convert("RGBA")
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if r >= thr and g >= thr and b >= thr:
                px[x, y] = (0, 0, 0, 0)
    bbox = im.split()[-1].getbbox()
    if bbox:
        im = im.crop(bbox)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out)
    return out


def prepare_logos() -> tuple[Path, Path, Path, Path]:
    ASSETS.mkdir(parents=True, exist_ok=True)
    make_transparent_logo(ASSETS / "kh_logo.png", ASSETS / "kh_logo_rgba.png", mode="auto")
    # Wako jpeg is on solid white — force hard white knockout
    knock_white(ASSETS / "wako_logo.jpeg", ASSETS / "wako_logo_rgba.png", thr=240)
    fix_mude()
    fix_humble()
    # Extra: ensure MUDE has NO plate (re-crop only wordmark)
    from PIL import Image

    raw = Image.open(ASSETS / "mude_logo_raw.png").convert("RGBA")
    tile = raw.crop((0, 0, raw.size[0], 78))
    px = tile.load()
    for y in range(tile.size[1]):
        for x in range(tile.size[0]):
            r, g, b, a = px[x, y]
            if r < 40 and g < 40 and b < 40:
                px[x, y] = (0, 0, 0, 0)
    bbox = tile.split()[-1].getbbox()
    if bbox:
        tile = tile.crop(bbox)
    tile.save(ASSETS / "mude_logo_only.png")
    return (
        ASSETS / "kh_logo_rgba.png",
        ASSETS / "wako_logo_rgba.png",
        ASSETS / "mude_logo_only.png",
        ASSETS / "humble_logo_rgba.png",
    )


def build_noviv_tail(out_dir: Path) -> Path:
    """From greeting onward: full-frame only, greetings WITH audio, no PiP/nest/split."""
    out_dir.mkdir(parents=True, exist_ok=True)
    parts: list[Path] = []
    n = 0

    def nxt(label: str) -> Path:
        nonlocal n
        n += 1
        return out_dir / f"t{n:02d}_{label}.mp4"

    p928 = FT / "DSC_0928_proxy_1080p.mp4"
    p925 = FT / "DSC_0925_proxy_1080p.mp4"
    p930 = FT / "DSC_0930_proxy_1080p.mp4"
    p1493 = FT / "DSC_1493_proxy_1080p.mp4"

    # Greetings WITH natural audio (was mute → silence at 03:28)
    print("tail greet WITH audio", flush=True)
    for p, label, text, take in (
        (p928, "928_greet", "Happy to see you  -  love & appreciation", 10.0),
        (p925, "925_greet", "Grateful to have you here with us", min(6.0, probe_dur(p925) - 0.05)),
    ):
        dest = nxt(label)
        if dest.exists():
            dest.unlink()
        parts.append(render_plain(
            p, dest, 0, min(take, probe_dur(p) - 0.05),
            mute=False, vf_extra=draw_center_line(text, 36),
        ))

    print("tail flow plain (no nest)", flush=True)
    parts.append(render_plain(p930, nxt("930_plain"), 8.0, 6.5))
    t930 = min(45.0, probe_dur(p930) - 0.1)
    take_flow = t930 - 20 if t930 > 25 else 20.0
    parts.append(render_plain(p930, nxt("930_flow"), 20.0, take_flow))
    parts.append(render_plain(p1493, nxt("1493_plain"), 5.0, min(50.0, probe_dur(p1493) - 6)))

    print("tail stages FS only (no ViV)", flush=True)
    stages = [
        ("1497", FT / "DSC_1497_proxy_1080p.mp4", 95.0, HANDLES["Mr_Isaac"], "Mr Isaac · Zema"),
        ("1499", FT / "DSC_1499_proxy_1080p.mp4", 110.0, HANDLES["Ana"], "Ana · Vocalist · Flow Creator"),
        ("1500", FT / "DSC_1500_proxy_1080p.mp4", 110.0, HANDLES["Arpanito"], "Rapper · Scholar · Flow Creator"),
        ("1501", FT / "DSC_1501_proxy_1080p.mp4", 120.0, HANDLES["Maryna_Vadini"], "Maryna · Vocalist · Flow Creator"),
        ("1504", FT / "DSC_1504_proxy_1080p.mp4", 140.0, HANDLES["Elisa"], "Elisa · Leonnardo · Flow Creator"),
        ("1505", FT / "DSC_1505_proxy_1080p.mp4", 140.0, "WAKO KUNGO", "Jam"),
        ("1510", FT / "DSC_1510_proxy_1080p.mp4", 16.0, HANDLES["Arif"], "Arif · Flow Creator"),
    ]
    for tag, path, take, handle, line2 in stages:
        if not path.exists() or probe_dur(path) < 5:
            continue
        print(f"  stage {tag}", flush=True)
        d = probe_dur(path)
        take = min(take, max(8.0, d - 3.2))
        t_open = min(3.0, max(2.0, take * 0.12))
        # clean open 3s, then FS+handle for rest — NO guest PiP
        parts.append(render_plain(path, nxt(f"st_{tag}_open"), 3.0, t_open))
        parts.append(render_plain(
            path, nxt(f"st_{tag}_fs"), 3.0 + t_open, take - t_open,
            vf_extra=draw_ig(handle, line2) if handle else "",
        ))
        if tag == "1510":
            p1508 = FT / "DSC_1508_proxy_1080p.mp4"
            if p1508.exists():
                parts.append(render_plain(
                    p1508, nxt("arif_plain"), 10.0, 70.0,
                    vf_extra=draw_ig(HANDLES["Arif"], "Arif · Flow Creator"),
                ))

    print("tail closing plain", flush=True)
    for dsc in (1512, 1513, 1540, 1542, 1543, 1544):
        hits = list(FT.glob(f"DSC_{dsc}_proxy_1080p.mp4"))
        if not hits:
            continue
        p = hits[0]
        d = probe_dur(p)
        if d < 3:
            continue
        parts.append(render_plain(p, nxt(f"end_{dsc}"), 0.3, min(14.0, d - 0.2)))

    body_tail = out_dir / "noviv_tail.mp4"
    print(f"xfade tail {len(parts)} parts", flush=True)
    xfade_concat(parts, body_tail)
    return body_tail


def splice_body(head_end: float, tail: Path, out: Path) -> Path:
    """directed_body[0:head_end] + noviv_tail, continuous audio."""
    head = WORK / "body_head.mp4"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(BODY), "-t", f"{head_end:.2f}",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(head),
    ])
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(head), "-i", str(tail),
        "-filter_complex",
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p[v0];"
        f"[1:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p[v1];"
        f"[0:a]aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0[a0];"
        f"[1:a]aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0[a1];"
        f"[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out


def burn_logos(base: Path, logos: tuple[Path, Path, Path, Path], out: Path) -> Path:
    kh, wako, mude, humble = logos
    dur = probe(base)
    slot = LOGO_H + GAP
    # NO drawbox — transparent overlays only
    fc = (
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p[base];"
        f"[1:v]scale=-1:{LOGO_H},format=rgba[kh];"
        f"[2:v]scale=-1:{LOGO_H},format=rgba[wk];"
        f"[3:v]scale=-1:{LOGO_H},format=rgba[md];"
        f"[4:v]scale=-1:{LOGO_H},format=rgba[hm];"
        f"[base][kh]overlay=W-w-{MARGIN + 3 * slot}:{MARGIN}[a];"
        f"[a][wk]overlay=W-w-{MARGIN + 2 * slot}:{MARGIN}[b];"
        f"[b][md]overlay=W-w-{MARGIN + slot}:{MARGIN}[c];"
        f"[c][hm]overlay=W-w-{MARGIN}:{MARGIN}[v]"
    )
    print(f"burn logos dur={dur:.1f}s", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(base),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(kh),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(wako),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(mude),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(humble),
        "-filter_complex", fc,
        "-map", "[v]", "-map", "0:a:0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
        "-c:a", "copy",
        str(out),
    ])
    return out


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    if not BODY.exists():
        raise SystemExit(f"missing {BODY}")

    print("LOGOS transparent KH|Wako|MUDE|Humble", flush=True)
    logos = prepare_logos()

    print("BUILD no-ViV tail from greeting", flush=True)
    tail = build_noviv_tail(WORK / "tail_parts")

    print(f"SPLICE body @{CUT_BODY:.1f}s + noviv tail", flush=True)
    spliced = WORK / "body_noviv.mp4"
    splice_body(CUT_BODY, tail, spliced)

    print("LOGO burn (no black bar)", flush=True)
    polished = burn_logos(spliced, logos, WORK / "polished.mp4")

    print("PREPEND KH", flush=True)
    kh = make_kh_intro_card(WORK / "00_kh_intro.mp4", KH_SEC)
    with_kh = WORK / "with_kh.mp4"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(kh), "-i", str(polished),
        "-filter_complex",
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p[v0];"
        f"[1:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p[v1];"
        f"[0:a]aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0[a0];"
        f"[1:a]aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0[a1];"
        f"[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(with_kh),
    ])

    print("EXPORT master", flush=True)
    OUT_DRAFT.parent.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(with_kh),
        "-c:v", "copy", "-c:a", "copy", "-movflags", "+faststart",
        str(OUT_DRAFT),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_ALIAS)])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_MASTER)])
    meta = {
        "title": "Tagus Drop Rhythm — Regie v7c",
        "duration_sec": probe(OUT_MASTER),
        "fixes": [
            "from 03:28: no video-in-video / nest / split",
            "greetings unmuted (fix silence at 03:28)",
            "logos transparent — no black bar",
            "logo row KH | Wako | MUDE | Humble",
            "stages: clean 3s open then FS only",
        ],
        "master": str(OUT_MASTER),
    }
    (OUT_DRAFT.parent / "polish_v7c_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
