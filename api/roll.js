const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function resolveAmountCents(rolledValue, { formula, basePrice, eventId }) {
    const mode = String(formula || '').toLowerCase();
    const calypso = mode === 'calypso' || (eventId === 'criz' && !basePrice);
    if (calypso) {
        return (10 + rolledValue * 5) * 100;
    }
    const priceMultiplier = parseInt(basePrice, 10) || 1;
    return rolledValue * priceMultiplier * 100;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { email, eventId, existingRoll, basePrice, formula } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        let rolledValue = null;
        let alreadyRolled = false;

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        let dbClient = null;

        if (supabaseUrl && supabaseKey) {
            const { createClient } = require('@supabase/supabase-js');
            dbClient = createClient(supabaseUrl, supabaseKey);

            const { data: prior, error: fetchError } = await dbClient
                .from('user_rolls')
                .select('rolled_value')
                .eq('email', email)
                .eq('event_id', eventId)
                .single();

            if (prior && !fetchError) {
                rolledValue = prior.rolled_value;
                alreadyRolled = true;
            }
        }

        if (!rolledValue) {
            if (existingRoll) {
                rolledValue = parseInt(existingRoll, 10);
            }
            if (!rolledValue || isNaN(rolledValue) || rolledValue < 1 || rolledValue > 6) {
                const crypto = require('crypto');
                const salt = process.env.STRIPE_SECRET_KEY;
                if (!salt) {
                    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
                }
                const hash = crypto.createHash('md5').update(email.toLowerCase().trim() + eventId + salt).digest('hex');
                const hashInt = parseInt(hash.substring(0, 8), 16);
                rolledValue = (hashInt % 6) + 1;
            }

            if (dbClient) {
                await dbClient.from('user_rolls').insert([
                    { email: email, event_id: eventId, rolled_value: rolledValue }
                ]);
            }
        }

        const amountCents = resolveAmountCents(rolledValue, { formula, basePrice, eventId });
        const amountEur = amountCents / 100;

        let productName = 'Circle D Flow Ticket';
        if (eventId === 'criz') productName = 'Ticket: C-RIZ Listening Party';
        else if (eventId === 'circledflow') productName = 'Ticket: Circle D Flow Awakening';

        const host = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : (process.env.URL || 'https://circle-d-flow-web.vercel.app');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: productName,
                        description: `Destiny roll ${rolledValue} · entry ${amountEur}€`,
                    },
                    unit_amount: amountCents,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${host}/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${host}/pages/bantaba.html`,
            customer_email: email,
            metadata: {
                eventId: eventId || 'unknown',
                email: email,
                formula: formula || (eventId === 'criz' ? 'calypso' : 'multiply'),
                rolled: String(rolledValue)
            }
        });

        return res.status(200).json({
            email: email,
            rolled: rolledValue,
            alreadyRolled,
            amount_cents: amountCents,
            amount_eur: amountEur,
            checkout_url: session.url
        });

    } catch (error) {
        console.error('Roll Function Error:', error);
        return res.status(500).json({ error: error.message || 'Payment service unavailable.' });
    }
};
