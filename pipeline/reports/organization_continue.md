# Continue — Phase 5 metadata lane

**Updated:** 2026-10-10T12:10:00Z

## Status
- Phase 4 org: complete
- Phase 5 lite QA: complete (0 blockers)
- Phase 5 ears optional: **complete** — `[3] ok` + `[4] ok` on `EVENT_SELECTS\CROWD_WIDE\shot_030_crowd.mp4`
- Intake plan written locally: `pipeline\data\intake_plan.json`
- Render stages 6–10: still gated

## Windows (already in `D:\circle-d-flow-web`)
```powershell
git fetch origin cursor/phase5-intake-sort-exit1-f46a
git checkout -f origin/cursor/phase5-intake-sort-exit1-f46a -- pipeline scripts/content_pipeline
pipeline\PHASE5_INTAKE_REVIEW.cmd
pipeline\PHASE5_LITE.cmd
```

1. **INTAKE_REVIEW** — human-readable summary of sort/create/review + Drive CREATE proposals (not executed)
2. **PHASE5_LITE** — refresh QA so `intake_plan_present` flips to true

## STOP
- Approve before any Drive artist-folder creation
- Approve before `--allow-render --execute`
- No full-master downloads
