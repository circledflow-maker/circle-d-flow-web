#!/usr/bin/env python3
"""Canonical Lapa71 artist registry + attach IG handles to every cut.

Source of truth for display names / Instagram. Writes:
  D:\\Wakungo_Content_Studio\\Lapa71\\00_event\\artists_registry.json
  D:\\Wakungo_Content_Studio\\Lapa71\\04_Artists\\<slug>\\ARTIST_INFO.txt
  D:\\Wakungo_Content_Studio\\Lapa71\\04_Artists\\cuts_index.json
  Junctions: 04_videos_compressed\\<slug> → 04_Artists\\<slug>

Does NOT invent Instagram handles. Missing IG stays empty + needs_confirmation.
"""
from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

OUT = Path(r"D:\Wakungo_Content_Studio\Lapa71")
ARTISTS = OUT / "04_Artists"
COMPRESSED = OUT / "04_videos_compressed"
EVENT = OUT / "00_event"
LOGS = OUT / "00_logs"

# Primary Instagram handle for burn-in (single @handle). Secondary listed separately.
ARTISTS_ROSTER = {
    "Maryna_Vadini": {
        "display_name": "Maryna Vadini",
        "instagram": "@soulvoice_vadini",
        "instagram_alt": [],
        "role": "Vocals",
        "confirmed": True,
    },
    "Ana": {
        "display_name": "Ana",
        "instagram": "@memyself.ana",
        "instagram_alt": [],
        "role": "Vocals",
        "confirmed": True,
        "co_performers": ["Elisa"],
        "note": "Often shares the same set with Elisa Casotto — treat as duo when both appear.",
    },
    "Elisa": {
        "display_name": "Elisa Casotto",
        "instagram": "@elisa.cas8",
        "instagram_alt": [],
        "role": "Vocals",
        "confirmed": True,
        "co_performers": ["Ana"],
        "note": "Often shares the same set with Ana — treat as duo when both appear.",
    },
    "Leonnardo_Melo": {
        "display_name": "Leonnardo Melo",
        "instagram": "@meloleonnardo",
        "instagram_alt": [],
        "role": "Performance",
        "confirmed": True,
    },
    "Mr_Isaac": {
        "display_name": "Mr. Isaac",
        "instagram": "@mistah_isaac",
        "instagram_alt": [],
        "role": "Guitar / Performance",
        "confirmed": True,
        "aliases": ["Mistah_Isaac"],
    },
    "Arpanito": {
        "display_name": "Arpanito",
        "instagram": "@arpan.k_",
        "instagram_alt": ["@arpanito"],
        "role": "Vocals",
        "confirmed": True,
        "legal_name": "Arpan Khurana",
        "note": "Personal IG @arpan.k_ · artist tag @arpanito",
    },
    "Humble": {
        "display_name": "Humble.",
        "instagram": "@_humble_project_",
        "instagram_alt": [],
        "role": "Partner / Performance",
        "confirmed": True,
        "note": "DEEPOP / Humble. sunset sessions",
    },
    "Manu": {
        "display_name": "Manu Allegro",
        "instagram": "@manuallegro",
        "instagram_alt": [],
        "role": "Performance",
        "confirmed": True,
        "aliases": ["Manu_Allegro"],
    },
    "Arif": {
        "display_name": "Arif",
        "instagram": "",
        "instagram_alt": [],
        "role": "Guest performance",
        "confirmed": True,
        "guest": True,
        "note": "Guest appearance — no personal Instagram required.",
    },
    "Zema": {
        "display_name": "Zema",
        "instagram": "",
        "instagram_alt": [],
        "role": "Guest · Cajón & percussion (Prokazion)",
        "confirmed": True,
        "guest": True,
        "note": "Guest — no personal IG. Confirmed take: DSC_0908 (Adidas tank / cap / glasses).",
    },
    "Unknown": {
        "display_name": "Artist",
        "instagram": "",
        "instagram_alt": [],
        "role": "Unassigned",
        "confirmed": False,
        "note": "Needs face sort into named artist folders.",
    },
    "Event_Broll": {
        "display_name": "Lapa71",
        "instagram": "",
        "instagram_alt": [],
        "role": "Venue / crowd / B-roll",
        "confirmed": True,
        "note": "No personal artist IG — venue / atmosphere cuts.",
    },
}

EVENT_LINE = "Tagus Drop Rhythm — Lapa71, 29 Aug 2026"


