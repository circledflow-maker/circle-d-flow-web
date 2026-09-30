#!/usr/bin/env python3
"""
Execute APPROVED organization proposals — HIGH confidence only by default.

Requires token.json with FULL Drive scope:
  python scripts/gdrive_setup.py --force

403 appNotAuthorizedToFile = old token used drive.file/readonly — re-auth with --force.

  python pipeline/tools/execute_organization.py --dry-run
  python pipeline/tools/execute_organization.py --execute
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
PROPOSALS = DATA / "organization_proposals.json"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]

# Shared / all-drives helpers
LIST_KW = {"supportsAllDrives": True, "includeItemsFromAllDrives": True}
FILE_KW = {"supportsAllDrives": True}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_proposals() -> dict[str, Any]:
    return json.loads(PROPOSALS.read_text(encoding="utf-8"))


def explain_403(err: str) -> str:
    if "appNotAuthorizedToFile" in err or "not granted the app" in err:
        return (
            "\nFIX: token was created with drive.file/readonly and cannot move existing files.\n"
            "  1) del token.json\n"
            "  2) python scripts\\gdrive_setup.py --force\n"
            "  3) Grant FULL Google Drive access in the browser\n"
            "  4) python pipeline\\tools\\execute_organization.py --execute\n"
        )
    return ""


def get_service():
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
    except ImportError as e:
        raise SystemExit(
            "Missing google-api-python-client. Run:\n"
            "  pip install google-api-python-client google-auth-oauthlib google-auth-httplib2\n"
            f"Detail: {e}"
        )

    if not TOKEN.exists():
        raise SystemExit(
            "BLOCKER: token.json missing.\n"
            "  python scripts/gdrive_setup.py --force\n"
        )

    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    have = set(creds.scopes or [])
    if have and not set(SCOPES).issubset(have):
        raise SystemExit(
            f"BLOCKER: token scopes {sorted(have)} lack full Drive write.\n"
            "  python scripts/gdrive_setup.py --force\n"
        )

    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            TOKEN.write_text(creds.to_json(), encoding="utf-8")
        else:
            raise SystemExit("token.json invalid — run: python scripts/gdrive_setup.py --force")

    return build("drive", "v3", credentials=creds, cache_discovery=False)


def ensure_folder(service, name: str, parent_id: str, dry: bool) -> str:
    safe = name.replace("'", "\\'")
    q = (
        f"name='{safe}' and '{parent_id}' in parents "
        "and mimeType='application/vnd.google-apps.folder' and trashed=false"
    )
    res = (
        service.files()
        .list(q=q, fields="files(id,name)", pageSize=5, **LIST_KW)
        .execute()
    )
    files = res.get("files") or []
    if files:
        return files[0]["id"]
    if dry:
        return f"DRY_CREATE_UNDER_{parent_id}"
    meta = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id],
    }
    created = service.files().create(body=meta, fields="id,name", **FILE_KW).execute()
    print(f"   created folder '{name}' → {created['id']}")
    return created["id"]


def move_file(service, file_id: str, new_parent: str, old_parent: Optional[str], dry: bool) -> dict[str, Any]:
    if dry:
        return {"status": "dry_run", "file_id": file_id, "new_parent": new_parent}

    meta = service.files().get(fileId=file_id, fields="id,name,parents", **FILE_KW).execute()
    parents = meta.get("parents") or []
    if new_parent in parents:
        return {
            "status": "already_in_destination",
            "file_id": file_id,
            "name": meta.get("name"),
            "parents": parents,
        }

    remove = [p for p in parents if p != new_parent]
    if old_parent and old_parent not in remove and old_parent in parents:
        remove = [old_parent]

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


def main() -> int:
    ap = argparse.ArgumentParser(description="Execute HIGH organization proposals on Google Drive")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--execute", action="store_true")
    ap.add_argument("--include-medium", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    execute = bool(args.execute)
    dry = (not execute) or args.dry_run
    if args.execute and args.dry_run:
        dry = True

    data = load_proposals()
    candidates = list(data.get("high_confidence_automatic_candidates") or [])
    if args.include_medium:
        for p in data.get("proposals") or []:
            if p.get("confidence") == "MEDIUM" and str(p.get("action_if_approved", "")).startswith("move"):
                candidates.append(p)
    if not args.include_medium:
        candidates = [c for c in candidates if c.get("automatic_eligible")]
    if args.limit:
        candidates = candidates[: args.limit]

    print(f"Mode: {'DRY-RUN' if dry else 'EXECUTE'}")
    print(f"Candidates: {len(candidates)}")
    print("Required OAuth scope: https://www.googleapis.com/auth/drive")
    if not candidates:
        print("Nothing to do.")
        return 0

    arpan_events_id = "1Yc-5UINgmFWxv2Ykpify4zqmiL4_LY08"
    arpan_upload_id = "1EE4p4332kBWjWlDalUaohwMJN9I3XV8S"

    results: list[dict[str, Any]] = []
    service = None
    auth_hint_printed = False
    try:
        if not dry or TOKEN.exists():
            service = get_service()
            print("Auth OK — full Drive scope")
        else:
            print("NOTE: token.json missing — dry-run local plan only")
    except SystemExit as e:
        if not dry:
            print(str(e))
            return 2
        print(f"NOTE: {e}")

    dest_id = None
    if service:
        try:
            dest_id = ensure_folder(service, "Lapa71", arpan_events_id, dry=dry)
            print(f"Destination Artists/Arpan/events/Lapa71 → {dest_id}")
        except Exception as e:
            msg = str(e)
            print(f"ERROR ensuring destination folder: {msg}")
            fix = explain_403(msg)
            if fix:
                print(fix)
                auth_hint_printed = True
            if not dry:
                return 2

    for i, c in enumerate(candidates, 1):
        fid = c["file_id"]
        name = c.get("file_name") or c.get("name")
        old_parent = c.get("current_parent_id") or arpan_upload_id
        print(f"[{i}/{len(candidates)}] {name}")
        if dry:
            results.append(
                {
                    "file_id": fid,
                    "name": name,
                    "status": "dry_run_auth_ok" if service else "dry_run_planned",
                    "dest_folder_id": dest_id,
                    "from": c.get("current_path"),
                    "to": c.get("proposed_destination"),
                }
            )
            continue
        try:
            assert service and dest_id
            r = move_file(service, fid, dest_id, old_parent, dry=False)
            results.append({**r, "from": c.get("current_path"), "to": c.get("proposed_destination")})
            print(f"   → {r.get('status')}")
        except Exception as e:
            msg = str(e)
            results.append(
                {
                    "file_id": fid,
                    "name": name,
                    "status": "error",
                    "error": msg[:400],
                    "from": c.get("current_path"),
                    "to": c.get("proposed_destination"),
                }
            )
            print(f"   ERROR: {msg[:240]}")
            if not auth_hint_printed:
                fix = explain_403(msg)
                if fix:
                    print(fix)
                    auth_hint_printed = True

    report = {
        "created_at": utc_now(),
        "mode": "dry_run" if dry else "execute",
        "candidates": len(candidates),
        "results": results,
        "moved": sum(1 for r in results if r.get("status") == "moved"),
        "already_in_destination": sum(1 for r in results if r.get("status") == "already_in_destination"),
        "errors": sum(1 for r in results if r.get("status") == "error"),
        "medium_included": bool(args.include_medium),
        "low_executed": False,
        "notes": [
            "HIGH automatic-eligible only by default",
            "403 appNotAuthorizedToFile → re-auth with scripts/gdrive_setup.py --force",
            "No deletes/overwrites/duplicates",
        ],
    }
    DATA.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    (DATA / "organization_execution.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    md = [
        "# Organization Execution Report",
        "",
        f"**Created:** {report['created_at']}",
        f"**Mode:** {report['mode']}",
        f"**Candidates:** {report['candidates']}",
        f"**Moved:** {report['moved']}",
        f"**Already in destination:** {report['already_in_destination']}",
        f"**Errors:** {report['errors']}",
        "",
    ]
    if report["errors"]:
        md += [
            "## Auth fix (if 403 appNotAuthorizedToFile)",
            "",
            "```bat",
            "del token.json",
            "python scripts\\gdrive_setup.py --force",
            "python pipeline\\tools\\execute_organization.py --execute",
            "```",
            "",
            "Old tokens used `drive.file` + readonly and cannot move existing Drive files.",
            "",
        ]
    md += ["## Results", ""]
    for r in results:
        md.append(f"- `{r.get('name')}` — **{r.get('status')}** — {r.get('from')} → {r.get('to', '')}")
        if r.get("error"):
            md.append(f"  - error: {r['error'][:200]}")
    md += ["", "MEDIUM/LOW untouched unless flags say otherwise.", ""]
    (REPORTS / "organization_execution_report.md").write_text("\n".join(md), encoding="utf-8")
    print(f"\nWrote pipeline/data/organization_execution.json")
    print(f"Wrote pipeline/reports/organization_execution_report.md")
    if dry:
        print("\nDRY-RUN complete. Execute with full-scope token:")
        print("  python scripts\\gdrive_setup.py --force")
        print("  python pipeline\\tools\\execute_organization.py --execute")
    return 0 if report["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
