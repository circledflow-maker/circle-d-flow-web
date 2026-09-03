#!/usr/bin/env python3
"""3 social moments (9:16) per artist - Destiny 31July batch 003 (DSC_0322 + Guest 0325 + Manu 0326)."""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

os.environ["FONTCONFIG_FILE"] = r"D:\circle-d-flow-web\scripts\fonts\fonts.conf"
os.environ["FONTCONFIG_PATH"] = r"D:\circle-d-flow-web\scripts\fonts"

ROOT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\003")
MASTER = Path(r"F:\DCIM\106NZ502\DSC_0322.MOV")
LOGS = ROOT / "00_logs"
OUT_SOCIAL = ROOT / "04_videos_compressed" / "Social_Moments"
OUT_STAGES = ROOT / "05_Format_Drafts" / "Circle_D_Stages" / "03_Shorts_Moments"
OUT_DRIVE = ROOT / "06_drive_ready" / "Circle_D_Stages" / "Social_Moments"
TMP = Path(os.environ.get("DESTINY_0322_WORK", r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\003\00_work"))

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
MOMENT_SEC = 12.0
FPS = "60000/1001"

# slug, display, ig, set_start, set_end, local_body (on D: work)
ARTISTS = [
    ("Nicke_Klein", "Nicke Klein", "@nickeklein", 0.0, 900.0, TMP / "Nicke_Klein" / "body.mp4"),
    ("July_Tilie", "July Tilie", "@julytilie", 900.0, 1440.0, TMP / "July_Tilie" / "body.mp4"),
    ("Mistah_Isaac", "Mr Isaac & Joao & Edo & C-Riz", "ONENESS Live", 1440.0, 1800.0, TMP / "Mistah_Isaac" / "body.mp4"),
    ("C-Riz", "C-Riz", "@c_riz.official", 1800.0, 1980.0, TMP / "C-Riz" / "body.mp4"),
    ("Finale_Baseck", "Baseck & Edoardo & Joao", "@basseck.mankabu", 1980.0, 2693.9, TMP / "Finale_Baseck" / "body.mp4"),
    ("Guest_Artist", "Special Performance", "ONENESS - Sunset Destination Hostel", 0.0, 162.9, TMP / "Guest_Artist" / "body.mp4"),
    ("Manu_Allegro", "Manu Allegro", "@manuallegro", 0.0, 525.1, TMP / "Manu_Allegro" / "body.mp4"),
]


def log(msg: str) -> None:
    print(msg, flush=True)
    LOGS.mkdir(parents=True, exist_ok=True)
    with open(LOGS / "social_moments.log", "a", encoding="utf-8") as f:
        f.write(msg + "\n")


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-1200:])


def moment_starts(a: float, b: float) -> list[float]:
    dur = b - a
    return [a + dur * p for p in (0.20, 0.50, 0.78)]


def export_moment(slug: str, name: str, ig: str, abs_start: float, idx: int, src: Path, src_offset: float) -> Path:
    folder = OUT_SOCIAL / slug
    folder.mkdir(parents=True, exist_ok=True)
    out = folder / f"{idx:02d}_{slug}_moment_{int(abs_start)}s_9x16.mp4"
    if out.exists() and out.stat().st_size > 1_000_000:
        log(f"  skip {out.name}")
        return out
    if out.exists():
        out.unlink()

    tmp_dir = TMP / "destiny_0322_social"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp = tmp_dir / f"{slug}_{idx}_tmp.mp4"
    label = name.replace(":", "\\:").replace("'", "\\'")
    ig_e = ig.replace(":", "\\:").replace("'", "\\'")
    vf = (
        f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
        f"eq=contrast=1.08:brightness=0.02:saturation=1.02,"
        f"drawtext=fontfile='{FONT_B}':text='{label}':fontsize=42:fontcolor=white:"
        f"borderw=2:bordercolor=black@0.65:x=48:y=h-220:enable='between(t\\,0.4\\,8)',"
        f"drawtext=fontfile='{FONT_R}':text='{ig_e}':fontsize=28:fontcolor=#E8C547:"
        f"borderw=1:bordercolor=black@0.5:x=48:y=h-160:enable='between(t\\,0.6\\,8)',"
        f"drawtext=fontfile='{FONT_R}':text='Circle D Stages - ONENESS':fontsize=22:fontcolor=white@0.8:"
        f"x=48:y=64:enable='between(t\\,0.3\\,6)',"
        f"fade=t=in:st=0:d=0.25,fade=t=out:st={MOMENT_SEC-0.5:.2f}:d=0.45,format=yuv420p"
    )
    af = "highpass=f=60,alimiter=limit=0.97,aresample=48000:async=1:first_pts=0"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-stats",
        "-hwaccel", "d3d11va",
        "-ss", f"{src_offset:.3f}", "-i", str(src), "-t", str(MOMENT_SEC),
        "-vf", vf, "-af", af,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-r", FPS, "-fps_mode", "cfr",
        "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "160k",
        "-movflags", "+faststart", str(tmp),
    ]
    log(f"  encode {out.name} from {src.name} @{src_offset:.1f}s")
    run(cmd)
    if tmp.stat().st_size < 1_000_000:
        raise RuntimeError(f"moment too small ({tmp.stat().st_size} bytes)")
    shutil.copy2(tmp, out)
    for dest_root in (OUT_STAGES / slug, OUT_DRIVE / slug):
        dest_root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(out, dest_root / out.name)
    try:
        tmp.unlink()
    except OSError:
        pass
    return out


def process_artist(slug: str, name: str, ig: str, a: float, b: float, local: Path | None, only: set[str] | None) -> int:
    if only and slug not in only:
        return 0
    log(f"=== Social moments {name} ({a:.0f}-{b:.0f}s) ===")
    src = local if local and local.exists() and local.stat().st_size > 1_000_000 else MASTER
    if not src.exists():
        log(f"  SKIP missing source for {slug}")
        return 0
    base = a if src == MASTER else 0.0
    n = 0
    for i, t in enumerate(moment_starts(a, b), 1):
        offset = (t - a) if src != MASTER else t
        export_moment(slug, name, ig, t, i, src, offset)
        n += 1
    return n


def main() -> int:
    only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
    total = 0
    for row in ARTISTS:
        total += process_artist(*row, only)
    log(f"DONE social moments={total} -> {OUT_SOCIAL}")
    (LOGS / "SOCIAL_MOMENTS_DONE.flag").write_text("ok", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
