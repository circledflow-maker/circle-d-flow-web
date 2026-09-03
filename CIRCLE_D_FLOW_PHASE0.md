# Circle D Flow — Phase 0 / Sprint 0

**Last updated:** 3 September 2026  
**Scope:** System foundation before feature phases (web, gamification, content)

Phase 0 is **not** new UI — it is audit, storage, env gates, and one reliable path to production.

---

## 1. Decision record

| Item | Decision |
|------|----------|
| Main codebase | `D:\circle-d-flow-web\` |
| Legacy dashboard | `D:\circle-d-flow-dashboard\` — archive only, do not extend |
| KYH studio | Standalone module `/pages/kyh/` — linked from CDF Orbit **HEART** |
| Deploy | Vercel static + serverless `api/` |
| Database | Supabase `agkmbaephgsnunlarntm` |
| Heavy media | D: (`Wakungo_Content_Studio`, `KissYourHeart`, `CircleDFlow`) |

---

## 2. Phase 0 checklist

### Done

- [x] Hardware + storage audit (C: temp, D: FAT32, single encode lane)
- [x] `PROJECT_AUDIT.md` + KYH architecture docs
- [x] Supabase client config (`js/cdf_runtime_config.js`)
- [x] Lapa71 registration flow + API (`/pages/lapa71_register`, `/api/register-event`)
- [x] Admin registrations (`/pages/admin_registrations`, `/api/admin-registrations`)
- [x] Flowee on landing + join coaching
- [x] `vercel.json` cleanUrls + KYH redirects
- [x] KYH Phase 1–4 shell (separate product lane)
- [x] Pipeline C: cleanup script (`scripts/pipeline_c_cleanup.ps1`)
- [x] D: master folders (`CircleDFlow`, `KissYourHeart`, `Wakungo_Content_Studio`)

### In progress

- [ ] Lapa71 video Part 3 — proxies **1507–1510** (encode running)
- [ ] Vercel production deploy — push `main`, confirm `/kyh` live

### Blocked — needs you

| # | Need | Why |
|---|------|-----|
| 1 | **Vercel env vars** (Production) | `SUPABASE_URL` = `https://agkmbaephgsnunlarntm.supabase.co` (no `/rest/v1`) |
| 2 | **`SUPABASE_SERVICE_ROLE_KEY`** | API routes (register, admin, roll) |
| 3 | **`ADMIN_API_KEY`** | `/admin/registrations` |
| 4 | **`STRIPE_SECRET_KEY`** | Dice checkout, marketplace, support payments |
| 5 | **`RESEND_API_KEY`** | Guest welcome + KYH feedback invite emails |
| 6 | **`WHATSAPP_ACCESS_TOKEN`** | Flowee WhatsApp lane (optional Phase 0) |
| 7 | **Manual smoke test** | Submit real row on `/pages/lapa71_register` → verify admin UI |
| 8 | **Vercel Hobby limit** | ~~15 API files~~ → **9 functions** after merge (Option B done) |

---

## 3. Storage map (D:)

```
D:\
├── circle-d-flow-web\          Git repo — deploy source
├── CircleDFlow\                CDF content master (this doc's parent)
├── KissYourHeart\              KYH media + data master
└── Wakungo_Content_Studio\
    └── Lapa71\                 Proxies, Stages cuts, artist folders
```

**C: policy:** Encode temp → copy to D: → delete temp (`pipeline_c_cleanup.ps1`).

---

## 4. Agent / resource rules (i5, 16 GB)

| Lane | Max parallel | Agent |
|------|----------------|-------|
| Video encode | **1** ffmpeg | `lapa71_tagus_pipeline.py` |
| Web / Phase 0 | light | Cursor + static edits |
| Face-ID | with encode only | same python process |

Never run two SD encodes + heavy 3D page build simultaneously.

---

## 5. Phase map after Phase 0

| Phase | Circle D Flow web | Status |
|-------|-------------------|--------|
| **0** | Gates + storage + deploy | ✅ Done |
| **1** | Orbit → worlds stable, HEART → KYH gateway | ✅ Done |
| **2** | Quest triad polish (map, board, legends) | Next |
| **3** | Bazaar checkout + `Gamification.spendTokens` | Planned |
| **4** | Join / membership unified (beyond Lapa71) | Planned |
| **5** | Supabase projects + leads (shared with KYH Phase 8) | Planned |
| **6** | Content embed (Stages cuts from D: → Experiences) | Planned |

KYH has its own phase map in `KISS_YOUR_HEART_ARCHITECTURE.md`.

---

## 6. Health check

```powershell
cd D:\circle-d-flow-web
.\scripts\cdf_phase0_check.ps1
```

---

## 7. What to send me next

Reply with any of:

1. Confirmation Vercel env vars are set (yes/no per key — **not** the secret values in chat if you prefer; paste key **names** only).
2. Stripe live vs test mode intent.
3. Priority after Phase 0 gate: **CDF Orbit** vs **Bazaar** vs **KYH Supabase**.
4. OK to **merge API routes** (15→10) for Hobby deploy.

Then I continue Phase 1 without blocking on secrets you haven't configured yet.
