# Botanica — Dual-Format 12s Test Plan (16:9 + 9:16)

**Created:** 2026-10-10T20:42:00Z  
**Status:** DIAGNOSIS + PROPOSED COMMANDS ONLY — **awaiting approval**  
**Do not execute** either render until explicitly approved.

---

## 1. Diagnosis — why the previous preview was 6.207s (not 12s)

### What ran
`pipeline\BOTANICA_TEST_RENDER_12S.ps1` →  
`...\00_work\test_render\BOTANICA_12s_PREVIEW_720x1280_20261010_213305.mp4`

| Probe field | Value |
|-------------|--------|
| Duration | **6.207 s** |
| Resolution | 720×1280 |
| Video / audio | h264 / aac |
| Wall time | 8.2 s |

### Planned picture lengths (sum = 12.0s)

| Part | File | Source dur | In (T0) | Requested len | Remaining after T0 |
|------|------|------------|---------|---------------|--------------------|
| 01 | DSC_1552.MOV | 4.08 | 1.530 | 2.4 | 2.55 |
| 02 | DSC_1568.MOV | 13.68 | 5.280 | 2.4 | 8.40 |
| 03 | DSC_1580.MOV | 12.36 | 6.180 | 2.6 | **6.18** |
| 04 | DSC_1590.MOV | 53.04 | 28.536 | 2.2 | 24.50 |
| 05 | DSC_1598.MOV | 187.92 | 122.524 | 2.4 | 65.40 |
| | | | | **Σ 12.0** | |

### Root cause (primary) — **audio bed shorter than picture + `-shortest`**

Audio was taken from **shot 03 / DSC_1580.MOV** (same mid-band in-point as the performance picture):

```text
audio: -ss 6.18 -t 12 -i DSC_1580.MOV
source duration: 12.36s
usable after seek: 12.36 - 6.18 = 6.18s
```

FFmpeg can only extract **~6.18s** of audio, not 12s.

Final mux used **`-shortest`** (first run), so the multiplexed output duration became:

```text
min(video_concat ≈ 12s, audio_bed ≈ 6.18s) ≈ 6.2s
```

That matches the measured **6.207s** within rounding / fade / container timing.

### Contributing factors (secondary)

1. **`-ss` before `-i`** on Nikon MOV edit-lists produced keyframe warnings (`Missing key frame while searching for timestamp`). Can shorten/skew individual parts; not the main 6.2s cut once `-shortest` is explained by audio.
2. **swscaler “deprecated pixel format”** — cosmetic; not a duration bug.
3. **DSC_1552** is only 4.08s — picture trim OK, but it is a weak opener; keep or swap on dual re-run.

### Corrected audio rule (for next renders)

- Choose audio from a clip where `duration - audio_in >= 12.0`  
  → Prefer **DSC_1598.MOV** (187.92s) or **DSC_1590.MOV** (53.04s).
- Put **`-ss` after `-i`** for accurate cuts.
- Mux with **`-t 12`** on the output (do **not** rely on `-shortest` alone).
- Keep picture EDL sum = 12.0s; audio bed = 12.0s from a long source; A/V start aligned at timeline 0.

### Corrected prior warning
Earlier note blaming only keyframe seek is **incomplete**. Primary cause = **audio remainder 6.18s + `-shortest`**.

---

## 2. Shared 12-second EDL (both formats)

Same five 1920×1080 sources, same in/out lengths.  
`artist_id = null`. No Drive / ARTISTS / full recap.

| Seq | TL | File | In* | Len | Intent |
|-----|-----|------|-----|-----|--------|
| 1 | 0.0–2.4 | DSC_1552.MOV | 1.530 | 2.4 | Hook / venue |
| 2 | 2.4–4.8 | DSC_1568.MOV | 5.280 | 2.4 | Human connection |
| 3 | 4.8–7.4 | DSC_1580.MOV | 6.180 | 2.6 | Performance energy |
| 4 | 7.4–9.6 | DSC_1590.MOV | 28.536 | 2.2 | Motivated transition |
| 5 | 9.6–12.0 | DSC_1598.MOV | 122.524 | 2.4 | Cinematic close |

\*In-points from successful Windows preflight (mid-band). Re-verify with ffprobe before encode.

