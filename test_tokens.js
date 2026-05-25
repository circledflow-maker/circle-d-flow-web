const https = require('https');

const tokens = [
    { name: "App 124...", token: "EAARv86rVvwcBRNZCSCbrFgKLv2jorflfk4Ijc7HuZBISK0vEf4VHhWkd0AZAsWGgDZCcHWSXENFeIYJTHuV4TkqyR0obdRj5CXVUHtwjDpcZAEwL9QsgZBoZBt1DHigxJvPv7aa9R8SDvbZCOFik9M6tIB4jmExrZBvSD88GSOKW3YjopXqjjrIN8gZC0HpcsIyUH2LaZBl4NHRrSHZCuZAEZC3j0jaq7Sj7rzrBzTvwswVUrQDXcWjM288MWY5O7Hxuqq3zheKYTsrG30ZBTZALoLM8SL80" },
    { name: "App 947...", token: "EAANdoxVBbuYBRFH2e7IPrLSgKi3CONZBH1taVHZAMhhCMuwG6ZB2iNHnEeTcGbW3RB6scQfZCrbtbrAMkKnqpnZAOTygbgISlEGSsiS2pevkbiSENt4QaTEQZA0XZChEowZBLLGwxlOZCSuFJgIVatmCNl5yqRNbgsMeB359XbdbBWXRyZA2hfqR2DzaXZA0SXD6LvkYsoazxcLd6PRiZAH4WFjZASPIgy7bwJgsmziEfcZCJUpcUrall79CG7hjL22hxwBsIczN7qnO9Fl6R8siMLXIYVmgZDZD" }
];

const phoneId = "1011847962012735";

async function testToken(item) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'graph.facebook.com',
            port: 443,
            path: `/v22.0/${phoneId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${item.token}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (res.statusCode === 200) {
                    console.log(`✅ Success for ${item.name}:`, JSON.stringify(result, null, 2));
                    resolve(true);
                } else {
                    console.log(`❌ Failed for ${item.name} [${res.statusCode}]:`, result.error?.message || result);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Error testing ${item.name}:`, e.message);
            resolve(false);
        });

        req.end();
    });
}

async function run() {
    for (const item of tokens) {
        await testToken(item);
    }
}

run();
