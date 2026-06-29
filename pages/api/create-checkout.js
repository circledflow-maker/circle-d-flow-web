import Stripe from 'stripe';
import { json } from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { ticketName, price, quantity, eventId, eventTitle, email } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: ticketName },
          unit_amount: Math.round(price * 100),
        },
        quantity: quantity || 1,
      }],
      mode: 'payment',
      success_url: `${process.env.BASE_URL}/pages/create_impact.html?id=${eventId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/pages/create_impact.html?id=${eventId}`,
      metadata: { eventId, eventTitle, email },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Create checkout error:', err);
    res.status(500).json({ error: err.message });
  }
}
