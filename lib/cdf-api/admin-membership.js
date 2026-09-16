/**
 * Membership admin API
 * Gate: x-admin-key === MEMBERSHIP_ADMIN_PASSWORD | ADMIN_OPS_CODE | ADMIN_API_KEY | FlowCreator!
 *
 * GET  ?action=overview | members | partners | coupons
 * POST ?action=partner | coupon | redeem | update-partner | update-coupon
 */
const { createClient } = require('@supabase/supabase-js');

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
    claimsLast7Days: weekClaims || 0,
    byTier,
  };
}

async function listMembers(db, q) {
  let query = db
    .from('profiles')
    .select(
      'id, email, username, full_name, member_display_name, member_card_public_id, member_card_claimed_at, membership_tier, membership_status, exp, instagram'
    )
    .not('member_card_claimed_at', 'is', null)
    .order('member_card_claimed_at', { ascending: false })
    .limit(200);

  const { data, error } = await query;
  if (error) throw error;
  let rows = data || [];
  const needle = String(q || '').trim().toLowerCase();
  if (needle) {
    rows = rows.filter((r) => {
      const blob = [
        r.email,
        r.username,
        r.full_name,
        r.member_display_name,
        r.member_card_public_id,
        r.instagram,
        r.membership_tier,
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

      return res.status(400).json({ error: 'Unknown action' });
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[admin-membership]', err);
    return res.status(err.status || 500).json({ error: err.message || 'Admin membership failed' });
  }
};
