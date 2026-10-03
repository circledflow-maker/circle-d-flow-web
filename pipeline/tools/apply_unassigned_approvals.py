#!/usr/bin/env python3
"""
Apply human-approved UNASSIGNED assignments on Google Drive.

Reads: pipeline/data/unassigned_approvals.json
Never deletes. Only moves files with action=move.
Creates missing BotanicaArtistPack / Artists folders when needed
(e.g. Felippe Sax).

  python pipeline/tools/apply_unassigned_approvals.py --dry-run
  python pipeline/tools/apply_unassigned_approvals.py --execute
"""
from __future__ import annotations

import argparse
import json
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
APPROVALS = DATA / "unassigned_approvals.json"
INV = DATA / "drive_inventory.json"
TOKEN = ROOT / "token.json"
REF_ASSETS = ROOT / "pipeline" / "assets" / "artist_refs"
SCOPES = ["https://www.googleapis.com/auth/drive"]
LIST_KW = {"supportsAllDrives": True, "includeItemsFromAllDrives": True}
FILE_KW = {"supportsAllDrives": True}

BOTANICA_PACK_ROOT = "1Ss3ypxTiJgTCW-ucsLLbjEbG653RuRbk"
ARTISTS_ROOT = "1OLOk__QJ2TWVvcgnhu9wEV4rYF6ALc7Q"
WAKO_ARTIST_ID = "1oDFvtuC1-aQTxUe7i4AZZx12EvVLvX0j"

ARPAN_SUBS = [
    "events",
    "Flow Talk",
    "Just in Flow with the beat",
    "Performance - CircleDStages",
    "Wisdom to share- Akademie",
]
PACK_SUBS = ["00_REF", "01_VIDEOS_PERFORMANCE", "02_PORTRAITS", "03_FRAMES"]

