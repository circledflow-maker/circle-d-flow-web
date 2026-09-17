#!/usr/bin/env python3
"""Lapa71 / Tagus Drop Rhythm — compress SD batch + face-ID artist folders.

Source: F:\\DCIM\\106NZ502 (flat Nikon Z50II MOVs + JPGs)
Output: D:\\Wakungo_Content_Studio\\Lapa71

Encode via NTFS temp (D: is FAT32). Face-ID uses 720p proxies; cuts from SD master.
"""
from __future__ import annotations

import json
import os
import re
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

DeepFace = None  # lazy — compress must work even if DeepFace/pandas is blocked


def _deepface():
    """Import DeepFace only when face-sort needs it."""
    global DeepFace
    if DeepFace is None:
        from deepface import DeepFace as _DF  # noqa: PLC0415

        DeepFace = _DF
    return DeepFace


SRC = Path(os.environ.get("LAPA71_SRC", r"F:\DCIM\106NZ502"))
OUT = Path(os.environ.get("LAPA71_OUT", r"D:\Wakungo_Content_Studio\Lapa71"))
ASSETS = Path(
    os.environ.get(
        "LAPA71_ASSETS",
        r"C:\Users\user\.cursor\projects\d-circle-d-flow-web\assets",
    )
)
TMP = Path(os.environ.get("TEMP", r"C:\Users\user\AppData\Local\Temp")) / "lapa71_proxies"
WORK_TMP = OUT / "00_work" / "proxy_tmp"  # D: work — use when C: is tight; keep files <4GB (FAT32)
FAT32_MAX = 3.6 * 1024**3  # stay under FAT32 4GiB hard limit

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
# Proxy pass: no loudnorm (it is a hidden 2-pass and dominates runtime)
AF_PROXY = "highpass=f=50,afftdn=nf=-22,alimiter=limit=0.96"
VF_FAST = (
    "scale=1920:1080:force_original_aspect_ratio=decrease:flags=fast_bilinear,"
    "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
    "eq=contrast=1.06:brightness=0.015:saturation=0.96:gamma=1.04,"
    "format=yuv420p"
)
FPS = "60000/1001"
CRF = "20"
PRESET = "veryfast"
FAST_MODE = os.environ.get("LAPA71_FAST", "1").strip() not in ("0", "false", "no")

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
    "05_Mistah_Isaac": "Mr_Isaac",  # display: Mr. Isaac (IG @mistah_isaac)
    "06_Arpanito": "Arpanito",
    "07_Humble": "Humble",
    "08_Arif": "Arif",
    "09_Zema": "Zema",
}

# Artists who often share one set — export matching windows to both folders
CO_PERFORMERS = {
    "Ana": "Elisa",
    "Elisa": "Ana",
}

# Old slug -> canonical (folder / face_db / filenames)
SLUG_ALIASES = {
    "Mistah_Isaac": "Mr_Isaac",
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
    "08_Arif": "image-7ebe4144-e9ff-4905-8116-a25d0cf70d13",
}
POSTER_UUID = "image-d5e88d6f-5c4c-4254-972a-7a53c8a0d508"

META = {
    "Maryna_Vadini": "@soulvoice_vadini",
    "Ana": "@memyself.ana",
    "Elisa": "@elisa.cas8",
    "Leonnardo_Melo": "@meloleonnardo",
    "Mr_Isaac": "@mistah_isaac",
    "Arpanito": "@arpan.k_",
    "Humble": "@_humble_project_",
    "Manu": "@manuallegro",
    "Arif": "Guest",
    "Zema": "Guest · Cajón",
    "Unknown": "",
    "Event_Broll": "Lapa71 · Lisboa",
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
    "Mr_Isaac": "Mr. Isaac",
    "Arpanito": "Arpanito",
    "Humble": "Humble.",
    "Manu": "Manu Allegro",
    "Arif": "Arif",
    "Zema": "Zema",
    "Unknown": "Artist",
    "Event_Broll": "Lapa71",
}


