#!/usr/bin/env python3
"""Export 3 social moments (9:16) per artist from DSC_0324 set windows.

Uses finished local bodies when available, else master on F:.
Playback: 59.94fps CFR, 48kHz AAC, tempo 1.0, aresample async.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

os.environ["FONTCONFIG_FILE"] = r"D:\circle-d-flow-web\scripts\fonts\fonts.conf"
os.environ["FONTCONFIG_PATH"] = r"D:\circle-d-flow-web\scripts\fonts"

ROOT = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\002")
MASTER = Path(os.environ.get("DESTINY_MASTER", r"F:\DCIM\106NZ502\DSC_0324.MOV"))
LOGS = ROOT / "00_logs"
OUT_SOCIAL = ROOT / "04_videos_compressed" / "Social_Moments"
OUT_STAGES = ROOT / "05_Format_Drafts" / "Circle_D_Stages" / "03_Shorts_Moments"
OUT_DRIVE = ROOT / "06_drive_ready" / "Circle_D_Stages" / "Social_Moments"
TMP = Path(os.environ.get("TEMP", r"C:\Users\user\AppData\Local\Temp")) / "destiny_social_moments"

FONT_B = r"C\:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C\:/Windows/Fonts/arial.ttf"
MOMENT_SEC = 12.0
FPS = "60000/1001"

# slug -> (display, ig, set_start, set_end, local_body_or_None)
# moments at ~20%, 50%, 80% into each set
ARTISTS = [
    # Part A body only (0-420) so moments stay off SD while Part B encodes
    ("Elisa", "Elisa", "@elisa.cas8", 0.0, 420.0, Path(r"C:\Users\user\AppData\Local\Temp\destiny_elisa_a\body.mp4")),
    ("Nicke_Klein", "Heike Klein", "@nickeklein", 840.0, 1198.0, Path(r"C:\Users\user\AppData\Local\Temp\destiny_heike\body.mp4")),
    ("C-Riz", "C-Riz", "@c_riz.official", 1198.0, 1558.0, Path(r"C:\Users\user\AppData\Local\Temp\destiny_criz\body.mp4")),
    ("Willpower", "WILLPOWER", "@bodyxwillpower", 1558.0, 1920.0, Path(r"C:\Users\user\AppData\Local\Temp\destiny_willpower\body.mp4")),
    ("Arpanito", "Arpanito", "@arpan.k_", 1918.0, 2199.2, Path(r"C:\Users\user\AppData\Local\Temp\destiny_arpanito\body.mp4")),
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

    TMP.mkdir(parents=True, exist_ok=True)
    tmp = TMP / f"{slug}_{idx}_tmp.mp4"
    label = name.replace(":", "\\:").replace("'", "\\'")
    ig_e = ig.replace(":", "\\:").replace("'", "\\'")
    vf = (
        f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
        f"eq=contrast=1.08:brightness=0.02:saturation=1.02,"
        f"drawtext=fontfile='{FONT_B}':text='{label}':fontsize=42:fontcolor=white:"
        f"borderw=2:bordercolor=black@0.65:x=48:y=h-220:enable='between(t\\,0.4\\,8)',"
        f"drawtext=fontfile='{FONT_R}':text='{ig_e}':fontsize=28:fontcolor=#E8C547:"
        f"borderw=1:bordercolor=black@0.5:x=48:y=h-160:enable='between(t\\,0.6\\,8)',"
        f"drawtext=fontfile='{FONT_R}':text='Circle D Stages  ·  ONENESS':fontsize=22:fontcolor=white@0.8:"
        f"x=48:y=64:enable='between(t\\,0.3\\,6)',"
        f"fade=t=in:st=0:d=0.25,fade=t=out:st={MOMENT_SEC-0.5:.2f}:d=0.45,format=yuv420p"
    )
    af = "highpass=f=60,alimiter=limit=0.97,aresample=48000:async=1:first_pts=0"
    # Always -ss before -i (after -i produced near-empty 9:16 clips on local bodies)
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
    import shutil
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
    n = 0
    for i, abs_t in enumerate(moment_starts(a, b), start=1):
        # clamp so moment fits in window
        if abs_t + MOMENT_SEC > b:
            abs_t = max(a, b - MOMENT_SEC)
        if src == MASTER:
            src_off = abs_t
        else:
            src_off = max(0.0, abs_t - a)
        try:
            export_moment(slug, name, ig, abs_t, i, src, src_off)
            n += 1
        except Exception as e:
            log(f"  WARN {slug} moment {i}: {e}")
    return n


def main() -> int:
    only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
    LOGS.mkdir(parents=True, exist_ok=True)
    total = 0
    for row in ARTISTS:
        total += process_artist(*row, only=only)
    (LOGS / "SOCIAL_MOMENTS_DONE.flag").write_text(f"ok n={total}\n", encoding="utf-8")
    manifest = []
    for p in sorted(OUT_SOCIAL.rglob("*.mp4")):
        manifest.append(str(p.relative_to(OUT_SOCIAL)))
    (LOGS / "social_moments_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    log(f"DONE social moments={total} -> {OUT_SOCIAL}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
