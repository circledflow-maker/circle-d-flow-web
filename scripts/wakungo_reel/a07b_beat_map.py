#!/usr/bin/env python3
"""AGENT 07b — Beat Map (music anchors for edit / subtitle / VO sync).

Detects onset-ish peaks from the selected music bed so cuts and text
can share one temporal grid. Falls back to a 30s documentary grid if
audio analysis is unavailable.
"""
from __future__ import annotations

import json
import struct
import subprocess
import wave
from pathlib import Path

from contract import OUT


def _fallback_beats(duration: float = 30.0) -> dict:
    """Documentary grid when analysis fails — still usable for snap."""
    # ~120 BPM-ish quarter notes + named energy points from brief
    beats = []
    t = 0.0
    while t < duration - 0.05:
        beats.append(round(t, 3))
        t += 0.833  # ~72 BPM feel / phrase pulse
    return {
        "source": "fallback_grid",
        "bpm_estimate": 72.0,
        "beats": beats,
        "anchors": [
            {"t": 0.00, "label": "intro"},
            {"t": 5.00, "label": "present_in"},
            {"t": 15.00, "label": "energy_drop"},
            {"t": 25.00, "label": "energy_return"},
            {"t": 29.80, "label": "final_hit"},
        ],
    }


def _decode_mono_pcm(src: Path, work: Path, seconds: float = 30.0) -> Path | None:
    wav = work / "beat_probe.wav"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
        "-i", str(src),
        "-t", f"{seconds:.2f}",
        "-ac", "1", "-ar", "22050",
        "-c:a", "pcm_s16le",
        str(wav),
    ]
    r = subprocess.run(cmd)
    return wav if r.returncode == 0 and wav.exists() else None


def _onset_beats(wav_path: Path, hop: int = 1024) -> list[float]:
    with wave.open(str(wav_path), "rb") as w:
        nch, width, rate, nframes, *_ = w.getparams()
        raw = w.readframes(nframes)
    if width != 2:
        return []
    samples = struct.unpack("<" + "h" * (len(raw) // 2), raw)
    # energy envelope
    energies = []
    for i in range(0, len(samples) - hop, hop):
        chunk = samples[i : i + hop]
        e = sum(abs(x) for x in chunk) / hop
        energies.append(e)
    if not energies:
        return []
    # adaptive threshold peaks
    avg = sum(energies) / len(energies)
    thr = avg * 1.35
    beats = []
    min_gap = int(0.35 * rate / hop)  # ~350ms
    last = -min_gap
    for i, e in enumerate(energies):
        if e >= thr and (i - last) >= min_gap:
            # local max
            if i > 0 and i < len(energies) - 1:
                if e < energies[i - 1] or e < energies[i + 1]:
                    continue
            t = i * hop / rate
            if t < 30.0:
                beats.append(round(t, 3))
                last = i
    return beats


def _pick_music(project: dict) -> Path | None:
    for a in project.get("audio") or []:
        if a.get("role") in {"music", "bed", "underscore"}:
            p = Path(a.get("path") or "")
            if p.exists():
                return p
            aid = a.get("source_asset_id")
            for asset in project.get("assets") or []:
                if asset.get("asset_id") == aid:
                    p = Path(asset.get("path") or "")
                    if p.exists():
                        return p
    for asset in project.get("assets") or []:
        if asset.get("type") == "audio":
            p = Path(asset.get("path") or "")
            if p.exists() and p.stat().st_size > 50_000:
                return p
    return None


def nearest_beat(beats: list[float], t: float, max_delta: float = 0.25) -> float:
    if not beats:
        return t
    best = min(beats, key=lambda b: abs(b - t))
    return best if abs(best - t) <= max_delta else t


def run(project: dict) -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    work = OUT / "preview_work"
    work.mkdir(parents=True, exist_ok=True)

    src = _pick_music(project)
    beatmap = _fallback_beats()
    if src:
        wav = _decode_mono_pcm(src, work)
        if wav:
            detected = _onset_beats(wav)
            if len(detected) >= 8:
                beatmap = {
                    "source": str(src),
                    "bpm_estimate": round(60.0 / max(0.01, (detected[-1] - detected[0]) / max(1, len(detected) - 1)), 1)
                    if len(detected) > 1 else 0,
                    "beats": detected,
                    "anchors": [
                        {"t": 0.00, "label": "intro"},
                        {"t": nearest_beat(detected, 5.0), "label": "present_in"},
                        {"t": nearest_beat(detected, 15.0), "label": "energy_drop"},
                        {"t": nearest_beat(detected, 25.0), "label": "energy_return"},
                        {"t": nearest_beat(detected, 29.8, 0.4), "label": "final_hit"},
                    ],
                }

    project["beat_map"] = beatmap
    (OUT / "beat_map.json").write_text(json.dumps(beatmap, indent=2), encoding="utf-8")
    project["agent_log"].append({
        "agent": "07b_beat_map",
        "beats": len(beatmap.get("beats") or []),
        "source": beatmap.get("source"),
        "anchors": [a["label"] for a in beatmap.get("anchors") or []],
    })
    return project
