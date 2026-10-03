# Circle D Flow — Content Pipeline
## PHASE 4 — SAFE ORGANIZATION PROPOSAL

**Created:** 2026-09-29T05:34:58Z  
**Drive modified:** NO  
**Moves executed:** 0  
**Rule:** Existing structure wins. Different ≠ wrong.

### Summary
- File proposals: **217**
- HIGH: **8** (automatic-eligible: **8**)
- MEDIUM: **128** (review)
- LOW: **81** (leave untouched)
- Protected files noted: **72**

### Folder policies
- `BotanicaArtistPack` — **keep_as_reference_pack** (HIGH): Numbered artist packs with 00_REF are intentional. Do not flatten into Content Pipeline Artists. Map/link identities only.
- `Artists/Arpan` — **preserve_schema** (HIGH): Canonical artist schema (events / Flow Talk / Performance / Akademie / beat). New Arpan material should use these leaves.
- `Botanica/EXPORT` — **protect** (HIGH): Final recap masters present.

### HIGH confidence — automatic candidates (NOT executed)

| File | Current | Proposed | Artist | Type | Dest exists |
|------|---------|----------|--------|------|-------------|
| `IMG_8920.MOV` | `Lapa71/Arpan Upload/IMG_8920.MOV` | `Artists/Arpan/events/Lapa71/IMG_8920.MOV` | Arpan | video | False |
| `IMG_8921.MOV` | `Lapa71/Arpan Upload/IMG_8921.MOV` | `Artists/Arpan/events/Lapa71/IMG_8921.MOV` | Arpan | video | False |
| `IMG_8924.MOV` | `Lapa71/Arpan Upload/IMG_8924.MOV` | `Artists/Arpan/events/Lapa71/IMG_8924.MOV` | Arpan | video | False |
| `IMG_8925.MOV` | `Lapa71/Arpan Upload/IMG_8925.MOV` | `Artists/Arpan/events/Lapa71/IMG_8925.MOV` | Arpan | video | False |
| `IMG_8926.MOV` | `Lapa71/Arpan Upload/IMG_8926.MOV` | `Artists/Arpan/events/Lapa71/IMG_8926.MOV` | Arpan | video | False |
| `IMG_8927.MOV` | `Lapa71/Arpan Upload/IMG_8927.MOV` | `Artists/Arpan/events/Lapa71/IMG_8927.MOV` | Arpan | video | False |
| `IMG_8931.MOV` | `Lapa71/Arpan Upload/IMG_8931.MOV` | `Artists/Arpan/events/Lapa71/IMG_8931.MOV` | Arpan | video | False |
| `IMG_8932.MOV` | `Lapa71/Arpan Upload/IMG_8932.MOV` | `Artists/Arpan/events/Lapa71/IMG_8932.MOV` | Arpan | video | False |

Reason: clear `Lapa71/Arpan Upload` → existing `Artists/Arpan/events/` schema (leaf `Lapa71`).

### MEDIUM — review required
#### Action `move_or_keep` — 56 files
- Example current: `Botanica/Wako Kungo- botanica/DSC_1546.JPG`
- Example proposed: `Artists/Wako Kungo/Botanica/DSC_1546.JPG`
- Reason: Raw Botanica capture labeled Wako Kungo; Wako artist folder uses event-named subfolders (e.g. Oneness). Optional align to Artists/Wako Kungo/Botanica — review first; project folder may be intentional.

#### Action `review_only_no_move` — 72 files
- Example current: `Botanica/_UNASSIGNED_REVIEW/FRAMES`
- Example proposed: `Botanica/_UNASSIGNED_REVIEW/FRAMES`
- Reason: Explicit _UNASSIGNED_REVIEW — no clear artist from filename alone. Keep until face/name review (organize_artists_face / intake_sort).

### LOW — leave untouched
Count: **81** (FlowTalk/Akademie Phase 3 Review workflow; Botanica EVENT_SELECTS/EXPORT curated/final).

### Protected areas (no proposals to move out)
Includes EXPORT, _ReadyToShare, Phase 4 Approved/Post Ready, YouTube_Master_Renders, Finals_*, and name-pattern protected folders.

### What we will NOT do
- No Drive moves/deletes/overwrites/duplicates
- No flattening BotanicaArtistPack into Content Pipeline Artists
- No `Artists/Arpan/Performance/Botanica` invention when `events/` fits
- No auto-sort of _UNASSIGNED_REVIEW without identity

### Artifacts
- `pipeline/data/organization_proposals.json`
- `pipeline/data/artist_index.json` (derived; was missing)
- `pipeline/reports/organization_report.md`

### STOP
Proposal only. Await approval before any execution.
