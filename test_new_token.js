const https = require('https');
require('dotenv').config?.();

const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID || '1011847962012735';

if (!token) {
    console.error('Set WHATSAPP_ACCESS_TOKEN in .env');
    process.exit(1);
}

const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/v22.0/${phoneId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const result = JSON.parse(data);
        if (res.statusCode === 200) {
            console.log('✅ Token valid:', JSON.stringify(result, null, 2));
        } else {
            console.log(`❌ [${res.statusCode}]:`, result.error?.message || result);
        }
    });
});
req.on('error', (e) => console.error(e.message));
req.end();
