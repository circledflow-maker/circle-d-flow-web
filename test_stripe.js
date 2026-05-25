const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) env[key.trim()] = values.join('=').trim();
    });
    return env;
}

const config = loadEnv();
const stripe = require('stripe')(config.STRIPE_SECRET_KEY);

async function test() {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Test' },
                    unit_amount: 400,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `http://localhost:3000/success.html`,
            cancel_url: `http://localhost:3000/dice.html`,
        });
        console.log("Success:", session.url);
    } catch (error) {
        console.error("EXACT STRIPE ERROR:", error.message);
    }
}

test();
