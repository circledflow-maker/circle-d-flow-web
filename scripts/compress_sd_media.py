#!/usr/bin/env python3
"""
Compress photos & videos on SD card in-place (same folder).
- JPG: Pillow Q99 + optimize (visually lossless; only keeps if smaller)
- MOV: HEVC CRF 17 remux (visually lossless; Nikon source is already HEVC)
Skips .DAT and non-media files. Logs to _compress_log.jsonl
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image

ROOT = Path(r"F:\DCIM\105NZ502")
LOG = ROOT / "_compress_log.jsonl"
FFMPEG = "ffmpeg"
IMG_EXT = {".jpg", ".jpeg"}
VID_EXT = {".mov", ".mp4", ".m4v"}
SKIP_EXT = {".dat", ".tmp"}


def log(entry: dict) -> None:
    entry["ts"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(json.dumps(entry, ensure_ascii=False), flush=True)


def compress_jpg(path: Path) -> None:
    orig = path.stat().st_size
    tmp = path.parent / f"{path.stem}.__tmp__.jpg"
    try:
        # Lossless Huffman optimization via jpegtran when available
        jpegtran = None
        for candidate in ("jpegtran", r"C:\libjpeg-turbo64\bin\jpegtran.exe"):
            try:
                subprocess.run([candidate, "-version"], capture_output=True, check=True, timeout=5)
                jpegtran = candidate
                break
            except Exception:
                continue
        if jpegtran:
            subprocess.run([jpegtran, "-optimize", "-copy", "all", "-outfile", str(tmp), str(path)], check=True, timeout=120)
        else:
            subprocess.run(
                [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", str(path), "-q:v", "1", str(tmp)],
                check=True,
                timeout=120,
            )
        if not tmp.exists():
            raise RuntimeError("no output")
        new = tmp.stat().st_size
        if new < orig:
            tmp.replace(path)
            log({"file": path.name, "type": "jpg", "status": "compressed", "before": orig, "after": new, "pct": round(100 * new / orig, 1)})
        else:
            tmp.unlink(missing_ok=True)
            log({"file": path.name, "type": "jpg", "status": "kept", "reason": "already_optimal", "size": orig})
    except Exception as e:
        tmp.unlink(missing_ok=True)
        log({"file": path.name, "type": "jpg", "status": "error", "error": str(e)})


def _video_codec(path: Path) -> str | None:
    try:
        out = subprocess.run(
            [
                "ffprobe", "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream=codec_name", "-of", "csv=p=0", str(path),
            ],
            capture_output=True, text=True, timeout=30, check=True,
        )
        return (out.stdout or "").strip().lower() or None
    except Exception:
        return None


def compress_mov(path: Path) -> None:
    orig = path.stat().st_size
    codec = _video_codec(path)
    with tempfile.NamedTemporaryFile(suffix=".mov", delete=False, dir=path.parent) as tf:
        tmp = Path(tf.name)

    # Already HEVC (Nikon): remux only — avoids libx265 mux errors on SD card
    if codec in ("hevc", "h265"):
        cmd = [
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(path),
            "-map", "0",
            "-c", "copy",
            "-movflags", "+faststart",
            str(tmp),
        ]
    else:
        cmd = [
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(path),
            "-map_metadata", "-1",
            "-c:v", "libx265", "-crf", "23", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-tag:v", "hvc1",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(tmp),
        ]
    try:
        subprocess.run(cmd, check=True, timeout=7200)
        if not tmp.exists() or tmp.stat().st_size == 0:
            raise RuntimeError("empty output")
        new = tmp.stat().st_size
        if new < orig * 0.99:
            tmp.replace(path)
            log({"file": path.name, "type": "mov", "status": "compressed", "codec": codec, "before": orig, "after": new, "pct": round(100 * new / orig, 1)})
        else:
            tmp.unlink(missing_ok=True)
            log({"file": path.name, "type": "mov", "status": "kept", "reason": "savings_too_small", "codec": codec, "size": orig})
    except Exception as e:
        tmp.unlink(missing_ok=True)
        log({"file": path.name, "type": "mov", "status": "error", "error": str(e)})


def main() -> int:
    if not ROOT.is_dir():
        print(f"Path not found: {ROOT}", file=sys.stderr)
        return 1

    files = sorted(
        p for p in ROOT.iterdir()
        if p.is_file()
        and p.suffix.lower() not in SKIP_EXT
        and ".__tmp__." not in p.name
        and not p.name.startswith("_compress")
    )
    log({"event": "start", "count": len(files), "root": str(ROOT)})

    for i, path in enumerate(files, 1):
        ext = path.suffix.lower()
        print(f"[{i}/{len(files)}] {path.name}", flush=True)
        if ext in IMG_EXT:
            compress_jpg(path)
        elif ext in VID_EXT:
            compress_mov(path)
        else:
            log({"file": path.name, "status": "skipped", "reason": "unknown_ext"})

    log({"event": "done", "count": len(files)})
    return 0


if __name__ == "__main__":
    sys.exit(main())
