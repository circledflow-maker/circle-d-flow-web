# EVENT_SELECTS remaining pass ready

**Ingested:** 2026-10-08T23:17:32Z
**Moves:** 0 · **Skips:** 2 · roles: 0 · prefer: 0
**Still remaining after this:** 9

## By destination

## Skips
- `shot_013_medium.mp4`
- `shot_018_close_up.mp4`

## Still remaining
- `shot_008_wide.mp4`
- `shot_011_portrait.mp4`
- `shot_018_portrait.mp4`
- `shot_019_close_up.mp4`
- `shot_019_portrait.mp4`
- `shot_020_medium.mp4`
- `shot_032_wide.mp4`
- `shot_034_close_up.mp4`
- `shot_036_close_up.mp4`

## Windows (already in `D:\circle-d-flow-web`)
```powershell
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```
Then `pipeline\REVIEW_EVENT_SELECTS_REMAINING.cmd` for leftovers.
