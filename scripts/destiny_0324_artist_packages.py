#!/usr/bin/env python3
"""DSC_0324 — Artist packages with Circle D Stages intro + lower thirds.

Uses existing face frames + DeepFace refs. Unknown → Wako_Kungo (band default).
Creates one folder per artist; exports 16:9 + 9:16 into 04_videos_compressed/Artists.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
os.environ.setdefault("PYTHONUTF8", "1")
# Force Fontconfig (setdefault is not enough if a blank env var already exists)
_FC_DIR = Path(r"D:\circle-d-flow-web\scripts\fonts")
(_FC_DIR / "cache").mkdir(parents=True, exist_ok=True)
os.environ["FONTCONFIG_FILE"] = str(_FC_DIR / "fonts.conf")
os.environ["FONTCONFIG_PATH"] = str(_FC_DIR)

from deepface import DeepFace  # noqa: E402

OUT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\002")
MASTER = Path(os.environ.get("DESTINY_MASTER", r"F:\DCIM\106NZ502\DSC_0324.MOV"))
FACE_DB = OUT / "00_artist_refs" / "face_db"
FRAMES = OUT / "00_logs" / "face_frames_0324"
LOGS = OUT / "00_logs"
STAGES_ART = OUT / "05_Format_Drafts" / "Circle_D_Stages" / "02_Artists"
VC_ART = OUT / "04_videos_compressed" / "Artists"
DRIVE_ART = OUT / "06_drive_ready" / "Circle_D_Stages" / "Artists"
SOCIAL_169 = OUT / "05_Format_Drafts" / "Circle_D_Stages" / "04_Social_16x9"
SOCIAL_916 = OUT / "05_Format_Drafts" / "Circle_D_Stages" / "05_Social_9x16"
VC_169 = OUT / "04_videos_compressed" / "Social_16x9"
VC_916 = OUT / "04_videos_compressed" / "Social_9x16"

MODEL = "Facenet"
DETECTOR = "retinaface"
DIST_MAX = 0.34
MIN_SET = 50.0
INTRO_SEC = 7.0
BAND = {"Nicke_Klein", "Edoardo_Statuto", "Mistah_Isaac", "Joao_Redondo", "Arpanito"}

# slug -> (display name, lower-third subline, ig)
ROSTER = {
    "Wako_Kungo": ("Wako Kungo", 'Full Band - "ONENESS"', "@wako.kungo"),
    "Nicke_Klein": ("Nicke Klein", "Vox - Live Performance", "@nickeklein"),
    "Edoardo_Statuto": ("Edoardo Statuto", "Guitar - Live Performance", "@_edoardostatuto_"),
    "Mistah_Isaac": ("Mistah Isaac", "Lead Guitar - @wako.kungo", "@mistah_isaac"),
    "Joao_Redondo": ("Joao Redondo Maia", "Drums - Live Performance", "@joaoredondomaia"),
    "Arpanito": ("Arpanito", "Vox - Live Performance", "@arpan.k_"),
    "Elisa": ("Elisa", "Vox - Live Performance", "@elisa.cas8"),
    "C-Riz": ("C-Riz", "Rap - Live Performance", "@c_riz.official"),
    "Willpower": ("WILLPOWER", "BodyX - Live Performance", "@bodyxwillpower"),
    "Chris_Inacio": ("Chris To Inacio", "Painter - Special Appearance", "@1chriscreator"),
    "July_Tilie": ("July Tilie", "Special Appearance", "@julytilie"),
    "Basseck_Mankabu": ("Basseck Mankabu", "Special Appearance", "@basseck.mankabu"),
    "Kreativlon": ("Kreativlon", "Epoxy Artist - Special", "@kreativlon.art"),
    "Lobsthercraft_Sere": ("Sere / Lobsthercraft", "Arts & Crafts - Special", "@lobsthercraft"),
}

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"


def log(msg: str) -> None:
    print(msg, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "artist_packages_0324.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def run(cmd: list[str]) -> None:
    env = os.environ.copy()
    env["FONTCONFIG_FILE"] = str(_FC_DIR / "fonts.conf")
    env["FONTCONFIG_PATH"] = str(_FC_DIR)
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg/cmd failed: {' '.join(cmd[:8])}...\n{(r.stderr or '')[-1000:]}")


def probe_dur(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        text=True,
    ).strip()
    return float(out)


def esc_draw(s: str) -> str:
    # ffmpeg drawtext escaping
    return (
        s.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\\'")
        .replace("%", "\\%")
    )


def ensure_artist_folders() -> None:
    for slug, (name, role, ig) in ROSTER.items():
        for base in (STAGES_ART, VC_ART, DRIVE_ART):
            d = base / slug
            d.mkdir(parents=True, exist_ok=True)
            info = d / "ARTIST_INFO.txt"
            body = (
                f"Event: Circle D Stages presents Wako Kungo \"ONENESS\"\n"
                f"Venue: Sunset Destination Hostel - Cais do Sodre, Lisboa\n"
                f"Date: 31 July\n"
                f"Artist: {name}\n"
                f"Role: {role}\n"
                f"Instagram: {ig}\n"
                f"Powered by: Circle D Flow / @circle.d.flow\n"
                f"Assigned via: face recognition (DeepFace) + content pipeline\n"
            )
            info.write_text(body, encoding="utf-8")
    for p in (SOCIAL_169, SOCIAL_916, VC_169, VC_916, LOGS):
        p.mkdir(parents=True, exist_ok=True)
    log(f"artist folders ready: {len(ROSTER)}")


def list_frames() -> list[tuple[float, Path]]:
    frames = []
    for p in sorted(FRAMES.glob("t*.jpg")):
        m = re.search(r"t(\d+)", p.name)
        if not m:
            continue
        t = float(m.group(1))
        if p.stat().st_size > 5000:
            frames.append((t, p))
    return frames


def identify_frame(path: Path) -> list[tuple[str, float]]:
    try:
        dfs = DeepFace.find(
            img_path=str(path),
            db_path=str(FACE_DB),
            model_name=MODEL,
            detector_backend=DETECTOR,
            enforce_detection=False,
            silent=True,
            threshold=DIST_MAX,
        )
    except Exception:
        return []
    hits = []
    for df in dfs or []:
        if df is None or len(df) == 0:
            continue
        # take top 3 rows per face
        for _, row in df.head(3).iterrows():
            identity = str(row.get("identity", ""))
            dist = float(row.get("distance", 99))
            parts = Path(identity).parts
            if "face_db" not in parts:
                continue
            slug = parts[parts.index("face_db") + 1]
            if dist <= DIST_MAX:
                hits.append((slug, dist))
    hits.sort(key=lambda x: x[1])
    return hits


def label_for_hits(hits: list[tuple[str, float]]) -> str:
    if not hits:
        return "Unknown"
    best_slug, best_d = hits[0]
    band = [(s, d) for s, d in hits if s in BAND]
    guests = [(s, d) for s, d in hits if s not in BAND and s in ROSTER]

    # Strong guest feature (<0.28) wins
    if guests and guests[0][1] < 0.28:
        return guests[0][0]
    # Two+ band faces → full band
    if len({s for s, _ in band}) >= 2:
        return "Wako_Kungo"
    # Single band face
    if band and (not guests or band[0][1] <= guests[0][1] + 0.03):
        return band[0][0] if band[0][1] < 0.32 else "Wako_Kungo"
    if guests and guests[0][1] < 0.32:
        return guests[0][0]
    if best_slug in ROSTER and best_d < 0.32:
        return best_slug if best_slug not in BAND else "Wako_Kungo"
    return "Unknown"


def rebuild_timeline(frames: list[tuple[float, Path]]) -> list[tuple[float, str]]:
    # reuse cached timeline if force re-id env not set — always re-id for corrected logic
    timeline = []
    for i, (t, path) in enumerate(frames):
        hits = identify_frame(path)
        lab = label_for_hits(hits)
        timeline.append((t, lab))
        if i % 8 == 0 or lab not in ("Unknown", "Wako_Kungo"):
            log(f"  t={t:7.1f}s -> {lab} hits={hits[:3]}")
    (LOGS / "face_timeline_0324_v2.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")
    return timeline


def timeline_to_segments(timeline: list[tuple[float, str]], duration: float) -> list[dict]:
    if not timeline:
        return [{"artist": "Wako_Kungo", "start": 0.0, "end": duration, "dur": duration}]

    times = [t for t, _ in timeline]
    labels = [lab for _, lab in timeline]
    # Unknown -> Wako_Kungo (band default). Do NOT fill with future guests.
    labels = ["Wako_Kungo" if x == "Unknown" else x for x in labels]

    # Require 2 consecutive same labels to accept a guest switch; else keep previous
    stable = [labels[0]]
    for i in range(1, len(labels)):
        if labels[i] == stable[-1]:
            stable.append(labels[i])
        elif i + 1 < len(labels) and labels[i] == labels[i + 1]:
            stable.append(labels[i])
        else:
            stable.append(stable[-1])
    labels = stable

    raw = []
    cur = labels[0]
    start_t = max(0.0, times[0] - 6.0)
    for i in range(1, len(labels)):
        if labels[i] != cur:
            end_t = (times[i - 1] + times[i]) / 2
            raw.append((cur, start_t, end_t))
            cur = labels[i]
            start_t = end_t
    raw.append((cur, start_t, duration))

    # merge tiny into neighbors
    segs = []
    for artist, a, b in raw:
        if segs and (b - a) < MIN_SET:
            pa, ps, pe = segs[-1]
            segs[-1] = (pa, ps, b)
        else:
            segs.append((artist, a, b))
    # merge adjacent same
    merged = []
    for artist, a, b in segs:
        if merged and merged[-1][0] == artist:
            merged[-1] = (artist, merged[-1][1], b)
        else:
            merged.append((artist, a, b))

    out = []
    for artist, a, b in merged:
        if b - a < 20:
            continue
        if artist not in ROSTER:
            artist = "Wako_Kungo"
        out.append({"artist": artist, "start": round(a, 2), "end": round(b, 2), "dur": round(b - a, 2)})
    if not out:
        out = [{"artist": "Wako_Kungo", "start": 0.0, "end": duration, "dur": round(duration, 2)}]
    (LOGS / "face_segments_0324_v2.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    return out


def make_intro_slate(out_path: Path, artist_slug: str) -> None:
    name, role, ig = ROSTER[artist_slug]
    # black slate 1920x1080
    line1 = esc_draw("Circle D Stages presents")
    line2 = esc_draw('Wako Kungo  "ONENESS"')
    line3 = esc_draw("Sunset Destination Hostel - Cais do Sodre")
    line4 = esc_draw("Lisboa - 31 July")
    line5 = esc_draw(name)
    line6 = esc_draw(f"{ig} - Live Performance")
    vf = (
        f"drawtext=fontfile='{FONT_B}':text='{line1}':fontsize=36:fontcolor=white@0.9:"
        f"x=(w-text_w)/2:y=h*0.22:enable='gte(t\\,0.3)',"
        f"drawtext=fontfile='{FONT_B}':text='{line2}':fontsize=52:fontcolor=#E8C547:"
        f"x=(w-text_w)/2:y=h*0.34:enable='gte(t\\,0.8)',"
        f"drawtext=fontfile='{FONT_R}':text='{line3}':fontsize=30:fontcolor=white@0.85:"
        f"x=(w-text_w)/2:y=h*0.48:enable='gte(t\\,1.3)',"
        f"drawtext=fontfile='{FONT_R}':text='{line4}':fontsize=26:fontcolor=white@0.7:"
        f"x=(w-text_w)/2:y=h*0.56:enable='gte(t\\,1.6)',"
        f"drawtext=fontfile='{FONT_B}':text='{line5}':fontsize=56:fontcolor=white:"
        f"x=(w-text_w)/2:y=h*0.70:enable='gte(t\\,2.4)',"
        f"drawtext=fontfile='{FONT_R}':text='{line6}':fontsize=28:fontcolor=white@0.9:"
        f"x=(w-text_w)/2:y=h*0.80:enable='gte(t\\,2.8)',"
        f"fade=t=in:st=0:d=0.4,fade=t=out:st={INTRO_SEC-0.6:.2f}:d=0.55,format=yuv420p"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=0x0A0A0F:s=1920x1080:d={INTRO_SEC}",
        "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo",
        "-t", str(INTRO_SEC),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        "-movflags", "+faststart",
        str(out_path),
    ])


def export_performance(artist: str, start: float, end: float, idx: int) -> None:
    dur = end - start
    name, role, ig = ROSTER[artist]
    folder = STAGES_ART / artist
    vc_folder = VC_ART / artist
    drive_folder = DRIVE_ART / artist
    for d in (folder, vc_folder, drive_folder):
        d.mkdir(parents=True, exist_ok=True)

    intro = folder / f"_intro_{idx:02d}.mp4"
    body = folder / f"_body_{idx:02d}.mp4"
    out169 = folder / f"{idx:02d}_{artist}_ONENESS_Stages_16x9.mp4"
    out916 = folder / f"{idx:02d}_{artist}_ONENESS_Stages_9x16.mp4"
    thumb = folder / f"{idx:02d}_{artist}_thumb.jpg"

    if out169.exists() and out169.stat().st_size > 1_000_000:
        # still mirror
        for dest_dir in (vc_folder, drive_folder):
            shutil.copy2(out169, dest_dir / out169.name)
            if out916.exists():
                shutil.copy2(out916, dest_dir / out916.name)
        log(f"  skip exists {out169.name}")
        return

    log(f"  intro slate {artist}")
    try:
        make_intro_slate(intro, artist)
    except Exception as e:
        log(f"  intro WARN {artist}: {e} — encoding body without intro")
        intro = None

    # body with grade + lower third + outro fade
    fade_out = max(0.0, dur - 2.2)
    name_e = esc_draw(name)
    role_e = esc_draw(role)
    ig_e = esc_draw(ig)
    present_e = esc_draw("Circle D Stages - ONENESS")
    grade = "eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03"
    # lower third: artist after intro feel (on body t=1.2..10), small event tag
    vf = (
        f"scale=1920:1080:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2,{grade},"
        f"fade=t=in:st=0:d=0.45,fade=t=out:st={fade_out:.3f}:d=2.0,"
        f"drawtext=fontfile='{FONT_B}':text='{name_e}':fontsize=46:fontcolor=white:"
        f"borderw=2:bordercolor=black@0.65:x=56:y=h-168:enable='between(t\\,1.0\\,10)',"
        f"drawtext=fontfile='{FONT_R}':text='{role_e}':fontsize=28:fontcolor=white@0.92:"
        f"borderw=1:bordercolor=black@0.5:x=56:y=h-112:enable='between(t\\,1.2\\,10)',"
        f"drawtext=fontfile='{FONT_R}':text='{ig_e}':fontsize=24:fontcolor=#E8C547:"
        f"borderw=1:bordercolor=black@0.5:x=56:y=h-72:enable='between(t\\,1.4\\,10)',"
        f"drawtext=fontfile='{FONT_R}':text='{present_e}':fontsize=22:fontcolor=white@0.75:"
        f"x=56:y=48:enable='between(t\\,0.5\\,8)',"
        f"format=yuv420p"
    )
    # Keep AF light — loudnorm/afftdn made 220s takes ~6h from SD
    af = "highpass=f=60,acompressor=threshold=-18dB:ratio=2:attack=20:release=200:makeup=1.5,alimiter=limit=0.97"
    log(f"  encode body {artist} {dur:.0f}s")
    preset = "ultrafast" if dur >= 120 else "veryfast"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-hwaccel", "d3d11va",
        "-ss", f"{start:.3f}", "-i", str(MASTER), "-t", f"{dur:.3f}",
        "-vf", vf, "-af", af + ",aresample=48000:async=1:first_pts=0",
        "-c:v", "libx264", "-preset", preset, "-crf", "19",
        "-r", "60000/1001", "-fps_mode", "cfr",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        "-movflags", "+faststart",
        str(body),
    ])

    lst = folder / f"_concat_{idx:02d}.txt"
    if intro is not None and intro.exists():
        lst.write_text(f"file '{intro.as_posix()}'\nfile '{body.as_posix()}'\n", encoding="utf-8")
        log(f"  concat intro+body -> {out169.name}")
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy", "-movflags", "+faststart",
            str(out169),
        ])
    else:
        log(f"  body-only -> {out169.name}")
        shutil.copy2(body, out169)

    # 9:16 from 16:9
    log(f"  9x16 {artist}")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-i", str(out169),
        "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(out916),
    ])

    # thumbnail ~40% into body
    ss = max(2.0, dur * 0.4)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", f"{ss:.2f}", "-i", str(body), "-frames:v", "1",
        "-vf", "eq=contrast=1.12:brightness=0.05:saturation=1.04",
        "-q:v", "2", str(thumb),
    ])

    # distribute
    flat169 = f"Stages_{idx:02d}_{artist}_ONENESS_16x9.mp4"
    flat916 = f"Stages_{idx:02d}_{artist}_ONENESS_9x16.mp4"
    for src, dests in [
        (out169, [vc_folder / out169.name, drive_folder / out169.name, SOCIAL_169 / flat169, VC_169 / flat169]),
        (out916, [vc_folder / out916.name, drive_folder / out916.name, SOCIAL_916 / flat916, VC_916 / flat916]),
        (thumb, [vc_folder / thumb.name, drive_folder / thumb.name]),
    ]:
        if not src.exists():
            continue
        for d in dests:
            try:
                d.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, d)
            except Exception as e:
                log(f"  copy WARN {d}: {e}")

    # cleanup temps
    for tmp in (intro, body, lst):
        try:
            if tmp is not None and Path(tmp).exists():
                Path(tmp).unlink()
        except OSError:
            pass


def main() -> int:
    log("=== Artist packages ONENESS / DSC_0324 ===")
    if not MASTER.exists():
        log(f"ERROR missing {MASTER}")
        return 2
    ensure_artist_folders()
    duration = probe_dur(MASTER)
    log(f"master dur={duration:.1f}s")

    frames = list_frames()
    log(f"face frames available: {len(frames)}")
    if len(frames) < 20:
        log("ERROR: need face frames — run face sample first")
        return 3

    log("1) Re-ID frames (fixed Unknown->Wako_Kungo, stricter guests)...")
    timeline_path = LOGS / "face_timeline_0324_v2.json"
    if timeline_path.exists() and os.environ.get("FORCE_REID") != "1":
        timeline = [tuple(x) for x in json.loads(timeline_path.read_text(encoding="utf-8"))]
        log(f"   reuse timeline ({len(timeline)} samples)")
    else:
        timeline = rebuild_timeline(frames)
    counts = Counter(lab for _, lab in timeline)
    log(f"   label counts: {dict(counts)}")

    log("2) Build segments...")
    seg_path = LOGS / "face_segments_0324_v2.json"
    if seg_path.exists() and os.environ.get("FORCE_REID") != "1":
        segments = json.loads(seg_path.read_text(encoding="utf-8"))
        log(f"   reuse segments ({len(segments)})")
    else:
        segments = timeline_to_segments(timeline, duration)
    for s in segments:
        log(f"   SEG {s['artist']}: {s['start']:.0f}-{s['end']:.0f}s ({s['dur']:.0f}s)")

    log("3) Export packages (intro + lower third + 16x9/9x16)...")
    priority = os.environ.get("PRIORITY_ARTISTS", "").strip()
    if priority:
        want = [x.strip() for x in priority.split(",") if x.strip()]
        ordered = []
        for slug in want:
            ordered.extend([s for s in segments if s["artist"] == slug])
        # then remaining not in priority list
        seen = {(s["artist"], s["start"], s["end"]) for s in ordered}
        for s in segments:
            key = (s["artist"], s["start"], s["end"])
            if key not in seen:
                ordered.append(s)
        segments = ordered
        log(f"   priority order: {want} -> {len(segments)} segs")
    for i, seg in enumerate(segments, start=1):
        try:
            export_performance(seg["artist"], seg["start"], seg["end"], i)
        except Exception as e:
            log(f"  EXPORT WARN {seg['artist']}: {e}")

    (LOGS / "DSC0324_PACKAGES_COMPLETE.flag").write_text("ok\n", encoding="utf-8")
    (LOGS / "AGENT_LOOP_WAKE_dsc0324_packages.txt").write_text(
        f"READY segs={len(segments)}\n", encoding="utf-8"
    )
    log(f"DONE packages={len(segments)} -> {VC_ART}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
