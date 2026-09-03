#!/usr/bin/env python3
"""DSC_0324: face-ID artist assignment + 16:9 / 9:16 Stage exports.

Uses DeepFace (RetinaFace + Facenet) against IG profile refs in 00_artist_refs.
Silence gaps only refine cut edges; identity comes from face matches.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

import cv2
import numpy as np

# Reduce TF noise
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from deepface import DeepFace  # noqa: E402

OUT_ROOT = Path(os.environ.get("DESTINY_OUT", r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\002"))
# Face-ID may use a small proxy; final encodes always prefer the master camera file
MASTER = Path(os.environ.get("DESTINY_MASTER", r"F:\DCIM\106NZ502\DSC_0324.MOV"))
SOURCE = Path(os.environ.get("DESTINY_SRC", str(MASTER)))
REFS = OUT_ROOT / "00_artist_refs"
FACE_DB = OUT_ROOT / "00_artist_refs" / "face_db"
FRAMES = OUT_ROOT / "00_logs" / "face_frames_0324"
LOGS = OUT_ROOT / "00_logs"
STAGES = OUT_ROOT / "05_Format_Drafts" / "Circle_D_Stages"
ARTISTS_DIR = STAGES / "02_Artists"
SOCIAL_169 = STAGES / "04_Social_16x9"
SOCIAL_916 = STAGES / "05_Social_9x16"
CUTS = STAGES / "01_artist_cuts"
DRIVE = OUT_ROOT / "06_drive_ready" / "Circle_D_Stages"
DRIVE_ART = DRIVE / "Artists"
DRIVE_169 = DRIVE / "Social_16x9"
DRIVE_916 = DRIVE / "Social_9x16"
# User-facing compressed bucket (was empty in Explorer)
VC = OUT_ROOT / "04_videos_compressed"
VC_ART = VC / "Artists"
VC_169 = VC / "Social_16x9"
VC_916 = VC / "Social_9x16"
VC_FULL = VC / "Full_Takes"
VC_SHORTS = VC / "Shorts"
VC_MAST = VC / "Mastered"

MODEL = "Facenet"
DETECTOR = "retinaface"
SAMPLE_EVERY = 12.0  # seconds (face ID on long stage take; parallel seeks)
MIN_SET = 40.0
DISTANCE_MAX = 0.40  # Facenet: lower = stricter
BAND = {"Nicke_Klein", "Edoardo_Statuto", "Mistah_Isaac", "Joao_Redondo", "Arpanito"}

# filename prefix -> slug
REF_MAP = {
    "01_Nicke_Klein": "Nicke_Klein",
    "02_Edoardo_Statuto": "Edoardo_Statuto",
    "03_Mistah_Isaac": "Mistah_Isaac",
    "04_Joao_Redondo": "Joao_Redondo",
    "05_Arpanito": "Arpanito",
    "06_July_Tilie": "July_Tilie",
    "07_Basseck_Mankabu": "Basseck_Mankabu",
    "08_Chris_Inacio": "Chris_Inacio",
    "09_C-Riz": "C-Riz",
    "10_Willpower": "Willpower",
    "11_Kreativlon": "Kreativlon",  # avatar — may fail
    "12_Lobsthercraft_Sere": "Lobsthercraft_Sere",
    "13_Elisa": "Elisa",  # story may contain 2 faces; keep left/female crop as Elisa
}

META = {
    "Wako_Kungo": "@wako.kungo band",
    "Nicke_Klein": "@nickeklein",
    "Edoardo_Statuto": "@_edoardostatuto_",
    "Mistah_Isaac": "@mistah_isaac",
    "Joao_Redondo": "@joaoredondomaia",
    "Arpanito": "@arpan.k_ @arpanito",
    "July_Tilie": "@julytilie",
    "Basseck_Mankabu": "@basseck.mankabu",
    "Chris_Inacio": "@1chriscreator",
    "C-Riz": "@c_riz.official",
    "Willpower": "@bodyxwillpower",
    "Kreativlon": "@kreativlon.art",
    "Lobsthercraft_Sere": "@lobsthercraft",
    "Elisa": "@elisa.cas8",
}


def log(msg: str) -> None:
    line = msg
    print(line, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "face_assign_0324.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"cmd failed ({r.returncode}): {' '.join(cmd[:6])}...\n{r.stderr[-800:]}")


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        text=True,
    ).strip()
    return float(out)


def ensure_dirs() -> None:
    for p in [
        FACE_DB, FRAMES, ARTISTS_DIR, SOCIAL_169, SOCIAL_916, CUTS,
        DRIVE_ART, DRIVE_169, DRIVE_916, LOGS,
        VC_ART, VC_169, VC_916, VC_FULL, VC_SHORTS, VC_MAST,
    ]:
        p.mkdir(parents=True, exist_ok=True)


def slug_from_ref(name: str) -> str | None:
    for prefix, slug in REF_MAP.items():
        if name.startswith(prefix):
            return slug
    return None


def build_face_db() -> list[str]:
    """Crop faces from IG screenshots into face_db/<slug>/01.jpg"""
    ready = []
    for img in sorted(REFS.glob("*.png")):
        slug = slug_from_ref(img.name)
        if not slug:
            continue
        # Skip non-photo avatars that poison matching
        if slug == "Kreativlon":
            log(f"  skip face_db {slug} (illustrated avatar)")
            continue
        if slug == "Chris_Inacio":
            # illustrated portrait — try anyway, drop if confidence weak
            pass
        dest_dir = FACE_DB / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        existing = list(dest_dir.glob("*.jpg"))
        if existing:
            ready.append(slug)
            log(f"  face_db keep {slug} ({len(existing)} crops)")
            continue
        try:
            faces = DeepFace.extract_faces(
                img_path=str(img),
                detector_backend=DETECTOR,
                enforce_detection=True,
                align=True,
            )
        except Exception as e:
            log(f"  face_db FAIL {slug}: {e}")
            continue
        # Elisa story / multi-face: keep up to 2 largest by facial_area
        faces = sorted(
            faces,
            key=lambda f: (f.get("facial_area") or {}).get("w", 0) * (f.get("facial_area") or {}).get("h", 0),
            reverse=True,
        )
        saved = 0
        for i, face in enumerate(faces[:2]):
            conf = float(face.get("confidence") or 0)
            if conf < 0.9:
                continue
            arr = face["face"]
            if arr.dtype != np.uint8:
                arr = (np.clip(arr, 0, 1) * 255).astype(np.uint8)
            # DeepFace returns RGB float/uint
            bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
            out = dest_dir / f"{i+1:02d}.jpg"
            cv2.imwrite(str(out), bgr)
            saved += 1
            # For Elisa story: second face may be guitarist — store as C-Riz only if slug Elisa and i==1
            if slug == "Elisa" and i == 1:
                criz = FACE_DB / "C-Riz"
                criz.mkdir(parents=True, exist_ok=True)
                extra = criz / "story_extra.jpg"
                if not extra.exists():
                    cv2.imwrite(str(extra), bgr)
                    log("  also saved story face#2 into C-Riz/")
        if saved:
            ready.append(slug)
            log(f"  face_db OK {slug} crops={saved}")
        else:
            log(f"  face_db empty {slug}")
    # DeepFace.find needs representations — warm by representing one image
    return sorted(set(ready))


def _extract_one(t: float) -> tuple[float, Path] | None:
    out = FRAMES / f"t{int(t):05d}.jpg"
    if not out.exists() or out.stat().st_size < 8_000:
        try:
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", f"{t:.3f}",
                "-i", str(SOURCE),
                "-frames:v", "1", "-q:v", "3",
                "-vf", "scale=960:-2",
                str(out),
            ])
        except Exception as e:
            log(f"  frame WARN t={t:.0f}: {e}")
            return None
    if out.exists() and out.stat().st_size > 5_000:
        return (t, out)
    return None


def extract_sample_frames(duration: float) -> list[tuple[float, Path]]:
    """Parallel keyframe seeks every SAMPLE_EVERY seconds (FAT32-safe)."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    FRAMES.mkdir(parents=True, exist_ok=True)
    times = []
    t = SAMPLE_EVERY
    while t < duration - 2.0:
        times.append(t)
        t += SAMPLE_EVERY
    log(f"  parallel seek-extract {len(times)} frames every {SAMPLE_EVERY:g}s from {SOURCE.name}...")
    frames: list[tuple[float, Path]] = []
    # 3 workers — SD can saturate; more rarely helps
    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(_extract_one, tt): tt for tt in times}
        done = 0
        for fut in as_completed(futs):
            done += 1
            res = fut.result()
            if res:
                frames.append(res)
            if done % 15 == 0:
                log(f"  frames progress: {done}/{len(times)}")
    frames.sort(key=lambda x: x[0])
    log(f"  sample frames: {len(frames)}")
    return frames


