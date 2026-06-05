const fs = require('fs');
let content = fs.readFileSync('pages/quest_map.html', 'utf8');

// Find and remove the eightPillars array and the forEach loop
const start = content.indexOf('// Hardcoded 8 Pillars / Worlds');
if (start !== -1) {
    const end = content.indexOf('});\n        }', start);
    if (end !== -1) {
        content = content.slice(0, start) + content.slice(end + 6); // remove up to `});\n        }`
        fs.writeFileSync('pages/quest_map.html', content);
        console.log('Removed eightPillars from quest_map.html');
    }
}
