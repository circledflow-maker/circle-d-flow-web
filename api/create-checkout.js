const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  try {
    const { priceId } = req.body;

    const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.SITE_URL || 'https://circle-d-flow-web.vercel.app');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${host}/success.html`,
      cancel_url: `${host}/pages/marketplace.html`,
    });

    return res.status(200).json({ id: session.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
