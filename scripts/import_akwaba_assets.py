#!/usr/bin/env python3
"""Copy AkwabaLX media into web Assets and extract logo from PDF."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(r"D:\cdf27jue\cdfevent\Akwabafood")
DST = ROOT / "Assets" / "kitchens" / "akwabalx"
DST.mkdir(parents=True, exist_ok=True)

COPIES = [
    (SRC / "_ReadyToShare" / "01_photo.jpg", "hero-1.jpg"),
    (SRC / "_ReadyToShare" / "02_photo.jpg", "hero-2.jpg"),
    (SRC / "_ReadyToShare" / "03_photo.jpg", "hero-3.jpg"),
    (SRC / "_ReadyToShare" / "04_photo.jpg", "hero-4.jpg"),
    (SRC / "_ReadyToShare" / "05_photo.jpg", "hero-5.jpg"),
    (SRC / "_ReadyToShare" / "06_photo.jpg", "hero-6.jpg"),
    (SRC / "Menu dishes.png", "menu-board.png"),
    (SRC / "Dish at the table.jpg", "dish-table.jpg"),
    (SRC / "KitKat.JPG", "dish-kitkat.jpg"),
    (SRC / "hope geeddit.PNG", "logo-fallback.png"),
    (SRC / "first reel.mp4", "reel-hero.mp4"),
    (SRC / "_ReadyToShare" / "09_video.mp4", "reel-1.mp4"),
]

def extract_logo_pdf():
    pdf = SRC / "logo.pdf"
    out = DST / "logo.png"
    if not pdf.exists():
        return False
    try:
        import fitz  # pymupdf
        doc = fitz.open(pdf)
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), alpha=True)
        pix.save(out)
        doc.close()
        print(f"  [logo] {out}")
        return True
    except Exception as e:
        print(f"  [logo] PDF extract failed ({e}), using fallback")
        fb = SRC / "hope geeddit.PNG"
        if fb.exists():
            shutil.copy2(fb, out)
            return True
    return False

def main():
    print(f"Import AkwabaLX -> {DST}")
    for src, name in COPIES:
        if src.exists():
            shutil.copy2(src, DST / name)
            print(f"  [ok] {name}")
        else:
            print(f"  [skip] {src.name}")
    extract_logo_pdf()
    print("Done.")

if __name__ == "__main__":
    main()
