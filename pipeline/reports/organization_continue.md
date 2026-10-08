# Organization — continue (no more PERFORMANCE assign)

**Updated:** 2026-10-08T23:20:08Z

## Closed
EVENT_SELECTS PERFORMANCE artist assignment **stopped by request**.
9 leftovers stay in `Botanica/EVENT_SELECTS/PERFORMANCE` (no move).

## Next frames / next step
**1) Ensure Botanica Artists folders** (recommended now):
```powershell
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\ENSURE_BOTANICA_ARTISTS.cmd
```

Creates/syncs Arpan schema + `events/Botanica` for Felippe, Noua, Diaza, João, Lyssa, Zeus, Silso, Piano TBD, etc.

**2) After that** — Phase 5 lite (proxy/ears QA) or optional DETAILS tagging later.

VENUE / CROWD_WIDE / DETAILS already typed — leave.
