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

# 3) From a clean checkout of this branch:
cd D:\circle-d-flow-web-botanica
# or: D:\circle-d-flow-web  (after fetching this branch / scripts folder)
git pull origin cursor/botanica-90s-recap-pipeline-f46a

# 4) Full quality rebuild (fixes empty text plates from v1):
python .\scripts\botanica_90s_recap\run_botanica_recap.py --root "D:\Wakungo_Content_Studio\Botanica" --force
```

### v2 fixes (quality + empty content)

- **Empty text cards:** v1 fell back to a blank dark plate when Windows had no default `drawtext` font. v2 uses `C:\Windows\Fonts\arial*.ttf` / Segoe UI and **never inserts blank cards**.
- **Empty / black clips:** mid-frame blackframe check; unusable shots dropped from the master.
- **Reel pacing:** chapter-aware crops, mid-band sampling (skip black heads/tails), snappier Stages timing.
- **Encode:** CRF 17, warmer low-light grade, audio loudnorm + fade, 256k AAC.
- **`--force`:** clears `00_work/recap_tmp` clips/cards and re-renders everything.

Optional font override:

```powershell
$env:BOTANICA_FONT = "C:\Windows\Fonts\arialbd.ttf"
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

## Artist Drive pack (stabilize + photos)

Builds Google-Drive-ready folders for the full IG line-up (Lyssa, Noua, Chris Kristoffer, Diaza, João Redondo Maia, Zeus Atro, Silso, **Mistah Isaac**, **Edo / Edoardo Statuto**, Wako Kungo):

```powershell
cd D:\circle-d-flow-web
git fetch origin cursor/botanica-90s-recap-pipeline-f46a
git checkout origin/cursor/botanica-90s-recap-pipeline-f46a -- scripts/botanica_90s_recap Assets/content/botanica/refs

python .\scripts\botanica_90s_recap\prepare_artist_drive_pack.py --root "D:\Wakungo_Content_Studio\Botanica" --force
```

Output:

```
D:\Wakungo_Content_Studio\Botanica\DRIVE_UPLOAD\
  README_UPLOAD.txt
  MANIFEST.json
  EVENT\BOTANICA_90s_RECAP_9x16.mp4   (if recap already rendered)
  ARTISTS\
    01_lyssa.bl_Lyssa\
    02_noua_Noua\
    …
    08_mistah_isaac_Mistah_Isaac\
    09_edoardostatuto_Edo_Edoardo_Statuto\
    10_wako.kungo_Wako_Kungo\
      00_REF\
      01_VIDEOS_STABILIZED\     ← less shake
      02_PHOTOS_EDITED\         ← graded stills
      03_FRAMES_FROM_VIDEO\     ← graded frames
  _UNASSIGNED_REVIEW\           ← sort manually if filename had no artist hint
```

Upload the whole `DRIVE_UPLOAD` folder to Google Drive.

## Full pipeline (analyze Wako Kungo + 90s reel)

One command on the Windows PC with D: — face-sorts `Wako Kungo` into artist folders **and** builds the 90s reel:

```powershell
cd D:\circle-d-flow-web
git fetch origin cursor/botanica-90s-recap-pipeline-f46a
git checkout origin/cursor/botanica-90s-recap-pipeline-f46a -- scripts/botanica_90s_recap Assets/content/botanica/refs

powershell -ExecutionPolicy Bypass -File .\scripts\botanica_90s_recap\run_wako_full_pipeline.ps1
```

Outputs:
- `Botanica\DRIVE_UPLOAD\ARTISTS\…` — sorted performances / portraits / frames
- `Botanica\EXPORT\BOTANICA_90s_RECAP_9x16.mp4` — full 90s reel
- also copied to `Botanica\DRIVE_UPLOAD\EVENT\`

## Face-organize artists (Wako Kungo → folders)

Analyzes `Botanica\Wako Kungo` (and other Botanica media), matches faces to IG refs, writes stabilized performance clips + graded portraits/frames, then cleans empty/legacy folders:

```powershell
cd D:\circle-d-flow-web
git fetch origin cursor/botanica-90s-recap-pipeline-f46a
git checkout origin/cursor/botanica-90s-recap-pipeline-f46a -- scripts/botanica_90s_recap Assets/content/botanica/refs

powershell -ExecutionPolicy Bypass -File .\scripts\botanica_90s_recap\organize_artists_face.ps1 -ForceRebuild
```

Then open `D:\Wakungo_Content_Studio\Botanica\DRIVE_UPLOAD\ARTISTS`.
