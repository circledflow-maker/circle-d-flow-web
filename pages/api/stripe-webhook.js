// pages/api/stripe-webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';
import QRCode from 'qrcode';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Stripe webhook endpoint to handle successful checkout.
 * Generates a QR code linking to a visual page and emails it to the purchaser.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { eventId, email, ticketName } = session.metadata || {};
    const userEmail = email || session.customer_details?.email;
    if (!eventId) {
      console.warn('No eventId in metadata, skipping QR generation');
      return res.json({ received: true });
    }

    // Build a URL that the QR code will point to (a visual page for the ticket).
    const qrTargetUrl = `${process.env.BASE_URL}/pages/qr_view.html?eventId=${eventId}&sessionId=${session.id}`;

    // Generate QR code as data URL (PNG).
    let qrDataUrl;
    try {
      qrDataUrl = await QRCode.toDataURL(qrTargetUrl);
    } catch (err) {
      console.error('QR generation failed', err);
      return res.status(500).json({ error: 'QR generation error' });
    }

    // Store QR info in Supabase (optional, for later lookup).
    try {
      await supabase.from('qr_codes').upsert({
        session_id: session.id,
        event_id: eventId,
        ticket_name: ticketName || 'Ticket',
        qr_url: qrTargetUrl,
        qr_image: qrDataUrl,
        email: userEmail,
        created_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
    } catch (err) {
      console.error('Supabase upsert failed', err);
    }

    // Send email with QR code.
    try {
      await resend.emails.send({
        from: 'no-reply@circle-d-flow.com',
        to: userEmail,
        subject: `Your ticket for ${ticketName || 'event'}`,
        html: `<p>Thank you for your purchase! Here is your ticket QR code. You can also view it online <a href="${qrTargetUrl}">here</a>.</p><img src="${qrDataUrl}" alt="QR Code" style="width:200px;height:auto;"/>`,
      });
    } catch (err) {
      console.error('Resend email failed', err);
    }
  }

  res.json({ received: true });
}
