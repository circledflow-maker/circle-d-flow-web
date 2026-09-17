/**
 * Flow Orbit — shared feed helpers (Member + Admin)
 * Tables: flow_locations, flow_events, flow_saves (+ membership partners/coupons)
 */
const { listCouponsForTier } = require('./membership-coupons');

const FALLBACK_LOCATION = {
  id: 'loc_botanica',
  name: 'Botânica Lisboa',
  slug: 'botanica',
  description: 'Garden vibes · food · drinks · community flow in Lisbon.',
  address: 'Botânica, Lisbon',
  city: 'Lisbon',
  latitude: 38.718439,
  longitude: -9.148754,
  cover_image: null,
  instagram_url: 'https://www.instagram.com/wako.kungo/',
  website_url: null,
  map_url: 'https://maps.google.com/?q=Botanica+Lisbon',
  status: 'active',
  is_featured: true,
};

const FALLBACK_EVENT = {
  id: 'evt_botanica_groove',
  title: 'The Botanical Groove Session',
  slug: 'botanical-groove-session',
  description:
    'Wako Kungo presents The Botanical Groove Session — music, movement and connection at Botânica Lisboa.',
  cover_image: null,
  event_date: '2026-09-24',
  start_time: '20:00:00',
  end_time: null,
  event_type: 'concert',
  status: 'upcoming',
  visibility: 'members',
  min_membership_tier: 'registered',
  member_benefit: 'Silver+ free Wako event access · Early entry',
  cta_label: 'Save event',
  cta_url: '/join?src=botanica',
  is_featured: true,
  show_in_feed: true,
  is_active: true,
  location: FALLBACK_LOCATION,
};

function deriveEventStatus(ev) {
  if (!ev) return 'upcoming';
  const fixed = String(ev.status || '').toLowerCase();
  if (['live', 'sold_out', 'completed', 'recap'].includes(fixed)) return fixed;
  try {
    const date = String(ev.event_date || '').slice(0, 10);
    const time = String(ev.start_time || '20:00:00').slice(0, 8);
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) return fixed || 'upcoming';
    const now = Date.now();
    const diff = start.getTime() - now;
    const endMs = 3 * 60 * 60 * 1000;
    if (diff <= 0 && now - start.getTime() < endMs) return 'live';
    if (diff > 0 && diff <= 60 * 60 * 1000) return 'starting_soon';
    if (now - start.getTime() >= endMs) return fixed === 'recap' ? 'recap' : 'completed';
    return 'upcoming';
  } catch (_) {
    return fixed || 'upcoming';
  }
}

function statusLabel(status) {
  const map = {
    upcoming: 'NEXT FLOW',
    starting_soon: 'STARTING SOON',
    live: 'LIVE NOW',
    sold_out: 'SOLD OUT',
    completed: 'COMPLETED',
    recap: 'FLOW RECAP',
  };
  return map[status] || 'EVENT';
}

function mapEvent(row) {
  if (!row) return null;
  const location = row.location || row.flow_locations || null;
  const status = deriveEventStatus(row);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverImage: row.cover_image,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    eventType: row.event_type,
    status,
    statusLabel: statusLabel(status),
    visibility: row.visibility,
    minTier: row.min_membership_tier,
    memberBenefit: row.member_benefit,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    isFeatured: row.is_featured,
    showInFeed: row.show_in_feed,
    location: location
      ? {
          id: location.id,
          name: location.name,
          slug: location.slug,
          city: location.city,
          address: location.address,
          mapUrl: location.map_url,
          coverImage: location.cover_image,
        }
      : null,
  };
}

function mapLocation(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    address: row.address,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    coverImage: row.cover_image,
    instagramUrl: row.instagram_url,
    websiteUrl: row.website_url,
    mapUrl: row.map_url,
    status: row.status,
    isFeatured: row.is_featured,
  };
}

async function listLocations(db, { activeOnly = true } = {}) {
  try {
    let q = db.from('flow_locations').select('*').order('sort_order', { ascending: true });
    if (activeOnly) q = q.neq('status', 'archived');
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) return [FALLBACK_LOCATION];
    return data.map(mapLocation);
  } catch (_) {
    return [FALLBACK_LOCATION];
  }
}

async function listEvents(db, { feedOnly = true, includeInactive = false } = {}) {
  try {
    let q = db
      .from('flow_events')
      .select('*, location:flow_locations(*)')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (feedOnly) q = q.eq('show_in_feed', true);
    if (!includeInactive) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) return [mapEvent(FALLBACK_EVENT)];
    return data.map(mapEvent);
  } catch (_) {
    return [mapEvent(FALLBACK_EVENT)];
  }
}

