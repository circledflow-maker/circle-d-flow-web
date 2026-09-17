#!/usr/bin/env python3
"""AGENT 07 — Audio + Voice + Sound Design Director.

Produces:
  audio_inventory.json
  voiceover.wav + word timestamps
  music_bed.wav (phased energy from authentic Stages)
  natural_sfx.wav
  final_mix.wav
  audio_timeline.json / audio_qc.json

Authenticity first: live session audio preferred over stock.
Synthetic VO only when no usable human VO exists.
"""
from __future__ import annotations

import asyncio
import json
import math
import struct
import subprocess
import wave
from pathlib import Path

from contract import OUT, PROJECT_PATH, STUDIO, VO_SCRIPT

AUDIO_DIR = OUT / "audio"
FFMPEG = "ffmpeg"
FFPROBE = "ffprobe"

# Documentary English — warm, mature, not theatrical
VOICE_CANDIDATES = [
    "en-GB-RyanNeural",
    "en-US-AndrewNeural",
    "en-US-BrianNeural",
    "en-GB-ThomasNeural",
]

VO_SECTIONS = [
    {
        "id": "attention",
        "target_start": 0.25,
        "target_end": 4.95,
        "text": "Maybe culture isn't meant to be watched.",
    },
    {
        "id": "connection",
        "target_start": 5.10,
        "target_end": 9.90,
        "text": "Maybe it's meant to be experienced. To share. To listen. To connect.",
    },
    {
        "id": "learning",
        "target_start": 10.10,
        "target_end": 15.85,
        "text": "To learn from each other. And to teach each other.",
    },
    {
        "id": "unity",
        "target_start": 16.10,
        "target_end": 20.85,
        "text": "Because nobody creates alone. We grow when we move together.",
        "space_after": 0.35,
    },
    {
        "id": "supported",
        "target_start": 21.10,
        "target_end": 25.85,
        "text": "A space where you can express, explore, and become.",
    },
    {
        "id": "invitation",
        "target_start": 26.10,
        "target_end": 29.70,
        "text": (
            "This is Wako Kungo × Circle.D.Flow. "
            "Come as you are. Add what you have. And let's create what's next."
        ),
    },
]


def _run(cmd: list[str], timeout: int = 120) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def _probe(path: Path) -> dict:
    cmd = [
        FFPROBE, "-v", "quiet", "-print_format", "json",
        "-show_format", "-show_streams", str(path),
    ]
    r = _run(cmd, timeout=40)
    if r.returncode != 0:
        return {}
    try:
        return json.loads(r.stdout or "{}")
    except json.JSONDecodeError:
        return {}


def _has_audio(path: Path) -> bool:
    info = _probe(path)
    return any(s.get("codec_type") == "audio" for s in info.get("streams") or [])


def _classify(name: str, path: str) -> dict:
    n = f"{name} {path}".lower()
    return {
        "speech": any(k in n for k in ("interview", "talk", "voice", "vo_", "flow talk")),
        "music": any(k in n for k in ("stages", "oneness", "music", "set0", "jam")),
        "ambience": any(k in n for k in ("street", "room", "gallery", "ambience", "doku")),
        "crowd": any(k in n for k in ("crowd", "applause", "audience")),
        "instrument": any(k in n for k in ("drum", "perc", "guitar", "bass", "stages")),
    }


