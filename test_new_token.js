const https = require('https');

const token = "EAANdoxVBbuYBRNuLSHi0hvwYsrbGLiAFZAg1GXqg0DrO97cmhHCvmjXmDVxvZAwiUj3R2Y6Wi8tUliXM5NqKLx0XkpY9LdHGUTfvgZBViKoYSBAecObKfI85KOv5oKIZAjoC2gmJZBAqv3x8Bcphw34EdrTFILFolMGoyy1MuqzXgZBbwMZB8mi0y2qXtguorXhHpLxzbQWVrgykpFLGloH67ThHkaTzCQByqZA1MAuS8vdZBhuVd9GPq3CbsworAW2SWobhxlvnB1dDGj0UPmG2V";
const phoneId = "1011847962012735";

async function testToken() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'graph.facebook.com',
            port: 443,
            path: `/v22.0/${phoneId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log(`✅ Success:`, JSON.stringify(result, null, 2));
                        resolve(true);
                    } else {
                        console.log(`❌ Failed [${res.statusCode}]:`, result.error?.message || result);
                        resolve(false);
                    }
                } catch (e) {
                    console.log(`❌ Failed to parse response:`, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Error testing token:`, e.message);
            resolve(false);
        });

        req.end();
    });
}

testToken();
