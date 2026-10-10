# Botanica — 12s Cinematic Test Render Plan

**Created:** 2026-10-10T20:20:00Z  
**Status:** PLAN ONLY — do **not** execute until approved  
**Repo:** `D:\circle-d-flow-web`  
**Root:** `D:\Wakungo_Content_Studio\Botanica`  
**Reuse:** crop math + chapter language from `scripts/botanica_90s_recap/run_botanica_recap.py` (`VIRTUAL_CROPS` / `CHAPTER_CROPS`)  
**Do not use for this test:** full `run_botanica_recap.py` encode path (it seeds `ARTISTS\`, copies into `EVENT_SELECTS\`, applies `hqdn3d`, targets 1080×1920 CRF17)

---

## 0. Implementation inspection (reuse map)

| Existing component | Role for this test |
|--------------------|--------------------|
| `run_botanica_recap.py` `VIRTUAL_CROPS` | Crop fractions for WIDE / MEDIUM / CLOSE_UP / ENVIRONMENT |
| `run_botanica_recap.py` `plan_jobs` mid-band sampling | Timecode rule: stay in ~12–88% of clip duration |
| `run_botanica_recap.py` `extract_audio_bed` loudnorm idea | Audio: `-14` LUFS music target, soft fades (lighter bitrates for preview) |
| `ANALYSIS\media_inventory.json` | Source of truth for paths / duration / 1920×1080 / has_audio |
| `artist_seed.json` + `Assets/content/botanica/refs\` | Editorial refs only — **no face-ID / no auto-assign** |
| `organize_artists_face.py` | **Out of scope** for this test (GPU/CV; skips flyer already) |
| Orchestrator stages 6–10 | **Remain gated** — not used |

---

## 1. Artist reference validation

Source: `scripts/botanica_90s_recap/artist_seed.json` (10 profiles) + repo files under `Assets/content/botanica/refs/`.

| ID | Artist | `ref_image` in seed | File on disk | Face-ID usable? |
|----|--------|---------------------|--------------|-----------------|
| ARTIST_001 | Lyssa | `ARTIST_lyssa_bl.png` | **present** | Yes (portrait ref) |
| ARTIST_002 | Noua | `null` | **missing** | No |
| ARTIST_003 | Chris Kristoffer | `ARTIST_chriskristoffer.png` | **present** | Yes |
| ARTIST_004 | Diaza | `ARTIST_diazaofficial.png` | **present** | Yes |
| ARTIST_005 | João Redondo Maia | `ARTIST_joaoredondomaia.png` | **present** | Yes |
| ARTIST_006 | Zeus Atro | `ARTIST_zeus_atro.png` | **present** | Yes |
| ARTIST_007 | Silso | `null` | **missing** | No |
| ARTIST_008 | Mistah Isaac | `null` | **missing** | No |
| ARTIST_009 | Edoardo Statuto | `null` | **missing** | No |
| ARTIST_010 | Wako Kungo | `00_event_flyer_botanical_groove.png` | **present** | **NO — event flyer / collage** |

**Rules for this test**
- Do **not** auto-assign artists from unverified refs.
- Do **not** use the Wako Kungo event flyer as a face-recognition reference (`organize_artists_face.py` already skips flyer/collage paths; keep that policy).
- Flyer may inform **mood/palette only** (green / cream-gold / warm stage), not identity.
- EDL below sets `artist_id: null` on every shot.

---

## 2. Selected source clips (3–5 moments)

### Pool (from inventory-only run)
- Prefer path contains `Wako Kungo` → **46** clips (Nikon `DSC_*.MOV` under `DRIVE_UPLOAD\Wako Kungo\`)
- Exclude from source pool:
  - `Concept9-16.mp4` (editorial reference only)
  - `DRIVE_UPLOAD\EVENT\BOTANICA_90s_RECAP_9x16.mp4` (prior render)
- Prefer Full HD 1920×1080 with audio (inventory report: 47× 1920×1080; all videos have audio)

### Proposed selection (spread across the DSC range — not near-duplicates)

| # | Role | Proposed file | Why |
|---|------|---------------|-----|
| A | Opening hook / venue | `DRIVE_UPLOAD\Wako Kungo\DSC_1552.MOV` | Early-sequence atmosphere without relying on Concept9 |
| B | Human connection | `DRIVE_UPLOAD\Wako Kungo\DSC_1568.MOV` | Mid-range pick; people / interaction energy |
| C | Performance energy | `DRIVE_UPLOAD\Wako Kungo\DSC_1580.MOV` | Later performance band |
| D | Motivated transition | `DRIVE_UPLOAD\Wako Kungo\DSC_1590.MOV` | Cut point / energy shift (crop change, not fake multi-cam) |
| E | Cinematic close | `DRIVE_UPLOAD\Wako Kungo\DSC_1598.MOV` | Near-end of preferred pool; wider hold |

**Preflight (Windows — required before render):** confirm each file exists and record `duration` from `ANALYSIS\media_inventory.json` (or `ffprobe`). If a DSC number is missing on disk, substitute the nearest existing `DSC_####.MOV` in the same folder **with duration ≥ 8s**, keeping spread (do not pick five consecutive filenames).

```powershell
$base = "D:\Wakungo_Content_Studio\Botanica\DRIVE_UPLOAD\Wako Kungo"
@(
  "DSC_1552.MOV","DSC_1568.MOV","DSC_1580.MOV","DSC_1590.MOV","DSC_1598.MOV"
) | ForEach-Object {
  $p = Join-Path $base $_
  if (Test-Path $p) {
    $d = & ffprobe -v quiet -show_entries format=duration -of csv=p=0 $p
    "FOUND $_ duration=$d"
  } else { "MISSING $_" }
}
```

### Timecode rule (mid-band; not hard-coded absolute times)
For each source with duration `D`:
- `usable_start = max(1.0, 0.12*D)`
- `usable_end   = max(usable_start+3, 0.88*D)`
- Place the sample in the mid-band (same philosophy as `plan_jobs`).

| Shot | Timeline | Length | In-point formula | Crop (from `VIRTUAL_CROPS`) |
|------|----------|--------|------------------|----------------------------|
| A | 0.0–2.4s | 2.4s | `t0 = usable_start + 0.20*(usable_end-usable_start)` | **ENVIRONMENT** `w=0.92 h=0.58 x=0.04 y=0.04` → then fit 9:16 |
| B | 2.4–4.8s | 2.4s | mid-band + 0.35 | **MEDIUM** `0.78/0.78 @ 0.11,0.10` |
| C | 4.8–7.4s | 2.6s | mid-band + 0.50 | **CLOSE_UP** `0.58/0.58 @ 0.21,0.14` |
| D | 7.4–9.6s | 2.2s | mid-band + 0.55 | **MEDIUM** with `x += 0.05` bias (motivated reframing) |
| E | 9.6–12.0s | 2.4s | mid-band + 0.70 | **WIDE** `1.0/1.0` (safe vertical fit) |

`artist_id`: **null** for all shots.  
Camera count: **1** — crops are virtual, not simultaneous coverage.

---

## 3. Proposed 12-second timeline (EDL)

| Seq | TL in–out | Source | Crop | Intent |
|-----|-----------|--------|------|--------|
| 1 | 0.00–2.40 | DSC_1552 | ENVIRONMENT→9:16 | Hook: venue / botanical atmosphere |
| 2 | 2.40–4.80 | DSC_1568 | MEDIUM | Human connection |
| 3 | 4.80–7.40 | DSC_1580 | CLOSE_UP | Performance energy |
| 4 | 7.40–9.60 | DSC_1590 | MEDIUM (+x) | Motivated visual transition (reframe + cut) |
| 5 | 9.60–12.00 | DSC_1598 | WIDE | Cinematic close / settle |

No lower-thirds / artist name plates in this preview (avoids false ID). Optional later: single word card `LIVE` only if font path known (`arialbd.ttf` already verified in inventory-only run).

---

## 4. Crop and layout choices

- Output canvas: **720×1280** (9:16 preview), **30 fps**
- Filter pattern (reuse vertical-crop idea, **no** `hqdn3d`, **no** upscale beyond source):
  1. `crop=w=iw*W:h=ih*H:x=iw*X:y=ih*Y`
  2. `scale=720:1280:force_original_aspect_ratio=increase`
  3. `crop=720:1280`
  4. Light grade only: `eq=contrast=1.06:brightness=0.02:saturation=0.95` (optional; skip if preview must be fastest)
- One camera → crop changes simulate Stages energy; never imply multi-cam.

---

## 5. Audio approach

- Bed from **one** long Wako clip with `has_audio=true` (prefer longest among selected A–E, else longest in preferred pool).
- Take mid-band window of **12.0s** (same idea as `extract_audio_bed`).
- Filters: `loudnorm=I=-14:TP=-1.5:LRA=11`, `afade=t=in:st=0:d=0.4`, `afade=t=out:st=10.5:d=1.5`
- Codec: **AAC 160k** (preview; full pipeline uses 256k)
- Mux with `-shortest` against the 12s picture.

---

## 6. Expected resource usage

| Item | Estimate |
|------|----------|
| Decode | 5× ~2.2–2.6s Full HD segments (small) |
| Encode | H.264 `veryfast` / CRF ~23 @ 720×1280 |
| Threads | `-threads 2` (keep Windows UI responsive) |
| GPU / AI | **none** |
| Denoise / upscale | **none** |
| Disk | ~8–25 MB preview + tiny concat list |
| Wall time | typically under a few minutes on a laptop CPU |
| Side effects | Writes **only** under `00_work\test_render\` — no `EXPORT\`, no `ARTISTS\`, no Drive |

---

## 7. Exact proposed test-render command

**Do not run until approved.** After preflight durations are known, set `$tA`…`$tE` to the computed `t0` values (seconds).

Output (timestamped — avoids overwrite):

`D:\Wakungo_Content_Studio\Botanica\00_work\test_render\BOTANICA_12s_PREVIEW_720x1280_<yyyyMMdd_HHmmss>.mp4`

Example PowerShell (placeholders `T0_A`… must be filled from ffprobe/inventory):

```powershell
cd D:\circle-d-flow-web
$Root = "D:\Wakungo_Content_Studio\Botanica"
$Src  = "$Root\DRIVE_UPLOAD\Wako Kungo"
$OutDir = "$Root\00_work\test_render"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Out = "$OutDir\BOTANICA_12s_PREVIEW_720x1280_$stamp.mp4"
$Work = "$OutDir\parts_$stamp"
New-Item -ItemType Directory -Force -Path $Work | Out-Null

# FILL these after preflight (mid-band in-points, seconds):
$T0_A = 8.0; $T0_B = 10.0; $T0_C = 12.0; $T0_D = 9.0; $T0_E = 11.0

# Crop helpers (from VIRTUAL_CROPS; ENVIRONMENT/MEDIUM/CLOSE/WIDE)
function Render-Part($inFile, $ss, $t, $cw, $ch, $cx, $cy, $outFile) {
  $vf = "crop=w=iw*${cw}:h=ih*${ch}:x=iw*${cx}:y=ih*${cy},scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,eq=contrast=1.06:brightness=0.02:saturation=0.95,fps=30"
  ffmpeg -y -threads 2 -ss $ss -t $t -i $inFile -vf $vf -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p $outFile
}

Render-Part "$Src\DSC_1552.MOV" $T0_A 2.4 0.92 0.58 0.04 0.04 "$Work\01.mp4"
Render-Part "$Src\DSC_1568.MOV" $T0_B 2.4 0.78 0.78 0.11 0.10 "$Work\02.mp4"
Render-Part "$Src\DSC_1580.MOV" $T0_C 2.6 0.58 0.58 0.21 0.14 "$Work\03.mp4"
Render-Part "$Src\DSC_1590.MOV" $T0_D 2.2 0.78 0.78 0.16 0.10 "$Work\04.mp4"   # x bias
Render-Part "$Src\DSC_1598.MOV" $T0_E 2.4 1.00 1.00 0.00 0.00 "$Work\05.mp4"

@"
file '01.mp4'
file '02.mp4'
file '03.mp4'
file '04.mp4'
file '05.mp4'
"@ | Set-Content -Encoding ASCII "$Work\list.txt"

# Audio bed from performance clip (adjust if needed)
$AudioSrc = "$Src\DSC_1580.MOV"
$Audio = "$Work\bed.m4a"
ffmpeg -y -threads 2 -ss $T0_C -t 12 -i $AudioSrc -vn -af "loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.4,afade=t=out:st=10.5:d=1.5" -c:a aac -b:a 160k $Audio

ffmpeg -y -threads 2 -f concat -safe 0 -i "$Work\list.txt" -i $Audio -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart $Out
echo "OUT=$Out"
```

**Why not** `python run_botanica_recap.py --seconds 12` for this preview:
- Touches `ARTISTS\` via `seed_artist_folders`
- May copy selects into `EVENT_SELECTS\`
- Enables `hqdn3d` + 1080×1920 CRF17 (heavier than requested)
- Risks writing under `EXPORT\`

---

## 8. Output destination

| Path | Purpose |
|------|---------|
| `D:\Wakungo_Content_Studio\Botanica\00_work\test_render\BOTANICA_12s_PREVIEW_720x1280_<stamp>.mp4` | Temporary preview master |
| `D:\Wakungo_Content_Studio\Botanica\00_work\test_render\parts_<stamp>\` | Disposable intermediates (delete after QC) |

Must **not** write to:
- `EXPORT\BOTANICA_90s_RECAP_9x16.mp4`
- `DRIVE_UPLOAD\EVENT\…`
- any `ARTISTS\<name>\` media folder

---

## 9. Safety checks (pre-render gate)

| Check | Plan |
|-------|------|
| Every selected source exists | Preflight `Test-Path` + inventory JSON |
| Timecodes within duration | `t0+length < duration - 0.15` after ffprobe |
| Output will not overwrite | Timestamped filename |
| No Drive operations | Local ffmpeg only |
| No full-project / stages 6–10 | No orchestrator `--allow-render` |
| No artist folder media modified | Avoid full recap script; preview under `00_work\test_render` only |
| No new agent required | Reuses crop constants + ffmpeg; no new pipeline agent |
| Concept9 / prior recap excluded from picture pool | Explicit exclude list |
| Flyer not used for face ID | Confirmed |

---

## 10. Known limitations

1. Exact DSC filenames/durations were **not** re-read from `ANALYSIS\media_inventory.json` in this cloud checkout — Windows preflight must confirm or substitute nearest clips.
2. No visual screening of frames was possible here; “visually strong” is structural (spread + chapter crops). Human eyeball of the five stills before encode is recommended (`ffmpeg -ss … -frames:v 1`).
3. 720×1280 preview will look softer than the full 1080×1920 CRF17 master — intentional.
4. Audio bed may not sync to picture cuts (bed from one clip); acceptable for a mood/energy test.
5. `DRIVE_UPLOAD\Wako Kungo` may be a staged copy of originals; if a higher-quality twin exists outside `DRIVE_UPLOAD`, prefer that path from inventory `quality_rank=best`.
6. Artist identity remains unverified — do not publish as named artist reels from this test.

---

## 11. STOP

Plan prepared in `pipeline/reports/BOTANICA_TEST_RENDER_PLAN.md`.  
**No render executed. Awaiting explicit approval** before running the PowerShell/ffmpeg block above.
