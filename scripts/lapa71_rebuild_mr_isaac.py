#!/usr/bin/env python3
"""Rebuild Mr_Isaac / Manu cuts from saved segments + face resort for gaps."""
from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
from pathlib import Path

os.environ.setdefault("LAPA71_SRC", r"F:\Part4")
os.environ.setdefault("LAPA71_OUT", r"D:\Wakungo_Content_Studio\Lapa71")
os.environ.setdefault("LAPA71_FAST", "1")

PIPE = Path(r"D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py")
spec = importlib.util.spec_from_file_location("lapa71_tagus_pipeline", PIPE)
P = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(P)

ALIAS = {"Mistah_Isaac": "Mr_Isaac"}


def proxy_for_stem(stem: str) -> Path | None:
    # stem like DSC_1493 or DSC_0941_D850
    cands = [
        P.PROXIES / f"{stem}_proxy_1080p.mp4",
        P.PROXIES / f"{stem}_D850_proxy_1080p.mp4",
    ]
    # also try without _D850 duplication
    if stem.endswith("_D850"):
        cands.append(P.PROXIES / f"{stem}_proxy_1080p.mp4")
    for c in cands:
        if P.probe_ok(c):
            return c
    # fuzzy
    hits = list(P.PROXIES.glob(f"{stem.split('_')[0]}_{stem.split('_')[1]}*_proxy_1080p.mp4")) if "_" in stem else []
    for h in hits:
        if P.probe_ok(h):
            return h
    return None


def rebuild_from_segments() -> set[str]:
    done: set[str] = set()
    for seg_path in P.LOGS.glob("segments_*.json"):
        stem = seg_path.stem.replace("segments_", "")  # DSC_1493 or DSC_0941_D850
        try:
            segs = json.loads(seg_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        # only if any Mistah/Mr_Isaac/Manu
        artists = {P.canon_slug(ALIAS.get(s.get("artist"), s.get("artist"))) for s in segs}
        if not (artists & {"Mr_Isaac", "Manu"}):
            # also rewrite if file mentions Mistah in raw
            raw = seg_path.read_text(encoding="utf-8")
            if "Mistah_Isaac" not in raw and "Manu" not in raw:
                continue
        proxy = proxy_for_stem(stem)
        if not proxy:
            P.log(f"no proxy for {stem}")
            continue
        # wipe old cuts for this stem across artists
        for folder in P.ARTISTS.iterdir():
            if folder.is_dir():
                for mp4 in folder.glob(f"{stem}_set*_Stages_1080p.mp4"):
                    mp4.unlink(missing_ok=True)
        idx = 0
        for s in segs:
            artist = P.canon_slug(ALIAS.get(s["artist"], s["artist"]))
            if artist not in P.ARTIST_SLUGS:
                artist = "Event_Broll"
            idx += 1
            out = P.export_cut(proxy, artist, float(s["start"]), float(s["end"]), stem, idx)
            if out:
                P.log(f"rebuilt {out.relative_to(P.ARTISTS)}")
                done.add(stem.lower())
        # mark face done
        flag = P.LOGS / f"face_done_{stem}.flag"
        flag.write_text(P.FACE_FLAG_VER + "\n", encoding="utf-8")
    return done


def main() -> int:
    P.ensure_dirs()
    P.migrate_mistah_to_mr_isaac()
    P.build_face_db()
    rebuilt = rebuild_from_segments()
    P.log(f"rebuilt from segments: {sorted(rebuilt)}")

    # Force check stems that still have no Mr_Isaac presence but were historically mistah short clips
    need_face = set()
    for n in (1459, 1485, 1493, 1494, 1499):
        stem = f"dsc_{n}"
        # if no Mr_Isaac/Manu file for this DSC
        found = False
        for folder in (P.ARTISTS / "Mr_Isaac", P.ARTISTS / "Manu"):
            if folder.exists() and list(folder.glob(f"DSC_{n}_*")):
                found = True
        if not found:
            need_face.add(stem)
            for flag in P.LOGS.glob(f"face_done_DSC_{n}*"):
                flag.unlink(missing_ok=True)

    if need_face:
        P.log(f"face_all fallback: {sorted(need_face)}")
        P.face_all(need_face)

    for slug in ("Mr_Isaac", "Manu"):
        d = P.ARTISTS / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / "ARTIST_INFO.txt").write_text(
            f"Artist: {P.DISPLAY.get(slug, slug)}\nIG: {P.META.get(slug, '')}\n"
            f"Event: Tagus Drop Rhythm — Lapa71\n",
            encoding="utf-8",
        )

    for d in sorted(P.ARTISTS.iterdir()):
        if d.is_dir():
            n = len(list(d.glob("*.mp4")))
            if n or d.name in ("Mr_Isaac", "Manu"):
                P.log(f"  {d.name}: {n} mp4")
    (P.LOGS / "RESORT_DONE.flag").write_text("ok\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