**Audio bed (shared):**  
Source `DSC_1598.MOV`, `-ss 40.0` (or mid-band with `dur-ss>=12`), `-t 12`, loudnorm `-14` LUFS, fades in 0.4s / out 1.5s from t=10.5.  
Picture and audio are timeline-aligned from 0; not lip-synced to cuts (mood bed) — acceptable for this test.

**Exclude from picture pool:** `Concept9-16.mp4`, `BOTANICA_90s_RECAP_*.mp4`, prior preview file.

---

## 3. Format-specific crops (no stretch)

Source: 1920×1080. Use `force_original_aspect_ratio=increase` + center crop — **never** `scale` that distorts.

### A) YouTube 16:9 → **1280×720**
Keep most of the frame (letterbox-safe center). Light side crop only if needed for exact 16:9 after scale.

| Shot | Layout | Notes |
|------|--------|-------|
| 1 | mild top bias | venue / environment |
| 2–4 | center | performance / people |
| 5 | center wide | close |

Filter pattern per part:
```text
scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,eq=contrast=1.06:brightness=0.02:saturation=0.95,fps=30
```
(Optional small vertical pan via `crop=1280:720:x=(iw-1280)/2:y=…` only if scale already filled width.)

### B) Social 9:16 → **720×1280**
Reuse `VIRTUAL_CROPS` fractions from `run_botanica_recap.py` (same as first plan):

| Shot | Crop key | w,h,x,y |
|------|----------|---------|
| 1 | ENVIRONMENT | 0.92, 0.58, 0.04, 0.04 |
| 2 | MEDIUM | 0.78, 0.78, 0.11, 0.10 |
| 3 | CLOSE_UP | 0.58, 0.58, 0.21, 0.14 |
| 4 | MEDIUM +x | 0.78, 0.78, 0.16, 0.10 |
| 5 | WIDE | 1.00, 1.00, 0.00, 0.00 |

Then: `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,...`

---

## 4. Outputs (do not overwrite previous preview)

Base: `D:\Wakungo_Content_Studio\Botanica\00_work\test_render\`

| Format | Filename pattern |
|--------|------------------|
| 16:9 | `BOTANICA_12s_YT16x9_1280x720_<yyyyMMdd_HHmmss>.mp4` |
| 9:16 | `BOTANICA_12s_SOCIAL9x16_720x1280_<yyyyMMdd_HHmmss>.mp4` |

**Leave untouched:**  
`BOTANICA_12s_PREVIEW_720x1280_20261010_213305.mp4`

Work dirs: `parts_16x9_<stamp>\`, `parts_9x16_<stamp>\` (disposable).

---

## 5. Exact proposed commands (Windows)

Shared vars:

```powershell
cd D:\circle-d-flow-web
$Root = "D:\Wakungo_Content_Studio\Botanica"
$Src  = "$Root\DRIVE_UPLOAD\Wako Kungo"
$OutDir = "$Root\00_work\test_render"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
# Audio from longest clip — MUST leave >=12s after -ss
$AudioIn = 40.0
$AudioSrc = "$Src\DSC_1598.MOV"
```

### Preflight (both formats)

```powershell
@(
  @{f="DSC_1552.MOV"; ss=1.53;  t=2.4},
  @{f="DSC_1568.MOV"; ss=5.28;  t=2.4},
  @{f="DSC_1580.MOV"; ss=6.18;  t=2.6},
  @{f="DSC_1590.MOV"; ss=28.536;t=2.2},
  @{f="DSC_1598.MOV"; ss=122.524;t=2.4}
) | ForEach-Object {
  $p = Join-Path $Src $_.f
  if (-not (Test-Path $p)) { throw "MISSING $($_.f)" }
  $d = [double](& ffprobe -v quiet -show_entries format=duration -of csv=p=0 -- $p)
  if (($_.ss + $_.t) -gt ($d - 0.05)) { throw "TIMECODE OOB $($_.f)" }
  "OK $($_.f) dur=$d"
}
$ad = [double](& ffprobe -v quiet -show_entries format=duration -of csv=p=0 -- $AudioSrc)
if (($AudioIn + 12) -gt ($ad - 0.05)) { throw "AUDIO OOB" }
"OK audio remainder=$([math]::Round($ad-$AudioIn,2))s"
```

### Audio bed (once, shared)

```powershell
$Bed = "$OutDir\bed_12s_$stamp.m4a"
ffmpeg -hide_banner -y -threads 2 -i $AudioSrc -ss $AudioIn -t 12 -vn `
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.4,afade=t=out:st=10.5:d=1.5" `
  -c:a aac -b:a 160k $Bed
