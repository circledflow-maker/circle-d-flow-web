/**
 * POST /api/claim-member-card (?route=claim-card)
 * Persists member card + EXP to profiles and issues shared partner coupon codes.
 */
const { createClient } = require('@supabase/supabase-js');
const {
  listCouponsForTier,
  grantCouponsToMember,
} = require('./membership-coupons');

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

    const db = createClient(supabaseUrl, serviceKey);
    const publicId = String(body.publicId || '').trim() || randomId();
    const source = String(body.source || 'direct').slice(0, 40);
    const memberNumber = String(body.memberNumber || '').trim().slice(0, 24) || null;
    const instagram = String(body.instagram || '').trim().slice(0, 64) || null;
    const contactMethod = String(body.contactMethod || '').trim().slice(0, 32) || null;

    if (!userId) {
      // Guest path: still return shared codes for UX (no grant rows)
      let coupons = [];
      try {
        coupons = await listCouponsForTier(db, 'registered');
      } catch (_) {
        /* ignore if tables missing */
      }
      return res.status(401).json({
        error: 'Login required to save card EXP to your profile.',
        code: 'AUTH_REQUIRED',
        publicId,
        displayName,
        localXpHint: CLAIM_XP,
        coupons,
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
    const tier = profile?.membership_tier || 'registered';

    const patch = {
      member_display_name: displayName,
      member_card_public_id: profile?.member_card_public_id || publicId,
      member_card_claimed_at: profile?.member_card_claimed_at || new Date().toISOString(),
      exp: nextExp,
      membership_tier: tier,
      membership_status: profile?.membership_status === 'active' ? 'active' : 'none',
    };
    if (instagram) patch.instagram = instagram;

    const { error: upErr } = await db.from('profiles').update(patch).eq('id', userId);
    if (upErr) {
      if (/instagram|column/i.test(upErr.message || '')) {
        delete patch.instagram;
        const { error: retryErr } = await db.from('profiles').update(patch).eq('id', userId);
        if (retryErr) throw retryErr;
      } else {
        throw upErr;
      }
    }

    let coupons = [];
    try {
      coupons = await listCouponsForTier(db, tier);
      await grantCouponsToMember(db, {
        userId,
        coupons,
        memberNumber,
        publicId: patch.member_card_public_id,
      });
    } catch (couponErr) {
      console.warn('[claim-member-card] coupons', couponErr.message || couponErr);
    }

    return res.status(200).json({
      success: true,
      profileId: userId,
      publicId: patch.member_card_public_id,
      memberNumber,
      contactMethod,
      displayName,
      exp: nextExp,
      xpAwarded: alreadyClaimed ? 0 : CLAIM_XP,
      source,
      alreadyClaimed,
      tier,
      coupons,
    });
  } catch (err) {
    console.error('[claim-member-card]', err);
    return res.status(500).json({ error: err.message || 'Claim failed' });
  }
};
