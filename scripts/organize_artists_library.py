#!/usr/bin/env python3
"""Build unified Artists Library on D: with Location subfolders.

Layout:
  D:/Wakungo_Content_Studio/_Artists_Library/
    <Artist>/
      <Location>/
        Stages | Proxies | Portraits | Masters | Raw | Notes
    Unknown/
      <Location>/Face_Pending | Stages | ...
    Event_Broll/
      <Location>/...

Moves (not copies) when source is under Wakungo_Content_Studio to free space.
FAT32-safe: no junctions.
"""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

STUDIO = Path(r"D:\Wakungo_Content_Studio")
LIBRARY = STUDIO / "_Artists_Library"
D_ROOT = Path(r"D:\\")

SUBDIRS = ("Stages", "Proxies", "Portraits", "Masters", "Raw", "Notes")

# Canonical artist slug → display
CANON = {
    "Manu": "Manu Allegro",
    "Manu_Allegro": "Manu Allegro",
    "Mr_Isaac": "Mr. Isaac",
    "Mistah_Isaac": "Mr. Isaac",
    "Maryna_Vadini": "Maryna Vadini",
    "Leonnardo_Melo": "Leonnardo Melo",
    "Arpanito": "Arpanito",
    "Elisa": "Elisa Casotto",
    "Ana": "Ana",
    "Arif": "Arif",
    "Humble": "Humble.",
    "Zema": "Zema",
    "Nicke_Klein": "Nicke Klein",
    "July_Tilie": "July Tilie",
    "C-Riz": "C-Riz",
    "C_Riz": "C-Riz",
    "Finale_Baseck": "Finale Baseck",
    "Basseck_Mankabu": "Basseck Mankabu",
    "Edoardo_Statuto": "Edoardo Statuto",
    "Joao_Redondo": "Joao Redondo",
    "Guest_Artist": "Guest Artist",
    "Rui": "Rui",
    "Sandu": "Sandu",
    "Unknown": "Unknown (Face Pending)",
    "Event_Broll": "Event B-roll",
}

LOCATION_ALIASES = {
    "lapa71": "Lapa71",
    "destination hostel": "Destination_Hostel",
    "destination_hostel": "Destination_Hostel",
    "tag mit rui": "Tag_Mit_Rui",
    "tag_mit_rui": "Tag_Mit_Rui",
    "sofar": "Sofar_Lisbon",
    "sofar lisbon content": "Sofar_Lisbon",
    "akwabalx": "AkwabaLX",
    "circledstages": "CircleDStages",
    "free like a bird": "Free_Like_A_Bird",
    "arroz studios": "Arroz_Studios",
    "filler": "Filler",
    "irene birthday": "Irene_Birthday",
    "elisa bday": "Elisa_Birthday",
}


def slugify_artist(name: str) -> str:
    n = name.strip().replace(" ", "_")
    # normalize known aliases
    aliases = {
        "Manu_Allegro": "Manu",
        "Mistah_Isaac": "Mr_Isaac",
        "C_Riz": "C-Riz",
    }
    return aliases.get(n, n)


def ensure_artist_location(artist: str, location: str) -> Path:
    artist = slugify_artist(artist)
    base = LIBRARY / artist / location
    for s in SUBDIRS:
        (base / s).mkdir(parents=True, exist_ok=True)
    readme = base / "Notes" / "README.txt"
    if not readme.exists():
        readme.write_text(
            f"Artist: {CANON.get(artist, artist)}\nLocation: {location}\n"
            f"Created: {datetime.now(timezone.utc).isoformat()}\n",
            encoding="utf-8",
        )
    return base


def move_tree(src: Path, dest: Path) -> int:
    """Move files from src into dest; return count moved."""
    if not src.exists():
        return 0
    n = 0
    dest.mkdir(parents=True, exist_ok=True)
    for p in src.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(src)
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            # keep existing; skip duplicate
            continue
        try:
            shutil.move(str(p), str(target))
            n += 1
        except Exception as e:
            print(f"  skip move {p.name}: {e}", flush=True)
    return n


def classify_subdir(name: str) -> str:
    low = name.lower()
    if "stage" in low:
        return "Stages"
    if "proxy" in low or "full_prox" in low or "compressed" in low:
        return "Proxies"
    if "portrait" in low or "photo" in low:
        return "Portraits"
    if "master" in low:
        return "Masters"
    if "raw" in low:
        return "Raw"
    return "Raw"