def ensure_junction(link: Path, target: Path) -> str:
    """Create directory junction link → target (Windows)."""
    link.parent.mkdir(parents=True, exist_ok=True)
    target.mkdir(parents=True, exist_ok=True)
    if link.exists():
        try:
            # Junction/symlink: compare resolved path
            if link.resolve() == target.resolve() and link != target:
                return "ok"
        except Exception:
            pass
        # Don't delete a real directory with files
        try:
            children = list(link.iterdir())
        except Exception:
            children = ["?"]
        if children:
            return "skip_nonempty"
        try:
            link.rmdir()
        except Exception as e:
            return f"skip_rm:{e}"
    r = subprocess.run(
        ["cmd", "/c", "mklink", "/J", str(link), str(target)],
        capture_output=True, text=True,
    )
    if r.returncode == 0:
        return "created"
    return f"fail:{(r.stderr or r.stdout or '').strip()[:160]}"


def write_artist_info(slug: str, meta: dict) -> None:
    folder = ARTISTS / slug
    folder.mkdir(parents=True, exist_ok=True)
    ig = meta.get("instagram") or ""
    alt = meta.get("instagram_alt") or []
    if meta.get("guest") and not ig:
        ig_line = "IG: (guest — none)"
    elif slug == "Event_Broll":
        ig_line = "IG: (venue / no personal handle)"
    elif ig:
        ig_line = f"IG: {ig}"
    else:
        ig_line = "IG: (not confirmed)"
    lines = [
        f"Artist: {meta['display_name']}",
        f"Slug: {slug}",
        ig_line,
    ]
    if alt:
        lines.append("IG_alt: " + " ".join(alt))
    if meta.get("role"):
        lines.append(f"Role: {meta['role']}")
    lines.append(f"Event: {EVENT_LINE}")
    if meta.get("note"):
        lines.append(f"Note: {meta['note']}")
    if meta.get("confirmed") is False:
        lines.append("Status: NEEDS_CONFIRMATION")
    (folder / "ARTIST_INFO.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")


def index_cuts() -> list[dict]:
    rows = []
    for slug, meta in ARTISTS_ROSTER.items():
        folder = ARTISTS / slug
        if not folder.exists():
            continue
        # Prefer Stages/ and Full_Proxies/ layout; also index any root leftovers
        mp4s = sorted(folder.rglob("*.mp4"))
        for p in mp4s:
            kind = (
                "stages" if "_Stages_" in p.name
                else "full_proxy" if "_full_proxy" in p.name
                else "other"
            )
            rows.append({
                "path": str(p),
                "filename": p.name,
                "artist_slug": slug,
                "display_name": meta["display_name"],
                "instagram": meta.get("instagram") or "",
                "instagram_alt": meta.get("instagram_alt") or [],
                "role": meta.get("role") or "",
                "confirmed": bool(meta.get("confirmed")),
                "kind": kind,
                "size_mb": round(p.stat().st_size / 1e6, 2),
            })
            # Sidecar next to cut (lightweight)
            side = p.with_suffix(".artist.json")
            side.write_text(json.dumps({
                "artist_slug": slug,
                "display_name": meta["display_name"],
                "instagram": meta.get("instagram") or "",
                "instagram_alt": meta.get("instagram_alt") or [],
                "event": EVENT_LINE,
                "confirmed": bool(meta.get("confirmed")),
            }, indent=2), encoding="utf-8")
    return rows


def sync_pipeline_meta() -> None:
    """Patch lapa71_tagus_pipeline.py META/DISPLAY from this registry."""
    # Import after write — keep pipeline in sync via generated snippet file
    snippet = EVENT / "pipeline_meta_sync.py"
    meta = {s: (m.get("instagram") or m["display_name"]) for s, m in ARTISTS_ROSTER.items()}
    # Prefer clean IG only for burn-in; empty → display name fallback avoided for unknown
    burn = {}
    for s, m in ARTISTS_ROSTER.items():
        if m.get("instagram"):
            burn[s] = m["instagram"]
        elif s == "Event_Broll":
            burn[s] = "Lapa71 · Lisboa"
        elif s == "Zema":
            burn[s] = "Guest · Cajón"
        elif s == "Arif":
            burn[s] = "Guest"
        else:
            burn[s] = ""
    display = {s: m["display_name"] for s, m in ARTISTS_ROSTER.items()}
    snippet.write_text(
        "# Auto-generated — do not edit by hand\n"
        f"META = {json.dumps(burn, indent=4, ensure_ascii=False)}\n"
        f"DISPLAY = {json.dumps(display, indent=4, ensure_ascii=False)}\n",
        encoding="utf-8",
    )


