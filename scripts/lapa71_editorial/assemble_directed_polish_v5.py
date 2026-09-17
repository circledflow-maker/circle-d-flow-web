#!/usr/bin/env python3
"""Lapa71 Directed Aftermovie — Polish Pass v5 (English storytelling + logos).

Optimized English plan (post-cut timeline notes in meta JSON):
  0:00  Larger intro + animated KH logo, Kiss Your Heart LX, slogan
  0:07  Type: Welcome Fam to → Flyer sticker slap → fade
  0:23  Type: More than just an event — a place where every soul feels welcome
  ~0:25 MUDE logo center 3s → slide to corner bug row
  CUT   Remove dead 0:30–0:33
  0:35  Wako Kungo logo animate in → corner
  0:40–1:24 Community values / gratitude / like-share CTA (max 3 lines)
  1:30  @arpanito right
  CUT   Shorten 1:44–1:54 by 5s
  Ready to meet today's artists? / Ok, let's go + Arif profile card
  2:27  Smaller center ViV (-1cm) + He never learned that instrument before!
  FIX   2:50–2:59 keep mainroll audio
  3:18–3:31 Story cards; +8s Lapa/Greenstreet location story
  3:48  Leonardo profile
  4:14  Are you ready for what's coming?
  CUT   Remove 4:38–4:52
  5:12  Humble 9:16 + URL + corner logo
  5:28  Mr Isaac profile
  5:46+ IMG_8924 A-roll zoom ViV, warm-up lines, Feeling/Understanding/Jamming
        + DSC_0931 + Ana + René/Chris/Arpan splits/PiP
  End   DSC_1540@2–9 + 1542 ViV + thanks / Circle D Stages CTA
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("PIL required")

WORK = Path(r"D:\Wakungo_Content_Studio\Lapa71\00_work\editorial\polish_v5")
ASSETS = WORK / "assets"
FT = Path(r"D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes")
ARPAN = FT / "Arpan Upload"
MASTER_IN = Path(r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\YouTube\Lapa71_TagusDropRhythm_YouTube_MASTER_16x9.mp4")
OUT_DRAFT = Path(r"D:\Wakungo_Content_Studio\Lapa71\05_Format_Drafts\Editorial\Lapa71_TagusDropRhythm_Aftermovie_FULL_YouTube_16x9.mp4")
OUT_ALIAS = Path(r"D:\Wakungo_Content_Studio\Lapa71\05_Format_Drafts\YouTube\Lapa71_TagusDropRhythm_YouTube_16x9.mp4")
OUT_MASTER = Path(r"D:\Wakungo_Content_Studio\Lapa71\06_Masters\YouTube\Lapa71_TagusDropRhythm_YouTube_MASTER_16x9.mp4")

W, H = 1920, 1080
THREADS = "1"
FONT_B = r"C:/Windows/Fonts/arialbd.ttf"
FONT_R = r"C:/Windows/Fonts/arial.ttf"
# Brush / display feel
FONT_BRUSH = r"C:/Windows/Fonts/seguiemj.ttf"
for cand in (
    r"C:/Windows/Fonts/georgia.ttf",
    r"C:/Windows/Fonts/georgiai.ttf",
    r"C:/Windows/Fonts/pala.ttf",
    r"C:/Windows/Fonts/comic.ttf",
):
    if Path(cand).exists():
        FONT_BRUSH = cand
        break


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "")[-2000:])


def probe_dur(path: Path) -> float:
    o = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        text=True,
    ).strip()
    return float(o)


def enc() -> list[str]:
    return ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-threads", THREADS]


def make_transparent_logo(src: Path, dest: Path, *, mode: str) -> Path:
    """Knock out near-white or near-black backgrounds for overlays."""
    if dest.exists() and dest.stat().st_size > 5000:
        return dest
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if mode == "white":
                if r > 240 and g > 240 and b > 240:
                    px[x, y] = (r, g, b, 0)
            elif mode == "black":
                if r < 28 and g < 28 and b < 28:
                    px[x, y] = (r, g, b, 0)
            elif mode == "auto":
                # corner sample
                pass
    if mode == "auto":
        corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
        avg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
        thresh = 40
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if abs(r - avg[0]) < thresh and abs(g - avg[1]) < thresh and abs(b - avg[2]) < thresh:
                    px[x, y] = (r, g, b, 0)
    # trim
    bbox = im.split()[-1].getbbox()
    if bbox:
        im = im.crop(bbox)
    im.save(dest)
    return dest


def make_kh_intro_card(out: Path, sec: float = 5.5) -> Path:
    """Large branded intro: KH logo + Kiss Your Heart LX + slogan."""
    if out.exists() and out.stat().st_size > 80_000:
        return out
    kh = ASSETS / "kh_logo_rgba.png"
    canvas = Image.new("RGB", (W, H), (8, 6, 4))
    # soft gold vignette feel via center brightness
    logo = Image.open(kh).convert("RGBA")
    logo.thumbnail((720, 720), Image.Resampling.LANCZOS)
    lx, ly = (W - logo.size[0]) // 2, 120
    canvas.paste(logo, (lx, ly), logo)
    draw = ImageDraw.Draw(canvas)
    try:
        f_brand = ImageFont.truetype(FONT_BRUSH, 64)
        f_slogan = ImageFont.truetype(FONT_R, 36)
    except OSError:
        f_brand = f_slogan = ImageFont.load_default()
    brand = "Kiss Your Heart LX"
    slogan = "Because you make the effort."
    bb = draw.textbbox((0, 0), brand, font=f_brand)
    draw.text(((W - (bb[2] - bb[0])) // 2, 820), brand, fill=(232, 197, 71), font=f_brand)
    sb = draw.textbbox((0, 0), slogan, font=f_slogan)
    draw.text(((W - (sb[2] - sb[0])) // 2, 900), slogan, fill=(245, 240, 230), font=f_slogan)
    png = out.with_suffix(".png")
    canvas.save(png)
    # subtle zoom-in animation
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(png),
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", f"{sec:.2f}",
        "-vf", (
            f"scale={W}:{H},"
            f"zoompan=z='min(1.08,1+0.012*on/25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d={int(sec*25)}:s={W}x{H}:fps=25,"
            f"fade=t=in:st=0:d=0.6,fade=t=out:st={sec-0.7:.2f}:d=0.65,format=yuv420p"
        ),
        *enc(), "-c:a", "aac", "-b:a", "128k", "-shortest", str(out),
    ])
    return out


def make_slap_wav(dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    # short percussive slap (noise burst + low thump)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", "anoisesrc=color=brown:amplitude=0.6:d=0.09",
        "-f", "lavfi", "-i", "sine=f=90:d=0.08",
        "-filter_complex",
        "[0]volume=2.2,afade=t=out:st=0.03:d=0.06[a];"
        "[1]volume=0.7,afade=t=out:st=0.02:d=0.06[b];"
        "[a][b]amix=inputs=2:duration=shortest,alimiter=limit=0.9",
        "-t", "0.12", str(dest),
    ])
    return dest


def write_ass(path: Path) -> Path:
    """ASS dialogues on NEW timeline (after structural cuts). Times are approximate targets."""
    # New-timeline times (seconds) — see map in module docstring / meta
    # Structural: -3s after 0:30, -5s after ~1:44 zone, +8s location @~3:23 new, -14s after 4:38 cut
    def t(h, m, s, ms=0):
        return f"{h}:{m:02d}:{s:02d}.{ms:02d}"

    # Using mapped times from original user cues:
    # 0:07 → 7
    # 0:23 → 23
    # 0:40-1:24 → still ~40-84 before 1:44 cut (before second cut) → 37-81 after first cut only...
    # We'll place relative to NEW timeline computed in build_timeline.

    header = f"""[Script Info]
