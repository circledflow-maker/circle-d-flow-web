#!/usr/bin/env python3
"""
UNASSIGNED review helper — metadata + optional Drive thumbnails only.

Never moves files. Never downloads full masters.

  python pipeline/tools/review_unassigned.py
  python pipeline/tools/review_unassigned.py --fetch-thumbs
  python pipeline/tools/review_unassigned.py --fetch-refs
  python pipeline/tools/review_unassigned.py --gallery
  python pipeline/tools/review_unassigned.py --fetch-thumbs --fetch-refs --gallery
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
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
GALLERY = WORK / "unassigned_review.html"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]
DSC = re.compile(r"DSC[_-]?(\d+)", re.I)

DIAZA_FOLDER = "04_diazaofficial_Diaza"
WAKO_STILL_DSC = {1546, 1547, 1548, 1572, 1573, 1574, 1575, 1576, 1579}

# pack folder → Content Pipeline Artists name (when exists)
PACK_TO_ARTISTS = {
    "08_mistah_isaac_Mistah_Isaac": "Mr Isaac",
    "09_edoardostatuto_Edo_Edoardo_Statuto": "Edo",
    "10_wako.kungo_Wako_Kungo": "Wako Kungo",
    "03_chriskristoffer_Chris_Kristoffer": "Chris Inácio",
    "11_filipesax_Felippe_Sax": "Felippe Sax",
}

SUBFOLDER_BY_KIND = {
    "face_reject_video": "01_VIDEOS_PERFORMANCE",
    "face_reject_frame": "03_FRAMES",
    "edit_still": "02_PORTRAITS",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def dsc_num(name: str) -> Optional[int]:
    m = DSC.search(name or "")
    return int(m.group(1)) if m else None


def safe_name(name: str) -> str:
    return re.sub(r"[^\w.\-]+", "_", name or "file")


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
    data = urlopen(link, timeout=60).read()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    return True


def build_pack(inv: dict[str, Any], ai: dict[str, Any]) -> dict[str, Any]:
    diaza_dsc: set[int] = set()
    pack_refs: dict[str, list[dict[str, str]]] = defaultdict(list)
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
        if pp.endswith("/00_REF") and not name.lower().endswith((".txt", ".json")):
            if "readme" in name.lower():
                continue
            pack_refs[artist].append(
                {
                    "file_id": f["file_id"],
                    "name": name,
                    "thumbnail_hint": f.get("thumbnail_hint") or "",
                }
            )

    all_pack = [a.get("name") for a in (ai.get("botanica_artist_pack") or []) if a.get("name")]
    review_artists = [a for a in all_pack if a != DIAZA_FOLDER]

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
                    "note": "Failed primary face match — review other 00_REF",
                    "review_against": review_artists,
                    "confidence": "REVIEW",
                }
            )
        elif "/FRAMES" in pp:
            kind = "face_reject_frame"
            hints.append(
                {
                    "type": "process",
                    "note": "Frame left unassigned after face pass",
                    "review_against": review_artists,
                    "confidence": "REVIEW",
                }
            )
        elif "/PHOTOS" in pp:
            kind = "edit_still"
            if n in WAKO_STILL_DSC:
                hints.append(
                    {
                        "type": "roll_align",
                        "artist_hint": "10_wako.kungo_Wako_Kungo",
                        "confidence": "MEDIUM",
                        "note": "Same DSC as Wako Botanica raw — confirm visually",
                    }
                )
            else:
                hints.append(
                    {
                        "type": "process",
                        "review_against": review_artists,
                        "confidence": "REVIEW",
                        "note": "Edited still without artist tag",
                    }
                )
        if n is not None and n in diaza_dsc:
            hints.append(
                {
                    "type": "warning",
                    "confidence": "LOW",
                    "note": f"DSC_{n} also in Diaza pack — do not auto-merge",
                }
            )

        thumb_file = f"{safe_name(name)}.jpg"
        items.append(
            {
                "file_id": f["file_id"],
                "name": name,
                "parent_folder_path": pp,
                "extension": f.get("extension"),
                "dsc": n,
                "kind": kind,
                "default_pack_subfolder": SUBFOLDER_BY_KIND.get(kind, "03_FRAMES"),
                "thumb_file": thumb_file,
                "thumbnail_hint": f.get("thumbnail_hint"),
                "url": f.get("url"),
                "hints": hints,
                "suggested_pack": (
                    "10_wako.kungo_Wako_Kungo"
                    if kind == "edit_still" and n in WAKO_STILL_DSC
                    else ""
                ),
                "action": "review_only_no_move",
            }
        )

    pack_meta = []
    for a in ai.get("botanica_artist_pack") or []:
        folder = a.get("name")
        pack_meta.append(
            {
                "folder": folder,
                "path": a.get("path"),
                "folder_id": a.get("folder_id"),
                "artists_folder": PACK_TO_ARTISTS.get(folder or ""),
                "refs": pack_refs.get(folder or [], []),
            }
        )

    return {
        "created_at": utc_now(),
        "batch": "unassigned_review",
        "source": "Botanica/_UNASSIGNED_REVIEW",
        "count": len(items),
        "by_kind": dict(Counter(i["kind"] for i in items)),
        "policy": [
            "NO automatic Drive moves until approvals JSON + --execute",
            "Leftovers from organize_artists_face (not Diaza primary)",
            "Default dest: BotanicaArtistPack/<artist>/<01|02|03_*>",
            "Wako stills may use Artists/Wako Kungo/Botanica after confirm",
            "Thumbnails / 00_REF only — never full masters here",
        ],
        "review_against_artists": review_artists,
        "pack_to_artists": PACK_TO_ARTISTS,
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
        "## Next",
        "1. `pipeline\\REVIEW_UNASSIGNED_GALLERY.cmd` — fetch 00_REF thumbs + open gallery",
        "2. Assign artists in the HTML gallery → download `unassigned_approvals.json`",
        "3. Save as `pipeline\\data\\unassigned_approvals.json`",
        "4. `pipeline\\EXECUTE_UNASSIGNED_APPROVALS.cmd` (dry-run then execute)",
        "",
    ]
    for i in pack["items"]:
        lines.append(f"- `{i['parent_folder_path']}/{i['name']}` — {i['kind']}")
    (REPORTS / "unassigned_review_pack.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def fetch_thumbs(pack: dict[str, Any], limit: int) -> int:
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    service = get_service()
    n = 0
    items = pack["items"][: limit or None]
    for item in items:
        out = THUMB_DIR / item["thumb_file"]
        try:
            ok = download_thumb(service, item["file_id"], item.get("thumbnail_hint"), out)
            print(("saved" if ok else "no thumb"), item["name"])
            if ok:
                n += 1
        except Exception as e:
            print(f"ERROR {item['name']}: {e}")
    (THUMB_DIR / "manifest.json").write_text(
        json.dumps({"created_at": utc_now(), "saved": n, "note": "thumbs only"}, indent=2),
        encoding="utf-8",
    )
    return n


def fetch_refs(pack: dict[str, Any]) -> int:
    REF_DIR.mkdir(parents=True, exist_ok=True)
    service = get_service()
    n = 0
    for artist in pack.get("artist_pack") or []:
        folder = artist.get("folder") or "unknown"
        for ref in artist.get("refs") or []:
            out = REF_DIR / folder / f"{safe_name(ref['name'])}.jpg"
            try:
                ok = download_thumb(service, ref["file_id"], ref.get("thumbnail_hint"), out)
                print(("ref" if ok else "no ref"), folder, ref["name"])
                if ok:
                    n += 1
                    ref["thumb_file"] = f"{folder}/{safe_name(ref['name'])}.jpg"
            except Exception as e:
                print(f"ERROR ref {folder}/{ref['name']}: {e}")
    (REF_DIR / "manifest.json").write_text(
        json.dumps({"created_at": utc_now(), "saved": n}, indent=2), encoding="utf-8"
    )
    # refresh pack with thumb_file paths
    (DATA / "unassigned_review_pack.json").write_text(
        json.dumps(pack, indent=2), encoding="utf-8"
    )
    return n


def write_gallery(pack: dict[str, Any]) -> Path:
    WORK.mkdir(parents=True, exist_ok=True)
    # embed pack JSON; relative image paths from work/
    artists = []
    for a in pack.get("artist_pack") or []:
        folder = a.get("folder") or ""
        refs = []
        for r in a.get("refs") or []:
            tf = r.get("thumb_file") or f"{folder}/{safe_name(r['name'])}.jpg"
            refs.append({"name": r["name"], "src": f"artist_ref_thumbs/{tf}"})
        artists.append(
            {
                "folder": folder,
                "label": folder.split("_", 1)[-1].replace("_", " ") if folder else folder,
                "artists_folder": a.get("artists_folder") or "",
                "refs": refs,
            }
        )

    items = []
    for i in pack["items"]:
        items.append(
            {
                "file_id": i["file_id"],
                "name": i["name"],
                "kind": i["kind"],
                "dsc": i["dsc"],
                "path": i["parent_folder_path"],
                "subfolder": i["default_pack_subfolder"],
                "suggested": i.get("suggested_pack") or "",
                "src": f"unassigned_thumbs/{i['thumb_file']}",
            }
        )

    payload = {
        "created_at": pack["created_at"],
        "artists": artists,
        "items": items,
        "pack_to_artists": pack.get("pack_to_artists") or {},
    }
    payload_json = json.dumps(payload).replace("</", "<\\/")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>UNASSIGNED Review — Circle D Flow</title>
<style>
:root {{
  --bg: #12100e; --ink: #f3ebe0; --muted: #a89884; --line: #3a322a;
  --gold: #c9a227; --panel: #1c1814; --ok: #6f9f6a; --skip: #7a6a5a;
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0; font-family: "Segoe UI", "Trebuchet MS", sans-serif;
  background: radial-gradient(1200px 600px at 10% -10%, #2a2218, var(--bg));
  color: var(--ink);
}}
header {{
  position: sticky; top: 0; z-index: 5;
  display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
  justify-content: space-between;
  padding: 14px 18px; background: rgba(18,16,14,.92);
  border-bottom: 1px solid var(--line); backdrop-filter: blur(8px);
}}
h1 {{ font-size: 1.1rem; margin: 0; letter-spacing: .04em; color: var(--gold); }}
.meta {{ color: var(--muted); font-size: .85rem; }}
.actions button {{
  background: var(--gold); color: #1a140c; border: 0; border-radius: 4px;
  padding: 8px 14px; font-weight: 700; cursor: pointer;
}}
.actions button.secondary {{ background: transparent; color: var(--ink); border: 1px solid var(--line); }}
.refs {{
  display: flex; gap: 10px; overflow-x: auto; padding: 12px 18px;
  border-bottom: 1px solid var(--line); background: var(--panel);
}}
.ref {{
  flex: 0 0 auto; width: 110px; text-align: center; font-size: .7rem; color: var(--muted);
}}
.ref img {{
  width: 110px; height: 110px; object-fit: cover; border: 1px solid var(--line);
  background: #000; display: block; margin-bottom: 4px;
}}
main {{ padding: 16px 18px 80px; display: grid; gap: 14px; }}
.card {{
  display: grid; grid-template-columns: 220px 1fr; gap: 14px;
  background: var(--panel); border: 1px solid var(--line); padding: 12px;
}}
.card img.thumb {{
  width: 220px; height: 160px; object-fit: cover; background: #000; border: 1px solid var(--line);
}}
.card h2 {{ margin: 0 0 6px; font-size: 1rem; }}
.card .path {{ color: var(--muted); font-size: .78rem; margin-bottom: 8px; word-break: break-all; }}
.choices {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.choices label {{
  border: 1px solid var(--line); padding: 5px 8px; font-size: .78rem; cursor: pointer;
  border-radius: 3px; user-select: none;
}}
.choices label:has(input:checked) {{ border-color: var(--gold); color: var(--gold); }}
.choices label.skip:has(input:checked) {{ border-color: var(--skip); color: var(--skip); }}
.choices input {{ display: none; }}
.progress {{ color: var(--muted); font-size: .85rem; }}
@media (max-width: 720px) {{
  .card {{ grid-template-columns: 1fr; }}
  .card img.thumb {{ width: 100%; height: 200px; }}
}}
</style>
</head>
<body>
<header>
  <div>
    <h1>UNASSIGNED REVIEW</h1>
    <div class="meta">Thumbnails only · no Drive moves from this page</div>
  </div>
  <div class="progress" id="progress">0 assigned</div>
  <div class="actions">
    <button class="secondary" type="button" id="btnSuggest">Apply MEDIUM Wako stills</button>
    <button type="button" id="btnExport">Download approvals JSON</button>
  </div>
</header>
<section class="refs" id="refs"></section>
<main id="main"></main>
<script>
const DATA = {payload_json};
const refsEl = document.getElementById('refs');
const main = document.getElementById('main');
const progress = document.getElementById('progress');
const state = {{}}; // file_id -> pack_folder or ""

function renderRefs() {{
  refsEl.innerHTML = '';
  for (const a of DATA.artists) {{
    if (!a.refs.length) continue;
    for (const r of a.refs) {{
      const d = document.createElement('div');
      d.className = 'ref';
      d.innerHTML = `<img src="${{r.src}}" alt="${{a.folder}}" loading="lazy"/><div>${{a.label}}</div>`;
      refsEl.appendChild(d);
    }}
  }}
}}

function countAssigned() {{
  let n = 0;
  for (const v of Object.values(state)) if (v) n++;
  progress.textContent = n + ' / ' + DATA.items.length + ' assigned (skip counts as done if chosen)';
  const done = DATA.items.filter(i => state[i.file_id] !== undefined).length;
  progress.textContent = done + ' / ' + DATA.items.length + ' reviewed · '
    + DATA.items.filter(i => state[i.file_id]).length + ' to move';
}}

function renderItems() {{
  main.innerHTML = '';
  for (const item of DATA.items) {{
    const card = document.createElement('article');
    card.className = 'card';
    const choices = [
      ...DATA.artists.map(a => ({{ value: a.folder, label: a.label }})),
      {{ value: '', label: 'SKIP / keep unassigned' }},
    ];
    const radios = choices.map(c => {{
      const id = item.file_id + '_' + (c.value || 'skip');
      const cls = c.value ? '' : 'skip';
      return `<label class="${{cls}}"><input type="radio" name="${{item.file_id}}" value="${{c.value}}" id="${{id}}"/> ${{c.label}}</label>`;
    }}).join('');
    card.innerHTML = `
      <img class="thumb" src="${{item.src}}" alt="${{item.name}}" loading="lazy"/>
      <div>
        <h2>${{item.name}}</h2>
        <div class="path">${{item.path}} · ${{item.kind}}${{item.suggested ? ' · suggested: ' + item.suggested : ''}}</div>
        <div class="choices">${{radios}}</div>
      </div>`;
    main.appendChild(card);
    card.querySelectorAll('input[type=radio]').forEach(inp => {{
      inp.addEventListener('change', () => {{
        state[item.file_id] = inp.value;
        countAssigned();
      }});
      if (item.suggested && inp.value === item.suggested) {{
        // preselect suggestion visually but require confirm via Apply button or manual click
      }}
    }});
  }}
  countAssigned();
}}

document.getElementById('btnSuggest').onclick = () => {{
  for (const item of DATA.items) {{
    if (!item.suggested) continue;
    state[item.file_id] = item.suggested;
    const inp = document.querySelector(`input[name="${{item.file_id}}"][value="${{item.suggested}}"]`);
    if (inp) inp.checked = true;
  }}
  countAssigned();
}};

document.getElementById('btnExport').onclick = () => {{
  const assignments = [];
  for (const item of DATA.items) {{
    if (!(item.file_id in state)) continue;
    const pack = state[item.file_id];
    if (!pack) {{
      assignments.push({{
        file_id: item.file_id,
        name: item.name,
        action: 'skip',
        pack_folder: null,
      }});
      continue;
    }}
    assignments.push({{
      file_id: item.file_id,
      name: item.name,
      action: 'move',
      pack_folder: pack,
      pack_subfolder: item.subfolder,
      artists_folder: DATA.pack_to_artists[pack] || null,
      // Wako portraits/stills prefer Artists/Wako Kungo/Botanica when mapped
      prefer_artists_botanica: pack === '10_wako.kungo_Wako_Kungo' && item.kind === 'edit_still',
    }});
  }}
  const out = {{
    created_at: new Date().toISOString(),
    source: 'unassigned_review_gallery',
    policy: 'Human-approved assignments only',
    assignments,
  }};
  const blob = new Blob([JSON.stringify(out, null, 2)], {{type: 'application/json'}});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'unassigned_approvals.json';
  a.click();
  URL.revokeObjectURL(a.href);
}};

renderRefs();
renderItems();
</script>
</body>
</html>
"""
    GALLERY.write_text(html, encoding="utf-8")
    return GALLERY


