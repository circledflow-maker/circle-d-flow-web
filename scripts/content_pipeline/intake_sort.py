#!/usr/bin/env python3
"""
Content Pipeline — Intake + Sort agent (eyes + ears).

Extends the existing Drive Artists ecosystem (Arpan schema). Does NOT rebuild
folder architecture. Does NOT delete/rename Drive folders. Does NOT render.

For a new upload root (e.g. Botanica / Wako Kungo local):
  1) Inventory media (paths + ffprobe metadata only)
  2) EARS — short ffmpeg audio sample → speech/music/mixed
  3) NAME — match aliases against Drive artist registry
  4) Propose sort into existing Artist folder OR create new artist (Arpan schema)
  5) Optional --apply: hardlink/copy locally under staging (never touches Drive)

  python scripts/content_pipeline/intake_sort.py \
    --source "D:\\Wakungo_Content_Studio\\Botanica" \
    --event "Botanica 90s" \
    --dry-run

  python scripts/content_pipeline/intake_sort.py --artist Arpan --inventory-only

Drive folder creation is always a PROPOSAL unless --propose-drive-create is set
(writes a JSON plan; does not call Drive API without credentials).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from ears import listen, probe_has_audio  # noqa: E402

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".webm", ".mts", ".mxf"}
AUDIO_EXT = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"}
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic"}
SKIP_DIR = {
    "ANALYSIS",
    "EXPORT",
    "00_work",
    "DRIVE_UPLOAD",
    "EDIT",
    "__pycache__",
    ".git",
    "03_Proxies_Compressed",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def default_source() -> Path:
    for c in (
        Path(os.environ.get("BOTANICA_ROOT") or ""),
        Path(r"D:/Wakungo_Content_Studio/Botanica"),
        Path("/mnt/d/Wakungo_Content_Studio/Botanica"),
    ):
        if c and c.exists():
            return c
    return Path(r"D:/Wakungo_Content_Studio/Botanica")


def load_registry() -> dict[str, Any]:
    return load_json(HERE / "artist_registry.json")


def load_drive_ids() -> dict[str, Any]:
    return load_json(HERE / "drive_ids.json")


def slug_artist(name: str) -> str:
    s = re.sub(r"[^\w\s\-]+", "", name, flags=re.UNICODE).strip()
    s = re.sub(r"\s+", " ", s)
    return s


_PATH_NOISE = {
    "botanica",
    "event",
    "event_selects",
    "performance",
    "crowd_wide",
    "place_broll",
    "details",
    "artists",
    "events",
    "recap",
    "dsc",
    "img",
    "video",
    "photo",
    "stage",
    "jam",
    "content pipeline",
    "wakungo_content_studio",
    "00_work",
    "01_raw_video",
    "02_raw_audio",
    "03_proxies_compressed",
    "04_videos_compressed",
}


def _match_blobs(path: Path) -> list[str]:
    """Filename + useful parent/pack folder tokens (skip dump roots)."""
    blobs = [
        path.stem.lower().replace("_", " ").replace("-", " ").replace(".", " "),
        path.name.lower(),
    ]
    for part in path.parts[:-1]:
        pl = part.lower().replace("_", " ").replace("-", " ").replace(".", " ").strip()
        if not pl or pl in _PATH_NOISE:
            continue
        blobs.append(pl)
        # pack folders like "11 filipesax felippe sax"
        stripped = re.sub(r"^\d+\s+", "", pl).strip()
        if stripped and stripped != pl:
            blobs.append(stripped)
    return blobs


def match_artist(path: Path, artists: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """Alias match on filename + artist/pack parent folders (not dump roots)."""
    blobs = _match_blobs(path)
    hay = " ".join(blobs)
    hay_c = hay.replace(" ", "")
    scored: list[tuple[int, dict[str, Any]]] = []
    noise = {"botanica", "event", "recap", "dsc", "img", "video", "photo", "stage", "jam"}
    for a in artists:
        aliases = [a.get("name", "")] + list(a.get("aliases") or [])
        for al in aliases:
            token = str(al or "").lower().strip()
            if not token or len(token) < 3 or token in noise:
                continue
            tok_c = token.replace(" ", "").replace(".", "")
            if token in hay or tok_c in hay_c:
                scored.append((len(token), a))
    if not scored:
        return None
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]


def match_proposed(
    path: Path, proposals: list[dict[str, Any]]
) -> Optional[dict[str, Any]]:
    blobs = _match_blobs(path)
    hay = " ".join(blobs)
    hay_c = hay.replace(" ", "")
    best = None
    best_n = 0
    for p in proposals:
        for al in [p.get("display_name", "")] + list(p.get("aliases") or []):
            token = str(al or "").lower().strip()
            if len(token) < 3:
                continue
            tok_c = token.replace(" ", "")
            if token in hay or tok_c in hay_c:
                if len(token) > best_n:
                    best_n = len(token)
                    best = p
    return best


def _intake_rank(path: Path, root: Path) -> tuple:
    """Lower tuple sorts first: AV + artist/pack paths before EVENT_SELECTS/shot_*."""
    try:
        rel = str(path.relative_to(root)).lower().replace("\\", "/")
    except ValueError:
        rel = str(path).lower().replace("\\", "/")
    name = path.name.lower()
    ext = path.suffix.lower()
    is_photo = ext in PHOTO_EXT
    is_event = "event_selects" in rel
    is_crowd_place = any(x in rel for x in ("crowd_wide", "place_broll", "/place/", "/crowd/"))
    is_generic = bool(re.match(r"^(shot_|dsc_|img_|video_|photo_)\d*", name))
    artistish = any(
        x in rel
        for x in (
            "artists/",
            "filipesax",
            "wako",
            "noua",
            "diaza",
            "lyssa",
            "silso",
            "arpan",
            "felippe",
            "zeus",
            "joao",
            "redondo",
            "piano_player",
            "other_guitar",
            "performance -",
            "flow talk",
            "botanicaartistpack",
            "artist_pack",
        )
    )
    return (
        1 if is_photo else 0,
        1 if is_crowd_place else 0,
        1 if (is_event and is_generic) else 0,
        0 if artistish else 1,
        1 if is_generic else 0,
        1 if is_event else 0,
        rel,
    )


def inventory_media(root: Path, limit: int = 0) -> list[Path]:
    """Inventory media. When limited: prefer AV under artist/pack paths over EVENT_SELECTS/shot_*."""
    found: list[Path] = []
    scan_cap = max(limit * 25, 800) if limit else 0
    try:
        walker = root.rglob("*")
    except OSError as e:
        print(f"WARN: cannot scan {root}: {e}")
        return []
    for p in walker:
        try:
            if not p.is_file():
                continue
            rel = p.relative_to(root)
            if any(part in SKIP_DIR for part in rel.parts):
                continue
        except (ValueError, OSError):
            continue
        ext = p.suffix.lower()
        if ext not in VIDEO_EXT | AUDIO_EXT | PHOTO_EXT:
            continue
        if p.name.lower().startswith("botanica_90s"):
            continue  # finished masters - not intake sources
        found.append(p)
        if scan_cap and len(found) >= scan_cap:
            break
    found.sort(key=lambda x: _intake_rank(x, root))
    if limit:
        return found[:limit]
    return found


def arpan_schema_dirs(base: Path) -> None:
    drive = load_drive_ids()
    subs = drive["reference_artist"]["schema_folders"]
    for s in subs:
        (base / s).mkdir(parents=True, exist_ok=True)
    (base / "events").mkdir(parents=True, exist_ok=True)


def classify_item(
    path: Path,
    registry: dict[str, Any],
    event: str,
    listen_audio: bool,
) -> dict[str, Any]:
    ext = path.suffix.lower()
    kind = "video" if ext in VIDEO_EXT else "audio" if ext in AUDIO_EXT else "photo"
    artists = registry.get("artists") or []
    proposals = registry.get("botanica_lineup_proposals") or []

    matched = match_artist(path, artists)
    proposed = None if matched else match_proposed(path, proposals)

    ears_info: dict[str, Any]
    if kind == "photo":
        ears_info = {
            "class": "no_audio",
            "format_hint": "events",
            "confidence": 1.0,
            "ears": "n/a_photo",
        }
    elif listen_audio and kind in ("video", "audio"):
        try:
            ears_info = listen(path)
        except Exception as e:
            ears_info = {"class": "unknown", "error": str(e), "format_hint": "events"}
    else:
        meta = probe_has_audio(path) if kind != "photo" else {}
        ears_info = {
            "class": "skipped",
            "format_hint": "events",
            "probe": meta,
            "ears": "skipped_flag",
        }

    if matched:
        artist_name = matched["name"]
        artist_id = matched.get("id")
        action = "sort_existing"
    elif proposed:
        artist_name = proposed["display_name"]
        artist_id = None
        action = "create_artist_then_sort"
    else:
        artist_name = "_UNASSIGNED_REVIEW"
        artist_id = None
        action = "review"

    # Subfolder inside artist (Arpan schema)
    cls = ears_info.get("class")
    if artist_name == "_UNASSIGNED_REVIEW":
        rel_sub = kind.upper() + "S" if kind != "audio" else "AUDIO"
    elif kind == "photo" or cls in ("no_audio", "silence"):
        rel_sub = f"events/{event}"
    elif cls == "speech":
        # long speech → Akademie; short → Flow Talk
        dur = float((ears_info.get("probe") or {}).get("duration") or 0)
        rel_sub = "Wisdom to share- Akademie" if dur > 180 else "Flow Talk"
        if event:
            # also keep an events copy path suggestion for context
            pass
    elif cls == "music":
        rel_sub = "Performance - CircleDStages"
    elif cls == "mixed":
        rel_sub = "Just in Flow with the beat"
    else:
        rel_sub = f"events/{event}"

    return {
        "source": str(path),
        "name": path.name,
        "kind": kind,
        "bytes": path.stat().st_size if path.exists() else 0,
        "artist": artist_name,
        "artist_drive_id": artist_id,
        "action": action,
        "dest_rel": f"{artist_name}/{rel_sub}/{path.name}",
        "ears": {
            "class": ears_info.get("class"),
            "format_hint": ears_info.get("format_hint"),
            "confidence": ears_info.get("confidence"),
            "integrated_lufs": ears_info.get("integrated_lufs"),
            "silence_ratio": ears_info.get("silence_ratio"),
            "sample_seconds": ears_info.get("sample_seconds"),
        },
    }


def ensure_local_artist(staging: Path, name: str) -> Path:
    base = staging / "ARTISTS" / slug_artist(name)
    arpan_schema_dirs(base)
    meta = {"name": name, "schema": "Arpan", "updated_at": utc_now()}
    (base / "artist.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return base


def apply_local(plan_items: list[dict[str, Any]], staging: Path, mode: str = "hardlink") -> dict[str, int]:
    stats = {"linked": 0, "copied": 0, "skipped": 0, "artists_created": 0}
    created: set[str] = set()
    for it in plan_items:
        if it["action"] == "review":
            dest = staging / "_UNASSIGNED_REVIEW" / (it["kind"] + "s") / it["name"]
        else:
            artist = it["artist"]
            if artist not in created:
                ensure_local_artist(staging, artist)
                created.add(artist)
                stats["artists_created"] += 1
            # dest_rel = Artist/sub/.../file → under staging/ARTISTS/<Artist>/...
            rel_after_artist = Path(*Path(it["dest_rel"]).parts[1:])
            dest = staging / "ARTISTS" / slug_artist(artist) / rel_after_artist

        dest.parent.mkdir(parents=True, exist_ok=True)
        src = Path(it["source"])
        if not src.exists():
            stats["skipped"] += 1
            continue
        if dest.exists():
            stats["skipped"] += 1
            continue
        try:
            if mode == "hardlink":
                os.link(src, dest)
                stats["linked"] += 1
            elif mode == "copy":
                shutil.copy2(src, dest)
                stats["copied"] += 1
            else:
                dest.symlink_to(src)
                stats["linked"] += 1
        except OSError:
            shutil.copy2(src, dest)
            stats["copied"] += 1
    return stats


def print_arpan_inventory() -> None:
    inv = load_json(HERE / "arpan_inventory.json")
    drive = load_drive_ids()
    print("=== Reference artist: Arpan ===")
    print(f"Drive ID: {drive['reference_artist']['id']}")
    print(f"URL:      {drive['reference_artist']['url']}")
    print("Schema folders:", ", ".join(drive["reference_artist"]["schema_folders"]))
    print(f"Known files: {inv['totals']['files']} (metadata only, not downloaded)")
    for ev, data in (inv.get("tree") or {}).get("events", {}).items():
        print(f"  events/{ev}: {len(data.get('files') or [])} files")


def _configure_stdio() -> None:
    """Avoid UnicodeEncodeError on Windows cp1252 consoles (arrows/accents)."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
        except Exception:
            pass