def canon_slug(slug: str) -> str:
    return SLUG_ALIASES.get(slug, slug)


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
            faces = _deepface().extract_faces(
                img_path=str(img),
                detector_backend=DETECTOR,
                enforce_detection=True,
                align=True,
            )
        except Exception:
            try:
                faces = _deepface().extract_faces(
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


def free_bytes(path: Path) -> int:
    try:
        usage = shutil.disk_usage(str(path if path.exists() else path.parent))
        return int(usage.free)
    except OSError:
        return 0


def media_duration_sec(path: Path) -> float:
    try:
        r = subprocess.run(
            [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=nw=1:nk=1", str(path),
            ],
            capture_output=True, text=True, timeout=120,
        )
        return float((r.stdout or "").strip() or 0)
    except Exception:
        return 0.0


def pick_encode_tmp(dst: Path, est_bytes: int) -> Path:
    """Prefer D: work tmp (FAT32-safe <4GB). Keep C: free for OS/Cursor."""
    WORK_TMP.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    c_free = free_bytes(TMP)
    d_free = free_bytes(WORK_TMP)
    need = int(est_bytes * 1.15) + 200_000_000
    # Prefer D whenever estimate fits FAT32 and D has room — C stays for apps
    if est_bytes < FAT32_MAX and d_free > need:
        if c_free < 20 * 1024**3:
            log(f"temp on D: work (C free={c_free/1e9:.1f}GB, est={est_bytes/1e9:.2f}GB)")
        return WORK_TMP / f"{dst.stem}.partial.mp4"
    if c_free > need + 5 * 1024**3:
        return TMP / f"{dst.stem}.partial.mp4"
    log(f"WARN low disk C={c_free/1e9:.1f}GB D={d_free/1e9:.1f}GB need~{need/1e9:.1f}GB")
    if est_bytes < FAT32_MAX and d_free > need:
        return WORK_TMP / f"{dst.stem}.partial.mp4"
    return TMP / f"{dst.stem}.partial.mp4"


def ffmpeg_proxy(src: Path, dst: Path) -> bool:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and probe_ok(dst):
        log(f"skip proxy {dst.name}")
        return True
    gb = src.stat().st_size / 1e9
    dur = media_duration_sec(src)
    huge = gb >= 8.0 or dur >= 1800  # 30+ min
    # Default estimate ~0.32 of source (observed); monsters force FAT32-safe bitrate.
    est = int(src.stat().st_size * 0.33)
    fat32_safe = huge or est > FAT32_MAX or free_bytes(TMP) < 8 * 1024**3
    if fat32_safe:
        # ~51min @ ~5.5Mbps ≈ 2.1GB — fits FAT32 + small C:
        est = int(max(dur, 60) * 700_000)  # ~0.7 MB/s container
        fat32_safe = True

    tmp = pick_encode_tmp(dst, est)
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.unlink(missing_ok=True)
    stats_log = tmp.with_suffix(".ffmpeg.log")

    preset = "ultrafast" if (FAST_MODE or gb >= 1.5 or fat32_safe) else PRESET
    threads = "4" if FAST_MODE else "2"
    x264 = f"threads={threads}:sliced-threads=1:sync-lookahead=0:rc-lookahead=8"
    af = AF_PROXY if FAST_MODE else AF

    if fat32_safe:
        # 720p + capped bitrate keeps monster proxies under FAT32 4GB
        vf = (
            "scale=1280:720:force_original_aspect_ratio=decrease:flags=fast_bilinear,"
            "pad=1280:720:(ow-iw)/2:(oh-ih)/2,"
            "eq=contrast=1.05:brightness=0.01:saturation=0.96,"
            "format=yuv420p"
        )
        vcodec = [
            "-c:v", "libx264", "-preset", preset,
            "-b:v", "5M", "-maxrate", "6M", "-bufsize", "12M",
            "-x264-params", x264,
        ]
        ac = ["-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2"]
        mode = "fat32_safe_720p_5M"
    else:
        crf = "21" if huge else CRF
        vf = VF_FAST if (FAST_MODE or huge) else VF
        vcodec = [
            "-c:v", "libx264", "-preset", preset, "-crf", crf,
            "-x264-params", x264,
        ]
        ac = [
            "-c:a", "aac", "-b:a", "160k" if FAST_MODE else "192k",
            "-ar", "48000", "-ac", "2",
        ]
        mode = f"crf{crf}"

    def build(hw: bool) -> list[str]:
        cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats"]
        if hw:
            cmd += ["-hwaccel", "d3d11va"]
        cmd += [
            "-threads", threads, "-filter_threads", "2" if FAST_MODE else "1",
            "-i", str(src),
            "-map", "0:v:0", "-map", "0:a:0?",
            "-vf", vf, "-af", af,
            *vcodec,
            "-r", FPS, "-fps_mode", "cfr",
            *ac,
            "-pix_fmt", "yuv420p",
            "-max_muxing_queue_size", "1024",
            str(tmp),
        ]
        return cmd

    def run(cmd: list[str]) -> int:
        with open(stats_log, "w", encoding="utf-8", errors="replace") as errf:
            return subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=errf).returncode

    def fail_tail() -> str:
        try:
            return stats_log.read_text(encoding="utf-8", errors="replace")[-600:]
        except OSError:
            return ""

    log(
        f"encode {src.name} [{camera_tag(src)}] {gb:.2f}GB dur={dur:.0f}s "
        f"mode={mode} est={est/1e9:.2f}GB tmp={tmp.parent.name}"
    )
    code = run(build(hw=True))
    if code != 0 or not tmp.exists() or tmp.stat().st_size < 100_000:
        log(f"retry software decode {src.name}")
        tmp.unlink(missing_ok=True)
        code = run(build(hw=False))
    if code != 0 or not tmp.exists() or tmp.stat().st_size < 100_000:
        log(f"FAIL {src.name}: {fail_tail()}")
        tmp.unlink(missing_ok=True)
        return False
    if tmp.stat().st_size >= FAT32_MAX and str(dst).upper().startswith("D:"):
        log(f"FAIL {src.name}: proxy {tmp.stat().st_size/1e9:.2f}GB exceeds FAT32 limit for D:")
        tmp.unlink(missing_ok=True)
        return False
    if dst.exists():
        dst.unlink(missing_ok=True)
    try:
        shutil.move(str(tmp), str(dst))
    except OSError:
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


