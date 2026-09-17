#!/usr/bin/env python3
"""Catalog Full_Takes + DSC→artist map for editorial assemble."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from contract import ARTISTS, LIGHTING_EARLY_MAX, LIGHTING_NIGHT_MIN, PROXIES, START_DSC, STUDIO


def dsc_num(name: str) -> int:
    m = re.search(r"DSC_(\d+)", name, re.I)
    return int(m.group(1)) if m else 10**9


def lighting_era(dsc: int) -> str:
    if dsc <= LIGHTING_EARLY_MAX:
        return "early"
    if dsc >= LIGHTING_NIGHT_MIN:
        return "night"
    return "mid"


def camera_of(name: str) -> str:
    u = name.upper()
    if "D850" in u:
        return "D850"
    if u.startswith("GUEST_PHONE") or any(k in u for k in ("IPHONE", "PHONE", "VID-")):
        return "PHONE"
    if u.startswith("GUEST_CHRIS") or u.startswith("GUEST_RENE"):
        return "GUEST"
    if u.startswith("GUEST_"):
        return "GUEST"
    return "Z50II"


def era_from_name(name: str, dsc: int | None = None) -> str:
    """Infer lighting era from phone/camera timestamp in filename, else DSC."""
    m = re.search(r"(20\d{6})_(\d{6})", name)
    if m:
        hour = int(m.group(2)[:2])
        return "night" if hour >= 19 or hour < 5 else "early"
    # Chris A001_0829HHMM pattern
    m2 = re.search(r"A001_(\d{2})(\d{2})(\d{2})(\d{2})_", name)
    if m2:
        hour = int(m2.group(3))
        return "night" if hour >= 19 or hour < 5 else "early"
    if dsc is not None and dsc < 10**9:
        return lighting_era(dsc)
    return "night"  # guest jam material defaults night for Lapa71 evening


def probe_dur(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out or 0)


def artist_map() -> dict[int, list[str]]:
    """DSC → artist names from Stages filenames (library Lapa71 + legacy)."""
    out: dict[int, list[str]] = {}
    roots = []
    lib = STUDIO / "_Artists_Library"
    if lib.exists():
        for a in lib.iterdir():
            if a.is_dir():
                roots.append(a / "Lapa71" / "Stages")
    if ARTISTS.exists():
        for a in ARTISTS.iterdir():
            if a.is_dir():
                roots.append(a / "Stages")
    for stages in roots:
        if not stages.exists():
            continue
        artist = stages.parent.parent.name if stages.parent.name == "Lapa71" else stages.parent.name
        for p in stages.glob("*.mp4"):
            d = dsc_num(p.name)
            if d >= 10**9:
                continue
            out.setdefault(d, [])
            if artist not in out[d]:
                out[d].append(artist)
    return out


def primary_artist(dsc: int, amap: dict[int, list[str]]) -> str:
    names = amap.get(dsc) or []
    for n in names:
        if n not in ("Event_Broll",):
            return n
    return names[0] if names else "Unknown"


def list_proxies(from_dsc: int = START_DSC) -> list[dict]:
    amap = artist_map()
    rows = []
    patterns = ["DSC_*.mp4", "GUEST_*.mp4", "GUEST_*.mov", "GUEST_*.MOV"]
    files: list[Path] = []
    for pat in patterns:
        files.extend(PROXIES.glob(pat))
    # de-dupe
    seen = set()
    uniq = []
    for p in files:
        if p.name in seen:
            continue
        seen.add(p.name)
        uniq.append(p)

    for p in sorted(uniq, key=lambda x: (0 if x.name.startswith("DSC_") else 1, dsc_num(x.name), x.name)):
        d = dsc_num(p.name)
        if p.name.startswith("DSC_") and d < from_dsc:
            continue
        if p.stat().st_size < 80_000:
            continue
        try:
            dur = probe_dur(p)
        except Exception:
            continue
        if dur < 2.0:
            continue
        cam = camera_of(p.name)
        era = era_from_name(p.name, d if d < 10**9 else None)
        rows.append({
            "path": p,
            "dsc": d if d < 10**9 else 0,
            "camera": cam,
            "duration": dur,
            "artist": primary_artist(d, amap) if d < 10**9 else "Guest_Broll",
            "artists": amap.get(d, []) if d < 10**9 else ["Guest_Broll"],
            "era": era,
            "filler": any(k in p.name.lower() for k in ("filler", "break", "moodboard")),
            "guest": cam in ("PHONE", "GUEST"),
        })
    return rows
