# Organization — continue

**Updated:** 2026-10-03T11:24:45Z

## Felippe Sax added
- IG: `filipesax_` · Filipe Bohlke
- Pack: `BotanicaArtistPack/11_filipesax_Felippe_Sax` (create on execute)
- Artists: `Artists/Felippe Sax` + `Botanica` (Arpan schema)
- 00_REF: `pipeline/assets/artist_refs/Felippe_Sax/`

## Approvals ready
| Dest | Moves |
|------|------:|
| Felippe Sax (DSC_1580/83/85/86/88) | 18 |
| All moves | 48 |
| Skips | 18 |

Diaza picks on those DSC kept. Wako stills / Noua / Edo / João unchanged.

## Windows — execute
```bat
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-org-execute-f46a
git checkout -f origin/cursor/content-pipeline-org-execute-f46a -- pipeline scripts/content_pipeline/artist_registry.json
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```