def ingest_lapa71_artists() -> dict:
    src_root = STUDIO / "Lapa71" / "04_Artists"
    stats = {"moved": 0, "artists": []}
    if not src_root.exists():
        return stats
    for artist_dir in sorted(src_root.iterdir()):
        if not artist_dir.is_dir():
            continue
        artist = slugify_artist(artist_dir.name)
        loc = ensure_artist_location(artist, "Lapa71")
        for sub in artist_dir.iterdir():
            if not sub.is_dir():
                # loose files → Raw
                dest = loc / "Raw"
                dest.mkdir(parents=True, exist_ok=True)
                try:
                    shutil.move(str(sub), str(dest / sub.name))
                    stats["moved"] += 1
                except Exception:
                    pass
                continue
            bucket = classify_subdir(sub.name)
            n = move_tree(sub, loc / bucket)
            stats["moved"] += n
        stats["artists"].append(artist)
        print(f"  Lapa71 -> {artist}: moved chunks", flush=True)
    return stats


def ingest_destination_hostel_artists() -> dict:
    # Multiple possible artist trees
    candidates = list((STUDIO / "Destination Hostel").rglob("Artists"))
    stats = {"moved": 0, "artists": [], "sources": []}
    for artists_root in candidates:
        # skip deep watermark duplicates if path contains Watermarked — still index
        if "Watermarked" in str(artists_root):
            continue
        stats["sources"].append(str(artists_root))
        for artist_dir in sorted(artists_root.iterdir()):
            if not artist_dir.is_dir():
                continue
            artist = slugify_artist(artist_dir.name)
            if artist in ("16x9", "9x16"):
                continue
            loc = ensure_artist_location(artist, "Destination_Hostel")
            # package contents often mixed — put into Raw then Stages if mp4
            n = move_tree(artist_dir, loc / "Raw")
            stats["moved"] += n
            stats["artists"].append(artist)
            print(f"  DestHostel -> {artist}: +{n}", flush=True)
    return stats


def ingest_tag_mit_rui() -> dict:
    stats = {"moved": 0}
    # D:\tag mit rui
    rui_roots = [D_ROOT / "tag mit rui", STUDIO / "tag mit rui"]
    loc = ensure_artist_location("Rui", "Tag_Mit_Rui")
    # Also ensure Unknown face-pending for unclear faces from that shoot
    ensure_artist_location("Unknown", "Tag_Mit_Rui")
    for root in rui_roots:
        if not root.exists():
            continue
        # Don't move entire tree if huge — move media only into Raw
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix.lower() not in {".mp4", ".mov", ".m4v", ".jpg", ".jpeg", ".png", ".nef", ".wav", ".mp3"}:
                continue
            # skip tiny
            try:
                if p.stat().st_size < 50_000:
                    continue
            except Exception:
                continue
            dest_dir = loc / ("Portraits" if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".nef"} else "Raw")
            dest_dir.mkdir(parents=True, exist_ok=True)
            target = dest_dir / p.name
            if target.exists():
                continue
            try:
                shutil.move(str(p), str(target))
                stats["moved"] += 1
            except Exception as e:
                print(f"  rui skip {p.name}: {e}", flush=True)
        print(f"  Tag Mit Rui -> Rui/Tag_Mit_Rui (+{stats['moved']})", flush=True)
    return stats


def ensure_sandu_and_unknown() -> None:
    # Dedicated Sandu artist + face-pending unknowns per major location
    for loc in ("Lapa71", "Destination_Hostel", "Tag_Mit_Rui", "Sofar_Lisbon", "AkwabaLX", "CircleDStages", "Unspecified"):
        ensure_artist_location("Sandu", loc)
        ensure_artist_location("Unknown", loc)
        ensure_artist_location("Rui", loc)
        (LIBRARY / "Unknown" / loc / "Face_Pending").mkdir(parents=True, exist_ok=True)
        (LIBRARY / "Sandu" / loc / "Face_Pending").mkdir(parents=True, exist_ok=True)


