# Continue after ears skip

**Updated:** 2026-10-09T16:04:11Z

Stage 4 previously skipped (no `CDF_SAMPLE_MEDIA`). Fixed:
- auto-pick a local proxy under `--local-root`
- `PHASE5_EARS_OPTIONAL.cmd` now runs **stage 3 (intake_sort+ears)** then **stage 4 (smoke sample)**

## Windows (already in `D:\circle-d-flow-web`)
```powershell
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\PHASE5_EARS_OPTIONAL.cmd
```

If proxies are not under `D:\Wakungo_Content_Studio\Botanica`, set:
```powershell
$env:LOCAL_ROOT="D:\path\to\your\proxies"
```
(or edit the path inside the `.cmd`).

No Drive downloads. No render.
