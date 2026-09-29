# Circle D Flow — Content Pipeline
## PHASE 3 — EXISTING AGENT MAPPING REPORT

**Created:** 2026-09-29T05:08:04Z  
**Rule:** Prefer reusing existing agents. **No new agents created.**  
**Sources:** `agent_registry.json`, Drive discovery, infrastructure report

### Legend
- **EXISTING**: Capable agent/tool already present
- **PARTIALLY_EXISTING**: Pieces exist; needs wiring/extension, not a new agent
- **MISSING**: No reasonable existing component
- **CONFLICTING**: Multiple overlapping implementations
- **UNKNOWN**: Insufficient evidence

### Capability matrix (desired pipeline)

| # | Capability | Status | Primary existing component | New agent? | Cheapest method |
|---|------------|--------|---------------------------|------------|-----------------|
| 1 | Drive Discovery | EXISTING | `pipeline/tools/drive_discovery_crawl.py` | NO | Public metadata crawl / Drive API files.list fields only — no downloads |
| 2 | Project Detection | PARTIALLY_EXISTING | `pipeline/tools/drive_discovery_crawl.py` | NO | Metadata path/name heuristics on folder_map.json (already seeded) |
| 3 | Artist Detection | PARTIALLY_EXISTING | `scripts/botanica_90s_recap/organize_artists_face.py` | NO | Filename/alias match first; face only on short proxies/samples |
| 4 | Media Classification | PARTIALLY_EXISTING | `scripts/content_pipeline/ears.py` | NO | Extension+ffprobe metadata; ears sample ≤45s; no full decode |
| 5 | Quality Analysis | PARTIALLY_EXISTING | `scripts/v16_portfolio_health_check.py` | NO | ffprobe + few-frame sample metrics; skip full-file analysis |
| 6 | Best Moment Detection | PARTIALLY_EXISTING | `scripts/v15_storyboard_builder.py` | NO | Audio peaks + fixed chapter windows on proxies; not every-frame vision |
| 7 | Virtual Crop Generation | EXISTING | `scripts/botanica_90s_recap/run_botanica_recap.py` | NO | Generate crops only for selected moments on proxies, not full masters |
| 8 | Still Extraction | EXISTING | `scripts/botanica_90s_recap/organize_artists_face.py` | NO | Single ffmpeg seek extract per selected timestamp |
| 9 | Image Enhancement | EXISTING | `scripts/botanica_90s_recap/organize_artists_face.py` | NO | OpenCV batch grade on stills/proxies; LR only for hero selects |
| 10 | Video Enhancement | EXISTING | `scripts/lapa71_tagus_pipeline.py` | NO | Proxy CRF 18–21 from source; never re-enhance finals |
| 11 | Event Recap Editing | EXISTING | `scripts/botanica_90s_recap/run_botanica_recap.py` | NO | Reuse selected proxies + existing segment planner; render once |
| 12 | Social Export | CONFLICTING | `scripts/v25_revised_shorts_agent.py` | NO | Export from already-cut recap masters; avoid new full edits |
| 13 | YouTube Export | EXISTING | `scripts/botanica_90s_recap/run_botanica_recap_16x9.py` | NO | One 16:9 master from selected sources; thumbnail still from peak frame |
| 14 | Artist Content Pack | EXISTING | `scripts/botanica_90s_recap/prepare_artist_drive_pack.py` | NO | Hardlink/proxy into pack structure; refs from Drive IDs/thumbnails |
| 15 | Artist Delivery | PARTIALLY_EXISTING | `scripts/botanica_90s_recap/prepare_artist_drive_pack.py` | NO | Publish pack folder IDs/links; upload only finals/proxies not raw |
| 16 | QA | PARTIALLY_EXISTING | `scripts/v16_portfolio_health_check.py` | NO | Metadata QA gates before any render |
| 17 | Reporting | EXISTING | `pipeline/tools/drive_discovery_crawl.py` | NO | Generate from existing inventories (no media IO) |

### Per-capability detail

#### 1. Drive Discovery — `EXISTING`

- **Which existing agent can handle it?** `drive_discovery_crawl`, `v9_deep_scout`, `v9_full_scout_run`, `sync_gdrive`, `scrape_gdrive`, `extract_gdrive_ids`, `gdrive_forensic`, `list_gdrive`
  - … +1 more in JSON
