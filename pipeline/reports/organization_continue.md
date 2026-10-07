# UNASSIGNED closeout — place B-roll

**Updated:** 2026-10-07T15:48:15Z

Human confirmed remaining frames are **place/venue only** — no artist assignment.

## Move (7) → `Botanica/PLACE_BROLL`
- `DSC_1568_6s.jpg`
- `DSC_1568_8s.jpg`
- `DSC_1568_unassigned_stable.mp4`
- `DSC_1601_103s.jpg`
- `DSC_1601_138s.jpg`
- `DSC_1601_67s.jpg`
- `DSC_1601_unassigned_stable.mp4`

## Windows
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
pipeline\ENSURE_BOTANICA_ARTISTS.cmd
```

After this, UNASSIGNED artist-review queue is **clear**.
