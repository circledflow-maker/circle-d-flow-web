/**
 * POST /api/create-membership-checkout  (?route=membership via payments)
 * Stripe Checkout Subscription for Flow Supporter (€5) / Flow Crew (€10)
 */
const Stripe = require('stripe');

const TIERS = {
  flow_supporter: {
    code: 'flow_supporter',
    name: 'Flow Supporter',
    amountMonth: 500,
    amountYear: 5000, // €50/yr (2 months free vs €60)
    description: 'Early access, supporter recognition, curated playlists, member area.',
  },
  flow_crew: {
    code: 'flow_crew',
    name: 'Flow Crew',
    amountMonth: 1000,
    amountYear: 10000, // €100/yr (2 months free vs €120)
    description: 'All Supporter benefits + partner discounts, early access & stronger Orbit visibility.',
  },
};

function hostFrom(req) {
  if (process.env.URL) return process.env.URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch (_) {
      /* ignore */
    }
  }
  return 'https://circle-d-flow-web.vercel.app';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY on Vercel.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const tierKey = String(body.tier || '').trim();
    const tier = TIERS[tierKey];
    if (!tier) {
      return res.status(400).json({
        error: 'Invalid tier. Use flow_supporter or flow_crew.',
        tiers: Object.keys(TIERS),
      });
    }

    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    const userId = body.userId ? String(body.userId).trim() : '';
    const displayName = body.displayName ? String(body.displayName).trim().slice(0, 80) : '';
    const source = body.source ? String(body.source).trim().slice(0, 40) : 'member_card';
    const interval = String(body.interval || 'month').toLowerCase() === 'year' ? 'year' : 'month';
    const unitAmount = interval === 'year' ? tier.amountYear : tier.amountMonth;

    const stripe = Stripe(stripeKey);
    const host = hostFrom(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: `Circle D Flow — ${tier.name}`,
              description:
                interval === 'year'
                  ? `${tier.description} Billed yearly.`
                  : tier.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${host}/member-card?paid=1&tier=${tier.code}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${host}/member-card?canceled=1&tier=${tier.code}`,
      metadata: {
        type: 'membership',
        tier: tier.code,
        interval,
        userId: userId || '',
        displayName,
        source,
      },
      subscription_data: {
        metadata: {
          type: 'membership',
          tier: tier.code,
          interval,
          userId: userId || '',
        },
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
      tier: tier.code,
      interval,
    });
  } catch (err) {
    console.error('[membership-checkout]', err);
    return res.status(500).json({ error: err.message || 'Checkout failed' });
  }
};
