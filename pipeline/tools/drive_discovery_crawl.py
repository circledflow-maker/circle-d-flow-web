#!/usr/bin/env python3
"""
Phase 2 — Google Drive discovery (READ ONLY, metadata only).

Uses public Drive folder HTML / embeddedfolderview. Does NOT download media.
Does NOT modify Drive. Writes pipeline/data + report artifacts.
"""
from __future__ import annotations

import codecs
import json
import re
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
OUT_DATA = ROOT / "pipeline" / "data"
OUT_REPORTS = ROOT / "pipeline" / "reports"

# Known project roots (user-provided) + ecosystem Artists / Content Pipeline
SEED_ROOTS = [
    {"name": "Planning", "id": "1sul4yh-EExPOz5w16Z8-u25zCB1tjp89", "hint": "PROJECT"},
    {"name": "Lapa71", "id": "1nBInu1gGhkq1RkFWJO0VlVN4HHbf1ikZ", "hint": "PROJECT"},
    {"name": "Botanica", "id": "1itnbL-aVGQtY7BHDVCGDmsa8sQni1v8r", "hint": "PROJECT"},
    {
        "name": "Content Pipeline",
        "id": "1scqyPtXRz0teWjUBQXBXHdGywXR83cOH",
        "hint": "SYSTEM",
    },
    {
        "name": "Artists (Content Pipeline)",
        "id": "1OLOk__QJ2TWVvcgnhu9wEV4rYF6ALc7Q",
        "hint": "ARTIST",
    },
    {
        "name": "BotanicaArtistPack",
        "id": "1Ss3ypxTiJgTCW-ucsLLbjEbG653RuRbk",
        "hint": "ARTIST",
    },
]

MEDIA_EXT = {
    ".mp4",
    ".mov",
    ".m4v",
    ".mkv",
    ".avi",
    ".webm",
    ".mts",
    ".mxf",
    ".mp3",
    ".m4a",
    ".wav",
    ".aac",
    ".flac",
    ".ogg",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".tif",
    ".tiff",
    ".heic",
    ".gif",
    ".bmp",
}

FOLDER_MIME = "application/vnd.google-apps.folder"
UA = "Mozilla/5.0 (compatible; CDF-DriveDiscovery/1.0; +read-only-metadata)"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(url: str, retries: int = 3) -> str:
    last: Optional[Exception] = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(0.8 * (i + 1))
    raise RuntimeError(f"fetch failed {url}: {last}")


