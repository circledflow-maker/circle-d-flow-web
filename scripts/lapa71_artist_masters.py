#!/usr/bin/env python3
"""Assemble Circle D Stages artist masters (16:9 + 9:16).

Intro: CDF presents card → Stages card → Wako Kungo text → Artist + IG
Body: Stages cuts with framing rotation + occasional crowd splitscreen
Outro: English thank-you credits (all participants)

Non-destructive: reads Stages / Event_Broll only; writes Format Drafts.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

OUT = Path(r"D:\Wakungo_Content_Studio\Lapa71")
ARTISTS = OUT / "04_Artists"
INTRO_CARDS = OUT / "00_event" / "intro_cards"
REGISTRY = OUT / "00_event" / "artists_registry.json"
WORK = OUT / "00_work" / "artist_masters"
DRAFTS = OUT / "05_Format_Drafts" / "Stages"
LOGS = OUT / "00_logs"

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"

CARD_CDF = INTRO_CARDS / "01_circle_d_flow_presents.png"
CARD_STAGES = INTRO_CARDS / "02_circle_d_stages.png"

PILOT_DEFAULT = ["Elisa", "Manu", "Arpanito"]

# Burned lower-third on existing Stages cuts — strip for body assembly
STRIP_INTRO_SEC = 6.0
MIN_BODY_SEC = 4.0
CARD_SEC = 2.6
WAKO_SEC = 3.2
ARTIST_CARD_SEC = 3.6
CREDITS_SEC = 14.0
FILLER_EVERY = 4  # after N performance segments
SPLIT_SEC = 5.0
FAT32_SOFT = 3.5 * 1024**3

ASPECTS = {
    "16x9": (1920, 1080),
    "9x16": (1080, 1920),
}

# Phase-1 angle / framing heuristics (crop of source 16:9)
FRAMINGS_16x9 = [
    ("wide", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"),
    ("medium", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080"),
    ("close", "scale=2400:1350:force_original_aspect_ratio=increase,crop=1920:1080"),
    ("left", "scale=2200:1238:force_original_aspect_ratio=increase,crop=1920:1080:0:(ih-1080)/2"),
    ("right", "scale=2200:1238:force_original_aspect_ratio=increase,crop=1920:1080:(iw-1920):(ih-1080)/2"),
]

FRAMINGS_9x16 = [
    ("wide", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"),
    ("medium", "scale=1215:2160:force_original_aspect_ratio=increase,crop=1080:1920"),
    ("close", "scale=1400:2489:force_original_aspect_ratio=increase,crop=1080:1920"),
    ("left", "scale=1215:2160:force_original_aspect_ratio=increase,crop=1080:1920:0:(ih-1920)/2"),
    ("right", "scale=1215:2160:force_original_aspect_ratio=increase,crop=1080:1920:(iw-1080):(ih-1920)/2"),
]


def log(msg: str) -> None:
    safe = msg.encode("ascii", "replace").decode("ascii")
    print(safe, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "artist_masters.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        err = (r.stderr or r.stdout or "")[-1200:]
        raise RuntimeError(f"ffmpeg failed ({r.returncode}): {' '.join(cmd[:10])}...\n{err}")


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out or 0)


def esc_drawtext(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace(":", "\\:")
        .replace("%", "\\%")
    )


def load_registry() -> dict:
    if not REGISTRY.exists():
        return {"artists": {}}
    return json.loads(REGISTRY.read_text(encoding="utf-8"))


def artist_meta(slug: str, reg: dict) -> tuple[str, str]:
    a = (reg.get("artists") or {}).get(slug) or {}
    # fallbacks from tagus pipeline naming
    display = a.get("display_name") or slug.replace("_", " ")
    ig = a.get("instagram") or ""
    return display, ig


def credits_names(reg: dict) -> list[str]:
    lines = []
    for slug, a in (reg.get("artists") or {}).items():
        if slug in ("Unknown", "Event_Broll"):
            continue
        name = a.get("display_name") or slug.replace("_", " ")
        ig = a.get("instagram") or ""
        if ig and ig.lower() not in ("guest",):
            lines.append(f"{name}  {ig}")
        else:
            lines.append(name)
    return lines


def is_filler_name(name: str) -> bool:
    n = name.lower()
    return any(k in n for k in ("filler", "broll", "break", "crowd", "audience", "publikum"))


def list_stages(slug: str) -> list[Path]:
    d = ARTISTS / slug / "Stages"
    if not d.exists():
        return []
    files = sorted(d.glob("*.mp4"))
    # drop near-duplicates (same size + ~same duration)
    kept: list[Path] = []
    seen: set[tuple[int, int]] = set()
    for p in files:
        try:
            dur = probe_duration(p)
        except Exception:
            continue
        key = (p.stat().st_size, int(dur * 10))
        if key in seen:
            continue
        seen.add(key)
        kept.append(p)
    return kept


def list_crowd_fillers(exclude_slug: str) -> list[Path]:
    pool: list[Path] = []
    broll = ARTISTS / "Event_Broll" / "Stages"
    if broll.exists():
        pool.extend(sorted(broll.glob("*.mp4")))
    # filler-named clips from same artist also usable as side plate
    for p in list_stages(exclude_slug):
        if is_filler_name(p.name):
            pool.append(p)
    # unique by path
    out, seen = [], set()
    for p in pool:
        if p.resolve() in seen:
            continue
        seen.add(p.resolve())
        try:
            if probe_duration(p) >= SPLIT_SEC + 1:
                out.append(p)
        except Exception:
            continue
    return out


def make_still_card(img: Path, out: Path, w: int, h: int, sec: float) -> Path:
    if out.exists() and out.stat().st_size > 50_000:
        return out
    # letterbox card on black
    vf = (
        f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black,fps=25,format=yuv420p,"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.0, sec - 0.45):.2f}:d=0.4"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(img),
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", f"{sec:.2f}",
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def make_text_card(lines: list[str], out: Path, w: int, h: int, sec: float, *, gold_idx: int | None = 1) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    n = max(1, len([ln for ln in lines if ln.strip()]))
    base_y = h * 0.36 if n <= 3 else h * 0.28
    gap = 64 if h < 1500 else 78
    draws = []
    for i, line in enumerate(lines):
        if not line.strip():
            continue
        fs = 42 if h >= 1080 else 36
        if i == 0:
            fs = 56 if h >= 1080 else 44
        if gold_idx is not None and i == gold_idx:
            color = "#E8C547"
            font = FONT_B
        elif i == 0:
            color = "white"
            font = FONT_B
        else:
            color = "white@0.92"
            font = FONT_R
            fs = min(fs, 36 if h < 1500 else 40)
        y = int(base_y + i * gap)
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc_drawtext(line)}':fontsize={fs}:"
            f"fontcolor={color}:x=(w-text_w)/2:y={y}"
        )
    draws.append(f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.0, sec - 0.45):.2f}:d=0.4")
    vf = ",".join(draws)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=black:s={w}x{h}:d={sec:.2f}:r=25",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-vf", vf,
        "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2", "-shortest",
        str(out),
    ])
    return out


def make_credits_card(names: list[str], out: Path, w: int, h: int, sec: float) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    header = [
        "Thank you",
        "to everyone who made this night possible",
        "",
        "Wako Kungo  x  Circle D Flow",
        "Tagus Drop Rhythm  ·  Lapa71  ·  Lisboa",
        "",
        "Artists & Contributors",
    ]
    # keep credits readable — show up to ~12 names, then "and the whole Circle"
    show = names[:12]
    if len(names) > 12:
        show.append("... and the whole Circle")
    body = show + [
        "",
        "Purpose  ·  Unity  ·  Learn & Teach  ·  Supported Space",
        "Circle D Stages",
    ]
    all_lines = header + body
    # denser packing for credits
    n = len(all_lines)
    start_y = int(h * 0.08)
    gap = max(28, int((h * 0.84) / max(n, 1)))
    draws = []
    for i, line in enumerate(all_lines):
        if not line:
            continue
        if i == 0:
            fs, color, font = (52 if h >= 1080 else 40), "white", FONT_B
        elif "Thank you" in header[0] and i == 1:
            fs, color, font = 28, "white@0.88", FONT_R
        elif "Wako Kungo" in line or "Tagus" in line:
            fs, color, font = 30, "#E8C547", FONT_B
        elif line.startswith("Purpose"):
            fs, color, font = 24, "white@0.75", FONT_R
        elif line == "Artists & Contributors":
            fs, color, font = 26, "white@0.9", FONT_B
        else:
            fs, color, font = 22, "white@0.9", FONT_R
        y = start_y + i * gap
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc_drawtext(line)}':fontsize={fs}:"
            f"fontcolor={color}:x=(w-text_w)/2:y={y}"
        )
    draws.append(f"fade=t=in:st=0:d=0.5,fade=t=out:st={max(0.0, sec - 0.8):.2f}:d=0.7")
    vf = ",".join(draws)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=black:s={w}x{h}:d={sec:.2f}:r=25",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-vf", vf,
        "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def framing_vf(aspect: str, index: int) -> tuple[str, str]:
    table = FRAMINGS_16x9 if aspect == "16x9" else FRAMINGS_9x16
    name, crop = table[index % len(table)]
    grade = "eq=contrast=1.06:brightness=0.015:saturation=0.96:gamma=1.04,hqdn3d=1.6:1.2:2.6:2.2"
    return name, f"{crop},{grade},fps=25,format=yuv420p"


def render_perf_segment(
    src: Path,
    out: Path,
    aspect: str,
    index: int,
    *,
    strip_intro: bool,
) -> Path | None:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    try:
        dur = probe_duration(src)
    except Exception:
        return None
    ss = STRIP_INTRO_SEC if strip_intro and dur > (STRIP_INTRO_SEC + MIN_BODY_SEC + 2) else 0.0
    use = dur - ss
    if use < MIN_BODY_SEC:
        return None
    fname, vf = framing_vf(aspect, index)
    w, h = ASPECTS[aspect]
    # ensure even dims already in ASPECTS
    log(f"    body [{fname}] {src.name} ({use:.0f}s)")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{ss:.3f}", "-i", str(src), "-t", f"{use:.3f}",
        "-vf", vf,
        "-af", "alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out if out.exists() and out.stat().st_size > 80_000 else None


def render_split_segment(
    perf: Path,
    crowd: Path,
    out: Path,
    aspect: str,
    index: int,
) -> Path | None:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    w, h = ASPECTS[aspect]
    try:
        pd, cd = probe_duration(perf), probe_duration(crowd)
    except Exception:
        return None
    if pd < SPLIT_SEC + 2 or cd < SPLIT_SEC + 1:
        return None
    # take mid of both
    pss = max(0.0, min(pd * 0.35, pd - SPLIT_SEC - 0.5))
    css = max(0.0, min(cd * 0.4, cd - SPLIT_SEC - 0.5))
    if aspect == "16x9":
        # side-by-side
        fc = (
            f"[0:v]scale={w//2}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w//2}:{h},setsar=1[left];"
            f"[1:v]scale={w//2}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w//2}:{h},setsar=1[right];"
            f"[left][right]hstack=inputs=2,"
            f"eq=contrast=1.05:brightness=0.01:saturation=0.95,fps=25,format=yuv420p[v];"
            f"[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0,"
            f"volume=1.15,alimiter=limit=0.96[a]"
        )
    else:
        # stacked
        fc = (
            f"[0:v]scale={w}:{h//2}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h//2},setsar=1[top];"
            f"[1:v]scale={w}:{h//2}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h//2},setsar=1[bot];"
            f"[top][bot]vstack=inputs=2,"
            f"eq=contrast=1.05:brightness=0.01:saturation=0.95,fps=25,format=yuv420p[v];"
            f"[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0,"
            f"volume=1.15,alimiter=limit=0.96[a]"
        )
    log(f"    split +crowd {perf.name} | {crowd.name}")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{pss:.3f}", "-t", f"{SPLIT_SEC:.2f}", "-i", str(perf),
        "-ss", f"{css:.3f}", "-t", f"{SPLIT_SEC:.2f}", "-i", str(crowd),
        "-filter_complex", fc,
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out if out.exists() and out.stat().st_size > 40_000 else None


def concat_segments(parts: list[Path], out: Path) -> Path:
    lst = out.with_suffix(".txt")
    lines = []
    for p in parts:
        path = str(p.resolve()).replace("\\", "/").replace("'", "'\\''")
        lines.append(f"file '{path}'")
    lst.write_text("\n".join(lines) + "\n", encoding="utf-8")
    # Prefer stream copy (segments already normalized). Fallback to re-encode.
    try:
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy",
            str(out),
        ])
    except RuntimeError:
        log("  concat copy failed - re-encode")
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
            str(out),
        ])
    return out


def build_artist_master(slug: str, aspects: list[str] | None = None, force: bool = False) -> dict:
    aspects = aspects or list(ASPECTS.keys())
    reg = load_registry()
    display, ig = artist_meta(slug, reg)
    stages = list_stages(slug)
    perf = [p for p in stages if not is_filler_name(p.name)]
    if not perf:
        perf = stages
    fillers = list_crowd_fillers(slug)
    if not perf:
        log(f"SKIP {slug}: no Stages")
        return {"slug": slug, "ok": False, "reason": "no_stages"}

    work = WORK / slug
    work.mkdir(parents=True, exist_ok=True)
    out_dir = DRAFTS / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    credit_names = credits_names(reg)
    results = {"slug": slug, "display": display, "instagram": ig, "outputs": {}}

    for aspect in aspects:
        w, h = ASPECTS[aspect]
        label = f"{slug}_{aspect}"
        final = out_dir / f"{slug}_TagusDropRhythm_Stages_{aspect}.mp4"
        if final.exists() and final.stat().st_size > 500_000 and not force:
            log(f"EXISTS {final.name} ({final.stat().st_size / 1e6:.0f} MB) - skip")
            results["outputs"][aspect] = str(final)
            continue

        seg_dir = work / aspect
        if force and seg_dir.exists():
            for old in seg_dir.glob("*.mp4"):
                old.unlink(missing_ok=True)
        seg_dir.mkdir(parents=True, exist_ok=True)

        parts: list[Path] = []
        log(f"=== {display} ({aspect}) - {len(perf)} performance clips ===")

        # 1–2 brand cards
        parts.append(make_still_card(CARD_CDF, seg_dir / "00_cdf.mp4", w, h, CARD_SEC))
        parts.append(make_still_card(CARD_STAGES, seg_dir / "01_stages.mp4", w, h, CARD_SEC))
        # 3 Wako text
        parts.append(
            make_text_card(
                ["Wako Kungo presents", "Tagus Drop Rhythm"],
                seg_dir / "02_wako.mp4",
                w, h, WAKO_SEC,
                gold_idx=1,
            )
        )
        # 4 artist
        artist_lines = [display]
        if ig:
            artist_lines.append(ig)
        artist_lines.append("Circle D Stages")
        parts.append(
            make_text_card(
                artist_lines,
                seg_dir / "03_artist.mp4",
                w, h, ARTIST_CARD_SEC,
                gold_idx=1 if ig else None,
            )
        )

        # body
        filler_i = 0
        body_i = 0
        for i, src in enumerate(perf):
            seg = render_perf_segment(
                src,
                seg_dir / f"b{body_i:03d}_{src.stem[:40]}.mp4",
                aspect,
                body_i,
                strip_intro=True,
            )
            if seg:
                parts.append(seg)
                body_i += 1
            # splitscreen crowd filler every N clips, and once mid-set for short shows
            want_split = False
            if fillers and body_i > 0:
                if body_i % FILLER_EVERY == 0:
                    want_split = True
                elif len(perf) < FILLER_EVERY and body_i == max(1, len(perf) // 2):
                    want_split = True
            if want_split:
                crowd = fillers[filler_i % len(fillers)]
                filler_i += 1
                split = render_split_segment(
                    src,
                    crowd,
                    seg_dir / f"s{body_i:03d}_split.mp4",
                    aspect,
                    body_i,
                )
                if split:
                    parts.append(split)

        # credits
        parts.append(
            make_credits_card(
                credit_names,
                seg_dir / "zz_credits.mp4",
                w, h, CREDITS_SEC,
            )
        )

        log(f"  concat {len(parts)} segments -> {final.name}")
        tmp_final = work / f"{label}_tmp.mp4"
        concat_segments(parts, tmp_final)
        if tmp_final.stat().st_size > FAT32_SOFT:
            log(f"  WARN size {tmp_final.stat().st_size / 1e9:.2f} GB near FAT32 - keep CRF")
        # move into drafts (same volume)
        if final.exists():
            final.unlink()
        tmp_final.replace(final)
        # remove faststart rewrite if it balloons — already applied in concat
        mb = final.stat().st_size / 1e6
        dur = probe_duration(final)
        log(f"  DONE {final} ({dur / 60:.1f} min, {mb:.0f} MB)")
        results["outputs"][aspect] = str(final)
        results["duration_sec"] = dur

    # write sidecar
    info = out_dir / "MASTER_INFO.txt"
    info.write_text(
        f"Artist: {display}\nIG: {ig}\nEvent: Tagus Drop Rhythm — Lapa71\n"
        f"Series: Circle D Stages\nPresented by: Wako Kungo × Circle D Flow\n"
        f"Clips used: {len(perf)}\nOutputs: {', '.join(results['outputs'].keys())}\n",
        encoding="utf-8",
    )
    results["ok"] = bool(results["outputs"])
    return results


def main() -> int:
    ap = argparse.ArgumentParser(description="Build Circle D Stages artist masters")
    ap.add_argument("--artists", nargs="*", default=PILOT_DEFAULT)
    ap.add_argument("--aspects", nargs="*", default=["16x9", "9x16"], choices=["16x9", "9x16"])
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if not CARD_CDF.exists() or not CARD_STAGES.exists():
        log(f"Missing intro cards in {INTRO_CARDS}")
        return 1

    summary = []
    for slug in args.artists:
        try:
            summary.append(build_artist_master(slug, aspects=args.aspects, force=args.force))
        except Exception as e:
            log(f"FAIL {slug}: {e}")
            summary.append({"slug": slug, "ok": False, "error": str(e)})

    out_json = LOGS / "artist_masters_summary.json"
    LOGS.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(f"Summary -> {out_json}")
    return 0 if all(s.get("ok") for s in summary) else 2


if __name__ == "__main__":
    sys.exit(main())
