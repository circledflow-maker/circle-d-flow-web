/**
 * Membership admin API — Flow Control
 * Gate: x-admin-key === MEMBERSHIP_ADMIN_PASSWORD | ADMIN_OPS_CODE | ADMIN_API_KEY | FlowCreator!
 *
 * GET  ?action=overview | members | partners | coupons | events | locations | live-feed
 * POST ?action=partner | coupon | redeem | update-partner | update-coupon | event | location | update-event | update-location
 */
const { createClient } = require('@supabase/supabase-js');
const { listEvents, listLocations, buildMemberFeed, mapEvent, mapLocation } = require('./flow-orbit');

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-key'
  );
}

function getAdminKey(req) {
  return (
    req.headers['x-admin-key'] ||
    req.headers['X-Admin-Key'] ||
    (req.query && req.query.adminKey) ||
    ''
  );
}

function assertAdmin(req) {
  const provided = String(getAdminKey(req) || '').trim();
  // Always accept FlowCreator! for this dashboard, plus any configured admin env keys.
  const allowed = [
    'FlowCreator!',
    process.env.MEMBERSHIP_ADMIN_PASSWORD,
    process.env.ADMIN_OPS_CODE,
    process.env.ADMIN_API_KEY,
  ]
    .filter(Boolean)
    .map((s) => String(s).trim());
  if (!provided || !allowed.includes(provided)) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

function dbClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    const err = new Error('Supabase server env incomplete');
    err.status = 500;
    throw err;
  }
  return createClient(supabaseUrl, serviceKey);
}

function bodyOf(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
}