Title: Lapa71 Polish
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Arial,{48},&H00FFFFFF,&H000000FF,&H80000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,5,60,60,80,1
Style: Body,Arial,{36},&H00F5F0E6,&H000000FF,&H80000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,5,80,80,120,1
Style: Gold,Arial,{40},&H0047C5E8,&H000000FF,&H80000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,5,60,60,100,1
Style: Brush,Georgia,{44},&H00FFFFFF,&H000000FF,&H90000000,&H64000000,-1,1,0,0,100,100,1,0,1,2,0,8,80,80,70,1
Style: Profile,Arial,{34},&H00FFFFFF,&H000000FF,&H80000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,4,70,70,160,1
Style: Handle,Arial Bold,{38},&H00FFFFFF,&H000000FF,&H80000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,6,60,60,120,1
Style: Small,Arial,{28},&H00E8E0D0,&H000000FF,&H80000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,5,80,80,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    # Events use NEW timeline seconds — filled by caller via template below
    # Placeholder file written fully in build_ass_for_timeline()
    path.write_text(header, encoding="utf-8")
    return path


def ass_time(sec: float) -> str:
    if sec < 0:
        sec = 0
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    cs = int(round((sec - int(sec)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def make_flow_creator_stamp(dest: Path) -> Path:
    """Kiss Your Heart seal used when 'Flow Creator' is typed out."""
    if dest.exists() and dest.stat().st_size > 5000:
        return dest
    kh = ASSETS / "kh_logo_rgba.png"
    if not kh.exists():
        make_transparent_logo(ASSETS / "kh_logo.png", kh, mode="auto")
    size = 420
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    # gold ring seal
    draw.ellipse((12, 12, size - 12, size - 12), outline=(232, 197, 71, 255), width=10)
    draw.ellipse((28, 28, size - 28, size - 28), outline=(232, 197, 71, 180), width=3)
    logo = Image.open(kh).convert("RGBA")
    logo.thumbnail((240, 240), Image.Resampling.LANCZOS)
    canvas.paste(logo, ((size - logo.size[0]) // 2, (size - logo.size[1]) // 2 - 20), logo)
    try:
        font = ImageFont.truetype(FONT_B, 28)
    except OSError:
        font = ImageFont.load_default()
    label = "FLOW CREATOR"
    bb = draw.textbbox((0, 0), label, font=font)
    draw.text(((size - (bb[2] - bb[0])) // 2, size - 78), label, fill=(232, 197, 71, 255), font=font)
    canvas.save(dest)
    return dest


def build_ass(new_map_notes: dict) -> Path:
    """Build English ASS on the NEW (post-cut) timeline."""
    def o2n(orig: float) -> float:
        if orig < 30:
            return orig
        if orig < 33:
            return 30.0
        if orig < 104:
            return orig - 3
        if orig < 109:
            return orig - 3
        if orig < 114:
            return 106.0
        if orig < 211:
            return orig - 8
        if orig < 278:
            return orig
        if orig < 292:
            return 278.0
        return orig - 14

    lines = []

    def ev(start_o, end_o, style, text, *, mapped=True):
        a = o2n(start_o) if mapped else start_o
        b = o2n(end_o) if mapped else end_o
        if b <= a:
            b = a + 0.8
        words = text.replace("\\N", " ").split()
        if len(words) <= 1:
            body = text
        else:
            dur_cs = max(20, int((b - a) * 100))
            each = max(6, dur_cs // max(1, len(words)))
            # keep explicit newlines as ASS breaks
            parts = []
            for chunk in text.split("\\N"):
                ws = chunk.split()
                parts.append("".join(f"{{\\k{each}}}{w} " for w in ws).strip())
            body = "\\N".join(parts)
        lines.append(
            f"Dialogue: 0,{ass_time(a)},{ass_time(b)},{style},,0,0,0,,{body}"
        )

    # Welcome + flyer
    ev(5.0, 7.0, "Title", "Welcome Fam to")
    ev(23.0, 27.0, "Body", "More than just an event — a place where every soul feels welcome.")
    ev(40.0, 52.0, "Body", "Built on community values — a supportive space and deep gratitude.")
    ev(53.0, 68.0, "Body", "For every artist, participant and soul in the room — thank you.")
    ev(69.0, 84.0, "Gold", "Like & share — every soul and art finds space and support here.")
    ev(85.0, 98.0, "Title", "Together we are growing. Now feel the day with us.")
    ev(88.0, 94.0, "Handle", "@arpanito")
    ev(100.0, 106.0, "Title", "Ready to meet today's artists and souls?")
    ev(106.5, 109.0, "Gold", "Ok, let's go.")

    # Arif
    ev(110.0, 118.0, "Profile",
       "Arif\\NArtist · Music Producer\\NFilmmaker\\NCertified Flow Creator\\N@eskalahonthebeat")
    ev(147.0, 151.0, "Brush", "He never learned that instrument before!")

    lines.append(
        f"Dialogue: 0,{ass_time(203.0)},{ass_time(211.0)},Body,,0,0,0,,"
        f"{{\\k25}}Lapa — {{\\k25}}beautiful {{\\k25}}people, {{\\k25}}easy {{\\k25}}to {{\\k25}}reach, "
        f"{{\\k25}}right {{\\k25}}by {{\\k25}}Greenstreet."
    )
    ev(198.0, 211.0, "Body", "Soft light, open hearts — this is the feeling of Lapa.")

    # Leonardo
    ev(228.0, 237.0, "Profile",
       "Leonardo\\NMusician · Scholar\\NFlow Creator\\N@meloleonnardo")
    ev(254.0, 258.0, "Title", "Are you ready for what's coming?")

    # Humble
    ev(312.0, 320.0, "Body", "Fam is looking so humble. Check them out.")
    ev(318.0, 326.0, "Small", "Clothing · humble-project.com")
    ev(314.0, 326.0, "Handle", "@_humble_project_")

    # Mr Isaac
    ev(328.0, 342.0, "Profile",
       "Mr Isaac\\NFounder of Wako Kungo\\NMusician · Visionary · Scholar\\NFlow Creator\\N@mistah_isaac")

    # Warm-up
    ev(346.0, 352.0, "Brush", "Did you enjoy the warm-up?")
    ev(352.0, 358.0, "Brush", "They're amazing, right?")
    ev(358.0, 366.0, "Brush", "Stay tuned for what's next — like, comment & follow.")
    ev(368.0, 369.5, "Gold", "Let's create the flow")
    ev(370.0, 371.0, "Title", "Feeling")
    ev(371.0, 372.0, "Title", "Understanding")
    ev(372.0, 373.0, "Title", "Jamming")

    # Ana / Marijana / Elisa — full artist cards (typewriter) + Flow Creator line
    # Placed on rebuilt tail after ~340s head cut → use absolute NEW times on final film:
    # head ends ~340; tail starts; intro offset ~1.3 — use absolute unmapped for tail profiles
    ev(348.0, 358.0, "Profile",
       "Ana\\NArtist · Vocalist\\NFlow Creator\\N@memyself.ana", mapped=False)
    ev(400.0, 412.0, "Profile",
       "Marijana\\NArtist · Vocalist\\NSoul voice of the circle\\NFlow Creator\\N@soulvoice_vadini", mapped=False)
    ev(450.0, 462.0, "Profile",
       "Elisa\\NArtist · Musician\\NFlow Creator\\N@elisa.cas8", mapped=False)
    # Also keep mapped mid-film reminders if stages appear earlier in head
    ev(160.0, 170.0, "Profile",
       "Ana\\NArtist · Vocalist\\NFlow Creator\\N@memyself.ana")
    ev(175.0, 186.0, "Profile",
       "Marijana\\NArtist · Vocalist\\NFlow Creator\\N@soulvoice_vadini")
    ev(190.0, 200.0, "Profile",
       "Elisa\\NArtist · Musician\\NFlow Creator\\N@elisa.cas8")

    ev(420.0, 430.0, "Small", "You can join this circle — artists of every field are welcome.")
    ev(480.0, 492.0, "Small", "Every participant is a Flow Creator — Kiss Your Heart.")
    ev(520.0, 532.0, "Small", "Circle D Stages is a supportive space. Explore Flow Talk & the Akademie too.")
    lines.append(
        f"Dialogue: 0,{ass_time(1140.0)},{ass_time(1158.0)},Body,,0,0,0,,"
        f"Thank you for watching.\\NLove to Greenstreet, Fam, artists & audience."
        f"\\NThis was a Circle D Stages project."
    )

    header = f"""[Script Info]
Title: Lapa71 Polish EN
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Arial,48,&H00FFFFFF,&H000000FF,&H90000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,5,60,60,90,1
Style: Body,Arial,36,&H00F5F0E6,&H000000FF,&H90000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,5,80,80,130,1
Style: Gold,Arial,40,&H0047C5E8,&H000000FF,&H90000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,5,60,60,110,1
Style: Brush,Georgia,44,&H00FFFFFF,&H000000FF,&HA0000000,&H64000000,-1,1,0,0,100,100,1,0,1,2,0,8,90,90,80,1
Style: Profile,Arial,34,&H00FFFFFF,&H000000FF,&H90000000,&H64000000,0,0,0,0,100,100,0,0,1,4,0,4,80,80,140,1
Style: Handle,Arial,38,&H00FFFFFF,&H000000FF,&H90000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,6,70,70,140,1
Style: Small,Arial,28,&H00E8E0D0,&H000000FF,&H90000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,5,80,80,210,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    dest = WORK / "polish_en.ass"
    dest.write_text(header + "\n".join(lines) + "\n", encoding="utf-8")
    return dest


# Moments when "Flow Creator" finishes typing → KH seal stamp (original times unless noted)
FLOW_STAMP_HITS = [
    # (start, end) on FINAL joined+polished timeline approximations
    (116.5, 119.5),   # Arif
    (167.5, 170.5),   # Ana early
    (183.5, 186.5),   # Marijana early
    (197.5, 200.5),   # Elisa early
    (235.5, 238.5),   # Leonardo
    (340.5, 343.5),   # Mr Isaac
    (356.5, 359.5),   # Ana tail
    (410.5, 413.5),   # Marijana tail
    (460.5, 463.5),   # Elisa tail
]


def build_timeline_body(out: Path) -> Path:
    """Apply structural cuts + 8s Lapa insert on master."""
    if out.exists() and out.stat().st_size > 500_000:
        return out
    dur = probe_dur(MASTER_IN)
    # Location insert: early outdoor B-roll with music bed from master
    loc = WORK / "_lapa_insert.mp4"
    if not (loc.exists() and loc.stat().st_size > 80_000):
        src = FT / "DSC_0919_proxy_1080p.mp4"
        if not src.exists():
            src = FT / "DSC_0920_proxy_1080p.mp4"
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-ss", "2", "-t", "8", "-i", str(src),
            "-ss", "200", "-t", "8", "-i", str(MASTER_IN),
            "-filter_complex",
            f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps=25,format=yuv420p[v];"
            f"[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.85[a]",
            "-map", "[v]", "-map", "[a]",
            *enc(), "-c:a", "aac", "-b:a", "192k", "-shortest", str(loc),
        ])

    # Extract kept segments
    segs = [
        ("a", 0.0, 30.0),
        ("b", 33.0, 104.0),
        ("c", 104.0, 109.0),
        ("d", 114.0, 211.0),
        ("e", 211.0, 278.0),
        ("f", 292.0, dur - 0.05),
    ]
    paths = []
    for name, ss, ee in segs:
        p = WORK / f"_seg_{name}.mp4"
        if not (p.exists() and p.stat().st_size > 80_000):
            print(f"  cut seg {name} {ss}-{ee}", flush=True)
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                "-ss", f"{ss:.2f}", "-to", f"{ee:.2f}", "-i", str(MASTER_IN),
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "19", "-threads", THREADS,
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                str(p),
            ])
        paths.append(p)
    # concat a,b,c,d, loc, e, f
    ordered = paths[:4] + [loc] + paths[4:]
    lst = WORK / "_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in ordered), encoding="utf-8")
    print("  concat timeline…", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out


def render_sticker_hit(base: Path, flyer: Path, slap: Path, out: Path,
                       hit_at: float = 7.0, hold: float = 1.6) -> Path:
    """At hit_at: slap flyer sticker, then vanish. Only re-encodes head; tail is stream-copied."""
    if out.exists() and out.stat().st_size > 500_000:
        try:
            if probe_dur(out) > 60:
                return out
        except Exception:
            out.unlink(missing_ok=True)
    fly = ASSETS / "flyer_sticker.png"
    if not fly.exists():
        im = Image.open(flyer).convert("RGBA")
        im.thumbnail((780, 980), Image.Resampling.LANCZOS)
        bordered = Image.new("RGBA", (im.size[0] + 24, im.size[1] + 24), (255, 255, 255, 255))
        bordered.paste(im, (12, 12), im)
        bordered.save(fly)
    end = hit_at + hold
    delay_ms = int(hit_at * 1000)
    head_end = max(end + 1.0, 12.0)
    head = WORK / "_sticker_head.mp4"
    if not (head.exists() and head.stat().st_size > 80_000):
        fc = (
            f"[1:v]format=rgba,"
            f"fade=t=in:st=0:d=0.12:alpha=1,fade=t=out:st={hold-0.35:.2f}:d=0.35:alpha=1[st];"
            f"[0:v][st]overlay=(W-w)/2:(H-h)/2:enable='between(t,{hit_at:.2f},{end:.2f})'[v];"
            f"[2:a]adelay={delay_ms}|{delay_ms},volume=1.3[slap];"
            f"[0:a][slap]amix=inputs=2:duration=first:dropout_transition=0[a]"
        )
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-t", f"{head_end:.2f}", "-i", str(base),
            "-loop", "1", "-t", f"{head_end:.2f}", "-i", str(fly),
            "-i", str(slap),
            "-filter_complex", fc,
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-threads", THREADS,
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(head),
        ])
    tail = WORK / "_sticker_tail.mp4"
    if not (tail.exists() and tail.stat().st_size > 80_000):
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-ss", f"{head_end:.2f}", "-i", str(base),
            "-c", "copy", str(tail),
        ])
    lst = WORK / "_sticker_concat.txt"
    lst.write_text(f"file '{head.as_posix()}'\nfile '{tail.as_posix()}'\n", encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out


def make_stamp_pop(dest: Path) -> Path:
    """2.4s KH seal pop: scale in + settle (stamp animation)."""
    if dest.exists() and dest.stat().st_size > 40_000:
        return dest
    stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")
    # animate via zoompan on transparent canvas
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(stamp),
        "-f", "lavfi", "-i", f"color=c=black@0.0:s={W}x{H}:d=2.4:r=25,format=rgba",
        "-filter_complex",
        "[0:v]format=rgba,scale=380:-1,"
        "fade=t=in:st=0:d=0.12:alpha=1,fade=t=out:st=1.9:d=0.45:alpha=1,"
        "rotate=a='-0.18+0.18*min(1\\,t/0.28)':c=none:ow=rotw(iw):oh=roth(ih)[s];"
        "[1:v][s]overlay=(W-w)/2+280:(H-h)/2+40:format=auto[v]",
        "-map", "[v]", "-t", "2.4", "-c:v", "png", "-pix_fmt", "rgba",
        str(dest.with_suffix(".mov")),
    ])
    # Prefer mov rgba; also make mp4 fallback with yuva420p if needed
    mov = dest.with_suffix(".mov")
    if mov.exists():
        return mov
    return dest


def shift_ass(src: Path, dest: Path, t0: float, t1: float) -> Path:
    """Keep only events overlapping [t0,t1) and shift times to chunk-local clock."""
    out_lines = []
    in_events = False
    for line in src.read_text(encoding="utf-8").splitlines():
        if line.startswith("[Events]"):
            in_events = True
            out_lines.append(line)
            continue
        if not in_events:
            out_lines.append(line)
            continue
        if not line.startswith("Dialogue:"):
            out_lines.append(line)
            continue
        # Dialogue: 0,H:MM:SS.cs,H:MM:SS.cs,Style,...
        parts = line.split(",", 9)
        if len(parts) < 10:
            continue

        def parse(ts: str) -> float:
            h, m, rest = ts.split(":")
            s, cs = rest.split(".")
            return int(h) * 3600 + int(m) * 60 + int(s) + int(cs) / 100.0

        a = parse(parts[1])
        b = parse(parts[2])
        if b <= t0 or a >= t1:
            continue
        a2 = max(0.0, a - t0)
        b2 = max(a2 + 0.05, min(t1 - t0, b - t0))
        parts[1] = ass_time(a2)
        parts[2] = ass_time(b2)
        out_lines.append(",".join(parts))
    dest.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    return dest


def burn_logos_and_ass(base: Path, ass: Path, out: Path) -> Path:
    """ASS karaoke typewriter + corner logos + KH Flow Creator seal (no rotate — fast)."""
    if out.exists() and out.stat().st_size > 500_000:
        try:
            if probe_dur(out) > 60:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_rgba.png"
    humble = ASSETS / "humble_logo_rgba.png"
    stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")

    total = probe_dur(base)
    chunk_len = 45.0
    chunks: list[Path] = []
    idx = 0
    t0 = 0.0
    while t0 < total - 0.05:
        t1 = min(total, t0 + chunk_len)
        cout = WORK / f"_burn_chunk_{idx:02d}.mp4"
        if cout.exists() and cout.stat().st_size > 80_000:
            try:
                if probe_dur(cout) > 2:
                    chunks.append(cout)
                    idx += 1
                    t0 = t1
                    continue
            except Exception:
                cout.unlink(missing_ok=True)

        print(f"  burn chunk {idx} {t0:.0f}-{t1:.0f}s", flush=True)
        cass = WORK / f"_burn_chunk_{idx:02d}.ass"
        shift_ass(ass, cass, t0, t1)
        ass_esc = str(cass).replace("\\", "/").replace(":", "\\:")
        hits = [(a, b) for a, b in FLOW_STAMP_HITS if b > t0 and a < t1]
        ens = "+".join(
            f"between(t\\,{max(0.0, a - t0):.2f}\\,{max(0.05, min(t1 - t0, b - t0)):.2f})"
            for a, b in hits
        ) or "0"

        if t0 < 40:
            fc = (
                f"[1:v]scale=90:-1,format=rgba[kh];"
                f"[2:v]scale=240:-1,format=rgba[mudec];"
                f"[2:v]scale=90:-1,format=rgba[mudes];"
                f"[3:v]scale=90:-1,format=rgba[wk];"
                f"[4:v]format=rgba,scale=280:-1[st];"
                f"[0:v]setsar=1,ass='{ass_esc}'[base];"
                f"[base][kh]overlay=40:40:enable='gte(t,{max(0, 6 - t0):.2f})'[v1];"
                f"[v1][mudec]overlay=(W-w)/2:(H-h)/2:enable='between(t,{max(0, 25 - t0):.2f},{max(0.05, 28 - t0):.2f})'[v2];"
                f"[v2][mudes]overlay=W-w-40:40:enable='gte(t,{max(0, 28 - t0):.2f})'[v3];"
                f"[v3][wk]overlay=W-w-40:140:enable='gte(t,{max(0, 35 - t0):.2f})'[v4];"
                f"[v4][st]overlay=W-w-340:H-h-110:enable='{ens}'[v]"
            )
            inputs = [
                "-ss", f"{t0:.2f}", "-t", f"{t1 - t0:.2f}", "-i", str(base),
                "-loop", "1", "-i", str(kh),
                "-loop", "1", "-i", str(mude),
                "-loop", "1", "-i", str(wako),
                "-loop", "1", "-i", str(stamp),
            ]
        else:
            fc = (
                f"[1:v]scale=90:-1,format=rgba[kh];"
                f"[2:v]scale=90:-1,format=rgba[wk];"
                f"[3:v]scale=90:-1,format=rgba[hum];"
                f"[4:v]format=rgba,scale=280:-1[st];"
                f"[0:v]setsar=1,ass='{ass_esc}'[base];"
                f"[base][kh]overlay=40:40[v1];"
                f"[v1][wk]overlay=W-w-40:40[v2];"
                f"[v2][hum]overlay=W-w-40:130:enable='gte(t,{max(0, 326 - t0):.2f})'[v3];"
                f"[v3][st]overlay=W-w-340:H-h-110:enable='{ens}'[v]"
            )
            inputs = [
                "-ss", f"{t0:.2f}", "-t", f"{t1 - t0:.2f}", "-i", str(base),
                "-loop", "1", "-i", str(kh),
                "-loop", "1", "-i", str(wako),
                "-loop", "1", "-i", str(humble),
                "-loop", "1", "-i", str(stamp),
            ]

        try:
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                *inputs,
                "-filter_complex", fc,
                "-map", "[v]", "-map", "0:a",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21", "-threads", THREADS,
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                str(cout),
            ])
            # validate moov
            probe_dur(cout)
        except Exception:
            cout.unlink(missing_ok=True)
            raise
        chunks.append(cout)
        idx += 1
        t0 = t1

    lst = WORK / "_burn_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in chunks), encoding="utf-8")
    print(f"  concat {len(chunks)} burn chunks", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out


def burn_tail_artist_cards(base: Path, out: Path) -> Path:
    """ASS typewriter + Flow Creator seal for Ana / Marijana / Elisa on rebuilt tail."""
    if out.exists() and out.stat().st_size > 500_000:
        try:
            if probe_dur(out) > 60:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    # Approx offsets inside build_tail_block concat
    ana_t, mar_t, eli_t = 198.0, 303.0, 418.0

    def tw(text: str, a: float, b: float) -> str:
        words = text.replace("\\N", " ").split()
        if len(words) <= 1:
            body = text
        else:
            dur_cs = max(20, int((b - a) * 100))
            each = max(6, dur_cs // max(1, len(words)))
            parts = []
            for chunk in text.split("\\N"):
                ws = chunk.split()
                parts.append("".join(f"{{\\k{each}}}{w} " for w in ws).strip())
            body = "\\N".join(parts)
        return f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Profile,,0,0,0,,{body}"

    lines = [
        tw("Ana\\NArtist · Vocalist\\NFlow Creator\\N@memyself.ana", ana_t, ana_t + 10),
        tw("Marijana\\NArtist · Vocalist\\NSoul voice of the circle\\NFlow Creator\\N@soulvoice_vadini", mar_t, mar_t + 12),
        tw("Elisa\\NArtist · Musician\\NFlow Creator\\N@elisa.cas8", eli_t, eli_t + 12),
        tw("Every participant is a Flow Creator — Kiss Your Heart.", eli_t + 14, eli_t + 26),
    ]
    header = f"""[Script Info]
Title: Lapa71 Tail Artists
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Profile,Arial,34,&H00FFFFFF,&H000000FF,&H90000000,&H64000000,0,0,0,0,100,100,0,0,1,4,0,4,80,80,140,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass = WORK / "tail_artists.ass"
    ass.write_text(header + "\n".join(lines) + "\n", encoding="utf-8")
    hits = [
        (ana_t + 8.5, ana_t + 11.5),
        (mar_t + 9.5, mar_t + 12.5),
        (eli_t + 9.5, eli_t + 12.5),
        (eli_t + 22.0, eli_t + 25.0),
    ]
    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")

    total = probe_dur(base)
    chunk_len = 200.0
    chunks: list[Path] = []
    idx = 0
    t0 = 0.0
    while t0 < total - 0.05:
        t1 = min(total, t0 + chunk_len)
        cout = WORK / f"_tail_burn_{idx:02d}.mp4"
        if cout.exists() and cout.stat().st_size > 80_000:
            try:
                if probe_dur(cout) > 2:
                    chunks.append(cout)
                    idx += 1
                    t0 = t1
                    continue
            except Exception:
                cout.unlink(missing_ok=True)
        print(f"  tail burn {idx} {t0:.0f}-{t1:.0f}s", flush=True)
        cass = WORK / f"_tail_burn_{idx:02d}.ass"
        shift_ass(ass, cass, t0, t1)
        ass_esc = str(cass).replace("\\", "/").replace(":", "\\:")
        local_hits = [(a, b) for a, b in hits if b > t0 and a < t1]
        ens = "+".join(
            f"between(t\\,{max(0.0, a - t0):.2f}\\,{max(0.05, min(t1 - t0, b - t0)):.2f})"
            for a, b in local_hits
        ) or "0"
        fc = (
            f"[1:v]scale=90:-1,format=rgba[kh];"
            f"[2:v]scale=90:-1,format=rgba[wk];"
            f"[3:v]format=rgba,scale=280:-1[st];"
            f"[0:v]setsar=1,ass='{ass_esc}'[base];"
            f"[base][kh]overlay=40:40[v1];"
            f"[v1][wk]overlay=W-w-40:40[v2];"
            f"[v2][st]overlay=W-w-340:H-h-110:enable='{ens}'[v]"
        )
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-ss", f"{t0:.2f}", "-t", f"{t1 - t0:.2f}", "-i", str(base),
            "-loop", "1", "-i", str(kh),
            "-loop", "1", "-i", str(wako),
            "-loop", "1", "-i", str(stamp),
            "-filter_complex", fc,
            "-map", "[v]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21", "-threads", THREADS,
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(cout),
        ])
        try:
            probe_dur(cout)
        except Exception:
            cout.unlink(missing_ok=True)
            raise
        chunks.append(cout)
        idx += 1
        t0 = t1

    lst = WORK / "_tail_burn_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in chunks), encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out


def build_tail_block(out: Path) -> Path:
    """From warm-up onward: IMG_8924 performance + 0931 + Ana + guests + credits ending."""
    if out.exists() and out.stat().st_size > 500_000:
        return out
    parts: list[Path] = []
    n = 0

    def nxt(label: str) -> Path:
        nonlocal n
        n += 1
        return WORK / f"tail_{n:02d}_{label}.mp4"

    def plain(src: Path, ss: float, take: float, label: str, vf: str = "") -> Path:
        dest = nxt(label)
        if dest.exists() and dest.stat().st_size > 80_000:
            return dest
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-ss", f"{ss:.2f}", "-t", f"{take:.2f}", "-i", str(src),
            "-vf", vf or (
                f"scale={W}:{H}:force_original_aspect_ratio=increase,"
                f"crop={W}:{H},setsar=1,fps=25,format=yuv420p"
            ),
            *enc(), "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            str(dest),
        ]
        run(cmd)
        return dest

    def nest(main: Path, over: Path, ss_m: float, ss_o: float, take: float, label: str, scale=0.90) -> Path:
        dest = nxt(label)
        if dest.exists() and dest.stat().st_size > 80_000:
            return dest
        ow, oh = int(W * scale) // 2 * 2, int(H * scale) // 2 * 2
        ox, oy = (W - ow) // 2, (H - oh) // 2
        fc = (
            f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps=25,format=yuv420p[base];"
            f"[1:v]scale={ow}:{oh}:force_original_aspect_ratio=increase,crop={ow}:{oh},setsar=1,fps=25,format=yuv420p,"
            f"drawbox=0:0:{ow}:{oh}:white@0.3:t=2[p];"
            f"[base][p]overlay={ox}:{oy}[v]"
        )
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-ss", f"{ss_m:.2f}", "-t", f"{take:.2f}", "-i", str(main),
            "-ss", f"{ss_o:.2f}", "-t", f"{take:.2f}", "-i", str(over),
            "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
            *enc(), "-c:a", "aac", "-b:a", "192k", "-shortest", str(dest),
        ])
        return dest

    p8924 = ARPAN / "IMG_8924.MOV"
    p931 = FT / "DSC_0931_proxy_1080p.mp4"
    p1499 = FT / "DSC_1499_proxy_1080p.mp4"
    p1501 = FT / "DSC_1501_proxy_1080p.mp4"  # Marijana / Maryna
    p1504 = FT / "DSC_1504_proxy_1080p.mp4"  # Elisa + Leonardo
    p1540 = FT / "DSC_1540_proxy_1080p.mp4"
    p1542 = FT / "DSC_1542_proxy_1080p.mp4"
    rene = FT / "GUEST_RENE_IMG_8190.mov"
    chris = next(iter(sorted(FT.glob("GUEST_CHRIS_20260829_20*.mp4"))), None)

    print("  tail IMG_8924 warm-up + performance", flush=True)
    if p8924.exists():
        parts.append(nest(p8924, p8924, 180.0, 185.0, 8.0, "8924_zoom", scale=0.82))
        parts.append(plain(p8924, 201.0, 90.0, "8924_perf"))
        if p931.exists():
            if chris:
                parts.append(nest(p931, chris, 20.0, 10.0, 40.0, "931_chris"))
            parts.append(plain(p931, 70.0, 50.0, "931_fs"))
            if rene.exists():
                parts.append(nest(p931, rene, 130.0, 0.0, 8.0, "931_rene"))

        # Ana
        if p1499.exists():
            print("  tail Ana 1499", flush=True)
            g = chris or rene
            if g and Path(g).exists():
                parts.append(nest(p1499, Path(g), 10.0, 5.0, 55.0, "ana_pip"))
            parts.append(plain(p1499, 70.0, 50.0, "ana_fs"))

        # Marijana / Maryna
        if p1501.exists() and probe_dur(p1501) > 20:
            print("  tail Marijana 1501", flush=True)
            g = next(
                (p for p in sorted(FT.glob("GUEST_CHRIS_20260829_20*.mp4"))
                 if p != chris),
                rene,
            )
            if g and Path(g).exists():
                parts.append(nest(p1501, Path(g), 15.0, 8.0, 60.0, "marijana_pip"))
            parts.append(plain(p1501, 90.0, 55.0, "marijana_fs"))

        # Elisa
        if p1504.exists():
            print("  tail Elisa 1504", flush=True)
            g = rene if rene.exists() else chris
            if g and Path(g).exists():
                parts.append(nest(p1504, Path(g), 20.0, 0.0, 65.0, "elisa_pip"))
            parts.append(plain(p1504, 100.0, 55.0, "elisa_fs"))

    # Credits ending
    print("  tail credits 1540+1542", flush=True)
    if p1540.exists() and p1542.exists():
        parts.append(nest(p1540, p1542, 2.0, 4.0, 7.0, "credits_nest", scale=0.92))
    # thanks card
    thanks = nxt("thanks")
    if not (thanks.exists() and thanks.stat().st_size > 40_000):
        canvas = Image.new("RGB", (W, H), (0, 0, 0))
        draw = ImageDraw.Draw(canvas)
        try:
            f1 = ImageFont.truetype(FONT_B, 48)
            f2 = ImageFont.truetype(FONT_R, 30)
        except OSError:
            f1 = f2 = ImageFont.load_default()
        texts = [
            (f1, "Thank you for watching", 360),
            (f2, "Love to Greenstreet · Fam · artists & audience", 450),
            (f2, "Join the circle — artists of every field are welcome.", 520),
            (f2, "This was a Circle D Stages project.", 590),
            (f2, "Explore Flow Talk & the Akademie too.", 650),
        ]
        for font, text, y in texts:
            bb = draw.textbbox((0, 0), text, font=font)
            draw.text(((W - (bb[2] - bb[0])) // 2, y), text, fill=(255, 255, 255), font=font)
        png = thanks.with_suffix(".png")
        canvas.save(png)
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-loop", "1", "-i", str(png),
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
            "-t", "12", *enc(), "-c:a", "aac", "-b:a", "128k", "-shortest", str(thanks),
        ])
    parts.append(thanks)

    lst = WORK / "_tail_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)

    print("ASSETS", flush=True)
    make_transparent_logo(ASSETS / "kh_logo.png", ASSETS / "kh_logo_rgba.png", mode="auto")
    make_transparent_logo(ASSETS / "wako_logo.jpeg", ASSETS / "wako_logo_rgba.png", mode="white")
    make_transparent_logo(ASSETS / "mude_logo_raw.png", ASSETS / "mude_logo_rgba.png", mode="black")
    make_transparent_logo(ASSETS / "humble_logo_raw.png", ASSETS / "humble_logo_rgba.png", mode="auto")
    make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")
    slap = make_slap_wav(ASSETS / "slap.wav")

    # Force rebuild of overlay-dependent stages when copy/stamps change
    for stale in (
        WORK / "polish_en.ass",
        WORK / "polished_main.mp4",
        WORK / "polished_head.mp4",
        WORK / "tail_block.mp4",
        WORK / "tail_burned.mp4",
        WORK / "final_body.mp4",
    ):
        stale.unlink(missing_ok=True)
    for stale in WORK.glob("tail_*.mp4"):
        stale.unlink(missing_ok=True)
    for stale in WORK.glob("_burn_chunk_*.mp4"):
        stale.unlink(missing_ok=True)
    for stale in WORK.glob("_tail_burn_*.mp4"):
        stale.unlink(missing_ok=True)

    print("INTRO card", flush=True)
    intro = make_kh_intro_card(WORK / "00_kh_intro.mp4", 5.8)

    print("TIMELINE cuts + Lapa insert", flush=True)
    body = build_timeline_body(WORK / "timeline_body.mp4")

    # Prepend intro (replace tiny original intro feel)
    print("JOIN intro + body", flush=True)
    joined = WORK / "joined.mp4"
    if not (joined.exists() and joined.stat().st_size > 500_000):
        # skip first ~4.5s of body (old intro cards) to avoid double intro
        body_trim = WORK / "body_trim.mp4"
        if not (body_trim.exists() and body_trim.stat().st_size > 500_000):
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                "-ss", "4.5", "-i", str(body),
                "-c", "copy", str(body_trim),
            ])
        lst = WORK / "_join.txt"
        lst.write_text(
            f"file '{intro.as_posix()}'\nfile '{body_trim.as_posix()}'\n",
            encoding="utf-8",
        )
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy", str(joined),
        ])

    print("STICKER slap @7s", flush=True)
    slapped = render_sticker_hit(joined, ASSETS / "flyer_lapa71.jpeg", slap, WORK / "with_sticker.mp4", 7.0, 1.7)

    # Head only for overlays (tail replaces after ~340s) — burns Ana/Marijana/Elisa mid cards + stamps
    cut_at = 340.0
    head_src = WORK / "head_src.mp4"
    if not (head_src.exists() and head_src.stat().st_size > 500_000):
        print(f"CUT head @{cut_at:.0f}s for burn", flush=True)
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
            "-t", f"{cut_at:.2f}", "-i", str(slapped),
            "-c", "copy", str(head_src),
        ])

    print("TYPEWRITER + logos + Flow Creator stamps (head)", flush=True)
    ass = build_ass({})
    head = burn_logos_and_ass(head_src, ass, WORK / "polished_head.mp4")

    # Tail: IMG_8924 + Ana / Marijana / Elisa performances + credits
    print("TAIL Ana + Marijana + Elisa + credits", flush=True)
    tail = build_tail_block(WORK / "tail_block.mp4")

    # Burn typewriter/stamp overlays onto early tail artist intros (relative 0…)
    # Map absolute card times 348/400/450 → relative after concat; burn on full final instead
    # by a light second pass on tail only for artist cards at local times:
    # Ana ~8–18s into tail, Marijana ~60–72, Elisa ~110–122 (approx from build_tail lengths).
    # Simpler: overlay cards during tail build via a dedicated pass.
    print("TAIL artist typewriters + stamps", flush=True)
    tail_burned = burn_tail_artist_cards(tail, WORK / "tail_burned.mp4")

    final_body = WORK / "final_body.mp4"
    if not (final_body.exists() and final_body.stat().st_size > 500_000):
        lst = WORK / "_final.txt"
        lst.write_text(
            f"file '{head.as_posix()}'\nfile '{tail_burned.as_posix()}'\n",
            encoding="utf-8",
        )
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(lst),
            "-c", "copy", str(final_body),
        ])

    dur = probe_dur(final_body)
    print(f"EXPORT draft {dur/60:.1f} min (stream copy + short fades)", flush=True)
    OUT_DRAFT.parent.mkdir(parents=True, exist_ok=True)
    OUT_ALIAS.parent.mkdir(parents=True, exist_ok=True)
    OUT_MASTER.parent.mkdir(parents=True, exist_ok=True)
    # Fast path: copy body to draft/alias; master light re-encode only if needed
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(final_body),
        "-c", "copy",
        str(OUT_DRAFT),
    ])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_DRAFT), "-c", "copy", str(OUT_ALIAS)])
    print("master copy…", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(OUT_DRAFT),
        "-c", "copy",
        str(OUT_MASTER),
    ])

    meta = {
        "title": "Tagus Drop Rhythm — Polished Directed Aftermovie (EN)",
        "duration_sec": probe_dur(OUT_MASTER),
        "english_copy": {
            "slogan": "Because you make the effort.",
            "welcome": "Welcome Fam to",
            "place": "More than just an event — a place where every soul feels welcome.",
            "community": [
                "Built on community values — a supportive space and deep gratitude.",
                "Like & share — every soul and art finds space and support here.",
                "Together we are growing. Now feel the day with us.",
            ],
            "artists_cta": ["Ready to meet today's artists and souls?", "Ok, let's go."],
            "instrument": "He never learned that instrument before!",
            "lapa": "Lapa — beautiful people, easy to reach, right by Greenstreet.",
            "coming": "Are you ready for what's coming?",
            "humble": "Fam is looking so humble. Check them out.",
            "warmup": ["Did you enjoy the warm-up?", "They're amazing, right?", "Stay tuned for what's next"],
            "flow": ["Let's create the flow", "Feeling", "Understanding", "Jamming"],
            "thanks": "Thank you for watching. Love to Greenstreet. This was a Circle D Stages project.",
        },
        "cuts": ["remove 0:30-0:33", "shorten 1:44-1:54 by 5s", "remove 4:38-4:52", "+8s Lapa insert"],
        "output": str(OUT_DRAFT),
        "master": str(OUT_MASTER),
    }
    (OUT_DRAFT.parent / "polish_v5_project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"DONE {OUT_MASTER} {meta['duration_sec']/60:.1f} min", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
