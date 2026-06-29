const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, currency = 'eur' } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(amount) * 100),
            currency,
            automatic_payment_methods: { enabled: true },
        });

        return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('PaymentIntent Error:', error);
        return res.status(500).json({ error: error.message || 'Payment service unavailable.' });
    }
};
