# Pass-3 approvals ready

**Ingested:** 2026-10-05T20:53:49Z
**Source:** `unassigned_approvals (3).json`
**Moves:** 1 · **Skips:** 3 · prefer normalized: 0

## By destination
- `10_wako.kungo_Wako_Kungo` → Artists/Wako Kungo/Botanica: **1**

## DSC_1568 / DSC_1601 in this export
- DSC_1568: 1 ({'skip': 1})
- DSC_1601: 1 ({'skip': 1})

## Windows execute
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```

Then:
```bat
pipeline\ENSURE_BOTANICA_ARTISTS.cmd
```
