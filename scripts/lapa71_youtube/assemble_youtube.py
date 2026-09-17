#!/usr/bin/env python3
"""Assemble Lapa71 YouTube 16:9 from Z50II MAINROLL + matched D850 B-roll.

Pipeline:
  1) Chronological Z50II Stages spine (story)
  2) D850 inserts only when artist/time neighborhood matches
  3) Intro cards + English end credits
  4) Natural performance audio (no fake lip-sync inventing)

When uncertain: keep Mainroll.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import (  # noqa: E402
    ARTISTS,
    BRAND,
    CATALOG,
    EVENT_SUB,
    EVENT_TITLE,
    FINAL,
    INTRO,
    KEEP_MAINROLL_THRESHOLD,
    LIGHTING_EARLY_DSC_MAX,
    LIGHTING_NIGHT_DSC_MIN,
    MIN_CONFIDENCE_TO_INSERT,
    OUT,
    PROJECT,
    SERIES,
    TARGET_MAX,
    TARGET_MIN,
    W,
    H,
    WORK,
    YOUTUBE_LIGHTING_ERA,
)

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
STRIP_INTRO = 5.5  # Stages cuts often have burned lower-third
XFADE = 0.35


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1200:])


def probe_dur(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out or 0)


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:").replace("%", "\\%")


def dsc_num(name: str) -> int:
    m = re.search(r"DSC_(\d+)", name, re.I)
    return int(m.group(1)) if m else 10**9


def is_d850(name: str) -> bool:
    return "D850" in name.upper()


def is_filler(name: str) -> bool:
    n = name.lower()
    return any(k in n for k in ("filler", "break", "miccheck", "conversatione"))


def list_stages() -> list[dict]:
    rows = []
    for artist_dir in ARTISTS.iterdir():
        if not artist_dir.is_dir():
            continue
        artist = artist_dir.name
        if artist in ("Unknown",):
            continue
        for p in (artist_dir / "Stages").glob("*.mp4"):
            if p.stat().st_size < 100_000:
                continue
            try:
                d = probe_dur(p)
            except Exception:
                continue
            if d < 8:
                continue
            rows.append({
                "path": p,
                "artist": artist,
                "dsc": dsc_num(p.name),
                "camera": "D850" if is_d850(p.name) else "Z50II",
                "duration": d,
                "filler": is_filler(p.name) or artist == "Event_Broll",
            })
    rows.sort(key=lambda r: (r["dsc"], r["camera"] != "Z50II", r["path"].name))
    return rows


def lighting_era(dsc: int) -> str:
    """Coarse lighting world from DSC chronology — never mix early with night."""
    if dsc <= LIGHTING_EARLY_DSC_MAX:
        return "early"
    if dsc >= LIGHTING_NIGHT_DSC_MIN:
        return "night"
    return "mid"


def pick_mainroll(rows: list[dict], budget_sec: float) -> list[dict]:
    """Z50II spine in ONE lighting era only (default: night). No day/night mix."""
    era = YOUTUBE_LIGHTING_ERA
    z50 = [
        r for r in rows
        if r["camera"] == "Z50II"
        and not r["filler"]
        and r["duration"] >= 16
        and lighting_era(r["dsc"]) == era
    ]

    must = ["Manu", "Arpanito", "Elisa", "Ana", "Mr_Isaac", "Humble"]
    priority = set(must) | {
        "Maryna_Vadini", "Arif", "Leonnardo_Melo", "Zema",
    }
    picked: list[dict] = []
    used_dsc: set[int] = set()
    used_paths: set[str] = set()

    def add_clip(r: dict, take: float | None = None) -> float:
        if str(r["path"]) in used_paths or r["dsc"] in used_dsc:
            return 0.0
        take = take if take is not None else min(38.0, max(16.0, r["duration"] - STRIP_INTRO - 1.0))
        if take < 12:
            return 0.0
        picked.append({**r, "take": take, "role": "MAINROLL", "band": era})
        used_dsc.add(r["dsc"])
        used_paths.add(str(r["path"]))
        return take

    pool = sorted(z50, key=lambda r: (r["dsc"], -min(r["duration"], 100)))
    total_b = 0.0

    # Reserve one strong clip per must-show artist first
    for artist in must:
        cands = [r for r in pool if r["artist"] == artist and str(r["path"]) not in used_paths]
        if not cands:
            continue
        cands.sort(key=lambda r: -r["duration"])
        total_b += add_clip(cands[0])
        if total_b >= budget_sec:
            break

    last_artist = None
    streak = 0
    for r in pool:
        if str(r["path"]) in used_paths or r["dsc"] in used_dsc:
            continue
        if r["artist"] not in priority and total_b > budget_sec * 0.45:
            continue
        if r["artist"] == last_artist:
            streak += 1
            if streak >= 2:
                continue
        else:
            streak = 0
        take = min(38.0, max(16.0, r["duration"] - STRIP_INTRO - 1.0))
        if total_b + take > budget_sec + 25:
            if total_b >= budget_sec * 0.7:
                continue
            take = max(12.0, budget_sec - total_b)
            if take < 12:
                continue
        total_b += add_clip(r, take)
        last_artist = r["artist"]
        if total_b >= budget_sec:
            break

    picked.sort(key=lambda r: r["dsc"])
    return picked


def score_broll(main: dict, cand: dict) -> dict:
    """Hard matches: same lighting era + artist + session/time. Soft: audio."""
    # HARD RULE: never mix early/day with night lighting
    if lighting_era(main["dsc"]) != lighting_era(cand["dsc"]):
        return {
            "score": 0.0,
            "artist_match": 0.0,
            "time_match": 0.0,
            "song_match": 0.0,
            "performance_match": 0.0,
            "same_session": False,
            "gap_dsc": abs(cand["dsc"] - main["dsc"]),
            "reason": "lighting_era_mismatch",
        }

    same_artist = cand["artist"] == main["artist"]
    artist = 1.0 if same_artist else (0.5 if cand["artist"] == "Event_Broll" else 0.0)

    gap = abs(cand["dsc"] - main["dsc"])
    if gap <= 3:
        time_s = 1.0
    elif gap <= 8:
        time_s = 0.9
    elif gap <= 15:
        time_s = 0.7
    elif gap <= 30:
        time_s = 0.45
    else:
        time_s = 0.1

    same_session = (
        main.get("session_id")
        and cand.get("session_id")
        and main["session_id"] == cand["session_id"]
    )
    performance = 0.95 if same_session else (0.8 if same_artist and time_s >= 0.7 else 0.35)

    from sessions import song_similarity  # local import

    song = song_similarity(main.get("audio") or {}, cand.get("audio") or {})
    if same_session:
        song = max(song, 0.7)

    emotion = 0.65 if cand["artist"] == "Event_Broll" else 0.55
    angle = 0.9 if cand["camera"] == "D850" else 0.5
    movement = 0.55
    quality = 0.6

    score = (
        0.25 * artist
        + 0.20 * song
        + 0.15 * time_s
        + 0.15 * performance
        + 0.10 * emotion
        + 0.05 * angle
        + 0.05 * movement
        + 0.05 * quality
    )
    reason = "weak"
    if same_session and same_artist:
        reason = "same_session_artist"
    elif same_artist and time_s >= 0.7:
        reason = "same_artist_near_time"
    elif cand["artist"] == "Event_Broll" and time_s >= 0.7:
        reason = "crowd_context_near_time"

    return {
        "score": round(score, 3),
        "artist_match": artist,
        "time_match": time_s,
        "song_match": song,
        "performance_match": performance,
        "same_session": bool(same_session),
        "gap_dsc": gap,
        "reason": reason,
    }


def find_broll(main: dict, rows: list[dict], used: set[str]) -> dict | None:
    # Same lighting era only — never early D850 into night mainroll
    main_era = lighting_era(main["dsc"])
    max_gap = 35 if main_era == "early" else 20
    cands = [
        r for r in rows
        if r["camera"] == "D850"
        and str(r["path"]) not in used
        and r["duration"] >= 8
        and lighting_era(r["dsc"]) == main_era
        and abs(r["dsc"] - main["dsc"]) <= max_gap
    ]
    best = None
    best_sc = None
    for c in cands:
        sc = score_broll(main, c)
        if sc["score"] < MIN_CONFIDENCE_TO_INSERT:
            continue
        if sc["artist_match"] < 0.9 and sc["score"] < KEEP_MAINROLL_THRESHOLD + 0.08:
            continue
        if best_sc is None or sc["score"] > best_sc["score"]:
            best, best_sc = c, sc
    if not best:
        return None
    take = min(6.0, max(3.5, best["duration"] * 0.25))
    return {**best, "take": take, "role": "BROLL", "match": best_sc}


def vf_main() -> str:
    return (
        f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,"
        "eq=contrast=1.05:brightness=0.01:saturation=0.97:gamma=1.03,"
        "hqdn3d=1.2:0.9:2.0:1.5,fps=25,format=yuv420p"
    )


def render_segment(src: Path, out: Path, ss: float, take: float, *, label: str) -> Path | None:
    if out.exists() and out.stat().st_size > 80_000:
        return out
    dur = probe_dur(src)
    if dur < 3:
        return None
    ss = max(0.0, min(ss, max(0.0, dur - take - 0.05)))
    if ss + take > dur:
        take = max(2.0, dur - ss)
    af = "aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=10,alimiter=limit=0.96"
    print(f"  render [{label}] {src.name} @{ss:.1f}s +{take:.1f}s", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-ss", f"{ss:.3f}", "-i", str(src), "-t", f"{take:.3f}",
        "-vf", vf_main(), "-af", af,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out if out.exists() and out.stat().st_size > 50_000 else None


def still_card(img: Path, out: Path, sec: float) -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    vf = (
        f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black,"
        f"fade=t=in:st=0:d=0.25,fade=t=out:st={max(0.0, sec-0.35):.2f}:d=0.3,"
        "fps=25,format=yuv420p"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(img),
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", f"{sec:.2f}", "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def text_card(lines: list[tuple[str, str]], out: Path, sec: float) -> Path:
    """lines: (text, role) role in title|gold|body"""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draws = []
    y0 = 360
    for i, (text, role) in enumerate(lines):
        if role == "title":
            fs, color, font = 64, "white", FONT_B
        elif role == "gold":
            fs, color, font = 40, "#E8C547", FONT_B
        else:
            fs, color, font = 32, "white@0.9", FONT_R
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(text)}':fontsize={fs}:"
            f"fontcolor={color}:x=(w-text_w)/2:y={y0 + i * 70}"
        )
    draws.append(f"fade=t=in:st=0:d=0.3,fade=t=out:st={max(0.0, sec-0.4):.2f}:d=0.35")
    vf = ",".join(draws)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d={sec:.2f}:r=25",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-vf", vf, "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def credits_card(artists: list[str], out: Path, sec: float = 12.0) -> Path:
    lines = [
        ("Thank you", "title"),
        ("Tagus Drop Rhythm · Lapa71", "gold"),
        ("", "body"),
    ]
    # flatten into drawtext manually for denser credits
    if out.exists() and out.stat().st_size > 40_000:
        return out
    body = ["Artists & Contributors"] + artists[:14]
    if len(artists) > 14:
        body.append("... and the whole Circle")
    body += ["", "Purpose · Unity · Learn & Teach · Supported Space", BRAND, SERIES]
    draws = []
    for i, line in enumerate(["Thank you", "to everyone who made this night possible", ""] + body):
        if not line:
            continue
        if i == 0:
            fs, color, font = 52, "white", FONT_B
        elif "Tagus" in line or "WAKO" in line or line == BRAND:
            fs, color, font = 28, "#E8C547", FONT_B
        elif line.startswith("Purpose"):
            fs, color, font = 22, "white@0.75", FONT_R
        else:
            fs, color, font = 24, "white@0.9", FONT_R
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(line)}':fontsize={fs}:"
            f"fontcolor={color}:x=(w-text_w)/2:y={120 + i * 48}"
        )
    draws.append(f"fade=t=in:st=0:d=0.4,fade=t=out:st={max(0.0, sec-0.7):.2f}:d=0.6")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d={sec:.2f}:r=25",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-vf", ",".join(draws), "-t", f"{sec:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        str(out),
    ])
    return out


def xfade_concat(parts: list[Path], out: Path, fade: float = XFADE) -> Path:
    if len(parts) == 1:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(parts[0]), "-c", "copy", str(out)])
        return out
    durs = [probe_dur(p) for p in parts]
    inputs: list[str] = []
    for p in parts:
        inputs += ["-i", str(p)]
    vfilters = []
    afilters = []
    vlabel = "0:v"
    alabel = "0:a"
    acc = durs[0]
    for i in range(1, len(parts)):
        offset = max(0.05, acc - fade)
        vo, ao = f"v{i}", f"a{i}"
        vfilters.append(
            f"[{vlabel}][{i}:v]xfade=transition=fade:duration={fade:.2f}:offset={offset:.3f}[{vo}]"
        )
        afilters.append(
            f"[{alabel}][{i}:a]acrossfade=d={fade:.2f}:c1=tri:c2=tri[{ao}]"
        )
        vlabel, alabel = vo, ao
        acc = offset + durs[i]
    fc = ";".join(vfilters + afilters)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        *inputs,
        "-filter_complex", fc,
        "-map", f"[{vlabel}]", "-map", f"[{alabel}]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(out),
    ])
    return out


def main() -> int:
    from sessions import assign_sessions, enrich_audio_profiles

    OUT.mkdir(parents=True, exist_ok=True)
    if WORK.exists():
        for old in WORK.glob("*.mp4"):
            old.unlink(missing_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)

    if not CATALOG.exists():
        print("run ingest.py first", flush=True)
        subprocess.check_call([sys.executable, str(HERE / "ingest.py")])

    rows = list_stages()
    print("assign performance sessions…", flush=True)
    sessions = assign_sessions(rows)
    print(f"  sessions={len(sessions)}", flush=True)
    print("audio profiles (capped)…", flush=True)
    import os
    audio_limit = int(os.environ.get("LAPA71_AUDIO_LIMIT", "48"))
    if audio_limit > 0:
        enrich_audio_profiles(rows, limit=audio_limit)
    else:
        print("  skipped (LAPA71_AUDIO_LIMIT=0)", flush=True)

    # map audio/session onto spine candidates by path
    by_path = {str(r["path"]): r for r in rows}

    budget = TARGET_MAX * 60 - 40  # leave room for intro/credits
    spine = pick_mainroll(rows, budget)
    for m in spine:
        src = by_path.get(str(m["path"]), {})
        m["session_id"] = src.get("session_id")
        m["audio"] = src.get("audio")
    print(f"mainroll clips={len(spine)} ~{sum(c['take'] for c in spine)/60:.1f} min", flush=True)
    bands = {}
    for m in spine:
        bands[m.get("band", "?")] = bands.get(m.get("band", "?"), 0) + 1
    eras = sorted({lighting_era(m["dsc"]) for m in spine})
    print(f"  lighting={YOUTUBE_LIGHTING_ERA} eras_in_cut={eras} bands={bands}", flush=True)
    print(f"  artists={sorted({m['artist'] for m in spine})}", flush=True)
    if len(eras) > 1:
        raise RuntimeError(f"lighting mix blocked: {eras}")

    timeline = []
    used_broll: set[str] = set()
    for i, main in enumerate(spine):
        timeline.append(main)
        # Every mainroll: try D850 if score clears gate (early window has most D850)
        br = find_broll(main, rows, used_broll)
        if br:
            used_broll.add(str(br["path"]))
            timeline.append(br)
            print(
                f"  BROLL +{br['artist']} DSC{br['dsc']} "
                f"score={br['match']['score']} ({br['match']['reason']}) "
                f"sess={br['match'].get('same_session')}",
                flush=True,
            )
        else:
            print(f"  KEEP MAINROLL {main['artist']} DSC{main['dsc']} (no safe B-roll)", flush=True)

    parts: list[Path] = []
    # Intro
    cdf = INTRO / "01_circle_d_flow_presents.png"
    stages = INTRO / "02_circle_d_stages.png"
    if cdf.exists():
        parts.append(still_card(cdf, WORK / "00_cdf.mp4", 2.4))
    if stages.exists():
        parts.append(still_card(stages, WORK / "01_stages.mp4", 2.2))
    parts.append(text_card([
        ("Wako Kungo presents", "title"),
        (EVENT_TITLE, "gold"),
        (EVENT_SUB, "body"),
    ], WORK / "02_event.mp4", 3.2))

    decisions = []
    for i, clip in enumerate(timeline):
        src = clip["path"]
        take = float(clip["take"])
        if clip["role"] == "MAINROLL":
            ss = STRIP_INTRO if clip["duration"] > STRIP_INTRO + take + 2 else max(0.0, clip["duration"] * 0.12)
        else:
            ss = max(0.0, clip["duration"] * 0.35)
        out = WORK / f"{i+10:03d}_{clip['role']}_{clip['artist'][:12]}.mp4"
        ok = render_segment(src, out, ss, take, label=clip["role"])
        if ok:
            parts.append(ok)
            decisions.append({
                "index": i,
                "role": clip["role"],
                "artist": clip["artist"],
                "camera": clip["camera"],
                "dsc": clip["dsc"],
                "source": str(src),
                "in": round(ss, 2),
                "take": round(take, 2),
                "match": clip.get("match"),
            })

    # Credits from registry / spine artists
    artists = []
    seen = set()
    for c in spine:
        if c["artist"] not in seen and c["artist"] != "Event_Broll":
            seen.add(c["artist"])
            artists.append(c["artist"].replace("_", " "))
    parts.append(credits_card(artists, WORK / "zz_credits.mp4", 11.0))

    print(f"xfade assemble {len(parts)} parts", flush=True)
    body = WORK / "youtube_body.mp4"
    xfade_concat(parts, body, fade=XFADE)

    dur = probe_dur(body)
    print(f"body {dur/60:.1f} min — final fade", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(body),
        "-vf", f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1,format=yuv420p",
        "-af", f"afade=t=in:st=0:d=0.3,afade=t=out:st={max(0.0, dur-1.2):.2f}:d=1.1",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        str(FINAL),
    ])

    project = {
        "title": f"{EVENT_TITLE} — {SERIES}",
        "brand": BRAND,
        "principle": "CONNECTION OVER PERFECTION",
        "lighting_era": YOUTUBE_LIGHTING_ERA,
        "lighting_rule": "never mix early/day with night",
        "mainroll_camera": "Z50II",
        "broll_cameras": ["D850"],
        "duration_sec": probe_dur(FINAL),
        "output": str(FINAL),
        "decisions": decisions,
        "stats": {
            "mainroll_clips": sum(1 for d in decisions if d["role"] == "MAINROLL"),
            "broll_inserts": sum(1 for d in decisions if d["role"] == "BROLL"),
            "artists": artists,
            "dsc_range": [
                min((d["dsc"] for d in decisions), default=0),
                max((d["dsc"] for d in decisions), default=0),
            ],
        },
    }
    PROJECT.write_text(json.dumps(project, indent=2), encoding="utf-8")
    print(
        "DONE", FINAL,
        f"{project['duration_sec']/60:.1f} min",
        f"MB={FINAL.stat().st_size/1e6:.0f}",
        f"main={project['stats']['mainroll_clips']} broll={project['stats']['broll_inserts']}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
