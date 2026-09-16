/**
 * POST /api/membership-activate (?route=membership-activate)
 * Verifies Stripe Checkout session and writes membership + EXP to profiles.
 */
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const TIER_XP = {
  flow_supporter: 50,
  flow_crew: 100,
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const sessionId = String(body.sessionId || body.session_id || '').trim();
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!stripeKey || !supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Server payment/profile env incomplete' });
    }

    const stripe = Stripe(stripeKey);
    const db = createClient(supabaseUrl, serviceKey);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.mode !== 'subscription') {
      return res.status(400).json({ error: 'Not a membership subscription session' });
    }
    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Checkout not completed' });
    }

    const tier = session.metadata?.tier || 'flow_supporter';
    const metaUserId = session.metadata?.userId || session.client_reference_id || '';
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();
    const displayName = session.metadata?.displayName || '';
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    let profileId = metaUserId || null;
    if (!profileId && email) {
      const { data: byEmail } = await db
        .from('profiles')
        .select('id, exp')
        .eq('email', email)
        .maybeSingle();
      if (byEmail?.id) profileId = byEmail.id;
    }

    if (!profileId) {
      return res.status(200).json({
        success: true,
        pendingClaim: true,
        tier,
        email,
        message: 'Payment ok. Log in with the same email to bind membership to your profile.',
      });
    }

    const { data: profile } = await db
      .from('profiles')
      .select('id, exp, membership_tier, membership_status')
      .eq('id', profileId)
      .maybeSingle();

    const bonus = TIER_XP[tier] || 50;
    const already = profile?.membership_tier === tier && profile?.membership_status === 'active';
    const nextExp = already ? profile.exp || 0 : (profile?.exp || 0) + bonus;

    const patch = {
      membership_tier: tier,
      membership_status: 'active',
      membership_updated_at: new Date().toISOString(),
      exp: nextExp,
    };
    if (customerId) patch.stripe_customer_id = customerId;
    if (displayName) patch.member_display_name = displayName;

    const { error } = await db.from('profiles').update(patch).eq('id', profileId);
    if (error) throw error;

    let coupons = [];
    try {
      const { listCouponsForTier, grantCouponsToMember } = require('./membership-coupons');
      coupons = await listCouponsForTier(db, tier);
      await grantCouponsToMember(db, {
        userId: profileId,
        coupons,
        memberNumber: null,
        publicId: null,
      });
    } catch (e) {
      console.warn('[membership-activate] coupons', e.message || e);
    }

    return res.status(200).json({
      success: true,
      tier,
      profileId,
      exp: nextExp,
      xpAwarded: already ? 0 : bonus,
      coupons,
    });
  } catch (err) {
    console.error('[membership-activate]', err);
    return res.status(500).json({ error: err.message || 'Activation failed' });
  }
};