def camera_tag(src: Path) -> str:
    p = src.parent.name.upper()
    if "ND850" in p or p.endswith("D850"):
        return "D850"
    if "NZ502" in p or "Z50" in p:
        return "Z50II"
    return "CAM"


def work_stem(src: Path) -> str:
    """Unique output stem — D850 clips get a suffix so they never collide with Z50II."""
    if camera_tag(src) == "D850":
        return f"{src.stem}_D850"
    return src.stem


def proxy_path(src: Path) -> Path:
    return PROXIES / f"{work_stem(src)}_proxy_1080p.mp4"


def list_movs() -> list[Path]:
    seen: set[str] = set()
    out: list[Path] = []
    for pat in ("*.MOV", "*.mov"):
        for p in sorted(SRC.rglob(pat)):
            k = str(p.resolve()).lower()
            if k in seen:
                continue
            seen.add(k)
            out.append(p)
    # Small clips first, monsters last — visible progress + SD less likely to stall early
    out.sort(key=lambda p: p.stat().st_size)
    return out


def identify_frame(path: Path) -> list[tuple[str, float]]:
    try:
        dfs = _deepface().find(
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
            hits.append((canon_slug(slug), dist))
    return hits


def best_label(hits: list[tuple[str, float]]) -> str:
    if not hits:
        return "Unknown"
    hits = sorted(hits, key=lambda x: x[1])
    return canon_slug(hits[0][0])


def labels_present(hits: list[tuple[str, float]]) -> set[str]:
    return {canon_slug(s) for s, d in hits if d <= DISTANCE_MAX}


def duo_partners_in_timeline(timeline: list[tuple[float, str]]) -> set[str]:
    labs = {lab for _, lab in timeline}
    out: set[str] = set()
    for a, b in CO_PERFORMERS.items():
        if a in labs and b in labs:
            out.add(a)
            out.add(b)
    return out


def expand_duo_exports(segments: list[dict], timeline: list[tuple[float, str]]) -> list[dict]:
    """Ana+Elisa often share one set — mirror windows into both artist folders.

    Soft rule: if either partner has ≥2 timeline hits and the other ≥1, treat as duo.
    Also duo if any frame was tagged as either while both appear at least once.
    """
    counts = Counter(lab for _, lab in timeline)
    ana_n, eli_n = counts.get("Ana", 0), counts.get("Elisa", 0)
    hard = ana_n >= 1 and eli_n >= 1
    soft = (ana_n >= 2 and eli_n >= 1) or (eli_n >= 2 and ana_n >= 1)
    if not (hard or soft):
        return segments
    duo = {"Ana", "Elisa"}
    extra: list[dict] = []
    seen = {(s["artist"], s["start"], s["end"]) for s in segments}
    # Mirror existing Ana/Elisa segments to the partner
    for seg in segments:
        if seg["artist"] not in duo:
            continue
        partner = CO_PERFORMERS[seg["artist"]]
        key = (partner, seg["start"], seg["end"])
        if key in seen:
            continue
        seen.add(key)
        extra.append({**seg, "artist": partner, "duo_mirror": True})
    # If only one partner produced segments (other dropped by MIN_SEG), still mirror those
    return segments + extra


def assign_video(master: Path, proxy: Path, face_ready: list[str]) -> None:
    stem = work_stem(master)
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
        every = SAMPLE_EVERY
        if dur >= 1800:
            every = 30.0
        elif dur >= 600:
            every = 20.0
        frames_dir = LOGS / f"face_frames_{stem}"
        frames = extract_frames(proxy, frames_dir, dur, every)
        timeline = []
        duo_frame = False
        for t, fp in frames:
            hits = identify_frame(fp)
            lab = best_label(hits)
            present = labels_present(hits)
            if "Ana" in present and "Elisa" in present:
                duo_frame = True
                # Prefer whichever is closer; keep both visible in log
                log(f"  t={t:6.0f}s -> {lab} (duo Ana+Elisa)")
            elif lab != "Unknown":
                log(f"  t={t:6.0f}s -> {lab}")
            timeline.append((t, lab))
        if duo_frame and not any(l == "Elisa" for _, l in timeline):
            # Force at least one Elisa marker so expand_duo triggers
            timeline.append((timeline[-1][0] if timeline else 0.0, "Elisa"))
        if duo_frame and not any(l == "Ana" for _, l in timeline):
            timeline.append((timeline[-1][0] if timeline else 0.0, "Ana"))
        (LOGS / f"timeline_{stem}.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")
        segments = timeline_to_segments(timeline, dur)
        segments = expand_duo_exports(segments, timeline)
        (LOGS / f"segments_{stem}.json").write_text(json.dumps(segments, indent=2), encoding="utf-8")
        for i, seg in enumerate(segments, start=1):
            if export_cut(proxy, seg["artist"], seg["start"], seg["end"], stem, i) is None:
                cuts_ok = False
    else:
        artist = classify_short_clip(master, proxy, stem)
        log(f"  short clip -> {artist}")
        if export_cut(proxy, artist, 0.0, dur, stem, 1) is None:
            cuts_ok = False
        # Ana/Elisa duo: if short clip is one partner, also check partner face
        partner = CO_PERFORMERS.get(artist)
        if partner:
            # quick mid-frame check for partner
            frame = LOGS / f"short_{stem}_duo.jpg"
            try:
                run([
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                    "-ss", f"{max(0.2, dur * 0.5):.2f}", "-i", str(proxy),
                    "-frames:v", "1", "-q:v", "3", "-vf", "scale=960:-2", str(frame),
                ])
                if frame.exists() and partner in labels_present(identify_frame(frame)):
                    log(f"  short duo -> also {partner}")
                    export_cut(proxy, partner, 0.0, dur, stem, 2)
            except Exception:
                pass
        link_dir = ARTISTS / artist / "Full_Proxies"
        link_dir.mkdir(parents=True, exist_ok=True)
        link = link_dir / f"{stem}_full_proxy.mp4"
        if proxy.exists() and not link.exists():
            shutil.copy2(proxy, link)
    if cuts_ok:
        flag.write_text(FACE_FLAG_VER + "\n", encoding="utf-8")


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


def export_cut(source: Path, artist: str, start: float, end: float, stem: str, idx: int) -> Path | None:
    """Cut from 1080p proxy (not SD 4K master) — stable and much faster."""
    artist = canon_slug(artist)
    dur = end - start
    out_dir = ARTISTS / artist / "Stages"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{stem}_set{idx:02d}_{artist}_Stages_1080p.mp4"
    legacy_root = ARTISTS / artist / out.name
    legacy = out_dir / f"{stem}_set{idx:02d}_{artist}_1080p.mp4"
    if out.exists() and probe_ok(out) and out.stat().st_size > 200_000:
        return out
    if legacy_root.exists() and probe_ok(legacy_root) and legacy_root.stat().st_size > 200_000:
        # migrate flat layout → Stages/
        if not out.exists():
            legacy_root.rename(out)
        return out
    fade_out = max(0.0, dur - 0.8)
    intro = intro_drawtext(artist)
    vf = (
        f"{intro},fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out:.3f}:d=0.7,format=yuv420p"
    )
    af = "alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"
    preset = "ultrafast" if dur >= 120 else "veryfast"
    log(f"  cut+intro {artist}/Stages/{out.name} ({dur:.0f}s) from {source.name}")
    try:
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-ss", f"{start:.3f}", "-i", str(source), "-t", f"{dur:.3f}",
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
    info = (ARTISTS / artist) / "ARTIST_INFO.txt"
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


def migrate_mistah_to_mr_isaac() -> None:
    """Folder / face_db rename Mistah_Isaac -> Mr_Isaac (idempotent)."""
    old_db, new_db = FACE_DB / "Mistah_Isaac", FACE_DB / "Mr_Isaac"
    if old_db.exists():
        new_db.mkdir(parents=True, exist_ok=True)
        for f in old_db.iterdir():
            dest = new_db / f.name
            if f.is_file() and not dest.exists():
                shutil.move(str(f), str(dest))
        shutil.rmtree(old_db, ignore_errors=True)
        log("migrated face_db Mistah_Isaac -> Mr_Isaac")

    old_art, new_art = ARTISTS / "Mistah_Isaac", ARTISTS / "Mr_Isaac"
    if old_art.exists():
        new_art.mkdir(parents=True, exist_ok=True)
        for f in old_art.rglob("*"):
            if not f.is_file():
                continue
            rel = f.relative_to(old_art)
            new_name = f.name.replace("Mistah_Isaac", "Mr_Isaac")
            dest = new_art / rel.parent / new_name
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists():
                f.unlink(missing_ok=True)
            else:
                shutil.move(str(f), str(dest))
        shutil.rmtree(old_art, ignore_errors=True)
        log("migrated artist folder Mistah_Isaac -> Mr_Isaac")


def fix_artist_labels(reface: bool = True) -> int:
    """Finalize naming: Mr. Isaac + Manu. Optionally rebuild Stages intros."""
    import time

    ensure_dirs()
    migrate_mistah_to_mr_isaac()

    # Refresh ARTIST_INFO for corrected artists
    for slug in ("Mr_Isaac", "Manu"):
        d = ARTISTS / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / "ARTIST_INFO.txt").write_text(
            f"Artist: {DISPLAY.get(slug, slug)}\nIG: {META.get(slug, '')}\n"
            f"Event: Tagus Drop Rhythm — Lapa71\n",
            encoding="utf-8",
        )

    # Rename leftover Mistah_Isaac tokens anywhere under 04_Artists
    for p in ARTISTS.rglob("*"):
        if p.is_file() and "Mistah_Isaac" in p.name:
            dest = p.with_name(p.name.replace("Mistah_Isaac", "Mr_Isaac"))
            if dest.exists():
                p.unlink(missing_ok=True)
            else:
                p.rename(dest)
            log(f"rename {p.name} -> {dest.name}")

    stems: set[str] = set()
    for slug in ("Mr_Isaac", "Manu"):
        folder = ARTISTS / slug
        if not folder.exists():
            continue
        for p in folder.glob("*_Stages_1080p.mp4"):
            m = re.match(r"(DSC_\d+)", p.name)
            if m:
                stems.add(m.group(1).lower())
            # Force rebuild with correct burned-in title
            p.unlink(missing_ok=True)
            log(f"queue reface (delete cut): {p.name}")
        for p in folder.glob("*_full_proxy.mp4"):
            m = re.match(r"(DSC_\d+)", p.name)
            if m:
                stems.add(m.group(1).lower())
            p.unlink(missing_ok=True)

    if not reface:
        (LOGS / "LABELS_FIXED.flag").write_text(time.strftime("%Y-%m-%dT%H:%M:%S"), encoding="utf-8")
        log(f"fix-labels rename-only done stems_marked={len(stems)}")
        return 0

    if not stems:
        (LOGS / "LABELS_FIXED.flag").write_text(time.strftime("%Y-%m-%dT%H:%M:%S"), encoding="utf-8")
        log("fix-labels: nothing to reface")
        return 0

    # Wait until ffmpeg is idle (faces phase may still be cutting)
    for _ in range(180):
        try:
            r = subprocess.run(
                ["tasklist", "/FI", "IMAGENAME eq ffmpeg.exe"],
                capture_output=True, text=True, timeout=30,
            )
            if "ffmpeg.exe" not in (r.stdout or ""):
                break
        except Exception:
            break
        log("fix-labels waiting for ffmpeg idle…")
        time.sleep(15)

    # Clear face_done flags for affected DSC numbers
    for flag in list(LOGS.glob("face_done_*.flag")):
        fl = flag.name.lower()
        for s in stems:
            num = s.replace("dsc_", "")
            if num and num in fl:
                flag.unlink(missing_ok=True)
                break

    log(f"fix-labels reface stems: {sorted(stems)}")
    face_all(stems)
    (LOGS / "LABELS_FIXED.flag").write_text(time.strftime("%Y-%m-%dT%H:%M:%S"), encoding="utf-8")
    log("fix-labels complete")
    return 0


