# Organization — continue

**Updated:** 2026-10-08T23:12:20Z

## Done
EVENT_SELECTS pass-3 **23/23** executed (incl. Crowd → `CROWD_WIDE`).

## Next — 11 PERFORMANCE leftovers
```powershell
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\REVIEW_EVENT_SELECTS_REMAINING.cmd
```

Then save JSON → `pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd`

### Queue
- `shot_008_wide.mp4` (unreviewed)
- `shot_011_portrait.mp4` (skip)
- `shot_013_medium.mp4` (skip)
- `shot_018_close_up.mp4` (skip)
- `shot_018_portrait.mp4` (skip)
- `shot_019_close_up.mp4` (unreviewed)
- `shot_019_portrait.mp4` (unreviewed)
- `shot_020_medium.mp4` (unreviewed)
- `shot_032_wide.mp4` (skip)
- `shot_034_close_up.mp4` (skip)
- `shot_036_close_up.mp4` (unreviewed)

Optional after clear: `pipeline\ENSURE_BOTANICA_ARTISTS.cmd`
