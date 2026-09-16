/**
 * GET/POST /api/member-orbit (?route=member-orbit)
 * Member Flow Orbit feed + saves + deep-link lookups
 */
const { createClient } = require('@supabase/supabase-js');
const {
  buildMemberFeed,
  toggleSave,
  getEventBySlug,
  getLocationBySlug,
} = require('./flow-orbit');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function dbService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error('Supabase server env incomplete');
    err.status = 500;
    throw err;
  }
  return createClient(url, key);
}

async function resolveUser(req) {
  const authHeader = req.headers.authorization || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!jwt) return null;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.SUPABASE_URL;
  if (!anon || !url) return null;
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user?.id) return null;
  return data.user;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = dbService();
    const action = String(req.query?.action || 'feed').trim();
    const user = await resolveUser(req);
    const userId = user?.id || null;

    if (req.method === 'GET' && action === 'feed') {
      let tier = 'registered';
      let profile = null;
      if (userId) {
        const { data } = await db
          .from('profiles')
          .select(
            'id, exp, username, member_display_name, membership_tier, membership_status, member_card_public_id, member_card_claimed_at, instagram_handle'
          )
          .eq('id', userId)
          .maybeSingle();
        profile = data || null;
        tier = profile?.membership_tier || 'registered';
      }
      const feed = await buildMemberFeed(db, { tier, userId });
      return res.status(200).json({
        ok: true,
        authenticated: Boolean(userId),
        profile,
        ...feed,
        flowee: userId
          ? { line: 'Welcome back. Your next Flow is waiting.', cta: 'SWIPE' }
          : { line: 'Claim your card — then the Orbit opens.', cta: 'CLAIM' },
      });
    }

    if (req.method === 'GET' && action === 'event') {
      const slug = String(req.query?.slug || '').trim();
      const event = await getEventBySlug(db, slug);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json({
        ok: true,
        event,
        authenticated: Boolean(userId),
        preview: !userId,
      });
    }

    if (req.method === 'GET' && action === 'location') {
      const slug = String(req.query?.slug || '').trim();
      const location = await getLocationBySlug(db, slug);
      if (!location) return res.status(404).json({ error: 'Location not found' });
      return res.status(200).json({ ok: true, location, authenticated: Boolean(userId) });
    }

    if (req.method === 'POST' && action === 'save') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const result = await toggleSave(db, {
        userId,
        itemType: body.itemType || body.type,
        itemId: body.itemId || body.id,
        meta: body.meta || {},
      });
      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(400).json({ error: 'Unknown action', action });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Orbit error' });
  }
};
