const fs = require('fs');

const stalls = [
    { file: 'arts_stall.html', color: '#ff4d4d' },
    { file: 'healing_stall.html', color: '#4ade80' },
    { file: 'product_stall.html', color: '#60a5fa' },
    { file: 'services_stall.html', color: '#c084fc' },
    { file: 'skills_stall.html', color: '#fcd34d' },
    { file: 'sound_stall.html', color: '#FFAE42' }
];

stalls.forEach(stall => {
    let path = 'pages/' + stall.file;
    let html = fs.readFileSync(path, 'utf8');

    // Make the left container visible on mobile
    html = html.replace(/<div class="hidden lg:flex justify-start">/g, '<div class="flex items-center gap-3 lg:gap-4 justify-start">');

    // Change "Back" button to include Orbit button
    const backBtnRegex = /<a href="marketplace\.html"[^>]*>[\s\S]*?<\/a>/;
    
    const newButtons = `
            <a href="../index.html" title="Orbit Dashboard" class="flex items-center gap-1 text-[${stall.color}]/70 hover:text-[${stall.color}] transition-colors bg-black/40 border border-[${stall.color}]/30 px-2 py-1 rounded">
                <span class="material-symbols-outlined text-sm">public</span>
                <span class="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">Orbit</span>
            </a>
            <a href="marketplace.html" title="Marketplace" class="flex items-center gap-1 text-[${stall.color}]/70 hover:text-[${stall.color}] transition-colors bg-black/40 border border-[${stall.color}]/30 px-2 py-1 rounded">
                <span class="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                <span class="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">Bazaar</span>
            </a>`;
            
    html = html.replace(backBtnRegex, newButtons);

    fs.writeFileSync(path, html);
    console.log(`Updated ${stall.file}`);
});
