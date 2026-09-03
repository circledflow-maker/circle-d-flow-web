const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { eventId, amount } = req.body;

        if (!amount || isNaN(amount) || amount < 1) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // Product Logic
        let productName = 'Circle D Flow Support';
        if (eventId === 'criz') productName = 'Support: C-RIZ Listening Party';
        else if (eventId === 'circledflow') productName = 'Support: Circle D Flow Awakening';

        // URL construction (Vercel uses VERCEL_URL)
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.URL || 'https://circle-d-flow-web.vercel.app');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: productName,
                        description: `Your contribution of ${amount}€ to support the artist and community.`,
                    },
                    unit_amount: amount * 100, // cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${host}/success.html?event=${eventId || ''}`,
            cancel_url: `${host}/pages/bantaba.html`,
            metadata: {
                eventId: eventId || 'unknown',
                type: 'support'
            }
        });

        return res.status(200).json({
            checkout_url: session.url
        });

    } catch (error) {
        console.error("Support Checkout Error:", error);
        return res.status(500).json({ error: error.message || 'Payment service unavailable.' });
    }
};
