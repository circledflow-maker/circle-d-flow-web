# Organization — continue

**Updated:** 2026-09-30T22:12:28Z

## Done on Drive
| Batch | Count | Destination | Status |
|-------|------:|-------------|--------|
| HIGH Arpan Upload | 8 | `Artists/Arpan/events/Lapa71` | executed |
| MEDIUM Wako Botanica | 56 | `Artists/Wako Kungo/Botanica` | executed |

## Next — NO auto-move
| Batch | Count | Action |
|-------|------:|--------|
| UNASSIGNED review | ~69 | Face leftovers — review pack ready |
| LOW / protected | 81 | leave untouched |

### Why UNASSIGNED stays
These are `*_unassigned_stable` / frames from `organize_artists_face` that did **not** match Diaza (or other primary hits). Same Botanica roll, multi-artist — needs visual/`00_REF` check.

### Windows
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline
pipeline\REVIEW_UNASSIGNED.cmd
```

Reports: `pipeline/reports/unassigned_review_pack.md`
