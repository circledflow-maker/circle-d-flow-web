# Content Pipeline — Intake (Arpan schema + Ears)

Extends the existing Google Drive **Content Pipeline** ecosystem.  
Does **not** rebuild architecture, rename Drive folders, download masters, or render.

## Source of truth

Root: https://drive.google.com/drive/folders/1scqyPtXRz0teWjUBQXBXHdGywXR83cOH

Reference artist layout (**Arpan**):

```
Artists/Arpan/
  events/
  Flow Talk/
  Just in Flow with the beat/
  Performance - CircleDStages/
  Wisdom to share- Akademie/
```

New artists mirror this schema.

## Ears

`ears.py` listens to a **short ffmpeg sample** (default ~45s) and classifies:

| Class | Typical route |
|-------|----------------|
| music | `Performance - CircleDStages` |
| speech (short) | `Flow Talk` |
| speech (long) | `Wisdom to share- Akademie` |
| mixed | `Just in Flow with the beat` |
| no_audio / photo | `events/<EventName>/` |

No full-file decode to disk. No frame-by-frame video analysis in this phase.

## Commands (Windows PC with D:)

```powershell
cd D:\circle-d-flow-web
git fetch origin cursor/content-pipeline-arpan-ears-f46a
git checkout -f origin/cursor/content-pipeline-arpan-ears-f46a -- scripts/content_pipeline

# Arpan inventory (metadata already in repo)
python .\scripts\content_pipeline\intake_sort.py --artist Arpan --inventory-only

# Botanica / new upload — analyze + plan (dry-run)
python .\scripts\content_pipeline\intake_sort.py `
  --source "D:\Wakungo_Content_Studio\Botanica" `
  --event "Botanica 90s" `
  --limit 40

# Local staging only (hardlinks; does NOT touch Google Drive)
python .\scripts\content_pipeline\intake_sort.py `
  --source "D:\Wakungo_Content_Studio\Botanica" `
  --event "Botanica 90s" `
  --apply
```

Drive folder **creation** is written as proposals in the plan JSON (`drive_create_proposals`).  
Nothing is created on Drive until you explicitly approve a later phase with API credentials.

## Files

| File | Role |
|------|------|
| `drive_ids.json` | Content Pipeline + pillar + Arpan IDs |
| `arpan_inventory.json` | Phase-0/1 Arpan tree (metadata) |
| `artist_registry.json` | 28 Drive artists + Botanica create proposals |
| `ears.py` | Audio listening |
| `intake_sort.py` | Intake → ears + name → sort/create plan |
