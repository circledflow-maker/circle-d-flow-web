# Member Card + CDF finalize pass — 2026-10-11

## Goals
Close claim/Orbit correctness gaps, wire yearly billing, harden admin auth, lighten member-card load.

## Changes

| Area | Fix |
|------|-----|
| Claim gate | `hasClaimedCard()` — never mark claimed from `displayName` alone |
| Claim API | Stamp `claimed` / `claimedAt` only after success (or intentional local draft) |
| QR | Encodes `/member-card?ref=…` share URL (not Instagram stub) |
| Deep links | `/events/:slug`, `/locations/:slug`, `?view=` require session + claim; `?preview=1` peeks Orbit |
| Paid return | Activates then opens Flow Orbit |
| Yearly billing | Checkout honors `interval: year` (€50 / €100) |
| Admin | `FlowCreator!` only when no env + non-prod; query `adminKey` blocked in production |
| Perf | Defer supabase; no back-face preload; skip double client init; cache bust |
| Links | Sanctuary → `/sanctuary`; policy → `/membership#mp-policy` |

## Verify on Vercel

1. Fresh guest → Register → Claim → Orbit opens  
2. Login with name but no `member_card_public_id` → Claim step (not Orbit)  
3. Flip card → QR opens share URL with `ref` / `m`  
4. `/membership` Yearly → Stripe shows yearly amount  
5. `/events/demo?preview=1` → Orbit preview  
6. `/events/demo` logged-out → Login gate  

## Still open (P2+)

- Unify EXP local vs `profiles.exp`  
- Opportunity / artist matching  
- Analytics events  
- Partner redeem RLS hardening  
