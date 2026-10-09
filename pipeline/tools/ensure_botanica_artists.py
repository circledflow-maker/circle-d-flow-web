#!/usr/bin/env python3
"""
Create missing Content Pipeline Artists folders for Botanica lineup.

Arpan schema subfolders + events/Botanica. Syncs folder ids into
scripts/content_pipeline/artist_registry.json

  python pipeline/tools/ensure_botanica_artists.py --dry-run
  python pipeline/tools/ensure_botanica_artists.py --execute
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
REGISTRY = ROOT / "scripts" / "content_pipeline" / "artist_registry.json"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]
LIST_KW = {"supportsAllDrives": True, "includeItemsFromAllDrives": True}
FILE_KW = {"supportsAllDrives": True}

ARTISTS_ROOT = "1OLOk__QJ2TWVvcgnhu9wEV4rYF6ALc7Q"
BOTANICA_PACK_ROOT = "1Ss3ypxTiJgTCW-ucsLLbjEbG653RuRbk"

ARPAN_SUBS = [
    "events",
    "Flow Talk",
    "Just in Flow with the beat",
    "Performance - CircleDStages",
    "Wisdom to share- Akademie",
]
PACK_SUBS = ["00_REF", "01_VIDEOS_PERFORMANCE", "02_PORTRAITS", "03_FRAMES"]

# Artists to ensure after UNASSIGNED execute
ENSURE = [
    {
        "name": "Felippe Sax",
        "pack_folder": "11_filipesax_Felippe_Sax",
        "aliases": ["filipesax_", "filipe bohlke", "felippe sax", "bohlke"],
        "instagram": "filipesax_",
    },
    {
        "name": "Noua",
        "pack_folder": "02_noua_Noua",
        "aliases": ["noua"],
    },
    {
        "name": "Diaza",
        "pack_folder": "04_diazaofficial_Diaza",
        "aliases": ["diaza", "diazaofficial"],
    },
    {
        "name": "João Redondo Maia",
        "pack_folder": "05_joaoredondomaia_Joao_Redondo_Maia",
        "aliases": ["joaoredondomaia", "joao redondo", "redondo maia"],
    },
    {
        "name": "Lyssa",
        "pack_folder": "01_lyssa.bl_Lyssa",
        "aliases": ["lyssa", "lyssa.bl"],
    },
    {
        "name": "Zeus Atro",
        "pack_folder": "06_zeus_atro_Zeus_Atro",
        "aliases": ["zeus atro", "zeus_atro", "zeus"],
    },
    {
        "name": "Silso",
        "pack_folder": "07_silso_n6_Silso",
        "aliases": ["silso", "silso_n6"],
    },
    {
        "name": "Piano Player",
        "pack_folder": "12_piano_player_TBD",
        "aliases": ["piano player", "piano", "pianist"],
    },
    {
        "name": "Other Guitar",
        "pack_folder": "13_other_guitar_TBD",
        "aliases": ["other guitar", "other guitarplayer", "guitar player tbd"],
    },
]


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
        print(f"   [dry] create '{name}' under {parent_id}")
        return f"DRY_{name}"
    meta = {"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]}
    created = service.files().create(body=meta, fields="id,name", **FILE_KW).execute()
    print(f"   created '{name}' → {created['id']}")
    return created["id"]


def ensure_artist(service, name: str, dry: bool) -> tuple[str, bool]:
    safe = name.replace("'", "\\'")
    q = (
        f"name='{safe}' and '{ARTISTS_ROOT}' in parents "
        "and mimeType='application/vnd.google-apps.folder' and trashed=false"
    )
    res = service.files().list(q=q, fields="files(id,name)", pageSize=5, **LIST_KW).execute()
    files = res.get("files") or []
    created = False
    if files:
        artist_id = files[0]["id"]
        print(f"OK Artists/{name} → {artist_id}")
    else:
        print(f"CREATE Artists/{name}")
        artist_id = ensure_folder(service, name, ARTISTS_ROOT, dry=dry)
        created = True
    for sub in ARPAN_SUBS:
        ensure_folder(service, sub, artist_id, dry=dry)
    events = ensure_folder(service, "events", artist_id, dry=dry)
    ensure_folder(service, "Botanica", events, dry=dry)
    return artist_id, created


def ensure_pack(service, pack_folder: str, dry: bool) -> str:
    safe = pack_folder.replace("'", "\\'")
    q = (
        f"name='{safe}' and '{BOTANICA_PACK_ROOT}' in parents "
        "and mimeType='application/vnd.google-apps.folder' and trashed=false"
    )
    res = service.files().list(q=q, fields="files(id,name)", pageSize=5, **LIST_KW).execute()
    files = res.get("files") or []
    if files:
        pack_id = files[0]["id"]
        print(f"OK pack {pack_folder} → {pack_id}")
    else:
        print(f"CREATE pack {pack_folder}")
        pack_id = ensure_folder(service, pack_folder, BOTANICA_PACK_ROOT, dry=dry)
    for sub in PACK_SUBS:
        ensure_folder(service, sub, pack_id, dry=dry)
    return pack_id


def sync_registry(results: list[dict[str, Any]]) -> None:
    reg = json.loads(REGISTRY.read_text(encoding="utf-8"))
    by_name = {a["name"]: a for a in reg.get("artists") or []}
    for r in results:
        name = r["name"]
        aid = r.get("artists_folder_id")
        if not aid or str(aid).startswith("DRY_"):
            continue
        if name in by_name:
            by_name[name]["id"] = aid
            if r.get("pack_folder"):
                by_name[name]["pack_folder"] = r["pack_folder"]
            for k in ("aliases", "instagram"):
                if r.get(k) and not by_name[name].get(k):
                    by_name[name][k] = r[k]
        else:
            entry = {
                "name": name,
                "id": aid,
                "aliases": r.get("aliases") or [],
                "pack_folder": r.get("pack_folder"),
            }
            if r.get("instagram"):
                entry["instagram"] = r["instagram"]
            reg["artists"].append(entry)
            by_name[name] = entry
    # lineup proposals stay; mark ensured
    for p in reg.get("botanica_lineup_proposals") or []:
        if p.get("display_name") in by_name and by_name[p["display_name"]].get("id"):
            p["artists_folder_id"] = by_name[p["display_name"]]["id"]
            p["status"] = "ensured"
    REGISTRY.write_text(json.dumps(reg, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--execute", action="store_true")
    args = ap.parse_args()
    dry = (not args.execute) or args.dry_run
    if args.execute and args.dry_run:
        dry = True

    print(f"Mode: {'DRY-RUN' if dry else 'EXECUTE'}")
    service = get_service()
    results = []
    for spec in ENSURE:
        print(f"\n=== {spec['name']} ===")
        artist_id, created = ensure_artist(service, spec["name"], dry=dry)
        pack_id = ensure_pack(service, spec["pack_folder"], dry=dry)
        results.append(
            {
                **spec,
                "artists_folder_id": artist_id,
                "pack_folder_id": pack_id,
                "created_artists_folder": created,
            }
        )

    if not dry:
        sync_registry(results)

    report = {"created_at": utc_now(), "mode": "dry_run" if dry else "execute", "results": results}
    DATA.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    (DATA / "botanica_artists_ensure.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    lines = [
        "# Botanica Artists ensure",
        "",
        f"**Created:** {report['created_at']}",
        f"**Mode:** {report['mode']}",
        "",
    ]
    for r in results:
        lines.append(
            f"- **{r['name']}** — Artists `{r['artists_folder_id']}` · pack `{r['pack_folder']}`"
            + (" · *new*" if r.get("created_artists_folder") else "")
        )
    (REPORTS / "botanica_artists_ensure.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nWrote pipeline/data/botanica_artists_ensure.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
