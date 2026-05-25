const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// --- LOAD ENV ---
// Simple manual env parser to avoid external dependencies
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
    return env;
}

const config = loadEnv();
const PORT = 3001;
const VERIFY_TOKEN = 'CDF_NEXUS_2026';

let lastMessage = null;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // 1. Meta Verification (GET)
    if (req.method === 'GET' && parsedUrl.pathname === '/') {
        const mode = parsedUrl.query['hub.mode'];
        const token = parsedUrl.query['hub.verify_token'];
        const challenge = parsedUrl.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("✅ Webhook Verified by Meta.");
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(challenge);
        } else {
            console.warn("❌ Webhook Verification Failed.");
            res.writeHead(403);
            res.end();
        }
    }

    // 2. Incoming Webhook (POST)
    else if (req.method === 'POST' && parsedUrl.pathname === '/') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log("📥 Inbound Signal Received.");
                const entry = data.entry?.[0];
                const change = entry?.changes?.[0];
                const value = change?.value;
                const message = value?.messages?.[0];

                if (message) {
                    lastMessage = { sender: message.from, text: message.text?.body || "(Media)", ts: Date.now() };
                }
                res.writeHead(200);
                res.end('EVENT_RECEIVED');
            } catch (e) {
                res.writeHead(400); res.end();
            }
        });
    }

    // 3. Outbound Notification (POST /notify)
    else if (req.method === 'POST' && parsedUrl.pathname === '/notify') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const signal = JSON.parse(body);
                console.log("🚀 Sending Outbound Notification...");
                
                const metaData = JSON.stringify({
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": config.RECIPIENT_NUMBER,
                    "type": "text",
                    "text": { "body": signal.message }
                });

                const options = {
                    hostname: 'graph.facebook.com',
                    path: `/v21.0/${config.PHONE_NUMBER_ID}/messages`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`
                    }
                };

                const metaReq = https.request(options, (metaRes) => {
                    let out = '';
                    metaRes.on('data', (d) => { out += d; });
                    metaRes.on('end', () => {
                        console.log("📤 Meta Response:", out);
                        res.writeHead(metaRes.statusCode);
                        res.end(out);
                    });
                });

                metaReq.on('error', (e) => {
                    console.error("❌ Meta Request Error:", e);
                    res.writeHead(500); res.end();
                });

                metaReq.write(metaData);
                metaReq.end();

            } catch (e) {
                res.writeHead(400); res.end();
            }
        });
    }

    // 4. Local Polling
    else if (req.method === 'GET' && parsedUrl.pathname === '/poll') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(lastMessage));
        lastMessage = null;
    }

    else {
        res.writeHead(404); res.end();
    }
});

server.listen(PORT, () => {
    console.log(`🌐 Herald Bridge Server v7.2 running at http://localhost:${PORT}`);
});
