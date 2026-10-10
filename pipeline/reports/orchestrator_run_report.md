# Content Pipeline — Orchestrator Run Report

**Created:** 2026-10-10T12:11:37Z
**Mode:** execute
**Allow render:** False
**Execute:** True

## Stages

- **2. Project Detection** — `ok` — projects=4 arpan_nodes=8
- **5. QA Metadata Gates** — `ok` — blockers=0
- **11. Reporting** — `ok_end` — report written after stage loop

## Policy
- Existing agents only (no replacements)
- Drive not modified by orchestrator
- Render stages gated by `--allow-render --execute`

### STOP
Approve before enabling render stages on production media.
