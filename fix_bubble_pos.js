const fs = require('fs');

const stalls = [
    'arts_stall.html', 'healing_stall.html', 'product_stall.html',
    'services_stall.html', 'skills_stall.html', 'sound_stall.html'
];

stalls.forEach(stall => {
    const path = `pages/${stall}`;
    let html = fs.readFileSync(path, 'utf8');

    html = html.replace(/\.dialogue-bubble\s*{[^}]*}/, `.dialogue-bubble {
            background: rgba(62, 39, 35, 0.95);
            border: 2px solid #FFAE42;
            padding: 10px 15px;
            border-radius: 15px;
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            width: 85%;
            max-width: 380px;
            z-index: 10;
            font-size: 0.9rem;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }`);

    fs.writeFileSync(path, html);
    console.log(`Updated ${stall}`);
});
