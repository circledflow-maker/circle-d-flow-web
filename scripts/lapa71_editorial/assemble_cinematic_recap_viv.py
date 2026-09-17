#!/usr/bin/env python3
"""Lapa71 Moodboard ViV Reel 35s — lower flyer, graffiti titles, timed ViVs.

- 00:04 Flyer + writings lower on frame
- 00:09 Ana & Elisa UL + 1chriscreator on BR ViV
- 00:15 Maryna 0910 + Mistah Isaac 1439 ViV pair
- 00:21 @eskalahonthebeat (Arif 0912) ViV
- 00:25 Arpanito GUEST_RENE_IMG_8230 ViV
- 00:29 Dual ViV DSC_1512 + DSC_1512
- 00:32 Full-frame DSC_1540 + Follow us CTA
- Titles: Impact block / thick black stroke (YUMEKO / IG story energy)
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import MOODBOARD, MOODBOARD_SAFE_END  # noqa: E402

FT = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes")
LIB = Path(r"D:\Wakungo_Content_Studio\_Artists_Library")
PERF_A = FT / "DSC_0919_proxy_1080p.mp4"
PERF_B = Path(
    r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\YouTube"
    r"\Lapa71_TagusDropRhythm_YouTube_DIRECTED_BODY_16x9.mp4"
)
FLYER = Path(r"D:\Wakungo_Content_Studio\Flyer Lapa71.jpeg")
LOGO_DIR = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v5\assets")
WORK = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\reel_moodboard_viv_35")
OUT_DIR = Path(r"D:\Wakungo_Content_Studio\Lapa71\05_Reels")
CAROUSEL_DIR = OUT_DIR / "Lapa71_IG_Carousel_BestShots"
FINAL = OUT_DIR / "Lapa71_Moodboard_ViV_35s_KissYourHeart_9x16.mp4"
CAPTION = OUT_DIR / "Lapa71_Moodboard_ViV_35s_CAPTION.txt"

W, H = 1080, 1920
# Block graffiti / IG-story energy (Impact = heavy white face + thick black stroke)
FONT = r"C\:/Windows/Fonts/impact.ttf"
FONT_SUB = r"C\:/Windows/Fonts/arialbd.ttf"
THREADS = "4"
TARGET_S = 35.0
LOGO_H = 48
LOGO_H_MUDE = 36
LOGO_GAP = 18
LOGO_GAP_HUMBLE_MUDE = 28
LOGO_MARGIN = 52
LOGO_MARGIN_RIGHT = 40
LOGO_MUDE_PAD_TOP = 16


def run(cmd: list[str]) -> None:
    print(">", " ".join(str(c) for c in cmd[:10]), "...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-2500:])


def esc(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace(":", "\\:")
        .replace("%", "\\%")
    )


def grade() -> str:
    return "eq=contrast=1.1:brightness=0.02:saturation=0.94:gamma=1.02,hqdn3d=0.9:0.6:1.4:1.0"


def mood_vf(crop: str = "center") -> str:
    if crop == "tight":
        sc = f"scale={int(W * 1.48)}:{int(H * 1.48)}:force_original_aspect_ratio=increase"
    elif crop == "left":
        sc = f"scale={int(W * 1.3)}:{int(H * 1.3)}:force_original_aspect_ratio=increase"
        return f"{sc},crop={W}:{H}:0:(ih-{H})/2,setsar=1,{grade()},fps=25,format=yuv420p"
    elif crop == "right":
        sc = f"scale={int(W * 1.3)}:{int(H * 1.3)}:force_original_aspect_ratio=increase"
        return f"{sc},crop={W}:{H}:(iw-{W}):(ih-{H})/2,setsar=1,{grade()},fps=25,format=yuv420p"
    else:
        sc = f"scale={int(W * 1.26)}:{int(H * 1.26)}:force_original_aspect_ratio=increase"
    return f"{sc},crop={W}:{H},setsar=1,{grade()},fps=25,format=yuv420p"


def pip_vf(pw: int, ph: int, border: str = "0xd4af37@0.9") -> str:
    return (
        f"scale={pw}:{ph}:force_original_aspect_ratio=increase,"
        f"crop={pw}:{ph},setsar=1,{grade()},fps=25,"
        f"drawbox=x=0:y=0:w=iw:h=ih:color={border}:t=4,format=yuv420p"
    )


def enc_v() -> list[str]:
    return [
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-an",
        "-threads",
        THREADS,
    ]


def drawtext(
    line1: str,
    line2: str | None = None,
    y1: int = 200,
    fs1: int = 78,
    fs2: int = 40,
    *,
    x: str | None = None,
    font: str | None = None,
    color1: str = "white",
    color2: str = "0xf0d78c",
    border1: int = 7,
) -> str:
    """Heavy block titles — white face + thick black stroke (YUMEKO / IG energy)."""
    f = font or FONT
    xx = x or "(w-text_w)/2"
    t1 = (
        f"drawtext=fontfile='{f}':text='{esc(line1)}':fontsize={fs1}:fontcolor={color1}:"
        f"borderw={border1}:bordercolor=black@0.92:x={xx}:y={y1}"
    )
    if not line2:
        return t1
    t2 = (
        f"drawtext=fontfile='{FONT}':text='{esc(line2)}':fontsize={fs2}:fontcolor={color2}:"
        f"borderw=5:bordercolor=black@0.88:x={xx}:y={y1 + int(fs1 * 1.12)}"
    )
    return f"{t1},{t2}"


ARTISTS: dict[str, Path] = {
    "Arpanito": LIB / "Arpanito/Lapa71/Stages/DSC_0907_set01_Arpanito_Stages_1080p.mp4",
    "Ana": LIB / "Ana/Lapa71/Stages/DSC_0908_set01_Ana_Stages_1080p.mp4",
    "Elisa": LIB / "Elisa/Lapa71/Stages/DSC_0917_set01_Elisa_Stages_1080p.mp4",
    "Maryna": LIB / "Maryna_Vadini/Lapa71/Stages/DSC_0918_set01_Maryna_Vadini_Stages_1080p.mp4",
    "Maryna0910": LIB
    / "Maryna_Vadini/Lapa71/Stages/DSC_0910_set01_Maryna_Vadini_Stages_1080p.mp4",
    "Isaac": LIB / "Mr_Isaac/Lapa71/Stages/DSC_0930_set01_Mr.Isaac_Leonardo_InFlow_Stages_1080p.mp4",
    "Isaac1439": LIB
    / "Mr_Isaac/Lapa71/Stages/DSC_1439_set01_Daybefor_MistahIsaac_Stages_1080p.mp4",
    "Arif": LIB / "Arif/Lapa71/Stages/DSC_0912_set01_Arif_Stages_1080p.mp4",
    "Eskala": LIB / "Arif/Lapa71/Stages/DSC_0912_set01_Arif_Stages_1080p.mp4",
    "Humble": LIB / "Humble/Lapa71/Stages/DSC_1496_set01_Humble_Stages_1080p.mp4",
    "Manu": LIB / "Manu/Lapa71/Stages/DSC_1494_set01_Manu_Stages_1080p.mp4",
    "Zema": LIB / "Zema/Lapa71/Stages/DSC_0908_set01_Zema_Stages_1080p.mp4",
    "Maryna2": LIB / "Maryna_Vadini/Lapa71/Stages/DSC_0911_set01_Maryna_Vadini_Stages_1080p.mp4",
    "Ana2": LIB / "Ana/Lapa71/Stages/DSC_1495_set01_Ana_Stages_1080p.mp4",
    "Arpanito2": LIB / "Arpanito/Lapa71/Stages/DSC_1472_set01_Arpanito_Stages_1080p.mp4",
    "Elisa2": LIB / "Elisa/Lapa71/Stages/DSC_1501_set01_Elisa_Stages_1080p.mp4",
    # Full_Takes inserts
    "Arpanito8230": FT / "GUEST_RENE_IMG_8230.mov",
    "DSC1512a": FT / "DSC_1512_proxy_1080p.mp4",
    "DSC1512b": FT / "DSC_1512_proxy_1080p.mp4",
    "GuestPhone2": FT / "GUEST_PHONE_20260829_202458.mp4",
    "DSC1540": FT / "DSC_1540_proxy_1080p.mp4",
}

RENE: dict[str, Path] = {
    f"r{k}": FT / f"GUEST_RENE_IMG_{k}.mov"
    for k in (8180, 8184, 8185, 8186, 8187, 8189, 8190, 8192, 8200, 8210, 8230)
}


def resolve(key: str) -> Path:
    p = ARTISTS.get(key) or RENE.get(key)
    if not p or not p.exists():
        raise FileNotFoundError(key)
    return p


def build_audio_bed(out_m4a: Path, out_wav: Path) -> None:
    """DSC_0919 open + directed-body fill → 35s stereo bed + mono analysis wav."""
    # ~24s from 0919 + fill from directed body
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(PERF_A),
            "-ss",
            "95",
            "-t",
            "18",
            "-i",
            str(PERF_B),
            "-filter_complex",
            "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:24.05,asetpts=PTS-STARTPTS[a0];"
            "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a1];"
            "[a0][a1]concat=n=2:v=0:a=1,"
            "atrim=0:{:.2f},asetpts=PTS-STARTPTS,"
            "highpass=f=50,lowpass=f=16000,"
            "loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.95[a]".format(TARGET_S),
            "-map",
            "[a]",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(out_m4a),
        ]
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(out_m4a),
            "-ac",
            "1",
            "-ar",
            "22050",
            "-c:a",
            "pcm_s16le",
            str(out_wav),
        ]
    )


def detect_beats(wav_path: Path, max_t: float) -> list[float]:
    """Sparser onsets — smoother reel, less chatter."""
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        raw = wf.readframes(wf.getnframes())
        ch = wf.getnchannels()
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    if ch > 1:
        samples = samples.reshape(-1, ch).mean(axis=1)
    samples /= 32768.0

    hop = max(1, int(sr * 0.02))
    win = hop * 2
    rms = np.array(
        [
            float(np.sqrt(np.mean(samples[i : i + win] ** 2)))
            for i in range(0, len(samples) - win, hop)
        ],
        dtype=np.float32,
    )
    if len(rms) < 8:
        step = 0.55
        return [round(i * step, 3) for i in range(int(max_t / step))]

    diff = np.maximum(np.diff(rms, prepend=rms[0]), 0)
    smooth = np.convolve(diff, np.ones(5) / 5, mode="same")
    thr = float(np.percentile(smooth, 88))  # fewer peaks
    min_gap = int(0.48 / 0.02)  # ~480ms — smoother cuts

    peaks: list[float] = []
    last = -min_gap
    for i, v in enumerate(smooth):
        t = i * 0.02
        if t > max_t - 0.2:
            break
        if v >= thr and (i - last) >= min_gap:
            peaks.append(round(t, 3))
            last = i

    if len(peaks) < 10:
        step = 0.55
        peaks = [round(i * step, 3) for i in range(int(max_t / step))]
    return peaks


def snap(t: float, beats: list[float]) -> float:
    if not beats:
        return t
    return min(beats, key=lambda b: abs(b - t))


def build_timeline(beats: list[float], total: float) -> list[dict]:
    """Anchors: flyer@4, Ana@9, Maryna+Isaac@15, Eskala@21, Arpanito@25, 1512+GuestPhone@28, 1540@30."""
    finale = 5.0  # DSC_1540 seconds 08–13
    body_end = total - finale

    plan = [
        ("mood", 4.0, {"crop": "center", "text": ("FIND YOUR FLOW", "Lisbon is already moving")}),
        (
            "flyer",
            5.0,
            {
                "text": (
                    "Wako Kungo presents",
                    "Kiss your heart because you make the effort",
                )
            },
        ),
        (
            "viv2",
            5.5,
            {
                "pips": [("Ana", 0.4), ("Elisa", 0.5)],
                "text_ul": ("Ana & Elisa", None),
                "text_credit_br": ("1chriscreator", None),
            },
        ),
        (
            "viv2",
            6.0,
            {
                "pips": [("Maryna0910", 0.5), ("Isaac1439", 0.4)],
                "text_ul": ("MARYNA", None),
                "text_br": ("MISTAH ISAAC", None),
            },
        ),
        (
            "viv1",
            4.0,
            {"pip": ("Eskala", 0.45), "pos": "br", "text": ("@eskalahonthebeat", None)},
        ),
        (
            "viv1",
            3.5,
            {"pip": ("Arpanito8230", 0.15), "pos": "tl", "text": ("ARPANITO", None)},
        ),
        (
            "viv2",
            4.0,
            {
                # BR "THE NIGHT" → guest phone take
                "pips": [("DSC1512a", 1.0), ("GuestPhone2", 12.0)],
                "text_ul": ("LAPA 71", None),
                "text_br": ("THE NIGHT", None),
            },
        ),
    ]

    timeline: list[dict] = []
    t = 0.0
    for i, (layout, want, extra) in enumerate(plan):
        remaining = body_end - t
        if remaining < 0.45:
            break
        start = t
        dur = min(want, remaining)
        if i == 0:
            dur = min(4.0, remaining)
        mood_ss = min(start * 0.85 + 0.4, MOODBOARD_SAFE_END - dur - 0.1)
        timeline.append(
            {
                "id": f"c{i+1:02d}",
                "layout": layout,
                "mood": max(0.0, mood_ss),
                "dur": round(dur, 2),
                "t0": round(start, 2),
                **extra,
            }
        )
        t = start + dur

    fin_start = min(t, total - finale)
    timeline.append(
        {
            "id": f"c{len(timeline)+1:02d}",
            "layout": "full",
            "src": "DSC1540",
            "ss": 8.0,
            "dur": round(total - fin_start, 2),
            "t0": round(fin_start, 2),
            "text": ("Follow us", "so we can see us soon"),
        }
    )
    return timeline


def pos_xy(pos: str, pw: int, ph: int) -> tuple[int, int]:
    m = 40
    if pos == "tl":
        return m, 210
    if pos == "tr":
        return W - pw - m, 210
    if pos == "bl":
        return m, H - ph - 280
    return W - pw - m, H - ph - 280


def cut_flyer(mood_ss: float, dur: float, out: Path, text: tuple) -> None:
    """Moodboard bg + flyer LOWER on frame + Wako presents / KYH lines."""
    if not FLYER.exists():
        raise FileNotFoundError(FLYER)
    pw, ph = 540, 750
    x, y = (W - pw) // 2, 560  # lower third — below logos
    ss = min(max(0.0, mood_ss), MOODBOARD_SAFE_END - dur - 0.05)
    fade = 0.45
    line1, line2 = text[0], text[1] if len(text) > 1 else None
    # Title sits just above the lowered flyer
    txt = drawtext(line1, None, y1=430, fs1=64, border1=7)
    if line2:
        words = line2.split()
        mid = max(1, len(words) // 2)
        a = " ".join(words[:mid])
        b = " ".join(words[mid:])
        txt += (
            f",drawtext=fontfile='{FONT}':text='{esc(a)}':fontsize=38:fontcolor=white:"
            f"borderw=6:bordercolor=black@0.9:x=(w-text_w)/2:y=1380"
            f",drawtext=fontfile='{FONT}':text='{esc(b)}':fontsize=40:fontcolor=0xffcc33:"
            f"borderw=6:bordercolor=black@0.9:x=(w-text_w)/2:y=1438"
        )
    filt = (
        f"[0:v]{mood_vf('center')}[bg];"
        f"[1:v]scale={pw}:{ph}:force_original_aspect_ratio=decrease,"
        f"pad={pw}:{ph}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=25,"
        f"drawbox=x=0:y=0:w=iw:h=ih:color=0xd4af37@0.95:t=5,"
        f"fade=t=in:st=0:d={fade:.2f}:alpha=1,format=yuv420p[fly];"
        f"[bg][fly]overlay=x={x}:y={y}:format=auto,{txt},format=yuv420p[vout]"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{ss:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(MOODBOARD),
            "-loop",
            "1",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(FLYER),
            "-filter_complex",
            filt,
            "-map",
            "[vout]",
            *enc_v(),
            "-t",
            f"{dur:.2f}",
            str(out),
        ]
    )


def cut_mood(mood_ss: float, dur: float, crop: str, out: Path, text: tuple | None) -> None:
    vf = mood_vf(crop)
    if text and text[0]:
        line2 = text[1] if len(text) > 1 else None
        upper = text[0].upper()
        if "KISS YOUR HEART" in upper:
            vf = f"{vf},{drawtext(text[0], line2, y1=680, fs1=78, fs2=40)}"
        elif "ENTER THE CIRCLE" in upper:
            vf = f"{vf},{drawtext(text[0], line2, y1=620, fs1=76, fs2=36)}"
        elif "FIND YOUR FLOW" in upper:
            vf = f"{vf},{drawtext(text[0], line2, y1=600, fs1=78, fs2=38)}"
        elif "SUPPORTIVE" in upper:
            vf = f"{vf},{drawtext(text[0], line2, y1=620, fs1=70, fs2=36)}"
        else:
            vf = f"{vf},{drawtext(text[0], line2)}"
    fade = min(0.35, dur * 0.18)
    vf = f"{vf},fade=t=in:st=0:d={fade:.2f},fade=t=out:st={dur-fade:.2f}:d={fade:.2f}"
    ss = min(max(0.0, mood_ss), MOODBOARD_SAFE_END - dur - 0.05)
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{ss:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(MOODBOARD),
            "-vf",
            vf,
            *enc_v(),
            str(out),
        ]
    )


def cut_full(src_key: str, src_ss: float, dur: float, out: Path, text: tuple | None) -> None:
    """Full-bleed 9:16 from Full_Takes (no moodboard) + Impact CTA."""
    src = resolve(src_key)
    fade = min(0.4, dur * 0.2)
    vf = (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,"
        f"crop={W}:{H},setsar=1,{grade()},fps=25,format=yuv420p"
    )
    if text and text[0]:
        line2 = text[1] if len(text) > 1 else None
        # Optimized CTA placement — lower third, Impact + thick stroke
        vf = f"{vf},{drawtext(text[0], line2, y1=1280, fs1=72, fs2=42, border1=8)}"
    vf = f"{vf},fade=t=in:st=0:d={fade:.2f},fade=t=out:st={max(0.05, dur - fade):.2f}:d={fade:.2f}"
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{max(0.0, src_ss):.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(src),
            "-vf",
            vf,
            *enc_v(),
            "-t",
            f"{dur:.2f}",
            str(out),
        ]
    )


def cut_viv1(mood_ss, dur, pip_key, pip_ss, pos, out, text) -> None:
    pw, ph = 480, 850
    x, y = pos_xy(pos, pw, ph)
    ss = min(max(0.0, mood_ss), MOODBOARD_SAFE_END - dur - 0.05)
    fade = min(0.4, dur * 0.18)
    # Label sits tight against the ViV top edge (not floating mid-frame)
    txt = ""
    if text and text[0]:
        fs1 = 40 if len(text[0]) > 12 else 56
        label_y = max(100, y - 24)
        label_x = x if pos in ("tl", "bl") else x
        txt = (
            f",drawtext=fontfile='{FONT}':text='{esc(text[0])}':fontsize={fs1}:fontcolor=white:"
            f"borderw=6:bordercolor=black@0.92:x={label_x}:y={label_y}"
        )
        if len(text) > 1 and text[1]:
            txt += (
                f",drawtext=fontfile='{FONT}':text='{esc(text[1])}':fontsize=30:fontcolor=0xf0d78c:"
                f"borderw=5:bordercolor=black@0.88:x={label_x}:y={label_y + fs1 + 6}"
            )
    pip_src = resolve(pip_key)
    filt = (
        f"[0:v]{mood_vf('center')}[bg];"
        f"[1:v]{pip_vf(pw, ph)},fade=t=in:st=0:d={fade:.2f}:alpha=1[pip];"
        f"[bg][pip]overlay=x={x}:y={y}:format=auto{txt},format=yuv420p[vout]"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{ss:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(MOODBOARD),
            "-stream_loop",
            "2",
            "-ss",
            f"{pip_ss:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(pip_src),
            "-filter_complex",
            filt,
            "-map",
            "[vout]",
            *enc_v(),
            "-t",
            f"{dur:.2f}",
            str(out),
        ]
    )


def cut_viv2(
    mood_ss,
    dur,
    pips,
    out,
    text_ul=None,
    text_credit=None,
    text_credit_br=None,
    text_br=None,
) -> None:
    pw, ph = 420, 740
    ss = min(max(0.0, mood_ss), MOODBOARD_SAFE_END - dur - 0.05)
    p0, s0 = pips[0]
    p1, s1 = pips[1]
    fade = min(0.4, dur * 0.16)
    # BR pip position (matches overlay below)
    br_x, br_y = W - pw - 36, H - ph - 290
    labels = ""
    if text_ul and text_ul[0]:
        labels += (
            f",drawtext=fontfile='{FONT}':text='{esc(text_ul[0])}':fontsize=62:fontcolor=white:"
            f"borderw=7:bordercolor=black@0.92:x=48:y=168"
        )
    # Legacy UL credit (avoid if BR credit set)
    if text_credit and text_credit[0] and not text_credit_br:
        labels += (
            f",drawtext=fontfile='{FONT}':text='{esc(text_credit[0])}':fontsize=36:fontcolor=0xff66cc:"
            f"borderw=5:bordercolor=black@0.9:x=48:y=245"
        )
    # 1chriscreator sits with the RIGHT-BOTTOM ViV
    if text_credit_br and text_credit_br[0]:
        labels += (
            f",drawtext=fontfile='{FONT}':text='{esc(text_credit_br[0])}':fontsize=36:fontcolor=0xff66cc:"
            f"borderw=5:bordercolor=black@0.9:x={br_x}:y={br_y - 52}"
        )
    if text_br and text_br[0]:
        labels += (
            f",drawtext=fontfile='{FONT}':text='{esc(text_br[0])}':fontsize=48:fontcolor=white:"
            f"borderw=6:bordercolor=black@0.92:x={br_x}:y={br_y - 58}"
        )
    filt = (
        f"[0:v]{mood_vf('center')}[bg];"
        f"[1:v]{pip_vf(pw, ph)},fade=t=in:st=0:d={fade:.2f}:alpha=1[pip1];"
        f"[2:v]{pip_vf(pw, ph, '0x3de0ff@0.88')},fade=t=in:st=0:d={fade:.2f}:alpha=1[pip2];"
        f"[bg][pip1]overlay=x=36:y=230:format=auto[tmp];"
        f"[tmp][pip2]overlay=x={br_x}:y={br_y}:format=auto{labels},format=yuv420p[vout]"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{ss:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(MOODBOARD),
            "-ss",
            f"{s0:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(resolve(p0)),
            "-ss",
            f"{s1:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(resolve(p1)),
            "-filter_complex",
            filt,
            "-map",
            "[vout]",
            *enc_v(),
            "-t",
            f"{dur:.2f}",
            str(out),
        ]
    )


def cut_viv3(mood_ss, dur, pips, out) -> None:
    pw, ph = 360, 640
    ss = min(max(0.0, mood_ss), MOODBOARD_SAFE_END - dur - 0.05)
    p0, s0 = pips[0]
    p1, s1 = pips[1]
    p2, s2 = pips[2]
    fade = min(0.35, dur * 0.14)
    filt = (
        f"[0:v]{mood_vf('center')}[bg];"
        f"[1:v]{pip_vf(pw, ph)},fade=t=in:st=0:d={fade:.2f}:alpha=1[pip1];"
        f"[2:v]{pip_vf(pw, ph, '0x3de0ff@0.88')},fade=t=in:st={fade:.2f}:d={fade:.2f}:alpha=1[pip2];"
        f"[3:v]{pip_vf(pw, ph, '0xffffff@0.82')},fade=t=in:st={fade*2:.2f}:d={fade:.2f}:alpha=1[pip3];"
        f"[bg][pip1]overlay=x=30:y=200:format=auto[t1];"
        f"[t1][pip2]overlay=x=W-w-30:y=430:format=auto[t2];"
        f"[t2][pip3]overlay=x=(W-w)/2:y=H-h-250:format=auto,format=yuv420p[vout]"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{ss:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(MOODBOARD),
            "-ss",
            f"{s0:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(resolve(p0)),
            "-ss",
            f"{s1:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(resolve(p1)),
            "-ss",
            f"{s2:.2f}",
            "-t",
            f"{dur:.2f}",
            "-i",
            str(resolve(p2)),
            "-filter_complex",
            filt,
            "-map",
            "[vout]",
            *enc_v(),
            "-t",
            f"{dur:.2f}",
            str(out),
        ]
    )


def logo_paths() -> list[Path]:
    # LTR: Circle.D.Flow (KH) | Wako | Humble | MUDE — transparent, no plate
    files = [
        LOGO_DIR / "kh_logo_rgba.png",
        LOGO_DIR / "wako_logo_rgba.png",
        LOGO_DIR / "humble_logo_rgba.png",
        LOGO_DIR / "mude_logo_only.png",
    ]
    for f in files:
        if not f.exists():
            raise FileNotFoundError(f)
    return files


def logo_scaled_widths(paths: list[Path], heights: list[int] | None = None) -> list[int]:
    heights = heights or [LOGO_H] * len(paths)
    widths = []
    for p, h in zip(paths, heights):
        im = Image.open(p)
        w, hh = im.size
        widths.append(max(1, int(round(w * (h / float(hh))))))
    return widths


def mux_with_logos_and_audio(concat_raw: Path, bed: Path, out: Path) -> None:
    logos = logo_paths()
    # MUDE wordmark is wider — slightly smaller + more right padding so it isn't cropped
    heights = [LOGO_H, LOGO_H, LOGO_H, LOGO_H_MUDE]
    widths = logo_scaled_widths(logos, heights)
    padded = WORK / "video_35.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(concat_raw),
            "-vf",
            f"fps=25,tpad=stop_mode=clone:stop_duration=3,trim=0:{TARGET_S:.2f},setpts=PTS-STARTPTS,format=yuv420p",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "17",
            "-t",
            f"{TARGET_S:.2f}",
            "-threads",
            THREADS,
            str(padded),
        ]
    )

    names = ["kh", "wk", "hm", "md"]
    gaps = [LOGO_GAP, LOGO_GAP, LOGO_GAP_HUMBLE_MUDE]
    offsets_from_right: list[int] = []
    cursor = LOGO_MARGIN_RIGHT
    for i, name in enumerate(reversed(names)):
        idx = len(names) - 1 - i
        w = widths[idx]
        offsets_from_right.append(cursor)
        gap = gaps[idx - 1] if idx > 0 else 0
        cursor += w + gap

    # Drop below top safe-area so MUDE wordmark isn't edge-clipped
    top_y = LOGO_MARGIN
    pad_t = LOGO_MUDE_PAD_TOP
    fc = f"[0:v]format=yuv420p[base];"
    for i, name in enumerate(names):
        if name == "md":
            # Transparent pad above+below — source PNG is flush to glyph edges
            fc += (
                f"[{i+2}:v]scale=-1:{heights[i]},"
                f"pad=iw:ih+{pad_t * 2}:0:{pad_t}:color=0x00000000,format=rgba[{name}];"
            )
        else:
            fc += f"[{i+2}:v]scale=-1:{heights[i]},format=rgba[{name}];"
    cur = "base"
    for i, name in enumerate(reversed(names)):
        nxt = f"L{i}"
        off = offsets_from_right[i]
        fc += f"[{cur}][{name}]overlay=W-w-{off}:{top_y}:format=auto[{nxt}];"
        cur = nxt
    fc += f"[{cur}]format=yuv420p[v];[1:a]atrim=0:{TARGET_S:.2f},asetpts=PTS-STARTPTS[a]"

    cmd = ["ffmpeg", "-y", "-i", str(padded), "-i", str(bed)]
    for lg in logos:
        cmd += ["-loop", "1", "-framerate", "25", "-t", f"{TARGET_S:.2f}", "-i", str(lg)]
    cmd += [
        "-filter_complex",
        fc,
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "17",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        f"{TARGET_S:.2f}",
        "-movflags",
        "+faststart",
        "-threads",
        THREADS,
        str(out),
    ]
    run(cmd)


def write_caption() -> None:
    text = """Kiss your heart because you make the effort.

