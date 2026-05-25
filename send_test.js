const https = require('https');

// Configuration from your api_config.js
const config = {
    apiUrl: "https://graph.facebook.com/v22.0",
    phoneId: "1011847962012735",
    accessToken: "EAANdoxVBbuYBRNuLSHi0hvwYsrbGLiAFZAg1GXqg0DrO97cmhHCvmjXmDVxvZAwiUj3R2Y6Wi8tUliXM5NqKLx0XkpY9LdHGUTfvgZBViKoYSBAecObKfI85KOv5oKIZAjoC2gmJZBAqv3x8Bcphw34EdrTFILFolMGoyy1MuqzXgZBbwMZB8mi0y2qXtguorXhHpLxzbQWVrgykpFLGloH67ThHkaTzCQByqZA1MAuS8vdZBhuVd9GPq3CbsworAW2SWobhxlvnB1dDGj0UPmG2V",
    recipientPhone: "351912828940" // Meta requires just numbers
};

const payload = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: config.recipientPhone,
    type: "text",
    text: { body: "🚀 Circle D Flow: Test Signal Received! We are now ACTIVE via the Local Bridge. 🌊" }
});

const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/v22.0/${config.phoneId}/messages`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const result = JSON.parse(data);
        if (res.statusCode === 200) {
            console.log("✅ TEST SUCCESSFUL: Message sent to WhatsApp!");
            console.log("ID:", result.messages[0].id);
        } else {
            console.error("❌ TEST FAILED:", result.error?.message || result);
        }
    });
});

req.on('error', (e) => { console.error("Error:", e.message); });
req.write(payload);
req.end();
