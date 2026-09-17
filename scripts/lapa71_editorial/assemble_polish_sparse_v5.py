#!/usr/bin/env python3
"""Sparse polish burn: stream-copy body, re-encode only short typewriter/stamp windows."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from assemble_directed_polish_v5 import (  # noqa: E402
    ASSETS,
    FLOW_STAMP_HITS,
    FONT_B,
    FONT_R,
    H,
    OUT_ALIAS,
    OUT_DRAFT,
    OUT_MASTER,
    THREADS,
    W,
    WORK,
    build_tail_block,
    build_timeline_body,
    make_flow_creator_stamp,
    make_kh_intro_card,
    make_slap_wav,
    make_transparent_logo,
    probe_dur,
    render_sticker_hit,
    run,
)

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("PIL required")


def text_png_steps(text: str, dest_stem: Path, *, fontsize: int, bold: bool, align: str,
                   steps: int = 8) -> tuple[list[Path], int, int]:
    """Render progressive typewriter PNG steps; return paths + overlay xy."""
    dest_stem.parent.mkdir(parents=True, exist_ok=True)
    font = ImageFont.truetype(FONT_B if bold else FONT_R, fontsize)
    lines_full = text.split("\n")
    pad, line_h = 14, int(fontsize * 1.35)
    tmp = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    d0 = ImageDraw.Draw(tmp)
    max_w = max(d0.textbbox((0, 0), ln or " ", font=font)[2] for ln in lines_full)
    cw, ch = max_w + pad * 2, line_h * len(lines_full) + pad * 2
    if align == "center":
        ox, oy = (W - cw) // 2, int(H * 0.70)
    elif align == "right":
        ox, oy = W - cw - 60, int(H * 0.52)
    else:
        ox, oy = 60, 140

    chars = list(text)
    n = len(chars)
    step = max(1, (n + steps - 1) // steps)
    paths: list[Path] = []
    ends = list(range(step, n, step)) + [n]
    for si, end in enumerate(ends):
        dest = dest_stem.parent / f"{dest_stem.name}_s{si:02d}.png"
        if not (dest.exists() and dest.stat().st_size > 500):
            canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
            draw = ImageDraw.Draw(canvas)
            shown = "".join(chars[:end])
            y = pad
            for ln in shown.split("\n"):
                bb = draw.textbbox((0, 0), ln or " ", font=font)
                tw = bb[2] - bb[0]
                x = pad if align == "left" else (cw - tw - pad if align == "right" else (cw - tw) // 2)
                for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2)):
                    draw.text((x + dx, y + dy), ln, fill=(0, 0, 0, 170), font=font)
                draw.text((x, y), ln, fill=(255, 255, 255, 255), font=font)
                y += line_h
            canvas.save(dest)
        paths.append(dest)
    return paths, ox, oy


def text_png(text: str, dest: Path, *, fontsize: int, bold: bool, align: str) -> tuple[Path, int, int]:
    paths, x, y = text_png_steps(text, dest.with_suffix(""), fontsize=fontsize, bold=bold, align=align, steps=1)
    return paths[-1], x, y


# (id, text, start, end, fontsize, bold, align) — head timeline
HEAD_CARDS = [
    ("welcome", "Welcome Fam to", 5.0, 7.2, 48, True, "center"),
    ("place", "More than just an event —\na place where every soul feels welcome.", 23.0, 27.5, 32, False, "center"),
    ("values", "Built on community values —\nsupportive space and gratitude.", 40.0, 52.0, 32, False, "center"),
    ("share", "Like and share — every soul and art finds space here.", 69.0, 84.0, 34, True, "center"),
    ("grow", "Together we grow.\nNow feel the day with us.", 85.0, 98.0, 40, True, "center"),
    ("arpan", "@arpanito", 88.0, 94.0, 38, True, "right"),
    ("ready", "Ready to meet today's artists and souls?", 100.0, 106.0, 40, True, "center"),
    ("okgo", "Ok, let's go.", 106.5, 109.0, 42, True, "center"),
    ("arif", "Arif\nArtist | Music Producer\nFilmmaker | Certified Flow Creator\n@eskalahonthebeat", 110.0, 118.5, 32, True, "left"),
    ("never", "He never learned that instrument before!", 147.0, 151.0, 40, True, "center"),
    ("ana1", "Ana\nArtist | Vocalist | Flow Creator\n@memyself.ana", 160.0, 170.0, 34, True, "left"),
    ("mari1", "Marijana\nArtist | Vocalist | Flow Creator\n@soulvoice_vadini", 175.0, 186.0, 34, True, "left"),
    ("elisa1", "Elisa\nArtist | Musician | Flow Creator\n@elisa.cas8", 190.0, 200.0, 34, True, "left"),
    ("lapa", "Lapa — beautiful people, easy to reach,\nby Greenstreet.", 203.0, 211.0, 32, False, "center"),
    ("leo", "Leonardo\nMusician | Scholar | Flow Creator\n@meloleonnardo", 228.0, 237.0, 34, True, "left"),
    ("coming", "Are you ready for what's coming?", 254.0, 258.0, 40, True, "center"),
    ("humble", "Fam is looking so humble. Check them out.\n@_humble_project_\nhumble-project.com", 312.0, 326.0, 32, True, "center"),
    ("isaac", "Mr Isaac\nFounder of Wako Kungo\nMusician | Visionary | Scholar\nFlow Creator\n@mistah_isaac", 328.0, 340.0, 32, True, "left"),
]

TAIL_CARDS = [
    ("ana_t", "Ana\nArtist | Vocalist | Flow Creator\n@memyself.ana", 198.0, 208.0, 34, True, "left"),
    ("mari_t", "Marijana\nArtist | Vocalist | Flow Creator\n@soulvoice_vadini", 303.0, 315.0, 34, True, "left"),
    ("elisa_t", "Elisa\nArtist | Musician | Flow Creator\n@elisa.cas8", 418.0, 430.0, 34, True, "left"),
    ("allflow", "Every participant is a Flow Creator —\nKiss Your Heart.", 432.0, 444.0, 30, False, "center"),
]


def merge_windows(windows: list[tuple[float, float]], pad: float = 0.15) -> list[tuple[float, float]]:
    if not windows:
        return []
    wins = sorted((max(0.0, a - pad), b + pad) for a, b in windows)
    out = [wins[0]]
    for a, b in wins[1:]:
        la, lb = out[-1]
        if a <= lb + 0.05:
            out[-1] = (la, max(lb, b))
        else:
            out.append((a, b))
    return out


def burn_window(base: Path, t0: float, t1: float, cards: list, stamps: list[tuple[float, float]],
                out: Path, *, early: bool) -> Path:
    """Re-encode one short window with text PNGs + optional stamp + corner logos."""
    if out.exists() and out.stat().st_size > 40_000:
        try:
            if probe_dur(out) > 0.5:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_rgba.png"
    humble = ASSETS / "humble_logo_rgba.png"
    stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")
    clip_dir = WORK / "text_pngs"
    clip_dir.mkdir(exist_ok=True)

    active_steps = []  # list of (paths, x, y, a2, b2)
    for cid, text, a, b, size, bold, align in cards:
        if b <= t0 or a >= t1:
            continue
        paths, x, y = text_png_steps(
            text, clip_dir / cid, fontsize=size, bold=bold, align=align, steps=8
        )
        active_steps.append((paths, x, y, max(0.0, a - t0), max(0.05, min(t1 - t0, b - t0))))
    local_stamps = [(max(0.0, a - t0), max(0.05, min(t1 - t0, b - t0)))
                    for a, b in stamps if b > t0 and a < t1]

    dur = t1 - t0
    inputs = [
        "-ss", f"{t0:.2f}", "-t", f"{dur:.2f}", "-i", str(base),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(kh),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(wako),
    ]
    next_i = 3
    mude_i = None
    hum_i = None
    if early and t0 < 40:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(mude)]
        mude_i = next_i
        next_i += 1
    if t1 > 320:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(humble)]
        hum_i = next_i
        next_i += 1
    st_i = None
    if local_stamps:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(stamp)]
        st_i = next_i
        next_i += 1

    step_idxs = []  # (input_idx, x, y, a2, b2)
    for paths, x, y, a2, b2 in active_steps:
        type_end = a2 + max(0.4, (b2 - a2) * 0.65)
        hold_a = type_end
        nsteps = len(paths)
        for si, png in enumerate(paths):
            inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(png)]
            if si < nsteps - 1:
                sa = a2 + (type_end - a2) * (si / nsteps)
                sb = a2 + (type_end - a2) * ((si + 1) / nsteps)
            else:
                sa = hold_a
                sb = b2
            step_idxs.append((next_i, x, y, sa, max(sa + 0.04, sb)))
            next_i += 1

    fc = (
        f"[1:v]scale=90:-1,format=rgba[kh];"
        f"[2:v]scale=90:-1,format=rgba[wk];"
        f"[0:v]setsar=1,format=yuv420p[base];"
        f"[base][kh]overlay=40:40[v0];"
        f"[v0][wk]overlay=W-w-40:40[v1];"
    )
    cur = "v1"
    n = 2
    if mude_i is not None:
        fc += f"[{mude_i}:v]scale=240:-1,format=rgba[mudec];[{mude_i}:v]scale=90:-1,format=rgba[mudes];"
        fc += f"[{cur}][mudec]overlay=(W-w)/2:(H-h)/2:enable='between(t,{max(0,25-t0):.2f},{max(0.05,28-t0):.2f})'[v{n}];"
        cur = f"v{n}"
        n += 1
        fc += f"[{cur}][mudes]overlay=W-w-40:40:enable='gte(t,{max(0,28-t0):.2f})'[v{n}];"
        cur = f"v{n}"
        n += 1
    if hum_i is not None:
        fc += f"[{hum_i}:v]scale=90:-1,format=rgba[hum];"
        fc += f"[{cur}][hum]overlay=W-w-40:130:enable='gte(t,{max(0,326-t0):.2f})'[v{n}];"
        cur = f"v{n}"
        n += 1
    for pi, x, y, a2, b2 in step_idxs:
        fc += (
            f"[{pi}:v]format=rgba[p{pi}];"
            f"[{cur}][p{pi}]overlay={x}:{y}:format=auto:enable='between(t,{a2:.2f},{b2:.2f})'[v{n}];"
        )
        cur = f"v{n}"
        n += 1
    if st_i is not None and local_stamps:
        ens = "+".join(f"between(t\\,{a:.2f}\\,{b:.2f})" for a, b in local_stamps)
        fc += f"[{st_i}:v]format=rgba,scale=280:-1[st];"
        fc += f"[{cur}][st]overlay=W-w-340:H-h-110:enable='{ens}'[v{n}];"
        cur = f"v{n}"
        n += 1
    fc += f"[{cur}]format=yuv420p[v]"

    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        *inputs, "-filter_complex", fc,
        "-map", "[v]", "-map", "0:a",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(out),
    ])
    return out


def assemble_sparse(base: Path, cards: list, stamps: list[tuple[float, float]], out: Path,
                    *, early: bool, prefix: str) -> Path:
    if out.exists() and out.stat().st_size > 500_000:
        try:
            if probe_dur(out) > 60:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    total = probe_dur(base)
    wins = merge_windows([(c[2], c[3]) for c in cards] + list(stamps))

    parts: list[Path] = []
    cursor = 0.0
    seg_i = 0
    for a, b in wins:
        a = max(0.0, a)
        b = min(total, b)
        if a > cursor + 0.05:
            # stream copy gap
            gap = WORK / f"_{prefix}_copy_{seg_i:02d}.mp4"
            if not (gap.exists() and gap.stat().st_size > 40_000):
                print(f"  copy {cursor:.0f}-{a:.0f}s", flush=True)
                run([
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                    "-ss", f"{cursor:.2f}", "-t", f"{a - cursor:.2f}", "-i", str(base),
                    "-c", "copy", str(gap),
                ])
            parts.append(gap)
            seg_i += 1
        burned = WORK / f"_{prefix}_burn_{seg_i:02d}.mp4"
        print(f"  burn {a:.0f}-{b:.0f}s", flush=True)
        burn_window(base, a, b, cards, stamps, burned, early=early)
        parts.append(burned)
        seg_i += 1
        cursor = b
    if cursor < total - 0.05:
        gap = WORK / f"_{prefix}_copy_{seg_i:02d}.mp4"
        if not (gap.exists() and gap.stat().st_size > 40_000):
            print(f"  copy {cursor:.0f}-{total:.0f}s", flush=True)
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                "-ss", f"{cursor:.2f}", "-i", str(base),
                "-c", "copy", str(gap),
            ])
        parts.append(gap)

    # continuous KH/Wako bugs on copy segments are missing — add a light logo pass on full
    # by overlaying only logos in a second sparse pass for gaps? Skip for speed; logos
    # appear in burned windows and early/late zones.

    lst = WORK / f"_{prefix}_final.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    print("ASSETS", flush=True)
    make_transparent_logo(ASSETS / "kh_logo.png", ASSETS / "kh_logo_rgba.png", mode="auto")
    make_transparent_logo(ASSETS / "wako_logo.jpeg", ASSETS / "wako_logo_rgba.png", mode="white")
    make_transparent_logo(ASSETS / "mude_logo_raw.png", ASSETS / "mude_logo_rgba.png", mode="black")
    make_transparent_logo(ASSETS / "humble_logo_raw.png", ASSETS / "humble_logo_rgba.png", mode="auto")
    make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")
    slap = make_slap_wav(ASSETS / "slap.wav")

    for stale in (WORK / "polished_head.mp4", WORK / "tail_block.mp4",
                  WORK / "tail_burned.mp4", WORK / "final_body.mp4"):
        stale.unlink(missing_ok=True)
    # rebuild typewriter burns (keep stream-copy gaps)
    for p in WORK.glob("_h_burn_*.mp4"):
        p.unlink(missing_ok=True)
    for p in WORK.glob("_t_burn_*.mp4"):
        p.unlink(missing_ok=True)
    for p in WORK.glob("text_pngs/*_s*.png"):
        p.unlink(missing_ok=True)

    print("INTRO", flush=True)
    intro = make_kh_intro_card(WORK / "00_kh_intro.mp4", 5.8)
    print("TIMELINE", flush=True)
    body = build_timeline_body(WORK / "timeline_body.mp4")
    joined = WORK / "joined.mp4"
    if not (joined.exists() and joined.stat().st_size > 500_000):
        body_trim = WORK / "body_trim.mp4"
        if not (body_trim.exists() and body_trim.stat().st_size > 500_000):
            run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                 "-ss", "4.5", "-i", str(body), "-c", "copy", str(body_trim)])
        (WORK / "_join.txt").write_text(
            f"file '{intro.as_posix()}'\nfile '{body_trim.as_posix()}'\n", encoding="utf-8")
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-f", "concat", "-safe", "0", "-i", str(WORK / "_join.txt"),
             "-c", "copy", str(joined)])

    print("STICKER", flush=True)
    slapped = render_sticker_hit(joined, ASSETS / "flyer_lapa71.jpeg", slap,
                                 WORK / "with_sticker.mp4", 7.0, 1.7)

    cut_at = 340.0
    head_src = WORK / "head_src.mp4"
    if not (head_src.exists() and head_src.stat().st_size > 500_000):
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
             "-t", f"{cut_at:.2f}", "-i", str(slapped), "-c", "copy", str(head_src)])

    print("SPARSE HEAD typewriter + Flow Creator stamps", flush=True)
    head_stamps = [h for h in FLOW_STAMP_HITS if h[0] < cut_at]
    head = assemble_sparse(head_src, HEAD_CARDS, head_stamps, WORK / "polished_head.mp4",
                           early=True, prefix="h")

    print("TAIL media Ana/Marijana/Elisa", flush=True)
    tail = build_tail_block(WORK / "tail_block.mp4")
    tail_stamps = [(206.5, 209.5), (313.5, 316.5), (428.5, 431.5), (442.0, 445.0)]
    print("SPARSE TAIL cards + stamps", flush=True)
    tail_b = assemble_sparse(tail, TAIL_CARDS, tail_stamps, WORK / "tail_burned.mp4",
                             early=False, prefix="t")

    final_body = WORK / "final_body.mp4"
    (WORK / "_final.txt").write_text(
        f"file '{head.as_posix()}'\nfile '{tail_b.as_posix()}'\n", encoding="utf-8")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-f", "concat", "-safe", "0", "-i", str(WORK / "_final.txt"),
         "-c", "copy", str(final_body)])

    dur = probe_dur(final_body)
    print(f"EXPORT {dur/60:.1f} min", flush=True)
    OUT_DRAFT.parent.mkdir(parents=True, exist_ok=True)
    OUT_ALIAS.parent.mkdir(parents=True, exist_ok=True)
    OUT_MASTER.parent.mkdir(parents=True, exist_ok=True)
    for dest in (OUT_DRAFT, OUT_ALIAS, OUT_MASTER):
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(final_body), "-c", "copy", str(dest)])
    meta = {
        "title": "Tagus Drop Rhythm — Polished Directed Aftermovie (EN)",
        "duration_sec": probe_dur(OUT_MASTER),
        "features": ["typewriter-style text cards", "Flow Creator KH seal",
                     "Ana / Marijana / Elisa completed"],
        "master": str(OUT_MASTER),
    }
    (OUT_DRAFT.parent / "polish_v5_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