def main() -> int:
    ap = argparse.ArgumentParser(description="Build UNASSIGNED review pack (no moves)")
    ap.add_argument("--fetch-thumbs", action="store_true")
    ap.add_argument("--fetch-refs", action="store_true", help="Fetch BotanicaArtistPack 00_REF thumbs")
    ap.add_argument("--gallery", action="store_true", help="Write local HTML review gallery")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    inv = load_inv()
    ai = load_artist_index()
    pack = build_pack(inv, ai)
    write_report(pack)
    print(f"UNASSIGNED items: {pack['count']}")
    print(f"By kind: {pack['by_kind']}")
    print("Wrote pipeline/data/unassigned_review_pack.json")
    print("Action: review_only_no_move")

    if args.fetch_thumbs:
        saved = fetch_thumbs(pack, args.limit)
        print(f"Thumbnails saved: {saved} → {THUMB_DIR}")
    if args.fetch_refs:
        saved = fetch_refs(pack)
        print(f"REF thumbs saved: {saved} → {REF_DIR}")
    if args.gallery or args.fetch_refs or args.fetch_thumbs:
        # rebuild gallery after ref paths updated
        if (DATA / "unassigned_review_pack.json").exists():
            pack = json.loads((DATA / "unassigned_review_pack.json").read_text(encoding="utf-8"))
        path = write_gallery(pack)
        print(f"Gallery: {path}")
        print("Open in browser, assign artists, download unassigned_approvals.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
