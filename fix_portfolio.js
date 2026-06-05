const fs = require('fs');
let html = fs.readFileSync('pages/portfolio_anime_reality.html', 'utf8');

const oldFetch = `            // Fetch dynamic GDrive content for Artists
            fetch('/api/akademie')
                .then(res => res.json())
                .then(data => {
                    if (data && data.Artist) {
                        window.PortfolioData.Artist = data.Artist;
                        if (activeCategory === 'Luft' || searchCategory === 'Artist') {
                            renderGrid();
                        }
                    }
                })
                .catch(err => console.error('Error fetching Akademie data:', err));`;

const newFetch = `            // Load fallback AkademieData first
            if (typeof AkademieData !== 'undefined') {
                let artistFiles = [];
                let idCounter = 0;
                AkademieData.forEach(artist => {
                    if (artist.chapters) {
                        artist.chapters.forEach(chapter => {
                            chapter.files.forEach(f => {
                                artistFiles.push({
                                    id: \`gdrive_artist_\${idCounter++}\`,
                                    name: chapter.title + \`_\${idCounter}\`,
                                    professional_name: artist.name,
                                    chapter_name: chapter.title,
                                    url: f.type === 'video' ? \`https://drive.google.com/uc?export=download&id=\${f.id}\` : \`https://lh3.googleusercontent.com/d/\${f.id}=w1000\`,
                                    tags: [artist.name.toLowerCase().replace(/\\s+/g, '_'), "artist", "akademie"]
                                });
                            });
                        });
                    }
                });
                window.PortfolioData.Artist = artistFiles;
                if (activeCategory === 'Luft' || searchCategory === 'Artist') {
                    renderGrid();
                }
            }

            // Fetch dynamic GDrive content for Artists to override fallback
            fetch('/api/akademie')
                .then(res => {
                    if(!res.ok) throw new Error('API failed');
                    return res.json();
                })
                .then(data => {
                    if (data && data.Artist && data.Artist.length > 0) {
                        window.PortfolioData.Artist = data.Artist;
                        if (activeCategory === 'Luft' || searchCategory === 'Artist') {
                            renderGrid();
                        }
                    }
                })
                .catch(err => console.error('Error fetching dynamic Akademie data, using fallback:', err));`;

if (html.includes("fetch('/api/akademie')")) {
    // If it doesn't match exactly because of missing catch, try a regex
    html = html.replace(/\/\/ Fetch dynamic GDrive content for Artists[\s\S]*?renderGrid\(\);\s*\}\s*\}\s*\)(?:\s*\.catch[^\)]*\))?;/, newFetch);
    fs.writeFileSync('pages/portfolio_anime_reality.html', html);
    console.log('Fixed portfolio fetch fallback');
} else {
    console.log('Fetch not found in portfolio');
}

// ALSO fix quest_board.html Ruling Guild Select visibility
let qb = fs.readFileSync('pages/quest_board.html', 'utf8');
// Replace select tags to add bg-black text-white class to options via style
if (!qb.includes('option { background: #111')) {
    qb = qb.replace('</head>', '    <style>\n        select option { background: #111; color: #fff; }\n    </style>\n</head>');
    fs.writeFileSync('pages/quest_board.html', qb);
    console.log('Fixed quest_board.html Select Option Styles');
}

// ALSO fix codex.html, flow_area_create.html, marketplace-upload.html for the same select issue
const formPages = ['codex.html', 'flow_area_create.html', 'marketplace-upload.html'];
for (const p of formPages) {
    if(fs.existsSync(`pages/${p}`)) {
        let phtml = fs.readFileSync(`pages/${p}`, 'utf8');
        if (!phtml.includes('option { background: #111')) {
            phtml = phtml.replace('</head>', '    <style>\n        select option { background: #111; color: #fff; }\n    </style>\n</head>');
            fs.writeFileSync(`pages/${p}`, phtml);
            console.log(`Fixed ${p} Select Option Styles`);
        }
    }
}
