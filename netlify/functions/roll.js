const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, eventId } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
        }

        let rolledValue = null;

        // Connect to Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        let dbClient = null;

        if (supabaseUrl && supabaseKey) {
            const { createClient } = require('@supabase/supabase-js');
            dbClient = createClient(supabaseUrl, supabaseKey);
            
            // Check if this user already rolled for this event
            const { data: existingRoll, error: fetchError } = await dbClient
                .from('user_rolls')
                .select('rolled_value')
                .eq('email', email)
                .eq('event_id', eventId)
                .single();
                
            if (existingRoll && !fetchError) {
                // Use the existing roll!
                rolledValue = existingRoll.rolled_value;
            }
        }

        // If no existing roll found or no DB connection, generate a new one
        if (!rolledValue) {
            rolledValue = Math.floor(Math.random() * 6) + 1;
            
            // Save it to Supabase if DB connection exists
            if (dbClient) {
                await dbClient.from('user_rolls').insert([
                    { email: email, event_id: eventId, rolled_value: rolledValue }
                ]);
            }
        }
        
        // Product Logic
        let productName = 'Circle D Flow Ticket';
        if (eventId === 'criz') productName = 'Ticket: C-RIZ Listening Party';
        else if (eventId === 'circledflow') productName = 'Ticket: Circle D Flow Awakening';

        // URL construction (Netlify gives us the process.env.URL automatically)
        const siteUrl = process.env.URL || 'https://circle-d-flow-web.netlify.app';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: productName,
                        description: `Your rolled contribution of ${rolledValue}€`,
                    },
                    unit_amount: rolledValue * 100, // cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${siteUrl}/success.html?event=${eventId || ''}`,
            cancel_url: `${siteUrl}/pages/bantaba.html`,
            customer_email: email, // Auto-fills email on Stripe checkout!
            metadata: {
                eventId: eventId || 'unknown',
                email: email
            }
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                rolled: rolledValue,
                checkout_url: session.url
            })
        };

    } catch (error) {
        console.error("Roll Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Payment service unavailable.' })
        };
    }
};
