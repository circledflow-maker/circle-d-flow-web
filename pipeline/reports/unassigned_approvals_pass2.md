# Held / pass-2 approvals ready

**Ingested:** 2026-10-05T20:43:10Z
**Source file:** `unassigned_approvals (2).json`
**Moves:** 46 · **Skips:** 18 · prefer normalized: 28

## By destination
- `10_wako.kungo_Wako_Kungo` → Artists/Wako Kungo/Botanica: **29**
- `02_noua_Noua` → BotanicaArtistPack/02_noua_Noua/…: **6**
- `05_joaoredondomaia_Joao_Redondo_Maia` → BotanicaArtistPack/05_joaoredondomaia_Joao_Redondo_Maia/…: **3**
- `11_filipesax_Felippe_Sax` → Artists/Felippe Sax/Botanica: **3**
- `09_edoardostatuto_Edo_Edoardo_Statuto` → BotanicaArtistPack/09_edoardostatuto_Edo_Edoardo_Statuto/…: **2**
- `04_diazaofficial_Diaza` → BotanicaArtistPack/04_diazaofficial_Diaza/…: **2**
- `07_silso_n6_Silso` → BotanicaArtistPack/07_silso_n6_Silso/…: **1**

## Windows execute
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```

Already-moved files report `already_in_destination` (safe). New/changed dests move.

## Still missing from this export
- DSC_1601_* (if still under `_UNASSIGNED_REVIEW`) — run `REVIEW_HELD_UNASSIGNED.cmd` again after this batch if needed.
- Recommended after: `ENSURE_BOTANICA_ARTISTS.cmd` (Noua/Diaza/João/Silso/Felippe folders)
