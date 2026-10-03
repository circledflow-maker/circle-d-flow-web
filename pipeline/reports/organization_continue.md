# Organization — continue

**Updated:** 2026-10-03T12:10:31Z

## Done on Drive
| Step | Status |
|------|--------|
| HIGH Arpan Upload (8) | executed |
| MEDIUM Wako Botanica (56) | executed |
| UNASSIGNED approvals (48) | executed — includes Felippe Sax |
| Felippe Sax artist folder | created via apply |

## Next (in order)
### 1) Ensure Botanica Artists folders
Creates Arpan schema + `events/Botanica` for Felippe, Noua, Diaza, João, Lyssa, Zeus, Silso; syncs registry ids.

```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\ENSURE_BOTANICA_ARTISTS.cmd
```

### 2) MEDIUM skip-sibling moves (6 files)
Skips with a **single** sibling artist (Edo / Noua / João). Leaves DSC_1568 + DSC_1601 + mixed 1565 for later review.

```bat
pipeline\EXECUTE_SKIP_SIBLINGS.cmd
```

### 3) Still held for visual review
12 files — see `pipeline/reports/unassigned_skip_sibling.md`
