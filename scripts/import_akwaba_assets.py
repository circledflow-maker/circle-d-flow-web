#!/usr/bin/env python3
"""Import + compress AkwabaLX media from D: into web Assets."""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(r"D:\cdf27jue\cdfevent\Akwabafood")
DST = ROOT / "Assets" / "kitchens" / "akwabalx"
META = DST / "import_meta.json"

DST.mkdir(parents=True, exist_ok=True)

# slug -> source filename (case-insensitive match in SRC)
DISH_MAP = [
    ("kitkat-special", "KitKat.JPG", "KitKat Special", "Chef signature — sweet heat fusion plate", 14.0, "main"),
    ("wings-plantain", "Chicken Wings Plaintan kkombo.JPG", "Chicken Wings & Plantain", "Crispy wings with sweet plantain combo", 13.0, "main"),
    ("table-combo", "Banner Dish at the table.jpg", "Akwaba Table Combo", "Rice, stew & sides — best at the garden table", 16.0, "combo"),
    ("veggie-burger", "Veggi Burger.mp4", "Veggie Burger", "Garden patty with fresh greens — ask at bar", 12.0, "vegan"),
]

GALLERY = [
    (SRC / "_ReadyToShare" / "01_photo.jpg", "hero-1.jpg"),
    (SRC / "_ReadyToShare" / "02_photo.jpg", "hero-2.jpg"),
    (SRC / "_ReadyToShare" / "03_photo.jpg", "hero-3.jpg"),
    (SRC / "_ReadyToShare" / "04_photo.jpg", "hero-4.jpg"),
    (SRC / "_ReadyToShare" / "05_photo.jpg", "hero-5.jpg"),
    (SRC / "_ReadyToShare" / "06_photo.jpg", "hero-6.jpg"),
]


def find_src(name: str) -> Path | None:
    low = name.lower()
    for p in SRC.iterdir():
        if p.name.lower() == low:
            return p
    return None


def compress_image(src: Path, dst: Path, max_w: int = 1400, quality: int = 82) -> bool:
    try:
        from PIL import Image
        img = Image.open(src)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        w, h = img.size
        if w > max_w:
            img = img.resize((max_w, int(h * max_w / w)), Image.Resampling.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, "JPEG", quality=quality, optimize=True)
        print(f"  [img] {dst.name} ({dst.stat().st_size // 1024} KB)")
        return True
    except Exception as e:
        print(f"  [img fail] {src.name}: {e}")
        return False


def compress_png(src: Path, dst: Path, max_w: int = 1200) -> bool:
    try:
        from PIL import Image
        img = Image.open(src)
        w, h = img.size
        if w > max_w:
            img = img.resize((max_w, int(h * max_w / w)), Image.Resampling.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, "PNG", optimize=True)
        print(f"  [png] {dst.name} ({dst.stat().st_size // 1024} KB)")
        return True
    except Exception as e:
        print(f"  [png fail] {src.name}: {e}")
        return False


def compress_video(src: Path, dst: Path, crf: int = 23, max_h: int = 720) -> bool:
    if not src.exists():
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src),
        "-vf", f"scale=-2:{max_h}",
        "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(dst),
    ]
    try:
        subprocess.run(cmd, check=True)
        print(f"  [vid] {dst.name} ({dst.stat().st_size // 1024 // 1024} MB)")
        return True
    except Exception as e:
        print(f"  [vid fail] {src.name}: {e}")
        return False


def frame_from_video(src: Path, dst: Path) -> bool:
    if not src.exists():
        return False
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", "00:00:02", "-i", str(src),
        "-frames:v", "1",
        "-q:v", "3",
        str(dst),
    ]
    try:
        subprocess.run(cmd, check=True)
        return dst.exists()
    except Exception:
        return False


def main():
    print(f"Akwaba import: {SRC} -> {DST}")

    logo_src = find_src("Logo.png") or SRC / "Logo.png"
    menu_src = find_src("Menu Card.png") or SRC / "Menu Card.png"
    reel_src = find_src("akwabareel.mp4") or SRC / "akwabareel.mp4"

    if logo_src.exists():
        compress_png(logo_src, DST / "logo.png", max_w=512)
        compress_png(logo_src, DST / "logo-fallback.png", max_w=256)
    if menu_src.exists():
        compress_png(menu_src, DST / "menu-board.png", max_w=1600)
    if reel_src.exists():
        compress_video(reel_src, DST / "reel-hero.mp4", crf=24, max_h=720)

    for src, name in GALLERY:
        if src.exists():
            compress_image(src, DST / name)

    menu_items = []
    logo_web = "../Assets/kitchens/akwabalx/logo-fallback.png"

    for slug, fname, title, desc, price, cat in DISH_MAP:
        src = find_src(fname)
        out_name = f"dish-{slug}.jpg"
        out_path = DST / out_name
        image_web = f"../Assets/kitchens/akwabalx/{out_name}"

        ok = False
        if src and src.suffix.lower() in (".jpg", ".jpeg", ".png"):
            ok = compress_image(src, out_path)
        elif src and src.suffix.lower() in (".mp4", ".mov"):
            tmp = DST / f"_frame_{slug}.jpg"
            if frame_from_video(src, tmp):
                ok = compress_image(tmp, out_path)
                tmp.unlink(missing_ok=True)

        if not ok:
            if (DST / "logo-fallback.png").exists():
                shutil.copy2(DST / "logo-fallback.png", out_path)
                print(f"  [fallback logo] {out_name} <- no photo for {fname}")
            image_web = logo_web

        menu_items.append({
            "id": slug,
            "name": title,
            "description": desc,
            "category": cat,
            "price_eur": price,
            "image": image_web,
            "source_file": fname,
        })

    meta = {
        "source": str(SRC),
        "menu_board": "menu-board.png",
        "logo": "logo.png",
        "reel": "reel-hero.mp4",
        "menu": menu_items,
    }
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"  [meta] {META}")
    print("Done.")


if __name__ == "__main__":
    main()