def compress_all(only: set[str] | None = None) -> tuple[int, int]:
    ok = fail = 0
    for src in list_movs():
        if only and src.stem.lower() not in only and src.name.lower() not in only:
            continue
        dst = proxy_path(src)
        if ffmpeg_proxy(src, dst):
            ok += 1
        else:
            fail += 1
    return ok, fail


def face_all(only: set[str] | None = None) -> None:
    try:
        _deepface()
    except Exception as e:
        log(f"FACE BLOCKED — DeepFace unavailable ({e}). Compress proxies OK; face-sort skipped.")
        (LOGS / "FACE_BLOCKED.flag").write_text(str(e), encoding="utf-8")
        return
    face_ready = build_face_db()
    log(f"face_db artists: {face_ready}")
    for src in list_movs():
        if only and src.stem.lower() not in only and src.name.lower() not in only:
            continue
        proxy = proxy_path(src)
        if not probe_ok(proxy):
            log(f"skip face {work_stem(src)} — no proxy")
            continue
        assign_video(src, proxy, face_ready)


def process_all(only: set[str] | None = None) -> tuple[int, int]:
    """Fast path: photos once, compress all (size-sorted), then face-sort from proxies."""
    face_ready = build_face_db()
    log(f"face_db artists: {face_ready}")
    photos = process_photos(face_ready)
    if photos:
        log(f"photos routed: {photos}")
    ok, fail = compress_all(only)
    if len(face_ready) >= 2:
        face_all(only)
    return ok, fail


