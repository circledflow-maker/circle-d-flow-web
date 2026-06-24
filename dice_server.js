const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// --- LOAD ENV ---
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) env[key.trim()] = values.join('=').trim();
    });
    return env;
}
const config = loadEnv();

const stripe = require('stripe')(config.STRIPE_SECRET_KEY || 'sk_test_mock');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (html, css, js, assets)
app.use(express.static(__dirname));

// Path to our mock database
const DB_FILE = path.join(__dirname, 'rolls.json');

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// Helper to read DB
const readDB = () => {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Stripe Checkout URL generator
const generateStripeUrl = async (amount, eventId) => {
    try {
        let productName = 'Circle D Flow Ticket';
        if (eventId === 'criz') productName = 'Ticket: C-RIZ Listening Party';
        else if (eventId === 'circledflow') productName = 'Ticket: Circle D Flow Awakening';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Removed paypal as it is not activated in the Stripe dashboard yet
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: productName,
                        description: `Your rolled contribution of ${amount}€`,
                        // images: ['https://yourdomain.com/logo.jpg'] // Optional
                    },
                    unit_amount: amount * 100, // Stripe expects amounts in cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `https://circle-d-flow.loca.lt/success.html?event=${eventId || ''}`,
            cancel_url: `https://circle-d-flow.loca.lt/pages/bantaba.html`,
            metadata: {
                eventId: eventId || 'unknown'
            }
        });
        return session.url;
    } catch (error) {
        console.error("Stripe Session Error:", error);
        throw error;
    }
};

// Roll Endpoint
app.post('/roll', async (req, res) => {
    const { email, eventId } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const db = readDB();

    // 1. Anti-Cheat Check: Has this email rolled already?
    if (db[email]) {
        console.log(`[Anti-Cheat] ${email} tried to reroll. Sending existing data.`);
        return res.json({
            email: email,
            rolled: db[email].rolled,
            checkout_url: db[email].checkout_url,
            alreadyRolled: true
        });
    }

    // 2. Generate Roll (1 to 6)
    const rolledValue = Math.floor(Math.random() * 6) + 1;
    
    // 3. Generate Checkout Link
    let checkoutUrl;
    try {
        checkoutUrl = await generateStripeUrl(rolledValue, eventId);
    } catch (err) {
        return res.status(500).json({ error: 'Payment service unavailable. Please check Stripe Keys.' });
    }

    // 4. Save to DB
    db[email] = {
        rolled: rolledValue,
        checkout_url: checkoutUrl,
        timestamp: new Date().toISOString()
    };
    writeDB(db);

    console.log(`[New Roll] ${email} rolled a ${rolledValue}`);

    // 5. Send Response
    res.json({
        email: email,
        rolled: rolledValue,
        checkout_url: checkoutUrl,
        alreadyRolled: false
    });
});

app.listen(PORT, () => {
    console.log(`🎲 Dice Server running on http://localhost:${PORT}`);
    console.log(`🛡️ Anti-Cheat Database located at ${DB_FILE}`);
});

// Create Payment Intent for In-Game 3D Overlay (Marketplace)
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'eur' } = req.body;
        // Basic validation
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents and ensure integer
            currency: currency,
            // automatic_payment_methods is enabled by default in newer API versions
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Stripe PaymentIntent Error:", error);
        res.status(500).json({ error: error.message });
    }
});
