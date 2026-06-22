const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'Stripe configured improperly' });

  const supabaseUrl = process.env.SUPABASE_URL || "https://agkmbaephgsnunlarntm.supabase.co";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_VwT4qFpNCgNizSXMILBcKQ_aevHvWvM";
  let dbClient = null;
  if (supabaseUrl && supabaseKey) {
      dbClient = createClient(supabaseUrl, supabaseKey);
  }

  const stripe = Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      const email = session.customer_details?.email || session.metadata.email || 'unknown';
      const eventId = session.metadata.eventId || 'unknown';
      const ticketName = session.metadata.ticketName || 'Circle D Flow Ticket';
      const eventTitle = session.metadata.eventTitle || 'Circle D Flow Event';

      // Save to Supabase
      let shouldSendEmail = false;
      if (dbClient) {
          // Check if already exists to avoid duplicates (dice already inserted)
          const { data: existing } = await dbClient.from('user_rolls')
            .select('*')
            .eq('email', email)
            .eq('event_id', eventId)
            .single();

          if (!existing) {
              await dbClient.from('user_rolls').insert([
                  { email: email, event_id: eventId, ticket_name: ticketName, scanned: false }
              ]);
              shouldSendEmail = true;
          } else {
              // Update ticket name if it was a dice ticket (dice ticket doesn't set ticket_name yet)
              if (!existing.ticket_name) {
                  await dbClient.from('user_rolls').update({ ticket_name: ticketName, scanned: false }).eq('id', existing.id);
                  shouldSendEmail = true;
              }
          }
      }

      if (shouldSendEmail) {
          try {
              const { Resend } = require('resend');
              const QRCode = require('qrcode');
              const resend = new Resend(process.env.RESEND_API_KEY || "re_4EN5hgyf_52v3D6JTJVMRQ1GW5Ds5gwkw");
              
              const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
                  email, eventId, ticketName
              }), {
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
                  </div>
                  `
              });
              console.log("Stripe Ticket email sent successfully to", email);
          } catch (emailErr) {
              console.error("Failed to send Stripe Ticket email:", emailErr);
          }
      }

      return res.status(200).json({ 
          success: true, 
          email: email,
          eventId: eventId,
          ticketName: ticketName,
          qrData: JSON.stringify({ email, eventId, ticketName }) 
      });
    } else {
      return res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
