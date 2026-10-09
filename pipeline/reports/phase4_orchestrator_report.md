# Circle D Flow — Content Pipeline  
## PHASE 4 — THIN ORCHESTRATOR (REUSE ONLY)

**Created:** 2026-09-29  
**Approval:** Phase 3 mapping approved → thin wiring only  
**Drive modified:** NO  
**New replacement agents:** NO  

---

### What was built

| Artifact | Role |
|----------|------|
| `pipeline/config/orchestrator.json` | Stage wiring to **existing** scripts; canonical conflict choices |
| `pipeline/tools/orchestrate.py` | Dry-run by default; render stages gated |
| `pipeline/data/project_detection.json` | Derived from Drive discovery |
| `pipeline/data/qa_gate.json` | Metadata QA gate |
| `pipeline/reports/orchestrator_run_report.md` | Last run log |

### Canonical choices (from Phase 3 conflicts)

- **Recap:** `run_botanica_recap.py` (not immersive aftermovie agents)
- **YouTube:** `run_botanica_recap_16x9.py`
- **Social:** `v25_revised_shorts_agent.py` (not v24/v26 in parallel)
- **Artist pack:** `prepare_artist_drive_pack.py`
- **Face sort:** `organize_artists_face.py`
- **Ears/intake:** `ears.py` / `intake_sort.py`

### Stage policy

| Stages | Default |
|--------|---------|
| 1–2, 5, 11 (metadata) | Enabled; safe |
| 3–4 (intake/ears) | Planned; needs local `--local-root` |
| 6–10 (render/pack) | **Opt-in** — require `--allow-render --execute` |

### Smoke result (this environment)

```
[2] Project Detection → 4 projects (Planning, Lapa71, Botanica, Content Pipeline); Arpan schema 8 nodes
[5] QA Metadata Gates → ok=True (intake_plan warning until local Botanica run)
```

### How to run (Windows PC with D:)

```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-orchestrator-f46a
git checkout -f origin/cursor/content-pipeline-orchestrator-f46a -- pipeline

REM metadata plan only
python pipeline\tools\orchestrate.py --list
python pipeline\tools\orchestrate.py --only 2,5,11

REM intake plan against local Botanica (no Drive mutate)
python pipeline\tools\orchestrate.py --execute --only 3 --local-root "D:\Wakungo_Content_Studio\Botanica" --event-name "Botanica 90s"

REM HEAVY renders — only after explicit approval
python pipeline\tools\orchestrate.py --execute --allow-render --only 7,8 --local-root "D:\Wakungo_Content_Studio\Botanica"
```

### Explicitly not done

- No new agent suite
- No Drive folder create/move/rename
- No automatic full-media download
- No parallel conflicting shorts/aftermovie runs

### STOP

Phase 4 wiring is ready in **dry-run / metadata** mode.  
Awaiting approval before `--allow-render --execute` on production media or any Drive write API.
