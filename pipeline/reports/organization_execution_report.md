# Organization Execution Report

**Created:** 2026-09-30  
**Approval:** given for organization execution  
**Scope executed here:** HIGH automatic-eligible only (8 files)  
**MEDIUM / LOW:** not executed  

## Status

| Item | Result |
|------|--------|
| Cloud agent Drive write | **Blocked** — `token.json` missing (OAuth desktop client only) |
| Dry-run plan | **OK** — 8 HIGH moves planned |
| Live moves | **Pending local execute** on PC with Drive auth |

## HIGH moves (approved)

Create folder if needed: `Artists/Arpan/events/Lapa71`  
Parent exists: `Artists/Arpan/events` (`1Yc-5UINgmFWxv2Ykpify4zqmiL4_LY08`)

| File | From | To |
|------|------|----|
| IMG_8920.MOV … IMG_8932.MOV (8) | `Lapa71/Arpan Upload/` | `Artists/Arpan/events/Lapa71/` |

## Windows execute (required for live Drive moves)

```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/gdrive_setup.py
pipeline\EXECUTE_ORG_HIGH.cmd
```

Or:

```powershell
python scripts\gdrive_setup.py   # once — creates token.json with Drive scope
python pipeline\tools\execute_organization.py --dry-run
python pipeline\tools\execute_organization.py --execute
```

## Not touched

- MEDIUM (Wako Botanica raw, `_UNASSIGNED_REVIEW`) — still review
- LOW (Phase 3 Review, EVENT_SELECTS, EXPORT)
- All protected/final folders

## Artifacts

- `pipeline/tools/execute_organization.py`
- `pipeline/EXECUTE_ORG_HIGH.cmd`
- `pipeline/data/organization_execution.json`
