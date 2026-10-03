# Skip-sibling approvals (MEDIUM)

**Created:** 2026-10-03T12:10:31Z
**Proposed moves:** 6
**Still held:** 12 (DSC_1568 / DSC_1601 / mixed)

## Proposed

- `DSC_1551_unassigned_stable.mp4` → `09_edoardostatuto_Edo_Edoardo_Statuto` (Single sibling artist on DSC_1551: 09_edoardostatuto_Edo_Edoardo_Statuto)
- `DSC_1560_2s.jpg` → `02_noua_Noua` (Single sibling artist on DSC_1560: 02_noua_Noua)
- `DSC_1562_5s.jpg` → `05_joaoredondomaia_Joao_Redondo_Maia` (Single sibling artist on DSC_1562: 05_joaoredondomaia_Joao_Redondo_Maia)
- `DSC_1562_unassigned_stable.mp4` → `05_joaoredondomaia_Joao_Redondo_Maia` (Single sibling artist on DSC_1562: 05_joaoredondomaia_Joao_Redondo_Maia)
- `DSC_1564_5s.jpg` → `02_noua_Noua` (Single sibling artist on DSC_1564: 02_noua_Noua)
- `DSC_1564_unassigned_stable.mp4` → `02_noua_Noua` (Single sibling artist on DSC_1564: 02_noua_Noua)

## Held

- `DSC_1565_25s.jpg` — ambiguous_or_no_sibling ['02_noua_Noua', '10_wako.kungo_Wako_Kungo']
- `DSC_1565_5s.jpg` — ambiguous_or_no_sibling ['02_noua_Noua', '10_wako.kungo_Wako_Kungo']
- `DSC_1568_2s.jpg` — ambiguous_or_no_sibling []
- `DSC_1568_4s.jpg` — ambiguous_or_no_sibling []
- `DSC_1568_6s.jpg` — ambiguous_or_no_sibling []
- `DSC_1568_8s.jpg` — ambiguous_or_no_sibling []
- `DSC_1568_unassigned_stable.mp4` — ambiguous_or_no_sibling []
- `DSC_1601_103s.jpg` — ambiguous_or_no_sibling []
- `DSC_1601_138s.jpg` — ambiguous_or_no_sibling []
- `DSC_1601_32s.jpg` — ambiguous_or_no_sibling []
- `DSC_1601_67s.jpg` — ambiguous_or_no_sibling []
- `DSC_1601_unassigned_stable.mp4` — ambiguous_or_no_sibling []

## Execute
```bat
copy /Y pipeline\data\unassigned_skip_sibling_approvals.json pipeline\data\unassigned_approvals.json
pipeline\EXECUTE_UNASSIGNED_APPROVALS.cmd
```