- **Which existing tool can handle it?** pipeline/data/*, google drive public metadata, googleapis
- **New component necessary?** No
- **Extend existing?** drive_discovery_crawl + v9_deep_scout (API auth) for size/duration completeness
- **Cheapest processing method?** Public metadata crawl / Drive API files.list fields only — no downloads
- **Recommended primary:** `pipeline/tools/drive_discovery_crawl.py`

#### 2. Project Detection — `PARTIALLY_EXISTING`

- **Which existing agent can handle it?** `drive_discovery_crawl`, `v9_deep_scout`, `v27_c4c_event_organizer`, `intake_sort`
- **Which existing tool can handle it?** folder_map.json classification, seed root IDs Planning/Lapa71/Botanica
- **New component necessary?** No
- **Extend existing?** Extend folder_map classification rules; optional thin detector over inventory JSON
- **Cheapest processing method?** Metadata path/name heuristics on folder_map.json (already seeded)
- **Recommended primary:** `pipeline/tools/drive_discovery_crawl.py`

#### 3. Artist Detection — `PARTIALLY_EXISTING`

- **Which existing agent can handle it?** `organize_artists_face`, `organize_artists_face`, `intake_sort`, `destiny_0324_face_assign`, `destiny_0322_face_assign`, `v30_c4c_face_classifier`, `prepare_artist_drive_pack`, `prepare_artist_drive_pack`
  - … +1 more in JSON
- **Which existing tool can handle it?** artist_registry.json, artist_seed.json, 00_REF face refs, OpenCV cascades
- **New component necessary?** No
- **Extend existing?** intake_sort (name+ears) + organize_artists_face (vision) using BotanicaArtistPack 00_REF
- **Cheapest processing method?** Filename/alias match first; face only on short proxies/samples
- **Recommended primary:** `scripts/botanica_90s_recap/organize_artists_face.py`

#### 4. Media Classification — `PARTIALLY_EXISTING`

- **Which existing agent can handle it?** `ears`, `intake_sort`, `v14_content_sorter`, `v14_content_sorter_v2`, `v10_vision_analyzer`, `find_botanica_media`
- **Which existing tool can handle it?** ffprobe, ffmpeg silencedetect/ebur128, media_manifest.json
- **New component necessary?** No
- **Extend existing?** ears + intake_sort format routing (Stages/FlowTalk/Akademie/events)
- **Cheapest processing method?** Extension+ffprobe metadata; ears sample ≤45s; no full decode
- **Recommended primary:** `scripts/content_pipeline/ears.py`

#### 5. Quality Analysis — `PARTIALLY_EXISTING`

- **Which existing agent can handle it?** `v16_portfolio_health_check`, `v10_vision_analyzer`, `vision_local_agent`, `v24_vision_kurator`, `v25_vision_kurator`, `v26_vision_kurator`, `ears`
- **Which existing tool can handle it?** ffprobe bitrate/resolution, ffmpeg signalstats (selective), OpenCV blur/exposure samples
- **New component necessary?** No
- **Extend existing?** Lightweight probe scoring on proxies; reuse vision_kurator patterns without full render
- **Cheapest processing method?** ffprobe + few-frame sample metrics; skip full-file analysis
- **Recommended primary:** `scripts/v16_portfolio_health_check.py`

#### 6. Best Moment Detection — `PARTIALLY_EXISTING`

- **Which existing agent can handle it?** `v15_storyboard_builder`, `v11_audio_scout`, `v16_concert_vision_agent`, `v23_curation_agent`, `v23_advanced_editor`, `run_botanica_recap`, `run_botanica_recap`
- **Which existing tool can handle it?** librosa beats (optional), scene/silence heuristics, chapter templates in artist_seed
- **New component necessary?** No
- **Extend existing?** Combine ears energy + existing storyboard/chapter windows; avoid new detector agent
- **Cheapest processing method?** Audio peaks + fixed chapter windows on proxies; not every-frame vision
- **Recommended primary:** `scripts/v15_storyboard_builder.py`

#### 7. Virtual Crop Generation — `EXISTING`

- **Which existing agent can handle it?** `run_botanica_recap`, `run_botanica_recap`, `run_botanica_letterbox_reel`, `v15_jam_reel_agent`, `v15_festival_aftermovie_agent`
- **Which existing tool can handle it?** ffmpeg crop/scale/pad, VIRTUAL_CROPS in run_botanica_recap.py
- **New component necessary?** No
- **Extend existing?** Reuse Botanica VIRTUAL_CROPS / letterbox paths for other events
- **Cheapest processing method?** Generate crops only for selected moments on proxies, not full masters
- **Recommended primary:** `scripts/botanica_90s_recap/run_botanica_recap.py`

#### 8. Still Extraction — `EXISTING`

- **Which existing agent can handle it?** `organize_artists_face`, `organize_artists_face`, `prepare_artist_drive_pack`, `prepare_artist_drive_pack`, `destiny_0324_face_assign`, `run_botanica_recap`, `run_botanica_recap`, `v30_c4c_face_classifier`
- **Which existing tool can handle it?** ffmpeg -ss frame grab, OpenCV imwrite
- **New component necessary?** No
- **Extend existing?** Existing face/frame extractors; limit to N frames per clip
- **Cheapest processing method?** Single ffmpeg seek extract per selected timestamp
- **Recommended primary:** `scripts/botanica_90s_recap/organize_artists_face.py`

#### 9. Image Enhancement — `EXISTING`

- **Which existing agent can handle it?** `organize_artists_face`, `organize_artists_face`, `prepare_artist_drive_pack`, `prepare_artist_drive_pack`, `v20_lightroom_gdrive_sync`, `v11_lightroom_vision`, `v22_lightroom_api_bridge`, `content_agent`
- **Which existing tool can handle it?** OpenCV grade, Lightroom/Adobe bridge, PIL
- **New component necessary?** No
- **Extend existing?** Reuse botanical grade in organize_artists_face; LR sync when needed
- **Cheapest processing method?** OpenCV batch grade on stills/proxies; LR only for hero selects
- **Recommended primary:** `scripts/botanica_90s_recap/organize_artists_face.py`

#### 10. Video Enhancement — `EXISTING`

- **Which existing agent can handle it?** `lapa71_tagus_pipeline`, `lapa71_tagus_pipeline`, `organize_artists_face`, `organize_artists_face`, `v7_audio_alchemist`, `v9_media_optimizer`, `premium_video_agent`, `video_production_agent`
  - … +1 more in JSON
- **Which existing tool can handle it?** ffmpeg hqdn3d/eq/loudnorm/stabilize, proxy pipelines
- **New component necessary?** No
- **Extend existing?** Existing proxy/stabilize/grade chains; one encode lane policy
- **Cheapest processing method?** Proxy CRF 18–21 from source; never re-enhance finals
- **Recommended primary:** `scripts/lapa71_tagus_pipeline.py`

#### 11. Event Recap Editing — `EXISTING`

- **Which existing agent can handle it?** `run_botanica_recap`, `run_botanica_recap`, `run_botanica_recap_16x9`, `run_botanica_letterbox_reel`, `run_wako_full_pipeline`, `run_wako_full_pipeline`, `v15_festival_aftermovie_agent`, `v20_immersive_aftermovie_agent`
  - … +1 more in JSON
- **Which existing tool can handle it?** ffmpeg concat, chapter plans, ANALYSIS JSON
- **New component necessary?** No
- **Extend existing?** Parameterize Botanica recap runners for Lapa71/Oneness seeds
- **Cheapest processing method?** Reuse selected proxies + existing segment planner; render once
- **Recommended primary:** `scripts/botanica_90s_recap/run_botanica_recap.py`

#### 12. Social Export — `CONFLICTING`

- **Which existing agent can handle it?** `v24_chronological_shorts_agent`, `v25_revised_shorts_agent`, `v26_ai_rotation_agent`, `v14_kyheart_social_agent`, `v21_social_curator`, `v28_c4c_social_curator`, `v19_stage_performance_highlights`
- **Which existing tool can handle it?** 9:16 ffmpeg exports, DRIVE_UPLOAD/EVENT, Ready_To_Post
- **New component necessary?** No
- **Extend existing?** Pick one shorts lane (v25/v26) as canonical to reduce CONFLICTING overlap
- **Cheapest processing method?** Export from already-cut recap masters; avoid new full edits
- **Recommended primary:** `scripts/v25_revised_shorts_agent.py`

#### 13. YouTube Export — `EXISTING`

- **Which existing agent can handle it?** `v19_youtube_jam_agent`, `v22_youtube_master_editor`, `run_botanica_recap_16x9`, `v15_festival_aftermovie_agent`
- **Which existing tool can handle it?** 16:9 ffmpeg, YouTube_Master_Renders folders on Drive
- **New component necessary?** No
- **Extend existing?** 16x9 full-frame runner + existing YT agents; prefer no-crop path when quality matters
- **Cheapest processing method?** One 16:9 master from selected sources; thumbnail still from peak frame
- **Recommended primary:** `scripts/botanica_90s_recap/run_botanica_recap_16x9.py`

#### 14. Artist Content Pack — `EXISTING`

- **Which existing agent can handle it?** `prepare_artist_drive_pack`, `prepare_artist_drive_pack`, `organize_artists_face`, `organize_artists_face`, `intake_sort`
- **Which existing tool can handle it?** Arpan schema folders, BotanicaArtistPack 00_REF, DRIVE_UPLOAD/ARTISTS
- **New component necessary?** No
- **Extend existing?** prepare_artist_drive_pack + Arpan schema; map to Content Pipeline Artists
- **Cheapest processing method?** Hardlink/proxy into pack structure; refs from Drive IDs/thumbnails
- **Recommended primary:** `scripts/botanica_90s_recap/prepare_artist_drive_pack.py`

#### 15. Artist Delivery — `PARTIALLY_EXISTING`

- **Which existing agent can handle it?** `prepare_artist_drive_pack`, `prepare_artist_drive_pack`, `sync_gdrive`, `v21_gdrive_portfolio_populator`, `v20_lightroom_gdrive_sync`, `update_gdrive_links`
- **Which existing tool can handle it?** DRIVE_UPLOAD upload packs, Google Drive share folders, akademie_data.js
- **New component necessary?** No
- **Extend existing?** Delivery = local DRIVE_UPLOAD pack + optional Drive API folder ensure (not built yet as orchestrator)
- **Cheapest processing method?** Publish pack folder IDs/links; upload only finals/proxies not raw
- **Recommended primary:** `scripts/botanica_90s_recap/prepare_artist_drive_pack.py`

#### 16. QA — `PARTIALLY_EXISTING`

- **Which existing agent can handle it?** `v16_portfolio_health_check`, `v18_fix_portfolio`, `daily_system_health_agent`, `find_botanica_media`
- **Which existing tool can handle it?** ffprobe duration/resolution checks, ANALYSIS plan JSON, inventory diffs
- **New component necessary?** No
- **Extend existing?** Checklist over media_manifest + export presence; no new QA agent required
- **Cheapest processing method?** Metadata QA gates before any render
- **Recommended primary:** `scripts/v16_portfolio_health_check.py`

#### 17. Reporting — `EXISTING`

- **Which existing agent can handle it?** `drive_discovery_crawl`, `v7_doc_agent`, `v9_pillar_doc`, `daily_system_health_agent`
- **Which existing tool can handle it?** pipeline/reports/*, ANALYSIS/*.json, agent_registry.json
- **New component necessary?** No
- **Extend existing?** Continue markdown+JSON reports under pipeline/reports
- **Cheapest processing method?** Generate from existing inventories (no media IO)
- **Recommended primary:** `pipeline/tools/drive_discovery_crawl.py`

### Conflicts (do not auto-run in parallel)

- **Social shorts / rotation** — `CONFLICTING`
  - Agents/tools: `v24_chronological_shorts_agent`, `v25_revised_shorts_agent`, `v26_ai_rotation_agent`, `v21_social_curator`, `v28_c4c_social_curator`
  - Multiple overlapping shorts/social curators — pick canonical before orchestration
- **Aftermovie / recap** — `CONFLICTING`
  - Agents/tools: `run_botanica_recap`, `v15_festival_aftermovie_agent`, `v20_immersive_aftermovie_agent`, `v21_immersive_revised_agent`, `v18_party_concert_mashup_agent`
  - Prefer Botanica runners for Botanica; do not run immersive+botanica together
- **Artist folder trees** — `CONFLICTING`
  - Agents/tools: `organize_artists_face`, `prepare_artist_drive_pack`, `Content Pipeline Artists`, `BotanicaArtistPack`
  - Two Drive ARTISTS roots — map, do not flatten/merge destructively

### Agent profile fields
See `pipeline/config/capability_matrix.json` → `agent_profiles` for: name, purpose, input, output, trigger, dependencies, Drive access, media access, processing cost, metadata-only, requires download, requires rendering, callable, modifies Drive, creates files, creates folders.

Profiles included: **142** (of 142 web runtime agents in registry + scripts/APIs).

### Processing cost distribution (profiled)
- high: 56
- low: 41
- low_to_medium: 23
- medium: 22

### Status summary
- **EXISTING**: 9
- **PARTIALLY_EXISTING**: 7
- **CONFLICTING**: 1

### Reuse decision
- New agents proposed: **0**
- New agents created this phase: **0**
- Later orchestration (if approved): thin config calling existing scripts — not a replacement suite

### Recommended wiring order (not built now)
1. Drive Discovery → 2. Project/Artist Detection → 3. Media Classification (ears) → 4. QA metadata gates → 5. Selective proxy/enhance (one encode lane) → 6. Recap → 7. Social/YT from masters → 8. Artist pack/delivery → 9. Reporting

### Artifacts
- `pipeline/config/capability_matrix.json`
- `pipeline/reports/agent_mapping_report.md`

### STOP
Phase 3 complete. No agents created. No Drive changes. Awaiting approval before Phase 4.
