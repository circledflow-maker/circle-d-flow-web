const fs = require('fs');

// 1. Fix Akademie Video Logic
let ak = fs.readFileSync('pages/akademie.html', 'utf8');

// Change the preview URL generation to uc?export=download
ak = ak.replace(/media_url: f\.type === 'video' \? `https:\/\/drive\.google\.com\/file\/d\/\$\{f\.id\}\/preview`/g, "media_url: f.type === 'video' ? `https://drive.google.com/uc?export=download&id=${f.id}`");

// Fix the HTML generation logic so videos don't become <img> tags
const oldIfs = `if (p.media_url.includes('drive.google.com/file/d/')) {
                             const preview = p.media_url.replace(/\\/view.*$/, '/preview');
                             mediaHtml = \`<iframe src="\${preview}" class="w-full h-[40vh] md:w-[80%] md:h-[60vh] mx-auto border border-[#333] mb-4"></iframe>\`;
                        } else if (p.media_type === 'image' || p.media_url.match(/\\.(jpeg|jpg|gif|png|webp)$/i) || p.media_url.includes('uc?export=download')) {
                             mediaHtml = \`<img src="\${p.media_url}" class="mb-4 object-contain max-h-[60vh] max-w-full mx-auto border border-[#333]">\`;
                        } else {
                             mediaHtml = \`<video src="\${p.media_url}" controls class="max-h-[60vh] max-w-full mx-auto mb-4 border border-[#333]"></video>\`;
                        }`;

const newIfs = `if (p.media_type === 'video') {
                             mediaHtml = \`<video src="\${p.media_url}" controls playsinline preload="metadata" class="max-h-[60vh] max-w-full mx-auto mb-4 border border-[#333] bg-black"></video>\`;
                        } else if (p.media_url.includes('drive.google.com/file/d/')) {
                             const preview = p.media_url.replace(/\\/view.*$/, '/preview');
                             mediaHtml = \`<iframe src="\${preview}" allow="autoplay" allowfullscreen class="w-full h-[40vh] md:w-[80%] md:h-[60vh] mx-auto border border-[#333] mb-4"></iframe>\`;
                        } else {
                             mediaHtml = \`<img src="\${p.media_url}" class="mb-4 object-contain max-h-[60vh] max-w-full mx-auto border border-[#333]" loading="lazy">\`;
                        }`;

ak = ak.replace(oldIfs, newIfs);
fs.writeFileSync('pages/akademie.html', ak);
console.log('Fixed akademie.html');

// 2. Fix Stalls (Merchant Image Height + Remove Burger Menu)
const stalls = ['arts_stall.html', 'healing_stall.html', 'product_stall.html', 'services_stall.html', 'skills_stall.html', 'sound_stall.html', 'marketplace-stall.html'];

for (let s of stalls) {
    if (!fs.existsSync(`pages/${s}`)) continue;
    let html = fs.readFileSync(`pages/${s}`, 'utf8');

    // Remove Burger Menu HTML
    const burgerHtml = /<!-- Mobile Header & Burger Menu -->[\s\S]*?<\/div>\s*<!-- Fullscreen Mobile Menu Overlay -->[\s\S]*?<\/div>/;
    html = html.replace(burgerHtml, '');

    // Constrain merchant image height on mobile
    if (html.includes('.merchant-img {')) {
        const cssFix = `
            .merchant-img {
                height: 45vh;
                max-height: 350px;
            }`;
        
        // Add inside the mobile media query
        if (!html.includes('height: 45vh;')) {
            html = html.replace(/@media \(max-width: 768px\) \{/, `@media (max-width: 768px) {${cssFix}`);
        }
    }

    fs.writeFileSync(`pages/${s}`, html);
    console.log(`Fixed ${s}`);
}
