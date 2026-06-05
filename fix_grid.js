const fs = require('fs');
let html = fs.readFileSync('pages/marketplace.html', 'utf8');

// Replace Desktop grid
html = html.replace(/grid-template-areas:[\s\S]*?grid-template-columns: 1fr 1\.5fr 1fr;[\s\S]*?grid-template-rows: 1fr 1fr 1fr;/g, `grid-template-areas: 
                "center center"
                "arts skills"
                "sounds healing"
                "products services";
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto 1fr 1fr 1fr;
            justify-items: center;
            align-items: center;`);

// Replace Mobile grid
html = html.replace(/grid-template-areas:[\s\S]*?grid-template-columns: 1fr 1fr !important;/g, `grid-template-areas: 
                    "center center"
                    "arts skills"
                    "sounds healing"
                    "products services" !important;
                grid-template-columns: 1fr 1fr !important;`);

fs.writeFileSync('pages/marketplace.html', html);
console.log('Fixed bazaar grid layout');