Wako Kungo presents · Tagus Drop Rhythm · Lapa71 · Lisbon

FIND YOUR FLOW
Lisbon is already moving.

Ana & Elisa · 1chriscreator
Maryna · Mistah Isaac · @eskalahonthebeat · Arpanito

Follow us so we can see us soon.

This is a supportive space —
come as you are, bring what you have,
create what's next.

Circle.D.Flow · Wako Kungo · Humble · MUDE

#KissYourHeart #WakoKungo #CircleDFlow #SupportiveSpace #Lapa71 #Lisbon #TagusDropRhythm #FindYourFlow #LiveMusic #Humble #MUDE #1chriscreator #eskalahonthebeat #Arpanito
"""
    CAPTION.write_text(text.strip() + "\n", encoding="utf-8")
    print("Caption ->", CAPTION)


def export_ig_carousel() -> list[Path]:
    """Best moments from Full_Takes → IG carousel 1080x1350."""
    CAROUSEL_DIR.mkdir(parents=True, exist_ok=True)
    picks = [
        ("01_flyer_tagus", FLYER, None),
        ("02_ft_0910_maryna", FT / "DSC_0910_proxy_1080p.mp4", 2.5),
        ("03_ft_0917_elisa", FT / "DSC_0917_proxy_1080p.mp4", 4.0),
        ("04_ft_0919_stage", FT / "DSC_0919_proxy_1080p.mp4", 3.0),
        ("05_ft_0912_eskala", FT / "DSC_0912_Arif_1080p.mp4", 1.5),
        ("06_ft_8230_arpanito", FT / "GUEST_RENE_IMG_8230.mov", 0.6),
        ("07_ft_0930_isaac", FT / "DSC_0930_proxy_1080p.mp4", 5.0),
        ("08_ft_1512_night", FT / "DSC_1512_proxy_1080p.mp4", 3.0),
        ("09_ft_1540_follow", FT / "DSC_1540_proxy_1080p.mp4", 4.0),
        ("10_ft_1487_crowd", FT / "DSC_1487_proxy_1080p.mp4", 8.0),
        ("11_ft_moodboard", FT / "lapa71 Moodboard by Arif.mp4", 2.0),
        ("12_reel_frame_22s", FINAL, 22.0),
    ]
    outs: list[Path] = []
    for name, src, ss in picks:
        if not src.exists():
            print("Skip missing carousel src:", src)
            continue
        out = CAROUSEL_DIR / f"{name}.jpg"
        # Instagram portrait carousel sweet spot ~4:5
        if src.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            vf = (
                f"scale=1080:1350:force_original_aspect_ratio=increase,"
                f"crop=1080:1350,eq=contrast=1.08:brightness=0.03:saturation=1.05"
            )
            cmd = ["ffmpeg", "-y", "-i", str(src), "-vf", vf, "-q:v", "2", str(out)]
        else:
            vf = (
                f"scale=1080:1350:force_original_aspect_ratio=increase,"
                f"crop=1080:1350,eq=contrast=1.1:brightness=0.02:saturation=0.98"
            )
            cmd = [
                "ffmpeg",
                "-y",
                "-ss",
                f"{float(ss or 0):.2f}",
                "-i",
                str(src),
                "-frames:v",
                "1",
                "-vf",
                vf,
                "-q:v",
                "2",
                str(out),
            ]
        try:
            run(cmd)
            outs.append(out)
            print("Carousel ->", out)
        except Exception as e:
            print("Carousel fail", name, e)
    readme = CAROUSEL_DIR / "README.txt"
    readme.write_text(
        "Instagram carousel — best moments from Full_Takes (1080x1350)\n"
        "Order: flyer → Maryna → Elisa → stage → @eskalahonthebeat → Arpanito 8230 → "
        "Isaac → DSC_1512 → DSC_1540 → crowd → moodboard → reel still.\n"
        "Caption: use Lapa71_Moodboard_ViV_35s_CAPTION.txt\n",
        encoding="utf-8",
    )
    return outs


def main() -> int:
    for p in (MOODBOARD, PERF_A, PERF_B, FLYER):
        if not p.exists():
            print("Missing:", p, file=sys.stderr)
            return 1

    if WORK.exists():
        shutil.rmtree(WORK, ignore_errors=True)
    WORK.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    bed = WORK / "perf_bed_35.m4a"
    wav = WORK / "perf_35.wav"
    print("Audio bed 35s (DSC_0919 + directed fill)...")
    build_audio_bed(bed, wav)

    beats = detect_beats(wav, TARGET_S)
    print(f"Beats: {len(beats)} (sparse) | first={beats[:5]}")
    (WORK / "beats.json").write_text(json.dumps(beats, indent=2), encoding="utf-8")

    timeline = build_timeline(beats, TARGET_S)
    print(f"Clips: {len(timeline)} | ~{sum(b['dur'] for b in timeline):.1f}s")
    (WORK / "timeline.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")

    parts: list[Path] = []
    for i, b in enumerate(timeline):
        out = WORK / f"seg_{i:02d}_{b['id']}.mp4"
        layout = b["layout"]
        print(f"[{i+1:02d}/{len(timeline)}] {b['id']} {layout} {b['dur']:.2f}s")
        if layout == "flyer":
            cut_flyer(b["mood"], b["dur"], out, b["text"])
        elif layout == "mood":
            cut_mood(b["mood"], b["dur"], b.get("crop", "center"), out, b.get("text"))
        elif layout == "full":
            cut_full(b["src"], float(b.get("ss", 0)), b["dur"], out, b.get("text"))
        elif layout == "viv1":
            key, pss = b["pip"]
            cut_viv1(b["mood"], b["dur"], key, pss, b.get("pos", "br"), out, b.get("text"))
        elif layout == "viv2":
            cut_viv2(
                b["mood"],
                b["dur"],
                b["pips"],
                out,
                text_ul=b.get("text_ul"),
                text_credit=b.get("text_credit"),
                text_credit_br=b.get("text_credit_br"),
                text_br=b.get("text_br"),
            )
        elif layout == "viv3":
            cut_viv3(b["mood"], b["dur"], b["pips"], out)
        else:
            raise ValueError(layout)
        parts.append(out)

    lst = WORK / "concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    concat_raw = WORK / "concat_raw.mp4"
    # filter_complex concat — demuxer concat breaks on yuv420p/yuvj420p mix (freeze ~15s)
    fc_parts = []
    cmd = ["ffmpeg", "-y"]
    for i, p in enumerate(parts):
        cmd += ["-i", str(p)]
        fc_parts.append(
            f"[{i}:v]fps=25,scale={W}:{H}:flags=bicubic,format=yuv420p,"
            f"setsar=1,setpts=PTS-STARTPTS[v{i}];"
        )
    fc_parts.append(
        "".join(f"[v{i}]" for i in range(len(parts)))
        + f"concat=n={len(parts)}:v=1:a=0[vout]"
    )
    cmd += [
        "-filter_complex",
        "".join(fc_parts),
        "-map",
        "[vout]",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-t",
        f"{TARGET_S:.2f}",
        "-threads",
        THREADS,
        str(concat_raw),
    ]
    run(cmd)

    print("Mux logos + performance audio...")
    mux_with_logos_and_audio(concat_raw, bed, FINAL)
    write_caption()
    print("Export IG carousel stills...")
    export_ig_carousel()

    meta = {
        "duration_s": TARGET_S,
        "audio": [str(PERF_A), str(PERF_B)],
        "flyer": str(FLYER),
        "logos": [str(p) for p in logo_paths()],
        "output": str(FINAL),
        "carousel": str(CAROUSEL_DIR),
        "clips": len(timeline),
        "beats": len(beats),
        "size_bytes": FINAL.stat().st_size if FINAL.exists() else 0,
    }
    (WORK / "manifest.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("DONE ->", FINAL)
    print("Size MB:", round(FINAL.stat().st_size / 1e6, 2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
