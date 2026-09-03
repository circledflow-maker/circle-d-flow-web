const Stripe = require('stripe');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'Stripe Secret Key is not configured on the server.' });
  }

  const stripe = Stripe(stripeKey);

  try {
    const { ticketName, price, quantity, eventId, eventTitle } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${eventTitle} - ${ticketName}`,
              description: `Access Pass for Circle D Flow Event`,
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pages/create_impact?id=${eventId}&canceled=true`,
      metadata: {
        eventId: eventId,
        ticketName: ticketName,
        eventTitle: eventTitle || "Circle D Flow Event"
      }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
