#!/usr/bin/env python3
"""Lapa71 / Tagus Drop Rhythm — compress SD batch + face-ID artist folders.

Source: F:\\DCIM\\106NZ502 (flat Nikon Z50II MOVs + JPGs)
Output: D:\\Wakungo_Content_Studio\\Lapa71

Encode via NTFS temp (D: is FAT32). Face-ID uses 720p proxies; cuts from SD master.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import cv2
import numpy as np

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from deepface import DeepFace  # noqa: E402

SRC = Path(os.environ.get("LAPA71_SRC", r"F:\DCIM\106NZ502"))
OUT = Path(os.environ.get("LAPA71_OUT", r"D:\Wakungo_Content_Studio\Lapa71"))
ASSETS = Path(
    os.environ.get(
        "LAPA71_ASSETS",
        r"C:\Users\user\.cursor\projects\d-circle-d-flow-web\assets",
    )
)
TMP = Path(os.environ.get("TEMP", r"C:\Users\user\AppData\Local\Temp")) / "lapa71_proxies"

REFS = OUT / "00_artist_refs"
FACE_DB = REFS / "face_db"
LOGS = OUT / "00_logs"
PHOTOS = OUT / "02_Raw_Photos"
PROXIES = OUT / "04_videos_compressed" / "Full_Takes"
ARTISTS = OUT / "04_Artists"
EVENT_POSTER = OUT / "00_event" / "TAGUS_DROP_RYTHM_poster.png"

VF = (
    "scale=1920:1080:force_original_aspect_ratio=decrease,"
    "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
    "hqdn3d=2.0:1.5:3.2:2.6,"
    "eq=contrast=1.08:brightness=0.02:saturation=0.95:gamma=1.05,"
    "format=yuv420p"
)
AF = (
    "highpass=f=50,lowpass=f=16000,afftdn=nf=-22:nt=w:tn=1:om=o,"
    "acompressor=threshold=-18dB:ratio=1.9:attack=22:release=260:makeup=2.2:knee=8,"
    "alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"
)
FPS = "60000/1001"
CRF = "20"
PRESET = "veryfast"

MODEL = "Facenet"
DETECTOR = "retinaface"
DISTANCE_MAX = 0.42
SAMPLE_EVERY = 10.0
MIN_SEG = 25.0
LONG_CLIP_SEC = 75.0
FACE_FLAG_VER = "2-intro+photos"

REF_MAP = {
    "01_Maryna_Vadini": "Maryna_Vadini",
    "02_Ana": "Ana",
    "03_Elisa": "Elisa",
    "04_Leonnardo_Melo": "Leonnardo_Melo",
    "05_Mistah_Isaac": "Mistah_Isaac",
    "06_Arpanito": "Arpanito",
    "07_Humble": "Humble",
}

# uuid fragment in assets filename -> ref prefix
REF_ASSET_UUID = {
    "01_Maryna_Vadini": "image-55c48a4d-c6b5-444f-985c-bec4ad857931",
    "02_Ana": "image-0d3f5a95-2f2a-4609-9fb6-50f48ed2eb4f",
    "03_Elisa": "image-24742189-8259-47d0-812f-a923008130ea",
    "04_Leonnardo_Melo": "image-6fad9a93-d508-4948-8603-658b36bed23f",
    "05_Mistah_Isaac": "image-a2de2bb1-fa08-48b5-a577-e1509fc9905c",
    "06_Arpanito": "image-bf0e55f3-0e6a-430b-91e0-9077bfe67384",
    "07_Humble": "image-4e58e97f-8d14-4ff5-b19d-497c225459a9",
}
POSTER_UUID = "image-d5e88d6f-5c4c-4254-972a-7a53c8a0d508"

META = {
    "Maryna_Vadini": "@soulvoice_vadini",
    "Ana": "@memyself.ana",
    "Elisa": "@elisa.cas8",
    "Leonnardo_Melo": "@meloleonnardo",
    "Mistah_Isaac": "@mistah_isaac",
    "Arpanito": "@arpan.k_ @arpanito",
    "Humble": "@_humble_project_ — Humble. / DEEPOP",
    "Manu": "Manu — sort by face / filename",
    "Zema": "Cajón & percussion — no face ref yet; sort hands/cajón shots manually",
    "Unknown": "",
    "Event_Broll": "Lapa71 venue / crowd",
}

ARTIST_SLUGS = list(REF_MAP.values()) + ["Manu", "Zema", "Unknown", "Event_Broll"]

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
INTRO_SEC = 6.0
PHOTO_COMP = OUT / "02_Raw_Photos" / "_compressed"

DISPLAY = {
    "Maryna_Vadini": "Maryna Vadini",
    "Ana": "Ana",
    "Elisa": "Elisa Casotto",
    "Leonnardo_Melo": "Leonnardo Melo",
    "Mistah_Isaac": "Mistah Isaac",
    "Arpanito": "Arpanito",
    "Humble": "Humble.",
    "Manu": "Manu",
    "Zema": "Zema",
    "Unknown": "Artist",
    "Event_Broll": "Lapa71",
}


def esc_drawtext(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:").replace("%", "\\%")


def intro_drawtext(artist: str) -> str:
    name = esc_drawtext(DISPLAY.get(artist, artist.replace("_", " ")))
    ig = esc_drawtext(META.get(artist, "")[:48])
    t = INTRO_SEC
    return (
        f"drawtext=fontfile='{FONT_B}':text='Circle D Stages':fontsize=34:fontcolor=white@0.88:"
        f"x=72:y=h-228:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='{FONT_B}':text='Tagus Drop Rhythm':fontsize=30:fontcolor=#E8C547:"
        f"x=72:y=h-182:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='{FONT_B}':text='{name}':fontsize=50:fontcolor=white:"
        f"x=72:y=h-120:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='{FONT_R}':text='{ig}':fontsize=26:fontcolor=white@0.92:"
        f"x=72:y=h-72:enable='between(t\\,0\\,{t})',"
        f"drawtext=fontfile='{FONT_R}':text='Lapa71 - Lisboa':fontsize=24:fontcolor=white@0.78:"
        f"x=72:y=h-38:enable='between(t\\,0\\,{t})'"
    )


def log(msg: str) -> None:
    line = msg
    print(line, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "lapa71_pipeline.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"cmd failed ({r.returncode}): {' '.join(cmd[:8])}...\n{(r.stderr or r.stdout)[-900:]}")


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out or 0)


def probe_ok(p: Path) -> bool:
    if not p.exists() or p.stat().st_size < 80_000:
        return False
    try:
        return probe_duration(p) > 0.4
    except (ValueError, subprocess.CalledProcessError):
        return False


def ensure_dirs() -> None:
    for p in [REFS, FACE_DB, LOGS, PHOTOS, PROXIES, ARTISTS, EVENT_POSTER.parent]:
        p.mkdir(parents=True, exist_ok=True)
    for slug in ARTIST_SLUGS:
        (ARTISTS / slug).mkdir(parents=True, exist_ok=True)


def find_asset(uuid_fragment: str) -> Path | None:
    if not ASSETS.exists():
        return None
    for p in ASSETS.glob("*.png"):
        if uuid_fragment in p.name:
            return p
    return None


def setup_refs() -> int:
    """Copy IG screenshots into 00_artist_refs and build face_db crops."""
    n = 0
    poster_src = find_asset(POSTER_UUID)
    if poster_src and not EVENT_POSTER.exists():
        shutil.copy2(poster_src, EVENT_POSTER)
        log(f"poster -> {EVENT_POSTER.name}")
    for prefix, slug in REF_MAP.items():
        uuid = REF_ASSET_UUID.get(prefix, "")
        src = find_asset(uuid) if uuid else None
        if not src:
            log(f"WARN missing asset for {slug}")
            continue
        dst = REFS / f"{prefix}_{slug}.png"
        if not dst.exists():
            shutil.copy2(src, dst)
            n += 1
            log(f"ref {dst.name}")
    return n


def slug_from_ref(name: str) -> str | None:
    for prefix, slug in REF_MAP.items():
        if name.startswith(prefix):
            return slug
    return None


def build_face_db() -> list[str]:
    ready: list[str] = []
    for img in sorted(REFS.glob("*.png")):
        slug = slug_from_ref(img.name)
        if not slug:
            continue
        dest_dir = FACE_DB / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        existing = list(dest_dir.glob("*.jpg"))
        if existing:
            ready.append(slug)
            continue
        try:
            faces = DeepFace.extract_faces(
                img_path=str(img),
                detector_backend=DETECTOR,
                enforce_detection=True,
                align=True,
            )
        except Exception:
            try:
                faces = DeepFace.extract_faces(
                    img_path=str(img),
                    detector_backend=DETECTOR,
                    enforce_detection=False,
                    align=True,
                )
            except Exception as e:
                log(f"  face_db FAIL {slug}: {e}")
                continue
        faces = sorted(
            faces,
            key=lambda f: (f.get("facial_area") or {}).get("w", 0) * (f.get("facial_area") or {}).get("h", 0),
            reverse=True,
        )
        saved = 0
        for i, face in enumerate(faces[:2]):
            conf = float(face.get("confidence") or 0)
            if conf < 0.85:
                continue
            arr = face["face"]
            if arr.dtype != np.uint8:
                arr = (np.clip(arr, 0, 1) * 255).astype(np.uint8)
            bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(dest_dir / f"{i + 1:02d}.jpg"), bgr)
            saved += 1
        if saved:
            ready.append(slug)
            log(f"  face_db OK {slug} ({saved} crops)")
    return sorted(set(ready))


def clean_stale_temp() -> None:
    """Remove C: partial encodes when matching proxy already exists on D:."""
    TMP.mkdir(parents=True, exist_ok=True)
    for partial in TMP.glob("*.partial.mp4"):
        stem = partial.name[: -len(".partial.mp4")]
        dst = PROXIES / f"{stem}.mp4"
        if dst.exists() and probe_ok(dst):
            try:
                partial.unlink(missing_ok=True)
                log(f"clean temp {partial.name} (proxy on D:)")
            except OSError as e:
                log(f"keep temp {partial.name}: {e}")


def ffmpeg_proxy(src: Path, dst: Path) -> bool:
    dst.parent.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    if dst.exists() and probe_ok(dst):
        log(f"skip proxy {dst.name}")
        return True
    tmp = TMP / f"{dst.stem}.partial.mp4"
    tmp.unlink(missing_ok=True)
    x264 = "threads=2:sliced-threads=1:sync-lookahead=0:rc-lookahead=10"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-threads", "2", "-filter_threads", "1",
        "-i", str(src),
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", VF, "-af", AF,
        "-c:v", "libx264", "-preset", PRESET, "-crf", CRF,
        "-x264-params", x264,
        "-r", FPS, "-fps_mode", "cfr",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-pix_fmt", "yuv420p",
        "-max_muxing_queue_size", "1024",
        str(tmp),
    ]
    log(f"encode {src.name} ({src.stat().st_size / 1e9:.2f} GB)")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not tmp.exists() or tmp.stat().st_size < 100_000:
        log(f"FAIL {src.name}: {(r.stderr or r.stdout)[-600:]}")
        tmp.unlink(missing_ok=True)
        return False
    if dst.exists():
        dst.unlink(missing_ok=True)
    shutil.copy2(tmp, dst)
    tmp.unlink(missing_ok=True)
    log(f"OK proxy {dst.name} ({dst.stat().st_size / 1e6:.0f} MB)")
    return True


def copy_photos() -> int:
    n = 0
    seen: set[str] = set()
    for pat in ("*.JPG", "*.jpg"):
        for src in sorted(SRC.rglob(pat)):
            if src.name.lower() in seen:
                continue
            seen.add(src.name.lower())
            dst = PHOTOS / src.name
            if dst.exists() and dst.stat().st_size == src.stat().st_size:
                continue
            shutil.copy2(src, dst)
            n += 1
    if n:
        log(f"copied {n} photos")
    return n


def list_movs() -> list[Path]:
    seen: set[str] = set()
    out: list[Path] = []
    for pat in ("*.MOV", "*.mov"):
        for p in sorted(SRC.rglob(pat)):
            k = p.name.lower()
            if k in seen:
                continue
            seen.add(k)
            out.append(p)
    return out


def identify_frame(path: Path) -> list[tuple[str, float]]:
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
        row = df.iloc[0]
        identity = str(row.get("identity", ""))
        dist = float(row.get("distance", 99))
        parts = Path(identity).parts
        slug = None
        if "face_db" in parts:
            i = parts.index("face_db")
            if i + 1 < len(parts):
                slug = parts[i + 1]
        if slug and dist <= DISTANCE_MAX:
            hits.append((slug, dist))
    return hits


def best_label(hits: list[tuple[str, float]]) -> str:
    if not hits:
        return "Unknown"
    hits = sorted(hits, key=lambda x: x[1])
    return hits[0][0]


def extract_frames(source: Path, frames_dir: Path, duration: float, every: float) -> list[tuple[float, Path]]:
    frames_dir.mkdir(parents=True, exist_ok=True)
    times = []
    t = every
    while t < duration - 1.5:
        times.append(t)
        t += every

    def one(tt: float) -> tuple[float, Path] | None:
        out = frames_dir / f"t{int(tt):05d}.jpg"
        if out.exists() and out.stat().st_size > 5_000:
            return (tt, out)
        try:
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", f"{tt:.3f}", "-i", str(source),
                "-frames:v", "1", "-q:v", "3", "-vf", "scale=960:-2", str(out),
            ])
        except Exception:
            return None
        return (tt, out) if out.exists() else None

    frames: list[tuple[float, Path]] = []
    with ThreadPoolExecutor(max_workers=3) as ex:
        for fut in as_completed({ex.submit(one, tt): tt for tt in times}):
            res = fut.result()
            if res:
                frames.append(res)
    frames.sort(key=lambda x: x[0])
    return frames


def timeline_to_segments(timeline: list[tuple[float, str]], duration: float) -> list[dict]:
    if not timeline:
        return [{"artist": "Unknown", "start": 0.0, "end": duration, "dur": duration}]
    labels = [lab for _, lab in timeline]
    times = [t for t, _ in timeline]
    for i, lab in enumerate(labels):
        if lab == "Unknown":
            left = next((labels[j] for j in range(i - 1, -1, -1) if labels[j] != "Unknown"), None)
            right = next((labels[j] for j in range(i + 1, len(labels)) if labels[j] != "Unknown"), None)
            labels[i] = left or right or "Event_Broll"
    raw: list[tuple[str, float, float]] = []
    cur = labels[0]
    start_t = max(0.0, times[0] - SAMPLE_EVERY / 2)
    for i in range(1, len(labels)):
        if labels[i] != cur:
            end_t = (times[i - 1] + times[i]) / 2
            raw.append((cur, start_t, end_t))
            cur = labels[i]
            start_t = end_t
    raw.append((cur, start_t, duration))
    merged: list[tuple[str, float, float]] = []
    for artist, a, b in raw:
        if merged and merged[-1][0] == artist:
            merged[-1] = (artist, merged[-1][1], b)
        else:
            merged.append((artist, a, b))
    out = []
    for artist, a, b in merged:
        if b - a < MIN_SEG:
            continue
        out.append({"artist": artist, "start": round(a, 2), "end": round(b, 2), "dur": round(b - a, 2)})
    if not out:
        out = [{"artist": labels[0], "start": 0.0, "end": duration, "dur": round(duration, 2)}]
    return out


def export_cut(master: Path, artist: str, start: float, end: float, stem: str, idx: int) -> Path | None:
    dur = end - start
    out_dir = ARTISTS / artist
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{stem}_set{idx:02d}_{artist}_Stages_1080p.mp4"
    legacy = out_dir / f"{stem}_set{idx:02d}_{artist}_1080p.mp4"
    if out.exists() and probe_ok(out) and out.stat().st_size > 200_000:
        return out
    grade = "eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03"
    fade_out = max(0.0, dur - 0.8)
    intro = intro_drawtext(artist)
    vf = (
        f"scale=1920:1080:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2,{grade},{intro},"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out:.3f}:d=0.7,format=yuv420p"
    )
    af = (
        "highpass=f=55,afftdn=nf=-22:nt=w:tn=1:om=o,"
        "acompressor=threshold=-18dB:ratio=2:attack=20:release=240:makeup=2,"
        "alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"
    )
    preset = "ultrafast" if dur >= 180 else "veryfast"
    log(f"  cut+intro {out.name} ({dur:.0f}s)")
    try:
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
            "-hwaccel", "d3d11va",
            "-ss", f"{start:.3f}", "-i", str(master), "-t", f"{dur:.3f}",
            "-vf", vf, "-af", af,
            "-c:v", "libx264", "-preset", preset, "-crf", "19", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(out),
        ])
    except Exception as e:
        log(f"  cut FAIL {out.name}: {e}")
        return None
    if legacy.exists() and legacy != out:
        legacy.unlink(missing_ok=True)
    info = out_dir / "ARTIST_INFO.txt"
    if not info.exists():
        info.write_text(
            f"Artist: {DISPLAY.get(artist, artist)}\nIG: {META.get(artist, '')}\n"
            f"Event: Tagus Drop Rhythm — Lapa71\n",
            encoding="utf-8",
        )
    return out if probe_ok(out) else None


def classify_short_clip(master: Path, proxy: Path, stem: str) -> str:
    try:
        dur = probe_duration(proxy)
    except Exception:
        dur = 30.0
    sample_at = [dur * 0.2, dur * 0.5, dur * 0.8]
    votes: Counter[str] = Counter()
    for t in sample_at:
        frame = LOGS / f"short_{stem}_t{int(t)}.jpg"
        try:
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", f"{t:.2f}", "-i", str(proxy),
                "-frames:v", "1", "-q:v", "3", "-vf", "scale=960:-2", str(frame),
            ])
        except Exception:
            continue
        if frame.exists():
            votes[best_label(identify_frame(frame))] += 1
    if not votes:
        return "Unknown"
    artist, count = votes.most_common(1)[0]
    if artist == "Unknown" or count < 1:
        return "Event_Broll"
    return artist


def classify_photo(path: Path, face_ready: list[str]) -> str:
    if len(face_ready) < 2:
        return "Unknown"
    hits = identify_frame(path)
    lab = best_label(hits)
    return lab if lab != "Unknown" else "Event_Broll"


def compress_and_route_photo(src: Path, face_ready: list[str]) -> bool:
    stem = src.stem
    flag = LOGS / f"photo_done_{stem}.flag"
    if flag.exists():
        return True
    PHOTO_COMP.mkdir(parents=True, exist_ok=True)
    artist = classify_photo(src, face_ready)
    out_dir = ARTISTS / artist / "Portraits"
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / f"{stem}_portrait.jpg"
    comp = PHOTO_COMP / f"{stem}.jpg"
    try:
        from PIL import Image, ImageEnhance, ImageOps

        img = Image.open(src).convert("RGB")
        img = ImageOps.exif_transpose(img)
        img = ImageEnhance.Contrast(img).enhance(1.07)
        img = ImageEnhance.Brightness(img).enhance(1.02)
        img = ImageEnhance.Color(img).enhance(1.05)
        img = ImageEnhance.Sharpness(img).enhance(1.12)
        long_edge = max(img.size)
        if long_edge > 2400:
            scale = 2400 / long_edge
            img = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)
        comp.parent.mkdir(parents=True, exist_ok=True)
        img.save(comp, "JPEG", quality=91, optimize=True, progressive=True)
        img.save(dst, "JPEG", quality=91, optimize=True, progressive=True)
        log(f"photo {src.name} -> {artist}/Portraits/")
        flag.write_text(FACE_FLAG_VER + "\n", encoding="utf-8")
        return True
    except Exception as e:
        log(f"photo FAIL {src.name}: {e}")
        return False


def process_photos(face_ready: list[str]) -> int:
    n = 0
    for src in sorted(PHOTOS.glob("*.JPG")) + sorted(PHOTOS.glob("*.jpg")):
        if src.parent.name == "_compressed":
            continue
        if compress_and_route_photo(src, face_ready):
            n += 1
    return n


def assign_video(master: Path, proxy: Path, face_ready: list[str]) -> None:
    stem = master.stem
    flag = LOGS / f"face_done_{stem}.flag"
    if flag.exists() and flag.read_text(encoding="utf-8").strip() == FACE_FLAG_VER:
        log(f"skip face {stem} (done)")
        return
    if len(face_ready) < 2:
        log("skip face assign — face_db too small")
        return
    try:
        dur = probe_duration(proxy)
    except Exception:
        log(f"skip face {stem} — no duration")
        return

    log(f"=== face assign {stem} dur={dur:.0f}s ===")
    cuts_ok = True
    if dur >= LONG_CLIP_SEC:
        frames_dir = LOGS / f"face_frames_{stem}"
        frames = extract_frames(proxy, frames_dir, dur, SAMPLE_EVERY)
        timeline = []
        for t, fp in frames:
            lab = best_label(identify_frame(fp))
            timeline.append((t, lab))
            if lab != "Unknown":
                log(f"  t={t:6.0f}s -> {lab}")
        (LOGS / f"timeline_{stem}.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")
        segments = timeline_to_segments(timeline, dur)
        (LOGS / f"segments_{stem}.json").write_text(json.dumps(segments, indent=2), encoding="utf-8")
        for i, seg in enumerate(segments, start=1):
            if export_cut(master, seg["artist"], seg["start"], seg["end"], stem, i) is None:
                cuts_ok = False
    else:
        artist = classify_short_clip(master, proxy, stem)
        log(f"  short clip -> {artist}")
        if export_cut(master, artist, 0.0, dur, stem, 1) is None:
            cuts_ok = False
        # also keep full proxy in artist folder for quick review
        link = ARTISTS / artist / f"{stem}_full_proxy.mp4"
        if proxy.exists() and not link.exists():
            shutil.copy2(proxy, link)
    if cuts_ok:
        flag.write_text(FACE_FLAG_VER + "\n", encoding="utf-8")


def compress_all(only: set[str] | None = None) -> tuple[int, int]:
    ok = fail = 0
    for src in list_movs():
        if only and src.stem.lower() not in only and src.name.lower() not in only:
            continue
        dst = PROXIES / f"{src.stem}_proxy_1080p.mp4"
        if ffmpeg_proxy(src, dst):
            ok += 1
        else:
            fail += 1
    return ok, fail


def face_all(only: set[str] | None = None) -> None:
    face_ready = build_face_db()
    log(f"face_db artists: {face_ready}")
    for src in list_movs():
        if only and src.stem.lower() not in only and src.name.lower() not in only:
            continue
        proxy = PROXIES / f"{src.stem}_proxy_1080p.mp4"
        if not probe_ok(proxy):
            log(f"skip face {src.stem} — no proxy")
            continue
        assign_video(src, proxy, face_ready)


def process_all(only: set[str] | None = None) -> tuple[int, int]:
    """Compress each MOV, analyze + intro cuts immediately; route photos in parallel passes."""
    face_ready = build_face_db()
    log(f"face_db artists: {face_ready}")
    photos = process_photos(face_ready)
    if photos:
        log(f"photos routed: {photos}")
    ok = fail = 0
    for src in list_movs():
        if only and src.stem.lower() not in only and src.name.lower() not in only:
            continue
        dst = PROXIES / f"{src.stem}_proxy_1080p.mp4"
        if ffmpeg_proxy(src, dst):
            ok += 1
        else:
            fail += 1
            continue
        if len(face_ready) >= 2:
            assign_video(src, dst, face_ready)
        process_photos(face_ready)
    return ok, fail


def main() -> int:
    args = [a.lower() for a in sys.argv[1:]]
    only = {a for a in args if not a.startswith("--")}
    setup_only = "--setup" in args
    compress_only = "--compress" in args
    faces_only = "--faces" in args
    photos_only = "--photos" in args

    ensure_dirs()
    clean_stale_temp()
    log("=== Lapa71 Tagus Drop Rhythm pipeline ===")
    log(f"source: {SRC}")
    log(f"output: {OUT}")
    if not SRC.exists():
        log(f"ERROR missing source {SRC}")
        return 2

    setup_refs()
    copy_photos()
    if setup_only:
        log("setup complete")
        return 0

    face_ready = build_face_db()
    log(f"face_db artists: {face_ready}")

    if photos_only:
        n = process_photos(face_ready)
        log(f"photos routed: {n}")
        return 0

    if faces_only:
        process_photos(face_ready)
        face_all(only or None)
    elif compress_only:
        ok, fail = compress_all(only or None)
        log(f"compress done ok={ok} fail={fail}")
        return 0 if fail == 0 else 1
    else:
        ok, fail = process_all(only or None)
        log(f"process done ok={ok} fail={fail}")

    (LOGS / "LAPA71_PIPELINE_COMPLETE.flag").write_text("ok\n", encoding="utf-8")
    log("DONE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
