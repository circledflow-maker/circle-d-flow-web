const fs = require('fs');

const stalls = [
    { file: 'arts_stall.html', name: 'Arts', color: '#ff4d4d' },
    { file: 'healing_stall.html', name: 'Healing', color: '#4ade80' },
    { file: 'product_stall.html', name: 'Products', color: '#60a5fa' },
    { file: 'services_stall.html', name: 'Services', color: '#c084fc' },
    { file: 'skills_stall.html', name: 'Skills', color: '#fcd34d' },
    { file: 'sound_stall.html', name: 'Sound', color: '#FFAE42' }
];

stalls.forEach(stallObj => {
    const path = `pages/${stallObj.file}`;
    let html = fs.readFileSync(path, 'utf8');

    // 1. Move dialogue bubble to the bottom of the merchant side
    html = html.replace(/\.dialogue-bubble\s*{[^}]*}/, `.dialogue-bubble {
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid ${stallObj.color};
            padding: 12px 20px;
            border-radius: 10px;
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 400px;
            z-index: 30;
            font-size: 0.85rem;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.8);
            color: #ddd;
        }`);

    // Adjust merchant text slightly up to make room
    html = html.replace(/bottom-10 left-1\/2/g, 'bottom-20 left-1/2');

    // 2. Add Switch Guild dropdown in Header
    // Find the header structure:
    // <a href="marketplace.html" class="text-white hover:text-[#FFAE42] flex items-center gap-2">
    //     <span class="material-symbols-outlined">arrow_back</span>
    // </a>
    // We can insert a <select> next to the title.
    
    // Create the options
    const options = stalls.map(s => {
        return `<option value="${s.file}" ${s.file === stallObj.file ? 'selected' : ''}>${s.name} Guild</option>`;
    }).join('\\n');

    const selectHTML = `
        <div class="relative ml-4">
            <select onchange="window.location.href=this.value" class="bg-black/50 border border-[${stallObj.color}]/30 text-[${stallObj.color}] text-xs py-1 px-2 rounded outline-none cursor-pointer appearance-none">
                ${options}
            </select>
            <span class="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-[${stallObj.color}]">expand_more</span>
        </div>
    `;

    // Insert after the title in header (like `<h1 class="text-xl font-cinzel tracking-widest text-[#FFAE42]">SOUND ATELIER</h1>`)
    // Look for <h1 class="text-xl font-cinzel
    const h1Regex = /(<h1[^>]*>.*?<\/h1>)/i;
    if(html.match(h1Regex) && !html.includes('<select onchange="window.location.href=this.value"')) {
        html = html.replace(h1Regex, `$1 ${selectHTML}`);
    }

    fs.writeFileSync(path, html);
    console.log(`Updated UI for ${stallObj.file}`);
});
