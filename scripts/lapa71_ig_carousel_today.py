#!/usr/bin/env python3
"""
Build today's Instagram carousel (1080×1350) for Lapa71 / Kiss Your Heart mood.

Prefers real Windows D: when present; otherwise writes into the repo.
"""
from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[1]
INTRO = REPO / "Assets" / "membership" / "intro"
FALLBACK_OUT = REPO / "Assets" / "membership" / "ig_carousel_today"

SLIDES = [
    ("pip_viv_01.png", "LAPA71", "Lisbon tables · real stages", "Kiss Your Heart"),
    ("pip_viv_02.png", "SOUND", "Music without borders", "Circle D Flow"),
    ("pip_viv_03.png", "JOY", "Glad you walk with us", "Wako Kungo"),
    ("pip_viv_04.png", "CREW", "Artists · audience · city", "Build bridges"),
    ("pip_viv_05.png", "FOLLOW", "Follow · Join · Support", "@wako.kungo"),
]


def windows_d_out() -> Path | None:
    # Only treat as real if the drive root exists (Windows) or /mnt/d (WSL)
    candidates = [
        Path(r"D:\Wakungo_Content_Studio\Lapa71\05_Reels\IG_Carousel_Today"),
        Path("/mnt/d/Wakungo_Content_Studio/Lapa71/05_Reels/IG_Carousel_Today"),
    ]
    for p in candidates:
        root = p.anchor if p.anchor else p.drive
        # On Linux Path(r"D:\...") is relative and must never be used
        if os.name != "nt" and not str(p).startswith("/mnt/d"):
            continue
        if p.parent.exists() or (os.name == "nt" and Path("D:/").exists()):
            if os.name == "nt" and Path("D:/Wakungo_Content_Studio/Lapa71/05_Reels").exists():
                return p
            if str(p).startswith("/mnt/d") and Path("/mnt/d/Wakungo_Content_Studio/Lapa71/05_Reels").exists():
                return p
    return None


def font(size: int) -> ImageFont.ImageFont:
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        fp = Path(p)
        if fp.exists():
            return ImageFont.truetype(str(fp), size)
    return ImageFont.load_default()


def make_slide(src: Path, kicker: str, line: str, brand: str, out: Path) -> None:
    W, H = 1080, 1350
    canvas = Image.new("RGB", (W, H), (8, 12, 22))
    img = Image.open(src).convert("RGB")
    scale = max(W / img.width, H / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left, top = (nw - W) // 2, (nh - H) // 2
    img = img.crop((left, top, left + W, top + H))
    canvas.paste(img, (0, 0))

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(H // 2, H):
        a = int(210 * ((y - H // 2) / (H // 2)))
        draw.line([(0, y), (W, y)], fill=(5, 8, 15, a))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    d = ImageDraw.Draw(canvas)
    d.text((64, H - 340), kicker, font=font(36), fill=(61, 224, 255, 255))
    d.text((64, H - 280), line, font=font(52), fill=(240, 215, 140, 255))
    d.text((64, H - 180), brand, font=font(34), fill=(244, 239, 230, 230))
    d.text((64, H - 110), date.today().isoformat(), font=font(24), fill=(154, 163, 178, 200))
    canvas.convert("RGB").save(out, "JPEG", quality=92, optimize=True)
    print("wrote", out)


def main() -> int:
    out_dir = windows_d_out() or FALLBACK_OUT
    out_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for i, (name, kicker, line, brand) in enumerate(SLIDES, 1):
        src = INTRO / name
        if not src.exists():
            print("skip missing", src)
            continue
        make_slide(src, kicker, line, brand, out_dir / f"slide_{i:02d}_{kicker.lower()}.jpg")
        n += 1
    (out_dir / "CAPTION.txt").write_text(
        "Kiss Your Heart · Lapa71\n"
        "Follow · Join · Support\n\n"
        "Lisbon culture · Wako stages · Circle D Flow Membership\n"
        "Free Bronze card → Sanctuary & Orbit\n\n"
        "Link in bio → Membership\n"
        "@wako.kungo\n"
        "#Lapa71 #WakoKungo #CircleDFlow #KissYourHeart #Lisbon\n",
        encoding="utf-8",
    )
    print(f"DONE {n} slides → {out_dir}")
    return 0 if n else 1


if __name__ == "__main__":
    sys.exit(main())
