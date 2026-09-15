# Membership Architecture (starter)

## Product tiers (target)

| Tier | Price | Code |
|------|-------|------|
| Registered / Free | €0 | `registered` |
| Flow Supporter | €5/mo | `flow_supporter` |
| Flow Crew | €15/mo | `flow_crew` |

Event benefits are **per-event flags**, not hard-coded into the tier.

## Digital card (Phase 5 — now)

**Route:** `/member-card` → `pages/member_card.html`  
**Brand:** Wako Kungo Membership Card (front/back assets in `assets/membership/`)  
**Guide:** Flowee member-card coach  
**XP:** Reads `profiles.exp` when authenticated; awards local + soft profile bump on first claim when possible  
**QR:** Encodes share URL `/member-card?ref=…` for check-in / share

## Planned tables (not applied yet — await approval)

```
membership_tiers (id, code, price_cents, interval, active)
memberships (user_id, tier_id, status, provider, provider_ref, source)
member_cards (user_id, display_name, public_id, qr_payload, issued_at)
```

Payment provider abstracted (`stripe` | `patreon` | `manual`).

## Existing to reuse

- `pages/membership.html` — legacy hunter tiers (migrate copy to €5/€15)  
- Stripe routers in `api/payments.js`  
- `profiles.exp` for RPG fit  
- Lapa71 success → invite to card / crew
