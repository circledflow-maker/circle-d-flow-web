#!/usr/bin/env python3
"""Re-analyse Lapa71 artist folders and move mis-sorted Stages cuts."""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from collections import Counter
from pathlib import Path

# Reuse pipeline face-ID + ffmpeg helpers
sys.path.insert(0, str(Path(__file__).resolve().parent))
import lapa71_tagus_pipeline as pipe  # noqa: E402

OUT = pipe.OUT
ARTISTS = pipe.ARTISTS
PROXIES = pipe.PROXIES
LOGS = pipe.LOGS

NAME_HINTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"manu", re.I), "Manu"),
    (re.compile(r"elisa", re.I), "Elisa"),
    (re.compile(r"ana", re.I), "Ana"),
    (re.compile(r"arpan", re.I), "Arpanito"),
    (re.compile(r"isaac|mr\.?isaac", re.I), "Mistah_Isaac"),
    (re.compile(r"maryna|vadini", re.I), "Maryna_Vadini"),
    (re.compile(r"humble", re.I), "Humble"),
    (re.compile(r"wakokungo|jam|broll|event", re.I), "Event_Broll"),
    (re.compile(r"leonnardo|melo", re.I), "Leonnardo_Melo"),
]


def stem_from_filename(name: str) -> str | None:
    m = re.match(r"(DSC_\d+)", name, re.I)
    return m.group(1).upper() if m else None


def hint_from_filename(name: str) -> str | None:
    for pat, artist in NAME_HINTS:
        if pat.search(name):
            return artist
    return None


def proxy_for_stem(stem: str) -> Path | None:
    p = PROXIES / f"{stem}_proxy_1080p.mp4"
    if pipe.probe_ok(p):
        return p
    for folder in ARTISTS.iterdir():
        if not folder.is_dir():
            continue
        fp = folder / f"{stem}_full_proxy.mp4"
        if pipe.probe_ok(fp):
            return fp
    return None


def vote_artist(video: Path, samples: int = 5) -> str:
    try:
        dur = pipe.probe_duration(video)
    except Exception:
        dur = 30.0
    if dur < 3:
        samples = 3
    times = [dur * (i + 1) / (samples + 1) for i in range(samples)]
    votes: Counter[str] = Counter()
    tmp = LOGS / "resort_frames"
    tmp.mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(times):
        frame = tmp / f"{video.stem}_r{i}.jpg"
        try:
            pipe.run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", f"{t:.2f}", "-i", str(video),
                "-frames:v", "1", "-q:v", "3", "-vf", "scale=960:-2", str(frame),
            ])
        except Exception:
            continue
        if frame.exists():
            votes[pipe.best_label(pipe.identify_frame(frame))] += 1
    if not votes:
        return "Event_Broll"
    artist, count = votes.most_common(1)[0]
    if artist == "Unknown" or count < 2:
        return "Event_Broll"
    return artist


def target_name(path: Path, artist: str) -> str:
    stem = stem_from_filename(path.name) or path.stem.split("_set")[0]
    m = re.search(r"_set(\d+)", path.name, re.I)
    idx = m.group(1) if m else "01"
    if path.name.endswith("_full_proxy.mp4"):
        return f"{stem}_full_proxy.mp4"
    return f"{stem}_set{idx}_{artist}_Stages_1080p.mp4"


def decide_artist(path: Path, folder_artist: str) -> str:
    hint = hint_from_filename(path.name)
    if hint and hint != folder_artist:
        return hint
    # Only deep-analyse clips still labelled as folder artist
    if folder_artist not in path.name and hint is None:
        return folder_artist
    stem = stem_from_filename(path.name)
    if stem:
        proxy = proxy_for_stem(stem)
        if proxy and pipe.probe_ok(proxy):
            voted = pipe.classify_short_clip(proxy, proxy, stem)
            if voted != folder_artist:
                return voted
    if "_full_proxy" in path.name:
        return vote_artist(path, samples=3)
    return folder_artist


def resort_folder(folder_name: str, apply: bool) -> list[tuple[str, str, str]]:
    src_dir = ARTISTS / folder_name
    if not src_dir.is_dir():
        raise SystemExit(f"missing folder {src_dir}")
    pipe.build_face_db()
    moves: list[tuple[str, str, str]] = []
    for vid in sorted(src_dir.glob("*.mp4")):
        if "Portraits" in vid.parts:
            continue
        artist = decide_artist(vid, folder_name)
        if artist == folder_name:
            continue
        dest_dir = ARTISTS / artist
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / target_name(vid, artist)
        moves.append((str(vid), str(dest), artist))
        pipe.log(f"resort {vid.name} -> {artist}/ ({'apply' if apply else 'dry-run'})")
        if apply:
            if dest.exists():
                dest.unlink(missing_ok=True)
            shutil.move(str(vid), str(dest))
    return moves


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder", default="Leonnardo_Melo")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    pipe.log(f"=== resort {args.folder} apply={args.apply} ===")
    moves = resort_folder(args.folder, args.apply)
    pipe.log(f"resort done moves={len(moves)}")
    for src, dst, artist in moves:
        print(f"  {Path(src).name} -> {artist}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
