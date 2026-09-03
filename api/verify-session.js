const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const QRCode = require('qrcode');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id: sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const stripeKey = requireEnv('STRIPE_SECRET_KEY');
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = requireEnv('RESEND_API_KEY');

    const stripe = Stripe(stripeKey);
    const dbClient = createClient(supabaseUrl, supabaseServiceRole);
    const resend = new Resend(resendApiKey);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const email = session.customer_details?.email || session.metadata.email || 'unknown';
    const eventId = session.metadata.eventId || 'unknown';
    const ticketName = session.metadata.ticketName || 'Circle D Flow Ticket';
    const eventTitle = session.metadata.eventTitle || 'Circle D Flow Event';

    const { data: existing, error: existingError } = await dbClient
      .from('user_rolls')
      .select('*')
      .eq('email', email)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let shouldSendEmail = false;
    if (!existing) {
      const { error: insertError } = await dbClient.from('user_rolls').insert({
        email,
        event_id: eventId,
        ticket_name: ticketName,
        rolled_value: 0,
        scanned: false
      });
      if (insertError) throw insertError;
      shouldSendEmail = true;
    } else if (!existing.ticket_name) {
      const { error: updateError } = await dbClient
        .from('user_rolls')
        .update({ ticket_name: ticketName, scanned: false })
        .eq('id', existing.id);
      if (updateError) throw updateError;
      shouldSendEmail = true;
    }

    if (shouldSendEmail) {
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ email, eventId, ticketName }), {
        color: { dark: '#000000', light: '#ffffff' },
        width: 300,
        margin: 2
      });

      await resend.emails.send({
        from: 'Circle D Flow <onboarding@resend.dev>',
        to: [email],
        subject: `Your Ticket: ${eventTitle} - ${ticketName}`,
        html: `
        <div style="background-color: #000; color: #fff; padding: 40px; font-family: sans-serif; text-align: center;">
          <h1 style="color: #00ffcc; text-transform: uppercase; letter-spacing: 2px;">Your Ticket is Confirmed</h1>
          <p style="color: #ccc; margin-bottom: 20px;">You're officially on the list for <strong>${eventTitle}</strong>.</p>
          <div style="background-color: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; display: inline-block; margin-bottom: 30px;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Ticket Type</p>
            <p style="font-size: 18px; font-weight: bold; color: #d4af37; margin-bottom: 20px;">${ticketName}</p>
            <img src="${qrDataUrl}" alt="Ticket QR Code" style="border-radius: 8px; width: 200px; height: 200px;">
            <p style="color: #666; font-size: 11px; margin-top: 15px; text-transform: uppercase;">Present this code at the gate</p>
          </div>
          <p style="color: #888; font-size: 14px;">Stay flowing.</p>
        </div>`
      });
    }

    return res.status(200).json({
      success: true,
      email,
      eventId,
      ticketName,
      qrData: JSON.stringify({ email, eventId, ticketName })
    });
  } catch (err) {
    console.error('verify-session error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