def ms_to_iso(ms: Any) -> Optional[str]:
    try:
        v = int(ms)
        if v > 1_000_000_000_000:  # ms
            v = v / 1000.0
        return datetime.fromtimestamp(v, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return None


def classify_folder(name: str, path: str, hint: Optional[str] = None) -> str:
    """Conservative classification — UNKNOWN when unsure."""
    blob = f"{name} {path}".lower()
    rules = [
        (r"\b(archive|archiv|old_|_old|legacy)\b", "ARCHIVE"),
        (r"\b(final|export|ready_to_post|master|drive_upload[/\\]?event)\b", "FINAL"),
        (r"\b(raw|01_raw|dcim|original|source)\b", "RAW"),
        (r"\b(agent|analysis|00_work|recap_tmp|staging)\b", "AGENT"),
        (r"\b(system|content pipeline|pipeline)\b", "SYSTEM"),
        (
            r"\b(flow talk|flowtalk|circle akademie|akademie|circle d stage|stages|podcast|flowtour)\b",
            "CONTENT",
        ),
        (r"\b(event|events|meetup|oneness|botanica|lapa71)\b", "EVENT"),
        (r"\b(artist|artists|00_ref|performance -|wisdom to share)\b", "ARTIST"),
        (r"\b(planning|project)\b", "PROJECT"),
    ]
    hits = []
    for pat, label in rules:
        if re.search(pat, blob):
            hits.append(label)
    if hint and hint not in hits:
        # seed hint only if no stronger signal
        if not hits:
            return hint
    if len(hits) == 1:
        return hits[0]
    if len(hits) > 1:
        # prefer more specific over PROJECT
        for pref in ("FINAL", "RAW", "ARCHIVE", "AGENT", "ARTIST", "EVENT", "CONTENT", "PROJECT", "SYSTEM"):
            if pref in hits:
                return pref
    return "UNKNOWN"


def parse_ivd_entries(html: str) -> list[dict[str, Any]]:
    """Parse window['_DRIVE_ivd'] entries when present."""
    m = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'((?:\\.|[^'])*)'", html)
    if not m:
        return []
    try:
        raw = codecs.decode(m.group(1), 'unicode_escape')
    except Exception:
        raw = bytes(m.group(1), "utf-8").decode("unicode_escape", errors="replace")

    # ["ID",["PARENT"],"NAME","mime", flags..., createdMs, modifiedMs, ...]
    # Also size sometimes appears later as integer
    entries = []
    for m in re.finditer(
        r'\["([a-zA-Z0-9_-]{10,})",\["([a-zA-Z0-9_-]{10,})"\],"([^"]*)","([^"]+)"([^]]*)]',
        raw,
    ):
        fid, parent, name, mime, rest = m.groups()
        name = unquote(name.encode("utf-8", "replace").decode("unicode_escape", errors="replace")) if "\\" in name else name
        # timestamps: large ints
        nums = [int(x) for x in re.findall(r"\b(\d{10,16})\b", rest)]
        created = ms_to_iso(nums[0]) if nums else None
        modified = ms_to_iso(nums[1]) if len(nums) > 1 else created
        # size heuristic: smaller ints that look like byte sizes (1KB..50GB) appear as ,123456,
        sizes = [int(x) for x in re.findall(r",(\d{3,12}),", rest) if 1000 <= int(x) <= 50_000_000_000]
        size = sizes[0] if sizes else None
        # image dimensions sometimes as ,1920,1080,
        dims = re.findall(r",(\d{3,5}),(\d{3,5}),", rest)
        width = height = None
        for w, h in dims:
            wi, hi = int(w), int(h)
            if 32 <= wi <= 10000 and 32 <= hi <= 10000:
                width, height = wi, hi
                break
        entries.append(
            {
                "id": fid,
                "parent_id": parent,
                "name": name,
                "mime_type": mime,
                "size": size,
                "created_time": created,
                "modified_time": modified,
                "width": width,
                "height": height,
                "duration": None,  # not in folder ivd reliably
            }
        )
    return entries


def list_embed(fid: str) -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    html = fetch(f"https://drive.google.com/embeddedfolderview?id={fid}#list")
    folders = [(a, b.strip()) for a, b in re.findall(r"/folders/([a-zA-Z0-9_-]+).*?>([^<]+)<", html)]
    files = [(a, b.strip()) for a, b in re.findall(r"/file/d/([a-zA-Z0-9_-]+).*?>([^<]+)<", html)]
    files += [(a, b.strip()) for a, b in re.findall(r"open\?id=([a-zA-Z0-9_-]+)[^>]*>\s*([^<]+)", html)]
    seen: set[str] = set()
    uniq_f = []
    for a, b in files:
        if a in seen:
            continue
        seen.add(a)
        uniq_f.append((a, b))
    seen_d: set[str] = set()
    uniq_d = []
    for a, b in folders:
        if a in seen_d:
            continue
        seen_d.add(a)
        uniq_d.append((a, b))
    return uniq_d, uniq_f


def ext_of(name: str) -> str:
    p = Path(name)
    return p.suffix.lower()


def is_media(name: str, mime: Optional[str]) -> bool:
    if mime and (mime.startswith("video/") or mime.startswith("audio/") or mime.startswith("image/")):
        return True
    return ext_of(name) in MEDIA_EXT


