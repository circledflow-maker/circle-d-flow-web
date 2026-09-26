# Botanica — 90s Cinematic Event Recap Pipeline

One-camera source → **virtual crops** (wide / medium / close / portrait / detail / crowd) → **9:16 / 1080×1920** master.

## Blocker on Cloud Agents

`D:\Wakungo_Content_Studio\Botanica` is **not mounted** in Cursor Cloud.  
Run this pipeline on the Windows machine that has **D:**, or start a **Cursor self-hosted worker** there and re-ask the agent.

## Quick start (Windows + D:)

```powershell
# 1) ffmpeg must be on PATH
ffmpeg -version

# 2) Put raw event video + Concept9-16.mp4 under:
#    D:\Wakungo_Content_Studio\Botanica\

# 3) From the repo:
cd path\to\circle-d-flow-web
powershell -ExecutionPolicy Bypass -File .\scripts\botanica_90s_recap\run_botanica_recap.ps1
```

Or:

```bash
python scripts/botanica_90s_recap/run_botanica_recap.py --root "D:/Wakungo_Content_Studio/Botanica"
```

## Outputs (never overwrites originals)

```
D:\Wakungo_Content_Studio\Botanica\
  ANALYSIS\          media_inventory, artist_database, virtual_crop_database, …
  ARTISTS\ARTIST_00x\  PORTRAIT / PERFORMANCE / DETAIL / …
  EVENT_SELECTS\     BAND / CROWD_* / PERFORMANCE / VENUE / …
  STILLS\
  EDIT\EDIT_DECISIONS.json
  EXPORT\BOTANICA_90s_RECAP_9x16.mp4   ← final reel
  00_work\recap_tmp\                  ← temps (safe to delete later)
```

## Creative rules (Master Prompt)

- `CAMERA_COUNT = 1` — no fake multi-cam continuity
- Variety via **intelligent crops** + PiP/split using **different moments**
- Denoise: light `hqdn3d` — keep live atmosphere
- Grade: warm, cinematic, natural skin, controlled stage colors
- Story: Arrival → Venue → People → Artists → Performance → Audience → Peak → Closing (~90s)
- Format: **Circle D Stages** energy (rhythm cuts, Totale↔Medium↔Close)

## Artist seed (from flyer + IG refs)

See `artist_seed.json` — Lyssa, Chris Kristoffer, Diaza, João Redondo Maia, Zeus Atro, Noua, Mistah Isaac, Silso, Edoardo Statuto, Wako Kungo.

Reference stills live in repo: `Assets/content/botanica/refs/`.

## Inventory only

```powershell
python scripts/botanica_90s_recap/run_botanica_recap.py --root "D:/Wakungo_Content_Studio/Botanica" --inventory-only
```
