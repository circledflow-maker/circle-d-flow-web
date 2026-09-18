# Circle D Flow — Full System Audit (updated)

**Date:** 18 September 2026  
**Principle:** Make the existing ecosystem easier to understand, participate in, operate, safer, and more valuable — not a feature dump.

---

## A. Existing system

| Layer | Reality |
|-------|---------|
| Frontend | Vanilla HTML/CSS/JS under `/pages`, Animus / Tech-Noir / Lisbon Gold |
| Backend | Vercel serverless `api/*` → `lib/cdf-api/*` |
| Auth | Supabase Auth + member card claim / shadow profiles |
| Data | Postgres (Supabase): profiles, event_registrations, memberships-related fields, orbit events/locations |
| Design agents | Flowee (+ domain guides), QuestEngine, Soul Pass, kitchens, KYH |
| Content | Heavy media on D: Wakungo Content Studio (not in repo) |

### Journey map vs routes

| Persona | Ideal path | Live routes |
|---------|------------|-------------|
| Public | Land → Discover → CTA | `/`, `/join`, `/membership`, Sanctuary, events |
| Member | Register → Card → Events → Benefits | `/member-card`, `/membership`, Orbit views |
| Artist | Register → Pool → Invite | `/pages/artist_registration.html`, Sanctuary |
| Admin | Unlock → Today → Manage | `/admin`, `/heart`, `/admin/registrations` |

---

## B. Working well (preserve)

- Member Card claim + EXP (+25) path is usable now
- `/membership` cinematic intro + plans + DATEV/Q&A copy
- Stripe membership checkout + activate hooks
- Flow Control admin (members / events / locations / invite)
- Flowee as guide (not free chatbot)
- Lapa71 join + registrations pipeline

---

## C. UX problems (friction)

| ID | Issue | Priority |
|----|-------|----------|
| UX1 | Language gate fired cinematic on first tap — needs select + Confirm | P1 — fixed this pass |
| UX2 | Many worlds / pages; first 5s “what is CDF?” still uneven on root | P1 |
| UX3 | Artist pool ≠ opportunity matching UI | P2 |
| UX4 | Event pages feel like records more than interactive experiences | P2 |
| UX5 | Competing CTAs on some hubs | P2 |

---

## D. Technical problems

| ID | Issue | Priority |
|----|-------|----------|
| T1 | Dual XP stores (`profiles.exp` vs local gamification) | P2 |
| T2 | `/dashboard` → KYH, empty RPG dashboard debt | P2 |
| T3 | Duplicate register-event entry points | P3 |
| T4 | Tailwind CDN on older pages | P3 |

---

## E. Security risks

| ID | Risk | Severity | Status |
|----|------|----------|--------|
| S1 | Hardcoded admin password in API | CRITICAL | Mitigated — password removed from UI; set `MEMBERSHIP_ADMIN_PASSWORD` on Vercel; rotate legacy |
| S2 | Admin password in HTML placeholder | HIGH | Fixed |
| S3 | `adminKey` query-string support | MEDIUM | Documented — prefer header only next |
| S4 | CORS `*` on admin routes | MEDIUM | Open |
| S5 | Shadow Auth users / claim flow | MEDIUM | Open |

---

## F. Business gaps

- Opportunity / slot system (DJ, photo, workshop…) — not first-class
- Structured artist matching for admins — partial (profiles exist, no match UI)
- Member retention loops (next event after claim) — soft CTAs only
- DATEV export automation — policy text exists; export not automated

---

## G. Mobile problems

- Admin tables need card/drawer treatment on ≤390px (partial)
- Flowee chat historically blocked taps (fixed pointer-events)
- Membership cinematic OK; plans typography improved

---

## H. Quick wins (done / doing)

1. Language → Confirm → gate disappears → cinematic  
2. PiP Stories portraits on membership intro  
3. Admin Flowee coach dock  
4. Remove password from client placeholder  
5. Env-first admin auth  
6. IG carousel for today’s post  
7. Windows script for Lapa71 ViV master edit  

---

## I. Structural improvements (next)

1. Opportunity table + admin create/match/invite statuses  
2. Event feed filters + RSVP state on member card Orbit  
3. Artist registration sections → searchable pool fields  
4. Header-only admin auth; rotate `MEMBERSHIP_ADMIN_PASSWORD`  
5. Unify EXP writes through one API  

---

## Prioritization (active)

| Pri | Item |
|-----|------|
| P0 | Admin secret hygiene (env) |
| P1 | Membership lang Confirm; member card remains primary usable surface |
| P1 | Continuity: after card / plans → Orbit / Sanctuary / events |
| P2 | Opportunities + artist matching |
| P3 | Visual polish / Tailwind migration |
