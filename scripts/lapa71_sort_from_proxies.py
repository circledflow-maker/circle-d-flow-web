#!/usr/bin/env python3
"""Sort + cut Lapa71 Full_Takes proxies into 04_Artists (no SD masters required).

Fixes weak IG-screenshot face refs, clears stale face flags, rebuilds Stages cuts
with clean intros (never stacked reface), and routes known overrides.
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

os.environ.setdefault("LAPA71_OUT", r"D:\Wakungo_Content_Studio\Lapa71")
os.environ.setdefault("LAPA71_FAST", "1")
os.environ.setdefault("TEMP", r"D:\Wakungo_Content_Studio\Lapa71\00_work\system_temp")
os.environ.setdefault("TMP", os.environ["TEMP"])
Path(os.environ["TEMP"]).mkdir(parents=True, exist_ok=True)

PIPE = Path(r"D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py")
spec = importlib.util.spec_from_file_location("lapa71_tagus_pipeline", PIPE)
P = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(P)

# Known clip overrides (filename / user confirmation) — applied after face assign
FORCE_ARTIST: dict[str, str] = {
    "DSC_0912": "Arif",
    "DSC_1500": "Arpanito",  # user: Arpanito Stages take (not Leonnardo)
    "DSC_1494": "Manu",  # prior confirmed Manu Allegro short take
    "DSC_0908": "Zema",  # user: screenshot source (Adidas tank / cap / glasses)
}

# Bump so old face_done_* flags are ignored
P.FACE_FLAG_VER = "3-proxy-sort+fixed-refs"


def esc(s: str) -> str:
    return P.esc_drawtext(s)


def crop_ig_avatar(png: Path, dest_jpg: Path, box: tuple[int, int, int, int]) -> bool:
    from PIL import Image

    if not png.exists():
        return False
    im = Image.open(png).convert("RGB")
    crop = im.crop(box)
    dest_jpg.parent.mkdir(parents=True, exist_ok=True)
    crop.save(dest_jpg, "JPEG", quality=95)
    return True


def frame_from_video(video: Path, t: float, out: Path) -> bool:
    out.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", f"{t:.2f}", "-i", str(video),
            "-frames:v", "1", "-q:v", "2", "-vf", "scale=960:-2",
            str(out),
        ],
        capture_output=True, text=True,
    )
    return r.returncode == 0 and out.exists() and out.stat().st_size > 2000


def extract_face_crop(src_img: Path, dest_jpg: Path) -> bool:
    from PIL import Image

    try:
        faces = P._deepface().extract_faces(
            img_path=str(src_img),
            detector_backend=P.DETECTOR,
            enforce_detection=False,
            align=True,
        )
    except Exception as e:
        P.log(f"face crop fail {src_img.name}: {e}")
        return False
    if not faces:
        return False
    faces = sorted(
        faces,
        key=lambda f: (f.get("facial_area") or {}).get("w", 0)
        * (f.get("facial_area") or {}).get("h", 0),
        reverse=True,
    )
    face = faces[0]["face"]
    import numpy as np

    arr = (face * 255).astype("uint8") if float(face.max()) <= 1.5 else face.astype("uint8")
    # skip useless ultra-wide non-faces
    h, w = arr.shape[:2]
    if w > h * 2.2:
        P.log(f"skip wide non-face {src_img.name} {w}x{h}")
        return False
    dest_jpg.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr).convert("RGB").save(dest_jpg, "JPEG", quality=95)
    return True


def rebuild_face_refs() -> list[str]:
    """Crop IG avatars + add stage faces for weak refs."""
    refs = P.REFS
    db = P.FACE_DB

    # Manual avatar boxes (x0,y0,x1,y1) from IG header screenshots
    avatar_boxes = {
        "Elisa": (refs / "03_Elisa_Elisa.png", (18, 28, 168, 178)),
        "Arpanito": (refs / "06_Arpanito_Arpanito.png", (22, 40, 185, 205)),
        "Ana": (refs / "02_Ana_Ana.png", (20, 35, 175, 190)),
        "Maryna_Vadini": (refs / "01_Maryna_Vadini_Maryna_Vadini.png", (20, 35, 175, 190)),
        "Humble": (refs / "07_Humble_Humble.png", (20, 35, 175, 190)),
    }
    for slug, (png, box) in avatar_boxes.items():
        dest_dir = db / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        tmp = P.LOGS / f"_avatar_{slug}.jpg"
        if crop_ig_avatar(png, tmp, box):
            # Prefer DeepFace aligned crop from avatar; fallback to raw crop
            ok = extract_face_crop(tmp, dest_dir / "01.jpg")
            if not ok:
                shutil.copy2(tmp, dest_dir / "01.jpg")
                P.log(f"avatar raw -> {slug}/01.jpg")
            else:
                P.log(f"avatar face -> {slug}/01.jpg")

    # Arif: stage photo already tight — align if possible
    arif_src = refs / "08_Arif_Arif.png"
    if arif_src.exists():
        ok = extract_face_crop(arif_src, db / "Arif" / "01.jpg")
        if not ok:
            from PIL import Image as _Image

            im = _Image.open(arif_src).convert("RGB")
            dest = db / "Arif" / "01.jpg"
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.save(dest, "JPEG", quality=95)
            P.log("Arif raw ref -> 01.jpg")

    # Arpanito stage face (no sunglasses) from DSC_1500 mid-performance
    proxy_1500 = P.PROXIES / "DSC_1500_proxy_1080p.mp4"
    if proxy_1500.exists():
        stage = P.LOGS / "_arpanito_stage.jpg"
        if frame_from_video(proxy_1500, 12.0, stage):
            if extract_face_crop(stage, db / "Arpanito" / "02_stage.jpg"):
                P.log("Arpanito stage face -> 02_stage.jpg")

    # Arif from named proxy
    proxy_arif = P.PROXIES / "DSC_0912_Arif_1080p.mp4"
    if not proxy_arif.exists():
        proxy_arif = P.PROXIES / "DSC_0912_proxy_1080p.mp4"
    if proxy_arif.exists():
        stage = P.LOGS / "_arif_stage.jpg"
        if frame_from_video(proxy_arif, 8.0, stage):
            if extract_face_crop(stage, db / "Arif" / "02_stage.jpg"):
                P.log("Arif stage face -> 02_stage.jpg")

    # Manu from existing Stages cut mid-frame
    manu_cuts = list((P.ARTISTS / "Manu").glob("*_Stages_1080p.mp4"))
    if manu_cuts:
        stage = P.LOGS / "_manu_stage.jpg"
        if frame_from_video(manu_cuts[0], 8.0, stage):
            if extract_face_crop(stage, db / "Manu" / "01.jpg"):
                P.log("Manu stage face -> 01.jpg")

    # Drop DeepFace representation cache so new crops are used
    for pkl in db.rglob("*.pkl"):
        pkl.unlink(missing_ok=True)
        P.log(f"cleared cache {pkl.name}")

    ready = []
    for d in sorted(db.iterdir()):
        if d.is_dir() and list(d.glob("*.jpg")):
            ready.append(d.name)
    P.log(f"face_db ready: {ready}")
    return ready


def sync_meta_from_registry() -> None:
    reg = P.OUT / "00_event" / "artists_registry.json"
    if not reg.exists():
        return
    data = json.loads(reg.read_text(encoding="utf-8"))
    for slug, meta in (data.get("artists") or {}).items():
        if meta.get("instagram"):
            P.META[slug] = meta["instagram"]
        elif meta.get("guest"):
            P.META[slug] = "Guest"
        if meta.get("display_name"):
            P.DISPLAY[slug] = meta["display_name"]


def list_proxies() -> list[Path]:
    files = []
    for p in sorted(P.PROXIES.glob("*.mp4")):
        if p.name.startswith("_"):
            continue
        files.append(p)
    # small first
    files.sort(key=lambda p: p.stat().st_size)
    return files


def proxy_stem(path: Path) -> str:
    m = re.match(r"(DSC_\d+(?:_D850)?)", path.name, re.I)
    if m:
        return m.group(1)
    # DSC_0912_Arif_1080p -> DSC_0912
    m = re.match(r"(DSC_\d+)", path.name, re.I)
    return m.group(1) if m else path.stem.replace("_proxy_1080p", "").replace("_1080p", "")


def clear_face_flags() -> int:
    n = 0
    for flag in list(P.LOGS.glob("face_done_*.flag")):
        flag.unlink(missing_ok=True)
        n += 1
    return n


def wipe_stages_cuts(only_stems: set[str] | None = None) -> int:
    n = 0
    only_u = {s.upper() for s in only_stems} if only_stems else None
    for folder in P.ARTISTS.iterdir():
        if not folder.is_dir():
            continue
        for pat in ("*_Stages_1080p.mp4", "*_full_proxy.mp4", "*.artist.json"):
            for p in list(folder.glob(pat)):
                if only_u:
                    m = re.search(r"(DSC_\d+(?:_D850)?)", p.name, re.I)
                    if not m or m.group(1).upper() not in only_u:
                        continue
                p.unlink(missing_ok=True)
                n += 1
    return n


def export_force_full(proxy: Path, artist: str, stem: str) -> Path | None:
    """Force whole clip to one artist with clean intro."""
    try:
        dur = P.probe_duration(proxy)
    except Exception:
        return None
    for old in (P.ARTISTS / artist).glob(f"{stem}_set*_{artist}_Stages_1080p.mp4"):
        old.unlink(missing_ok=True)
    # also remove misfiled copies of this stem in other artist folders
    for folder in P.ARTISTS.iterdir():
        if not folder.is_dir() or folder.name == artist:
            continue
        for old in folder.glob(f"{stem}_set*_Stages_1080p.mp4"):
            old.unlink(missing_ok=True)
            P.log(f"removed misfile {folder.name}/{old.name}")
    return P.export_cut(proxy, artist, 0.0, dur, stem, 1)


def assign_proxy(proxy: Path, face_ready: list[str]) -> None:
    stem = proxy_stem(proxy)
    master = Path(rf"F:\proxy_only\{stem}.MOV")

    force = None
    for key, artist in FORCE_ARTIST.items():
        if stem.upper() == key.upper() or stem.upper().startswith(key.upper() + "_"):
            force = artist
            break
    if force:
        P.log(f"=== FORCE {stem} -> {force} ===")
        out = export_force_full(proxy, force, stem)
        flag = P.LOGS / f"face_done_{stem}.flag"
        if out:
            flag.write_text(P.FACE_FLAG_VER + "\n", encoding="utf-8")
        return

    P.assign_video(master, proxy, face_ready)


def write_artist_infos() -> None:
    for slug in P.ARTIST_SLUGS:
        d = P.ARTISTS / slug
        d.mkdir(parents=True, exist_ok=True)
        ig = P.META.get(slug, "")
        (d / "ARTIST_INFO.txt").write_text(
            f"Artist: {P.DISPLAY.get(slug, slug)}\nIG: {ig}\n"
            f"Event: Tagus Drop Rhythm — Lapa71\n",
            encoding="utf-8",
        )


def refresh_cuts_index() -> None:
    attach = Path(r"D:\circle-d-flow-web\scripts\lapa71_attach_artist_handles.py")
    if attach.exists():
        subprocess.run([sys.executable, str(attach)], check=False)


def main() -> int:
    args = [a for a in sys.argv[1:]]
    only = {a.upper() for a in args if not a.startswith("-") and a.upper().startswith("DSC_")}
    wipe = "--keep-cuts" not in args

    P.ensure_dirs()
    sync_meta_from_registry()
    P.migrate_mistah_to_mr_isaac()

    P.log("=== rebuild face refs ===")
    face_ready = rebuild_face_refs()
    if len(face_ready) < 2:
        P.log("ABORT: face_db too small")
        return 2

    cleared = clear_face_flags()
    P.log(f"cleared {cleared} face flags")
    if wipe:
        n = wipe_stages_cuts(only or None)
        P.log(f"wiped {n} old stage cuts / sidecars")

    proxies = list_proxies()
    if only:
        proxies = [
            p
            for p in proxies
            if proxy_stem(p).upper() in only
            or any(proxy_stem(p).upper().startswith(s) for s in only)
        ]
    P.log(f"proxies to sort: {len(proxies)}")

    t0 = time.time()
    for i, proxy in enumerate(proxies, 1):
        P.log(f"[{i}/{len(proxies)}] {proxy.name}")
        try:
            assign_proxy(proxy, face_ready)
        except Exception as e:
            P.log(f"FAIL {proxy.name}: {e}")

    write_artist_infos()
    refresh_cuts_index()

    summary = {}
    for d in sorted(P.ARTISTS.iterdir()):
        if d.is_dir():
            summary[d.name] = len(list(d.glob("*_Stages_1080p.mp4")))
    (P.LOGS / "proxy_sort_summary.json").write_text(
        json.dumps({"seconds": round(time.time() - t0, 1), "counts": summary}, indent=2),
        encoding="utf-8",
    )
    P.log(f"DONE counts={summary}")
    (P.LOGS / "PROXY_SORT_DONE.flag").write_text(time.strftime("%Y-%m-%dT%H:%M:%S"), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
