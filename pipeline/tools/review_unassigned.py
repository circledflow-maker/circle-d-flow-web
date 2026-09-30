#!/usr/bin/env python3
"""
UNASSIGNED review helper — metadata + optional Drive thumbnails only.

Never moves files. Never downloads full masters.

  python pipeline/tools/review_unassigned.py
  python pipeline/tools/review_unassigned.py --fetch-thumbs   # needs token.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
THUMB_DIR = ROOT / "pipeline" / "work" / "unassigned_thumbs"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]
DSC = re.compile(r"DSC[_-]?(\d+)", re.I)

# Clips already claimed by Diaza face pass (stable naming DSC_NNNN_04_*)
DIAZA_FOLDER = "04_diazaofficial_Diaza"
# Stills that match the Wako Botanica raw roll just moved
WAKO_STILL_DSC = {1546, 1547, 1548, 1572, 1573, 1574, 1575, 1576, 1579}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def dsc_num(name: str) -> Optional[int]:
    m = DSC.search(name or "")
    return int(m.group(1)) if m else None


def load_inv() -> dict[str, Any]:
    return json.loads((DATA / "drive_inventory.json").read_text(encoding="utf-8"))


def load_artist_index() -> dict[str, Any]:
    p = DATA / "artist_index.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def get_service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    if not TOKEN.exists():
        raise SystemExit("token.json missing — run scripts/gdrive_setup.py --force")
    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds.valid and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN.write_text(creds.to_json(), encoding="utf-8")
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def build_pack(inv: dict[str, Any], ai: dict[str, Any]) -> dict[str, Any]:
    diaza_dsc: set[int] = set()
    pack_refs: dict[str, list[str]] = defaultdict(list)
    for f in inv["files"]:
        pp = f.get("parent_folder_path") or ""
        if not pp.startswith("BotanicaArtistPack/"):
            continue
        parts = pp.split("/")
        if len(parts) < 2:
            continue
        artist = parts[1]
        name = f.get("name") or ""
        n = dsc_num(name)
        if artist == DIAZA_FOLDER and n is not None:
            diaza_dsc.add(n)
        if "/00_REF" in pp and not name.lower().endswith((".txt", ".json")):
            pack_refs[artist].append(name)

    other_artists = sorted(
        a
        for a in pack_refs
        if a != DIAZA_FOLDER and any(
            not x.lower().startswith("readme") for x in pack_refs[a]
        )
    )

    items: list[dict[str, Any]] = []
    for f in inv["files"]:
        pp = f.get("parent_folder_path") or ""
        if "_UNASSIGNED_REVIEW" not in pp:
            continue
        if "folder" in (f.get("mime_type") or ""):
            continue
        name = f.get("name") or ""
        n = dsc_num(name)
        hints: list[dict[str, Any]] = []
        kind = "unknown"
        if "_unassigned_stable" in name.lower() or "/VIDEOS" in pp:
            kind = "face_reject_video"
            hints.append(
                {
                    "type": "process",
                    "note": "Filename from organize_artists_face — failed Diaza/primary match",
                    "review_against": other_artists,
                    "confidence": "REVIEW",
                }
            )
        elif "/FRAMES" in pp:
            kind = "face_reject_frame"
            hints.append(
                {
                    "type": "process",
                    "note": "Frame extract left unassigned after face pass",
                    "review_against": other_artists,
                    "confidence": "REVIEW",
                }
            )
        elif "/PHOTOS" in pp:
            kind = "edit_still"
            if n in WAKO_STILL_DSC:
                hints.append(
                    {
                        "type": "roll_align",
                        "artist_hint": "10_wako.kungo_Wako_Kungo / Artists/Wako Kungo/Botanica",
                        "confidence": "MEDIUM",
                        "note": "Same DSC still number as Wako Botanica raw roll (optional align after visual check)",
                    }
                )
            else:
                hints.append(
                    {
                        "type": "process",
                        "review_against": other_artists,
                        "confidence": "REVIEW",
                        "note": "Edited still without artist tag",
                    }
                )
        if n is not None and n in diaza_dsc:
            hints.append(
                {
                    "type": "warning",
                    "confidence": "LOW",
                    "note": f"DSC_{n} also exists in Diaza pack as assigned stable — do not auto-merge; may be different take/crop",
                }
            )

        items.append(
            {
                "file_id": f["file_id"],
                "name": name,
                "parent_folder_path": pp,
                "extension": f.get("extension"),
                "dsc": n,
                "kind": kind,
                "thumbnail_hint": f.get("thumbnail_hint"),
                "url": f.get("url"),
                "hints": hints,
                "action": "review_only_no_move",
            }
        )

    pack_meta = []
    for a in ai.get("botanica_artist_pack") or []:
        pack_meta.append(
            {
                "folder": a.get("name"),
                "path": a.get("path"),
                "folder_id": a.get("folder_id"),
                "refs": pack_refs.get(a.get("name") or "", []),
            }
        )

    by_kind = Counter(i["kind"] for i in items)
    return {
        "created_at": utc_now(),
        "batch": "unassigned_review",
        "source": "Botanica/_UNASSIGNED_REVIEW",
        "count": len(items),
        "by_kind": dict(by_kind),
        "policy": [
            "NO automatic Drive moves",
            "These are leftovers from organize_artists_face (not Diaza)",
            "Review against BotanicaArtistPack/*/00_REF for non-Diaza artists",
            "Optional: MEDIUM stills DSC_1546-1548 (+1572-79) may align to Wako after visual check",
            "Thumbnails only — never full masters in this tool",
        ],
        "review_against_artists": other_artists,
        "artist_pack": pack_meta,
        "items": sorted(items, key=lambda x: (x["dsc"] is None, x["dsc"] or 0, x["name"])),
    }


def write_report(pack: dict[str, Any]) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    (DATA / "unassigned_review_pack.json").write_text(
        json.dumps(pack, indent=2), encoding="utf-8"
    )
    lines = [
        "# UNASSIGNED REVIEW PACK — no moves",
        "",
        f"**Created:** {pack['created_at']}",
        f"**Items:** {pack['count']}",
        f"**By kind:** {pack['by_kind']}",
        "",
        "## Context",
        "These files already failed / skipped primary face assignment (often Diaza).",
        "They sit in `Botanica/_UNASSIGNED_REVIEW/{FRAMES,PHOTOS,VIDEOS}`.",
        "",
        "## Policy",
    ]
    for p in pack["policy"]:
        lines.append(f"- {p}")
    lines += [
        "",
        f"## Review against (00_REF)",
        "",
    ]
    for a in pack["review_against_artists"]:
        lines.append(f"- `{a}`")
    lines += ["", "## Items", ""]
    for i in pack["items"]:
        hint = "; ".join(
            h.get("note") or h.get("artist_hint") or h.get("type") for h in i["hints"]
        )
        lines.append(f"- `{i['parent_folder_path']}/{i['name']}` — {i['kind']} — {hint}")
    lines += [
        "",
        "## Next",
        "1. `python pipeline/tools/review_unassigned.py --fetch-thumbs` (Windows + token)",
        "2. Visually match thumbs to `BotanicaArtistPack/*/00_REF`",
        "3. Approve a new move batch only after human confirm",
        "",
    ]
    (REPORTS / "unassigned_review_pack.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def fetch_thumbs(pack: dict[str, Any], limit: int) -> int:
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    service = get_service()
    n = 0
    for item in pack["items"][: limit or None]:
        fid = item["file_id"]
        name = item["name"]
        safe = re.sub(r"[^\w.\-]+", "_", name)
        out = THUMB_DIR / f"{safe}.jpg"
        if out.exists() and out.stat().st_size > 0:
            print(f"skip exists {out.name}")
            n += 1
            continue
        # Prefer Drive thumbnailLink via files.get
        try:
            meta = (
                service.files()
                .get(fileId=fid, fields="id,name,thumbnailLink", supportsAllDrives=True)
                .execute()
            )
            link = meta.get("thumbnailLink")
            if not link:
                # fallback constructed hint
                link = item.get("thumbnail_hint")
            if not link:
                print(f"no thumb {name}")
                continue
            # request larger
            if "sz=" in link:
                link = re.sub(r"sz=[^&]+", "sz=w800", link)
            else:
                link = link + ("&" if "?" in link else "?") + "sz=w800"
            data = urlopen(link, timeout=60).read()
            out.write_bytes(data)
            print(f"saved {out.name} ({len(data)} bytes)")
            n += 1
        except Exception as e:
            print(f"ERROR {name}: {e}")
    manifest = {
        "created_at": utc_now(),
        "dir": str(THUMB_DIR),
        "saved": n,
        "note": "thumbnails only — not masters",
    }
    (THUMB_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return n


def main() -> int:
    ap = argparse.ArgumentParser(description="Build UNASSIGNED review pack (no moves)")
    ap.add_argument("--fetch-thumbs", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="Limit thumb fetches")
    args = ap.parse_args()

    inv = load_inv()
    ai = load_artist_index()
    pack = build_pack(inv, ai)
    write_report(pack)
    print(f"UNASSIGNED items: {pack['count']}")
    print(f"By kind: {pack['by_kind']}")
    print(f"Wrote pipeline/data/unassigned_review_pack.json")
    print(f"Wrote pipeline/reports/unassigned_review_pack.md")
    print("Action: review_only_no_move")

    if args.fetch_thumbs:
        saved = fetch_thumbs(pack, args.limit)
        print(f"Thumbnails saved: {saved} → {THUMB_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
