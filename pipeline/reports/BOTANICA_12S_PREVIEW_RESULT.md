# Botanica 12s preview — RESULT (Windows run)

**Recorded:** 2026-10-10T20:34:00Z  
**Source:** user screenshot of `BOTANICA_TEST_RENDER_12S.cmd`

## Status: OK (with duration shortfall)

| Field | Value |
|-------|--------|
| Output | `D:\Wakungo_Content_Studio\Botanica\00_work\test_render\BOTANICA_12s_PREVIEW_720x1280_20261010_213305.mp4` |
| Report | `...\BOTANICA_12s_PREVIEW_RESULT_20261010_213305.md` |
| Bytes | 3,692,790 (~3.5 MB) |
| Duration | **6.207 s** (planned ~12 s) |
| Resolution | **720×1280** |
| FPS | 30/1 |
| Video | h264 |
| Audio | aac |
| Wall time | **8.2 s** |
| Drive modified | no |
| Full recap | no |
| Artist folders | untouched |

## Preflight sources (verified)

| File | Source dur | In | Len |
|------|------------|-----|-----|
| DSC_1552.MOV | 4.08s | 1.53 | 2.4 |
| DSC_1568.MOV | 13.68s | 5.28 | 2.4 |
| DSC_1580.MOV | 12.36s | 6.18 | 2.6 |
| DSC_1590.MOV | 53.04s | 28.536 | 2.2 |
| DSC_1598.MOV | 187.92s | 122.524 | 2.4 |

## Warnings
- ffmpeg MOV edit-list / missing keyframe while seeking (`-ss` before `-i`)
- swscaler deprecated pixel format
- **Duration shortfall:** output ~6.2s instead of ~12s — inaccurate input seek on sparse-GOP MOVs

## Follow-up (optional, needs new approval)
Script updated to put `-ss` **after** `-i` and mux with `-t 12` (no `-shortest`). Re-run only if you explicitly approve a second test encode.

## STOP
Authorized test recorded. No upload. No automatic second render.