def identify_frame(path: Path) -> list[tuple[str, float]]:
    """Return list of (slug, distance) matches for faces in frame."""
    try:
        dfs = DeepFace.find(
            img_path=str(path),
            db_path=str(FACE_DB),
            model_name=MODEL,
            detector_backend=DETECTOR,
            enforce_detection=False,
            silent=True,
            threshold=DISTANCE_MAX,
        )
    except Exception:
        return []
    hits: list[tuple[str, float]] = []
    if not dfs:
        return hits
    for df in dfs:
        if df is None or len(df) == 0:
            continue
        # columns: identity, distance, ...
        row = df.iloc[0]
        identity = str(row.get("identity", ""))
        dist = float(row.get("distance", 99))
        # identity path .../face_db/Slug/01.jpg
        parts = Path(identity).parts
        slug = None
        if "face_db" in parts:
            i = parts.index("face_db")
            if i + 1 < len(parts):
                slug = parts[i + 1]
        if slug and dist <= DISTANCE_MAX:
            hits.append((slug, dist))
    return hits


def label_for_hits(hits: list[tuple[str, float]]) -> str:
    if not hits:
        return "Unknown"
    # best (lowest distance) first
    hits = sorted(hits, key=lambda x: x[1])
    slugs = [h[0] for h in hits]
    uniq = []
    for s in slugs:
        if s not in uniq:
            uniq.append(s)
    band_hits = [s for s in uniq if s in BAND]
    guests = [s for s in uniq if s not in BAND]
    if guests:
        # guest featured — prefer best-distance guest
        for s, _ in hits:
            if s not in BAND:
                return s
    if len(band_hits) >= 2:
        return "Wako_Kungo"
    if band_hits:
        return band_hits[0]
    return uniq[0]