def crawl() -> dict[str, Any]:
    folders: dict[str, dict[str, Any]] = {}
    files: dict[str, dict[str, Any]] = {}
    errors: list[dict[str, Any]] = []
    queue: list[tuple[str, Optional[str], str, Optional[str], int]] = []
    # id, parent_id, path, seed_hint, depth
    for seed in SEED_ROOTS:
        queue.append((seed["id"], None, seed["name"], seed.get("hint"), 0))

    visited: set[str] = set()
    max_depth = 8
    max_folders = 2500

    while queue and len(visited) < max_folders:
        fid, parent_id, path, hint, depth = queue.pop(0)
        if fid in visited:
            # still update parent path alias if needed
            continue
        visited.add(fid)
        name = path.split("/")[-1]
        print(f"[{len(visited)}] d={depth} {path}", flush=True)

        folder_rec = {
            "folder_id": fid,
            "folder_name": name,
            "parent_id": parent_id,
            "path": path,
            "number_of_children": 0,
            "number_of_files": 0,
            "number_of_subfolders": 0,
            "last_modified": None,
            "classification": classify_folder(name, path, hint),
            "seed_hint": hint,
            "url": f"https://drive.google.com/drive/folders/{fid}",
            "discovery": "public_metadata",
        }

        try:
            html = fetch(f"https://drive.google.com/drive/folders/{fid}")
            ivd = parse_ivd_entries(html)
            # title
            tm = re.search(r"<title>([^<]+)</title>", html)
            if tm:
                title = tm.group(1).replace(" - Google Drive", "").strip()
                if title:
                    folder_rec["folder_name"] = title
                    # fix path leaf
                    parts = path.split("/")
                    parts[-1] = title
                    path = "/".join(parts)
                    folder_rec["path"] = path

            by_id = {e["id"]: e for e in ivd}
            embed_folders, embed_files = list_embed(fid)

            # Prefer union of embed + ivd
            subfolders = {}
            for sfid, sname in embed_folders:
                subfolders[sfid] = sname
            for e in ivd:
                if e["mime_type"] == FOLDER_MIME and e["parent_id"] == fid:
                    subfolders[e["id"]] = e["name"] or subfolders.get(e["id"], e["id"])

            file_ids = {}
            for ffid, fname in embed_files:
                file_ids[ffid] = fname
            for e in ivd:
                if e["mime_type"] != FOLDER_MIME and e["parent_id"] == fid:
                    file_ids[e["id"]] = e["name"] or file_ids.get(e["id"], e["id"])

            folder_rec["number_of_subfolders"] = len(subfolders)
            folder_rec["number_of_files"] = len(file_ids)
            folder_rec["number_of_children"] = len(subfolders) + len(file_ids)

            # last modified from children
            mods = [e.get("modified_time") for e in ivd if e.get("modified_time")]
            folder_rec["last_modified"] = max(mods) if mods else None

            # record files (metadata only)
            for ffid, fname in file_ids.items():
                meta = by_id.get(ffid, {})
                mime = meta.get("mime_type")
                if not mime:
                    # guess
                    ext = ext_of(fname)
                    if ext in {".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"}:
                        mime = "video/mp4" if ext == ".mp4" else f"video/{ext.lstrip('.')}"
                    elif ext in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}:
                        mime = f"image/{ext.lstrip('.').replace('jpg','jpeg')}"
                    elif ext in {".mp3", ".m4a", ".wav", ".aac", ".flac"}:
                        mime = f"audio/{ext.lstrip('.')}"
                    else:
                        mime = "application/octet-stream"
                rec = {
                    "file_id": ffid,
                    "name": fname,
                    "mime_type": mime,
                    "size": meta.get("size"),
                    "parent_folder_id": fid,
                    "parent_folder_path": path,
                    "created_time": meta.get("created_time"),
                    "modified_time": meta.get("modified_time"),
                    "extension": ext_of(fname),
                    "dimensions": (
                        {"width": meta["width"], "height": meta["height"]}
                        if meta.get("width") and meta.get("height")
                        else None
                    ),
                    "duration": meta.get("duration"),
                    "is_media": is_media(fname, mime),
                    "url": f"https://drive.google.com/file/d/{ffid}/view",
                    "thumbnail_hint": f"https://drive.google.com/thumbnail?id={ffid}&sz=w400",
                    "downloaded": False,
                }
                # keep richest record
                prev = files.get(ffid)
                if not prev or (rec.get("size") and not prev.get("size")):
                    files[ffid] = rec

            folders[fid] = folder_rec

            if depth < max_depth:
                for sfid, sname in sorted(subfolders.items(), key=lambda x: x[1].lower()):
                    if sfid not in visited:
                        queue.append((sfid, fid, f"{path}/{sname}", hint, depth + 1))

            time.sleep(0.2)
        except Exception as e:  # noqa: BLE001
            folder_rec["error"] = str(e)[:300]
            folders[fid] = folder_rec
            errors.append({"folder_id": fid, "path": path, "error": str(e)[:300]})
            print(f"  ERR {path}: {e}", flush=True)
            time.sleep(0.5)

    return {
        "folders": folders,
        "files": files,
        "errors": errors,
        "visited": len(visited),
        "max_depth": max_depth,
    }


