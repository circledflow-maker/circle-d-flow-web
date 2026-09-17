# Wako Kungo × Move Art Gallery — 30s reel agents

Output: `D:\Wakungo_Content_Studio\_wakungo_reel\`

```powershell
python D:\circle-d-flow-web\scripts\wakungo_reel\run.py
python D:\circle-d-flow-web\scripts\wakungo_reel\a07_audio_director.py
python D:\circle-d-flow-web\scripts\wakungo_reel\assemble_preview.py
```

## Pipeline

| # | Agent | Role |
|---|--------|------|
| 01–06 | ingest → edit | picture narrative |
| 07 | audio plan | roles / script |
| 07b | beat map | music anchors |
| 07★ | **audio director** | inventory, TTS VO, Stages music phases, natural SFX, ducking, final mix, sentence/word timestamps |
| 08 | subtitle & typography | L1–L4 (replaced by VO-timed cues from 07★) |
| 09–12 | timeline → revision | assemble / QC |

## Audio outputs

`_wakungo_reel/audio/` — `voiceover.wav`, `music_bed.wav`, `natural_sfx.wav`, `final_mix.wav` / `.m4a`

JSON: `audio_inventory.json`, `voiceover_meta.json`, `subtitles.json`, `beat_map.json`, `audio_qc.json`, `audio_timeline.json`

**Principle:** authenticity first — live Stages audio for music; synthetic VO only when no human VO exists; CTA “LINK IN BIO” on screen, not spoken.
