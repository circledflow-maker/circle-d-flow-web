# Continue — re-run intake (artist/pack first)

**Updated:** 2026-10-10T18:41:00Z

## What happened
Last ears re-run produced **40/40 review** and **39× no_audio** because `--limit 40` filled with `EVENT_SELECTS/shot_*` (no artist names; many silent selects). Drive CREATE×6 still **skip** (ENSURE already done).

## Fix shipped
- Intake inventory ranks **artist/pack AV** before EVENT_SELECTS/crowd/place
- Name match also uses pack folder tokens (`11_filipesax_…`)
- Ears auto-sample deprioritizes crowd/place

## Windows
```powershell
git fetch origin cursor/phase5-intake-sort-exit1-f46a
git checkout -f origin/cursor/phase5-intake-sort-exit1-f46a -- pipeline scripts/content_pipeline
pipeline\PHASE5_EARS_OPTIONAL.cmd
pipeline\PHASE5_INTAKE_REVIEW.cmd
```

Expect console `path mix:` to show Artists/pack folders, not only EVENT_SELECTS. Drive CREATE still skip. Render gated.
