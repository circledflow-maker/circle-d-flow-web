#!/usr/bin/env python3
"""Re-burn Circle D Stages intro (name + IG) on existing Lapa71 artist cuts.

Covers old lower-third with a dark bar for the intro window, then draws
corrected display name + Instagram from the registry / pipeline META.

Use when D: is FAT32 (no junctions) and full face-rebuild is too heavy.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from lapa71_attach_artist_handles import ARTISTS_ROSTER, EVENT_LINE
from lapa71_tagus_pipeline import (
    ARTISTS,
    DISPLAY,
    INTRO_SEC,
    META,
    LOGS,
    OUT,
    esc_drawtext,
    probe_ok,
)

COMPRESSED = OUT / "04_videos_compressed"

# Artists whose burned IG/name likely need correction
DEFAULT_SLUGS = ("Ana", "Arpanito", "Manu", "Humble", "Mr_Isaac", "Maryna_Vadini")


def intro_overlay(artist: str) -> str:
    name = esc_drawtext(DISPLAY.get(artist, artist.replace("_", " ")))
    ig = esc_drawtext((META.get(artist) or "")[:48])
    t = INTRO_SEC
    # Dark plate covers previous burned text, then fresh titles
    return (
        f"drawbox=x=0:y=h-260:w=iw:h=260:color=black@0.82:t=fill:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages':"
        f"fontsize=34:fontcolor=white@0.88:x=72:y=h-228:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='Tagus Drop Rhythm':"
        f"fontsize=30:fontcolor=#E8C547:x=72:y=h-182:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='{name}':"
        f"fontsize=50:fontcolor=white:x=72:y=h-120:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='{ig}':"
        f"fontsize=26:fontcolor=white@0.92:x=72:y=h-72:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='Lapa71 - Lisboa':"
        f"fontsize=24:fontcolor=white@0.78:x=72:y=h-38:enable='between(t\\,0\\,{t})'"
    )


def reface_one(src: Path, artist: str, work: Path) -> bool:
    tmp = work / f"_reface_{src.name}"
    vf = intro_overlay(artist) + ",format=yuv420p"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(src),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "copy",
        str(tmp),
    ]
    r = subprocess.run(cmd)
    if r.returncode != 0 or not probe_ok(tmp):
        tmp.unlink(missing_ok=True)
        return False
    bak = src.with_suffix(".mp4.bak_pre_ig")
    if not bak.exists():
        src.replace(bak)
    else:
        src.unlink(missing_ok=True)
    tmp.replace(src)
    return True


def write_compressed_stubs() -> None:
    """FAT32-safe: folders under 04_videos_compressed with pointer + ARTIST_INFO."""
    COMPRESSED.mkdir(parents=True, exist_ok=True)
    readme = COMPRESSED / "README_ARTISTS.txt"
    readme.write_text(
        "Lapa71 artist Stages cuts live in:\n"
        "  D:\\Wakungo_Content_Studio\\Lapa71\\04_Artists\\<Artist>\\\n\n"
        "This folder (04_videos_compressed) holds Full_Takes proxies + stub artist folders\n"
        "(D: is often FAT32 — Windows junctions are not available).\n\n"
        "See cuts_index.json and 00_event\\artists_registry.json for IG handles.\n",
        encoding="utf-8",
    )
    for slug, meta in ARTISTS_ROSTER.items():
        d = COMPRESSED / slug
        d.mkdir(parents=True, exist_ok=True)
        ig = meta.get("instagram") or "(not confirmed)"
        (d / "ARTIST_INFO.txt").write_text(
            f"Artist: {meta['display_name']}\n"
            f"Slug: {slug}\n"
            f"IG: {ig}\n"
            f"IG_alt: {' '.join(meta.get('instagram_alt') or [])}\n"
            f"Role: {meta.get('role') or ''}\n"
            f"Event: {EVENT_LINE}\n"
            f"Cuts folder: {ARTISTS / slug}\n",
            encoding="utf-8",
        )
        (d / "OPEN_CUTS_HERE.txt").write_text(
            f"Actual MP4 cuts:\n{ARTISTS / slug}\n",
            encoding="utf-8",
        )


def main(slugs: list[str] | None = None) -> int:
    # Sync META/DISPLAY from roster
    for slug, meta in ARTISTS_ROSTER.items():
        if meta.get("instagram"):
            META[slug] = meta["instagram"]
        DISPLAY[slug] = meta["display_name"]

    write_compressed_stubs()

    targets = list(slugs) if slugs else list(DEFAULT_SLUGS)
    work = OUT / "00_work" / "reface_tmp"
    work.mkdir(parents=True, exist_ok=True)
    ok = fail = skip = 0
    report = []
    for slug in targets:
        folder = ARTISTS / slug
        if not folder.exists():
            continue
        ig = META.get(slug, "")
        for src in sorted(folder.glob("*_Stages_1080p.mp4")):
            print(f"reface {slug}: {src.name} -> {DISPLAY.get(slug)} {ig}", flush=True)
            if reface_one(src, slug, work):
                ok += 1
                report.append({"file": src.name, "artist": slug, "ig": ig, "status": "ok"})
            else:
                fail += 1
                report.append({"file": src.name, "artist": slug, "ig": ig, "status": "fail"})
        # refresh ARTIST_INFO
        (folder / "ARTIST_INFO.txt").write_text(
            f"Artist: {DISPLAY.get(slug, slug)}\nIG: {ig}\nEvent: {EVENT_LINE}\n",
            encoding="utf-8",
        )

    out = {
        "ok": ok,
        "fail": fail,
        "skip": skip,
        "report": report,
    }
    (LOGS / "reface_ig_report.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps({k: out[k] for k in ("ok", "fail")}, indent=2), flush=True)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    raise SystemExit(main(args or None))
