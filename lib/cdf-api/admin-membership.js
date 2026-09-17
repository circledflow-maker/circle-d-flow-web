/**
 * Membership admin API — Flow Control
 * Gate: x-admin-key === MEMBERSHIP_ADMIN_PASSWORD | ADMIN_OPS_CODE | ADMIN_API_KEY | FlowCreator!
 *
 * GET  ?action=overview | members | partners | coupons | events | locations | live-feed
 * POST ?action=partner | coupon | redeem | update-partner | update-coupon | event | location | update-event | update-location
 */
const { createClient } = require('@supabase/supabase-js');
const { listEvents, listLocations, buildMemberFeed, mapEvent, mapLocation } = require('./flow-orbit');
const { pushToSheet, sheetId, webhookUrl } = require('./sheets-sync');
const {
  verifyOperator,
  verifySitePassword,
  sessionToken,
  verifySession,
} = require('./admin-auth');

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-key, x-admin-user, x-admin-session'
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

function getAdminUser(req) {
  return String(req.headers['x-admin-user'] || req.query?.adminUser || '').trim().toLowerCase();
}

function getAdminSession(req) {
  return String(req.headers['x-admin-session'] || req.query?.adminSession || '').trim();
}

/**
 * Dual gate: operator username+session (or password on login) + site password.
 * Legacy: site password alone still works for bootstrap, but audit tags as "legacy".
 */
function assertAdmin(req) {
  const siteOk = verifySitePassword(getAdminKey(req));
  if (!siteOk) {
    const err = new Error('Unauthorized — site password');
    err.status = 401;
    throw err;
  }
  const user = getAdminUser(req);
  const session = getAdminSession(req);
  if (user && verifySession(user, session)) {
    req.cdfAdminUser = user;
    return user;
  }
  // Bootstrap / legacy single-password unlock
  req.cdfAdminUser = user || 'legacy';
  return req.cdfAdminUser;
}

async function writeAudit(db, adminUser, action, detail) {
  try {
    await db.from('cdf_admin_audit').insert({
      admin_user: adminUser || 'unknown',
      action: String(action || 'action').slice(0, 80),
      detail: detail || {},
    });
  } catch (_) {
    /* table may be missing in older envs */
  }
}

