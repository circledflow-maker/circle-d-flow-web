# PROJECT_AUDIT — Kiss Your Heart × Circle D Flow Web

**Date:** 2 September 2026  
**Scope:** Repository audit before building Kiss Your Heart — Creative Project Management Studio  
**Decision:** Extend existing **Vanilla HTML / CSS / JavaScript** stack — not Next.js (per user directive to reuse Circle D Flow web)

---

## 1. Current Architecture

| Layer | Technology | Location |
|-------|------------|----------|
| Frontend | Vanilla HTML5, CSS3, ES modules + IIFE scripts | `pages/`, `css/`, `js/` |
| 3D / immersive | Three.js (select pages) | `js/agents/*_3d*.js` |
| Backend | Vercel serverless | `api/` |
| Local dev | `dice_server.js` (Express :3000), `npm run dev` (serve :3000) | root |
| Database | Supabase PostgreSQL | `agkmbaephgsnunlarntm.supabase.co` |
| Auth | Supabase Auth + Soul Pass / Dice entry | `js/auth-handler.js`, `js/agents/supabase_client.js` |
| Agent guide | Flowee | `js/agents/flowee.js` + specialized guides |
| Deploy | Vercel static + cleanUrls | `vercel.json` |

**Not present:** React, Next.js, TypeScript build pipeline, Tailwind build step (many pages use Tailwind CDN — migrate off for new KYH pages).

