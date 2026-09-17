#!/usr/bin/env python3
"""Assemble Editorial 30s exemplars — Instagram 9:16 + YouTube Shorts 9:16.

Dramaturgy: PLACE → EVENT → JAM+PiP → COLLAGE → SUPPORTIVE SPACE → ENERGY →
ATMOSPHERE → COME AS YOU ARE → brand.

Starts from DSC_0918 Full_Takes. Time-of-day never jumps backward.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import (  # noqa: E402
    BRAND,
    OUT,
    PLACE_LINE,
    PLACE_SUB,
    REEL_OUT,
    STATEMENT_BRING,
    STATEMENT_COME,
    STATEMENT_SPACE,
    STATEMENT_SUPPORTIVE,
    STYLE,
    WORK,
)
from media import list_proxies  # noqa: E402

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
W, H = 1080, 1920
TARGET = 30.0


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1400:])


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace(":", "\\:").replace("%", "\\%")


def vf_base(crop: str = "center") -> str:
    # Portrait crop biased to performer (upper-third eyes / center body)
    if crop == "portrait":
        scale = f"scale={int(W*1.55)}:{int(H*1.55)}:force_original_aspect_ratio=increase"
        crop_f = f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.22"
    elif crop == "hands":
        scale = f"scale={int(W*1.5)}:{int(H*1.5)}:force_original_aspect_ratio=increase"
        crop_f = f"crop={W}:{H}:(iw-{W})/2:(ih-{H})*0.55"
    elif crop == "wide":
        scale = f"scale={W}:{H}:force_original_aspect_ratio=increase"
        crop_f = f"crop={W}:{H}"
    else:
        scale = f"scale={int(W*1.25)}:{int(H*1.25)}:force_original_aspect_ratio=increase"
        crop_f = f"crop={W}:{H}"
    grade = "eq=contrast=1.08:brightness=0.01:saturation=0.97:gamma=1.03,hqdn3d=1.1:0.8:2.0:1.4"
    return f"{scale},{crop_f},{grade},fps=25,format=yuv420p"


def pick_pool(rows: list[dict]) -> dict[str, list[dict]]:
    z_early = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "early" and not r["filler"]]
    z_night = [r for r in rows if r["camera"] == "Z50II" and r["era"] == "night" and not r["filler"]]
    d850 = [r for r in rows if r["camera"] == "D850" and r["era"] == "early"]
    guests = [r for r in rows if r.get("guest") or r["camera"] in ("PHONE", "GUEST")]
    guests_night = [r for r in guests if r["era"] == "night"]
    crowd = [r for r in rows if r["artist"] in ("Event_Broll", "Guest_Broll")]
    return {
        "z_early": z_early,
        "z_night": z_night,
        "d850": d850,
        "guests": guests,
        "guests_night": guests_night,
        "crowd": crowd,
        "all_z": z_early + z_night,
    }


def find_pip(main: dict, pool: list[dict], used: set[str], prefer_same_artist: bool = True) -> dict | None:
    """PiP must add info: other angle / detail / crowd / other artist — never same file."""
    cands = []
    for r in pool:
        if str(r["path"]) == str(main["path"]):
            continue
        if str(r["path"]) in used:
            continue
        # same era only
        if r["era"] != main["era"]:
            continue
        # prefer same artist alternate / D850 / crowd
        score = 0
        if prefer_same_artist and r["artist"] == main["artist"] and r["camera"] != main["camera"]:
            score += 5
        elif prefer_same_artist and r["artist"] == main["artist"]:
            score += 3
        elif r["artist"] == "Event_Broll" or r["camera"] == "D850":
            score += 4
        elif r["artist"] != main["artist"]:
            score += 2  # other artist dialogue
        if abs(r["dsc"] - main["dsc"]) <= 40:
            score += 2
        if score >= 2:
            cands.append((score, r))
    if not cands:
        return None
    cands.sort(key=lambda x: (-x[0], abs(x[1]["dsc"] - main["dsc"])))
    return cands[0][1]


def render_plain(src: Path, out: Path, ss: float, take: float, crop: str = "center") -> Path:
    if out.exists() and out.stat().st_size > 40_000:
        return out
    af = "aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.95"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", f"{ss:.2f}", "-i", str(src), "-t", f"{take:.2f}",
        "-vf", vf_base(crop), "-af", af,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        str(out),
    ])
    return out


def render_pip(main: dict, pip: dict, out: Path, take: float, *, main_ss: float, pip_ss: float) -> Path:
    """Fullscreen main + informational PiP (portrait crop) bottom-right."""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    pw, ph = 340, 520  # portrait PiP
    mx, my = W - pw - 36, H - ph - 90
    main_vf = vf_base("center")
    pip_vf = (
        f"scale={int(pw*1.55)}:{int(ph*1.55)}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph}:(iw-{pw})/2:(ih-{ph})*0.2,"
        "eq=contrast=1.1:saturation=0.98,format=yuv420p"
    )
    fc = (
        f"[0:v]{main_vf}[base];"
        f"[1:v]{pip_vf},fps=25[pip];"
        f"[base][pip]overlay={mx}:{my}:enable='gte(t,0.15)'[v]"
    )
    af = (
        "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,"
        "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.95[a]"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", f"{main_ss:.2f}", "-t", f"{take:.2f}", "-i", str(main["path"]),
        "-ss", f"{pip_ss:.2f}", "-t", f"{take:.2f}", "-i", str(pip["path"]),
        "-filter_complex", f"{fc};{af}",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-shortest",
        str(out),
    ])
    return out


def render_collage(main: dict, a: dict, b: dict, out: Path, take: float) -> Path:
    """Signature move: main + two small windows (1–2s beat)."""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    pw, ph = 300, 420
    main_vf = vf_base("wide")
    small = (
        f"scale={int(pw*1.5)}:{int(ph*1.5)}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph}:(iw-{pw})/2:(ih-{ph})*0.22,format=yuv420p,fps=25"
    )
    fc = (
        f"[0:v]{main_vf}[base];"
        f"[1:v]{small}[p1];"
        f"[2:v]{small}[p2];"
        f"[base][p1]overlay=40:H-ph-120[tmp];"
        f"[tmp][p2]overlay=W-pw-40:H-ph-120[v]".replace("pw", str(pw)).replace("ph", str(ph)).replace("H-ph", f"{H}-{ph}").replace("W-pw", f"{W}-{pw}")
    )
    # fix overlay coords explicitly
    fc = (
        f"[0:v]{main_vf}[base];"
        f"[1:v]{small}[p1];"
        f"[2:v]{small}[p2];"
        f"[base][p1]overlay=40:{H - ph - 120}[tmp];"
        f"[tmp][p2]overlay={W - pw - 40}:{H - ph - 120}[v]"
    )
    af = "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=11[a]"
    ss0 = min(2.0, max(0.0, main["duration"] * 0.2))
    ss1 = min(2.0, max(0.0, a["duration"] * 0.35))
    ss2 = min(2.0, max(0.0, b["duration"] * 0.4))
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", f"{ss0:.2f}", "-t", f"{take:.2f}", "-i", str(main["path"]),
        "-ss", f"{ss1:.2f}", "-t", f"{take:.2f}", "-i", str(a["path"]),
        "-ss", f"{ss2:.2f}", "-t", f"{take:.2f}", "-i", str(b["path"]),
        "-filter_complex", f"{fc};{af}",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out),
    ])
    return out


def burn_text(src: Path, out: Path, lines: list[tuple[str, str]], fade: float = 0.25) -> Path:
    """lines: (text, role title|gold|body|brush)"""
    if out.exists() and out.stat().st_size > 40_000:
        return out
    draws = []
    n = len(lines)
    y0 = 720 if n <= 2 else 640
    for i, (text, role) in enumerate(lines):
        if role == "title":
            fs, color, font = 72, "white", FONT_B
        elif role == "gold":
            fs, color, font = 44, "#E8C547", FONT_B
        elif role == "brush":
            fs, color, font = 58, "white", FONT_B
        else:
            fs, color, font = 36, "white@0.92", FONT_R
        draws.append(
            f"drawtext=fontfile='{font}':text='{esc(text)}':fontsize={fs}:"
            f"fontcolor={color}:borderw=2:bordercolor=black@0.45:"
            f"x=(w-text_w)/2:y={y0 + i * 78}"
        )
    vf = ",".join(draws) if draws else "null"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        str(out),
    ])
    return out


def concat_copy(parts: list[Path], out: Path) -> Path:
    lst = out.with_suffix(".txt")
    lst.write_text("\n".join(f"file '{p.as_posix()}'" for p in parts), encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out


def ss_take(clip: dict, prefer: float = 0.25) -> tuple[float, float]:
    dur = clip["duration"]
    take = min(3.2, max(1.4, dur * 0.15))
    ss = max(0.0, min(dur - take - 0.05, dur * prefer))
    return ss, take


def build_timeline(rows: list[dict]) -> list[dict]:
    pool = pick_pool(rows)
    early = pool["z_early"]
    night = pool["z_night"]
    d850 = pool["d850"]
    guests_n = pool["guests_night"] or pool["guests"]
    if not early:
        raise RuntimeError("no early Z50II from DSC_0918+")
    # force start at 918 if present
    start = next((r for r in early if r["dsc"] == 918), early[0])
    early_rest = [r for r in early if r["path"] != start["path"]]
    jam_main = early_rest[2] if len(early_rest) > 2 else early_rest[0]
    # PiP: D850 early OR guest night — informational second angle
    pip1 = find_pip(jam_main, d850 + early_rest, set(), prefer_same_artist=True)
    night_pick = night[:: max(1, len(night) // 8)][:8] if night else early_rest[-6:]
    crowd = [r for r in early + night if r["artist"] == "Event_Broll"] or early_rest[-3:]
    # rotate guest sources for collage / energy (Chris / René / Phone)
    guest_chris = [g for g in guests_n if "CHRIS" in g["path"].name.upper()]
    guest_rene = [g for g in guests_n if "RENE" in g["path"].name.upper()]
    guest_phone = [g for g in guests_n if g["camera"] == "PHONE" or "PHONE" in g["path"].name.upper()]

    beats = []
    arrival_srcs = [start] + early_rest[:2]
    beats.append({"beat": "ARRIVAL", "dur": 3.0, "clips": arrival_srcs, "layout": "cuts",
                  "text": [(PLACE_LINE, "title"), (PLACE_SUB, "body")]})
    title_src = early_rest[1] if len(early_rest) > 1 else jam_main
    beats.append({"beat": "TITLE", "dur": 2.0, "clips": [title_src], "layout": "overlay",
                  "text": [("WAKO KUNGO", "brush"), ("LIVE IN LAPA71", "gold")]})
    beats.append({"beat": "JAM", "dur": 6.0, "clips": [jam_main], "pip": pip1, "layout": "main_pip", "text": None})
    # Collage after jam — use guest night perspectives (Chris + Phone/René)
    c1 = (guest_chris[0] if guest_chris else None) or pip1 or (d850[0] if d850 else early_rest[3])
    c2 = (guest_phone[0] if guest_phone else None) or (guest_rene[0] if guest_rene else None) or early_rest[4]
    collage_main = night_pick[0] if night_pick else jam_main
    beats.append({"beat": "COLLAGE", "dur": 3.0, "clips": [collage_main, c1, c2], "layout": "collage", "text": None})
    # Connection: prefer René/phone face/crowd (portrait)
    people_src = (guest_rene[1] if len(guest_rene) > 1 else None) or (guest_phone[1] if len(guest_phone) > 1 else None) or night_pick[0]
    beats.append({"beat": "CONNECTION", "dur": 4.0, "clips": [people_src], "layout": "people",
                  "text": [(STATEMENT_SUPPORTIVE, "brush")], "era_lock": people_src["era"]})
    e_main = night_pick[1] if len(night_pick) > 1 else night_pick[0]
    e_pip = (guest_chris[1] if len(guest_chris) > 1 else None) or (guest_rene[2] if len(guest_rene) > 2 else None)
    if not e_pip:
        e_pip = find_pip(e_main, guests_n + night_pick, set(), prefer_same_artist=False)
    beats.append({"beat": "ENERGY", "dur": 5.0, "clips": [e_main], "pip": e_pip, "layout": "dialog_pip", "text": None})
    atm = guest_chris[2] if len(guest_chris) > 2 else (night_pick[2] if len(night_pick) > 2 else e_main)
    beats.append({"beat": "ATMOSPHERE", "dur": 3.0, "clips": [atm], "layout": "breath",
                  "text": [(STATEMENT_SPACE, "gold")]})
    pay = night_pick[3] if len(night_pick) > 3 else atm
    beats.append({"beat": "PAYOFF", "dur": 4.0, "clips": [pay], "layout": "payoff",
                  "text": [(STATEMENT_COME, "brush"), (STATEMENT_BRING, "brush"), (BRAND, "gold")]})
    return beats


def assemble_reel(work: Path, final: Path, beats: list[dict]) -> dict:
    work.mkdir(parents=True, exist_ok=True)
    for old in work.glob("*.mp4"):
        old.unlink(missing_ok=True)
    parts: list[Path] = []
    decisions = []
    used: set[str] = set()

    for i, b in enumerate(beats):
        dur = float(b["dur"])
        layout = b["layout"]
        raw = work / f"{i:02d}_{b['beat']}_raw.mp4"
        labeled = work / f"{i:02d}_{b['beat']}.mp4"
        print(f"  beat {b['beat']} {layout} {dur:.1f}s", flush=True)

        if layout == "cuts":
            # 2–3 micro cuts totaling dur
            clips = b["clips"][:3]
            each = dur / max(1, len(clips))
            micros = []
            for j, c in enumerate(clips):
                ss, _ = ss_take(c, 0.15 + j * 0.1)
                mp = work / f"{i:02d}_cut{j}.mp4"
                render_plain(c["path"], mp, ss, each, crop="wide" if j == 0 else "center")
                micros.append(mp)
                used.add(str(c["path"]))
            concat_copy(micros, raw)
        elif layout in ("main_pip", "dialog_pip") and b.get("pip"):
            main = b["clips"][0]
            pip = b["pip"]
            mss = min(3.0, main["duration"] * 0.25)
            pss = min(3.0, pip["duration"] * 0.35)
            render_pip(main, pip, raw, dur, main_ss=mss, pip_ss=pss)
            used.add(str(main["path"]))
            used.add(str(pip["path"]))
            decisions.append({"beat": b["beat"], "main": main["dsc"], "pip": pip["dsc"],
                              "pip_artist": pip["artist"], "main_artist": main["artist"]})
        elif layout == "collage":
            main, a, c = b["clips"][0], b["clips"][1], b["clips"][2]
            render_collage(main, a, c, raw, dur)
        else:
            c = b["clips"][0]
            crop = "portrait" if layout in ("people", "payoff") else ("wide" if layout == "breath" else "center")
            ss, _ = ss_take(c, 0.3)
            # stretch take to beat dur
            take = min(dur, max(1.2, c["duration"] - ss - 0.05))
            # if clip shorter, still use take; pad later via -t on text pass
            render_plain(c["path"], raw, ss, min(dur, take), crop=crop)
            if take + 0.15 < dur:
                # loop pad by re-encode trim to dur with tpad
                pad = work / f"{i:02d}_pad.mp4"
                run([
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                    "-stream_loop", "-1", "-i", str(raw), "-t", f"{dur:.2f}",
                    "-c", "copy", str(pad),
                ])
                raw = pad

        if b.get("text"):
            burn_text(raw, labeled, b["text"])
            parts.append(labeled)
        else:
            parts.append(raw)

    body = work / "reel_body.mp4"
    concat_copy(parts, body)
    # final loudnorm + soft fades
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(body),
        "-vf", "fade=t=in:st=0:d=0.2,fade=t=out:st=28.7:d=1.1,format=yuv420p",
        "-af", "afade=t=in:st=0:d=0.25,afade=t=out:st=28.7:d=1.1,loudnorm=I=-14:TP=-1.5:LRA=11",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k", "-t", f"{TARGET:.2f}",
        str(final),
    ])
    return {"output": str(final), "style": STYLE, "decisions": decisions, "beats": [b["beat"] for b in beats]}


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    REEL_OUT.mkdir(parents=True, exist_ok=True)
    print("catalog Full_Takes…", flush=True)
    rows = list_proxies()
    print(
        f"  clips={len(rows)} early={sum(1 for r in rows if r['era']=='early')} "
        f"night={sum(1 for r in rows if r['era']=='night')}",
        flush=True,
    )
    beats = build_timeline(rows)

    ig = REEL_OUT / "WK_LAPA71_EDITORIAL_30s_IG_9x16.mp4"
    yt = REEL_OUT / "WK_LAPA71_EDITORIAL_30s_YT_9x16.mp4"
    work_ig = WORK / "reel_ig"
    print("== Instagram 9:16 ==", flush=True)
    meta = assemble_reel(work_ig, ig, beats)
    # YouTube Shorts exemplar = same master (platform copy)
    print("== YouTube Shorts 9:16 ==", flush=True)
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(ig), "-c", "copy", str(yt)])
    # also mirror under Editorial drafts
    ig2 = OUT / "Lapa71_Editorial_30s_IG_9x16.mp4"
    yt2 = OUT / "Lapa71_Editorial_30s_YT_9x16.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(ig), "-c", "copy", str(ig2)])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(yt), "-c", "copy", str(yt2)])

    project = {
        **meta,
        "instagram": str(ig),
        "youtube_shorts": str(yt),
        "statement": STATEMENT_SUPPORTIVE,
        "start_dsc": 918,
        "rule": "PiP=INFORMATION; no day/night backjump",
    }
    (OUT / "editorial_30s_project.json").write_text(json.dumps(project, indent=2), encoding="utf-8")
    print("DONE IG", ig, f"MB={ig.stat().st_size/1e6:.0f}")
    print("DONE YT", yt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
