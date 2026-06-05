const fs = require('fs');

// 1. Fix Portfolio German text
let html = fs.readFileSync('pages/portfolio_anime_reality.html', 'utf8');
html = html.replace('Diese Woche im Fokus:', 'This Week in Focus:');
html = html.replace('title="Luft"', 'title="Air"');
html = html.replace('title="Erde"', 'title="Earth"');
html = html.replace('title="Feuer"', 'title="Fire"');
html = html.replace('title="Wasser"', 'title="Water"');
html = html.replace('title="Akademie"', 'title="Academy"');
fs.writeFileSync('pages/portfolio_anime_reality.html', html);
console.log('Fixed German text in portfolio_anime_reality.html');

// 2. Fix the Select background color
const filesToFix = ['marketplace-upload.html', 'quest_board.html', 'flow_area_create.html'];
for (const file of filesToFix) {
    let content = fs.readFileSync('pages/' + file, 'utf8');
    // Add select background color
    if (!content.includes('select { color: white; background: #111; }')) {
        content = content.replace('<style>', '<style>\n        select { color: white; background: #111; }');
        fs.writeFileSync('pages/' + file, content);
        console.log('Fixed select background in ' + file);
    }
}
