#!/usr/bin/env python3
"""Crop clean MUDE ]MUDE[ mark and Humble H circle from IG screenshots."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v5\assets")
QA = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v7\qa")


def knock_dark(im: Image.Image, thr: int = 40) -> Image.Image:
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if r < thr and g < thr and b < thr:
                px[x, y] = (0, 0, 0, 0)
    return im


def fix_mude() -> Path:
    """Keep authentic ]MUDE[ mark; strip cafeteria + Instagram chrome."""
    raw = Image.open(ASSETS / "mude_logo_raw.png").convert("RGBA")
    # Top of black tile only — cuts cafeteria line and IG footer
    tile = raw.crop((0, 0, raw.size[0], 78))
    knock_dark(tile, 40)
    bbox = tile.split()[-1].getbbox()
    if bbox:
        tile = tile.crop(bbox)
    side = max(tile.size) + 16
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    # soft plate for readability
    plate = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ImageDraw.Draw(plate).rounded_rectangle(
        (4, 4, side - 4, side - 4), radius=22, fill=(0, 0, 0, 185)
    )
    canvas = Image.alpha_composite(plate, canvas)
    canvas.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2), tile)
    out = ASSETS / "mude_logo_only.png"
    canvas.save(out)
    QA.mkdir(parents=True, exist_ok=True)
    canvas.save(QA / "mude_clean.png")
    print("mude", canvas.size, out)
    return out


def fix_humble() -> Path:
    hum = Image.open(ASSETS / "humble_logo_raw.png").convert("RGBA")
    hw, hh = hum.size
    left = hum.crop((0, 0, int(hw * 0.34), hh))
    knock_dark(left, 28)
    bbox = left.split()[-1].getbbox()
    if bbox:
        left = left.crop(bbox)
    cw, ch = left.size
    side = max(cw, ch)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(left, ((side - cw) // 2, (side - ch) // 2), left)
    mask = Image.new("L", (side, side), 0)
    ImageDraw.Draw(mask).ellipse((1, 1, side - 2, side - 2), fill=255)
    alpha = Image.composite(sq.split()[-1], Image.new("L", (side, side), 0), mask)
    sq.putalpha(alpha)
    out = ASSETS / "humble_logo_rgba.png"
    sq.save(out)
    sq.save(ASSETS / "humble_logo_mark.png")
    sq.save(QA / "humble_clean.png")
    print("humble", sq.size, out)
    return out


if __name__ == "__main__":
    fix_mude()
    fix_humble()
