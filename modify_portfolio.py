import re

with open(r'D:\circle-d-flow-web\pages\portfolio_anime_reality.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Quest Board
quest_board_start = content.find('<!-- Quest Board & Upcoming Events Section -->')
quest_board_end = content.find('<!-- Policy Detailed & Outro -->')

if quest_board_start != -1 and quest_board_end != -1:
    content = content[:quest_board_start] + content[quest_board_end:]

# 2. Refactor JavaScript
# First, change 'masonryGrid' to 'masonry'
content = content.replace('masonryGrid.appendChild(div);', 'masonry.appendChild(div);')

# Now let's find the activeCategory parsing and refactor it into a loadCategory function
js_to_replace = '''let activeCategory = urlParams.get('cat') || "Feuer";'''
new_js = '''let activeCategory = urlParams.get('cat') || "Feuer";

window.loadCategory = function(catName) {
    activeCategory = catName;
    renderTabs();
    updateWeeklyFlowBanner();
    renderGrid();
    
    // Smooth scroll to top of grid for mobile
    const gridEl = document.getElementById('photography-masonry');
    if(gridEl) {
        window.scrollTo({
            top: gridEl.offsetTop - 150,
            behavior: 'smooth'
        });
    }
    
    // Also close the radial menu after clicking
    const radialMenu = document.getElementById('radial-menu');
    const triggerBtn = document.getElementById('radial-trigger');
    if(radialMenu && !radialMenu.classList.contains('pointer-events-none')) {
        // Trigger a click to close it
        triggerBtn.click();
    }
};

function renderGrid() {
    const grid = document.getElementById('portfolio-grid');
    const masonry = document.getElementById('photography-masonry');
    
    const rings = ['Feuer', 'Wasser', 'Erde', 'Luft', 'Realm', 'Artist', 'Nature', 'Event'];
    const keywordMap = {
        'feuer': ['fire', 'jam', 'red', 'action', 'heat', 'party', 'jamsessions', 'burn', 'energy', 'stage'],
        'wasser': ['water', 'fluid', 'blue', 'sea', 'river', 'calm', 'flow', 'surf', 'soundwaves', 'ocean', 'wave'],
        'erde': ['earth', 'ground', 'green', 'tree', 'mountain', 'street', 'city', 'urban', 'castle', 'stone', 'root'],
        'luft': ['air', 'sky', 'wind', 'cloud', 'jump', 'fly', 'bird', 'high', 'space'],
        'realm': ['realm', 'void', 'dark', 'studio', 'abstract', 'inside', 'black', 'atelier', 'indoor', 'session'],
        'artist': ['artist', 'portrait', 'model', 'face', 'people', 'man', 'woman', 'spotlight', 'close', 'person'],
        'nature': ['nature', 'leaf', 'flower', 'forest', 'wild', 'plant', 'outdoor', 'wood', 'landscape'],
        'event': ['event', 'crowd', 'live', 'concert', 'gig', 'performance', 'show', 'festival', 'people']
    };
    
    let assets = [];
    if (window.PortfolioData) {
        let allAssets = [];
        Object.values(window.PortfolioData).forEach(arr => {
            if (Array.isArray(arr)) {
                allAssets.push(...arr);
            }
        });
        
        const targetKeywords = keywordMap[activeCategory.toLowerCase()] || [activeCategory.toLowerCase()];
        
        let matchedAssets = allAssets.filter(item => {
            const searchString = `${item.name} ${item.professional_name || ''} ${item.tags ? item.tags.join(' ') : ''}`.toLowerCase();
            return targetKeywords.some(kw => searchString.includes(kw));
        });
        
        if (matchedAssets.length === 0 && allAssets.length > 0) {
            let idx = rings.indexOf(activeCategory);
            if (idx === -1) idx = 1; else idx += 1;
            matchedAssets = allAssets.filter((a, i) => i % idx === 0).slice(0, 15);
        }
        
        if (matchedAssets.length === 0) matchedAssets = allAssets.slice(0, 12);

        const uniqueNames = new Set();
        assets = matchedAssets.filter(item => {
            const nameLower = item.name.toLowerCase();
            if (nameLower.endsWith('.nef')) return false; 
            
            const baseName = nameLower.split('.').slice(0, -1).join('.') || nameLower;
            if (uniqueNames.has(baseName)) return false;
            
            uniqueNames.add(baseName);
            return true;
        });
    }

    const pageCaption = document.querySelector('.pt-\\\\[40px\\\\] p');
    if (pageCaption) {
        pageCaption.innerHTML = `A real-time reflection of the 3D Master Node.<br>Category: ${activeCategory} | Payload: ${assets ? assets.length : 0} Traces.`;
    }

    if (!assets || assets.length === 0) {
        grid.innerHTML = `<div class="swiper-slide !w-full !max-w-2xl text-center py-20 px-8 bg-transparent border-none shadow-none flex justify-center items-center">
            <div>
                <div class="mono opacity-50 mb-6 font-bold text-lg">NEURAL CALIBRATION IN PROGRESS</div>
                <p class="mono opacity-40 text-xs mb-8">Segment [${activeCategory}] yielded 0 traces.</p>
            </div>
        </div>`;
        if(typeof triggerNexusGatekeeper === 'function') {
            triggerNexusGatekeeper("Noch keine Schätze in dieser Kategorie? <br>Lass uns gemeinsam etwas neues erschaffen.");
        }
        return;
    }

    grid.innerHTML = "";
    masonry.innerHTML = "";

    const videos = [];
    const photos = [];
    
    assets.forEach(asset => {
        const nameLower = asset.name.toLowerCase();
        const isVideo = nameLower.endsWith('.mp4') || nameLower.endsWith('.mov') || nameLower.endsWith('.xml');
        if (isVideo) videos.push(asset);
        else photos.push(asset);
    });

    const topVideos = videos.slice(0, 3);
    const topPhotos = photos.slice(0, 12);
    
    if (topVideos.length > 0) {
        document.getElementById('video-carousel').style.display = 'block';
        topVideos.forEach((asset) => {
            const isXML = asset.name.toLowerCase().endsWith('.xml');
            let thumbnail = "../Assets/images/Logo.png";
            if (isXML) thumbnail = "../assets/ui/xml_icon.png";
            else if (asset.thumb_url) thumbnail = asset.thumb_url;
            else if (asset.id && (asset.id.startsWith("local_") || asset.id.startsWith("fix_") || asset.id.startsWith("localFile_"))) thumbnail = asset.url;
            else if (asset.url && !asset.url.includes("drive.google.com")) thumbnail = asset.url;
            else if (!asset.id.includes("mock")) thumbnail = `https://drive.google.com/thumbnail?id=${asset.id}&sz=w800`;

            const card = document.createElement('div');
            card.className = 'swiper-slide asset-card video-card';
            card.onclick = () => {
                window.CDF_Player.open(asset);
            };
            
            let badgeLabel = isXML ? 'AI PROJECT' : 'CINEMATIC FLOW';
            let metaLabel = isXML ? 'AI Timeline Engine' : 'Documentary Fragment';

            if (activeCategory === "Artist Spotlight") { badgeLabel = "ARTIST SPOTLIGHT"; metaLabel = "Individual Portrait"; }
            else if (activeCategory === "Soundwaves") { badgeLabel = "SOUNDWAVE"; metaLabel = "DJ Performance"; }
            else if (activeCategory === "The Atelier") { badgeLabel = "CREATIVE VORTEX"; metaLabel = "Artistic Process"; }

            const mediaElement = (!isXML && asset.url && (asset.url.toLowerCase().endsWith('.mp4') || asset.url.toLowerCase().endsWith('.mov'))) 
                ? `<video src="${asset.url}" class="asset-image" autoplay muted loop playsinline></video>`
                : `<img src="${thumbnail}" class="asset-image ${isXML ? '!object-contain p-8' : ''}" onerror="this.src='../Assets/images/Logo.png'">`;

            card.innerHTML = `
                <div class="category-badge border-[#E2725B] text-[#E2725B] shadow-[0_0_15px_rgba(226,114,91,0.4)]">${badgeLabel}</div>
                <div class="asset-image-wrapper">${mediaElement}</div>
                <div class="play-button" style="border-color: ${isXML ? 'var(--haki-gold)' : '#E2725B'}; background: rgba(${isXML ? '212, 175, 55' : '226, 114, 91'}, 0.1);">
                    <span class="material-symbols-outlined" style="color: ${isXML ? 'var(--haki-gold)' : '#E2725B'};">${isXML ? 'auto_awesome' : 'play_arrow'}</span>
                </div>
                <div class="asset-overlay">
                    <h3 class="cinzel text-xl text-[var(--haki-gold)] mb-1">${asset.professional_name || asset.name}</h3>
                    <p class="mono text-[10px] text-white/70 tracking-wider">${metaLabel}</p>
                </div>
            `;
            grid.appendChild(card);
        });
        
        // Re-init swiper if needed
        if(window.swiperInstance) window.swiperInstance.destroy();
        window.swiperInstance = new Swiper(".mySwiper", {
            effect: "coverflow", grabCursor: true, centeredSlides: true, slidesPerView: "auto",
            coverflowEffect: { rotate: 20, stretch: 0, depth: 250, modifier: 1, slideShadows: true },
            keyboard: { enabled: true },
            pagination: { el: ".swiper-pagination", clickable: true, dynamicBullets: true },
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
        });
    } else {
        document.getElementById('video-carousel').style.display = 'none';
    }

    if (topPhotos.length > 0) {
        topPhotos.forEach((asset) => {
            let thumbnail = "../Assets/images/Logo.png";
            if (asset.thumb_url) thumbnail = asset.thumb_url;
            else if (asset.id && (asset.id.startsWith("local_") || asset.id.startsWith("fix_") || asset.id.startsWith("localFile_"))) thumbnail = asset.url;
            else if (asset.url && !asset.url.includes("drive.google.com")) thumbnail = asset.url;
            else if (!asset.id.includes("mock")) thumbnail = `https://drive.google.com/thumbnail?id=${asset.id}&sz=w800`;

            const div = document.createElement('div');
            div.className = 'masonry-item';
            div.onclick = () => {
                window.CDF_Player.open(asset);
            };
            const img = document.createElement('img');
            img.src = thumbnail;
            img.alt = asset.professional_name || asset.name;
            img.loading = "lazy";
            img.onerror = function() {
                this.onerror = null;
                this.src = '../Assets/images/Logo.png';
                this.style.opacity = '0.3';
                this.style.objectFit = 'contain';
            };
            div.appendChild(img);
            masonry.appendChild(div);
        });
    }
}
'''

content = content.replace('''let activeCategory = urlParams.get('cat') || "Feuer";''', new_js)

start_old_calc = content.find('// Map keywords to our new Rings')
end_old_calc = content.find('// --- DYNAMIC TABS LOGIC ---')
if start_old_calc != -1 and end_old_calc != -1:
    content = content[:start_old_calc] + content[end_old_calc:]

content = content.replace("btn.onclick = () => window.location.href = `?cat=${encodeURIComponent(cat)}`;", "btn.onclick = () => window.loadCategory(cat);")
content = content.replace('updateWeeklyFlowBanner();', 'updateWeeklyFlowBanner(); renderGrid();')

start_old_grid = content.find('// Update Page Meta Info')
end_old_grid = content.find('          });\\n  \\n          </script>')
if start_old_grid != -1 and end_old_grid != -1:
    content = content[:start_old_grid] + content[end_old_grid:]

content = content.replace('''onclick="window.location.href='?cat=Artist'"''', '''onclick="window.loadCategory('Artist')"''')
content = content.replace('''onclick="window.location.href='?cat=Event'"''', '''onclick="window.loadCategory('Event')"''')
content = content.replace('''onclick="window.location.href='?cat=Wasser'"''', '''onclick="window.loadCategory('Wasser')"''')
content = content.replace('''onclick="window.location.href='?cat=Erde'"''', '''onclick="window.loadCategory('Erde')"''')
content = content.replace('''onclick="window.location.href='?cat=Nature'"''', '''onclick="window.loadCategory('Nature')"''')
content = content.replace('''onclick="window.location.href='?cat=Realm'"''', '''onclick="window.loadCategory('Realm')"''')
content = content.replace('''onclick="window.location.href='?cat=Feuer'"''', '''onclick="window.loadCategory('Feuer')"''')

with open(r'D:\circle-d-flow-web\pages\portfolio_anime_reality.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modifications applied successfully.")