function suggestForFeedback(kind, message) {
  const m = String(message || '').toLowerCase();
  if (/sheet|excel|webhook|google/.test(m)) {
    return 'Set GOOGLE_SHEETS_WEBHOOK_URL on Vercel to the Apps Script web app URL, then tap Sync Google Sheet.';
  }
  if (/event|botanica|tagus|next flow/.test(m)) {
    return 'Open Events tab → set date 2026-09-24 Botanical Groove · Botânica · featured + show in feed.';
  }
  if (/coupon|qr|redeem|benefit/.test(m)) {
    return 'Coupons require Silver+. Use Redeem tab / scan member QR; codes refill each calendar month.';
  }
  if (/login|password|auth|unauthorized/.test(m)) {
    return 'Sign in with your admin username + personal password, then the site password (FlowCreator!).';
  }
  if (kind === 'error') {
    return 'Capture the exact error text, refresh once, then re-sync. If it persists, note which tab and action failed.';
  }
  return 'Thanks — Flowee logged this. Prioritize clarity for members (Botanica next, Bronze/Silver/Gold) and keep Sheet sync green.';
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

  const registrations = await registrationFunnel(db);

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
    registrations,
    sheetId: sheetId(),
    sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId()}/edit`,
  };
}

/**
 * Site-wide registration totals by source:
 *  - event_registrations.source (direct web /join invites)
 *  - profiles.member_card_source (membership card claim / login path)
 */
async function registrationFunnel(db) {
  const bySource = {};
  let eventTotal = 0;
  let cardTotal = 0;
  let webDirect = 0;
  let membershipLogin = 0;

  try {
    const { data: regs } = await db
      .from('event_registrations')
      .select('id, source, email, full_name, stage_name, created_at, event_id, status')
      .order('created_at', { ascending: false })
      .limit(2000);
    (regs || []).forEach((r) => {
      eventTotal += 1;
      const src = String(r.source || 'unknown').slice(0, 48);
      bySource[src] = (bySource[src] || 0) + 1;
      if (/^web-|botanica|lapa71|join|invite|ig|whatsapp|qr|flyer/i.test(src)) webDirect += 1;
    });
  } catch (_) {
    /* table may miss columns */
  }

  try {
    const { data: cards } = await db
      .from('profiles')
      .select('id, email, member_display_name, member_card_source, member_card_claimed_at, membership_tier')
      .not('member_card_claimed_at', 'is', null)
      .limit(2000);
    (cards || []).forEach((r) => {
      cardTotal += 1;
      const src = String(r.member_card_source || 'membership_login').slice(0, 48);
      const key = 'card:' + src;
      bySource[key] = (bySource[key] || 0) + 1;
      if (/login|member_card|direct|google/i.test(src)) membershipLogin += 1;
      else if (/web-|botanica|join/i.test(src)) webDirect += 1;
      else membershipLogin += 1;
    });
  } catch (_) {
    /* member_card_source may not exist yet */
  }

  return {
    eventRegistrations: eventTotal,
    memberCards: cardTotal,
    totalTouchpoints: eventTotal + cardTotal,
    webDirect,
    membershipLogin,
    bySource,
  };
}

async function buildSheetPayload(db) {
  const stats = await overview(db);
  const funnel = stats.registrations || {};

  const summary = [
    ['Metric', 'Value'],
    ['Synced at', new Date().toISOString()],
    ['Event registrations', funnel.eventRegistrations || 0],
    ['Member cards claimed', funnel.memberCards || 0],
    ['Total touchpoints', funnel.totalTouchpoints || 0],
    ['Direct web / join', funnel.webDirect || 0],
    ['Membership login / card', funnel.membershipLogin || 0],
    ['Live members', stats.members || 0],
    ['Claims last 7 days', stats.claimsLast7Days || 0],
  ];
  Object.entries(funnel.bySource || {}).forEach(([k, v]) => {
    summary.push(['source:' + k, v]);
  });

  const headers = [
    'type',
    'source',
    'name',
    'email',
    'event_id',
    'tier',
    'status',
    'created_at',
  ];
  const rows = [];

  try {
    const { data: regs } = await db
      .from('event_registrations')
      .select('source, email, full_name, stage_name, created_at, event_id, status')
      .order('created_at', { ascending: false })
      .limit(1500);
    (regs || []).forEach((r) => {
      rows.push([
        'event_registration',
        r.source || '',
        r.full_name || r.stage_name || '',
        r.email || '',
        r.event_id || '',
        '',
        r.status || '',
        r.created_at || '',
      ]);
    });
  } catch (_) { /* ignore */ }

  try {
    const { data: cards } = await db
      .from('profiles')
      .select('email, member_display_name, member_card_source, member_card_claimed_at, membership_tier')
      .not('member_card_claimed_at', 'is', null)
      .order('member_card_claimed_at', { ascending: false })
      .limit(1500);
    (cards || []).forEach((r) => {
      rows.push([
        'member_card',
        r.member_card_source || 'membership_login',
        r.member_display_name || '',
        r.email || '',
        '',
        r.membership_tier || 'registered',
        'claimed',
        r.member_card_claimed_at || '',
      ]);
    });
  } catch (_) { /* ignore */ }

  return {
    tab: 'Registrations',
    replace: true,
    headers,
    rows,
    summary,
    clear: false,
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
    const preBody = bodyOf(req);
    const action = String(req.query?.action || preBody.action || 'overview').trim();

    if (req.method === 'POST' && action === 'login') {
      const username = String(preBody.username || '').trim().toLowerCase();
      const password = String(preBody.password || '').trim();
      const sitePass = String(preBody.sitePassword || preBody.site_password || '').trim();
      const op = verifyOperator(username, password);
      if (!op) {
        return res.status(401).json({ error: 'Invalid admin username or password' });
      }
      if (!verifySitePassword(sitePass)) {
        return res.status(401).json({ error: 'Site password incorrect' });
      }
      return res.status(200).json({
        success: true,
        username: op,
        session: sessionToken(op),
        message: 'Welcome ' + op + ' — Flow Control unlocked.',
      });
    }

    const adminUser = assertAdmin(req);
    const db = dbClient();

    if (req.method === 'GET') {
      if (action === 'overview') {
        const stats = await overview(db);
        stats.webhookConfigured = Boolean(webhookUrl());
        stats.adminUser = adminUser;
        try {
          const { data } = await db
            .from('cdf_admin_audit')
            .select('admin_user, action, detail, created_at')
            .order('created_at', { ascending: false })
            .limit(12);
          stats.lastChanges = data || [];
        } catch (_) {
          stats.lastChanges = [];
        }
        return res.status(200).json({ success: true, stats });
      }
      if (action === 'registrations-funnel') {
        return res.status(200).json({ success: true, funnel: await registrationFunnel(db) });
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
      if (action === 'feedback-list') {
        const { data, error } = await db
          .from('cdf_admin_feedback')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.status(200).json({ success: true, items: data || [] });
      }
      if (action === 'audit') {
        const { data, error } = await db
          .from('cdf_admin_audit')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(40);
        if (error) throw error;
        return res.status(200).json({ success: true, items: data || [] });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method === 'POST') {
      const body = bodyOf(req);

      if (action === 'sync-sheet') {
        const payload = await buildSheetPayload(db);
        const result = await pushToSheet(payload);
        await writeAudit(db, adminUser, 'sync-sheet', {
          rows: payload.rows?.length || 0,
          ok: result.ok,
          skipped: result.skipped || false,
        });
        return res.status(result.ok || result.skipped ? 200 : 502).json({
          success: !!(result.ok || result.skipped),
          ...result,
          rowCount: payload.rows.length,
          funnel: (await overview(db)).registrations,
          adminUser,
        });
      }

      if (action === 'feedback') {
        const kind = String(body.kind || 'feedback').slice(0, 20);
        const message = String(body.message || '').trim().slice(0, 2000);
        if (!message) return res.status(400).json({ error: 'message required' });
        const suggestion = suggestForFeedback(kind, message);
        const { data, error } = await db
          .from('cdf_admin_feedback')
          .insert({
            admin_user: adminUser,
            kind,
            message,
            page: String(body.page || 'admin_membership').slice(0, 80),
            suggestion,
            status: 'open',
          })
          .select('*')
          .single();
        if (error) throw error;
        await writeAudit(db, adminUser, 'feedback', { kind, id: data.id });
        return res.status(200).json({ success: true, item: data, suggestion });
      }

      if (action === 'resolve-feedback') {
        const id = body.id;
        if (!id) return res.status(400).json({ error: 'id required' });
        const { data, error } = await db
          .from('cdf_admin_feedback')
          .update({
            status: String(body.status || 'resolved'),
            resolved_at: new Date().toISOString(),
            resolved_by: adminUser,
          })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        await writeAudit(db, adminUser, 'resolve-feedback', { id });
        return res.status(200).json({ success: true, item: data });
      }

      if (action === 'redeem-benefit') {
        const code = String(body.code || '').trim().toUpperCase();
        if (!code) return res.status(400).json({ error: 'code required' });
        const month = String(body.month || '').trim() || new Date().toISOString().slice(0, 7);
        const { data: existing } = await db
          .from('cdf_benefit_redemptions')
          .select('*')
          .eq('code', code)
          .eq('month_key', month)
          .maybeSingle();
        if (existing) {
          return res.status(409).json({
            error: 'Already used this month — refills next month',
            redemption: existing,
          });
        }
        const { data, error } = await db
          .from('cdf_benefit_redemptions')
          .insert({
            code,
            benefit_id: String(body.benefitId || body.benefit_id || 'manual').slice(0, 40),
            member_number: body.memberNumber || body.member_number || null,
            month_key: month,
            redeemed_by: adminUser,
          })
          .select('*')
          .single();
        if (error) throw error;
        await writeAudit(db, adminUser, 'redeem-benefit', { code, month });
        return res.status(200).json({ success: true, redemption: data });
      }

      if (action === 'ensure-botanica') {
        const locSlug = 'botanica';
        let locId = null;
        const { data: locExisting } = await db
          .from('flow_locations')
          .select('id')
          .eq('slug', locSlug)
          .maybeSingle();
        if (locExisting?.id) {
          locId = locExisting.id;
          await db
            .from('flow_locations')
            .update({
              name: 'Botânica Lisboa',
              city: 'Lisbon',
              address: 'Botânica, Lisbon',
              map_url: 'https://maps.google.com/?q=Botanica+Lisbon',
              is_featured: true,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', locId);
        } else {
          const { data: loc, error: locErr } = await db
            .from('flow_locations')
            .insert({
              name: 'Botânica Lisboa',
              slug: locSlug,
              city: 'Lisbon',
              address: 'Botânica, Lisbon',
              map_url: 'https://maps.google.com/?q=Botanica+Lisbon',
              is_featured: true,
              status: 'active',
            })
            .select('id')
            .single();
          if (locErr) throw locErr;
          locId = loc.id;
        }
        const evSlug = 'botanical-groove-session';
        const evPatch = {
          title: 'The Botanical Groove Session',
          slug: evSlug,
          description:
            'Wako Kungo presents The Botanical Groove Session — music, movement and connection at Botânica Lisboa.',
          event_date: '2026-09-24',
          start_time: '20:00:00',
          event_type: 'community',
          status: 'upcoming',
          visibility: 'members',
          min_membership_tier: 'registered',
          member_benefit: 'Silver+ free Wako event access · Early entry',
          cta_label: 'Join',
          cta_url: '/join?src=botanica',
          is_featured: true,
          show_in_feed: true,
          is_active: true,
          location_id: locId,
          updated_at: new Date().toISOString(),
        };
        const { data: evExisting } = await db
          .from('flow_events')
          .select('id')
          .eq('slug', evSlug)
          .maybeSingle();
        let event;
        if (evExisting?.id) {
          const { data, error } = await db
            .from('flow_events')
            .update(evPatch)
            .eq('id', evExisting.id)
            .select('*, location:flow_locations(*)')
            .single();
          if (error) throw error;
          event = data;
        } else {
          const { data, error } = await db
            .from('flow_events')
            .insert(evPatch)
            .select('*, location:flow_locations(*)')
            .single();
          if (error) throw error;
          event = data;
        }
        await db
          .from('flow_events')
          .update({ show_in_feed: false, is_featured: false, is_active: false })
          .ilike('slug', '%tagus%');
        await writeAudit(db, adminUser, 'ensure-botanica', { eventId: event.id });
        return res.status(200).json({ success: true, event: mapEvent(event) });
      }

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
          min_tier: String(body.min_tier || body.minTier || 'flow_supporter').trim(),
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
