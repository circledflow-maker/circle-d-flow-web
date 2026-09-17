# Membership · Flow Orbit Architecture

## Product idea

Not a static member page — a **digital Member Card + swipeable Flow Orbit**.

After claim, `/member-card` becomes a horizontal **card stack**:

`MEMBER → EVENT(s) → BENEFIT(s) → PARTNER(s) → LOCATION → PROFILE → SAVED`

Same data powers **Admin Flow Control** (`/admin/membership` · alias `/admin/flow`).

## Routes

| Route | Role |
|-------|------|
| `/member-card` | Claim flow + Flow Orbit |
| `/member-card?view=events` | Jump to first event card |
| `/member-card?event=slug` | Deep link event |
| `/member-card?location=lapa71` | Deep link location |
| `/events/:slug` | Rewrites into member-card deep link |
| `/locations/:slug` | Rewrites into member-card deep link |
| `/admin/membership` | Flow Control |
| `/admin/flow` | Alias → Flow Control |
| `/heart` · `/admin` · `/welt-heart` | **Welt Heart** → same Flow Control |
| `/heart-world` | Legacy Heart World tools (`pages/heart.html`) |
| `/api/member-orbit` | Feed + saves |
| `/api/admin-membership` | Admin CRUD |
| `/api/claim-member-card` | Claim + coupon grants |

## Member UX

1. **Claim** (Flowee-guided swipe) — existing steps
2. **Orbit** — interactive cards, bottom dock: Card · Flow · Saved · Me
3. Gestures: horizontal = next card · vertical up = details · tap = action
4. Flowee lines are short & contextual (“Welcome back. Your next Flow is waiting.”)

## Admin · Flow Control

Tabs: Members · Events · Locations · Partners · Coupons · **Live Feed**

Create Event → `show_in_feed` → appears automatically in Member Orbit.

Event status: `upcoming | starting_soon | live | sold_out | completed | recap`  
(derived live when time-based).

## Data (Supabase)

```
profiles                    — card + EXP + tier
membership_partners
membership_coupons
membership_coupon_grants
flow_locations              — venues / Flow Points
flow_events                 — feed cards
flow_saves                  — My Flow (event|benefit|location|partner)
```

SQL: `sql/flow_orbit.sql` (+ applied migration `flow_orbit_events_locations_saves`)

## Files

- `pages/member_card.html` + `js/member_card.js` + `js/flow_orbit.js` + `css/member_card.css`
- `pages/admin_membership.html`
- `lib/cdf-api/flow-orbit.js` · `member-orbit.js` · `admin-membership.js` · `claim-member-card.js`

## Tiers (unchanged)

| Tier | Code |
|------|------|
| Registered / Free | `registered` |
| Flow Supporter €5 | `flow_supporter` |
| Flow Crew €10 | `flow_crew` |

## Post-registration path (Phase 1)

```
Register → Member Card offer (Free/€5/€10) → Flowee interface tutorial → 3D Artist Sanctuary
```

- Sanctuary dock: **Circle D Flow logo** = master control → expands tools vertically
- Password-gated (construction): Vision · Akademiy · Marketplace — password `FlowComing`
- Vault shows / edits member card + benefits
- **Membership tier ≠ Artist status** (Artist via Flow Pool pipeline)

## Flow Pool visibility (decision)

**Model C — Hybrid (recommended)**

- Public: curated Artist Cards (selected / Confirmed artists who opt in)
- Members: Pool discovery, availability, opportunity alerts
- Admin: full matchmaking + Applicant → Confirmed pipeline
- Artists control visibility: `public | members | matchmaking_only`

Artist status ladder (separate from tier):

`REGISTERED → APPLICANT → POOL → MATCHED → INTERESTED → CONNECTED → CONFIRMED → PARTICIPANT → ARTIST/CREATIVE`

## Information hierarchy

```
CIRCLE D FLOW
  DISCOVER · CONNECT · CREATE · ARCHIVE · SUPPORT · PROFILE
```

Product names (Sanctuary, Flowee, Flow Pool, …) live under these six pillars.
