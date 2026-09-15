# Circle D Flow — System Audit

**Date:** 15 September 2026  
**Scope:** Phase 1 inspection before membership architecture  
**Stack:** Vanilla HTML/CSS/JS · Vercel serverless · Supabase Auth + Postgres

---

## 1. Current architecture

| Layer | Reality |
|-------|---------|
| Frontend | Static pages under `/pages`, root `index.html`, `beta-initiation.html`, `dice.html` |
| Design | Animus / cinematic CSS; many pages also Tailwind CDN |
| Backend | `api/*.js` → `lib/cdf-api/*` (Hobby-consolidated via `api/registrations.js`, `api/payments.js`) |
| Auth | Supabase Auth (`js/agents/supabase_client.js`, `js/auth-handler.js`) |
| Deploy | Vercel `cleanUrls` + redirects in `vercel.json` |
| Media | Heavy content on D: (`Wakungo_Content_Studio`, etc.) — not in repo |

---

## 2. Current user journey (as implemented)

1. Land on Orbit / beta-initiation / event QR  
2. Optional Resonance / Class (`beta-initiation.html`)  
3. Auth (signup/login) or event registration without forcing login  
4. Event form (Lapa71 / create_impact / dice)  
5. Success CTAs → Sanctuary / Bantaba / Login  
6. RPG XP via QuestEngine → `profiles.exp` (+ localStorage mirrors)  
7. Membership page exists (`pages/membership.html`) but is a **client stub** (confirm + localStorage), not Stripe subscription

---

## 3. Registration flows

| Form | Entry | API | Store |
|------|-------|-----|--------|
| Lapa71 Member & Jam | `/join` → `pages/lapa71_register.html` | `POST /api/register-event` | `event_registrations` + shadow profile |
| Circle D Flow Event guest | `pages/create_impact.html` | `POST /api/register-guest` | `user_rolls` (+ email QR) |
| Chris Listening Party / Dice | `dice.html` (`eventId`, e.g. `listening-party-june-2`, `criz`) | `/api/roll`, payment intents | `user_rolls` / Stripe session |

Flowee coaching: `js/agents/flowee_join_guide.js` on Lapa71.

---

## 4. Event flows

- Event-specific pages + `create_impact?id=`  
- Dice protocol for paid / roll entry  
- Lapa71 deep jam registration (`sql/event_registrations_lapa71.sql`)  
- Admin: `/admin/registrations` + `x-admin-key`

---

## 5. Authentication

- Supabase session in browser  
- Register → beta-initiation; Login → dashboard / photographer hub by `flow_class`  
- Lapa71 can create **shadow** Auth users (random password) + `profiles` upsert — claim via Login not fully productized

---

## 6. Supabase structure (relevant)

- `profiles` — `exp`, `karma`, `level`, `flow_credits`, identity fields  
- `event_registrations` — Lapa71  
- `guest_registrations` / `user_rolls` — guests & dice  
- Quests / kitchen / artists tables exist separately  
- **No** first-class `memberships` / `membership_tiers` tables in production use yet

---

## 7. Admin

- `pages/admin_registrations.html` — list/patch Lapa71 registrations  
- Key-gated API — not full member/XP admin yet

---

## 8. Flowee

- Core: `js/agents/flowee.js` + many domain guides  
- Join: field-by-field coaching  
- Should stay concise; extend for membership card (not a free chatbot)

---

## 9. Orbit

- Cinematic orbit / horizon bar / initiation orbit  
- RPG `pages/dashboard.html` is empty; `/dashboard` redirects to **KYH** dashboard — known debt  
- Soul Pass (`js/agents/soul_pass.js`) shows EXP/karma — closest to “digital ID”

---

## 10. RPG / XP

- **Primary:** `profiles.exp` via QuestEngine + `POINTS_SYNCED`  
- **Secondary:** `js/gamification.js` localStorage (`user_gamification_data`)  
- Naming drift: historical `xp` vs live `exp`

---

## 11. Issues / inconsistencies

- Membership UI tiers ≠ product tiers in master prompt (€5 / €15)  
- No `/membership` vercel route  
- No digital Wako Kungo card  
- Post-registration does not invite Flow Crew  
- Dual XP stores  
- Empty RPG dashboard vs KYH `/dashboard`  
- Shadow profiles without clear claim email flow

---

## 12. Duplicate systems

- `api/register-event.js` vs `lib/cdf-api/register-event.js` (live via registrations router)  
- Multiple gamification modules  
- Many Flowee variants

---

## 13. Reusable components

- Join form + FloweeJoinGuide pattern  
- Registrations API consolidation  
- Stripe payment router (events/support) — reusable later for subscriptions  
- Soul Pass / EXP display patterns  
- Admin key gate pattern

---

## 14. Technical debt

- Tailwind CDN on production pages  
- Client-only membership upgrades  
- RLS must be reviewed before member benefits API  
- Vercel Hobby function limits — keep APIs consolidated

---

## 15. Recommended sequence (aligned with master prompt)

| Phase | Action | Status |
|-------|--------|--------|
| 1 | Audit docs | **This file** |
| 2 | Map registration architecture | Done in audit |
| 3 | Soft identity link (email / shadow claim) | Next |
| 4 | Post-registration invitation CTA | **In progress with card** |
| 5 | Membership card UI + `/membership` routes | **In progress** |
| 6 | Direct membership page (tiers €0/€5/€15) | After card |
| 7 | Payment provider (Stripe subscriptions) | After approval |
| 8 | Server-side benefits + partners | Later |
| 9 | Orbit connection / XP awards on card claim | With card (soft) |
| 10+ | Events entity model, analytics, security audit | Phase 0 continuation |

**Do not** implement Patreon/Stripe subscriptions until card + identity path are validated.
