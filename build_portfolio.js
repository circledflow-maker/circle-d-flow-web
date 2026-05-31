const fs = require('fs');
const path = require('path');

const srcDirIrene = 'D:\\Irene Birthday';
const destDirIrene = 'D:\\circle-d-flow-web\\Assets\\Irene_Birthday';
const webIrene = '../Assets/Irene_Birthday';

// Create destination dir
if (!fs.existsSync(destDirIrene)) {
    fs.mkdirSync(destDirIrene, { recursive: true });
}

// Read Irene Birthday
let ireneFiles = [];
if (fs.existsSync(srcDirIrene)) {
    ireneFiles = fs.readdirSync(srcDirIrene).filter(f => f.toLowerCase().endsWith('.jpg'));
}

// Copy up to 30 images
const step = Math.floor(ireneFiles.length / 30) || 1;
const selectedIrene = [];
for (let i = 0; i < ireneFiles.length && selectedIrene.length < 30; i += step) {
    selectedIrene.push(ireneFiles[i]);
    const srcFile = path.join(srcDirIrene, ireneFiles[i]);
    const destFile = path.join(destDirIrene, ireneFiles[i]);
    if (!fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
    }
}

// Now scan lightroom_sync and gdrive_sync
const lrSync = 'D:\\circle-d-flow-web\\Assets\\lightroom_sync';
let lrFiles = [];
if (fs.existsSync(lrSync)) {
    lrFiles = fs.readdirSync(lrSync).filter(f => f.toLowerCase().endsWith('.jpg'));
}

const gSync = 'D:\\circle-d-flow-web\\Assets\\gdrive_sync';
let gFiles = [];
if (fs.existsSync(gSync)) {
    gFiles = fs.readdirSync(gSync).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'));
}

// Distribute to categories
const categories = {
    "Feuer": [],
    "Wasser": [],
    "Erde": [],
    "Luft": [],
    "Realm": [],
    "Artist Spotlight": [],
    "Nature": [],
    "Events": []
};

// Fill Realm
selectedIrene.forEach((f, idx) => {
    categories["Realm"].push({
        id: `realm_${idx}`,
        name: f,
        professional_name: "Irene Birthday",
        url: `${webIrene}/${f}`,
        tags: ["party", "birthday", "realm"]
    });
});

// Assign other files randomly to other categories
const allOtherFiles = [
    ...lrFiles.map(f => ({ path: `../Assets/lightroom_sync/${f}`, name: f, source: 'lr' })),
    ...gFiles.map(f => ({ path: `../Assets/gdrive_sync/${f}`, name: f, source: 'g' }))
];

const catNames = Object.keys(categories).filter(c => c !== "Realm");
allOtherFiles.forEach((fObj, idx) => {
    const cat = catNames[idx % catNames.length];
    categories[cat].push({
        id: `item_${idx}`,
        name: fObj.name,
        professional_name: "Circle D Flow",
        url: fObj.path,
        tags: ["flow", "circle"]
    });
});

const outJs = `window.PortfolioData = ${JSON.stringify(categories, null, 4)};\nwindow.ArtistVault = {};\n`;
fs.writeFileSync('D:\\circle-d-flow-web\\js\\data\\portfolio_data.js', outJs);

console.log('PortfolioData generated successfully.');
