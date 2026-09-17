#!/usr/bin/env python3
"""Resume polish fix v6 after Unicode crash — remux head audio, build tail, export."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from assemble_directed_polish_v5 import (  # noqa: E402
    OUT_ALIAS,
    OUT_DRAFT,
    OUT_MASTER,
    THREADS,
    W,
    H,
    WORK,
    build_tail_block,
    probe_dur,
    run,
)
from assemble_polish_fix_v6 import (  # noqa: E402
    TAIL_CARDS,
    TAIL_STAMPS,
    assemble_v6,
    fluent_export,
)


def main() -> int:
    head_src = WORK / "head_src.mp4"
    tmp_v = WORK / "_h6_video_concat.mp4"
    head = WORK / "polished_head.mp4"
    if not tmp_v.exists():
        raise SystemExit("missing _h6_video_concat.mp4")
    print("REMUX head audio", flush=True)
    head.unlink(missing_ok=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(tmp_v),
        "-i", str(head_src),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-shortest",
        str(head),
    ])
    print(f"  head {probe_dur(head):.1f}s", flush=True)

    print("TAIL Ana (night) + Marijana + Elisa", flush=True)
    (WORK / "tail_block.mp4").unlink(missing_ok=True)
    for p in WORK.glob("tail_*.mp4"):
        p.unlink(missing_ok=True)
    for p in WORK.glob("_t6_*"):
        p.unlink(missing_ok=True)
    (WORK / "tail_burned.mp4").unlink(missing_ok=True)
    (WORK / "tail_norm.mp4").unlink(missing_ok=True)

    tail = build_tail_block(WORK / "tail_block.mp4")
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

    print("CONCAT", flush=True)
    final_raw = WORK / "final_body.mp4"
    final_raw.unlink(missing_ok=True)
    (WORK / "_final_v6.txt").write_text(
        f"file '{head.as_posix()}'\nfile '{tail_b.as_posix()}'\n", encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(WORK / "_final_v6.txt"),
        "-c", "copy", str(final_raw),
    ])

    print("FLUENT 16:9 stereo export", flush=True)
    fluent = WORK / "final_fluent.mp4"
    fluent.unlink(missing_ok=True)
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
            "small top-right logos side-by-side",
            "MUDE logo only (no Instagram bar)",
            "Ana profile only on night performance",
            "continuous audio remux + stereo 16:9 fluent export",
        ],
        "master": str(OUT_MASTER),
    }
    (OUT_DRAFT.parent / "polish_v6_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
