"""
17 July Meetup — portrait selector + foreground emphasis
Uses OpenCV face detection; falls back to center-weighted crop.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageOps

SRC = Path(r"D:\Wakungo_Content_Studio\17 july meet up")
OUT_ROOT = Path(r"D:\Wakungo_Content_Studio\17 july meet up\_studio")
PHOTO_COMP = OUT_ROOT / "01_photos_compressed"
PORTRAITS = OUT_ROOT / "02_portraits_selected"
ANALYSIS = OUT_ROOT / "ANALYSIS.json"

MAX_PORTRAITS = 12


def ensure_dirs():
    for d in (PHOTO_COMP, PORTRAITS, OUT_ROOT):
        d.mkdir(parents=True, exist_ok=True)


def compress_photo(src: Path, dst: Path):
    """High-quality compress + mild polish (near-lossless JPEG q=92)."""
    img = Image.open(src).convert("RGB")
    img = ImageOps.exif_transpose(img)
    img = ImageEnhance.Contrast(img).enhance(1.06)
    img = ImageEnhance.Color(img).enhance(1.08)
    img = ImageEnhance.Sharpness(img).enhance(1.15)
    img.save(dst, "JPEG", quality=92, optimize=True, progressive=True)


def detect_faces(bgr: np.ndarray):
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=5, minSize=(90, 90))
    return list(faces)


def portrait_score(path: Path, faces) -> float:
    """Prefer clear single/double faces, mid-large face area, portrait-ish framing."""
    with Image.open(path) as im:
        w, h = im.size
    area = w * h
    if not faces:
        # weak center bias for standing people shots without reliable face detect
        return 0.15 * (h / max(w, 1))
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    fx, fy, fw, fh = faces[0]
    face_ratio = (fw * fh) / area
    aspect = h / max(w, 1)
    count_bonus = 1.0 if len(faces) <= 2 else 0.6
    return face_ratio * 8.0 + aspect * 0.4 + count_bonus


def emphasize_person(src: Path, dst: Path, faces):
    """Pull person forward: crop around face, soft vignette, slight background soften."""
    img = Image.open(src).convert("RGB")
    img = ImageOps.exif_transpose(img)
    w, h = img.size

    if faces:
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        xs, ys, ws, hs = zip(*[(int(x), int(y), int(fw), int(fh)) for x, y, fw, fh in faces[:2]])
        pad_x = int(max(ws) * 1.6)
        pad_y = int(max(hs) * 1.9)
        left = max(0, min(xs) - pad_x)
        top = max(0, min(ys) - pad_y)
        right = min(w, max(x + fw for x, fw in zip(xs, ws)) + pad_x)
        bottom = min(h, max(y + fh for y, fh in zip(ys, hs)) + pad_y)
        # keep pleasant aspect ~4:5
        cw, ch = right - left, bottom - top
        target = cw / max(ch, 1)
        if target > 0.85:
            extra = int((cw / 0.8 - ch) / 2)
            top = max(0, top - extra)
            bottom = min(h, bottom + extra)
        img = img.crop((left, top, right, bottom))

    # resize long edge for share (~2400)
    long_edge = max(img.size)
    if long_edge > 2400:
        scale = 2400 / long_edge
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)

    # soft background vs subject: radial clarity
    base = img.copy()
    soft = base.filter(ImageFilter.GaussianBlur(radius=4))
    mask = Image.new("L", base.size, 0)
    draw = ImageDraw.Draw(mask)
    cx, cy = base.width // 2, int(base.height * 0.42)
    rx, ry = int(base.width * 0.42), int(base.height * 0.48)
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=60))
    img = Image.composite(base, soft, mask)

    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Brightness(img).enhance(1.03)
    img = ImageEnhance.Color(img).enhance(1.1)
    img = ImageEnhance.Sharpness(img).enhance(1.25)

    # subtle vignette
    vig = Image.new("RGB", img.size, (0, 0, 0))
    vmask = Image.new("L", img.size, 0)
    vd = ImageDraw.Draw(vmask)
    m = int(min(img.size) * 0.08)
    vd.ellipse((-m, -m, img.width + m, img.height + m), fill=255)
    vmask = ImageOps.invert(vmask.filter(ImageFilter.GaussianBlur(radius=int(min(img.size) * 0.25))))
    img = Image.composite(img, Image.blend(img, vig, 0.35), vmask)

    img.save(dst, "JPEG", quality=93, optimize=True, progressive=True)


def main():
    ensure_dirs()
    jpgs = sorted({p.resolve() for p in list(SRC.glob("*.JPG")) + list(SRC.glob("*.jpg"))})
    analysis = {"photos": [], "portraits_selected": []}

    print(f"[photos] {len(jpgs)} JPG found")
    scored = []
    for i, p in enumerate(jpgs, 1):
        out = PHOTO_COMP / f"{p.stem}_compressed.jpg"
        if not out.exists() or out.stat().st_size < 50_000:
            print(f"  compress {i}/{len(jpgs)}: {p.name}")
            compress_photo(p, out)
        bgr = cv2.imread(str(p))
        faces = detect_faces(bgr) if bgr is not None else []
        score = portrait_score(p, faces)
        scored.append((score, p, faces, len(faces)))
        analysis["photos"].append({
            "file": p.name,
            "faces": int(len(faces)),
            "score": round(float(score), 4),
            "compressed": out.name,
        })

    # unique by source file, keep best score
    best = {}
    for score, p, faces, nfaces in scored:
        key = p.resolve()
        if key not in best or score > best[key][0]:
            best[key] = (score, p, faces, nfaces)
    scored = sorted(best.values(), key=lambda x: x[0], reverse=True)
    selected = [s for s in scored if s[0] >= 0.25][:MAX_PORTRAITS]
    if len(selected) < 6:
        selected = scored[:max(8, min(MAX_PORTRAITS, len(scored)))]

    # clear old portrait outputs
    for old in PORTRAITS.glob("*.jpg"):
        old.unlink(missing_ok=True)

    print(f"[portraits] selecting {len(selected)}")
    for rank, (score, p, faces, nfaces) in enumerate(selected, 1):
        out = PORTRAITS / f"{rank:02d}_{p.stem}_portrait.jpg"
        print(f"  {rank}. {p.name} score={score:.3f} faces={nfaces}")
        emphasize_person(p, out, faces)
        analysis["portraits_selected"].append({
            "rank": rank,
            "source": p.name,
            "output": out.name,
            "score": round(float(score), 4),
            "faces": int(nfaces),
        })

    ANALYSIS.write_text(json.dumps(analysis, indent=2), encoding="utf-8")
    print(f"[done] photos -> {PHOTO_COMP}")
    print(f"[done] portraits -> {PORTRAITS}")
    print(f"[done] analysis -> {ANALYSIS}")


if __name__ == "__main__":
    main()
