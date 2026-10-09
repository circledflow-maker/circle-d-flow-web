# EVENT_SELECTS pass-3 ready

**Ingested:** 2026-10-08T23:07:35Z
**Moves:** 23 · **Skips:** 3 · roles: 9 · prefer norm: 0

## By destination
- `crowd`: **6**
- `11_filipesax_Felippe_Sax`: **3**
- `08_mistah_isaac_Mistah_Isaac`: **3**
- `10_wako.kungo_Wako_Kungo`: **2**
- `06_zeus_atro_Zeus_Atro`: **2**
- `13_other_guitar_TBD`: **2**
- `02_noua_Noua`: **1**
- `01_lyssa.bl_Lyssa`: **1**
- `12_piano_player_TBD`: **1**
- `04_diazaofficial_Diaza`: **1**
- `05_joaoredondomaia_Joao_Redondo_Maia`: **1**

## Windows (already in `D:\circle-d-flow-web`)

```powershell
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```

If fetch is still behind (push was flaky earlier), copy the download instead:

```powershell
copy /Y "$env:USERPROFILE\Downloads\unassigned_approvals (9).json" pipeline\data\unassigned_approvals.json
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```