def build_outputs(raw: dict[str, Any]) -> None:
    OUT_DATA.mkdir(parents=True, exist_ok=True)
    OUT_REPORTS.mkdir(parents=True, exist_ok=True)

    folders = list(raw["folders"].values())
    files = list(raw["files"].values())
    media = [f for f in files if f.get("is_media")]

    inventory = {
        "meta": {
            "phase": "PHASE 2 — GOOGLE DRIVE DISCOVERY",
            "created_at": utc_now(),
            "mode": "read_only_metadata",
            "downloaded_originals": False,
            "drive_modified": False,
            "seed_roots": SEED_ROOTS,
            "limits": {"max_depth": raw["max_depth"], "folders_visited": raw["visited"]},
            "errors": raw["errors"],
        },
        "totals": {
            "folders": len(folders),
            "files": len(files),
            "media": len(media),
        },
        "folders": folders,
        "files": files,
    }
    (OUT_DATA / "drive_inventory.json").write_text(json.dumps(inventory, indent=2), encoding="utf-8")

    # folder_map: path -> node
    folder_map = {
        "meta": inventory["meta"],
        "by_id": {f["folder_id"]: f for f in folders},
        "by_path": {f["path"]: f["folder_id"] for f in folders},
        "tree_roots": [s["id"] for s in SEED_ROOTS],
        "classification_counts": defaultdict(int),
    }
    for f in folders:
        folder_map["classification_counts"][f.get("classification") or "UNKNOWN"] += 1
    folder_map["classification_counts"] = dict(folder_map["classification_counts"])
    (OUT_DATA / "folder_map.json").write_text(json.dumps(folder_map, indent=2), encoding="utf-8")

    manifest = {
        "meta": {
            "created_at": utc_now(),
            "note": "Metadata only — originals not downloaded",
            "total_media": len(media),
        },
        "media": media,
        "by_extension": defaultdict(int),
        "by_parent_path": defaultdict(int),
    }
    for m in media:
        manifest["by_extension"][m.get("extension") or ""] += 1
        manifest["by_parent_path"][m.get("parent_folder_path") or ""] += 1
    manifest["by_extension"] = dict(sorted(manifest["by_extension"].items(), key=lambda x: (-x[1], x[0])))
    # keep top parent paths only in summary counts (full media list retained)
    top_parents = sorted(manifest["by_parent_path"].items(), key=lambda x: -x[1])[:80]
    manifest["by_parent_path_top"] = dict(top_parents)
    del manifest["by_parent_path"]
    (OUT_DATA / "media_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Report helpers
    def paths_with(cls: str) -> list[str]:
        return sorted(f["path"] for f in folders if f.get("classification") == cls)

    artist_folders = [f for f in folders if f.get("classification") == "ARTIST" or "/Artists/" in f.get("path", "") or f.get("path", "").startswith("Artists")]
    # Arpan presence
    arpan = [f for f in folders if "Arpan" in f.get("folder_name", "") or f.get("path", "").endswith("/Arpan") or "/Arpan/" in f.get("path", "")]

    projects = [f for f in folders if f.get("classification") == "PROJECT" or f["folder_id"] in {s["id"] for s in SEED_ROOTS[:3]}]
    agent_folders = paths_with("AGENT")
    finals = paths_with("FINAL")
    unknowns = paths_with("UNKNOWN")
    archives = paths_with("ARCHIVE")

    # duplicate name detection (same folder name under different parents)
    name_map = defaultdict(list)
    for f in folders:
        name_map[f["folder_name"].lower()].append(f["path"])
    dupes = {k: v for k, v in name_map.items() if len(v) > 1 and k not in {"events", "00_ref", "audio"}}

    # unsorted heuristic
    unsorted = [
        f["path"]
        for f in folders
        if re.search(r"unassigned|inbox|upload|todo|sort|misc|tmp|temp", f.get("path", ""), re.I)
    ]

    report = f"""# Circle D Flow — Content Pipeline
## PHASE 2 — GOOGLE DRIVE DISCOVERY REPORT

**Created:** {utc_now()}  
**Mode:** READ ONLY — metadata / lightweight listing only  
**Drive modified:** NO  
**Originals downloaded:** NO  

### Seed roots
| Name | Folder ID | Hint |
|------|-----------|------|
"""
    for s in SEED_ROOTS:
        report += f"| {s['name']} | `{s['id']}` | {s.get('hint')} |\n"

    report += f"""

### Totals
| Metric | Count |
|--------|------:|
| Folders visited | {len(folders)} |
| Files (metadata) | {len(files)} |
| Media files | {len(media)} |
| Crawl errors | {len(raw['errors'])} |

### Classification counts
"""
    for k, v in sorted(folder_map["classification_counts"].items(), key=lambda x: (-x[1], x[0])):
        report += f"- **{k}**: {v}\n"

    report += f"""

### Projects found
"""
    for f in sorted(projects, key=lambda x: x["path"])[:40]:
        report += f"- `{f['path']}` — `{f['folder_id']}` ({f.get('classification')})\n"

    report += f"""

### Artists found (sample / key)
Artists-related folders: **{len(artist_folders)}**  
Arpan-related nodes: **{len(arpan)}**

"""
    for f in sorted(arpan, key=lambda x: x["path"])[:30]:
        report += f"- `{f['path']}` — files={f.get('number_of_files')} subfolders={f.get('number_of_subfolders')}\n"

    # list top-level artists under Content Pipeline Artists
    cp_artists = [f for f in folders if f.get("parent_id") == "1OLOk__QJ2TWVvcgnhu9wEV4rYF6ALc7Q"]
    report += f"\nContent Pipeline / Artists children: **{len(cp_artists)}**\n"
    for f in sorted(cp_artists, key=lambda x: x["folder_name"].lower()):
        report += f"- {f['folder_name']} (`{f['folder_id']}`)\n"

    pack = [f for f in folders if f.get("parent_id") == "1Ss3ypxTiJgTCW-ucsLLbjEbG653RuRbk"]
    report += f"\nBotanica ARTISTS pack children: **{len(pack)}**\n"
    for f in sorted(pack, key=lambda x: x["folder_name"].lower()):
        report += f"- {f['folder_name']} (`{f['folder_id']}`)\n"

    report += f"""

### Existing agent folders
Count: **{len(agent_folders)}**
"""
    for p in agent_folders[:40]:
        report += f"- `{p}`\n"
    if len(agent_folders) > 40:
        report += f"- … +{len(agent_folders)-40} more\n"

    report += f"""

### Unsorted areas
Count: **{len(unsorted)}**
"""
    for p in unsorted[:40]:
        report += f"- `{p}`\n"

    report += f"""

### Potentially duplicated areas
Folder names appearing in multiple paths (excluding common leaves like `events`): **{len(dupes)}**
"""
    shown = 0
    for name, paths in sorted(dupes.items(), key=lambda x: -len(x[1]))[:25]:
        report += f"- **{name}** ({len(paths)}): " + "; ".join(f"`{p}`" for p in paths[:5])
        if len(paths) > 5:
            report += f" … +{len(paths)-5}"
        report += "\n"
        shown += 1

    report += f"""

### Protected / FINAL areas
Count: **{len(finals)}**
"""
    for p in finals[:40]:
        report += f"- `{p}`\n"

    report += f"""

### ARCHIVE areas
Count: **{len(archives)}**
"""
    for p in archives[:30]:
        report += f"- `{p}`\n"

    report += f"""

### UNKNOWN areas
Count: **{len(unknowns)}**
"""
    for p in unknowns[:50]:
        report += f"- `{p}`\n"
    if len(unknowns) > 50:
        report += f"- … +{len(unknowns)-50} more\n"

    report += f"""

### Media extension summary
"""
    for ext, n in list(manifest["by_extension"].items())[:30]:
        report += f"- `{ext or '(none)'}`: {n}\n"

    report += f"""

### Artifacts
- `pipeline/data/drive_inventory.json`
- `pipeline/data/folder_map.json`
- `pipeline/data/media_manifest.json`
- `pipeline/reports/drive_discovery_report.md`

### Constraints honored
- No Drive moves/renames/deletes/duplicates
- No original video downloads
- No large-file downloads
- Arpan / Artists structure discovered, not flattened

### STOP
Awaiting approval before Phase 3.
"""
    (OUT_REPORTS / "drive_discovery_report.md").write_text(report, encoding="utf-8")
    print("Wrote data + report", flush=True)


def main() -> int:
    print("Phase 2 Drive discovery — READ ONLY", flush=True)
    raw = crawl()
    build_outputs(raw)
    print(
        f"DONE folders={len(raw['folders'])} files={len(raw['files'])} media={sum(1 for f in raw['files'].values() if f.get('is_media'))}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
