# Phase 4 complete → Phase 5 lite

**Updated:** 2026-10-08T23:27:05Z

## Phase 4 — DONE
Drive organization + Botanica Artists ensure finished.

## Phase 5 lite — next (metadata / ears sample, no full masters)
```powershell
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\PHASE5_LITE.cmd
```

Runs orchestrator dry stages: project detect, QA metadata gates, reporting.
Optional local ears sample only if `--local-root` has proxies (never downloads masters).

Heavy render (recap / YouTube) stays gated behind `--allow-render --execute`.
