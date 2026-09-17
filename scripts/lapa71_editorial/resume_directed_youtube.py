#!/usr/bin/env python3
"""Resume directed YouTube: rebuild corrupt xfade batch → body → final → master."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from assemble_chronological_youtube import probe_dur, run  # noqa: E402
from assemble_directed_youtube import OUT_NAME, WORK_D  # noqa: E402
from contract import BRAND, OUT  # noqa: E402

FADE = 0.28
W = WORK_D


def valid_mp4(p: Path) -> bool:
    if not p.exists() or p.stat().st_size < 80_000:
        return False
    try:
        return probe_dur(p) > 0.5
    except Exception:
        return False


def xfade_chunk(chunk: list[Path], out: Path, fade: float = FADE) -> Path:
    if out.exists() and valid_mp4(out):
        print(f"  skip {out.name}", flush=True)
        return out
    if out.exists():
        out.unlink(missing_ok=True)
    if len(chunk) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(chunk[0]), "-c", "copy", str(out)])
        return out
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
    print(f"  xfade n={len(chunk)} -> {out.name}", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        *inputs, "-filter_complex", fc,
        "-map", f"[{vlabel}]", "-map", f"[{alabel}]",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-threads", "1",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(out),
    ])
    return out


def main() -> int:
    W.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    # Rebuild corrupt last round-0 batch from segments 025–033
    bad = W / "_xf_d_r0_24.mp4"
    if bad.exists() and not valid_mp4(bad):
        print("remove corrupt _xf_d_r0_24.mp4", flush=True)
        bad.unlink(missing_ok=True)

    tail = sorted(W.glob("0*.mp4"))
    # parts were 001..033 → batch index 24 = files starting at 025
    batch24 = [p for p in tail if p.name[:3].isdigit() and int(p.name[:3]) >= 25]
    batch24 = sorted(batch24, key=lambda p: p.name)[:9]
    print(f"batch24 parts={[p.name for p in batch24]}", flush=True)
    if len(batch24) < 2:
        raise SystemExit(f"not enough tail segments: {batch24}")
    xfade_chunk(batch24, W / "_xf_d_r0_24.mp4")

    r0 = [
        W / "_xf_d_r0_0.mp4",
        W / "_xf_d_r0_8.mp4",
        W / "_xf_d_r0_16.mp4",
        W / "_xf_d_r0_24.mp4",
    ]
    for p in r0:
        if not valid_mp4(p):
            raise SystemExit(f"missing/invalid batch: {p}")
        print(f"  ok {p.name} {probe_dur(p)/60:.1f} min", flush=True)

    r1 = xfade_chunk(r0, W / "_xf_d_r1_0.mp4")
    body = W / "directed_body.mp4"
    print("copy body…", flush=True)
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(r1), "-c", "copy", str(body)])
    dur = probe_dur(body)
    print(f"body {dur/60:.1f} min", flush=True)

    final = OUT / OUT_NAME
    alias = OUT.parent / "YouTube" / "Lapa71_TagusDropRhythm_YouTube_16x9.mp4"
    alias.parent.mkdir(parents=True, exist_ok=True)
    print("final encode…", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-threads", "1", "-i", str(body),
        "-vf", f"fade=t=in:st=0:d=0.3,fade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1,format=yuv420p",
        "-af", f"afade=t=in:st=0:d=0.25,afade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "19", "-threads", "1",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(final),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(final), "-c", "copy", str(alias)])

    masters = Path(r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\YouTube")
    masters.mkdir(parents=True, exist_ok=True)
    master = masters / "Lapa71_TagusDropRhythm_YouTube_MASTER_16x9.mp4"
    print("master CRF18…", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-threads", "1", "-i", str(final),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-threads", "1",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
        str(master),
    ])

    meta = {
        "title": "Tagus Drop Rhythm — Directed Cut",
        "brand": BRAND,
        "duration_sec": probe_dur(final),
        "output": str(final),
        "master": str(master),
        "resumed": True,
    }
    (OUT / "youtube_directed_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {final} {meta['duration_sec']/60:.1f} min", flush=True)
    print(f"MASTER {master}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