def fix_misplaced_unknown_compressed() -> dict:
    """04_videos_compressed/Unknown/<NamedArtist> → Library artist/Lapa71/Proxies"""
    stats = {"moved": 0}
    root = STUDIO / "Lapa71" / "04_videos_compressed" / "Unknown"
    if not root.exists():
        return stats
    for artist_dir in root.iterdir():
        if not artist_dir.is_dir():
            continue
        artist = slugify_artist(artist_dir.name)
        if artist == "Event_Broll":
            loc = ensure_artist_location("Event_Broll", "Lapa71")
        elif artist == "Unknown":
            loc = ensure_artist_location("Unknown", "Lapa71")
            (loc / "Face_Pending").mkdir(exist_ok=True)
            n = move_tree(artist_dir, loc / "Face_Pending")
            stats["moved"] += n
            continue
        else:
            loc = ensure_artist_location(artist, "Lapa71")
        n = move_tree(artist_dir, loc / "Proxies")
        stats["moved"] += n
        print(f"  compressed/Unknown/{artist} -> {artist}/Lapa71/Proxies (+{n})", flush=True)
    return stats


def scan_loose_sandu_rui_mentions() -> list[str]:
    hits = []
    roots = [STUDIO, D_ROOT / "tag mit rui", D_ROOT / "CircleDStages", D_ROOT / "AkwabaLX"]
    for root in roots:
        if not root.exists():
            continue
        try:
            for p in root.rglob("*"):
                if not p.is_file():
                    continue
                low = p.name.lower()
                if "sandu" in low or re.search(r"(^|[^a-z])rui([^a-z]|$)", low):
                    hits.append(str(p))
                    if len(hits) >= 80:
                        return hits
        except Exception:
            continue
    return hits


def write_index(report: dict) -> None:
    artists = sorted([p.name for p in LIBRARY.iterdir() if p.is_dir()])
    index = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "library": str(LIBRARY),
        "artists": artists,
        "canon": {a: CANON.get(a, a) for a in artists},
        "report": report,
        "structure": "Artist / Location / {Stages,Proxies,Portraits,Masters,Raw,Notes,Face_Pending?}",
    }
    (LIBRARY / "_INDEX.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    (LIBRARY / "README.txt").write_text(
        "Wako Kungo × Circle.D.Flow — Artists Library\n"
        "============================================\n"
        "Each artist has Location subfolders (Lapa71, Destination_Hostel, Tag_Mit_Rui, ...).\n"
        "Unknown/ = face recognition pending — review Face_Pending per location.\n"
        "Sandu/ and Rui/ always exist even if sparse.\n"
        "Do not mix locations inside one folder.\n",
        encoding="utf-8",
    )


def cleanup_empty(path: Path) -> int:
    removed = 0
    if not path.exists():
        return 0
    # bottom-up
    for p in sorted(path.rglob("*"), key=lambda x: len(x.parts), reverse=True):
        if p.is_dir():
            try:
                next(p.iterdir())
            except StopIteration:
                try:
                    p.rmdir()
                    removed += 1
                except Exception:
                    pass
            except Exception:
                pass
    return removed


def main() -> int:
    LIBRARY.mkdir(parents=True, exist_ok=True)
    print("== Artists Library ==", LIBRARY, flush=True)
    ensure_sandu_and_unknown()

    report = {}
    print("1) Lapa71 04_Artists…", flush=True)
    report["lapa71"] = ingest_lapa71_artists()
    print("2) Destination Hostel Artists…", flush=True)
    report["destination_hostel"] = ingest_destination_hostel_artists()
    print("3) Tag Mit Rui…", flush=True)
    report["tag_mit_rui"] = ingest_tag_mit_rui()
    print("4) Fix misplaced Unknown compressed…", flush=True)
    report["unknown_compressed"] = fix_misplaced_unknown_compressed()
    print("5) Scan Sandu/Rui filename hits…", flush=True)
    hits = scan_loose_sandu_rui_mentions()
    report["name_hits"] = hits[:80]
    # place hit list in Notes
    notes = LIBRARY / "Unknown" / "Unspecified" / "Notes" / "filename_hits_rui_sandu.txt"
    notes.parent.mkdir(parents=True, exist_ok=True)
    notes.write_text("\n".join(hits) if hits else "(none found)", encoding="utf-8")

    # Ensure Event_Broll Lapa71
    ensure_artist_location("Event_Broll", "Lapa71")
    ensure_artist_location("Guest_Artist", "Destination_Hostel")

    write_index(report)
    print("6) Cleanup empty dirs under old Lapa71 artists…", flush=True)
    n1 = cleanup_empty(STUDIO / "Lapa71" / "04_Artists")
    n2 = cleanup_empty(STUDIO / "Lapa71" / "04_videos_compressed" / "Unknown")
    print(f"  removed empty dirs: {n1 + n2}", flush=True)
    print("DONE", LIBRARY, "artists=", len([p for p in LIBRARY.iterdir() if p.is_dir()]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