async function getEventBySlug(db, slug) {
  try {
    const { data, error } = await db
      .from('flow_events')
      .select('*, location:flow_locations(*)')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (data) return mapEvent(data);
  } catch (_) {
    /* fallback */
  }
  if (slug === FALLBACK_EVENT.slug) return mapEvent(FALLBACK_EVENT);
  return null;
}

async function getLocationBySlug(db, slug) {
  try {
    const { data, error } = await db.from('flow_locations').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (data) return mapLocation(data);
  } catch (_) {
    /* fallback */
  }
  if (slug === FALLBACK_LOCATION.slug) return FALLBACK_LOCATION;
  return null;
}

/**
 * Build Flow Orbit feed cards for a member.
 */
async function buildMemberFeed(db, { tier = 'registered', userId = null } = {}) {
  const [events, locations, coupons] = await Promise.all([
    listEvents(db, { feedOnly: true }),
    listLocations(db),
    listCouponsForTier(db, tier).catch(() => []),
  ]);

  let saves = [];
  if (userId) {
    try {
      const { data } = await db.from('flow_saves').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      saves = data || [];
    } catch (_) {
      saves = [];
    }
  }

  const cards = [];

  // Member card always first (client fills personal data)
  cards.push({ type: 'member', id: 'member' });

  events.forEach((ev) => {
    cards.push({
      type: 'event',
      id: ev.id,
      slug: ev.slug,
      data: ev,
      saved: saves.some((s) => s.item_type === 'event' && (s.item_id === ev.id || s.item_id === ev.slug)),
    });
  });

  coupons.forEach((c) => {
    cards.push({
      type: 'benefit',
      id: c.id || c.code,
      slug: String(c.code || '').toLowerCase(),
      data: c,
      saved: saves.some((s) => s.item_type === 'benefit' && (s.item_id === c.code || s.item_id === c.id)),
    });
  });

  // Partner cards from unique partners in coupons
  const seenPartners = new Set();
  coupons.forEach((c) => {
    const p = c.partner;
    if (!p?.slug || seenPartners.has(p.slug)) return;
    seenPartners.add(p.slug);
    cards.push({
      type: 'partner',
      id: p.id || p.slug,
      slug: p.slug,
      data: p,
      saved: saves.some((s) => s.item_type === 'partner' && (s.item_id === p.slug || s.item_id === p.id)),
    });
  });

  locations.forEach((loc) => {
    const upcoming = events.filter((e) => e.location?.slug === loc.slug && ['upcoming', 'starting_soon', 'live'].includes(e.status));
    cards.push({
      type: 'location',
      id: loc.id,
      slug: loc.slug,
      data: { ...loc, upcomingCount: upcoming.length, upcoming },
      saved: saves.some((s) => s.item_type === 'location' && (s.item_id === loc.slug || s.item_id === loc.id)),
    });
  });

  cards.push({ type: 'profile', id: 'profile' });

  return {
    cards,
    events,
    locations,
    coupons,
    saves: saves.map((s) => ({
      type: s.item_type,
      id: s.item_id,
      meta: s.meta,
      createdAt: s.created_at,
    })),
  };
}

async function toggleSave(db, { userId, itemType, itemId, meta = {} }) {
  if (!userId) {
    const err = new Error('Login required');
    err.status = 401;
    throw err;
  }
  const type = String(itemType || '').trim();
  const id = String(itemId || '').trim();
  if (!type || !id) {
    const err = new Error('itemType and itemId required');
    err.status = 400;
    throw err;
  }

  const { data: existing } = await db
    .from('flow_saves')
    .select('id')
    .eq('user_id', userId)
    .eq('item_type', type)
    .eq('item_id', id)
    .maybeSingle();

  if (existing?.id) {
    await db.from('flow_saves').delete().eq('id', existing.id);
    return { saved: false, itemType: type, itemId: id };
  }

  const { error } = await db.from('flow_saves').insert({
    user_id: userId,
    item_type: type,
    item_id: id,
    meta,
  });
  if (error) throw error;
  return { saved: true, itemType: type, itemId: id };
}

module.exports = {
  FALLBACK_EVENT,
  FALLBACK_LOCATION,
  deriveEventStatus,
  statusLabel,
  mapEvent,
  mapLocation,
  listLocations,
  listEvents,
  getEventBySlug,
  getLocationBySlug,
  buildMemberFeed,
  toggleSave,
};
