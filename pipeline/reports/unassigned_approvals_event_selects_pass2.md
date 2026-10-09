# EVENT_SELECTS pass-2 ready

**Ingested:** 2026-10-07T16:56:46Z
**Moves:** 26 · **Skips:** 7 · roles touched: 6 · prefer norm: 0

## By destination
- `10_wako.kungo_Wako_Kungo`: **5**
- `crowd`: **5**
- `08_mistah_isaac_Mistah_Isaac`: **4**
- `11_filipesax_Felippe_Sax`: **3**
- `02_noua_Noua`: **2**
- `06_zeus_atro_Zeus_Atro`: **2**
- `01_lyssa.bl_Lyssa`: **1**
- `12_piano_player_TBD`: **1**
- `09_edoardostatuto_Edo_Edoardo_Statuto`: **1**
- `04_diazaofficial_Diaza`: **1**
- `05_joaoredondomaia_Joao_Redondo_Maia`: **1**

## Windows (you are already in `D:\circle-d-flow-web`)

Do **not** type `d ...` — use `cd` only if needed. Since the prompt shows `PS D:\circle-d-flow-web>`, run:

```powershell
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```

If checkout fails because of local edits:
```powershell
git restore pipeline scripts/content_pipeline
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```