def build_timeline(frames: list[tuple[float, Path]]) -> list[tuple[float, str]]:
    timeline = []
    for i, (t, path) in enumerate(frames):
        hits = identify_frame(path)
        label = label_for_hits(hits)
        timeline.append((t, label))
        if i % 10 == 0 or label != "Unknown":
            log(f"  t={t:7.1f}s -> {label} hits={hits[:3]}")
    return timeline


def timeline_to_segments(timeline: list[tuple[float, str]], duration: float) -> list[dict]:
    if not timeline:
        return [{"artist": "Wako_Kungo", "start": 0.0, "end": duration, "source": "fallback"}]

    # Fill unknowns by forward/back fill
    labels = [lab for _, lab in timeline]
    times = [t for t, _ in timeline]
    for i in range(len(labels)):
        if labels[i] == "Unknown":
            left = next((labels[j] for j in range(i - 1, -1, -1) if labels[j] != "Unknown"), None)
            right = next((labels[j] for j in range(i + 1, len(labels)) if labels[j] != "Unknown"), None)
            labels[i] = left or right or "Wako_Kungo"

    # Merge consecutive same labels into spans (midpoints)
    raw = []
    cur = labels[0]
    start_t = max(0.0, times[0] - SAMPLE_EVERY / 2)
    for i in range(1, len(labels)):
        if labels[i] != cur:
            end_t = (times[i - 1] + times[i]) / 2
            raw.append((cur, start_t, end_t))
            cur = labels[i]
            start_t = end_t
    raw.append((cur, start_t, duration))

    # Drop tiny segments by merging into neighbor with longer duration
    segs = []
    for artist, a, b in raw:
        if b - a < MIN_SET and segs:
            # extend previous
            pa, ps, pe = segs[-1]
            segs[-1] = (pa, ps, b)
        elif b - a < MIN_SET:
            # keep for now, merge next
            segs.append((artist, a, b))
        else:
            if segs and (segs[-1][2] - segs[-1][1]) < MIN_SET:
                # absorb tiny previous into this
                segs[-1] = (artist, segs[-1][1], b)
            else:
                segs.append((artist, a, b))

    # Merge adjacent same artist
    merged = []
    for artist, a, b in segs:
        if merged and merged[-1][0] == artist:
            merged[-1] = (artist, merged[-1][1], b)
        else:
            merged.append((artist, a, b))

    out = []
    for artist, a, b in merged:
        if b - a < 15:
            continue
        out.append({"artist": artist, "start": round(a, 2), "end": round(b, 2), "dur": round(b - a, 2)})
    if not out:
        out = [{"artist": "Wako_Kungo", "start": 0.0, "end": duration, "dur": round(duration, 2)}]
    return out


