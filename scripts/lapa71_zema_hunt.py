#!/usr/bin/env python3
"""Find Full_Takes frames closest to Zema reference screenshot."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

from deepface import DeepFace

REF = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_artist_refs\09_Zema_Zema.png")
PROXIES = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes")
WORK = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\zema_hunt")
WORK.mkdir(parents=True, exist_ok=True)


def duration(path: Path) -> float:
    try:
        out = subprocess.check_output(
            [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=nw=1:nk=1", str(path),
            ],
            text=True,
        ).strip()
        return float(out or 0)
    except Exception:
        return 0.0


def grab(proxy: Path, t: float, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 2000:
        return True
    r = subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-ss", f"{t:.2f}", "-i", str(proxy),
            "-frames:v", "1", "-q:v", "3", "-vf", "scale=960:-2", str(dest),
        ]
    )
    return r.returncode == 0 and dest.exists()


def main() -> int:
    files = sorted(PROXIES.glob("*.mp4"), key=lambda p: p.stat().st_size)
    print(f"scanning {len(files)} proxies against {REF.name}", flush=True)
    hits = []
    for i, p in enumerate(files, 1):
        dur = duration(p)
        if dur < 0.5:
            continue
        times = [dur * 0.3, dur * 0.55, dur * 0.75] if dur >= 25 else [max(0.25, dur * 0.5)]
        best = None
        for t in times:
            frame = WORK / f"{p.stem}_t{int(t)}.jpg"
            if not grab(p, t, frame):
                continue
            try:
                r = DeepFace.verify(
                    img1_path=str(REF),
                    img2_path=str(frame),
                    model_name="Facenet",
                    detector_backend="opencv",
                    enforce_detection=False,
                    distance_metric="cosine",
                )
                dist = float(r.get("distance", 99))
                verified = bool(r.get("verified"))
            except Exception:
                continue
            if best is None or dist < best[0]:
                best = (dist, verified, t, frame.name)
        if best:
            row = {
                "file": p.name,
                "dist": round(best[0], 4),
                "verified": best[1],
                "t": round(best[2], 1),
                "frame": best[3],
            }
            hits.append(row)
            if best[0] <= 0.40:
                print(f"CAND {p.name} dist={best[0]:.3f} t={best[2]:.1f} ver={best[1]}", flush=True)
        if i % 15 == 0:
            print(f"... {i}/{len(files)}", flush=True)

    hits.sort(key=lambda x: x["dist"])
    (WORK / "hunt_results.json").write_text(json.dumps(hits[:50], indent=2), encoding="utf-8")
    print("TOP15", flush=True)
    for h in hits[:15]:
        print(h, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
