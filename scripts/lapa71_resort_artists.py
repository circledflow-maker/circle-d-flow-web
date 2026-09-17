#!/usr/bin/env python3
"""Re-sort Lapa71 Stages cuts into artist folders using face_db refs."""
from __future__ import annotations

import importlib.util
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

# Candidates: prior Mistah cuts + nearby setlist block (guitar/bass nights)
FORCE_CHECK = {
    f"dsc_{n}"
    for n in [
        1459, 1478, 1479, 1480, 1481, 1482, 1483, 1484, 1485, 1486, 1487, 1488,
        1490, 1491, 1492, 1493, 1494, 1495, 1496, 1497, 1498, 1499, 1500,
    ]
}


def main() -> int:
    P.ensure_dirs()
    P.migrate_mistah_to_mr_isaac()
    face_ready = P.build_face_db()
    P.log(f"resort face_db: {face_ready}")

    cleared = 0
    for flag in list(P.LOGS.glob("face_done_*.flag")):
        fl = flag.name.lower()
        for s in FORCE_CHECK:
            if s.replace("dsc_", "") in fl:
                flag.unlink(missing_ok=True)
                cleared += 1
                break
    P.log(f"cleared {cleared} face flags")

    for folder in P.ARTISTS.iterdir():
        if not folder.is_dir():
            continue
        for mp4 in list(folder.glob("*_Stages_1080p.mp4")) + list(folder.glob("*_full_proxy.mp4")):
            m = re.search(r"dsc_(\d+)", mp4.name.lower())
            if m and f"dsc_{m.group(1)}" in FORCE_CHECK:
                mp4.unlink(missing_ok=True)
                P.log(f"remove old {folder.name}/{mp4.name}")

    P.face_all(FORCE_CHECK)

    for slug in ("Mr_Isaac", "Manu", "Leonnardo_Melo", "Humble", "Ana"):
        d = P.ARTISTS / slug
        if d.exists():
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
