# Continue after inventory-only (no render yet)

**Updated:** 2026-10-10T19:53:00Z

## Done
```text
python scripts\botanica_90s_recap\run_botanica_recap.py --root "D:\Wakungo_Content_Studio\Botanica" --inventory-only
→ Inventory only - done.
   prefer 'wako kungo': 46 clips | other: 1
   videos=49 photos=9
   event source clips used: 47 (from Wako Kungo pool: 46)
   Concept9-16.mp4 probed OK
```

## Next (read-only checks on Windows — run these, then send output)
```powershell
cd D:\circle-d-flow-web

if (Test-Path "D:\Wakungo_Content_Studio\Botanica\ANALYSIS\media_inventory.json") { "FOUND: ANALYSIS\media_inventory.json" } else { "MISSING" }
if (Test-Path "D:\Wakungo_Content_Studio\Botanica\ANALYSIS\artist_database.json") { "FOUND: ANALYSIS\artist_database.json" } else { "MISSING" }
if (Test-Path "pipeline\reports\intake_plan_review.md") { "FOUND: intake_plan_review.md" } else { "MISSING: intake_plan_review.md" }

# Peek inventory counts (no render)
python -c "import json; p=r'D:\Wakungo_Content_Studio\Botanica\ANALYSIS\media_inventory.json'; d=json.load(open(p,encoding='utf-8')); print('count=', d.get('count')); print('created_at=', d.get('created_at'))"
```

## After that — controlled render (ONLY if you explicitly ask)
Do **not** run yet. Candidate later:
```powershell
# Bounded test — NOT full orchestrator --allow-render for stages 6-10
python scripts\botanica_90s_recap\run_botanica_recap.py --root "D:\Wakungo_Content_Studio\Botanica" --seconds 20
```
(`--force` only if you intend a full rebuild of `00_work\recap_tmp`.)

Still gated: Drive rediscovery, intake `--apply`, stages 6–10 via orchestrator.
