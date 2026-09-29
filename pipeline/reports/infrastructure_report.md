# Circle D Flow — Content Pipeline  
## PHASE 1 — INFRASTRUCTURE DISCOVERY REPORT

**Generated:** 2026-09-28  
**Scope:** Read-only discovery of the existing `circle-d-flow-web` repository and linked Google Drive trees.  
**Actions taken:** Inspection + metadata listing only. **No existing agents modified. No agents replaced. No new replacement agents created.**

Related registry: [`/pipeline/config/agent_registry.json`](../config/agent_registry.json)

---

## 0. Drive artist references (approved update source)

**Folder:** [ARTISTS](https://drive.google.com/drive/folders/1Ss3ypxTiJgTCW-ucsLLbjEbG653RuRbk)  
**ID:** `1Ss3ypxTiJgTCW-ucsLLbjEbG653RuRbk`  
**Method:** Public Drive embed/HTML metadata (no media downloaded)

| # | Folder | Drive ID | Ref images | Perf videos | Portraits | Frames |
|---|--------|----------|------------|-------------|-----------|--------|
| 01 | `01_lyssa.bl_Lyssa` | `1hGOTQzLzias81PGEqtU8sseWP3MFGXqs` | ARTIST_lyssa_bl.png | 0 | 0 | 0 |
| 02 | `02_noua_Noua` | `1U0U80ZZniB9G12QYNRiq0n61LW65lDY_` | (README only) | 0 | 0 | 0 |
| 03 | `03_chriskristoffer_Chris_Kristoffer` | `124bB6gCTCINF9lnj1aNt8sdfPGx0qjAM` | ARTIST_chriskristoffer.png | 0 | 0 | 0 |
| 04 | `04_diazaofficial_Diaza` | `16HVd8NHHXLPVTcx3qfIQkRf6i02Hdr99` | ARTIST_diazaofficial.png | **76** | **19** | **149** |
| 05 | `05_joaoredondomaia_Joao_Redondo_Maia` | `1RxbBpKEj8SIrPr54HAdxmFJZfUZSBYeh` | ARTIST_joaoredondomaia.png | 0 | 0 | 0 |
| 06 | `06_zeus_atro_Zeus_Atro` | `1e5DrWHx9eHL99kTz6LnQUrtrR0e-Sz7F` | ARTIST_zeus_atro.png | 1 | 0 | 3 |
| 07 | `07_silso_n6_Silso` | `1ZmL2Ve9O8eobBeGRVCIbfDbEvLp883Ks` | (README only) | 0 | 0 | 0 |
| 08 | `08_mistah_isaac_Mistah_Isaac` | `1SPB-CJ7b8dN0G1b4ndG9z5703Mpk1rei` | (README only) | 0 | 0 | 0 |
| 09 | `09_edoardostatuto_Edo_Edoardo_Statuto` | `1Ff9OPjgqvB5xCtD0r2gP_ip10yyZ7BvP` | (README only) | 0 | 0 | 0 |
| 10 | `10_wako.kungo_Wako_Kungo` | `1wiIPrQvE8pVcop3xeaWR5mkztLtUJYy6` | flyer PNG | 0 | 0 | 0 |

Each pack contains `artist.json` + `00_REF/` (references inside).  
Local mirror refs also exist under `Assets/content/botanica/refs/`.

**Separate** Content Pipeline Artists root (ecosystem, Arpan schema):  
`1OLOk__QJ2TWVvcgnhu9wEV4rYF6ALc7Q` — 28 shared artist folders (Arpan, C-Riz, Wako Kungo, …).  
Do not confuse with the Botanica numbered `ARTISTS` pack above.

---

## 1. Existing source code

| Area | Location | Notes |
|------|----------|--------|
| Web app | `pages/`, `css/`, `js/`, `Assets/` | Vanilla HTML/CSS/JS (no React/Next) |
| Serverless APIs | `api/` | Vercel functions |
| Content scripts | `scripts/` | Large library of versioned agents (`v6`–`v31`) |
| Botanica lane | `scripts/botanica_90s_recap/` | Face sort + 9:16 / 16:9 / letterbox reels |
| Intake (recent) | `scripts/content_pipeline/` | Ears + intake plan (Arpan schema) — existing scripts, not replaced |
| Local processing | `01_AGENT_PROCESSING/` | Premium/video agents, event cuts |
| Rules | `.cursor/rules/content-pipeline.mdc`, `.cursorrules` | Format rules (Akademy/Stages/FlowTalk/Podcast) |
| Deploy | `vercel.json`, GitHub Actions | Static + serverless |

---

## 2–4. Existing agents / directories / config

### Directories
- `js/agents/` — **142** browser/runtime agents (Flowee, event, market, vision_*, scout, …)
- `scripts/` — Python/PowerShell content & Drive agents
- `scripts/botanica_90s_recap/`
- `scripts/content_pipeline/`
- `01_AGENT_PROCESSING/`
- `.github/workflows/`

### Configuration files (discovered)
- `.env.example` — Supabase, Stripe, WhatsApp, GDrive OAuth, Sheets, admin
- `credentials.json` — Google OAuth client (Desktop); `token.json` **missing** in this environment
- `adobe_token.json` — Adobe token present
- `js/cdf_runtime_config.js` — public Supabase URL/anon (no service role)
- `js/data/akademie_data.js`, `portfolio_data.js` — Drive-backed / portfolio data
- `scripts/botanica_90s_recap/artist_seed.json`
- `scripts/content_pipeline/{drive_ids,artist_registry,arpan_inventory}.json`
- `supabase_migrations/gdrive_artists.sql`
- GitHub secrets usage: `GDRIVE_SERVICE_ACCOUNT_KEY`

**Full machine-readable list:** `pipeline/config/agent_registry.json` (**274** discovered agent/script/API/workflow entries).

---

## 5–6. Google Drive & Workspace integrations

| Integration | Location | Behavior |
|-------------|----------|----------|
| Akademie Drive sync (CI) | `scripts/sync_gdrive.js` + `.github/workflows/gdrive-sync.yml` | Service account readonly → writes `js/data/akademie_data.js` |
| Akademie API | `api/akademie.js` | OAuth refresh (`GDRIVE_CLIENT_*`) lists Akademie folders/files |
| Scrape Drive | `scripts/scrape_gdrive.js` + `scrape_drive.yml` | HTML scrape of shared folders |
| Deep scout | `scripts/v9_deep_scout.py`, `v9_full_scout_run.py` | Drive API crawl → inventory |
| Portfolio populator | `scripts/v21_gdrive_portfolio_populator.py` | Drive → portfolio |
| Lightroom sync | `scripts/v20_lightroom_gdrive_sync.py` | LR ↔ Drive |
| Drive cleaner | `scripts/agent_drive_cleaner.py` | Image cleanup (dry-run default) |
| Setup OAuth | `scripts/gdrive_setup.py` | Creates `token.json` |
| Sheets | `.env.example` `GOOGLE_SHEETS_ID` + webhook | Registrations funnel |
| Image proxy | `api/image-proxy.js` | Allows `drive.google.com` hosts |

**Workspace:** Google Sheets webhook for registrations; Drive for media/portfolio. No full Google Docs/Calendar agent surface found as first-class module.

---

## 7–9. APIs, authentication, databases

### APIs (`api/`)
`akademie.js`, `flowee.js`, `image-proxy.js`, `kitchen-sync.js`, `payments.js`, `register-event.js`, `registrations.js`, `roll.js`, `verify-session.js`, `whatsapp.js`

### Auth
- Supabase Auth (web) via `js/agents/supabase_client.js`, Soul Pass / Dice
- Admin: `ADMIN_API_KEY`, `ADMIN_OPS_CODE`, `MEMBERSHIP_ADMIN_PASSWORD`
- Drive: OAuth client + refresh **or** service account (CI)
- WhatsApp Cloud API tokens
- Stripe session verify

### Database
- **Supabase PostgreSQL** project referenced as `agkmbaephgsnunlarntm`
- SQL under `sql/` (33 files) + `supabase_migrations/` (incl. `gdrive_artists.sql`)
- Tables/patterns: event registrations, bookings, membership, kitchen/triad pipelines, gdrive artists schema

---

## 10–12. Media tools, FFmpeg, AI/vision

| Capability | Where |
|------------|--------|
| FFmpeg encode/proxy | ~93 scripts under `scripts/` + Botanica runners + Lapa71/Destiny pipelines |
| OpenCV face | `organize_artists_face.py`, `destiny_*_face_assign.py`, `v30_c4c_face_classifier.py` |
| Audio / ears | `v11_audio_scout.py` (librosa), `v7_audio_alchemist.py`, `scripts/content_pipeline/ears.py` |
| Gemini | `api/flowee.js`, `scripts/agent_studio_gemini.py` |
| Vision kurators | `v24`–`v26_vision_kurator.py`, `v10_vision_*`, `vision_local_agent.py` |
| Whisper | Referenced as placeholder/optional in archive/vision scripts |
| Local outputs | `EXPORT/`, `DRIVE_UPLOAD/`, `01_AGENT_PROCESSING/Ready_To_Post`, `Premium_Cuts`, `D:\Wakungo_Content_Studio\…` |

---

## 13–17. Scripts, env, logging, jobs, outputs

- **Scripts:** Broad `scripts/` library (event pipelines: Lapa71, Hanna & Mr Isaac, Homecoming Elisa, July17, Wakungo, Botanica, C4C, Destiny Hostel, DCIM).
- **Env:** `.env.example` + Vercel env; local `credentials.json`.
- **Logging:** Mostly stdout/`print`/`console.log`; some `ANALYSIS/*.json` plan logs; `beta_log_overlay.js` / chronicler-style web agents; no central job queue product.
- **Task/job systems:** GitHub Actions cron (gdrive-sync weekly); local one-shot Python/PS1; no Celery/RQ found.
- **Output folders (conventions):**  
  `EXPORT/`, `DRIVE_UPLOAD/`, `ANALYSIS/`, `00_work/`, `01_AGENT_PROCESSING/{Ready_To_Post,Premium_Cuts,…}`, `D:\Wakungo_Content_Studio\`, `D:\KissYourHeart\`, `Assets/gdrive_sync`.

---

## 18–20. Artist / event / membership-content infrastructure

### Artist logic
- Drive Content Pipeline `Artists/` (28) — Arpan schema
- Botanica numbered ARTISTS pack (10) with `00_REF` — **this phase’s reference source**
- `artist_seed.json`, face organize, intake_sort name/ears routing
- Web: `js/agents/artist_profile_sync.js`, Akademie artist chapters

### Event logic
- `js/agents/event_agent.js`, `event_scout.js`, `event_rpg_logic.js`
- `api/register-event.js`, Lapa71 registration pages
- Event pipelines on D: (Botanica, Destiny, meetups)

### Membership / content
- Membership pages + admin password gate
- Stripe checkout / roll / verify-session
- Content embed roadmap in `CIRCLE_D_FLOW_PHASE0.md` (web Phase 0 ≠ this Content Pipeline Phase 1)
- Portfolio + Akademie as public content surfaces fed from Drive

---

## A–H Summary (required)

### A. Existing agents
- **142** `js/agents/*` runtime agents  
- **100+** `scripts/` content/Drive/vision/pipeline agents (versioned `v6`–`v31`, named `agent_*`, event PS1 pipelines)  
- Botanica + `content_pipeline` ears/intake  
- `01_AGENT_PROCESSING` video/premium agents  
- Registry file enumerates **274** entries with Drive/media/render flags  

### B. Existing integrations
- Google Drive (OAuth + service account CI)  
- Google Sheets webhook  
- Supabase  
- Stripe  
- WhatsApp Cloud API  
- Gemini (Flowee / studio helper)  
- Adobe token file present  
- Vercel deploy  

### C. Existing media tools
- FFmpeg/ffprobe (dominant)  
- OpenCV face cascades  
- librosa (limited)  
- PIL/numpy in various scripts  
- Local proxy/encode pipelines (Lapa71, Destiny, Botanica)  

### D. Existing Google Drive functionality
- Sync Akademie → `akademie_data.js`  
- API listing for Akademie pages  
- Scouts / portfolio populators / cleaners  
- Shared Content Pipeline tree + Botanica ARTISTS pack with refs  
- Thumbnail/proxy via Drive URLs + `image-proxy`  

### E. Existing reusable components
- Arpan artist folder schema (events / Flow Talk / Stages / Akademie / beat)  
- Botanica `00_REF` + `artist.json` pack pattern  
- Face-sort + ears intake (extend, don’t replace)  
- Format rules in `.cursor/rules/content-pipeline.mdc`  
- CI Drive sync pattern  
- ANALYSIS plan JSON convention  

### F. Missing functionality
- No single orchestrator that: watches Drive uploads → ears+refs → sorts into Content Pipeline Artists **and** creates Drive folders via API  
- No authorized Drive API token in this cloud environment (`token.json` absent)  
- No unified agent registry before this phase (`pipeline/config/` is new discovery output)  
- Weak speech transcription “ears” (heuristics/ffmpeg only; whisper optional/unwired)  
- Botanica pack artists not yet merged into Content Pipeline `Artists/` (28) as first-class shared folders  
- Several Botanica refs missing face images (Noua, Silso, Mistah Isaac, Edo)  

### G. Potential conflicts
- **Two ARTISTS trees:** Content Pipeline Artists (`1OLOk…`) vs Botanica pack (`1Ss3…`) — different IDs, overlapping names (Wako, Edo/Isaac)  
- Akademie sync parent `1dvi9…` is a third Drive root — do not overwrite  
- Face-sort previously risked clearing local ARTISTS when Wako folder missing  
- Many versioned agents overlap (shorts/kurator/aftermovie) — risk of duplicate renders if run together  
- Local `D:\` FAT32 limits vs NTFS encode policy  

### H. Recommended next step
**Phase 2 (after approval):** Reuse existing components only — wire a thin **orchestrator config** (not a replacement agent) that:
1. Treats Botanica pack (`1Ss3…`) `00_REF` + `artist.json` as authority for lineup identity  
2. Maps/creates counterparts under Content Pipeline `Artists/` using **Arpan schema** (API, with credentials)  
3. Calls existing `ears.py` + `organize_artists_face.py` / intake_sort for new uploads  
4. Never downloads full trees; selective proxies only  

---

## STOP

Phase 1 infrastructure discovery is complete.  
Awaiting approval before Phase 2 (orchestration / Drive folder create / any render).