def _safe_text(s: str) -> str:
    """Best-effort ASCII-safe console text when reconfigure is unavailable."""
    enc = getattr(sys.stdout, "encoding", None) or "utf-8"
    try:
        s.encode(enc)
        return s
    except UnicodeEncodeError:
        return s.encode(enc, errors="replace").decode(enc, errors="replace")


def main() -> int:
    _configure_stdio()
    ap = argparse.ArgumentParser(description="Content Pipeline intake+sort (ears+names)")
    ap.add_argument("--source", type=Path, default=None, help="Local new-upload root (Botanica)")
    ap.add_argument("--event", type=str, default="Botanica 90s", help="Event leaf under events/")
    ap.add_argument("--staging", type=Path, default=None, help="Local staging root for --apply")
    ap.add_argument("--artist", type=str, default=None, help="Focus artist name (e.g. Arpan)")
    ap.add_argument("--inventory-only", action="store_true")
    ap.add_argument("--dry-run", action="store_true", default=True)
    ap.add_argument("--apply", action="store_true", help="Hardlink/copy into local staging")
    ap.add_argument("--listen", action="store_true", default=True, help="Run ears on AV files")
    ap.add_argument("--no-listen", action="store_true", help="Skip ears (metadata/name only)")
    ap.add_argument("--limit", type=int, default=40, help="Max media files to analyze")
    ap.add_argument("--propose-drive-create", action="store_true")
    ap.add_argument("--out", type=Path, default=None, help="Write plan JSON")
    args = ap.parse_args()

    try:
        return _run(args)
    except Exception as e:  # noqa: BLE001
        print(f"ERROR: intake_sort failed: {type(e).__name__}: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        return 1


def _run(args: argparse.Namespace) -> int:
    registry = load_registry()
    drive = load_drive_ids()

    print("Content Pipeline - Intake+Sort")
    print(f"Drive root: {drive['root']['name']} ({drive['root']['id']})")
    print(f"Artists:    {len(registry.get('artists') or [])} registered from Drive")
    print(
        "Schema:     Arpan -> "
        + ", ".join(drive["reference_artist"]["schema_folders"])
    )

    if args.artist and args.artist.lower() == "arpan":
        print_arpan_inventory()
        if args.inventory_only:
            return 0

    if args.inventory_only and not args.source:
        print_arpan_inventory()
        print("\nDrive Artists registry:")
        for a in registry.get("artists") or []:
            print(f"  - {_safe_text(a['name'])}  [{a.get('id')}]")
        return 0

    source = args.source or default_source()
    print(f"\nSource: {source}")
    if not source.exists():
        print("BLOCKER: source missing on this machine.")
        print("  On Windows PC with D:, pass --source \"D:\\Wakungo_Content_Studio\\Botanica\"")
        print("  Ears+sort plan for Botanica can still be run there.")
        # Still emit Drive create proposals for Botanica lineup
        plan = {
            "created_at": utc_now(),
            "source": str(source),
            "event": args.event,
            "items": [],
            "drive_create_proposals": [],
            "note": "source missing here - proposals only",
        }
        for p in registry.get("botanica_lineup_proposals") or []:
            plan["drive_create_proposals"].append(
                {
                    "action": "create_artist_folder",
                    "name": p["display_name"],
                    "parent_id": registry["drive_artists_root_id"],
                    "schema_folders": drive["reference_artist"]["schema_folders"],
                    "mirror": "Arpan",
                    "status": "proposed_not_executed",
                }
            )
        out = args.out or (HERE / "LAST_PLAN.json")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(plan, indent=2), encoding="utf-8")
        print(f"Wrote proposals -> {out}")
        print("STOP: no local media to analyze in this environment.")
        return 0

    listen_audio = args.listen and not args.no_listen
    media = inventory_media(source, limit=args.limit)
    print(f"01 - Inventory: {len(media)} media files (limit={args.limit})")
    # Quick path mix so Windows runs show whether EVENT_SELECTS crowded out artist packs
    prefixes: dict[str, int] = {}
    for p in media:
        try:
            rel = p.relative_to(source)
            key = "/".join(rel.parts[:2]) if len(rel.parts) >= 2 else (rel.parts[0] if rel.parts else "?")
        except ValueError:
            key = p.parent.name
        prefixes[key] = prefixes.get(key, 0) + 1
    top_pref = sorted(prefixes.items(), key=lambda x: -x[1])[:8]
    if top_pref:
        print("    path mix:", ", ".join(f"{k}={v}" for k, v in top_pref))

    items: list[dict[str, Any]] = []
    print("02 - Analyze (ears + name)...")
    for i, p in enumerate(media, 1):
        it = classify_item(p, registry, args.event, listen_audio=listen_audio)
        items.append(it)
        ear = it["ears"]
        line = (
            f"  [{i:02d}] {it['name'][:40]:40} -> {it['action']:22} "
            f"{it['artist'][:22]:22} ears={ear.get('class')} -> {it['dest_rel'][:60]}"
        )
        print(_safe_text(line))

    # Aggregate Drive create proposals
    create_names = sorted({it["artist"] for it in items if it["action"] == "create_artist_then_sort"})
    # Always include Botanica lineup missing from Drive registry names
    existing = {a["name"].lower() for a in registry.get("artists") or []}
    drive_creates = []
    for name in create_names:
        drive_creates.append(
            {
                "action": "create_artist_folder",
                "name": name,
                "parent_id": registry["drive_artists_root_id"],
                "schema_folders": drive["reference_artist"]["schema_folders"],
                "mirror": "Arpan",
                "status": "proposed_not_executed",
            }
        )
    if args.propose_drive_create:
        for p in registry.get("botanica_lineup_proposals") or []:
            if p["display_name"].lower() not in existing and p["display_name"] not in create_names:
                drive_creates.append(
                    {
                        "action": "create_artist_folder",
                        "name": p["display_name"],
                        "parent_id": registry["drive_artists_root_id"],
                        "schema_folders": drive["reference_artist"]["schema_folders"],
                        "mirror": "Arpan",
                        "status": "proposed_not_executed",
                    }
                )

    staging = args.staging or (source / "00_work" / "content_pipeline_staging")
    apply_stats = None
    if args.apply:
        print(f"03 - APPLY local staging -> {staging}")
        apply_stats = apply_local(items, staging)
        print(f"   {apply_stats}")
    else:
        print("03 - DRY RUN (no files moved). Pass --apply for local hardlink staging.")

    plan = {
        "created_at": utc_now(),
        "source": str(source),
        "event": args.event,
        "reference_artist": "Arpan",
        "listen": listen_audio,
        "items": items,
        "summary": {
            "total": len(items),
            "sort_existing": sum(1 for i in items if i["action"] == "sort_existing"),
            "create_artist_then_sort": sum(1 for i in items if i["action"] == "create_artist_then_sort"),
            "review": sum(1 for i in items if i["action"] == "review"),
            "ears_music": sum(1 for i in items if (i.get("ears") or {}).get("class") == "music"),
            "ears_speech": sum(1 for i in items if (i.get("ears") or {}).get("class") == "speech"),
            "ears_mixed": sum(1 for i in items if (i.get("ears") or {}).get("class") == "mixed"),
            "ears_no_audio": sum(1 for i in items if (i.get("ears") or {}).get("class") == "no_audio"),
        },
        "drive_create_proposals": drive_creates,
        "apply": apply_stats,
        "rules": [
            "Google Drive is source of truth",
            "Mirror Arpan schema for new artists",
            "Do not rename/move existing Drive folders",
            "Do not render in this phase",
            "Ears listen to short samples only",
        ],
    }
    out = args.out or (source / "ANALYSIS" / "content_pipeline_intake_plan.json")
    try:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf-8")
    except OSError:
        out = HERE / "LAST_PLAN.json"
        try:
            out.write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf-8")
        except OSError as e:
            print(f"ERROR: cannot write plan JSON: {e}", file=sys.stderr)
            return 1

    print(f"\nPlan -> {out}")
    print("Summary:", json.dumps(plan["summary"], indent=2))
    if drive_creates:
        print(f"Drive CREATE proposals ({len(drive_creates)}) - not executed:")
        for d in drive_creates:
            print(_safe_text(f"  + Artists/{d['name']}/  (schema from Arpan)"))
    print("\nSTOP - awaiting approval before Drive folder creation or any render.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
