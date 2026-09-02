# KISS_YOUR_HEART_ARCHITECTURE

**Brand:** Kiss Your Heart — Creative Project Management Studio  
**Stack:** Circle D Flow Web (Vanilla HTML / CSS / JS + Supabase + Vercel)  
**Storage:** `D:\KissYourHeart\` (local master) + `Assets/kyh/` (deploy mirror)  
**Guide:** Flowee (`js/agents/flowee.js` + `js/agents/flowee_kyh_guide.js`)

---

## 1. Information Architecture

```
/                           → pages/kyh/index.html (homepage, Phase 2)
/kyh                        → redirect
/create                     → pages/kyh/create/index.html
/create/project-builder     → pages/kyh/create/project-builder.html
/journey                    → pages/kyh/journey.html
/experiences                → pages/kyh/experiences/index.html
/experiences/[slug]         → pages/kyh/experiences/detail.html?slug=
/support                    → pages/kyh/support.html
/spaces                     → pages/kyh/spaces.html
/services                   → pages/kyh/services/index.html
/about                      → pages/kyh/about.html
/contact                    → pages/kyh/contact.html
/book                       → pages/kyh/book.html (or bridge to booking.html)
/project/[id]               → future authenticated Project Room
/dashboard                  → future internal admin
```

**Primary nav:** CREATE · EXPERIENCES · JOURNEY · SUPPORT · ABOUT  
**Primary CTA:** START YOUR PROJECT  
**Secondary CTA:** BOOK A SESSION

---

## 2. User Journeys

### Path A — "I have an idea"
1. Homepage → START YOUR PROJECT
2. Project Builder (progressive questions)
3. Project Map (summary + stage + needs)
4. Recommendation (deterministic rules)
5. Book session OR Full Journey

### Path B — "I know what I need"
1. Services page → select service
2. Book directly (skip builder)

### Path C — Sponsor
1. SUPPORT page → BECOME A SPONSOR
2. Lead form → Supabase `leads` (Phase 8)

### Path D — Venue / Supported Space
1. SPACES page → join ecosystem
2. Lead form → matching pipeline (future)

### Path E — Discover credibility
1. EXPERIENCES → case study storytelling
2. JOURNEY → methodology
3. ABOUT → philosophy (not CV)

---

## 3. Six-Stage Journey (Canonical)

| Stage | Key | Question |
|-------|-----|----------|
| 01 | FEEL | What is in your heart? |
| 02 | SHAPE | What does your idea need? |
| 03 | CONNECT | Who needs to be involved? |
| 04 | BUILD | How do we make it happen? |
| 05 | EXPERIENCE | What should people experience? |
| 06 | SHARE | What remains after the experience? |

**UI component:** `js/kyh/kyh-stages.js` renders progress rail + stage states (`done`, `active`, `pending`).

**Never use alternate stage names** in code or copy.

---

## 4. Project Builder (Phase 3)

Progressive disclosure — one meaningful step at a time.

### Steps
1. What are you creating? (project types — multi-select)
2. Tell us what's in your heart (free text)
3. What do you already have? (resources)
4. What do you need? (needs taxonomy)
5. Where? (Lisbon default)
6. When? (date flexibility)
7. How far along? (maturity)
8. What would success look like? (free text)

### State
Stored in `sessionStorage` as `kyh_project_draft` until submission.

### Output
Navigates to Project Map with computed:
- Current stage (FEEL / SHAPE / CONNECT / …)
- Has / needs lists
- Recommended next step

---

## 5. Recommendation Engine (Phase 4)

**Location:** `js/kyh/recommendations.js`  
**Type:** Deterministic rules (V1) — AI replaceable later

```javascript
// Examples
if (stage === 'FEEL') → VISION_SESSION
if (stage === 'SHAPE') → PROJECT_DEVELOPMENT
if (stage === 'CONNECT' && !hasVenue) → VENUE + CONNECTION_SUPPORT
if (stage === 'BUILD') → PRODUCTION | PROJECT_MANAGEMENT
if (needs.includes('FULL_PROJECT_MANAGEMENT')) → FULL_JOURNEY
if (needs.includes('SPONSORS')) → SPONSOR_STRATEGY
```

Returns `{ serviceId, title, description, ctaLabel, ctaHref }`.

---

## 6. Booking

**V1:** Links to `pages/kyh/book.html` or existing `pages/booking.html` with query params (`?service=vision-session`).

**Architecture:** No hard-coded Calendly/Stripe in business logic. Payment via existing `api/create-checkout.js` when needed.

**Services (initial):**
- Vision Session
- Project Development Session
- Creative Consultation
- Sponsor Strategy
- Production Consultation
- Full Journey (FEEL through SHARE)

---

## 7. Data Model (Future Supabase — Phase 8)

```
users           → auth.users + profiles
projects        → id, title, description, projectType[], location, dateFlex, stage, status, vision, audience, budget, createdAt
project_needs   → projectId, need (enum)
project_resources → projectId, resource (enum)
artists         → profile-linked
venues          → lisbon_venues.js → DB migration
sponsors        → org, interests
partners        → org, type
services        → slug, title, description, priceTier
bookings        → extends existing bookings table
experiences     → case study content
leads           → name, email, org, category, message, projectId?, createdAt
tasks           → projectId, title, owner, deadline, status
team_members    → projectId, userId, role
files           → projectId, storagePath (D: or Supabase Storage)
```

**Stage enum:** `FEEL | SHAPE | CONNECT | BUILD | EXPERIENCE | SHARE`  
**Project types:** `EXHIBITION | WORKSHOP | CONCERT | …` (see Master Prompt §31)  
**Needs:** `VISION | PROJECT_STRUCTURE | ARTISTS | VENUE | …` (see Master Prompt §32)

---

## 8. Project Room (Phase 9 — Future)

Authenticated workspace at `/project/[id]`:

- Overview with stage rail
- Timeline, tasks, team, artists, venue, sponsors
- Budget, files, communication, documentation
- Next action card (owner + deadline)

Reuse Supabase RLS: `auth.uid()` = project owner or team member.

---

## 9. Network / Matching (Phase 10 — Future)

```
PROJECT → needs[] → MATCHING ENGINE → artists | venues | sponsors | partners
```

Data model prepared in Phase 8. No matching UI in V1.

---

## 10. Flowee Integration

| Module | Role |
|--------|------|
| `flowee.js` | Core agent UI + dialogueMatrix entries for `kyh/*` pages |
| `flowee_kyh_guide.js` | Stage-aware hints, Project Builder coaching (Phase 3) |

**Tone on KYH pages:** Warm, creative, guiding — not gamified "Drifter" language.

**Boot sequence:** On KYH shell load → Flowee introduces journey → context hints on scroll / step change.

---

## 11. Storage Architecture (D: Drive)

```
D:\KissYourHeart\
├── public\
│   ├── brand\          ← logo, seal, typography refs
│   ├── artists\        ← artist media (symlink from pipeline)
│   ├── locations\      ← venue photos
│   ├── projects\       ← project assets
│   └── experiences\    ← case study media
├── data\
│   ├── experiences.json
│   ├── services.json
│   └── venues.json
└── README.md
```

**Config:** `js/kyh/kyh-config.js`

```javascript
window.KYH_CONFIG = {
  storageRoot: 'D:/KissYourHeart',
  mediaBase: '../Assets/kyh',  // web-relative fallback
  brandLogo: '../Assets/kyh/brand/kiss-your-heart-logo.png',
  floweeEnabled: true
};
```

Local dev can load JSON from `D:/KissYourHeart/data/` via fetch when running file server with CORS, or embed from repo in V1.

---

## 12. Design System (Phase 1)

**File:** `css/kyh-design-system.css`

| Token | Value | Use |
|-------|-------|-----|
| `--kyh-bg` | `#0a0908` | Page background |
| `--kyh-bg-elevated` | `#121010` | Panels |
| `--kyh-ivory` | `#f3ece0` | Primary text |
| `--kyh-gold` | `#c9a962` | Accent (logo-inspired) |
| `--kyh-gold-soft` | `rgba(201,169,98,0.25)` | Borders, glow |
| `--kyh-earth` | `#6b5d4f` | Secondary neutral |
| `--kyh-muted` | `#9a9082` | Supporting text |

**Display font:** Cormorant Garamond  
**UI font:** Plus Jakarta Sans

**Components:** `.kyh-btn`, `.kyh-nav`, `.kyh-footer`, `.kyh-stage-rail`, `.kyh-editorial`, `.kyh-img-frame`, `.kyh-reveal`

**Motion:** `js/kyh/kyh-motion.js` — IntersectionObserver reveals; respects `prefers-reduced-motion`.

---

## 13. Internationalization (Future)

Use `data-i18n` keys + `js/kyh/i18n/kyh-en.js` pattern. Primary V1 language: English. Do not hard-code strings in business logic files.

---

## 14. Analytics Events (Future)

`project_builder_started`, `project_map_generated`, `booking_started`, `sponsor_interest`, `experience_opened`, `cta_clicked` — privacy-conscious, opt-in.

---

## 15. File Structure (Implementation)

```
circle-d-flow-web/
├── Assets/kyh/brand/
├── css/kyh-design-system.css
├── js/kyh/
│   ├── kyh-config.js
│   ├── kyh-shell.js
│   ├── kyh-motion.js
│   ├── kyh-stages.js
│   └── recommendations.js      (Phase 4)
├── js/agents/flowee_kyh_guide.js
├── pages/kyh/
│   ├── index.html              (Phase 1 shell → Phase 2 homepage)
│   ├── journey.html            (Phase 2+)
│   ├── create/
│   └── experiences/
├── PROJECT_AUDIT.md
└── KISS_YOUR_HEART_ARCHITECTURE.md

D:\KissYourHeart\               (media master)
```

---

## 16. Phase Map

```
PHASE 1  Brand + design system + shell     ← CURRENT
PHASE 2  Homepage narrative
PHASE 3  Project Builder
PHASE 4  Project Map + recommendations
PHASE 5  Booking + services
PHASE 6  Experiences
PHASE 7  Sponsors + Spaces
PHASE 8  Supabase + leads
PHASE 9  Project Room
PHASE 10 Matching / AI
```
