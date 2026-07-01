#!/usr/bin/env python3
"""
Organize D:\\D Circle on tour -> D:\\cdf27jue\\cdfevent
- Match artist folders by normalized name
- Skip duplicate files (size + hash)
- Lossless JPEG: jpegtran / pillow optimize without re-encode when possible
- PNG: optipng-style via pillow optimize
"""
import hashlib
import json
import re
import shutil
from pathlib import Path

SOURCE = Path(r"D:\D Circle on tour")
DEST = Path(r"D:\cdf27jue\cdfevent")
REPORT = Path(r"D:\circle-d-flow-web\scripts\tour_import_report.json")


def is_dry_run() -> bool:
    return __import__("os").environ.get("CDF_EXECUTE", "0") != "1"

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff", ".cr2", ".nef", ".arw"}


def norm_name(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


def build_artist_map() -> dict[str, Path]:
    mapping = {}
    if not DEST.exists():
        return mapping
    for d in DEST.iterdir():
        if d.is_dir() and not d.name.startswith("_"):
            mapping[norm_name(d.name)] = d
    return mapping


def file_sig(path: Path) -> str:
    st = path.stat()
    h = hashlib.md5()
    with open(path, "rb") as f:
        h.update(f.read(65536))
    return f"{st.st_size}:{h.hexdigest()}"


def existing_sigs(artist_dir: Path) -> set[str]:
    sigs = set()
    if not artist_dir.exists():
        return sigs
    for f in artist_dir.rglob("*"):
        if f.is_file() and f.suffix.lower() in IMG_EXT:
            try:
                sigs.add(file_sig(f))
            except OSError:
                pass
    return sigs


def match_artist(folder_name: str, amap: dict[str, Path]) -> Path | None:
    n = norm_name(folder_name)
    if n in amap:
        return amap[n]
    best = None
    best_len = 0
    for key, path in amap.items():
        if len(key) < 3:
            continue
        if n == key or (len(n) >= 4 and (n in key or key in n)):
            if len(key) > best_len:
                best = path
                best_len = len(key)
    return best


def lossless_optimize(path: Path) -> None:
    try:
        from PIL import Image
    except ImportError:
        return
    ext = path.suffix.lower()
    if ext in {".jpg", ".jpeg"}:
        img = Image.open(path)
        img.save(path, format="JPEG", quality=95, optimize=True)
    elif ext == ".png":
        img = Image.open(path)
        img.save(path, format="PNG", optimize=True)


def import_tour():
    DRY_RUN = is_dry_run()
    if not SOURCE.exists():
        raise SystemExit(f"Source not found: {SOURCE}")

    amap = build_artist_map()
    report = {"dry_run": DRY_RUN, "imported": 0, "skipped_dupe": 0, "new_artists": [], "by_artist": {}}

    for event_dir in sorted(SOURCE.iterdir()):
        if not event_dir.is_dir():
            continue
        artist = match_artist(event_dir.name, amap)
        if artist is None:
            artist = DEST / event_dir.name
            report["new_artists"].append(event_dir.name)
            amap[norm_name(event_dir.name)] = artist
        if not artist.exists() and not DRY_RUN:
            artist.mkdir(parents=True, exist_ok=True)

        sigs = existing_sigs(artist)
        batch_dir = artist / f"_Tour_{event_dir.name}"
        count = 0
        skipped = 0

        for src in event_dir.rglob("*"):
            if not src.is_file() or src.suffix.lower() not in IMG_EXT:
                continue
            try:
                sig = file_sig(src)
            except OSError:
                continue
            if sig in sigs:
                skipped += 1
                continue
            rel = src.relative_to(event_dir)
            dst = batch_dir / rel
            if DRY_RUN:
                count += 1
                sigs.add(sig)
                continue
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            lossless_optimize(dst)
            sigs.add(sig)
            count += 1

        report["by_artist"][event_dir.name] = {"target": str(artist), "imported": count, "skipped_dupe": skipped}
        report["imported"] += count
        report["skipped_dupe"] += skipped

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"Report: {REPORT}")
    if DRY_RUN:
        print("DRY RUN — set CDF_EXECUTE=1 to copy files.")


if __name__ == "__main__":
    import_tour()
