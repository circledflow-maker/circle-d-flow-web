# Organization — continue after HIGH

**Updated:** 2026-09-30T22:04:45Z

## Done
- **HIGH (8/8)** `Lapa71/Arpan Upload` → `Artists/Arpan/events/Lapa71` — executed

## Next batch (MEDIUM)
- **56 files** from `Botanica/Wako Kungo- botanica`
- → `Artists/Wako Kungo/Botanica` (creates leaf under existing Wako artist folder)
- Respects Wako’s event-folder style (sibling to Oneness), not Arpan Performance nesting

## Still NOT auto-moved
- **72** `_UNASSIGNED_REVIEW` items — need face/name review
- LOW / protected / workflow Phase 3 Review

## Windows
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/gdrive_setup.py
pipeline\EXECUTE_ORG_MEDIUM_WAKO.cmd
```