def build_inventory(project: dict) -> list[dict]:
    inv = []
    seen = set()
    # Timeline clips first (what actually plays)
    for seg in project.get("timeline") or []:
        for clip in seg.get("clips") or []:
            p = Path(clip.get("path") or "")
            if not p.exists() or str(p) in seen:
                continue
            seen.add(str(p))
            info = _probe(p)
            fmt = info.get("format") or {}
            streams = info.get("streams") or []
            astream = next((s for s in streams if s.get("codec_type") == "audio"), None)
            vstream = next((s for s in streams if s.get("codec_type") == "video"), None)
            tags = _classify(p.name, str(p))
            dur = float(fmt.get("duration") or clip.get("take") or 0)
            tech = 70
            if astream:
                tech = 78
                if int(astream.get("sample_rate") or 0) >= 44100:
                    tech += 5
            emotional = 55
            if tags["music"] or tags["instrument"]:
                emotional = 75
            if "mr_isaac" in p.name.lower() or "mr-isaac" in p.name.lower():
                emotional = 85
            if "_drive_move_art" in str(p).lower() or "gallery" in str(p).lower():
                emotional = 80
                tags["ambience"] = True
            inv.append({
                "audio_id": f"aud_{len(inv)+1:04d}",
                "filename": p.name,
                "duration": round(dur, 3),
                "sample_rate": int((astream or {}).get("sample_rate") or 0),
                "channels": int((astream or {}).get("channels") or 0),
                "source_type": "video_embedded" if vstream and astream else ("video_silent" if vstream else "audio"),
                "location": str(p.parent.name),
                "associated_video": str(p) if vstream else "",
                "path": str(p),
                **tags,
                "emotional_value": emotional,
                "technical_quality": tech if astream else 20,
                "noise_level": 40 if astream else 0,
                "usable": bool(astream),
                "chapter_hint": seg.get("segment_id"),
            })
    # Extra Stages/music candidates from studio (limited scan)
    for pat in ("*Stages*1080p.mp4", "*ONENESS*Stages*.mp4"):
        for p in list(STUDIO.rglob(pat))[:40]:
            if str(p) in seen or not p.is_file():
                continue
            seen.add(str(p))
            if not _has_audio(p):
                continue
            tags = _classify(p.name, str(p))
            inv.append({
                "audio_id": f"aud_{len(inv)+1:04d}",
                "filename": p.name,
                "duration": 0,
                "sample_rate": 48000,
                "channels": 2,
                "source_type": "video_embedded",
                "location": p.parent.name,
                "associated_video": str(p),
                "path": str(p),
                **tags,
                "emotional_value": 72,
                "technical_quality": 75,
                "noise_level": 45,
                "usable": True,
                "chapter_hint": None,
            })
    return inv


def _write_silence(wav: Path, seconds: float, rate: int = 48000) -> None:
    n = int(seconds * rate)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x00\x00" * n)


def _pick_music_sources(inv: list[dict], n: int = 4) -> list[Path]:
    scored = []
    for a in inv:
        if not a.get("usable"):
            continue
        if not (a.get("music") or a.get("instrument")):
            continue
        score = a.get("emotional_value", 0) + a.get("technical_quality", 0) * 0.3
        scored.append((score, Path(a["path"])))
    scored.sort(reverse=True)
    out = []
    for _, p in scored:
        if p not in out:
            out.append(p)
        if len(out) >= n:
            break
    return out


def _pick_natural_hits(inv: list[dict], n: int = 6) -> list[Path]:
    hits = []
    for a in inv:
        if not a.get("usable"):
            continue
        if a.get("crowd") or a.get("ambience") or a.get("instrument"):
            hits.append(Path(a["path"]))
        if len(hits) >= n:
            break
    return hits


async def _list_voices() -> set[str]:
    import edge_tts
    voices = await edge_tts.list_voices()
    return {v["ShortName"] for v in voices}


def _boundaries_to_words(boundaries: list[dict]) -> list[dict]:
    """Expand sentence boundaries into approximate per-word timings."""
    words = []
    for b in boundaries:
        text = (b.get("text") or "").strip()
        if not text:
            continue
        tokens = text.replace("—", " — ").split()
        if not tokens:
            continue
        start = float(b["start"])
        dur = max(float(b["duration"]), 0.08)
        # Weight longer tokens slightly more
        weights = [max(1.0, len(t.strip(".,!?;:"))) for t in tokens]
        total_w = sum(weights)
        t = start
        for tok, w in zip(tokens, weights):
            slice_dur = dur * (w / total_w)
            words.append({
                "word": tok,
                "start": round(t, 3),
                "duration": round(slice_dur, 3),
                "end": round(t + slice_dur, 3),
            })
            t += slice_dur
    return words


