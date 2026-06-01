const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join('D:', 'circle-d-flow-web', 'Assets');
const DATA_FILE = path.join('D:', 'circle-d-flow-web', 'js', 'data', 'portfolio_data.js');

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.mp4'].includes(ext)) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const allAssets = getAllFiles(ASSETS_DIR);
const categories = {
    Feuer: [],
    Wasser: [],
    Erde: [],
    Luft: [],
    Realm: [],
    Artist: [],
    Nature: [],
    Event: []
};

// Organize
let idCounter = 0;

allAssets.forEach(file => {
    const normalized = file.replace(/\\/g, '/');
    const relative = normalized.split('/Assets/')[1];
    if (!relative) return;
    
    const url = `../Assets/${relative}`;
    const name = path.basename(file);
    const folder = path.basename(path.dirname(file)).toLowerCase();
    
    let targetCat = null;
    let profName = name;

    if (folder.includes('irene_birthday')) {
        targetCat = 'Realm';
        profName = 'Irene Birthday';
    } else if (folder.includes('c_riz_portfolio')) {
        targetCat = 'Artist';
        profName = 'C-Riz';
    } else if (folder.includes('ig_30_days')) {
        targetCat = 'Event';
        profName = 'IG 30 Days';
    } else if (folder.includes('youtube_sessions')) {
        targetCat = 'Luft';
        profName = 'YouTube Sessions';
    } else if (folder.includes('live_ingest')) {
        targetCat = 'Nature';
        profName = 'Live Ingest';
    } else if (folder.includes('lightroom_sync')) {
        const r = Math.random();
        if (r < 0.5) targetCat = 'Feuer';
        else targetCat = 'Erde';
        profName = 'Flow Session';
    } else {
        targetCat = 'Wasser';
        profName = 'Asset';
    }

    if (targetCat) {
        if (categories[targetCat].length < 30) {
            categories[targetCat].push({
                id: `${targetCat.toLowerCase()}_${idCounter++}`,
                name: name,
                professional_name: profName,
                url: url,
                tags: [targetCat.toLowerCase(), "flow"]
            });
        }
    }
});

// Force populate any empty categories
Object.keys(categories).forEach(cat => {
    if (categories[cat].length === 0) {
        categories[cat] = categories['Wasser'].slice(0, 10).map((item, idx) => ({
            ...item,
            id: `${cat.toLowerCase()}_fallback_${idx}`,
            tags: [cat.toLowerCase(), "fallback"]
        }));
    }
});

const content = `window.PortfolioData = ${JSON.stringify(categories, null, 4)};`;
fs.writeFileSync(DATA_FILE, content, 'utf8');
console.log('Portfolio data regenerated successfully!');
