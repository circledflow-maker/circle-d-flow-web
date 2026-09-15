/**
 * POST /api/claim-member-card (?route=claim-card)
 * Persists member card + EXP to profiles (service role; requires Authorization bearer user JWT).
 */
const { createClient } = require('@supabase/supabase-js');

const CLAIM_XP = 25;

function randomId() {
  return 'wk_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Supabase server env incomplete' });
    }

    const authHeader = req.headers.authorization || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const displayName = String(body.displayName || '').trim().slice(0, 80);
    if (displayName.length < 2) {
      return res.status(400).json({ error: 'displayName required (min 2 chars)' });
    }

    let userId = null;
    if (jwt && anonKey) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (!userErr && userData?.user?.id) userId = userData.user.id;
    }

    // Allow anonymous local claim payload only if guestPublicId provided — still prefer auth
    const db = createClient(supabaseUrl, serviceKey);
    const publicId = String(body.publicId || '').trim() || randomId();
    const source = String(body.source || 'direct').slice(0, 40);

    if (!userId) {
      return res.status(401).json({
        error: 'Login required to save card EXP to your profile.',
        code: 'AUTH_REQUIRED',
        publicId,
        displayName,
        localXpHint: CLAIM_XP,
      });
    }

    const { data: profile, error: fetchErr } = await db
      .from('profiles')
      .select('id, exp, member_card_claimed_at, member_card_public_id, membership_tier')
      .eq('id', userId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    const alreadyClaimed = Boolean(profile?.member_card_claimed_at);
    const nextExp = alreadyClaimed ? profile?.exp || 0 : (profile?.exp || 0) + CLAIM_XP;

    const patch = {
      member_display_name: displayName,
      member_card_public_id: profile?.member_card_public_id || publicId,
      member_card_claimed_at: profile?.member_card_claimed_at || new Date().toISOString(),
      exp: nextExp,
      membership_tier: profile?.membership_tier || 'registered',
      membership_status: profile?.membership_status === 'active' ? 'active' : 'none',
    };

    const { error: upErr } = await db.from('profiles').update(patch).eq('id', userId);
    if (upErr) throw upErr;

    return res.status(200).json({
      success: true,
      profileId: userId,
      publicId: patch.member_card_public_id,
      displayName,
      exp: nextExp,
      xpAwarded: alreadyClaimed ? 0 : CLAIM_XP,
      source,
      alreadyClaimed,
    });
  } catch (err) {
    console.error('[claim-member-card]', err);
    return res.status(500).json({ error: err.message || 'Claim failed' });
  }
};
