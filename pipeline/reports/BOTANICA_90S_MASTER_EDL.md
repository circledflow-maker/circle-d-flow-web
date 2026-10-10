# Botanica 90s — Master EDL (YouTube 16:9 draft)

**Created:** 2026-10-10T21:35:00Z  
**Status:** AUTHORIZED for one lightweight 1280×720 draft after Windows preflight  
**Root:** `D:\Wakungo_Content_Studio\Botanica`  
**Reuse:** `VIRTUAL_CROPS` / chapter language from `scripts/botanica_90s_recap/run_botanica_recap.py`  
**Runner:** `scripts/botanica_90s_recap/run_botanica_draft_16x9.py`

---

## Intent

**WAKO KUNGO × BOTANICA** — Supported by Circle D Flow.

Feel through footage: Welcome to the Flow · creative space · artist↔audience connection · Each One, Teach One · growing together · No One Creates Alone.

---

## Story chapters (editorial guide)

| Chapter | Time | Story beat |
|---------|------|------------|
| hook | 0–10s | Strong musical hook / opening energy |
| welcome | 10–25s | Welcome to Botanica and the Flow |
| connect | 25–45s | Artists connecting, listening, creating |
| performance | 45–65s | Performances, improvisation, audience |
| peak | 65–82s | Musical peak / collective energy |
| closing | 82–90s | Closing identity + invitation |

Chapter boundaries may shift slightly when the planner maps mid-band samples onto the available pool.

---

## Source pool rules

| Include | Exclude |
|---------|---------|
| `DRIVE_UPLOAD\Wako Kungo\DSC_*.MOV` (prefer) | `Concept9-16.mp4` |
| Full HD landscape with audio | Prior `BOTANICA_90s_RECAP_*` |
| Mid-band in-points (12–88% of clip) | Prior `BOTANICA_12s_*` previews |
| | Duplicate exports / silent masters |

`artist_id`: **null** on every shot — no unverified face assignment.

---

## Audio bed

| Field | Value |
|-------|-------|
| Prefer | `DSC_1598.MOV` (verified ~187.9s in 12s dual-format preflight) |
| Fallback | Longest Wako clip with `duration - ss >= 90` |
| Seek | `-ss` **after** `-i` (~28% in, remainder checked) |
| Length | `-t 90` |
| Process | loudnorm I=-14, fade in 0.8s / out 2.0s |
| Mux | Explicit output `-t 90` — **never** `-shortest` |

---

## Captions (editorial — not speech subs)

| Window | Text |
|--------|------|
| ~11–16.5s | WELCOME TO THE FLOW |
| ~18–23s | COME AS YOU ARE |
| ~28–34s | EACH ONE, TEACH ONE |
| ~48–54s | A SPACE TO CREATE |
| ~66–72s | WE GROW TOGETHER |
| ~82.5–88.5s | NO ONE CREATES ALONE |

Typography: high-contrast cream/gold lower-third, restrained size, consistent bottom placement. Closing card stacks identity lines.

---

## Picture-in-picture (3–4 moments)

Placed in **connect / performance / peak** chapters only.

- Overlay ~420×236, lower-right, dark pad edge
- Second source is a **different moment** from the same one-camera event
- Do **not** imply simultaneous live multi-cam

---

## Draft technical target

| Spec | Draft | Final (later) |
|------|-------|---------------|
| Canvas | 1280×720 | 1920×1080 |
| FPS | 30 | 30 |
| Video | H.264 veryfast CRF23 | CRF 17–19 |
| Audio | AAC 192k | AAC 256–320k |
| Output | `00_work\preview\BOTANICA_90s_YOUTUBE_DRAFT_16x9_<stamp>.mp4` | EXPORT (not this phase) |

Grade: light `eq` only. No AI upscale. No Drive / ARTISTS / EXPORT writes.

---

## Concrete picture strategy

The Windows runner builds the shot list from `ANALYSIS\media_inventory.json` (or a Wako-folder scan) using:

1. Prefer longest Full HD Wako clips (up to ~22)
2. ~34 mid-band samples totaling ≈90s
3. Crop keys from `VIRTUAL_CROPS` by chapter palette (framing intent; 16:9 draft uses full-frame fit + light crop-to-fill)
4. Attach captions / PiP / closing card as above

Verified anchors from the successful 12s dual-format run (still valid members of the pool):

| File | Approx dur | Role hint |
|------|------------|-----------|
| DSC_1552.MOV | ~4.1s | Short atmosphere (use sparingly) |
| DSC_1568.MOV | ~13.7s | Human connection |
| DSC_1580.MOV | ~12.4s | Performance energy |
| DSC_1590.MOV | ~53.0s | Multi-sample backbone |
| DSC_1598.MOV | ~187.9s | Audio bed + peak/close holds |

Exact in/out times are resolved at preflight and written to:

- `ANALYSIS\BOTANICA_90S_DRAFT_EDL_<stamp>.json`
- `ANALYSIS\BOTANICA_90S_MASTER_EDL.md` (machine-filled mirror)

---

## Closing identity

```
WAKO KUNGO × BOTANICA
Supported by Circle D Flow
NO ONE CREATES ALONE.
BE PART OF THE FLOW.
```

No partner brands / membership UI in this phase.

---

## Windows execution

```powershell
cd D:\circle-d-flow-web
git fetch origin cursor/botanica-90s-master-draft-f46a
git checkout -f origin/cursor/botanica-90s-master-draft-f46a -- scripts pipeline
pipeline\BOTANICA_90S_DRAFT_16x9.cmd
```

Or:

```powershell
python scripts\botanica_90s_recap\run_botanica_draft_16x9.py --root "D:\Wakungo_Content_Studio\Botanica" --render
```

---

## STOP

After one draft + QA report: **do not** proceed to final 1080p, 9:16, artist pack, or publish without approval.
