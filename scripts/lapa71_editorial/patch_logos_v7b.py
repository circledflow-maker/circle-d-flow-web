#!/usr/bin/env python3
"""Patch logo row (+ optional flyer slap) onto polished with_kh without full re-overlay."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from assemble_directed_polish_v5 import (  # noqa: E402
    ASSETS,
    OUT_ALIAS,
    OUT_DRAFT,
    OUT_MASTER,
    THREADS,
    W,
    H,
    probe_dur,
    run,
)
from _fix_logo_assets import fix_humble, fix_mude  # noqa: E402

WORK = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v7")
SRC = WORK / "with_kh.mp4"
LOGO_H = 56
MARGIN = 22
GAP = 12
FLYER_AT = 13.0  # master clock (after KH prepend)
FLYER_HOLD = 2.6


def main() -> int:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}")
    fix_mude()
    fix_humble()
    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_only.png"
    humble = ASSETS / "humble_logo_rgba.png"
    flyer = ASSETS / "flyer_sticker.png"
    for p in (kh, wako, mude, humble, flyer):
        if not p.exists():
            raise SystemExit(f"missing asset {p}")

    out = WORK / "with_kh_logos_fixed.mp4"
    # Clear previous logo strip, place KH|Wako|MUDE|Humble LTR with real widths via successive overlays from right
    # Also re-slap flyer longer so it is unmistakable.
    fc = (
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=iw-360:y=0:w=360:h=96:color=black@1:t=fill[base];"
        f"[1:v]scale=-1:{LOGO_H},format=rgba[kh];"
        f"[2:v]scale=-1:{LOGO_H},format=rgba[wk];"
        f"[3:v]scale=-1:{LOGO_H},format=rgba[md];"
        f"[4:v]scale=-1:{LOGO_H},format=rgba[hm];"
        f"[5:v]format=rgba,scale=700:-1[fly];"
        # place from right: Humble, MUDE, Wako, KH  => visual LTR KH|Wako|MUDE|Humble
        f"[base][hm]overlay=W-w-{MARGIN}:{MARGIN}[L0];"
        f"[L0][md]overlay=W-w-{MARGIN}-w-{GAP}:{MARGIN}[L1];"
        f"[L1][wk]overlay=W-w-{MARGIN}-w-{GAP}-w-{GAP}:{MARGIN}[L2];"
        f"[L2][kh]overlay=W-w-{MARGIN}-w-{GAP}-w-{GAP}-w-{GAP}:{MARGIN}[L3];"
        f"[L3][fly]overlay=(W-w)/2:(H-h)/2:enable='between(t\\,{FLYER_AT:.2f}\\,{FLYER_AT + FLYER_HOLD:.2f})'[v]"
    )
    # Note: chained W-w-GAP-w fails in ffmpeg — need stepwise x with evaluated widths.
    # Use fixed slot spacing instead (square-ish logos after crop).
    slot = LOGO_H + GAP
    fc = (
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=iw-380:y=0:w=380:h=100:color=black@1:t=fill[base];"
        f"[1:v]scale=-1:{LOGO_H},format=rgba[kh];"
        f"[2:v]scale=-1:{LOGO_H},format=rgba[wk];"
        f"[3:v]scale=-1:{LOGO_H},format=rgba[md];"
        f"[4:v]scale=-1:{LOGO_H},format=rgba[hm];"
        f"[5:v]format=rgba,scale=720:-1[fly];"
        f"[base][kh]overlay=W-w-{MARGIN + 3 * slot}:{MARGIN}[a];"
        f"[a][wk]overlay=W-w-{MARGIN + 2 * slot}:{MARGIN}[b];"
        f"[b][md]overlay=W-w-{MARGIN + 1 * slot}:{MARGIN}[c];"
        f"[c][hm]overlay=W-w-{MARGIN}:{MARGIN}[d];"
        f"[d][fly]overlay=(W-w)/2:(H-h)/2:enable='between(t\\,{FLYER_AT:.2f}\\,{FLYER_AT + FLYER_HOLD:.2f})'[v]"
    )
    print("PATCH logos + flyer", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(SRC),
        "-loop", "1", "-t", "1", "-i", str(kh),
        "-loop", "1", "-t", "1", "-i", str(wako),
        "-loop", "1", "-t", "1", "-i", str(mude),
        "-loop", "1", "-t", "1", "-i", str(humble),
        "-loop", "1", "-t", "1", "-i", str(flyer),
        "-filter_complex", fc,
        "-map", "[v]", "-map", "0:a",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-shortest",
        str(out),
    ])
    # -shortest with 1s loop images would cut video! Don't use -shortest — use -t on loops matching video.
    return 0  # rewritten below


def main2() -> int:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}")
    fix_mude()
    fix_humble()
    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_only.png"
    humble = ASSETS / "humble_logo_rgba.png"
    flyer = ASSETS / "flyer_sticker.png"
    dur = probe_dur(SRC)
    slot = LOGO_H + GAP
    fc = (
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25,format=yuv420p,"
        f"drawbox=x=iw-380:y=0:w=380:h=100:color=black@1:t=fill[base];"
        f"[1:v]scale=-1:{LOGO_H},format=rgba[kh];"
        f"[2:v]scale=-1:{LOGO_H},format=rgba[wk];"
        f"[3:v]scale=-1:{LOGO_H},format=rgba[md];"
        f"[4:v]scale=-1:{LOGO_H},format=rgba[hm];"
        f"[5:v]format=rgba,scale=720:-1[fly];"
        f"[base][kh]overlay=W-w-{MARGIN + 3 * slot}:{MARGIN}[a];"
        f"[a][wk]overlay=W-w-{MARGIN + 2 * slot}:{MARGIN}[b];"
        f"[b][md]overlay=W-w-{MARGIN + slot}:{MARGIN}[c];"
        f"[c][hm]overlay=W-w-{MARGIN}:{MARGIN}[d];"
        f"[d][fly]overlay=(W-w)/2:(H-h)/2:enable='between(t\\,{FLYER_AT:.2f}\\,{FLYER_AT + FLYER_HOLD:.2f})'[v]"
    )
    out = WORK / "with_kh_logos_fixed.mp4"
    print(f"PATCH logos+flyer dur={dur:.1f}s", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(SRC),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(kh),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(wako),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(mude),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(humble),
        "-loop", "1", "-t", f"{dur:.2f}", "-i", str(flyer),
        "-filter_complex", fc,
        "-map", "[v]", "-map", "0:a:0",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
        "-c:a", "copy",
        str(out),
    ])
    print("EXPORT master", flush=True)
    OUT_DRAFT.parent.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(out),
        "-c:v", "copy", "-c:a", "copy",
        "-movflags", "+faststart",
        str(OUT_DRAFT),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_ALIAS)])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_MASTER)])
    meta = {
        "title": "Tagus Drop Rhythm — Regie Polish v7b (logo patch)",
        "duration_sec": probe_dur(OUT_MASTER),
        "fixes_extra": [
            "MUDE ]MUDE[ mark only (no IG / cafeteria)",
            "Humble circular H mark only",
            "static logo row KH|Wako|MUDE|Humble",
            f"flyer slap {FLYER_HOLD}s @ {FLYER_AT}s",
        ],
        "master": str(OUT_MASTER),
    }
    (OUT_DRAFT.parent / "polish_v7_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main2())