def export_segment(artist: str, start: float, end: float, idx: int) -> None:
    dur = end - start
    folder = f"{idx:02d}_{artist}"
    art_dir = ARTISTS_DIR / folder
    drive_dir = DRIVE_ART / folder
    art_dir.mkdir(parents=True, exist_ok=True)
    drive_dir.mkdir(parents=True, exist_ok=True)
    master = MASTER if MASTER.exists() else SOURCE
    info = art_dir / "ARTIST_INFO.txt"
    info.write_text(
        f"Event: ONENESS / Destination Hostels\nArtist: {artist}\nIG: {META.get(artist, '')}\n"
        f"Segment: {start:.1f}s - {end:.1f}s ({dur:.1f}s)\nAssigned by: DeepFace face recognition\n"
        f"Master: {master}\n",
        encoding="utf-8",
    )
    base = f"performance_{artist}_from_DSC_0324_set{idx:02d}"
    out169 = art_dir / f"{base}_16x9.mp4"
    out916 = art_dir / f"{base}_9x16.mp4"
    grade = "eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03"
    fade_out = max(0.0, dur - 1.0)
    af = (
        "highpass=f=55,afftdn=nf=-22:nt=w:tn=1:om=o,"
        "acompressor=threshold=-18dB:ratio=2:attack=20:release=240:makeup=2,"
        "alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"
    )

    if not (out169.exists() and out169.stat().st_size > 500_000):
        log(f"  encode 16x9 {folder} {dur:.0f}s from {master.name}")
        vf = (
            f"scale=1920:1080:force_original_aspect_ratio=decrease,"
            f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2,{grade},"
            f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out:.3f}:d=0.9,format=yuv420p"
        )
        preset = "ultrafast" if dur >= 120 else "veryfast"
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
            "-hwaccel", "d3d11va",
            "-ss", f"{start:.3f}", "-i", str(master), "-t", f"{dur:.3f}",
            "-vf", vf, "-af", af,
            "-c:v", "libx264", "-preset", preset, "-crf", "19", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-movflags", "+faststart", str(out169),
        ])

    if out169.exists() and not (out916.exists() and out916.stat().st_size > 500_000):
        log(f"  encode 9x16 {folder}")
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
            "-hwaccel", "d3d11va",
            "-i", str(out169),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-movflags", "+faststart", str(out916),
        ])

    flat169 = f"Stages_{idx:02d}_{artist}_DSC_0324_16x9.mp4"
    flat916 = f"Stages_{idx:02d}_{artist}_DSC_0324_9x16.mp4"
    vc_art = VC_ART / folder
    for src, *dests in [
        (
            out169,
            CUTS / flat169,
            SOCIAL_169 / flat169,
            drive_dir / out169.name,
            DRIVE_169 / flat169,
            vc_art / out169.name,
            VC_169 / flat169,
        ),
        (
            out916,
            CUTS / flat916,
            SOCIAL_916 / flat916,
            drive_dir / out916.name,
            DRIVE_916 / flat916,
            vc_art / out916.name,
            VC_916 / flat916,
        ),
    ]:
        if not src.exists():
            continue
        for d in dests:
            try:
                d.parent.mkdir(parents=True, exist_ok=True)
                if d.resolve() != src.resolve():
                    import shutil
                    shutil.copy2(src, d)
            except Exception as e:
                log(f"  copy WARN {d.name}: {e}")


def main() -> int:
    ensure_dirs()
    log("=== DSC_0324 face-assign start ===")
    if not SOURCE.exists():
        log(f"ERROR missing source {SOURCE}")
        return 2
    duration = probe_duration(SOURCE)
    log(f"source={SOURCE} dur={duration:.1f}s")

    log("1) Build face DB from IG refs...")
    ready = build_face_db()
    log(f"   artists with faces: {ready}")
    if len(ready) < 3:
        log("ERROR: too few reference faces")
        return 3

    log("2) Sample frames from video...")
    frames = extract_sample_frames(duration)

    log("3) Identify faces (DeepFace)...")
    timeline = build_timeline(frames)
    (LOGS / "face_timeline_0324.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")

    log("4) Build artist segments...")
    segments = timeline_to_segments(timeline, duration)
    (LOGS / "face_segments_0324.json").write_text(json.dumps(segments, indent=2), encoding="utf-8")
    for s in segments:
        log(f"   SEG {s['artist']}: {s['start']:.0f}-{s['end']:.0f}s ({s['dur']:.0f}s)")

    log("5) Export 16:9 + 9:16...")
    # If same artist appears multiple times, still separate folders with index
    for i, seg in enumerate(segments, start=1):
        export_segment(seg["artist"], seg["start"], seg["end"], i)

    (LOGS / "DSC0324_FACE_COMPLETE.flag").write_text("ok\n", encoding="utf-8")
    (LOGS / "AGENT_LOOP_WAKE_dsc0324_face.txt").write_text(
        f"READY segments={len(segments)}\n", encoding="utf-8"
    )
    log(f"DONE segments={len(segments)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
