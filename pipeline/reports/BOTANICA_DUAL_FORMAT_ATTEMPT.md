# Botanica dual-format render — attempt

**Created:** 2026-10-10T20:51:00Z  
**Authorization:** APPROVED both 16:9 + 9:16

## Cloud agent
| Check | Result |
|-------|--------|
| `D:\Wakungo_Content_Studio\Botanica` mounted | **FAIL** |
| Render executed in cloud | **NO** |

## Windows execution (required)

```powershell
cd D:\circle-d-flow-web
git fetch origin cursor/phase5-intake-sort-exit1-f46a
git checkout -f origin/cursor/phase5-intake-sort-exit1-f46a -- pipeline
pipeline\BOTANICA_DUAL_FORMAT_TEST_RENDER.cmd
```

Script enforces:
- Audio bed from `DSC_1598.MOV` @ ss=40 with remainder >= 12s
- `-ss` after `-i`, mux `-t 12`, **no** `-shortest`
- Outputs `BOTANICA_12s_YT16x9_1280x720_<stamp>.mp4` and `BOTANICA_12s_SOCIAL9x16_720x1280_<stamp>.mp4`
- Preserves `...213305.mp4`
- ffprobe QA + RESULT md under `00_work\test_render\`

## STOP
Await Windows RESULT screenshot / paths after local run.
