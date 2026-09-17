#!/usr/bin/env python3
"""Regie polish v7: directed picture base + static overlays (no typewriter), smooth logos, flyer.

Uses directed_body as picture truth. Overlays only:
  - KH intro after CDF/Stages (optional prepend)
  - Flyer slap
  - Static corner logos (KH|Wako|MUDE|Humble) top-right, no per-chunk fps fights
  - Static artist/story cards (no typewriter steps)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from assemble_directed_polish_v5 import (  # noqa: E402
    ASSETS,
    FONT_B,
    FONT_R,
    H,
    OUT_ALIAS,
    OUT_DRAFT,
    OUT_MASTER,
    THREADS,
    W,
    make_flow_creator_stamp,
    make_kh_intro_card,
    make_slap_wav,
    make_transparent_logo,
    probe_dur,
    run,
)
from assemble_polish_fix_v6 import make_mude_logo_only  # noqa: E402

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("PIL required")

DIRECTED_BODY = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\youtube_directed_v4\directed_body.mp4")
WORK = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v7")
LOGO_H = 52
LOGO_GAP = 14
LOGO_MARGIN = 24

# Absolute times on DIRECTED timeline (approx from part map / xfades ~same order)
# CDF+Stages ~0-4.6; content follows. Times tuned to directed_body (~1174s).
CARDS = [
    # (id, text, start, end, size, bold, align)
    ("welcome", "Welcome Fam to", 6.0, 9.0, 46, True, "center"),
    ("place", "More than just an event —\na place where every soul feels welcome.", 24.0, 29.0, 32, False, "center"),
    ("arpanito", "Arpanito\nRapper  |  Scholar  |  Flow Creator\n@arpanito", 92.0, 105.0, 34, True, "left"),
    ("arif", "Arif\nArtist  |  Music Producer  |  Filmmaker\nCertified Flow Creator\n@eskalahonthebeat", 118.0, 140.0, 32, True, "left"),
    ("lapa", "Lapa — beautiful people, easy to reach,\nby Greenstreet.", 210.0, 222.0, 32, False, "center"),
    ("humble", "Fam is looking so humble. Check them out.\n@_humble_project_\nhumble-project.com", 250.0, 270.0, 32, True, "center"),
    ("isaac", "Mr Isaac\nFounder of Wako Kungo\nMusician  |  Visionary  |  Scholar\nFlow Creator\n@mistah_isaac", 300.0, 340.0, 32, True, "left"),
    ("ana", "Ana\nArtist  |  Vocalist  |  Flow Creator\n@memyself.ana", 395.0, 430.0, 34, True, "left"),
    ("arpan_stage", "Arpanito\nRapper  |  Scholar  |  Flow Creator\n@arpanito", 505.0, 540.0, 34, True, "left"),
    ("maryna", "Maryna\nArtist  |  Vocalist  |  Flow Creator\n@soulvoice_vadini", 615.0, 650.0, 34, True, "left"),
    ("elisa", "Elisa\nArtist  |  Musician  |  Flow Creator\n@elisa.cas8", 735.0, 770.0, 34, True, "left"),
    ("flow", "Every participant is a Flow Creator —\nKiss Your Heart.", 1020.0, 1040.0, 30, False, "center"),
]

STAMPS = [
    (135.0, 138.0),
    (330.0, 333.0),
    (420.0, 423.0),
    (530.0, 533.0),
    (640.0, 643.0),
    (760.0, 763.0),
    (1032.0, 1035.0),
]


def text_card_png(text: str, dest: Path, *, fontsize: int, bold: bool, align: str) -> tuple[Path, int, int]:
    if dest.exists() and dest.stat().st_size > 800:
        meta = dest.with_suffix(".json")
        if meta.exists():
            m = json.loads(meta.read_text(encoding="utf-8"))
            return dest, int(m["x"]), int(m["y"])
    font = ImageFont.truetype(FONT_B if bold else FONT_R, fontsize)
    lines = text.split("\n")
    pad, line_h = 14, int(fontsize * 1.35)
    tmp = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    d0 = ImageDraw.Draw(tmp)
    max_w = max(d0.textbbox((0, 0), ln or " ", font=font)[2] for ln in lines)
    cw, ch = max_w + pad * 2, line_h * len(lines) + pad * 2
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    y = pad
    for ln in lines:
        bb = draw.textbbox((0, 0), ln or " ", font=font)
        tw = bb[2] - bb[0]
        x = pad if align == "left" else (cw - tw - pad if align == "right" else (cw - tw) // 2)
        for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2)):
            draw.text((x + dx, y + dy), ln, fill=(0, 0, 0, 170), font=font)
        draw.text((x, y), ln, fill=(255, 255, 255, 255), font=font)
        y += line_h
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest)
    if align == "center":
        ox, oy = (W - cw) // 2, int(H * 0.72)
    elif align == "right":
        ox, oy = W - cw - 60, int(H * 0.55)
    else:
        ox, oy = 60, 150
    dest.with_suffix(".json").write_text(json.dumps({"x": ox, "y": oy}), encoding="utf-8")
    return dest, ox, oy


def burn_chunk(base: Path, t0: float, t1: float, out: Path, *, flyer_at: float | None) -> Path:
    if out.exists() and out.stat().st_size > 80_000:
        try:
            if probe_dur(out) > 1:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_only.png"
    humble = ASSETS / "humble_logo_rgba.png"
    stamp = ASSETS / "flow_creator_stamp.png"
    flyer = ASSETS / "flyer_sticker.png"
    clip_dir = WORK / "cards"
    clip_dir.mkdir(exist_ok=True)

    dur = t1 - t0
    cards = []
    for cid, text, a, b, size, bold, align in CARDS:
        if b <= t0 or a >= t1:
            continue
        png, x, y = text_card_png(text, clip_dir / f"{cid}.png", fontsize=size, bold=bold, align=align)
        cards.append((png, x, y, max(0.0, a - t0), max(0.05, min(dur, b - t0))))
    stamps = [(max(0.0, a - t0), max(0.05, min(dur, b - t0))) for a, b in STAMPS if b > t0 and a < t1]

    # Always KH|Wako|MUDE|Humble — fixed count avoids layout jump/jerk
    logo_files = [kh, wako, mude, humble]
    for lf in logo_files:
        if not lf.exists():
            raise FileNotFoundError(lf)
    inputs = ["-ss", f"{t0:.2f}", "-t", f"{dur:.2f}", "-i", str(base)]
    for lf in logo_files:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(lf)]
    next_i = 1 + len(logo_files)

    st_i = None
    if stamps:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(stamp)]
        st_i = next_i
        next_i += 1

    fly_i = None
    fly_local = None
    if flyer_at is not None and flyer.exists() and t0 <= flyer_at < t1:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(flyer)]
        fly_i = next_i
        next_i += 1
        fly_local = flyer_at - t0

    card_idxs = []
    for png, x, y, a2, b2 in cards:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(png)]
        card_idxs.append((next_i, x, y, a2, b2))
        next_i += 1

    # LTR cluster top-right: KH | Wako | MUDE | Humble (KH leftmost of row)
    names = ["kh", "wk", "md", "hm"]
    fc = f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p[base];"
    for i, name in enumerate(names):
        fc += f"[{i+1}:v]scale=-1:{LOGO_H},format=rgba[{name}];"
    cur = "base"
    slot = LOGO_H + LOGO_GAP
    n_logos = len(names)
    for i, name in enumerate(names):
        nxt = f"L{i}"
        # distance from right edge: (n-1-i)*slot so last logo sits at MARGIN
        x_off = LOGO_MARGIN + (n_logos - 1 - i) * slot
        fc += f"[{cur}][{name}]overlay=W-w-{x_off}:{LOGO_MARGIN}[{nxt}];"
        cur = nxt

    n = n_logos
    if fly_i is not None and fly_local is not None:
        hold = 2.6
        fc += (
            f"[{fly_i}:v]format=rgba,scale=720:-1[fly];"
            f"[{cur}][fly]overlay=(W-w)/2:(H-h)/2:enable='between(t,{fly_local:.2f},{fly_local+hold:.2f})'[F];"
        )
        cur = "F"
        n += 1
    for pi, x, y, a2, b2 in card_idxs:
        fc += (
            f"[{pi}:v]format=rgba[c{pi}];"
            f"[{cur}][c{pi}]overlay={x}:{y}:format=auto:enable='between(t,{a2:.2f},{b2:.2f})'[C{n}];"
        )
        cur = f"C{n}"
        n += 1
    if st_i is not None and stamps:
        ens = "+".join(f"between(t\\,{a:.2f}\\,{b:.2f})" for a, b in stamps)
        fc += f"[{st_i}:v]format=rgba,scale=220:-1[st];"
        fc += f"[{cur}][st]overlay=W-w-280:H-h-90:enable='{ens}'[S];"
        cur = "S"
    fc += f"[{cur}]format=yuv420p[v]"

    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        *inputs, "-filter_complex", fc,
        "-map", "[v]", "-map", "0:a",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out


def assemble_overlays(base: Path, out: Path) -> Path:
    total = probe_dur(base)
    chunk = 90.0
    parts = []
    idx = 0
    t0 = 0.0
    flyer_at = 9.0  # directed clock; longer hold below
    while t0 < total - 0.05:
        t1 = min(total, t0 + chunk)
        cout = WORK / f"_ov_{idx:02d}.mp4"
        print(f"  overlay {t0:.0f}-{t1:.0f}s", flush=True)
        burn_chunk(base, t0, t1, cout, flyer_at=flyer_at)
        parts.append(cout)
        idx += 1
        t0 = t1
    lst = WORK / "_ov_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    tmp = WORK / "_ov_video.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(tmp)])
    # Remux continuous directed audio for sync
    print("  remux directed audio", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(tmp), "-i", str(base),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-shortest", str(out),
    ])
    return out


def prepend_kh(polished: Path, out: Path) -> Path:
    """KH intro card in front of polished directed cut."""
    kh = make_kh_intro_card(WORK / "00_kh_intro.mp4", 4.5)
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
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    if not DIRECTED_BODY.exists():
        raise SystemExit(f"missing directed body: {DIRECTED_BODY}")

    print("ASSETS", flush=True)
    v5a = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v5\assets")
    make_transparent_logo(v5a / "kh_logo.png", v5a / "kh_logo_rgba.png", mode="auto")
    make_transparent_logo(v5a / "wako_logo.jpeg", v5a / "wako_logo_rgba.png", mode="white")
    make_transparent_logo(v5a / "mude_logo_raw.png", v5a / "mude_logo_rgba.png", mode="black")
    (v5a / "mude_logo_only.png").unlink(missing_ok=True)
    make_mude_logo_only(v5a / "mude_logo_rgba.png", v5a / "mude_logo_only.png")
    make_transparent_logo(v5a / "humble_logo_raw.png", v5a / "humble_logo_rgba.png", mode="auto")
    make_flow_creator_stamp(v5a / "flow_creator_stamp.png")
    if not (v5a / "flyer_sticker.png").exists():
        im = Image.open(v5a / "flyer_lapa71.jpeg").convert("RGBA")
        im.thumbnail((780, 980), Image.Resampling.LANCZOS)
        bordered = Image.new("RGBA", (im.size[0] + 24, im.size[1] + 24), (255, 255, 255, 255))
        bordered.paste(im, (12, 12), im)
        bordered.save(v5a / "flyer_sticker.png")
    make_slap_wav(v5a / "slap.wav")

    for p in WORK.glob("_ov_*.mp4"):
        p.unlink(missing_ok=True)
    for p in (WORK / "polished.mp4", WORK / "pol_norm.mp4", WORK / "with_kh.mp4"):
        p.unlink(missing_ok=True)

    # Overlay on directed timeline (cards already timed to directed_body)
    print("OVERLAYS static cards + logos + flyer on directed_body", flush=True)
    polished = assemble_overlays(DIRECTED_BODY, WORK / "polished.mp4")

    print("PREPEND KH intro", flush=True)
    with_kh = prepend_kh(polished, WORK / "with_kh.mp4")

    print("EXPORT fluent master", flush=True)
    OUT_DRAFT.parent.mkdir(parents=True, exist_ok=True)
    OUT_ALIAS.parent.mkdir(parents=True, exist_ok=True)
    OUT_MASTER.parent.mkdir(parents=True, exist_ok=True)
    # Keep a non-destructive directed snapshot
    directed_snap = OUT_MASTER.parent / "Lapa71_TagusDropRhythm_YouTube_DIRECTED_BODY_16x9.mp4"
    if not directed_snap.exists():
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(DIRECTED_BODY), "-c", "copy", str(directed_snap)])
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-fflags", "+genpts",
        "-i", str(with_kh),
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p",
        "-af", "aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(OUT_DRAFT),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_ALIAS)])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_MASTER)])
    meta = {
        "title": "Tagus Drop Rhythm — Regie Polish v7",
        "duration_sec": probe_dur(OUT_MASTER),
        "base": str(DIRECTED_BODY),
        "fixes": [
            "directed picture (ViV/splits/stages) restored",
            "no typewriter — static cards",
            "smooth top-right logos KH|Wako|MUDE|Humble",
            "MUDE logo-only",
            "flyer slap",
            "Arpanito Rapper|Scholar|Flow Creator",
            "artist open: no ViV first 3s (rebuild directed stages)",
        ],
        "master": str(OUT_MASTER),
        "directed_snap": str(directed_snap),
    }
    (OUT_DRAFT.parent / "polish_v7_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
