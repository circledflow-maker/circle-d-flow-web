#!/usr/bin/env python3
"""
Execute APPROVED organization proposals — HIGH confidence only by default.

Requires Google Drive API write auth via token.json (from scripts/gdrive_setup.py).
Does NOT delete, overwrite, or duplicate. Creates destination leaf folder if missing.
MEDIUM/LOW are never auto-executed unless --include-medium (still no LOW).

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
CREDS = ROOT / "credentials.json"
SCOPES = [
    "https://www.googleapis.com/auth/drive",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_proposals() -> dict[str, Any]:
    return json.loads(PROPOSALS.read_text(encoding="utf-8"))


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
            "On the PC with Drive access:\n"
            "  python scripts/gdrive_setup.py\n"
            "Then re-run this executor."
        )

    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            TOKEN.write_text(creds.to_json(), encoding="utf-8")
        else:
            raise SystemExit("token.json invalid — re-run scripts/gdrive_setup.py")

    # Prefer full drive scope; readonly token will fail on move with clear error
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def ensure_folder(service, name: str, parent_id: str, dry: bool) -> str:
    """Return folder id for name under parent; create if missing."""
    safe = name.replace("'", "\\'")
    q = (
        f"name='{safe}' and '{parent_id}' in parents "
        "and mimeType='application/vnd.google-apps.folder' and trashed=false"
    )
    res = service.files().list(q=q, fields="files(id,name)", pageSize=5).execute()
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
    created = service.files().create(body=meta, fields="id,name").execute()
    return created["id"]


def move_file(service, file_id: str, new_parent: str, old_parent: Optional[str], dry: bool) -> dict[str, Any]:
    if dry:
        return {"status": "dry_run", "file_id": file_id, "new_parent": new_parent}
    # get current parents if unknown
    if not old_parent:
        meta = service.files().get(fileId=file_id, fields="parents").execute()
        parents = meta.get("parents") or []
    else:
        parents = [old_parent]
    prev = ",".join(parents)
    updated = (
        service.files()
        .update(
            fileId=file_id,
            addParents=new_parent,
            removeParents=prev,
            fields="id,name,parents",
        )
        .execute()
    )
    return {"status": "moved", "file_id": file_id, "name": updated.get("name"), "parents": updated.get("parents")}


def main() -> int:
    ap = argparse.ArgumentParser(description="Execute HIGH organization proposals on Google Drive")
    ap.add_argument("--dry-run", action="store_true", help="Plan only (default if neither flag)")
    ap.add_argument("--execute", action="store_true", help="Perform Drive folder create + moves")
    ap.add_argument(
        "--include-medium",
        action="store_true",
        help="Also execute MEDIUM proposals that action_if_approved startswith move (NOT review_only)",
    )
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    execute = bool(args.execute)
    dry = (not execute) or args.dry_run
    if args.execute and args.dry_run:
        dry = True  # prefer safety if both set

    data = load_proposals()
    candidates = list(data.get("high_confidence_automatic_candidates") or [])
    if args.include_medium:
        for p in data.get("proposals") or []:
            if p.get("confidence") == "MEDIUM" and str(p.get("action_if_approved", "")).startswith("move"):
                candidates.append(p)

    # Only automatic_eligible for default HIGH path
    if not args.include_medium:
        candidates = [c for c in candidates if c.get("automatic_eligible")]

    if args.limit:
        candidates = candidates[: args.limit]

    print(f"Mode: {'DRY-RUN' if dry else 'EXECUTE'}")
    print(f"Candidates: {len(candidates)}")
    if not candidates:
        print("Nothing to do.")
        return 0

    # Known IDs from inventory
    arpan_events_id = "1Yc-5UINgmFWxv2Ykpify4zqmiL4_LY08"
    arpan_upload_id = "1EE4p4332kBWjWlDalUaohwMJN9I3XV8S"

    results: list[dict[str, Any]] = []
    service = None
    if not dry or True:
        # Need service even for dry-run listing of existing dest? optional
        try:
            if not dry:
                service = get_service()
            elif TOKEN.exists():
                service = get_service()
                print("Auth OK (dry-run with live folder check)")
            else:
                print("NOTE: token.json missing — dry-run local plan only (no live Drive checks)")
        except SystemExit as e:
            if not dry:
                raise
            print(f"NOTE: {e}")

    dest_id = None
    if service:
        try:
            dest_id = ensure_folder(service, "Lapa71", arpan_events_id, dry=dry)
            print(f"Destination Artists/Arpan/events/Lapa71 → {dest_id}")
        except Exception as e:
            print(f"ERROR ensuring destination folder: {e}")
            if not dry:
                return 2

    for i, c in enumerate(candidates, 1):
        fid = c["file_id"]
        name = c.get("file_name") or c.get("name")
        old_parent = c.get("current_parent_id") or arpan_upload_id
        print(f"[{i}/{len(candidates)}] {name}")
        if dry and not service:
            results.append(
                {
                    "file_id": fid,
                    "name": name,
                    "status": "dry_run_planned",
                    "from": c.get("current_path"),
                    "to": c.get("proposed_destination"),
                }
            )
            continue
        if dry and service:
            results.append(
                {
                    "file_id": fid,
                    "name": name,
                    "status": "dry_run_auth_ok",
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
            results.append({"file_id": fid, "name": name, "status": "error", "error": str(e)[:300]})
            print(f"   ERROR: {e}")

    report = {
        "created_at": utc_now(),
        "mode": "dry_run" if dry else "execute",
        "candidates": len(candidates),
        "results": results,
        "moved": sum(1 for r in results if r.get("status") == "moved"),
        "errors": sum(1 for r in results if r.get("status") == "error"),
        "medium_included": bool(args.include_medium),
        "low_executed": False,
        "notes": [
            "HIGH automatic-eligible only by default",
            "MEDIUM/LOW not executed unless explicitly included (MEDIUM only)",
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
        f"**Errors:** {report['errors']}",
        "",
        "## Results",
        "",
    ]
    for r in results:
        md.append(f"- `{r.get('name')}` — **{r.get('status')}** — {r.get('from')} → {r.get('to', '')}")
        if r.get("error"):
            md.append(f"  - error: {r['error']}")
    md += ["", "MEDIUM/LOW untouched unless flags say otherwise.", ""]
    (REPORTS / "organization_execution_report.md").write_text("\n".join(md), encoding="utf-8")
    print(f"\nWrote pipeline/data/organization_execution.json")
    print(f"Wrote pipeline/reports/organization_execution_report.md")
    if dry and report["moved"] == 0:
        print("\nDRY-RUN complete. To execute on a machine with token.json:")
        print("  python pipeline/tools/execute_organization.py --execute")
    return 0 if report["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
