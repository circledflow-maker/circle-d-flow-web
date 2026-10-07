# EVENT_SELECTS pass-1 ready + roles

**Ingested:** 2026-10-07T16:47:13Z
**Moves:** 15 · **Skips:** 6 · prefer norm: 0

## Destinations
- `11_filipesax_Felippe_Sax`: **3**
- `10_wako.kungo_Wako_Kungo`: **3**
- `06_zeus_atro_Zeus_Atro`: **3**
- `02_noua_Noua`: **2**
- `09_edoardostatuto_Edo_Edoardo_Statuto`: **2**
- `08_mistah_isaac_Mistah_Isaac`: **2**

## New assign options (gallery)
- **Piano Player (TBD)** → `BotanicaArtistPack/12_piano_player_TBD`
- **Other Guitar (TBD)** → `BotanicaArtistPack/13_other_guitar_TBD`
- **Crowd** → `Botanica/EVENT_SELECTS/CROWD_WIDE`

## Thumb quality
Gallery uses `object-fit: contain` (no crop) + Drive thumbs `sz=w1920`.
Re-fetch: `pipeline\REVIEW_EVENT_SELECTS.cmd` (force-thumbs).

## Windows — execute this pass
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```

## Then continue remaining PERFORMANCE (skips + unreviewed)
```bat
pipeline\REVIEW_EVENT_SELECTS.cmd
```
Use Piano / Other Guitar / Crowd for shots that were skipped for missing options.