**Storage (user requirement):** Primary media/content root on **`D:\KissYourHeart\`**. Web-deployable assets mirrored under `Assets/kyh/` for Vercel.

---

## 2. Existing Reusable Components

### Design system
- `css/main-style.css` — Animus tokens (`--gold`, `--bg-dark`, holo-cards, btn-gold)
- `css/join.css` — editorial dark/gold pattern (Plus Jakarta Sans + Cinzel)
- `css/styles.css` — global utilities
- `css/event-sanctuary.css`, `css/manga-gallery.css` — storytelling layouts

### Pages (KYH-adjacent)
- `pages/kiss-your-heart.html` — existing KYH landing (photography focus, Tailwind CDN, no Flowee)
- `pages/services-*.html` — service tiers (artist, brand, wedding, community)
- `pages/booking.html` — session booking + Supabase `bookings`
- `pages/gallery.html`, `pages/portfolio_anime_reality.html` — portfolio presentation
- `pages/philosophy.html` — KyheartLx philosophy
- `pages/photographer_hub.html`, `pages/vision_studio.html` — vision ecosystem

### Stitch prototypes (reference UI)
- `stitch_circle/.../kiss_your_heart__gateway_{1-4}/` — gateway variants
- `stitch_circle/.../kiss_your_heart__client_portal_{1-5}/` — client portal
- `stitch_circle/.../kiss_your_heart__payments_*` — payments/support

### JavaScript modules
- `js/agents/flowee.js` — core agent, dialogueMatrix, talk(), chat UI
- `js/agents/flowee_photographer_journey.js` — booking/studio tour
- `js/agents/flowee_join_guide.js` — progressive form coaching pattern
- `js/gamification.js` — XP, tokens, levels
- `js/data/portfolio_data.js` — portfolio collections
- `js/data/lisbon_venues.js` — venues (Secret Garden LX, Hempy Roots, etc.)
- `js/data/coop_roles.js` — KyheartLx crew roles
- `js/heart.js` + `js/data/supabase_client.js` — Heart World profiles/events/projects
- `js/order_modal.js` — service booking UI

### API / SQL
- `api/register-guest.js`, `api/register-event.js` — lead/registration patterns
- `sql/bookings_setup.sql` — bookings table
- `sql/event_registrations_lapa71.sql` — event registration schema
- `sql/coop_collaboration.sql` — collaboration shoots

---

## 3. Existing Visual Assets

| Asset | Path | Notes |
|-------|------|-------|
| Main logo (heart/tree) | `Assets/images/logo.png` | Used across CDF + KYH |
| KYH web copy | `Assets/kyh/brand/kiss-your-heart-logo.png` | Deploy mirror |
| D: storage copy | `D:\KissYourHeart\public\brand\kiss-your-heart-logo.png` | Local master |
| Flowee avatar | `Assets/images/flowee.svg` | Guide mascot |
| Portfolio photos | `Assets/Portfolio/{Artist,Event,Realm,Nature}/` | Real project material |
| Secret Garden BGs | `Assets/images/secret_garden/bg_*.webp` | Venue atmosphere |
| IG campaign | `Assets/IG_30_Days/` | KYH social content + captions |
| Adinkra symbols | `Assets/svgs/adinkra_defs.svg` | Cultural visual language |

**Do not invent:** Artists, venues, and projects exist in `portfolio_data.js`, `lisbon_venues.js`, `akademie_data.js`, Lapa71 pipeline output on `D:\Wakungo_Content_Studio\Lapa71\`.

---

## 4. Existing Content

### Documentation
- `Docs/💜 KISS YOUR HEART — Project Summary.md` — founder story, pillars, Lisbon venues, flow philosophy

### Brand aliases in code
- **KyheartLx**, **KissYourHeartLx**, **KYHeart** — used in coop, philosophy, venues level unlock

### Real venues referenced
- Secret Garden LX, Hempy Roots, Outbreak Music, AkwabaLX, Village Underground, Fábrica Braço de Prata

### Real artists / crew
- KyheartLx (Hope), Naru, C-riz, Lapa71 artists (from content pipeline)

### Gap vs new product spec
Current site positions KYH as **photography + flow culture**. New spec expands to **Creative Project Management Studio** with six-stage journey, Project Builder, sponsors, supported spaces. Existing pages are foundation — not the full product.

---

## 5. Missing Functionality (vs Master Prompt)

| Feature | Status |
|---------|--------|
| Six-stage journey UI (FEEL→SHARE) | Missing — Phase 1 adds visual language |
| Project Builder (progressive) | Missing — Phase 3 |
| Project Map + recommendation engine | Missing — Phase 4 |
| Booking (Vision / Full Journey) | Partial — `booking.html` exists, needs KYH services |
| Experiences index + case study pages | Partial — portfolio exists, needs story structure |
| Sponsor / Supported Spaces flows | Missing — Phase 7 |
| Project Room (auth workspace) | Missing — Phase 9 |
| Matching / AI recommendations | Missing — Phase 10 |
| i18n (EN/PT/DE/FR) | Partial — `js/translations.js` exists |
| Dedicated KYH routing | Missing — added in Phase 1 |
| Flowee on KYH pages | Missing — added in Phase 1 |

---

## 6. Technical Risks

1. **Tailwind CDN on legacy pages** — performance + consistency; new KYH uses pure CSS (`css/kyh-design-system.css`).
2. **D: drive not web-served on Vercel** — use `kyh-config.js` abstraction: D: for local heavy media, `Assets/kyh/` for deploy.
3. **FAT32 on D:** — large video masters must stay in pipeline folders; web assets only.
4. **Supabase RLS** — new `projects`, `leads` tables need migrations before Phase 8.
5. **Flowee dialogueMatrix size** — extend via `flowee_kyh_guide.js` rather than bloating core file.
6. **Brand drift** — CDF gamification (XP, dice) vs KYH professional studio tone; keep KYH path visually distinct but share Flowee + Supabase infra.
7. **No test runner** — vanilla stack lacks Jest; Phase 3+ should add logic tests for recommendation engine.

---

## 7. Recommended Implementation Order

Aligned with Master Prompt, adapted for **Vanilla CDF stack**:

| Phase | Deliverable |
|-------|-------------|
| **0** | ✅ This audit + architecture doc |
| **1** | Design system + application shell (`css/kyh-design-system.css`, `pages/kyh/`, Flowee guide) |
| **2** | Homepage storytelling (`pages/kyh/index.html` → full homepage) |
| **3** | Project Builder (`pages/kyh/create/project-builder.html`) |
| **4** | Project Map + `js/kyh/recommendations.js` |
| **5** | Booking + services pages |
| **6** | Experiences (reuse `portfolio_data.js` + Lapa71 material) |
| **7** | Support / Sponsors / Spaces |
| **8** | Supabase schema + leads API |
| **9** | Project Room (auth) |
| **10** | Matching / AI layer |

---

## 8. Phase 1 Scope (Current Task)

Build only:

- Typography, colors, spacing, buttons
- Navigation + footer shell
- Responsive behavior + reduced motion
- Base reveal animations
- Reusable UI primitives
- Image treatment classes
- Six-stage visual language component
- Flowee as KYH guide
- D: storage structure + config abstraction

**Do not build yet:** Project Builder, homepage sections, backend, auth.