def main() -> int:
    args = [a.lower() for a in sys.argv[1:]]
    only = {a for a in args if not a.startswith("--")}
    setup_only = "--setup" in args
    compress_only = "--compress" in args
    faces_only = "--faces" in args
    photos_only = "--photos" in args
    fix_labels_only = "--fix-labels" in args

    ensure_dirs()
    clean_stale_temp()
    log("=== Lapa71 Tagus Drop Rhythm pipeline ===")
    log(f"source: {SRC}")
    log(f"output: {OUT}")
    if not SRC.exists() and not fix_labels_only:
        log(f"ERROR missing source {SRC}")
        return 2

    if fix_labels_only:
        return fix_artist_labels(reface="--no-reface" not in args)

    setup_refs()
    copy_photos()
    if setup_only:
        log("setup complete")
        return 0

    # Compress must not depend on DeepFace (pandas/App Control can block it)
    if compress_only:
        ok, fail = compress_all(only or None)
        log(f"compress done ok={ok} fail={fail}")
        return 0 if fail == 0 else 1

    face_ready = build_face_db()
    log(f"face_db artists: {face_ready}")

    if photos_only:
        n = process_photos(face_ready)
        log(f"photos routed: {n}")
        return 0

    if faces_only:
        process_photos(face_ready)
        face_all(only or None)
    else:
        ok, fail = process_all(only or None)
        log(f"process done ok={ok} fail={fail}")

    (LOGS / "LAPA71_PIPELINE_COMPLETE.flag").write_text("ok\n", encoding="utf-8")
    log("DONE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
