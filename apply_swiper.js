const fs = require('fs');

const files = ['skills_stall.html', 'sounds_stall.html', 'healing_stall.html', 'products_stall.html', 'taste_stall.html'];

for (let f of files) {
    const p = 'pages/' + f;
    if (!fs.existsSync(p)) continue;
    
    let c = fs.readFileSync(p, 'utf8');
    
    if (!c.includes('swiper-bundle.min.css')) {
        c = c.replace('</head>', '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />\n</head>');
    }
    
    if (!c.includes('swiper-bundle.min.js')) {
        c = c.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', '<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>\n    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    }
    
    const prefix = f.split('_')[0];
    const gridId = prefix + '-grid';
    
    // Replace the grid container
    const gridRegex = new RegExp(`<div id="${gridId}" class="[^"]*">`, 'g');
    c = c.replace(gridRegex, `<div class="swiper ${prefix}Swiper w-full pb-10" style="overflow: hidden;">\n                <div id="${gridId}" class="swiper-wrapper">`);
    
    // Also we need to add the closing div for swiper, which we can do by finding the end of the grid. 
    // BUT regex is hard for nested divs. Since the grid only contains the placeholder initially:
    // Let's just use string replacement for the placeholder.
    c = c.replace(/<div class="col-span-full[^"]*"([^>]*)>/, `<div class="swiper-slide clay-slab text-center p-10 opacity-50 w-full flex items-center justify-center"$1>`);
    
    // And when the data is populated in JS
    c = c.replace(/div\.className = 'clay-slab flex flex-col sm:flex-row gap-6 items-center';/g, `div.className = 'swiper-slide clay-slab flex flex-col sm:flex-row gap-6 items-center h-auto';`);
    c = c.replace(/<div class="flex-1 w-full">/g, `<div class="flex-1 w-full flex flex-col h-full">`);
    
    // Swiper initialization
    if (!c.includes(`new Swiper('.${prefix}Swiper'`)) {
        c = c.replace(/grid\.appendChild\(div\);\n\s*}\);/, `grid.appendChild(div);\n            });\n\n            new Swiper('.${prefix}Swiper', {\n                slidesPerView: 1.1,\n                spaceBetween: 16,\n                breakpoints: {\n                    1024: {\n                        slidesPerView: 2,\n                        spaceBetween: 24,\n                    }\n                }\n            });`);
    }

    // Add closing div for swiper container
    // The placeholder is inside `arts-grid`. The grid is closed right after the placeholder.
    // The placeholder closing is `</div>`, then grid closing is `</div>`.
    // Wait, let's just do it manually for the other files if this is too complex.
    
    fs.writeFileSync(p, c);
    console.log('Updated ' + f);
}
