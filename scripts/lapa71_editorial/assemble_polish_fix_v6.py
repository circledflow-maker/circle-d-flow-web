#!/usr/bin/env python3
"""Polish fix v6 — intro cards, top-right logo row, Ana at night, fluent stereo 16:9 audio."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from assemble_chronological_youtube import crop_intro_png, still_card  # noqa: E402
from assemble_directed_polish_v5 import (  # noqa: E402
    ASSETS,
    FLOW_STAMP_HITS,
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
from assemble_polish_sparse_v5 import (  # noqa: E402
    merge_windows,
    text_png_steps,
)
from contract import INTRO  # noqa: E402

try:
    from PIL import Image
except ImportError:
    raise SystemExit("PIL required")

LOGO_H = 56
LOGO_GAP = 10
LOGO_MARGIN = 20

# Head: no early Ana/Marijana/Elisa — those belong to night performances
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

HEAD_STAMPS = [
    (116.5, 119.5),   # Arif Flow Creator
    (235.5, 238.5),   # Leonardo
    (340.0, 343.0),   # Mr Isaac (near cut)
]
# clamp isaac stamp inside head
HEAD_STAMPS = [(a, min(b, 339.5)) for a, b in HEAD_STAMPS if a < 340]

TAIL_STAMPS = [(206.5, 209.5), (313.5, 316.5), (428.5, 431.5), (442.0, 445.0)]


def make_mude_logo_only(src: Path, dest: Path) -> Path:
    """Keep ]MUDE[ mark only — strip Instagram handle bar and cafeteria subtext if present."""
    if dest.exists() and dest.stat().st_size > 3000:
        return dest
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    # Drop bottom Instagram / metadata strip (typically ~15–25% of height)
    crop_h = int(h * 0.78)
    im = im.crop((0, 0, w, crop_h))
    # Knock near-black and near-white chrome
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if r < 28 and g < 28 and b < 28:
                px[x, y] = (0, 0, 0, 0)
            elif r > 245 and g > 245 and b > 245 and y > im.size[1] * 0.55:
                # kill pale IG bar leftovers
                px[x, y] = (r, g, b, 0)
    bbox = im.split()[-1].getbbox()
    if bbox:
        im = im.crop(bbox)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)
    return dest


def logo_row_filter(labels: list[str], start_idx: int) -> tuple[str, str, int]:
    """Build scale+overlay chain for top-right horizontal logo row. Returns (fc_prefix, last_label, next_n)."""
    # labels are filter labels after scale, e.g. kh, wk, mude, hum
    n = len(labels)
    # Place from right to left: last logo flush right
    # overlay x = W - MARGIN - w - (n-1-i)*(LOGO_H + LOGO_GAP) approximately using successive overlays
    # Simpler: overlay each with x = W-w-MARGIN - i*(LOGO_H+GAP) counting from right
    parts = []
    for i, lab in enumerate(labels):
        parts.append(f"[{start_idx + i}:v]scale=-1:{LOGO_H},format=rgba[{lab}];")
    # Chain overlays onto base — we'll append to caller
    return "".join(parts), labels, start_idx + n


def burn_window_v6(base: Path, t0: float, t1: float, cards: list, stamps: list[tuple[float, float]],
                   out: Path, *, show_humble: bool, logos_only: bool = False) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        try:
            if probe_dur(out) > 0.4:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_only.png"
    humble = ASSETS / "humble_logo_rgba.png"
    stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")
    clip_dir = WORK / "text_pngs"
    clip_dir.mkdir(exist_ok=True)

    active_steps = []
    if not logos_only:
        for cid, text, a, b, size, bold, align in cards:
            if b <= t0 or a >= t1:
                continue
            paths, x, y = text_png_steps(
                text, clip_dir / cid, fontsize=size, bold=bold, align=align, steps=8
            )
            active_steps.append((paths, x, y, max(0.0, a - t0), max(0.05, min(t1 - t0, b - t0))))
    local_stamps = [] if logos_only else [
        (max(0.0, a - t0), max(0.05, min(t1 - t0, b - t0)))
        for a, b in stamps if b > t0 and a < t1
    ]

    dur = t1 - t0
    logo_files = [kh, wako, mude]
    if show_humble:
        logo_files.append(humble)
    inputs = ["-ss", f"{t0:.2f}", "-t", f"{dur:.2f}", "-i", str(base)]
    for lf in logo_files:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(lf)]
    next_i = 1 + len(logo_files)

    st_i = None
    if local_stamps:
        inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(stamp)]
        st_i = next_i
        next_i += 1

    step_idxs = []
    for paths, x, y, a2, b2 in active_steps:
        type_end = a2 + max(0.4, (b2 - a2) * 0.65)
        nsteps = len(paths)
        for si, png in enumerate(paths):
            inputs += ["-loop", "1", "-t", f"{dur:.2f}", "-i", str(png)]
            if si < nsteps - 1:
                sa = a2 + (type_end - a2) * (si / nsteps)
                sb = a2 + (type_end - a2) * ((si + 1) / nsteps)
            else:
                sa, sb = type_end, b2
            step_idxs.append((next_i, x, y, sa, max(sa + 0.04, sb)))
            next_i += 1

    # Top-right row L→R: KH | Wako | MUDE [| Humble] — rightmost flush to edge
    names_ltr = ["kh", "wk", "md"] + (["hm"] if show_humble else [])
    fc = f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
    fc += f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p[base];"
    for i, name in enumerate(names_ltr):
        fc += f"[{i+1}:v]scale=-1:{LOGO_H},format=rgba[{name}];"
    cur = "base"
    for i, name in enumerate(reversed(names_ltr)):
        nxt = f"v{i}"
        slot = LOGO_H + LOGO_GAP
        fc += f"[{cur}][{name}]overlay=W-w-{LOGO_MARGIN + i * slot}:{LOGO_MARGIN}[{nxt}];"
        cur = nxt
    nlab = len(names_ltr)
    for pi, x, y, a2, b2 in step_idxs:
        fc += (
            f"[{pi}:v]format=rgba[p{pi}];"
            f"[{cur}][p{pi}]overlay={x}:{y}:format=auto:enable='between(t,{a2:.2f},{b2:.2f})'[v{nlab}];"
        )
        cur = f"v{nlab}"
        nlab += 1
    if st_i is not None and local_stamps:
        ens = "+".join(f"between(t\\,{a:.2f}\\,{b:.2f})" for a, b in local_stamps)
        fc += f"[{st_i}:v]format=rgba,scale=240:-1[st];"
        fc += f"[{cur}][st]overlay=W-w-300:H-h-100:enable='{ens}'[v{nlab}];"
        cur = f"v{nlab}"
        nlab += 1
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


def assemble_v6(base: Path, cards: list, stamps: list[tuple[float, float]], out: Path,
                *, prefix: str, humble_after: float | None) -> Path:
    """Re-encode every segment (logos always on) for fluent A/V — no stream-copy gaps."""
    if out.exists() and out.stat().st_size > 500_000:
        try:
            if probe_dur(out) > 60:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    total = probe_dur(base)
    wins = merge_windows([(c[2], c[3]) for c in cards] + list(stamps), pad=0.2)
    # Fill timeline with burn windows + logo-only gaps
    parts: list[Path] = []
    cursor = 0.0
    seg_i = 0

    def show_hum(t_mid: float) -> bool:
        return humble_after is not None and t_mid >= humble_after

    for a, b in wins:
        a, b = max(0.0, a), min(total, b)
        if a > cursor + 0.05:
            gap = WORK / f"_{prefix}_gap_{seg_i:02d}.mp4"
            print(f"  logos {cursor:.0f}-{a:.0f}s", flush=True)
            burn_window_v6(base, cursor, a, [], [], gap,
                           show_humble=show_hum((cursor + a) / 2), logos_only=True)
            parts.append(gap)
            seg_i += 1
        burned = WORK / f"_{prefix}_burn_{seg_i:02d}.mp4"
        print(f"  burn {a:.0f}-{b:.0f}s", flush=True)
        burn_window_v6(base, a, b, cards, stamps, burned,
                       show_humble=show_hum((a + b) / 2), logos_only=False)
        parts.append(burned)
        seg_i += 1
        cursor = b
    if cursor < total - 0.05:
        gap = WORK / f"_{prefix}_gap_{seg_i:02d}.mp4"
        print(f"  logos {cursor:.0f}-{total:.0f}s", flush=True)
        burn_window_v6(base, cursor, total, [], [], gap,
                       show_humble=show_hum((cursor + total) / 2), logos_only=True)
        parts.append(gap)

    lst = WORK / f"_{prefix}_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    # Concat demux then remux with continuous audio from base for perfect sync
    tmp_v = WORK / f"_{prefix}_video_concat.mp4"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(tmp_v),
    ])
    print(f"  remux continuous audio from source -> {out.name}", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(tmp_v),
        "-i", str(base),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-shortest",
        str(out),
    ])
    return out


def make_intro_pair() -> list[Path]:
    parts = []
    cdf_src = INTRO / "01_circle_d_flow_presents.png"
    stages_src = INTRO / "02_circle_d_stages.png"
    if cdf_src.exists():
        cdf = crop_intro_png(cdf_src, WORK / "intro_cdf_clean.png")
        out = WORK / "00_cdf_intro.mp4"
        if out.exists():
            out.unlink()
        still_card(cdf, out, 2.4, center_scale=0.70)
        parts.append(out)
    if stages_src.exists():
        st = crop_intro_png(stages_src, WORK / "intro_stages_clean.png")
        out = WORK / "00_stages_intro.mp4"
        if out.exists():
            out.unlink()
        still_card(st, out, 2.4, center_scale=0.70)
        parts.append(out)
    return parts


def fluent_export(src: Path, dest: Path) -> None:
    """Full 16:9 25fps stereo remux — fixes DTS/sync and letterboxing."""
    dur = probe_dur(src)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-fflags", "+genpts",
        "-i", str(src),
        "-vf", (
            f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
            f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=25,format=yuv420p"
        ),
        "-af", "aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(dest),
    ])
    print(f"  exported {dest.name} {probe_dur(dest)/60:.1f} min", flush=True)


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)

    print("ASSETS", flush=True)
    make_transparent_logo(ASSETS / "kh_logo.png", ASSETS / "kh_logo_rgba.png", mode="auto")
    make_transparent_logo(ASSETS / "wako_logo.jpeg", ASSETS / "wako_logo_rgba.png", mode="white")
    make_transparent_logo(ASSETS / "mude_logo_raw.png", ASSETS / "mude_logo_rgba.png", mode="black")
    make_mude_logo_only(ASSETS / "mude_logo_rgba.png", ASSETS / "mude_logo_only.png")
    make_transparent_logo(ASSETS / "humble_logo_raw.png", ASSETS / "humble_logo_rgba.png", mode="auto")
    make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")
    slap = make_slap_wav(ASSETS / "slap.wav")

    # Force rebuild of stages that affect intro/logos/audio
    for stale in (
        WORK / "joined.mp4", WORK / "with_sticker.mp4", WORK / "head_src.mp4",
        WORK / "polished_head.mp4", WORK / "tail_burned.mp4", WORK / "final_body.mp4",
        WORK / "final_fluent.mp4", WORK / "00_kh_intro.mp4",
        WORK / "00_cdf_intro.mp4", WORK / "00_stages_intro.mp4",
    ):
        stale.unlink(missing_ok=True)
    for pat in ("_h_burn_*.mp4", "_h_gap_*.mp4", "_t_burn_*.mp4", "_t_gap_*.mp4",
                "_h_copy_*.mp4", "_t_copy_*.mp4", "_h_video_concat.mp4", "_t_video_concat.mp4"):
        for p in WORK.glob(pat):
            p.unlink(missing_ok=True)

    print("INTRO CDF + Circle D Stages + KH", flush=True)
    intro_parts = make_intro_pair()
    kh = make_kh_intro_card(WORK / "00_kh_intro.mp4", 5.0)
    intro_parts.append(kh)

    print("TIMELINE", flush=True)
    body = build_timeline_body(WORK / "timeline_body.mp4")
    body_trim = WORK / "body_trim.mp4"
    if not (body_trim.exists() and body_trim.stat().st_size > 500_000):
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
             "-ss", "4.5", "-i", str(body), "-c", "copy", str(body_trim)])

    # Rebuild joined with brand intros
    lst = WORK / "_join_v6.txt"
    lines = [f"file '{p.as_posix()}'\n" for p in intro_parts]
    lines.append(f"file '{body_trim.as_posix()}'\n")
    lst.write_text("".join(lines), encoding="utf-8")
    joined = WORK / "joined.mp4"
    # Re-encode join for fluent stereo (intros have silence, body has mono)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p",
        "-af", "aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(joined),
    ])

    print("STICKER", flush=True)
    slapped = render_sticker_hit(joined, ASSETS / "flyer_lapa71.jpeg", slap,
                                 WORK / "with_sticker.mp4", 7.0 + 2.4 + 2.4, 1.7)
    # Note: sticker time shifted by CDF+Stages (~4.8s). Welcome text was @5s on old timeline.
    # After +~4.8s intros before KH which replaced old skip… joined = intros(~9.8) + body_trim.
    # Sticker hit should stay near "Welcome Fam" — approx after KH (~5s) + small buffer → ~10-12s.
    # Rebuild sticker with better timing:
    slapped.unlink(missing_ok=True)
    (WORK / "_sticker_head.mp4").unlink(missing_ok=True)
    (WORK / "_sticker_tail.mp4").unlink(missing_ok=True)
    slapped = render_sticker_hit(joined, ASSETS / "flyer_lapa71.jpeg", slap,
                                 WORK / "with_sticker.mp4", 11.0, 1.7)

    cut_at = 345.0  # slightly longer head to keep isaac card
    head_src = WORK / "head_src.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
         "-t", f"{cut_at:.2f}", "-i", str(slapped),
         "-vf", f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p",
         "-af", "aformat=sample_rates=48000:channel_layouts=stereo",
         "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", THREADS,
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
         str(head_src)])

    # Shift head card times: old cards assumed ~KH-only intro; now +CDF+Stages (~4.8s) before KH
    # body_trim still starts after old skip; KH is 5s; CDF+Stages ~4.8 → offset ≈ +4.8 vs previous sparse times
    # Previous head_src started with KH@0. New head_src: CDF@0, Stages@2.4, KH@4.8, content@9.8
    # Old welcome was @5 on KH-first timeline. New welcome ≈ 5 + 4.8 = 9.8
    OFFSET = 4.8

    def shift_cards(cards, off):
        return [(cid, t, a + off, b + off, sz, bold, al) for cid, t, a, b, sz, bold, al in cards]

    head_cards = shift_cards(HEAD_CARDS, OFFSET)
    head_stamps = [(a + OFFSET, b + OFFSET) for a, b in HEAD_STAMPS]

    print("HEAD overlays (typewriter + top-right logos)", flush=True)
    head = assemble_v6(head_src, head_cards, head_stamps, WORK / "polished_head.mp4",
                       prefix="h6", humble_after=312 + OFFSET)

    print("TAIL Ana (night) + Marijana + Elisa", flush=True)
    # Force rebuild tail so audio is stereo-consistent
    (WORK / "tail_block.mp4").unlink(missing_ok=True)
    for p in WORK.glob("tail_*.mp4"):
        p.unlink(missing_ok=True)
    tail = build_tail_block(WORK / "tail_block.mp4")
    # Normalize tail to 16:9 stereo before burn
    tail_n = WORK / "tail_norm.mp4"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(tail),
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p",
        "-af", "aformat=sample_rates=48000:channel_layouts=stereo,aresample=async=1:first_pts=0",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(tail_n),
    ])
    tail_b = assemble_v6(tail_n, TAIL_CARDS, TAIL_STAMPS, WORK / "tail_burned.mp4",
                         prefix="t6", humble_after=None)

    print("CONCAT head + night tail", flush=True)
    final_raw = WORK / "final_body.mp4"
    (WORK / "_final_v6.txt").write_text(
        f"file '{head.as_posix()}'\nfile '{tail_b.as_posix()}'\n", encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(WORK / "_final_v6.txt"),
        "-c", "copy", str(final_raw),
    ])

    print("FLUENT 16:9 stereo export", flush=True)
    fluent = WORK / "final_fluent.mp4"
    fluent_export(final_raw, fluent)

    OUT_DRAFT.parent.mkdir(parents=True, exist_ok=True)
    OUT_ALIAS.parent.mkdir(parents=True, exist_ok=True)
    OUT_MASTER.parent.mkdir(parents=True, exist_ok=True)
    for dest in (OUT_DRAFT, OUT_ALIAS, OUT_MASTER):
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(fluent), "-c", "copy", str(dest)])

    meta = {
        "title": "Tagus Drop Rhythm — Polish Fix v6",
        "duration_sec": probe_dur(OUT_MASTER),
        "fixes": [
            "CDF + Circle D Stages intro cards",
            "small top-right logos side-by-side (KH, Wako, MUDE logo-only, Humble)",
            "Ana profile only on night performance",
            "continuous source audio remux + stereo 16:9 fluent export",
        ],
        "master": str(OUT_MASTER),
    }
    (OUT_DRAFT.parent / "polish_v6_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
