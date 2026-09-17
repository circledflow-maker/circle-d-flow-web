#!/usr/bin/env python3
"""Lightweight typewriter overlays: pre-render RGBA clips, then overlay in short chunks."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from assemble_directed_polish_v5 import (  # noqa: E402
    ARPAN,
    ASSETS,
    FLOW_STAMP_HITS,
    FONT_B,
    FONT_R,
    FT,
    H,
    MASTER_IN,
    OUT_ALIAS,
    OUT_DRAFT,
    OUT_MASTER,
    THREADS,
    W,
    WORK,
    build_tail_block,
    build_timeline_body,
    enc,
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


def render_type_clip(text: str, dest: Path, *, dur: float, fontsize: int, bold: bool = True,
                     align: str = "center") -> tuple[Path, int, int]:
    """Pre-render typewriter on a tight transparent canvas (qtrle). Returns (path, overlay_x, overlay_y)."""
    meta = dest.with_suffix(".json")
    if dest.exists() and dest.stat().st_size > 10_000 and meta.exists():
        import json as _json
        m = _json.loads(meta.read_text(encoding="utf-8"))
        return dest, int(m["x"]), int(m["y"])

    dest.parent.mkdir(parents=True, exist_ok=True)
    frames_dir = dest.with_suffix("")
    frames_dir.mkdir(parents=True, exist_ok=True)
    font_path = FONT_B if bold else FONT_R
    try:
        font = ImageFont.truetype(font_path, fontsize)
    except OSError:
        font = ImageFont.load_default()

    lines_full = text.split("\n")
    pad = 16
    # measure full text box
    tmp = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    d0 = ImageDraw.Draw(tmp)
    max_w = 0
    total_h = 0
    line_h = int(fontsize * 1.35)
    for line in lines_full:
        bb = d0.textbbox((0, 0), line or " ", font=font)
        max_w = max(max_w, bb[2] - bb[0])
        total_h += line_h
    cw = max(64, max_w + pad * 2)
    ch = max(64, total_h + pad * 2)

    if align == "center":
        ox, oy = (W - cw) // 2, int(H * 0.70)
    elif align == "right":
        ox, oy = W - cw - 60, int(H * 0.52)
    else:
        ox, oy = 60, 140

    fps = 16
    nframes = max(8, int(dur * fps))
    type_frames = max(4, int(nframes * 0.7))
    chars = list(text)
    for i in range(nframes):
        canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)
        if i < type_frames:
            n = max(1, int(len(chars) * (i + 1) / type_frames))
        else:
            n = len(chars)
        shown = "".join(chars[:n])
        y = pad
        for line in shown.split("\n"):
            bb = draw.textbbox((0, 0), line or " ", font=font)
            tw = bb[2] - bb[0]
            if align == "center":
                x = (cw - tw) // 2
            elif align == "right":
                x = cw - tw - pad
            else:
                x = pad
            for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2)):
                draw.text((x + dx, y + dy), line, fill=(0, 0, 0, 170), font=font)
            draw.text((x, y), line, fill=(255, 255, 255, 255), font=font)
            y += line_h
        canvas.save(frames_dir / f"f{i:04d}.png")

    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-framerate", str(fps), "-i", str(frames_dir / "f%04d.png"),
        "-c:v", "qtrle", "-pix_fmt", "argb",
        str(dest),
    ])
    for p in frames_dir.glob("*.png"):
        p.unlink(missing_ok=True)
    try:
        frames_dir.rmdir()
    except OSError:
        pass
    import json as _json
    meta.write_text(_json.dumps({"x": ox, "y": oy, "w": cw, "h": ch}), encoding="utf-8")
    return dest, ox, oy


# Cards: (id, text, start, end, fontsize, bold, align)
CARDS = [
    ("welcome", "Welcome Fam to", 5.0, 7.2, 48, True, "center"),
    ("place", "More than just an event —\na place where every soul feels welcome.", 23.0, 27.5, 32, False, "center"),
    ("values", "Built on community values —\nsupportive space and gratitude.", 40.0, 52.0, 32, False, "center"),
    ("share", "Like and share — every soul and art finds space here.", 69.0, 84.0, 34, True, "center"),
    ("grow", "Together we grow.\nNow feel the day with us.", 85.0, 98.0, 40, True, "center"),
    ("arpan", "@arpanito", 88.0, 94.0, 38, True, "right"),
    ("ready", "Ready to meet today's artists and souls?", 100.0, 106.0, 40, True, "center"),
    ("okgo", "Ok, let's go.", 106.5, 109.0, 42, True, "center"),
    ("arif", "Arif\nArtist | Music Producer\nFilmmaker | Certified Flow Creator\n@eskalahonthebeat", 110.0, 118.0, 32, True, "left"),
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


def build_clips(cards, prefix: str) -> list[tuple[Path, int, int, float, float]]:
    out = []
    clip_dir = WORK / "type_clips"
    clip_dir.mkdir(exist_ok=True)
    for cid, text, a, b, size, bold, align in cards:
        dest = clip_dir / f"{prefix}_{cid}.mov"
        print(f"  typeclip {prefix}_{cid}", flush=True)
        path, ox, oy = render_type_clip(
            text, dest, dur=max(0.8, b - a), fontsize=size, bold=bold, align=align
        )
        out.append((path, ox, oy, a, b))
    return out


def burn_with_clips(base: Path, clips: list[tuple[Path, int, int, float, float]],
                    stamps: list[tuple[float, float]], out: Path, *, early_logos: bool) -> Path:
    if out.exists() and out.stat().st_size > 500_000:
        try:
            if probe_dur(out) > 60:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_rgba.png"
    humble = ASSETS / "humble_logo_rgba.png"
    stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")

    total = probe_dur(base)
    chunk_len = 60.0
    chunks: list[Path] = []
    idx = 0
    t0 = 0.0
    while t0 < total - 0.05:
        t1 = min(total, t0 + chunk_len)
        cout = WORK / f"_burn_chunk_{idx:02d}.mp4"
        if cout.exists() and cout.stat().st_size > 80_000:
            try:
                if probe_dur(cout) > 2:
                    chunks.append(cout)
                    idx += 1
                    t0 = t1
                    continue
            except Exception:
                cout.unlink(missing_ok=True)

        active = [(p, x, y, a, b) for p, x, y, a, b in clips if b > t0 and a < t1]
        local_stamps = [(a, b) for a, b in stamps if b > t0 and a < t1]
        print(f"  burn {idx} {t0:.0f}-{t1:.0f}s clips={len(active)} stamps={len(local_stamps)}", flush=True)

        inputs = ["-ss", f"{t0:.2f}", "-t", f"{t1 - t0:.2f}", "-i", str(base)]
        logo_start = 1
        inputs += ["-loop", "1", "-i", str(kh), "-loop", "1", "-i", str(wako)]
        mude_idx = None
        humble_idx = None
        next_i = 3
        if early_logos and t0 < 40:
            inputs += ["-loop", "1", "-i", str(mude)]
            mude_idx = next_i
            next_i += 1
        if t1 > 320:
            inputs += ["-loop", "1", "-i", str(humble)]
            humble_idx = next_i
            next_i += 1

        stamp_idx = None
        if local_stamps:
            inputs += ["-loop", "1", "-i", str(stamp)]
            stamp_idx = next_i
            next_i += 1

        clip_idxs = []
        for p, x, y, a, b in active:
            ca = max(0.0, t0 - a)
            clen = min(b, t1) - max(a, t0)
            inputs += ["-ss", f"{ca:.2f}", "-t", f"{clen:.2f}", "-i", str(p)]
            clip_idxs.append((next_i, x, y, max(0.0, a - t0), max(0.05, min(t1 - t0, b - t0))))
            next_i += 1

        fc_parts = [
            f"[{logo_start}:v]scale=90:-1,format=rgba[kh];",
            f"[{logo_start+1}:v]scale=90:-1,format=rgba[wk];",
            f"[0:v]setsar=1,format=yuv420p[base];",
            f"[base][kh]overlay=40:40:enable='gte(t,{max(0, 6 - t0):.2f})'[v0];",
            f"[v0][wk]overlay=W-w-40:40:enable='gte(t,{max(0, 35 - t0):.2f})'[v1];",
        ]
        cur = "v1"
        n = 2
        if mude_idx is not None:
            fc_parts.append(f"[{mude_idx}:v]scale=240:-1,format=rgba[mudec];")
            fc_parts.append(f"[{mude_idx}:v]scale=90:-1,format=rgba[mudes];")
            fc_parts.append(
                f"[{cur}][mudec]overlay=(W-w)/2:(H-h)/2:enable='between(t,{max(0,25-t0):.2f},{max(0.05,28-t0):.2f})'[v{n}];"
            )
            cur = f"v{n}"
            n += 1
            fc_parts.append(f"[{cur}][mudes]overlay=W-w-40:40:enable='gte(t,{max(0,28-t0):.2f})'[v{n}];")
            cur = f"v{n}"
            n += 1
        if humble_idx is not None:
            fc_parts.append(f"[{humble_idx}:v]scale=90:-1,format=rgba[hum];")
            fc_parts.append(f"[{cur}][hum]overlay=W-w-40:130:enable='gte(t,{max(0,326-t0):.2f})'[v{n}];")
            cur = f"v{n}"
            n += 1

        for ci, x, y, a2, b2 in clip_idxs:
            fc_parts.append(f"[{ci}:v]format=rgba[c{ci}];")
            fc_parts.append(
                f"[{cur}][c{ci}]overlay={x}:{y}:format=auto:enable='between(t,{a2:.2f},{b2:.2f})'[v{n}];"
            )
            cur = f"v{n}"
            n += 1

        if stamp_idx is not None and local_stamps:
            fc_parts.append(
                f"[{stamp_idx}:v]format=rgba,scale=280:-1,split={len(local_stamps)}"
                + "".join(f"[s{i}]" for i in range(len(local_stamps)))
                + ";"
            )
            for i, (a, b) in enumerate(local_stamps):
                a2 = max(0.0, a - t0)
                b2 = max(a2 + 0.2, min(t1 - t0, b - t0))
                fc_parts.append(
                    f"[s{i}]fade=t=in:st={a2:.2f}:d=0.1:alpha=1,"
                    f"fade=t=out:st={max(a2+0.2, b2-0.35):.2f}:d=0.3:alpha=1,"
                    f"rotate=a='if(lt(t-{a2:.2f}\\,0.28)\\,-0.2+0.2*(t-{a2:.2f})/0.28\\,0)':"
                    f"c=none:ow=rotw(iw):oh=roth(ih)[sp{i}];"
                )
                fc_parts.append(
                    f"[{cur}][sp{i}]overlay=W-w-340:H-h-110:enable='between(t,{a2:.2f},{b2:.2f})'[v{n}];"
                )
                cur = f"v{n}"
                n += 1

        fc_parts.append(f"[{cur}]format=yuv420p[v]")
        fc = "".join(fc_parts)

        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            *inputs,
            "-filter_complex", fc,
            "-map", "[v]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21", "-threads", THREADS,
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(cout),
        ])
        chunks.append(cout)
        idx += 1
        t0 = t1

    lst = WORK / "_burn_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in chunks), encoding="utf-8")
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

    for stale in (
        WORK / "polished_head.mp4",
        WORK / "tail_block.mp4",
        WORK / "tail_burned.mp4",
        WORK / "final_body.mp4",
    ):
        stale.unlink(missing_ok=True)
    for stale in WORK.glob("_burn_chunk_*.mp4"):
        stale.unlink(missing_ok=True)
    for stale in WORK.glob("_tail_burn_*.mp4"):
        stale.unlink(missing_ok=True)

    print("INTRO", flush=True)
    intro = make_kh_intro_card(WORK / "00_kh_intro.mp4", 5.8)

    print("TIMELINE", flush=True)
    body = build_timeline_body(WORK / "timeline_body.mp4")

    joined = WORK / "joined.mp4"
    if not (joined.exists() and joined.stat().st_size > 500_000):
        body_trim = WORK / "body_trim.mp4"
        if not (body_trim.exists() and body_trim.stat().st_size > 500_000):
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                "-ss", "4.5", "-i", str(body), "-c", "copy", str(body_trim),
            ])
        lst = WORK / "_join.txt"
        lst.write_text(f"file '{intro.as_posix()}'\nfile '{body_trim.as_posix()}'\n", encoding="utf-8")
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined),
        ])

    print("STICKER", flush=True)
    slapped = render_sticker_hit(joined, ASSETS / "flyer_lapa71.jpeg", slap, WORK / "with_sticker.mp4", 7.0, 1.7)

    cut_at = 340.0
    head_src = WORK / "head_src.mp4"
    if not (head_src.exists() and head_src.stat().st_size > 500_000):
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-t", f"{cut_at:.2f}", "-i", str(slapped), "-c", "copy", str(head_src),
        ])

    print("TYPE CLIPS head", flush=True)
    head_clips = build_clips(CARDS, "h")
    head_stamps = [h for h in FLOW_STAMP_HITS if h[0] < cut_at]

    print("BURN head", flush=True)
    head = burn_with_clips(head_src, head_clips, head_stamps, WORK / "polished_head.mp4", early_logos=True)

    print("TAIL media", flush=True)
    tail = build_tail_block(WORK / "tail_block.mp4")

    print("TYPE CLIPS tail Ana/Marijana/Elisa", flush=True)
    tail_clips = build_clips(TAIL_CARDS, "t")
    tail_stamps = [
        (206.5, 209.5),
        (313.5, 316.5),
        (428.5, 431.5),
        (442.0, 445.0),
    ]
    print("BURN tail", flush=True)
    # reuse burn but with different chunk prefix to avoid collision
    # temporarily redirect chunk names via renaming after
    for p in WORK.glob("_burn_chunk_*.mp4"):
        # don't delete head chunks already done — burn_with_clips uses same names.
        # head already finished; clear before tail burn
        pass
    # Clear burn chunks from head before tail (head already concat'd)
    for p in WORK.glob("_burn_chunk_*.mp4"):
        p.unlink(missing_ok=True)

    tail_burned = burn_with_clips(tail, tail_clips, tail_stamps, WORK / "tail_burned.mp4", early_logos=False)

    final_body = WORK / "final_body.mp4"
    lst = WORK / "_final.txt"
    lst.write_text(f"file '{head.as_posix()}'\nfile '{tail_burned.as_posix()}'\n", encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(final_body),
    ])

    dur = probe_dur(final_body)
    print(f"EXPORT {dur/60:.1f} min", flush=True)
    OUT_DRAFT.parent.mkdir(parents=True, exist_ok=True)
    OUT_ALIAS.parent.mkdir(parents=True, exist_ok=True)
    OUT_MASTER.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(final_body), "-c", "copy", str(OUT_DRAFT)])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_ALIAS)])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_MASTER)])

    meta = {
        "title": "Tagus Drop Rhythm — Polished Directed Aftermovie (EN)",
        "duration_sec": probe_dur(OUT_MASTER),
        "features": [
            "typewriter cards",
            "Flow Creator KH seal stamp",
            "Ana / Marijana / Elisa completed",
        ],
        "master": str(OUT_MASTER),
    }
    (OUT_DRAFT.parent / "polish_v5_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
