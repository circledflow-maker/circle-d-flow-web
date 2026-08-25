const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


async function handleSupportCheckout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  try {
    const stripeClient = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { eventId, amount } = req.body || {};
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    let productName = 'Circle D Flow Support';
    if (eventId === 'criz') productName = 'Support: C-RIZ Listening Party';
    else if (eventId === 'circledflow') productName = 'Support: Circle D Flow Awakening';
    const host = process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL
      : process.env.URL || 'https://circle-d-flow-web.vercel.app';
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description:
                'Your contribution of ' + amount + '€ to support the artist and community.',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: host + '/success.html?event=' + (eventId || ''),
      cancel_url: host + '/pages/bantaba.html',
      metadata: { eventId: eventId || 'unknown', type: 'support' },
    });
    return res.status(200).json({ checkout_url: session.url });
  } catch (error) {
    console.error('Support Checkout Error:', error);
    return res.status(500).json({ error: error.message || 'Payment service unavailable.' });
  }
}

function resolvePaymentOp(req) {
  const q = (req.query && req.query.op) || '';
  if (q === 'support-checkout') return q;
  if (String(req.url || '').includes('support-checkout')) return 'support-checkout';
  return 'payment-intent';
}

module.exports = async (req, res) => {
    if (resolvePaymentOp(req) === 'support-checkout') {
        return handleSupportCheckout(req, res);
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, currency = 'eur' } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(amount) * 100),
            currency,
            automatic_payment_methods: { enabled: true },
        });

        return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('PaymentIntent Error:', error);
        return res.status(500).json({ error: error.message || 'Payment service unavailable.' });
    }
};
