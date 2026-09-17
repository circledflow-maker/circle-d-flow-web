#!/usr/bin/env python3
"""Relocate Ana Stages renames into correct Lapa71 artist folders + tidy sidecars."""
from __future__ import annotations

import json
import re
import shutil
import time
from pathlib import Path

ARTISTS = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_Artists")
ANA = ARTISTS / "Ana" / "Stages"
LOG = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_logs") / "ana_relocate.log"

# label substring / token → destination slug (first match wins)
# Keep Ana when label clearly about Ana
RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"MicCheckAna|Audio_Ana|FeelGoodAna|^Ana$", re.I), "Ana"),
    (re.compile(r"Elisa", re.I), "Elisa"),
    (re.compile(r"Arpan", re.I), "Arpanito"),
    (re.compile(r"Arif", re.I), "Arif"),
    (re.compile(r"Manu", re.I), "Manu"),
    (re.compile(r"Mr\.?\s*Isaac|MistahIsaac|Mistah_Isaac", re.I), "Mr_Isaac"),
    (re.compile(r"Zema", re.I), "Zema"),
    (re.compile(r"Leonardo|Leonnardo", re.I), "Leonnardo_Melo"),
    (re.compile(r"Maryna|Marijana", re.I), "Maryna_Vadini"),
    (re.compile(r"Humble", re.I), "Humble"),
    (re.compile(r"ChrisInacao|Chris.?Inac", re.I), "Event_Broll"),
    (re.compile(
        r"Filler|Meetup|Mude|Entrance|Break|Miseenplace|Daybefor|Jam|Ending|Gratitude|"
        r"FlowTalk|Spirituel|WakoKungo|MicCheckJam|Rolling|Hindi",
        re.I,
    ), "Event_Broll"),
]


def log(msg: str) -> None:
    print(msg, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def parse_label(name: str) -> str | None:
    m = re.match(
        r"(DSC_\d+(?:_D850)?)_set(\d+)_(.+?)_(?:Stages_)?1080p\.mp4$",
        name,
        re.I,
    )
    if not m:
        return None
    return m.group(3)


def dest_for(label: str) -> str:
    for pat, slug in RULES:
        if pat.search(label):
            return slug
    return "Ana"


def move_file(src: Path, dest_dir: Path) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / src.name
    if dest.exists():
        if dest.stat().st_size == src.stat().st_size:
            src.unlink(missing_ok=True)
            return dest
        dest = dest_dir / f"{src.stem}__dup{src.suffix}"
    shutil.move(str(src), str(dest))
    return dest


def sync_sidecar(mp4: Path, slug: str) -> None:
    side = mp4.with_suffix(".mp4")  # wrong
    # sidecars named *.artist.json next to old names in Ana
    candidates = [
        mp4.with_name(mp4.name.replace(".mp4", ".artist.json")),
        ANA / (re.sub(r"_.+?_(?:Stages_)?1080p\.mp4$", "_Ana_Stages_1080p.artist.json", mp4.name, flags=re.I)),
    ]
    # also stem-based from DSC_set
    m = re.match(r"(DSC_\d+(?:_D850)?_set\d+)", mp4.name, re.I)
    if m:
        for old in ANA.glob(f"{m.group(1)}_*.artist.json"):
            candidates.append(old)
    meta = {
        "artist_slug": slug,
        "display_name": slug.replace("_", " "),
        "event": "Tagus Drop Rhythm — Lapa71",
        "filename": mp4.name,
        "relocated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    out = mp4.with_name(mp4.stem + ".artist.json")
    out.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    for c in candidates:
        if c.exists() and c.resolve() != out.resolve() and c.parent == ANA:
            # leave orphan cleanup later
            pass


def dual_copy(src_dest: Path, also: str) -> None:
    """Copy shared takes into a second artist folder."""
    other = ARTISTS / also / "Stages"
    other.mkdir(parents=True, exist_ok=True)
    dest = other / src_dest.name
    if not dest.exists():
        shutil.copy2(src_dest, dest)
        sync_sidecar(dest, also)
        log(f"  +copy -> {also}/{dest.name}")


def main() -> int:
    log(f"=== relocate {time.strftime('%Y-%m-%d %H:%M:%S')} ===")
    if not ANA.exists():
        log("Ana/Stages missing")
        return 2
    moved = kept = 0
    for mp4 in sorted(ANA.glob("*.mp4")):
        label = parse_label(mp4.name)
        if not label:
            log(f"skip unparsed {mp4.name}")
            kept += 1
            continue
        slug = dest_for(label)
        if slug == "Ana":
            kept += 1
            sync_sidecar(mp4, "Ana")
            continue
        dest = move_file(mp4, ARTISTS / slug / "Stages")
        log(f"MOVE [{label}] -> {slug}/{dest.name}")
        sync_sidecar(dest, slug)
        moved += 1
        # shared appearances
        low = label.lower()
        if "elisa" in low and "leonardo" in low.replace("leonnardo", "leonardo"):
            dual_copy(dest, "Leonnardo_Melo" if slug != "Leonnardo_Melo" else "Elisa")
        if re.search(r"isaac", low) and "zema" in low:
            dual_copy(dest, "Zema" if slug != "Zema" else "Mr_Isaac")
        if "arif" in low and "elisa" in low:
            dual_copy(dest, "Elisa" if slug != "Elisa" else "Arif")

    # orphan sidecars in Ana without matching mp4
    orphans = 0
    for side in list(ANA.glob("*.artist.json")):
        stem_mp4 = side.name.replace(".artist.json", ".mp4")
        # also check if any mp4 shares DSC_set prefix
        m = re.match(r"(DSC_\d+(?:_D850)?_set\d+)", side.name, re.I)
        has = (ANA / stem_mp4).exists()
        if not has and m:
            has = any(ANA.glob(f"{m.group(1)}_*.mp4"))
        if not has:
            trash = ARTISTS / "Ana" / "_orphan_sidecars"
            trash.mkdir(parents=True, exist_ok=True)
            shutil.move(str(side), str(trash / side.name))
            orphans += 1

    # ensure Stages/Portraits/Full_Proxies exist for all artists
    for d in ARTISTS.iterdir():
        if not d.is_dir() or d.name.startswith("_"):
            continue
        for sub in ("Stages", "Full_Proxies", "Portraits"):
            (d / sub).mkdir(exist_ok=True)

    # summary
    summary = {}
    for d in sorted(ARTISTS.iterdir()):
        if not d.is_dir():
            continue
        stages = list((d / "Stages").glob("*.mp4")) if (d / "Stages").exists() else []
        portraits = list((d / "Portraits").glob("*")) if (d / "Portraits").exists() else []
        summary[d.name] = {"stages": len(stages), "portraits": len(portraits)}
    (LOG.parent / "artists_layout_summary.json").write_text(
        json.dumps({"moved": moved, "kept_ana": kept, "orphans": orphans, "counts": summary}, indent=2),
        encoding="utf-8",
    )
    log(f"DONE moved={moved} kept_ana={kept} orphan_sidecars={orphans}")
    log(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
