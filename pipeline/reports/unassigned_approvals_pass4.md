# Pass-4 approvals ready

**Ingested:** 2026-10-07T15:41:18Z
**Source:** `unassigned_approvals (4).json`
**Moves:** 1 · **Skips:** 3 · prefer normalized: 0
**Still remaining after this pass:** 7

## By destination
- `10_wako.kungo_Wako_Kungo` → Artists/Wako Kungo/Botanica: **1**

## Skips
- `DSC_1565_5s.jpg`
- `DSC_1568_2s.jpg`
- `DSC_1601_32s.jpg`

## Still remaining
- `DSC_1568_6s.jpg`
- `DSC_1568_8s.jpg`
- `DSC_1568_unassigned_stable.mp4`
- `DSC_1601_103s.jpg`
- `DSC_1601_138s.jpg`
- `DSC_1601_67s.jpg`
- `DSC_1601_unassigned_stable.mp4`

## Windows — next
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
pipeline\ENSURE_BOTANICA_ARTISTS.cmd
```
Then `pipeline\REVIEW_HELD_UNASSIGNED.cmd` for leftovers.
