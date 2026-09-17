#!/usr/bin/env python3
"""Zema face-pass + Ana/Elisa duo mirror from Full_Takes proxies.

- Adds/uses Zema face_db ref
- Rescans proxies for Zema (lower MIN_SEG)
- For takes where Ana and Elisa both appear (or duo frames), mirrors Stages cuts
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
import time
from collections import Counter
from pathlib import Path

os.environ.setdefault("LAPA71_OUT", r"D:\Wakungo_Content_Studio\Lapa71")
os.environ.setdefault("TEMP", r"D:\Wakungo_Content_Studio\Lapa71\00_work\system_temp")
os.environ.setdefault("TMP", os.environ["TEMP"])
Path(os.environ["TEMP"]).mkdir(parents=True, exist_ok=True)

PIPE = Path(r"D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py")
spec = importlib.util.spec_from_file_location("lapa71_tagus_pipeline", PIPE)
P = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(P)

# Guests / percussion: keep shorter hits, but require confident matches
ZEMA_MIN_SEG = 12.0
ZEMA_MAX_DIST = 0.34  # stricter than global 0.42 — profile/cap refs false-positive easily


def zema_in_hits(hits: list[tuple[str, float]]) -> bool:
    return any(slug == "Zema" and dist <= ZEMA_MAX_DIST for slug, dist in hits)


def proxy_stem(path: Path) -> str:
    m = re.match(r"(DSC_\d+(?:_D850)?)", path.name, re.I)
    return m.group(1) if m else path.stem.replace("_proxy_1080p", "").replace("_1080p", "")


def list_proxies() -> list[Path]:
    files = [p for p in P.PROXIES.glob("*.mp4") if not p.name.startswith("_")]
    files.sort(key=lambda p: p.stat().st_size)
    return files


def sync_meta() -> None:
    reg = P.OUT / "00_event" / "artists_registry.json"
    if not reg.exists():
        return
    data = json.loads(reg.read_text(encoding="utf-8"))
    for slug, meta in (data.get("artists") or {}).items():
        if meta.get("instagram"):
            P.META[slug] = meta["instagram"]
        elif meta.get("guest"):
            if slug == "Zema":
                P.META[slug] = "Guest · Cajón"
            elif slug == "Arif":
                P.META[slug] = "Guest"
        if meta.get("display_name"):
            P.DISPLAY[slug] = meta["display_name"]


def next_set_idx(artist: str, stem: str) -> int:
    folder = P.ARTISTS / artist / "Stages"
    folder.mkdir(parents=True, exist_ok=True)
    n = 0
    for p in folder.glob(f"{stem}_set*_{artist}_Stages_1080p.mp4"):
        m = re.search(r"_set(\d+)_", p.name)
        if m:
            n = max(n, int(m.group(1)))
    return n + 1


def export_zema_segments(proxy: Path, stem: str, timeline: list, dur: float) -> int:
    """Build segments with lower MIN_SEG for Zema only."""
    old = P.MIN_SEG
    P.MIN_SEG = ZEMA_MIN_SEG
    try:
        # Keep only Zema / Unknown fill toward Zema neighbors
        zema_tl = [(t, lab if lab == "Zema" else "Unknown") for t, lab in timeline]
        if not any(lab == "Zema" for _, lab in zema_tl):
            return 0
        segs = P.timeline_to_segments(zema_tl, dur)
        segs = [s for s in segs if s["artist"] == "Zema"]
    finally:
        P.MIN_SEG = old
    n = 0
    for seg in segs:
        idx = next_set_idx("Zema", stem)
        out = P.export_cut(proxy, "Zema", seg["start"], seg["end"], stem, idx)
        if out:
            n += 1
            P.log(f"  ZEMA cut {out.name} {seg['dur']}s")
    return n


def rescan_proxy_for_zema(proxy: Path) -> int:
    stem = proxy_stem(proxy)
    try:
        dur = P.probe_duration(proxy)
    except Exception:
        return 0
    every = 10.0
    if dur >= 1800:
        every = 30.0
    elif dur >= 600:
        every = 20.0
    elif dur < 75:
        every = max(2.0, dur / 4)

    frames_dir = P.LOGS / f"face_frames_{stem}"
    # Prefer existing frames; else extract
    frames = sorted(frames_dir.glob("t*.jpg")) if frames_dir.exists() else []
    timeline: list[tuple[float, str]] = []
    if frames and dur >= 75:
        for fp in frames:
            m = re.search(r"t(\d+)", fp.name)
            t = float(m.group(1)) if m else 0.0
            hits = P.identify_frame(fp)
            lab = "Zema" if zema_in_hits(hits) else P.best_label(hits)
            timeline.append((t, lab))
            if lab == "Zema":
                P.log(f"  {stem} t={t:.0f}s -> Zema")
    else:
        # sample a few points for short / no frames
        frames = P.extract_frames(proxy, frames_dir, max(dur, every + 1), every) if dur >= 8 else []
        if not frames and dur < 75:
            sample_at = [dur * 0.2, dur * 0.5, dur * 0.8]
            votes = Counter()
            for t in sample_at:
                frame = P.LOGS / f"zema_short_{stem}_{int(t)}.jpg"
                try:
                    P.run([
                        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                        "-ss", f"{t:.2f}", "-i", str(proxy),
                        "-frames:v", "1", "-q:v", "3", "-vf", "scale=960:-2", str(frame),
                    ])
                except Exception:
                    continue
                if frame.exists() and zema_in_hits(P.identify_frame(frame)):
                    votes["Zema"] += 1
            if votes["Zema"] >= 2:
                idx = next_set_idx("Zema", stem)
                out = P.export_cut(proxy, "Zema", 0.0, dur, stem, idx)
                return 1 if out else 0
            return 0
        for t, fp in frames:
            hits = P.identify_frame(fp)
            lab = "Zema" if zema_in_hits(hits) else P.best_label(hits)
            timeline.append((t, lab))
            if lab == "Zema":
                P.log(f"  {stem} t={t:.0f}s -> Zema")

    zema_hits = sum(1 for _, lab in timeline if lab == "Zema")
    if zema_hits < 2:
        return 0
    (P.LOGS / f"timeline_zema_{stem}.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")
    return export_zema_segments(proxy, stem, timeline, dur)


def mirror_ana_elisa_from_existing() -> int:
    """Re-check Ana timelines for Elisa faces; mirror Stages into both folders."""
    n = 0
    for tl_path in sorted(P.LOGS.glob("timeline_*.json")):
        if "zema" in tl_path.name.lower():
            continue
        stem = tl_path.name.replace("timeline_", "").replace(".json", "")
        try:
            timeline = [(float(t), str(lab)) for t, lab in json.loads(tl_path.read_text(encoding="utf-8"))]
        except Exception:
            continue

        frames_dir = P.LOGS / f"face_frames_{stem}"
        # Re-identify frames: catch Elisa that lost to Ana (or vice versa)
        if frames_dir.exists():
            enriched = []
            for fp in sorted(frames_dir.glob("t*.jpg")):
                m = re.search(r"t(\d+)", fp.name)
                t = float(m.group(1)) if m else 0.0
                hits = P.identify_frame(fp)
                present = P.labels_present(hits)
                lab = P.best_label(hits)
                if "Ana" in present and "Elisa" in present:
                    # Keep primary, but ensure both count toward duo
                    enriched.append((t, lab))
                    enriched.append((t + 0.01, "Ana" if lab != "Ana" else "Elisa"))
                elif "Elisa" in present:
                    enriched.append((t, "Elisa"))
                elif "Ana" in present:
                    enriched.append((t, "Ana"))
                else:
                    enriched.append((t, lab))
            if enriched:
                timeline = enriched

        counts = Counter(lab for _, lab in timeline)
        ana_n, eli_n = counts.get("Ana", 0), counts.get("Elisa", 0)
        if not (ana_n >= 1 and eli_n >= 1):
            continue

        proxy = P.PROXIES / f"{stem}_proxy_1080p.mp4"
        if not proxy.exists():
            alts = list(P.PROXIES.glob(f"{stem}*.mp4"))
            if not alts:
                continue
            proxy = alts[0]
        try:
            dur = P.probe_duration(proxy)
        except Exception:
            continue

        segs = P.expand_duo_exports(P.timeline_to_segments(timeline, dur), timeline)
        P.log(f"duo {stem}: Ana={ana_n} Elisa={eli_n} segs={len(segs)}")
        (P.LOGS / f"timeline_{stem}.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")

        for seg in segs:
            if seg["artist"] not in ("Ana", "Elisa"):
                continue
            idx = next_set_idx(seg["artist"], stem)
            # Avoid flooding: skip if this stem already has ≥3 cuts for artist unless mirror
            existing = list((P.ARTISTS / seg["artist"] / "Stages").glob(f"{stem}_set*_*Stages_1080p.mp4"))
            if len(existing) >= 4 and not seg.get("duo_mirror"):
                continue
            if seg.get("duo_mirror") and len(existing) >= 2:
                # one mirror set is enough per stem
                continue
            out = P.export_cut(proxy, seg["artist"], seg["start"], seg["end"], stem, idx)
            if out:
                n += 1
    return n


def main() -> int:
    sync_meta()
    P.ensure_dirs()
    P._deepface()
    face_ready = [d.name for d in P.FACE_DB.iterdir() if d.is_dir() and list(d.glob("*.jpg"))]
    P.log(f"face_db: {face_ready}")
    if "Zema" not in face_ready:
        P.log("ABORT: Zema face_db missing")
        return 2

    # Clear DeepFace cache so Zema is included
    for pkl in P.FACE_DB.rglob("*.pkl"):
        pkl.unlink(missing_ok=True)

    P.log("=== Zema scan Full_Takes ===")
    zema_cuts = 0
    proxies = list_proxies()
    for i, proxy in enumerate(proxies, 1):
        P.log(f"[Zema {i}/{len(proxies)}] {proxy.name}")
        try:
            zema_cuts += rescan_proxy_for_zema(proxy)
        except Exception as e:
            P.log(f"  FAIL {proxy.name}: {e}")

    P.log("=== Ana+Elisa duo mirror ===")
    duo_cuts = mirror_ana_elisa_from_existing()

    # Refresh registry / index
    subprocess.run([sys.executable, str(Path(r"D:\circle-d-flow-web\scripts\lapa71_attach_artist_handles.py"))], check=False)

    summary = {
        "zema_cuts": zema_cuts,
        "duo_cuts": duo_cuts,
        "counts": {
            d.name: len(list((d / "Stages").glob("*.mp4"))) if (d / "Stages").exists() else 0
            for d in sorted(P.ARTISTS.iterdir())
            if d.is_dir()
        },
        "finished": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    (P.LOGS / "zema_duo_pass.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    P.log(f"DONE {summary}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