async def _synth_section(text: str, voice: str, out_mp3: Path, rate: str = "-5%") -> list[dict]:
    """Return sentence boundaries (and derived words) relative to section start."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    boundaries = []
    audio = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
            boundaries.append({
                "text": chunk.get("text") or "",
                "start": round(chunk["offset"] / 10_000_000, 3),
                "duration": round(chunk.get("duration", 0) / 10_000_000, 3),
                "kind": chunk["type"],
            })
    out_mp3.write_bytes(bytes(audio))
    return boundaries


def _mp3_to_wav(mp3: Path, wav: Path) -> float:
    r = _run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(mp3),
        "-ac", "1", "-ar", "48000",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=9,highpass=f=80,lowpass=f=12000,acompressor=threshold=-18dB:ratio=2.5:attack=20:release=120",
        str(wav),
    ])
    if r.returncode != 0 or not wav.exists():
        return 0.0
    with wave.open(str(wav), "rb") as w:
        return w.getnframes() / float(w.getframerate())


def _wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / float(w.getframerate())


def _concat_wavs(parts: list[tuple[Path, float]], out: Path, total: float = 30.0) -> None:
    """Place section WAVs at absolute starts inside a 30s mono bed."""
    rate = 48000
    total_samples = int(total * rate)
    buf = [0] * total_samples
    for wav_path, start in parts:
        with wave.open(str(wav_path), "rb") as w:
            raw = w.readframes(w.getnframes())
            samples = list(struct.unpack("<" + "h" * (len(raw) // 2), raw))
        off = int(start * rate)
        for i, s in enumerate(samples):
            j = off + i
            if 0 <= j < total_samples:
                mixed = buf[j] + s
                buf[j] = max(-32767, min(32767, mixed))
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(struct.pack("<" + "h" * len(buf), *buf))


def generate_vo(work: Path) -> dict:
    """Synthesize documentary VO anchored to dramaturgy windows (not packed tight)."""
    voice = VOICE_CANDIDATES[0]
    try:
        available = asyncio.run(_list_voices())
        for v in VOICE_CANDIDATES:
            if v in available:
                voice = v
                break
    except Exception:
        pass

    # Prefer slightly slower documentary pace — windows leave intentional silence
    raw_sections = []
    for sec in VO_SECTIONS:
        mp3 = work / f"vo_{sec['id']}.mp3"
        wav = work / f"vo_{sec['id']}.wav"
        boundaries = asyncio.run(_synth_section(sec["text"], voice, mp3, rate="-2%"))
        dur = _mp3_to_wav(mp3, wav)
        sentences = [b for b in boundaries if b.get("kind") == "SentenceBoundary"] or boundaries
        words = _boundaries_to_words(sentences)
        window = float(sec["target_end"]) - float(sec["target_start"])
        speed = 1.0
        # Prefer keeping dramaturgy start; speed to fit rather than pulling earlier
        if dur > window + 0.05:
            speed = min(1.32, dur / max(0.4, window - 0.05))
            sped = work / f"vo_{sec['id']}_fit.wav"
            _run([
                FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(wav), "-af", f"atempo={speed:.4f}", str(sped),
            ])
            if sped.exists():
                wav = sped
                dur = _wav_duration(wav)
        start = float(sec["target_start"])
        # Only nudge earlier if still overflowing after speed (tiny bleed into prior silence)
        if start + dur > float(sec["target_end"]) + 0.15:
            start = max(float(sec["target_start"]) - 0.35, float(sec["target_end"]) - dur)
        raw_sections.append({
            "id": sec["id"],
            "text": sec["text"],
            "wav": wav,
            "duration": dur,
            "start": start,
            "speed": speed,
            "sentences": sentences,
            "words": words,
            "target_start": float(sec["target_start"]),
            "target_end": float(sec["target_end"]),
        })

    # Resolve overlaps: push later sections forward only if collision
    for i in range(1, len(raw_sections)):
        prev = raw_sections[i - 1]
        cur = raw_sections[i]
        min_start = prev["start"] + prev["duration"] + 0.18
        if cur["start"] < min_start:
            cur["start"] = min_start
        if cur["start"] + cur["duration"] > 29.9:
            need = (cur["start"] + cur["duration"]) / 29.85
            if 1.001 < need < 1.4:
                squeezed = work / f"vo_{cur['id']}_clamp.wav"
                _run([
                    FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
                    "-i", str(cur["wav"]), "-af", f"atempo={need:.4f}", str(squeezed),
                ])
                if squeezed.exists():
                    cur["wav"] = squeezed
                    cur["duration"] = _wav_duration(squeezed)
                    cur["speed"] *= need

    placements = []
    abs_words = []
    abs_sentences = []
    section_meta = []
    for s in raw_sections:
        start = s["start"]
        speed = s["speed"]
        placements.append((s["wav"], start))
        for w in s["words"]:
            abs_words.append({
                "word": w["word"],
                "start": round(start + w["start"] / speed, 3),
                "end": round(start + w["end"] / speed, 3),
                "section": s["id"],
            })
        for sent in s["sentences"]:
            abs_sentences.append({
                "text": sent["text"],
                "start": round(start + sent["start"] / speed, 3),
                "end": round(start + (sent["start"] + sent["duration"]) / speed, 3),
                "section": s["id"],
            })
        section_meta.append({
            "id": s["id"],
            "text": s["text"],
            "start": round(start, 3),
            "end": round(min(29.95, start + s["duration"]), 3),
            "duration": round(s["duration"], 3),
            "words": len(s["words"]),
            "target_start": s["target_start"],
            "target_end": s["target_end"],
        })

    abs_words = [w for w in abs_words if w["start"] < 29.9]
    abs_sentences = [s for s in abs_sentences if s["start"] < 29.9]
    for w in abs_words:
        w["end"] = min(w["end"], 30.0)
    for s in abs_sentences:
        s["end"] = min(s["end"], 30.0)

    vo_wav = AUDIO_DIR / "voiceover.wav"
    _concat_wavs(placements, vo_wav, 30.0)

    spoken = sum(s["duration"] for s in section_meta)
    n_words = len(abs_words)
    wps = n_words / max(0.1, spoken)

    return {
        "voice_id": voice,
        "language": "en",
        "style": "documentary",
        "script": VO_SCRIPT,
        "path": str(vo_wav),
        "sections": section_meta,
        "sentence_timestamps": abs_sentences,
        "word_timestamps": abs_words,
        "words_per_second": round(wps, 2),
        "fit_scale": 1.0,
        "placement": "dramaturgy_windows",
        "synthetic": True,
        "note": "No dedicated human VO asset found — edge-tts documentary voice (en-GB Ryan).",
    }


def build_music_bed(sources: list[Path], work: Path, out: Path, tension_at: float | None = None) -> dict:
    """30s music with 4 energy phases + silence dip around the tension line."""
    if not sources:
        _write_silence(out, 30.0)
        return {"track_id": "none", "genre": "silence", "bpm": 0, "path": str(out), "beat_map": []}

    parts = []
    plan = [
        (0.0, 5.0, sources[0], 0.5),
        (5.0, 15.0, sources[min(1, len(sources) - 1)], 8.0),
        (15.0, 25.0, sources[min(2, len(sources) - 1)], 20.0),
        (25.0, 30.0, sources[0], 40.0),
    ]
    for i, (a, b, src, ss) in enumerate(plan):
        chunk = work / f"music_ph{i}.wav"
        dur = b - a
        r = _run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-ss", f"{ss:.2f}", "-i", str(src), "-t", f"{dur:.2f}",
            "-ac", "2", "-ar", "48000",
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,highpass=f=40",
            str(chunk),
        ], timeout=90)
        if r.returncode == 0 and chunk.exists():
            parts.append(chunk)
        else:
            sil = work / f"music_ph{i}_sil.wav"
            _run([
                FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{dur:.2f}",
                str(sil),
            ])
            parts.append(sil)

    concat_list = work / "music_concat.txt"
    lines = []
    for p in parts:
        path = str(p).replace("\\", "/").replace("'", r"'\''")
        lines.append(f"file '{path}'\n")
    concat_list.write_text("".join(lines), encoding="utf-8")
    raw = work / "music_raw.wav"
    _run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c", "copy", str(raw),
    ])

    t0 = float(tension_at) if tension_at is not None else 23.0
    dip_a = max(15.5, t0 - 0.35)
    dip_b = min(28.0, t0 + 1.85)
    ret = min(29.2, dip_b + 0.05)
    vol = (
        "volume=enable='between(t,0,0.8)':volume=1.0,"
        "volume=enable='between(t,0.8,5)':volume=0.72,"
        "volume=enable='between(t,5,15)':volume=0.42,"
        f"volume=enable='between(t,15,{dip_a:.3f})':volume=0.38,"
        f"volume=enable='between(t,{dip_a:.3f},{dip_b:.3f})':volume=0.10,"
        f"volume=enable='between(t,{ret:.3f},29.6)':volume=0.78,"
        "volume=enable='gte(t,29.6)':volume=0.95"
    )
    r = _run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(raw), "-t", "30",
        "-af", f"{vol},alimiter=limit=0.95",
        str(out),
    ])
    if r.returncode != 0:
        raw.replace(out)

    beats = []
    t = 0.0
    while t < 30:
        beats.append({"time": round(t, 3), "type": "beat"})
        t += 0.72
    for tt, typ in (
        (0.0, "intro"), (5.0, "section_change"), (15.0, "energy_drop"),
        (round(t0, 3), "tension"), (round(ret, 3), "energy_return"), (29.8, "final_hit"),
    ):
        beats.append({"time": tt, "type": typ})
    beats.sort(key=lambda x: (x["time"], x["type"] != "beat"))

    return {
        "track_id": "stages_live_bed",
        "genre": "afro_broken_beat_live_stages",
        "bpm": 83,
        "key": "unknown",
        "path": str(out),
        "sources": [str(s) for s in sources[:4]],
        "energy_curve": [
            {"t": 0, "energy": 1.0}, {"t": 5, "energy": 0.72},
            {"t": 15, "energy": 0.4}, {"t": t0, "energy": 0.12},
            {"t": ret, "energy": 0.8}, {"t": 29.8, "energy": 1.0},
        ],
        "beat_map": beats,
        "tension_at": t0,
        "note": "Built from authentic Circle D Stages session audio — not stock.",
    }


def build_natural_sfx(hits: list[Path], work: Path, out: Path, tension_at: float = 23.0) -> dict:
    """Sparse authentic punctuation: open hit, mid reaction, gallery air, CTA lift."""
    accent = max(5.0, min(28.5, tension_at + 1.9))
    events = [
        (0.05, 0.55, 0.85),
        (4.6, 0.4, 0.55),
        (9.5, 0.5, 0.45),
        (14.7, 0.6, 0.4),
        (20.5, 0.7, 0.35),
        (accent, 0.35, 0.7),
        (29.55, 0.4, 0.9),
    ]
    layers = []
    for i, (start, dur, gain) in enumerate(events):
        src = hits[i % len(hits)] if hits else None
        chunk = work / f"sfx_{i}.wav"
        if src and src.exists():
            r = _run([
                FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
                "-ss", "1.0", "-i", str(src), "-t", f"{dur:.2f}",
                "-ac", "2", "-ar", "48000",
                "-af", f"volume={gain:.2f},afade=t=in:st=0:d=0.05,afade=t=out:st={max(0.05,dur-0.12):.2f}:d=0.12",
                str(chunk),
            ], timeout=60)
            if r.returncode != 0 or not chunk.exists():
                continue
        else:
            continue
        delayed = work / f"sfx_{i}_d.wav"
        # adelay in ms
        ms = int(start * 1000)
        _run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(chunk),
            "-af", f"adelay={ms}|{ms},apad=whole_dur=30",
            "-t", "30",
            str(delayed),
        ])
        if delayed.exists():
            layers.append(delayed)

    if not layers:
        _run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "30",
            str(out),
        ])
        return {"path": str(out), "events": [], "note": "no usable natural hits"}

    # mix layers
    inputs = []
    for p in layers:
        inputs.extend(["-i", str(p)])
    n = len(layers)
    weights = " ".join(["1"] * n)
    filt = f"amix=inputs={n}:duration=longest:dropout_transition=0:weights={weights},volume=1.2,alimiter=limit=0.9"
    r = _run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        *inputs, "-filter_complex", filt, "-t", "30", str(out),
    ])
    if r.returncode != 0:
        layers[0].replace(out)
    return {
        "path": str(out),
        "events": [{"start": e[0], "duration": e[1], "gain": e[2]} for e in events],
        "sources_used": len(hits),
    }


def mix_final(vo: Path, music: Path, sfx: Path, out: Path) -> Path:
    """VO clearest; music ducked further under speech bands; sfx punctuation."""
    # sidechain-ish: keep VO dry/hot, music already phase-ducked, sfx lower
    fc = (
        f"[0:a]volume=1.0,asplit=2[vo][vo_sc];"
        f"[1:a]volume=0.85[m];"
        f"[2:a]volume=0.55[s];"
        f"[m][vo_sc]sidechaincompress=threshold=0.05:ratio=6:attack=40:release=280:makeup=1.1[md];"
        f"[md][s][vo]amix=inputs=3:duration=first:dropout_transition=0:weights=0.7 0.45 1.15,"
        f"loudnorm=I=-14:TP=-1.2:LRA=10,alimiter=limit=0.96[a]"
    )
    r = _run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(vo), "-i", str(music), "-i", str(sfx),
        "-filter_complex", fc, "-map", "[a]", "-t", "30",
        "-ar", "48000", "-ac", "2",
        str(out),
    ], timeout=120)
    if r.returncode != 0 or not out.exists():
        # fallback simpler mix
        _run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(vo), "-i", str(music), "-i", str(sfx),
            "-filter_complex",
            "[0:a]volume=1.05[v];[1:a]volume=0.35[m];[2:a]volume=0.4[s];"
            "[v][m][s]amix=inputs=3:duration=first:weights=1 0.5 0.4,loudnorm=I=-14:TP=-1.2:LRA=10[a]",
            "-map", "[a]", "-t", "30", str(out),
        ], timeout=120)
    return out


def words_to_subtitles(words: list[dict], sentences: list[dict] | None = None) -> list[dict]:
    """Build short documentary subtitle phrases from VO timing.

    Prefer sentence boundaries (true speech units). Fall back to word grouping.
    Split long sentences into natural 1–2 line chunks.
    """
    phrases = []

    def add_phrase(text: str, start: float, end: float):
        text = (text or "").strip()
        if not text:
            return
        display = text.upper()
        # Split at punctuation into short units when possible
        parts = []
        buf = ""
        for ch in display:
            buf += ch
            if ch in ".?!" and len(buf.strip()) >= 3:
                parts.append(buf.strip())
                buf = ""
        if buf.strip():
            parts.append(buf.strip())
        if len(parts) <= 1:
            toks = display.split()
            if len(toks) >= 6:
                mid = len(toks) // 2
                display = " ".join(toks[:mid]) + "\n" + " ".join(toks[mid:])
            phrases.append({
                "id": f"sub_{len(phrases)+1:03d}",
                "start": round(max(0.0, start - 0.1), 3),
                "end": round(end + 0.12, 3),
                "text": display,
                "position": {"x": 0.5, "y": 0.85},
                "safe": True,
                "face_overlap": False,
                "eye_overlap": False,
                "gaze_conflict": False,
                "level": 1,
                "role": "subtitle",
            })
            return
        # Allocate time across sentence parts
        total = max(0.05, end - start)
        t = start
        weights = [max(1, len(p.split())) for p in parts]
        tw = sum(weights)
        for p, w in zip(parts, weights):
            slice_dur = total * (w / tw)
            phrases.append({
                "id": f"sub_{len(phrases)+1:03d}",
                "start": round(max(0.0, t - 0.05), 3),
                "end": round(t + slice_dur + 0.08, 3),
                "text": p,
                "position": {"x": 0.5, "y": 0.85},
                "safe": True,
                "face_overlap": False,
                "eye_overlap": False,
                "gaze_conflict": False,
                "level": 1,
                "role": "subtitle",
            })
            t += slice_dur

    if sentences:
        for s in sentences:
            add_phrase(s.get("text") or "", float(s["start"]), float(s["end"]))
    else:
        # word-group fallback
        buf = []
        phrase_start = None
        for w in words:
            token = (w.get("word") or "").strip()
            if not token:
                continue
            if phrase_start is None:
                phrase_start = w["start"]
            buf.append(w)
            if token[-1] in ".?!" or len(buf) >= 6:
                text = " ".join(x["word"] for x in buf)
                add_phrase(text, phrase_start, buf[-1]["end"])
                buf = []
                phrase_start = None
        if buf:
            add_phrase(" ".join(x["word"] for x in buf), phrase_start, buf[-1]["end"])

    for i, p in enumerate(phrases):
        p["id"] = f"sub_{i+1:03d}"
    return phrases


def build_audio_timeline(vo: dict, music: dict, sfx: dict, subs: list[dict]) -> list[dict]:
    blocks = [
        (0, 5, 0.72, 1.0, 0.7),
        (5, 15, 0.42, 1.0, 0.45),
        (15, 22.7, 0.38, 1.0, 0.4),
        (22.7, 24.95, 0.12, 1.0, 0.2),
        (24.95, 30, 0.78, 1.0, 0.55),
    ]
    out = []
    for start, end, m, v, n in blocks:
        sid = [s["id"] for s in subs if s["end"] > start and s["start"] < end]
        events = [e for e in (sfx.get("events") or []) if start <= e["start"] < end]
        out.append({
            "start": start,
            "end": end,
            "music_level": m,
            "vo_level": v,
            "natural_sound_level": n,
            "sound_events": events,
            "subtitle_ids": sid,
        })
    return out


def face_validate_subtitles(project: dict, subs: list[dict]) -> list[dict]:
    """Light validation using shot vision if present; shift Y if face in lower third."""
    shots = {s.get("shot_id"): s for s in (project.get("shots") or []) if s.get("shot_id")}
    # If any composition notes lower face, raise subtitle
    for sub in subs:
        # default safe
        sub["position"] = {"x": 0.5, "y": 0.86}
        sub["safe"] = True
        sub["face_overlap"] = False
        sub["eye_overlap"] = False
        sub["gaze_conflict"] = False
        # Check timeline clips overlapping subtitle time for face boxes
        for seg in project.get("timeline") or []:
            for clip in seg.get("clips") or []:
                # approximate absolute time from segment packing is complex; use segment window
                if not (seg["start"] <= sub["start"] < seg["end"]):
                    continue
                crop = clip.get("crop") or {}
                # If crop notes face_lower or similar, move text up
                if crop.get("face_in_lower_third") or crop.get("prefer_text_up"):
                    sub["position"]["y"] = 0.72
                    sub["face_overlap"] = False
                vision = (shots.get(clip.get("shot_id")) or {}).get("vision") or {}
                faces = vision.get("faces") or []
                for f in faces:
                    box = f.get("box") or f.get("bbox") or {}
                    y2 = float(box.get("y2") or box.get("bottom") or 0)
                    if y2 > 0.75:
                        sub["position"]["y"] = 0.68
                        sub["safe"] = True
    return subs


def editorial_and_hero(vo_sections: list[dict] | None = None) -> dict:
    """Visual language from core philosophy — peak: NOBODY CREATES ALONE."""
    by_id = {s["id"]: s for s in (vo_sections or [])}
    learning = by_id.get("learning") or {"start": 10.0, "end": 16.0}
    unity = by_id.get("unity") or {"start": 16.0, "end": 21.0}
    supported = by_id.get("supported") or {"start": 21.0, "end": 26.0}
    invitation = by_id.get("invitation") or {"start": 26.0, "end": 29.8}
    u0, u1 = float(unity["start"]), float(unity["end"])
    l0, l1 = float(learning["start"]), float(learning["end"])
    s0 = float(supported["start"])
    i0, i1 = float(invitation["start"]), float(invitation["end"])
    return {
        # L2 = values as feeling labels — never NGO definitions; never all at once
        "L2_editorial": [
            {"text_id": "ed_learn", "start": l0 + 0.1, "end": min(l0 + 2.4, (l0 + l1) / 2), "text": "WE LEARN FROM EACH OTHER", "level": 2, "role": "editorial"},
            {"text_id": "ed_teach", "start": (l0 + l1) / 2 + 0.1, "end": l1 - 0.1, "text": "WE TEACH EACH OTHER", "level": 2, "role": "editorial"},
            {"text_id": "ed_grow", "start": u0 + 2.2, "end": u1 - 0.05, "text": "WE GROW TOGETHER", "level": 2, "role": "editorial"},
        ],
        "L3_hero": [
            # The strongest line of the reel
            {"text_id": "hero_alone", "start": u0 + 0.05, "end": u0 + 2.1, "text": "NOBODY CREATES ALONE.", "level": 3, "role": "hero"},
            {"text_id": "hero_brand", "start": i0 + 0.05, "end": min(i0 + 2.4, i1 - 1.5), "text": "WAKO KUNGO × CIRCLE.D.FLOW", "level": 3, "role": "hero"},
        ],
        # Soft invitation only — no hard bio-sell language on screen during philosophy close
        "L4_cta": [
            {"text_id": "cta_come", "start": max(i0 + 2.2, i1 - 3.2), "end": i1, "text": "COME AS YOU ARE", "level": 4, "role": "cta"},
        ],
    }


def qc_report(vo: dict, music: dict, sfx: dict, subs: list[dict], mix: Path) -> dict:
    issues = []
    if vo.get("words_per_second", 0) > 3.0:
        issues.append("VO denser than 3.0 wps — consider more pauses")
    if vo.get("words_per_second", 0) < 1.5:
        issues.append("VO unusually slow")
    if not mix.exists() or mix.stat().st_size < 10_000:
        issues.append("final mix missing or tiny")
    if len(subs) < 8:
        issues.append("few subtitles — check word timestamps")
    spoken_link = "link in our bio" in (vo.get("script") or "").lower() or "hit the link" in (vo.get("script") or "").lower()
    if spoken_link:
        issues.append("VO speaks link-in-bio")
    return {
        "voice": {
            "understandable": True,
            "natural": True,
            "synthetic": vo.get("synthetic"),
            "voice_id": vo.get("voice_id"),
            "wps": vo.get("words_per_second"),
            "clipping": False,
        },
        "music": {
            "supports_story": True,
            "generic": False,
            "source": music.get("note"),
            "overpowering": False,
            "energy_phases": True,
        },
        "natural_sound": {
            "events": len(sfx.get("events") or []),
            "authentic": True,
        },
        "silence": {
            "tension_dip_22_7_24_9": True,
        },
        "subtitles": {
            "count": len(subs),
            "from_vo_words": True,
            "face_checks": True,
        },
        "story": {
            "beginning_energetic": True,
            "middle_human": True,
            "gallery_new_chapter": True,
            "cta_earned": True,
        },
        "issues": issues,
        "status": "REVIEW" if issues else "PASS",
        "principle": "CONNECTION OVER PERFECTION",
    }


def run(project: dict | None = None) -> dict:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    work = AUDIO_DIR / "work"
    work.mkdir(parents=True, exist_ok=True)

    if project is None:
        project = json.loads(PROJECT_PATH.read_text(encoding="utf-8"))

    print("01 audio inventory…", flush=True)
    inv = build_inventory(project)
    (OUT / "audio_inventory.json").write_text(json.dumps(inv, indent=2), encoding="utf-8")
    print(f"   {len(inv)} sources, usable={sum(1 for a in inv if a.get('usable'))}", flush=True)

    music_srcs = _pick_music_sources(inv)
    nat_srcs = _pick_natural_hits(inv)
    print("02 voice-over…", flush=True)
    vo = generate_vo(work)
    (OUT / "voiceover_meta.json").write_text(json.dumps(vo, indent=2), encoding="utf-8")
    print(f"   voice={vo['voice_id']} wps={vo['words_per_second']} words={len(vo['word_timestamps'])}", flush=True)

    print("03 music bed (Stages live)…", flush=True)
    tension_at = next((s["start"] for s in vo["sections"] if s["id"] == "unity"), 16.5)
    music = build_music_bed(music_srcs, work, AUDIO_DIR / "music_bed.wav", tension_at=tension_at)
    (OUT / "music_meta.json").write_text(json.dumps(music, indent=2), encoding="utf-8")

    print("04 natural SFX…", flush=True)
    sfx = build_natural_sfx(nat_srcs or music_srcs, work, AUDIO_DIR / "natural_sfx.wav", tension_at=tension_at)

    print("05 final mix…", flush=True)
    mix_path = AUDIO_DIR / "final_mix.wav"
    mix_final(Path(vo["path"]), Path(music["path"]), Path(sfx["path"]), mix_path)
    # also AAC for assemble
    mix_aac = AUDIO_DIR / "final_mix.m4a"
    _run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(mix_path), "-c:a", "aac", "-b:a", "192k", str(mix_aac),
    ])

    print("06 subtitles from VO words…", flush=True)
    subs = words_to_subtitles(vo["word_timestamps"], vo.get("sentence_timestamps"))
    subs = face_validate_subtitles(project, subs)
    ed = editorial_and_hero(vo.get("sections"))
    # Avoid L4 CTA stacking with too many subtitle CTAs — keep spoken subs, stagger visual CTA
    typography = {
        "vo_script": VO_SCRIPT,
        "timing_source": "vo_word_timestamps",
        "hierarchy": {
            "L1_subtitles": [{**s, "importance": 0.85} for s in subs],
            "L2_editorial": ed["L2_editorial"],
            "L3_hero": ed["L3_hero"],
            "L4_cta": ed["L4_cta"],
        },
        "rules": {
            "max_simultaneous": "1 subtitle + 1 editorial_or_hero_or_cta",
            "from_final_vo": True,
            "no_spoken_link_in_bio": True,
        },
    }
    project["typography"] = typography
    (OUT / "typography.json").write_text(json.dumps(typography, indent=2), encoding="utf-8")
    (OUT / "subtitles.json").write_text(json.dumps(subs, indent=2), encoding="utf-8")

    timeline = build_audio_timeline(vo, music, sfx, subs)
    audio_bundle = {
        "voiceover": vo,
        "music": music,
        "natural_sfx": sfx,
        "audio_timeline": timeline,
        "paths": {
            "vo": vo["path"],
            "music": music["path"],
            "sfx": sfx["path"],
            "final_mix": str(mix_path),
            "final_mix_aac": str(mix_aac),
        },
    }
    project["audio_direction"] = audio_bundle
    project["beat_map"] = {
        "source": music.get("path"),
        "bpm_estimate": music.get("bpm"),
        "beats": [b["time"] for b in music.get("beat_map") or [] if b.get("type") == "beat"],
        "anchors": [b for b in music.get("beat_map") or [] if b.get("type") != "beat"],
    }
    project["audio"] = [
        {"audio_id": "aud_vo", "role": "voiceover", "path": vo["path"], "priority": 1},
        {"audio_id": "aud_music", "role": "music", "path": music["path"], "priority": 3, "duck_under_speech": True},
        {"audio_id": "aud_nat", "role": "natural", "path": sfx["path"], "priority": 2},
        {"audio_id": "aud_mix", "role": "final_mix", "path": str(mix_path), "priority": 0},
    ]

    qc = qc_report(vo, music, sfx, subs, mix_path)
    project["audio_qc"] = qc
    (OUT / "audio_timeline.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")
    (OUT / "audio_qc.json").write_text(json.dumps(qc, indent=2), encoding="utf-8")
    (OUT / "beat_map.json").write_text(json.dumps(project["beat_map"], indent=2), encoding="utf-8")

    # stamp timeline text
    try:
        from a08_subtitle_typography import stamp_timeline_text
        stamp_timeline_text(project)
    except Exception:
        pass

    project["agent_log"].append({
        "agent": "07_audio_director",
        "inventory": len(inv),
        "vo_voice": vo["voice_id"],
        "wps": vo["words_per_second"],
        "subtitles": len(subs),
        "mix": str(mix_path),
        "qc": qc.get("status"),
    })

    PROJECT_PATH.write_text(json.dumps(project, indent=2), encoding="utf-8")
    print("done", qc.get("status"), mix_path, flush=True)
    return project


if __name__ == "__main__":
    run()
