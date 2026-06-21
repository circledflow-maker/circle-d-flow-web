const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { email, eventId, existingRoll, basePrice } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const priceMultiplier = parseInt(basePrice) || 1;

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
                rolledValue = existingRoll.rolled_value;
            }
        }

        // If no existing roll found or no DB connection, generate a new one
        if (!rolledValue) {
            if (existingRoll) {
                rolledValue = parseInt(existingRoll);
            }
            if (!rolledValue || isNaN(rolledValue) || rolledValue < 1 || rolledValue > 6) {
                rolledValue = Math.floor(Math.random() * 6) + 1;
            }
            
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

        // URL construction (Vercel uses VERCEL_URL)
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.URL || 'https://circle-d-flow-web.vercel.app');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: productName,
                        description: `Your rolled contribution of ${rolledValue} times base price ${priceMultiplier}€`,
                    },
                    unit_amount: rolledValue * priceMultiplier * 100, // cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${host}/success.html?event=${eventId || ''}`,
            cancel_url: `${host}/pages/bantaba.html`,
            customer_email: email,
            metadata: {
                eventId: eventId || 'unknown',
                email: email
            }
        });

        return res.status(200).json({
            email: email,
            rolled: rolledValue,
            checkout_url: session.url
        });

    } catch (error) {
        console.error("Roll Function Error:", error);
        return res.status(500).json({ error: error.message || 'Payment service unavailable.' });
    }
};
