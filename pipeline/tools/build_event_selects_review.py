#!/usr/bin/env python3
"""
Next-frame batch: Botanica/EVENT_SELECTS review gallery.

- PERFORMANCE (44): artist assignment gallery
- VENUE / CROWD_WIDE / DETAILS: already typed — leave (or optional place note)

  python pipeline/tools/build_event_selects_review.py
  python pipeline/tools/build_event_selects_review.py --fetch-thumbs
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
WORK = ROOT / "pipeline" / "work"
THUMB_DIR = WORK / "event_selects_thumbs"
REF_DIR = WORK / "artist_ref_thumbs"
GALLERY = WORK / "event_selects_review.html"
INV = DATA / "drive_inventory.json"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]

ARTISTS = [
    ("01_lyssa.bl_Lyssa", "Lyssa"),
    ("02_noua_Noua", "Noua"),
    ("03_chriskristoffer_Chris_Kristoffer", "Chris Kristoffer"),
    ("04_diazaofficial_Diaza", "Diaza"),
    ("05_joaoredondomaia_Joao_Redondo_Maia", "João Redondo Maia"),
    ("06_zeus_atro_Zeus_Atro", "Zeus Atro"),
    ("07_silso_n6_Silso", "Silso"),
    ("08_mistah_isaac_Mistah_Isaac", "Mistah Isaac"),
    ("09_edoardostatuto_Edo_Edoardo_Statuto", "Edo"),
    ("10_wako.kungo_Wako_Kungo", "Wako Kungo"),
    ("11_filipesax_Felippe_Sax", "Felippe Sax"),
    # Names TBD — role placeholders
    ("12_piano_player_TBD", "Piano Player (TBD)"),
    ("13_other_guitar_TBD", "Other Guitar (TBD)"),
    ("crowd", "Crowd"),
]

PACK_TO_ARTISTS = {a: b for a, b in ARTISTS}
PREF_ARTISTS = {"10_wako.kungo_Wako_Kungo", "11_filipesax_Felippe_Sax"}
ROLE_PACKS = {"12_piano_player_TBD", "13_other_guitar_TBD", "crowd"}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def safe_name(name: str) -> str:
    return re.sub(r"[^\w.\-]+", "_", name or "file")


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


def download_thumb(
    service, file_id: str, hint: Optional[str], out: Path, *, force: bool = False, size: str = "w1920"
) -> bool:
    """Fetch Drive thumbnail. Use large sz= and gallery object-fit:contain (no crop)."""
    if out.exists() and out.stat().st_size > 0 and not force:
        return True
    meta = (
        service.files()
        .get(fileId=file_id, fields="id,name,thumbnailLink", supportsAllDrives=True)
        .execute()
    )
    link = meta.get("thumbnailLink") or hint
    if not link:
        return False
    if "sz=" in link:
        link = re.sub(r"sz=[^&]+", f"sz={size}", link)
    else:
        link = link + ("&" if "?" in link else "?") + f"sz={size}"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(urlopen(link, timeout=90).read())
    return True


def load_event_selects() -> dict[str, list[dict[str, Any]]]:
    inv = json.loads(INV.read_text(encoding="utf-8"))
    by: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for f in inv["files"]:
        p = f.get("parent_folder_path") or ""
        if not p.startswith("Botanica/EVENT_SELECTS/"):
            continue
        if "folder" in (f.get("mime_type") or ""):
            continue
        bucket = p.split("/", 2)[-1]  # PERFORMANCE / VENUE / ...
        name = f.get("name") or ""
        by[bucket].append(
            {
                "file_id": f["file_id"],
                "name": name,
                "parent_folder_path": p,
                "extension": f.get("extension"),
                "thumbnail_hint": f.get("thumbnail_hint"),
                "url": f.get("url"),
                "thumb_file": f"{safe_name(name)}.jpg",
                "kind": "video" if str(name).lower().endswith((".mp4", ".mov", ".m4v")) else "still",
                "pack_subfolder": (
                    "01_VIDEOS_PERFORMANCE"
                    if str(name).lower().endswith((".mp4", ".mov", ".m4v"))
                    else "03_FRAMES"
                ),
            }
        )
    for k in by:
        by[k] = sorted(by[k], key=lambda x: x["name"])
    return dict(by)


def write_gallery(perf: list[dict[str, Any]], meta: dict[str, Any]) -> Path:
    artists = []
    for folder, label in ARTISTS:
        refs = []
        d = REF_DIR / folder
        if folder.startswith("11_filipesax"):
            src = ROOT / "pipeline" / "assets" / "artist_refs" / "Felippe_Sax"
            if src.exists():
                dest = REF_DIR / folder
                dest.mkdir(parents=True, exist_ok=True)
                for f in src.iterdir():
                    t = dest / f.name
                    if not t.exists():
                        shutil.copy2(f, t)
        if d.exists():
            for f in sorted(d.iterdir()):
                if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    refs.append({"name": f.name, "src": f"artist_ref_thumbs/{folder}/{f.name}"})
        artists.append({"folder": folder, "label": label, "refs": refs})

    payload = {
        "created_at": meta["created_at"],
        "title": "EVENT_SELECTS / PERFORMANCE",
        "artists": artists,
        "pack_to_artists": PACK_TO_ARTISTS,
        "pref_artists": list(PREF_ARTISTS),
        "role_packs": list(ROLE_PACKS),
        "items": [
            {
                "file_id": i["file_id"],
                "name": i["name"],
                "kind": i["kind"],
                "subfolder": i["pack_subfolder"],
                "src": f"event_selects_thumbs/{i['thumb_file']}",
                "note": i["parent_folder_path"],
            }
            for i in perf
        ],
    }
    payload_json = json.dumps(payload).replace("</", "<\\/")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>EVENT_SELECTS Performance Review</title>
<style>
:root {{ --bg:#12100e; --ink:#f3ebe0; --muted:#a89884; --line:#3a322a; --gold:#c9a227; --panel:#1c1814; --role:#7a9e6a; }}
body {{ margin:0; font-family:"Segoe UI",sans-serif; background:radial-gradient(1000px 500px at 10% -10%,#2a2218,var(--bg)); color:var(--ink); }}
header {{ position:sticky; top:0; z-index:5; display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; padding:14px 18px; background:rgba(18,16,14,.92); border-bottom:1px solid var(--line); }}
h1 {{ margin:0; font-size:1.05rem; color:var(--gold); }}
.meta {{ color:var(--muted); font-size:.85rem; }}
button {{ background:var(--gold); color:#1a140c; border:0; border-radius:4px; padding:8px 14px; font-weight:700; cursor:pointer; }}
.refs {{ display:flex; gap:10px; overflow-x:auto; padding:12px 18px; border-bottom:1px solid var(--line); background:var(--panel); }}
.ref {{ flex:0 0 auto; width:96px; font-size:.68rem; color:var(--muted); text-align:center; }}
.ref img {{ width:96px; height:96px; object-fit:contain; border:1px solid var(--line); display:block; margin-bottom:4px; background:#000; }}
main {{ padding:16px 18px 80px; display:grid; gap:14px; }}
.card {{ display:grid; grid-template-columns:320px 1fr; gap:14px; background:var(--panel); border:1px solid var(--line); padding:12px; }}
.card img.thumb {{ width:320px; height:200px; object-fit:contain; background:#000; border:1px solid var(--line); }}
.choices {{ display:flex; flex-wrap:wrap; gap:6px; }}
.choices label {{ border:1px solid var(--line); padding:5px 8px; font-size:.75rem; cursor:pointer; border-radius:3px; }}
.choices label.role {{ border-color:#4a5e42; }}
.choices label:has(input:checked) {{ border-color:var(--gold); color:var(--gold); }}
.choices label.role:has(input:checked) {{ border-color:var(--role); color:var(--role); }}
.choices input {{ display:none; }}
@media (max-width:720px) {{ .card {{ grid-template-columns:1fr; }} .card img.thumb {{ width:100%; height:220px; }} }}
</style>
</head>
<body>
<header>
  <div>
    <h1>EVENT_SELECTS — PERFORMANCE</h1>
    <div class="meta">Thumbs: contain (no crop) · Roles: Piano / Other Guitar / Crowd (names TBD)</div>
  </div>
  <div class="meta" id="progress">0 reviewed</div>
  <button type="button" id="btnExport">Download approvals JSON</button>
</header>
<section class="refs" id="refs"></section>
<main id="main"></main>
<script>
const DATA = {payload_json};
const state = {{}};
function renderRefs() {{
  const el = document.getElementById('refs');
  el.innerHTML = '';
  for (const a of DATA.artists) {{
    for (const r of a.refs) {{
      const d = document.createElement('div');
      d.className = 'ref';
      d.innerHTML = `<img src="${{r.src}}" alt="${{a.label}}" loading="lazy"/><div>${{a.label}}</div>`;
      el.appendChild(d);
    }}
  }}
}}
function count() {{
  const done = DATA.items.filter(i => state[i.file_id] !== undefined).length;
  const moves = DATA.items.filter(i => state[i.file_id]).length;
  document.getElementById('progress').textContent = done + ' / ' + DATA.items.length + ' reviewed · ' + moves + ' to move';
}}
function render() {{
  const main = document.getElementById('main');
  main.innerHTML = '';
  for (const item of DATA.items) {{
    const card = document.createElement('article');
    card.className = 'card';
    const roleSet = new Set(DATA.role_packs || []);
    const choices = [...DATA.artists.map(a => ({{v:a.folder,l:a.label,role:roleSet.has(a.folder)}})), {{v:'',l:'SKIP / keep in PERFORMANCE',role:false}}];
    card.innerHTML = `
      <img class="thumb" src="${{item.src}}" alt="${{item.name}}" loading="lazy"/>
      <div>
        <h2 style="margin:0 0 6px;font-size:.95rem">${{item.name}}</h2>
        <div class="meta" style="margin-bottom:8px">${{item.note}}</div>
        <div class="choices">${{choices.map(c => `<label class="${{c.role ? 'role' : ''}}"><input type="radio" name="${{item.file_id}}" value="${{c.v}}"/> ${{c.l}}</label>`).join('')}}</div>
      </div>`;
    main.appendChild(card);
    card.querySelectorAll('input').forEach(inp => {{
      inp.addEventListener('change', () => {{ state[item.file_id] = inp.value; count(); }});
    }});
  }}
  count();
}}
document.getElementById('btnExport').onclick = () => {{
  const assignments = [];
  for (const item of DATA.items) {{
    if (!(item.file_id in state)) continue;
    const pack = state[item.file_id];
    if (!pack) {{
      assignments.push({{file_id:item.file_id, name:item.name, action:'skip', pack_folder:null}});
      continue;
    }}
    const isCrowd = pack === 'crowd';
    assignments.push({{
      file_id: item.file_id,
      name: item.name,
      action: 'move',
      pack_folder: pack,
      pack_subfolder: isCrowd ? null : item.subfolder,
      artists_folder: DATA.pack_to_artists[pack] || null,
      prefer_artists_botanica: DATA.pref_artists.includes(pack),
      destination_mode: isCrowd ? 'event_selects_crowd' : null,
      source_bucket: 'EVENT_SELECTS/PERFORMANCE',
    }});
  }}
  const out = {{
    created_at: new Date().toISOString(),
    source: 'event_selects_performance_gallery',
    policy: 'Human-approved EVENT_SELECTS performance assignments (incl. Piano/Guitar TBD + Crowd)',
    assignments,
  }};
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out,null,2)], {{type:'application/json'}}));
  a.download = 'unassigned_approvals.json';
  a.click();
}};
renderRefs(); render();
</script>
</body>
</html>
"""
    WORK.mkdir(parents=True, exist_ok=True)
    GALLERY.write_text(html, encoding="utf-8")
    return GALLERY


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch-thumbs", action="store_true")
    ap.add_argument(
        "--force-thumbs",
        action="store_true",
        help="Re-download thumbs at sz=w1920 (fixes soft/cropped previews)",
    )
    args = ap.parse_args()

    buckets = load_event_selects()
    perf = buckets.get("PERFORMANCE") or []
    now = utc_now()
    pack = {
        "created_at": now,
        "batch": "event_selects_performance",
        "performance_count": len(perf),
        "leave_typed": {
            "VENUE": len(buckets.get("VENUE") or []),
            "CROWD_WIDE": len(buckets.get("CROWD_WIDE") or []),
            "DETAILS": len(buckets.get("DETAILS") or []),
        },
        "policy": [
            "PERFORMANCE → artist review gallery",
            "VENUE / CROWD_WIDE / DETAILS already typed — leave in EVENT_SELECTS",
        ],
        "items": perf,
    }
    DATA.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    (DATA / "event_selects_review_pack.json").write_text(json.dumps(pack, indent=2), encoding="utf-8")

    if args.fetch_thumbs or args.force_thumbs:
        service = get_service()
        THUMB_DIR.mkdir(parents=True, exist_ok=True)
        force = bool(args.force_thumbs)
        for i in perf:
            out = THUMB_DIR / i["thumb_file"]
            try:
                ok = download_thumb(
                    service, i["file_id"], i.get("thumbnail_hint"), out, force=force, size="w1920"
                )
                print(("refetch" if force else "saved" if ok else "no thumb"), i["name"])
            except Exception as e:
                print(f"ERROR {i['name']}: {e}")

    path = write_gallery(perf, pack)
    leave = pack["leave_typed"]
    (REPORTS / "event_selects_review.md").write_text(
        f"""# EVENT_SELECTS — next frames

**Created:** {now}

| Bucket | Count | Action |
|--------|------:|--------|
| PERFORMANCE | {len(perf)} | artist review gallery |
| VENUE | {leave['VENUE']} | leave (typed) |
| CROWD_WIDE | {leave['CROWD_WIDE']} | leave (typed) |
| DETAILS | {leave['DETAILS']} | leave (typed) |

## Windows
```bat
pipeline\\REVIEW_EVENT_SELECTS.cmd
```
Save JSON as `pipeline\\data\\unassigned_approvals.json` → `pipeline\\EXECUTE_UNASSIGNED_APPROVALS.cmd`
""",
        encoding="utf-8",
    )
    (REPORTS / "organization_continue.md").write_text(
        f"""# Organization — continue (next frames)

**Updated:** {now}

UNASSIGNED artist queue closed (place B-roll). Next:

## EVENT_SELECTS / PERFORMANCE — {len(perf)} shots
```bat
cd D:\\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\\REVIEW_EVENT_SELECTS.cmd
```

VENUE ({leave['VENUE']}) / CROWD ({leave['CROWD_WIDE']}) / DETAILS ({leave['DETAILS']}) stay typed — no artist pass.

If place B-roll + ensure artists not run yet: `pipeline\\CONTINUE_ORG.cmd` first.
""",
        encoding="utf-8",
    )
    print(f"PERFORMANCE: {len(perf)}")
    print(f"Leave typed: {leave}")
    print(f"Gallery: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
