#!/usr/bin/env python3
"""
Apply human-approved UNASSIGNED assignments on Google Drive.

Reads: pipeline/data/unassigned_approvals.json
Never deletes. Only moves files with action=move.

  python pipeline/tools/apply_unassigned_approvals.py --dry-run
  python pipeline/tools/apply_unassigned_approvals.py --execute
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
APPROVALS = DATA / "unassigned_approvals.json"
PACK = DATA / "unassigned_review_pack.json"
INV = DATA / "drive_inventory.json"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]
LIST_KW = {"supportsAllDrives": True, "includeItemsFromAllDrives": True}
FILE_KW = {"supportsAllDrives": True}

WAKO_ARTIST_ID = "1oDFvtuC1-aQTxUe7i4AZZx12EvVLvX0j"


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
        return f"DRY_{name}_UNDER_{parent_id}"
    meta = {"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]}
    created = service.files().create(body=meta, fields="id,name", **FILE_KW).execute()
    print(f"   created '{name}' → {created['id']}")
    return created["id"]


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
    return {"status": "moved", "file_id": file_id, "name": updated.get("name"), "parents": updated.get("parents")}


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
) -> tuple[str, str]:
    """Return (dest_folder_id, label)."""
    pack = assignment["pack_folder"]
    sub = assignment.get("pack_subfolder") or "03_FRAMES"

    if assignment.get("prefer_artists_botanica") and pack == "10_wako.kungo_Wako_Kungo":
        botanica_id = ensure_folder(service, "Botanica", WAKO_ARTIST_ID, dry=dry)
        return botanica_id, "Artists/Wako Kungo/Botanica"

    parent = pack_ids.get(pack)
    if not parent:
        raise SystemExit(f"Unknown pack folder: {pack}")
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
            "Open pipeline/work/unassigned_review.html → Download approvals JSON → "
            "save as pipeline/data/unassigned_approvals.json"
        )

    data = json.loads(APPROVALS.read_text(encoding="utf-8"))
    assignments = [a for a in data.get("assignments") or [] if a.get("action") == "move"]
    skipped = sum(1 for a in data.get("assignments") or [] if a.get("action") == "skip")

    print(f"Mode: {'DRY-RUN' if dry else 'EXECUTE'}")
    print(f"To move: {len(assignments)}  skipped: {skipped}")
    if not assignments:
        print("Nothing to move.")
        return 0

    service = get_service()
    pack_ids = pack_folder_ids()
    results = []
    for i, a in enumerate(assignments, 1):
        print(f"[{i}/{len(assignments)}] {a.get('name')} → {a.get('pack_folder')}")
        try:
            dest_id, label = resolve_dest(service, a, pack_ids, dry=dry)
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
        "results": results,
    }
    out_json = DATA / "unassigned_execution.json"
    out_json.write_text(json.dumps(report, indent=2), encoding="utf-8")
    md = [
        "# UNASSIGNED approvals execution",
        "",
        f"**Created:** {report['created_at']}",
        f"**Mode:** {report['mode']}",
        f"**Moved:** {report['moved']}",
        f"**Errors:** {report['errors']}",
        "",
    ]
    for r in results:
        md.append(f"- {r.get('from_name') or r.get('name')} → {r.get('to', '')} — **{r.get('status')}**")
    (REPORTS / "unassigned_execution.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"Wrote {out_json}")
    print(f"Wrote {REPORTS / 'unassigned_execution.md'}")
    return 0 if report["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
