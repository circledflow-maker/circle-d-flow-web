#!/usr/bin/env python3
"""01 MEDIA INGEST — classify Lapa71 proxies + Stages without modifying originals."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import ARTISTS, CATALOG, OUT, PROXIES, REGISTRY  # noqa: E402


def probe(path: Path) -> dict:
    try:
        raw = subprocess.check_output(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration:stream=codec_name,width,height,r_frame_rate,codec_type",
                "-of", "json", str(path),
            ],
            text=True,
        )
        data = json.loads(raw)
    except Exception as e:
        return {"error": str(e)}
    dur = float((data.get("format") or {}).get("duration") or 0)
    vstreams = [s for s in data.get("streams") or [] if s.get("codec_type") == "video"]
    astreams = [s for s in data.get("streams") or [] if s.get("codec_type") == "audio"]
    vs = vstreams[0] if vstreams else {}
    fps = 0.0
    fr = vs.get("r_frame_rate") or "0/1"
    if "/" in fr:
        a, b = fr.split("/", 1)
        try:
            fps = float(a) / float(b) if float(b) else 0.0
        except Exception:
            fps = 0.0
    return {
        "duration": round(dur, 3),
        "fps": round(fps, 3),
        "resolution": f"{vs.get('width', '?')}x{vs.get('height', '?')}",
        "codec": vs.get("codec_name") or "",
        "audio": bool(astreams),
    }


def classify_camera(path: Path) -> str:
    n = path.name.upper()
    if "D850" in n or "ND850" in n:
        return "D850"
    if "IPHONE" in n or n.startswith("IMG_"):
        return "IPHONE"
    if "MOODBOARD" in n:
        return "OTHER"
    if n.startswith("DSC_"):
        # Lapa71 convention: unmarked DSC from Z50II batch; D850 tagged in filename
        return "Z50II"
    return "UNKNOWN"


def dsc_num(path: Path) -> int | None:
    m = re.search(r"DSC_(\d+)", path.name, re.I)
    return int(m.group(1)) if m else None


def artist_from_stages_path(path: Path) -> str | None:
    try:
        parts = path.resolve().parts
        i = parts.index("04_Artists")
        return parts[i + 1]
    except Exception:
        return None


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    assets = []

    for p in sorted(PROXIES.glob("*.mp4")):
        cam = classify_camera(p)
        meta = probe(p)
        assets.append({
            "source_file": str(p),
            "filename": p.name,
            "kind": "proxy",
            "camera": cam,
            "role": "MAINROLL" if cam == "Z50II" else "BROLL",
            "dsc": dsc_num(p),
            "artist_hint": None,
            **meta,
        })

    for p in ARTISTS.rglob("*_Stages_1080p.mp4"):
        cam = classify_camera(p)
        meta = probe(p)
        assets.append({
            "source_file": str(p),
            "filename": p.name,
            "kind": "stages_cut",
            "camera": cam,
            "role": "MAINROLL" if cam == "Z50II" else "BROLL",
            "dsc": dsc_num(p),
            "artist_hint": artist_from_stages_path(p),
            **meta,
        })

    reg = {}
    if REGISTRY.exists():
        reg = json.loads(REGISTRY.read_text(encoding="utf-8")).get("artists") or {}

    catalog = {
        "event": "Tagus Drop Rhythm — Lapa71",
        "principle": "CONNECTION OVER PERFECTION",
        "z50ii_is_mainroll": True,
        "counts": {
            "total": len(assets),
            "mainroll": sum(1 for a in assets if a.get("role") == "MAINROLL"),
            "broll": sum(1 for a in assets if a.get("role") == "BROLL"),
            "by_camera": {},
        },
        "artists_registry": reg,
        "assets": assets,
    }
    cams: dict[str, int] = {}
    for a in assets:
        cams[a["camera"]] = cams.get(a["camera"], 0) + 1
    catalog["counts"]["by_camera"] = cams

    CATALOG.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    print(f"wrote {CATALOG} ({len(assets)} assets)")
    print("cameras", cams)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