def main() -> int:
    EVENT.mkdir(parents=True, exist_ok=True)
    ARTISTS.mkdir(parents=True, exist_ok=True)
    COMPRESSED.mkdir(parents=True, exist_ok=True)
    LOGS.mkdir(parents=True, exist_ok=True)

    registry = {
        "event": EVENT_LINE,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "artists": ARTISTS_ROSTER,
        "paths": {
            "artists_root": str(ARTISTS),
            "compressed_root": str(COMPRESSED),
            "note": (
                "Artist Stages cuts live in 04_Artists. "
                "04_videos_compressed/<slug> are junctions into 04_Artists/<slug>."
            ),
        },
    }
    (EVENT / "artists_registry.json").write_text(
        json.dumps(registry, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    for slug, meta in ARTISTS_ROSTER.items():
        write_artist_info(slug, meta)

    junction_report = {}
    for slug in ARTISTS_ROSTER:
        target = ARTISTS / slug
        target.mkdir(parents=True, exist_ok=True)
        link = COMPRESSED / slug
        junction_report[slug] = ensure_junction(link, target)

    cuts = index_cuts()
    by_artist = {}
    for c in cuts:
        by_artist.setdefault(c["artist_slug"], {"stages": 0, "full_proxy": 0, "other": 0, "total": 0})
        by_artist[c["artist_slug"]][c["kind"]] = by_artist[c["artist_slug"]].get(c["kind"], 0) + 1
        by_artist[c["artist_slug"]]["total"] += 1

    index = {
        "updated_at": registry["updated_at"],
        "event": EVENT_LINE,
        "counts_by_artist": by_artist,
        "cuts": cuts,
        "needs_ig_confirmation": [
            s for s, m in ARTISTS_ROSTER.items()
            if not m.get("instagram")
            and s not in ("Unknown", "Event_Broll")
            and not m.get("guest")
        ],
    }
    (ARTISTS / "cuts_index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    (COMPRESSED / "cuts_index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    (EVENT / "cuts_index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")

    sync_pipeline_meta()

    # Patch live pipeline module constants
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import lapa71_tagus_pipeline as P

    for slug, meta in ARTISTS_ROSTER.items():
        ig = meta.get("instagram") or ""
        if ig:
            P.META[slug] = ig
        elif slug == "Event_Broll":
            P.META[slug] = "Lapa71 · Lisboa"
        elif slug == "Zema":
            P.META[slug] = "Guest · Cajón"
        elif slug == "Arif":
            P.META[slug] = "Guest"
        else:
            P.META[slug] = ""
        P.DISPLAY[slug] = meta["display_name"]

    # Persist patched META into the .py source for future runs
    _patch_pipeline_source()

    summary = {
        "registry": str(EVENT / "artists_registry.json"),
        "cuts_indexed": len(cuts),
        "by_artist": by_artist,
        "junctions": junction_report,
        "needs_ig_confirmation": index["needs_ig_confirmation"],
        "pipeline_meta_updated": True,
    }
    (LOGS / "ARTIST_HANDLES_ATTACHED.flag").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


def _patch_pipeline_source() -> None:
    """Rewrite META + DISPLAY blocks in lapa71_tagus_pipeline.py from roster."""
    path = Path(__file__).resolve().parent / "lapa71_tagus_pipeline.py"
    text = path.read_text(encoding="utf-8")

    meta_lines = ["META = {"]
    for slug, m in ARTISTS_ROSTER.items():
        ig = m.get("instagram") or ""
        if ig:
            val = ig
        elif slug == "Event_Broll":
            val = "Lapa71 · Lisboa"
        elif slug == "Zema":
            val = "Guest · Cajón"
        elif slug == "Arif":
            val = "Guest"
        else:
            val = ""
        meta_lines.append(f'    "{slug}": {json.dumps(val, ensure_ascii=False)},')
    meta_lines.append("}")
    meta_block = "\n".join(meta_lines)

    disp_lines = ["DISPLAY = {"]
    for slug, m in ARTISTS_ROSTER.items():
        disp_lines.append(f'    "{slug}": {json.dumps(m["display_name"], ensure_ascii=False)},')
    disp_lines.append("}")
    disp_block = "\n".join(disp_lines)

    import re
    text2, n1 = re.subn(
        r"META = \{.*?\n\}",
        meta_block,
        text,
        count=1,
        flags=re.S,
    )
    text3, n2 = re.subn(
        r"DISPLAY = \{.*?\n\}",
        disp_block,
        text2,
        count=1,
        flags=re.S,
    )
    if n1 and n2:
        path.write_text(text3, encoding="utf-8")
        print(f"patched META/DISPLAY in {path.name}", flush=True)
    else:
        print(f"WARN could not patch pipeline source META={n1} DISPLAY={n2}", flush=True)


if __name__ == "__main__":
    raise SystemExit(main())