# Known prefer_artists_botanica destinations (Artists/<name>/Botanica)
ARTISTS_BOTANICA = {
    "10_wako.kungo_Wako_Kungo": ("Wako Kungo", WAKO_ARTIST_ID),
    "11_filipesax_Felippe_Sax": ("Felippe Sax", None),  # create if missing
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    if not TOKEN.exists():
        raise SystemExit("token.json missing — scripts/gdrive_setup.py --force")
    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds.valid and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN.write_text(creds.to_json(), encoding="utf-8")
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def ensure_folder(service, name: str, parent_id: str, dry: bool) -> str:
    safe = name.replace("'", "\\'")
    q = (
        f"name='{safe}' and '{parent_id}' in parents "
        "and mimeType='application/vnd.google-apps.folder' and trashed=false"
    )
    res = service.files().list(q=q, fields="files(id,name)", pageSize=5, **LIST_KW).execute()
    files = res.get("files") or []
    if files:
        return files[0]["id"]
    if dry:
        print(f"   [dry] would create '{name}' under {parent_id}")
        return f"DRY_{name}_UNDER_{parent_id}"
    meta = {"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]}
    created = service.files().create(body=meta, fields="id,name", **FILE_KW).execute()
    print(f"   created '{name}' → {created['id']}")
    return created["id"]


def upload_local_file(service, path: Path, parent_id: str, dry: bool) -> Optional[str]:
    if not path.exists():
        return None
    safe = path.name.replace("'", "\\'")
    q = f"name='{safe}' and '{parent_id}' in parents and trashed=false"
    res = service.files().list(q=q, fields="files(id,name)", pageSize=3, **LIST_KW).execute()
    if res.get("files"):
        return res["files"][0]["id"]
    if dry:
        print(f"   [dry] would upload ref {path.name}")
        return None
    from googleapiclient.http import MediaFileUpload

    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    media = MediaFileUpload(str(path), mimetype=mime, resumable=False)
    meta = {"name": path.name, "parents": [parent_id]}
    created = service.files().create(body=meta, media_body=media, fields="id,name", **FILE_KW).execute()
    print(f"   uploaded ref '{path.name}' → {created['id']}")
    return created["id"]


def ensure_pack_artist(service, pack_folder: str, pack_ids: dict[str, str], dry: bool) -> str:
    if pack_folder in pack_ids:
        return pack_ids[pack_folder]
    print(f"Creating BotanicaArtistPack/{pack_folder} …")
    pack_id = ensure_folder(service, pack_folder, BOTANICA_PACK_ROOT, dry=dry)
    for sub in PACK_SUBS:
        ensure_folder(service, sub, pack_id, dry=dry)
    pack_ids[pack_folder] = pack_id

    # seed 00_REF from local assets when present
    ref_parent = ensure_folder(service, "00_REF", pack_id, dry=dry)
    local_dir = REF_ASSETS / "Felippe_Sax"
    if pack_folder.startswith("11_filipesax") and local_dir.exists():
        for f in sorted(local_dir.iterdir()):
            if f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
                upload_local_file(service, f, ref_parent, dry=dry)
    return pack_id


def ensure_artists_folder(service, display_name: str, dry: bool) -> str:
    """Create Artists/<name> with Arpan schema if missing; return folder id."""
    safe = display_name.replace("'", "\\'")
    q = (
        f"name='{safe}' and '{ARTISTS_ROOT}' in parents "
        "and mimeType='application/vnd.google-apps.folder' and trashed=false"
    )
    res = service.files().list(q=q, fields="files(id,name)", pageSize=5, **LIST_KW).execute()
    files = res.get("files") or []
    if files:
        artist_id = files[0]["id"]
    else:
        print(f"Creating Artists/{display_name} …")
        artist_id = ensure_folder(service, display_name, ARTISTS_ROOT, dry=dry)
        for sub in ARPAN_SUBS:
            ensure_folder(service, sub, artist_id, dry=dry)
    return artist_id


def move_file(service, file_id: str, new_parent: str, dry: bool) -> dict[str, Any]:
    if dry:
        return {"status": "dry_run", "file_id": file_id, "new_parent": new_parent}
    meta = service.files().get(fileId=file_id, fields="id,name,parents", **FILE_KW).execute()
    parents = meta.get("parents") or []
    if new_parent in parents:
        return {"status": "already_in_destination", "file_id": file_id, "name": meta.get("name")}
    remove = [p for p in parents if p != new_parent]
    updated = (
        service.files()
        .update(
            fileId=file_id,
            addParents=new_parent,
            removeParents=",".join(remove) if remove else None,
            fields="id,name,parents",
            **FILE_KW,
        )
        .execute()
    )
    return {
        "status": "moved",
        "file_id": file_id,
        "name": updated.get("name"),
        "parents": updated.get("parents"),
    }


def pack_folder_ids() -> dict[str, str]:
    inv = json.loads(INV.read_text(encoding="utf-8"))
    out = {}
    for f in inv["folders"]:
        p = f["path"]
        if p.startswith("BotanicaArtistPack/") and p.count("/") == 1:
            out[p.split("/", 1)[1]] = f["folder_id"]
    return out


def resolve_dest(
    service,
    assignment: dict[str, Any],
    pack_ids: dict[str, str],
    dry: bool,
    artists_cache: dict[str, str],
) -> tuple[str, str]:
    pack = assignment["pack_folder"]
    sub = assignment.get("pack_subfolder") or "03_FRAMES"

    if assignment.get("prefer_artists_botanica") and pack in ARTISTS_BOTANICA:
        display, known_id = ARTISTS_BOTANICA[pack]
        if known_id:
            artist_id = known_id
        else:
            if display not in artists_cache:
                artists_cache[display] = ensure_artists_folder(service, display, dry=dry)
            artist_id = artists_cache[display]
        botanica_id = ensure_folder(service, "Botanica", artist_id, dry=dry)
        # also ensure pack tree exists for lineage / refs
        ensure_pack_artist(service, pack, pack_ids, dry=dry)
        return botanica_id, f"Artists/{display}/Botanica"

    parent = pack_ids.get(pack)
    if not parent:
        parent = ensure_pack_artist(service, pack, pack_ids, dry=dry)
    dest = ensure_folder(service, sub, parent, dry=dry)
    return dest, f"BotanicaArtistPack/{pack}/{sub}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--execute", action="store_true")
    args = ap.parse_args()
    dry = (not args.execute) or args.dry_run
    if args.execute and args.dry_run:
        dry = True

    if not APPROVALS.exists():
        raise SystemExit(
            f"Missing {APPROVALS}\n"
            "Save gallery export as pipeline/data/unassigned_approvals.json"
        )

    data = json.loads(APPROVALS.read_text(encoding="utf-8"))
    assignments = [a for a in data.get("assignments") or [] if a.get("action") == "move"]
    skipped = sum(1 for a in data.get("assignments") or [] if a.get("action") == "skip")

    print(f"Mode: {'DRY-RUN' if dry else 'EXECUTE'}")
    print(f"To move: {len(assignments)}  skipped: {skipped}")
    filippe = sum(1 for a in assignments if a.get("pack_folder") == "11_filipesax_Felippe_Sax")
    print(f"Felippe Sax assignments: {filippe}")
    if not assignments:
        print("Nothing to move.")
        return 0

    service = get_service()
    pack_ids = pack_folder_ids()
    artists_cache: dict[str, str] = {}
    results = []
    for i, a in enumerate(assignments, 1):
        print(f"[{i}/{len(assignments)}] {a.get('name')} → {a.get('pack_folder')}")
        try:
            dest_id, label = resolve_dest(service, a, pack_ids, dry=dry, artists_cache=artists_cache)
            r = move_file(service, a["file_id"], dest_id, dry=dry)
            r["to"] = label
            r["from_name"] = a.get("name")
            results.append(r)
            print(f"   → {r.get('status')} ({label})")
        except Exception as e:
            results.append({"status": "error", "name": a.get("name"), "error": str(e)[:400]})
            print(f"   ERROR: {e}")

    report = {
        "created_at": utc_now(),
        "mode": "dry_run" if dry else "execute",
        "moved": sum(1 for r in results if r.get("status") == "moved"),
        "dry_run": sum(1 for r in results if r.get("status") == "dry_run"),
        "errors": sum(1 for r in results if r.get("status") == "error"),
        "skipped_in_approvals": skipped,
        "felippe_sax": filippe,
        "results": results,
        "notes": data.get("notes") or [],
    }
    out_json = DATA / "unassigned_execution.json"
    out_json.write_text(json.dumps(report, indent=2), encoding="utf-8")
    md = [
        "# UNASSIGNED approvals execution",
        "",
        f"**Created:** {report['created_at']}",
        f"**Mode:** {report['mode']}",
        f"**Moved:** {report['moved']}",
        f"**Felippe Sax:** {filippe}",
        f"**Errors:** {report['errors']}",
        "",
    ]
    for r in results:
        md.append(
            f"- {r.get('from_name') or r.get('name')} → {r.get('to', '')} — **{r.get('status')}**"
        )
    (REPORTS / "unassigned_execution.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"Wrote {out_json}")
    print(f"Wrote {REPORTS / 'unassigned_execution.md'}")
    return 0 if report["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
