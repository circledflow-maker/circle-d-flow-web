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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
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

      // Save to Supabase
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
          } else {
              // Update ticket name if it was a dice ticket (dice ticket doesn't set ticket_name yet)
              if (!existing.ticket_name) {
                  await dbClient.from('user_rolls').update({ ticket_name: ticketName, scanned: false }).eq('id', existing.id);
              }
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