async function overview(db) {
  const [{ count: members }, { data: tiers }, { count: grants }, { count: partners }, { count: coupons }] =
    await Promise.all([
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('member_card_claimed_at', 'is', null),
      db
        .from('profiles')
        .select('membership_tier')
        .not('member_card_claimed_at', 'is', null),
      db.from('membership_coupon_grants').select('id', { count: 'exact', head: true }),
      db.from('membership_partners').select('id', { count: 'exact', head: true }).eq('active', true),
      db.from('membership_coupons').select('id', { count: 'exact', head: true }).eq('active', true),
    ]);

  let events = 0;
  let locations = 0;
  let saves = 0;
  try {
    const [e, l, s] = await Promise.all([
      db.from('flow_events').select('id', { count: 'exact', head: true }).eq('is_active', true),
      db.from('flow_locations').select('id', { count: 'exact', head: true }).neq('status', 'archived'),
      db.from('flow_saves').select('id', { count: 'exact', head: true }),
    ]);
    events = e.count || 0;
    locations = l.count || 0;
    saves = s.count || 0;
  } catch (_) {
    /* tables may not exist yet */
  }

  const byTier = { registered: 0, flow_supporter: 0, flow_crew: 0, other: 0 };
  (tiers || []).forEach((r) => {
    const t = r.membership_tier || 'registered';
    if (byTier[t] != null) byTier[t] += 1;
    else byTier.other += 1;
  });

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { count: weekClaims } = await db
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('member_card_claimed_at', since);

  return {
    members: members || 0,
    grants: grants || 0,
    partners: partners || 0,
    coupons: coupons || 0,
    events,
    locations,
    saves,
    claimsLast7Days: weekClaims || 0,
    byTier,
  };
}

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function listMembers(db, q) {
  const { data, error } = await db
    .from('profiles')
    .select(
      'id, email, username, member_display_name, member_card_public_id, member_card_claimed_at, membership_tier, membership_status, exp, instagram_handle, preferred_contact_method, contact_details'
    )
    .not('member_card_claimed_at', 'is', null)
    .order('member_card_claimed_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  let rows = (data || []).map((r) => ({
    ...r,
    // Normalized aliases for admin UI
    full_name: r.member_display_name || r.username || null,
    instagram: r.instagram_handle || null,
  }));

  const needle = String(q || '').trim().toLowerCase();
  if (needle) {
    rows = rows.filter((r) => {
      const blob = [
        r.email,
        r.username,
        r.member_display_name,
        r.member_card_public_id,
        r.instagram_handle,
        r.membership_tier,
        r.preferred_contact_method,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(needle);
    });
  }
  return rows;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    assertAdmin(req);
    const db = dbClient();
    const action = String(req.query?.action || bodyOf(req).action || 'overview').trim();

    if (req.method === 'GET') {
      if (action === 'overview') {
        return res.status(200).json({ success: true, stats: await overview(db) });
      }
      if (action === 'members') {
        return res.status(200).json({
          success: true,
          members: await listMembers(db, req.query?.q),
        });
      }
      if (action === 'partners') {
        const { data, error } = await db
          .from('membership_partners')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ success: true, partners: data || [] });
      }
      if (action === 'coupons') {
        const { data, error } = await db
          .from('membership_coupons')
          .select('*, partner:membership_partners(id, slug, name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const coupons = data || [];
        // attach grant counts
        const ids = coupons.map((c) => c.id);
        let counts = {};
        if (ids.length) {
          const { data: grants } = await db
            .from('membership_coupon_grants')
            .select('coupon_id')
            .in('coupon_id', ids);
          (grants || []).forEach((g) => {
            counts[g.coupon_id] = (counts[g.coupon_id] || 0) + 1;
          });
        }
        return res.status(200).json({
          success: true,
          coupons: coupons.map((c) => ({ ...c, grants: { count: counts[c.id] || 0 } })),
        });
      }
      if (action === 'events') {
        const events = await listEvents(db, { feedOnly: false, includeInactive: true });
        return res.status(200).json({ success: true, events });
      }
      if (action === 'locations') {
        const locations = await listLocations(db, { activeOnly: false });
        return res.status(200).json({ success: true, locations });
      }
      if (action === 'live-feed') {
        const feed = await buildMemberFeed(db, { tier: 'registered', userId: null });
        return res.status(200).json({ success: true, cards: feed.cards, events: feed.events, locations: feed.locations });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method === 'POST') {
      const body = bodyOf(req);

      if (action === 'partner') {
        const slug = String(body.slug || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '')
          .slice(0, 40);
        const name = String(body.name || '').trim().slice(0, 80);
        if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
        const row = {
          slug,
          name,
          url: String(body.url || '').trim().slice(0, 300) || null,
          description: String(body.description || '').trim().slice(0, 400) || null,
          sort_order: Number(body.sort_order) || 100,
          active: body.active !== false,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await db
          .from('membership_partners')
          .upsert(row, { onConflict: 'slug' })
          .select('*')
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, partner: data });
      }

      if (action === 'update-partner') {
        const id = String(body.id || '').trim();
        if (!id) return res.status(400).json({ error: 'id required' });
        const patch = { updated_at: new Date().toISOString() };
        ['name', 'url', 'description'].forEach((k) => {
          if (body[k] != null) patch[k] = String(body[k]).trim();
        });
        if (body.sort_order != null) patch.sort_order = Number(body.sort_order) || 100;
        if (body.active != null) patch.active = Boolean(body.active);
        const { data, error } = await db
          .from('membership_partners')
          .update(patch)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, partner: data });
      }

      if (action === 'coupon') {
        const partnerId = String(body.partner_id || body.partnerId || '').trim();
        const code = String(body.code || '')
          .trim()
          .toUpperCase()
          .slice(0, 48);
        const title = String(body.title || '').trim().slice(0, 120);
        const benefitText = String(body.benefit_text || body.benefitText || '').trim().slice(0, 400);
        if (!partnerId || !code || !title || !benefitText) {
          return res.status(400).json({ error: 'partner_id, code, title, benefit_text required' });
        }
        const row = {
          partner_id: partnerId,
          code,
          title,
          benefit_text: benefitText,
          discount_percent:
            body.discount_percent != null || body.discountPercent != null
              ? Number(body.discount_percent ?? body.discountPercent)
              : null,
          min_tier: String(body.min_tier || body.minTier || 'registered').trim(),
          active: body.active !== false,
          notes: String(body.notes || '').trim().slice(0, 400) || null,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await db
          .from('membership_coupons')
          .upsert(row, { onConflict: 'partner_id,code' })
          .select('*, partner:membership_partners(id, slug, name)')
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, coupon: data });
      }

      if (action === 'update-coupon') {
        const id = String(body.id || '').trim();
        if (!id) return res.status(400).json({ error: 'id required' });
        const patch = { updated_at: new Date().toISOString() };
        if (body.code != null) patch.code = String(body.code).trim().toUpperCase();
        if (body.title != null) patch.title = String(body.title).trim();
        if (body.benefit_text != null || body.benefitText != null) {
          patch.benefit_text = String(body.benefit_text || body.benefitText).trim();
        }
        if (body.discount_percent != null || body.discountPercent != null) {
          patch.discount_percent = Number(body.discount_percent ?? body.discountPercent);
        }
        if (body.min_tier != null || body.minTier != null) {
          patch.min_tier = String(body.min_tier || body.minTier).trim();
        }
        if (body.active != null) patch.active = Boolean(body.active);
        if (body.notes != null) patch.notes = String(body.notes).trim();
        const { data, error } = await db
          .from('membership_coupons')
          .update(patch)
          .eq('id', id)
          .select('*, partner:membership_partners(id, slug, name)')
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, coupon: data });
      }

      if (action === 'redeem') {
        const grantId = String(body.grant_id || body.grantId || '').trim();
        const userId = String(body.user_id || body.userId || '').trim();
        const couponId = String(body.coupon_id || body.couponId || '').trim();
        let q = db.from('membership_coupon_grants').update({
          redeemed_at: new Date().toISOString(),
        });
        if (grantId) q = q.eq('id', grantId);
        else if (userId && couponId) q = q.eq('user_id', userId).eq('coupon_id', couponId);
        else return res.status(400).json({ error: 'grant_id or user_id+coupon_id required' });
        const { data, error } = await q.select('*').maybeSingle();
        if (error) throw error;
        return res.status(200).json({ success: true, grant: data });
      }

      if (action === 'location') {
        const name = String(body.name || '').trim().slice(0, 120);
        const slug = slugify(body.slug || name);
        if (!name || !slug) return res.status(400).json({ error: 'name required' });
        const row = {
          name,
          slug,
          description: String(body.description || '').trim().slice(0, 800) || null,
          address: String(body.address || '').trim().slice(0, 200) || null,
          city: String(body.city || 'Lisbon').trim().slice(0, 80),
          latitude: body.latitude != null ? Number(body.latitude) : null,
          longitude: body.longitude != null ? Number(body.longitude) : null,
          cover_image: String(body.cover_image || body.coverImage || '').trim() || null,
          instagram_url: String(body.instagram_url || body.instagramUrl || '').trim() || null,
          website_url: String(body.website_url || body.websiteUrl || '').trim() || null,
          map_url: String(body.map_url || body.mapUrl || '').trim() || null,
          status: String(body.status || 'active').trim(),
          is_featured: body.is_featured === true || body.isFeatured === true,
          sort_order: Number(body.sort_order || body.sortOrder) || 100,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await db.from('flow_locations').upsert(row, { onConflict: 'slug' }).select('*').single();
        if (error) throw error;
        return res.status(200).json({ success: true, location: mapLocation(data) });
      }

      if (action === 'update-location') {
        const id = String(body.id || '').trim();
        if (!id) return res.status(400).json({ error: 'id required' });
        const patch = { updated_at: new Date().toISOString() };
        ['name', 'description', 'address', 'city', 'status'].forEach((k) => {
          if (body[k] != null) patch[k] = String(body[k]).trim();
        });
        if (body.map_url != null || body.mapUrl != null) patch.map_url = String(body.map_url || body.mapUrl).trim();
        if (body.instagram_url != null || body.instagramUrl != null) {
          patch.instagram_url = String(body.instagram_url || body.instagramUrl).trim();
        }
        if (body.is_featured != null || body.isFeatured != null) {
          patch.is_featured = Boolean(body.is_featured ?? body.isFeatured);
        }
        if (body.sort_order != null || body.sortOrder != null) {
          patch.sort_order = Number(body.sort_order ?? body.sortOrder) || 100;
        }
        const { data, error } = await db.from('flow_locations').update(patch).eq('id', id).select('*').single();
        if (error) throw error;
        return res.status(200).json({ success: true, location: mapLocation(data) });
      }

      if (action === 'event') {
        const title = String(body.title || '').trim().slice(0, 160);
        const slug = slugify(body.slug || title);
        const eventDate = String(body.event_date || body.eventDate || '').trim().slice(0, 10);
        if (!title || !slug || !eventDate) {
          return res.status(400).json({ error: 'title and event_date required' });
        }
        const row = {
          title,
          slug,
          description: String(body.description || '').trim().slice(0, 2000) || null,
          cover_image: String(body.cover_image || body.coverImage || '').trim() || null,
          event_date: eventDate,
          start_time: String(body.start_time || body.startTime || '20:00').trim() || null,
          end_time: String(body.end_time || body.endTime || '').trim() || null,
          location_id: String(body.location_id || body.locationId || '').trim() || null,
          event_type: String(body.event_type || body.eventType || 'community').trim(),
          status: String(body.status || 'upcoming').trim(),
          visibility: String(body.visibility || 'members').trim(),
          min_membership_tier: String(body.min_membership_tier || body.minTier || 'registered').trim(),
          member_benefit: String(body.member_benefit || body.memberBenefit || '').trim() || null,
          cta_label: String(body.cta_label || body.ctaLabel || 'Save event').trim(),
          cta_url: String(body.cta_url || body.ctaUrl || '').trim() || null,
          is_featured: body.is_featured === true || body.isFeatured === true,
          show_in_feed: body.show_in_feed !== false && body.showInFeed !== false,
          is_active: body.is_active !== false && body.isActive !== false,
          sort_order: Number(body.sort_order || body.sortOrder) || 100,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await db
          .from('flow_events')
          .upsert(row, { onConflict: 'slug' })
          .select('*, location:flow_locations(*)')
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, event: mapEvent(data) });
      }

      if (action === 'update-event') {
        const id = String(body.id || '').trim();
        if (!id) return res.status(400).json({ error: 'id required' });
        const patch = { updated_at: new Date().toISOString() };
        const strMap = {
          title: 'title',
          description: 'description',
          status: 'status',
          visibility: 'visibility',
          event_type: 'event_type',
          eventType: 'event_type',
          member_benefit: 'member_benefit',
          memberBenefit: 'member_benefit',
          cta_label: 'cta_label',
          ctaLabel: 'cta_label',
          cta_url: 'cta_url',
          ctaUrl: 'cta_url',
          cover_image: 'cover_image',
          coverImage: 'cover_image',
          event_date: 'event_date',
          eventDate: 'event_date',
          start_time: 'start_time',
          startTime: 'start_time',
          min_membership_tier: 'min_membership_tier',
          minTier: 'min_membership_tier',
        };
        Object.keys(strMap).forEach((k) => {
          if (body[k] != null) patch[strMap[k]] = String(body[k]).trim();
        });
        if (body.location_id != null || body.locationId != null) {
          patch.location_id = String(body.location_id || body.locationId).trim() || null;
        }
        if (body.is_featured != null || body.isFeatured != null) {
          patch.is_featured = Boolean(body.is_featured ?? body.isFeatured);
        }
        if (body.show_in_feed != null || body.showInFeed != null) {
          patch.show_in_feed = Boolean(body.show_in_feed ?? body.showInFeed);
        }
        if (body.is_active != null || body.isActive != null) {
          patch.is_active = Boolean(body.is_active ?? body.isActive);
        }
        const { data, error } = await db
          .from('flow_events')
          .update(patch)
          .eq('id', id)
          .select('*, location:flow_locations(*)')
          .single();
        if (error) throw error;
        return res.status(200).json({ success: true, event: mapEvent(data) });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[admin-membership]', err);
    return res.status(err.status || 500).json({ error: err.message || 'Admin membership failed' });
  }
};
