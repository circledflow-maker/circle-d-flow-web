#!/usr/bin/env python3
"""
Build a focused gallery for the 12 held UNASSIGNED items
(DSC_1565 mixed, DSC_1568, DSC_1601).

Uses existing thumbs when present; optional --fetch-thumbs.
Writes pipeline/work/held_review.html + held_review_pack.json
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
WORK = ROOT / "pipeline" / "work"
THUMB_DIR = WORK / "unassigned_thumbs"
REF_DIR = WORK / "artist_ref_thumbs"
GALLERY = WORK / "held_review.html"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]

# Prefer these artists in the held gallery
ARTISTS = [
    ("02_noua_Noua", "Noua"),
    ("10_wako.kungo_Wako_Kungo", "Wako Kungo"),
    ("11_filipesax_Felippe_Sax", "Felippe Sax"),
    ("04_diazaofficial_Diaza", "Diaza"),
    ("05_joaoredondomaia_Joao_Redondo_Maia", "João Redondo Maia"),
    ("09_edoardostatuto_Edo_Edoardo_Statuto", "Edo"),
    ("01_lyssa.bl_Lyssa", "Lyssa"),
    ("03_chriskristoffer_Chris_Kristoffer", "Chris Kristoffer"),
    ("06_zeus_atro_Zeus_Atro", "Zeus Atro"),
    ("07_silso_n6_Silso", "Silso"),
    ("08_mistah_isaac_Mistah_Isaac", "Mistah Isaac"),
]


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


def download_thumb(service, file_id: str, hint: Optional[str], out: Path) -> bool:
    if out.exists() and out.stat().st_size > 0:
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
        link = re.sub(r"sz=[^&]+", "sz=w800", link)
    else:
        link = link + ("&" if "?" in link else "?") + "sz=w800"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(urlopen(link, timeout=60).read())
    return True


def load_held_items() -> list[dict[str, Any]]:
    sk = json.loads((DATA / "unassigned_skip_sibling_approvals.json").read_text(encoding="utf-8"))
    held = sk.get("held_for_review") or []
    # enrich from inventory
    inv = json.loads((DATA / "drive_inventory.json").read_text(encoding="utf-8"))
    by_id = {f["file_id"]: f for f in inv["files"]}
    # also from original approvals for file_id
    items = []
    for h in held:
        fid = h["file_id"]
        meta = by_id.get(fid) or {}
        name = h.get("name") or meta.get("name")
        thumb = f"{safe_name(name)}.jpg"
        items.append(
            {
                "file_id": fid,
                "name": name,
                "sibling_packs": h.get("sibling_packs") or [],
                "reason": h.get("reason"),
                "thumb_file": thumb,
                "thumbnail_hint": meta.get("thumbnail_hint"),
                "parent_folder_path": meta.get("parent_folder_path")
                or "Botanica/_UNASSIGNED_REVIEW",
                "kind": (
                    "video"
                    if str(name).lower().endswith((".mp4", ".mov"))
                    else "frame"
                ),
                "pack_subfolder": (
                    "01_VIDEOS_PERFORMANCE"
                    if str(name).lower().endswith((".mp4", ".mov"))
                    else "03_FRAMES"
                ),
                "suggested": (
                    ""
                    if len(h.get("sibling_packs") or []) != 1
                    else (h.get("sibling_packs") or [""])[0]
                ),
            }
        )
    return items


def write_gallery(items: list[dict[str, Any]]) -> Path:
    artists = []
    for folder, label in ARTISTS:
        refs = []
        d = REF_DIR / folder
        if d.exists():
            for f in sorted(d.iterdir()):
                if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    refs.append({"name": f.name, "src": f"artist_ref_thumbs/{folder}/{f.name}"})
        # Felippe local assets
        if folder.startswith("11_filipesax"):
            src = ROOT / "pipeline" / "assets" / "artist_refs" / "Felippe_Sax"
            if src.exists():
                dest = REF_DIR / folder
                dest.mkdir(parents=True, exist_ok=True)
                for f in src.iterdir():
                    target = dest / f.name
                    if not target.exists():
                        shutil.copy2(f, target)
                    refs.append({"name": f.name, "src": f"artist_ref_thumbs/{folder}/{f.name}"})
        artists.append({"folder": folder, "label": label, "refs": refs})

    payload = {
        "created_at": utc_now(),
        "title": "HELD UNASSIGNED REVIEW (12)",
        "artists": artists,
        "items": [
            {
                "file_id": i["file_id"],
                "name": i["name"],
                "kind": i["kind"],
                "subfolder": i["pack_subfolder"],
                "suggested": i.get("suggested") or "",
                "note": f"siblings={i.get('sibling_packs')}",
                "src": f"unassigned_thumbs/{i['thumb_file']}",
            }
            for i in items
        ],
        "pack_to_artists": {a: b for a, b in ARTISTS},
    }
    payload_json = json.dumps(payload).replace("</", "<\\/")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Held UNASSIGNED Review — 12</title>
<style>
:root {{ --bg:#12100e; --ink:#f3ebe0; --muted:#a89884; --line:#3a322a; --gold:#c9a227; --panel:#1c1814; }}
body {{ margin:0; font-family:"Segoe UI",sans-serif; background:radial-gradient(1000px 500px at 10% -10%,#2a2218,var(--bg)); color:var(--ink); }}
header {{ position:sticky; top:0; z-index:5; display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; padding:14px 18px; background:rgba(18,16,14,.92); border-bottom:1px solid var(--line); }}
h1 {{ margin:0; font-size:1.1rem; color:var(--gold); }}
.meta {{ color:var(--muted); font-size:.85rem; }}
button {{ background:var(--gold); color:#1a140c; border:0; border-radius:4px; padding:8px 14px; font-weight:700; cursor:pointer; }}
.refs {{ display:flex; gap:10px; overflow-x:auto; padding:12px 18px; border-bottom:1px solid var(--line); background:var(--panel); }}
.ref {{ flex:0 0 auto; width:100px; font-size:.7rem; color:var(--muted); text-align:center; }}
.ref img {{ width:100px; height:100px; object-fit:cover; border:1px solid var(--line); display:block; margin-bottom:4px; background:#000; }}
main {{ padding:16px 18px 80px; display:grid; gap:14px; }}
.card {{ display:grid; grid-template-columns:220px 1fr; gap:14px; background:var(--panel); border:1px solid var(--line); padding:12px; }}
.card img.thumb {{ width:220px; height:160px; object-fit:cover; background:#000; border:1px solid var(--line); }}
.choices {{ display:flex; flex-wrap:wrap; gap:6px; }}
.choices label {{ border:1px solid var(--line); padding:5px 8px; font-size:.78rem; cursor:pointer; border-radius:3px; }}
.choices label:has(input:checked) {{ border-color:var(--gold); color:var(--gold); }}
.choices input {{ display:none; }}
@media (max-width:720px) {{ .card {{ grid-template-columns:1fr; }} .card img.thumb {{ width:100%; height:200px; }} }}
</style>
</head>
<body>
<header>
  <div>
    <h1>HELD REVIEW — 12 LEFT</h1>
    <div class="meta">DSC_1565 (Noua vs Wako) · DSC_1568 · DSC_1601 — no auto-move</div>
  </div>
  <div class="meta" id="progress">0 reviewed</div>
  <button type="button" id="btnExport">Download held approvals JSON</button>
</header>
<section class="refs" id="refs"></section>
<main id="main"></main>
<script>
const DATA = {payload_json};
const state = {{}};
const refsEl = document.getElementById('refs');
const main = document.getElementById('main');
const progress = document.getElementById('progress');
function renderRefs() {{
  refsEl.innerHTML = '';
  for (const a of DATA.artists) {{
    for (const r of a.refs) {{
      const d = document.createElement('div');
      d.className = 'ref';
      d.innerHTML = `<img src="${{r.src}}" alt="${{a.label}}" loading="lazy"/><div>${{a.label}}</div>`;
      refsEl.appendChild(d);
    }}
  }}
}}
function count() {{
  const done = DATA.items.filter(i => state[i.file_id] !== undefined).length;
  const moves = DATA.items.filter(i => state[i.file_id]).length;
  progress.textContent = done + ' / ' + DATA.items.length + ' reviewed · ' + moves + ' to move';
}}
function render() {{
  main.innerHTML = '';
  for (const item of DATA.items) {{
    const card = document.createElement('article');
    card.className = 'card';
    const choices = [...DATA.artists.map(a => ({{v:a.folder,l:a.label}})), {{v:'',l:'SKIP / keep'}}];
    card.innerHTML = `
      <img class="thumb" src="${{item.src}}" alt="${{item.name}}" loading="lazy"/>
      <div>
        <h2 style="margin:0 0 6px;font-size:1rem">${{item.name}}</h2>
        <div class="meta" style="margin-bottom:8px">${{item.note}}</div>
        <div class="choices">${{choices.map(c => `<label><input type="radio" name="${{item.file_id}}" value="${{c.v}}"/> ${{c.l}}</label>`).join('')}}</div>
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
    if (!pack) {{ assignments.push({{file_id:item.file_id,name:item.name,action:'skip',pack_folder:null}}); continue; }}
    assignments.push({{
      file_id: item.file_id,
      name: item.name,
      action: 'move',
      pack_folder: pack,
      pack_subfolder: item.subfolder,
      artists_folder: DATA.pack_to_artists[pack] || null,
      prefer_artists_botanica: ['10_wako.kungo_Wako_Kungo','11_filipesax_Felippe_Sax'].includes(pack),
    }});
  }}
  const out = {{ created_at: new Date().toISOString(), source: 'held_review_gallery', policy: 'Human-approved held items only', assignments }};
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
    args = ap.parse_args()

    items = load_held_items()
    pack = {
        "created_at": utc_now(),
        "count": len(items),
        "items": items,
        "notes": [
            "DSC_1565: siblings Noua + Wako — visual pick",
            "DSC_1568 / DSC_1601: no sibling — full artist pick",
        ],
    }
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "held_review_pack.json").write_text(json.dumps(pack, indent=2), encoding="utf-8")

    if args.fetch_thumbs:
        service = get_service()
        THUMB_DIR.mkdir(parents=True, exist_ok=True)
        for i in items:
            out = THUMB_DIR / i["thumb_file"]
            try:
                ok = download_thumb(service, i["file_id"], i.get("thumbnail_hint"), out)
                print(("saved" if ok else "no thumb"), i["name"])
            except Exception as e:
                print(f"ERROR {i['name']}: {e}")

    path = write_gallery(items)
    (REPORTS / "held_review.md").write_text(
        f"""# Held UNASSIGNED review — 12

**Created:** {pack['created_at']}

| Cluster | Count | Note |
|---------|------:|------|
| DSC_1565 | 2 | Noua vs Wako |
| DSC_1568 | 5 | no sibling |
| DSC_1601 | 5 | no sibling |

## Windows
```bat
pipeline\\REVIEW_HELD_UNASSIGNED.cmd
```
Save downloaded JSON as `pipeline\\data\\unassigned_approvals.json` then:
```bat
pipeline\\EXECUTE_UNASSIGNED_APPROVALS.cmd
```
""",
        encoding="utf-8",
    )
    print(f"Held items: {len(items)}")
    print(f"Gallery: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
