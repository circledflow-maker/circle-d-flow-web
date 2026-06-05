const fs = require('fs');
const files = [
    'arts_stall.html',
    'healing_stall.html',
    'product_stall.html',
    'services_stall.html',
    'skills_stall.html',
    'sound_stall.html'
];

for (const file of files) {
    let path = 'pages/' + file;
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        // Move dialogue bubble to the top to avoid overlapping the button
        content = content.replace('top: 65%;', 'top: 15%;');
        // Also adjust the animation
        content = content.replace('transform: translateX(-50%) translateY(0);', 'transform: translateX(-50%) translateY(0);'); // The hover is what makes it appear
        fs.writeFileSync(path, content);
        console.log('Fixed dialogue-bubble in ' + file);
    }
}