```

### 16:9 YouTube 1280×720

```powershell
$W16 = "$OutDir\parts_16x9_$stamp"; New-Item -ItemType Directory -Force -Path $W16 | Out-Null
$Out16 = "$OutDir\BOTANICA_12s_YT16x9_1280x720_$stamp.mp4"
$vf16 = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,eq=contrast=1.06:brightness=0.02:saturation=0.95,fps=30"
# -ss AFTER -i for each part:
ffmpeg -y -threads 2 -i "$Src\DSC_1552.MOV" -ss 1.53  -t 2.4 -vf $vf16 -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W16\01.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1568.MOV" -ss 5.28  -t 2.4 -vf $vf16 -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W16\02.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1580.MOV" -ss 6.18  -t 2.6 -vf $vf16 -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W16\03.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1590.MOV" -ss 28.536 -t 2.2 -vf $vf16 -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W16\04.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1598.MOV" -ss 122.524 -t 2.4 -vf $vf16 -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W16\05.mp4"
@("file '01.mp4'","file '02.mp4'","file '03.mp4'","file '04.mp4'","file '05.mp4'") | Set-Content "$W16\list.txt" -Encoding ASCII
Push-Location $W16
ffmpeg -y -threads 2 -f concat -safe 0 -i list.txt -i $Bed -c:v copy -c:a aac -b:a 160k -t 12 -movflags +faststart $Out16
Pop-Location
ffprobe -v quiet -print_format json -show_format -show_streams $Out16
```

### 9:16 Social 720×1280

```powershell
$W9 = "$OutDir\parts_9x16_$stamp"; New-Item -ItemType Directory -Force -Path $W9 | Out-Null
$Out9 = "$OutDir\BOTANICA_12s_SOCIAL9x16_720x1280_$stamp.mp4"
function Vf9($cw,$ch,$cx,$cy) {
  "crop=w=iw*${cw}:h=ih*${ch}:x=iw*${cx}:y=ih*${cy},scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,eq=contrast=1.06:brightness=0.02:saturation=0.95,fps=30"
}
ffmpeg -y -threads 2 -i "$Src\DSC_1552.MOV" -ss 1.53  -t 2.4 -vf (Vf9 0.92 0.58 0.04 0.04) -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W9\01.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1568.MOV" -ss 5.28  -t 2.4 -vf (Vf9 0.78 0.78 0.11 0.10) -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W9\02.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1580.MOV" -ss 6.18  -t 2.6 -vf (Vf9 0.58 0.58 0.21 0.14) -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W9\03.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1590.MOV" -ss 28.536 -t 2.2 -vf (Vf9 0.78 0.78 0.16 0.10) -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W9\04.mp4"
ffmpeg -y -threads 2 -i "$Src\DSC_1598.MOV" -ss 122.524 -t 2.4 -vf (Vf9 1.00 1.00 0.00 0.00) -an -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$W9\05.mp4"
@("file '01.mp4'","file '02.mp4'","file '03.mp4'","file '04.mp4'","file '05.mp4'") | Set-Content "$W9\list.txt" -Encoding ASCII
Push-Location $W9
ffmpeg -y -threads 2 -f concat -safe 0 -i list.txt -i $Bed -c:v copy -c:a aac -b:a 160k -t 12 -movflags +faststart $Out9
Pop-Location
ffprobe -v quiet -print_format json -show_format -show_streams $Out9
```

### Success criteria
- Each output duration **11.5–12.2 s**
- 16:9 = **1280×720**; 9:16 = **720×1280**
- h264 + aac; prior `...213305.mp4` still present unchanged
- No Drive / ARTISTS / EXPORT writes

---

## 6. Safety

| Rule | Plan |
|------|------|
| No overwrite of `...213305.mp4` | New timestamped names |
| No Drive / source / artist folder edits | `00_work\test_render` only |
| No full recap / stages 6–10 | ffmpeg only |
| No auto artist assign | `artist_id` null |
| Primary visual = original 1920×1080 DSC | Same Wako paths |
| Audio sync | Shared bed from long clip; mux `-t 12` |

---

## 7. STOP — approval required

**Diagnosis complete. Dual-format commands drafted.**

Please approve one of:
1. **Both** 16:9 + 9:16  
2. **16:9 only**  
3. **9:16 only**  

No render will start until you approve.
