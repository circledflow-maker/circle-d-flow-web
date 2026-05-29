import re

# 1. Update Manga Images in about.html and portfolio_anime_reality.html
images = [
    "../Assets/lightroom_sync/98f625618feaf3e39ea0cda06e862613.jpg",
    "../Assets/lightroom_sync/0fb23a52ea5279321f0d56c682b46aaa.jpg",
    "../Assets/lightroom_sync/5af98f4d7697da9c15a8f36f847c9220.jpg",
    "../Assets/lightroom_sync/32ab0c46493045b0e5f765df3ecd682a.jpg"
]

def replace_manga_images(content):
    content = re.sub(r'url\(\'../assets/images/lome\.jpg\'\)', f"url('{images[0]}')", content)
    content = re.sub(r'url\(\'../assets/images/munich\.jpg\'\)', f"url('{images[1]}')", content)
    content = re.sub(r'url\(\'../assets/images/lisbon\.jpg\'\)', f"url('{images[2]}')", content)
    # The Logo one might be fine, but let's replace it if the user wants "passenden content"
    content = re.sub(r'url\(\'../Assets/images/Logo\.png\'\)', f"url('{images[3]}')", content)
    return content

# Read files
about_path = r'D:\circle-d-flow-web\pages\about.html'
portfolio_path = r'D:\circle-d-flow-web\pages\portfolio_anime_reality.html'

with open(about_path, 'r', encoding='utf-8') as f:
    about_content = f.read()

with open(portfolio_path, 'r', encoding='utf-8') as f:
    portfolio_content = f.read()

# Update images
about_content = replace_manga_images(about_content)
portfolio_content = replace_manga_images(portfolio_content)

# Fix JS in about.html
about_content = re.sub(
    r'window\.changeLanguage = function\(lang\) \{.*?\};?\s*</script>',
    r'</script>',
    about_content,
    flags=re.DOTALL
)

# Fix JS in portfolio_anime_reality.html
# First, insert translations.js if missing
if 'translations.js' not in portfolio_content:
    portfolio_content = portfolio_content.replace(
        '<script src="../js/data/portfolio_data.js"></script>',
        '<script src="../js/translations.js"></script>\n    <script src="../js/data/portfolio_data.js"></script>'
    )

# Now, completely rewrite the DOMContentLoaded section to fix the renderGrid duplication and ReferenceErrors
clean_js = """
    <script>
        // Initialize Translations
        if (typeof applyTranslations === 'function') {
            applyTranslations();
        }

        document.addEventListener('DOMContentLoaded', () => {
            const grid = document.getElementById('portfolio-grid');
            const masonry = document.getElementById('photography-masonry');
            const urlParams = new URLSearchParams(window.location.search);
            const rings = ['Feuer', 'Wasser', 'Erde', 'Luft', 'Realm', 'Artist', 'Nature', 'Event'];
            let activeCategory = urlParams.get('cat') || "Feuer";
            let assets = [];

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
                    radialMenu.classList.add('opacity-0', 'scale-0', 'pointer-events-none');
                    triggerBtn.style.transform = 'rotate(0deg)';
                }
            };

            function renderTabs() {
                const tabsContainer = document.getElementById('category-tabs');
                if (!window.PortfolioData || !tabsContainer) return;
                
                const categories = rings;
                tabsContainer.innerHTML = "";
                
                categories.forEach(cat => {
                    const btn = document.createElement('button');
                    const isActive = cat.toLowerCase().trim() === activeCategory.toLowerCase().trim();
                    btn.className = `px-4 py-2 border-b-2 text-white mono text-[10px] tracking-widest hover:text-[var(--haki-gold)] transition-all ${isActive ? 'border-[var(--haki-gold)]' : 'border-transparent opacity-50'}`;
                    btn.innerText = cat.toUpperCase();
                    btn.onclick = () => window.loadCategory(cat);
                    tabsContainer.appendChild(btn);
                });
            }

            function updateWeeklyFlowBanner() {
                const titleEl = document.getElementById('weekly-focus-title');
                const timerEl = document.getElementById('weekly-countdown');
                if (!titleEl || !timerEl) return;
                
                titleEl.innerText = `Diese Woche im Fokus: ${activeCategory}`;
                
                function updateTimer() {
                    const now = new Date();
                    const nextMonday = new Date();
                    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
                    nextMonday.setHours(0, 0, 0, 0);
                    if (now >= nextMonday) nextMonday.setDate(nextMonday.getDate() + 7);
                    const diff = nextMonday - now;
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((diff % (1000 * 60)) / 1000);
                    timerEl.innerText = `${days.toString().padStart(2, '0')}d : ${hours.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
                }
                updateTimer();
                setInterval(updateTimer, 1000);
            }

            function renderGrid() {
                if (!grid || !masonry) return;

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
                
                assets = [];
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

                // Update Page Meta Info
                const pageCaption = document.querySelector('.pt-\\\\[40px\\\\] p');
                if (pageCaption) {
                    pageCaption.innerHTML = `
                        A real-time reflection of the 3D Master Node.<br>
                        Category: ${activeCategory} | Payload: ${assets.length} Traces.
                    `;
                }

                if (assets.length === 0) {
                    grid.innerHTML = `
                        <div class="swiper-slide !w-full !max-w-2xl text-center py-20 px-8 bg-transparent border-none shadow-none flex justify-center items-center">
                            <div>
                                <div class="mono opacity-50 mb-6 font-bold text-lg">NEURAL CALIBRATION IN PROGRESS</div>
                                <p class="mono opacity-40 text-xs mb-8">Segment [${activeCategory}] yielded 0 traces.</p>
                            </div>
                        </div>
                    `;
                    if (typeof triggerNexusGatekeeper === 'function') {
                        triggerNexusGatekeeper("Noch keine Schätze in dieser Kategorie? <br>Lass uns gemeinsam etwas neues erschaffen.");
                    }
                    document.getElementById('video-carousel').style.display = 'none';
                    return;
                }

                // Clear containers to prevent duplicate rendering
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

                // Weekly Flow Constraints: Max 3 Videos, Max 12 Photos
                const topVideos = videos.slice(0, 3);
                const topPhotos = photos.slice(0, 12);

                if (topVideos.length > 0) {
                    document.getElementById('video-carousel').style.display = 'block';
                    topVideos.forEach((asset, index) => {
                        const isXML = asset.name.toLowerCase().endsWith('.xml');
                        let thumbnail;
                        if (isXML) {
                            thumbnail = "../assets/ui/xml_icon.png";
                        } else if (asset.thumb_url) {
                            thumbnail = asset.thumb_url;
                        } else if (asset.id && (asset.id.startsWith("local_") || asset.id.startsWith("fix_") || asset.id.startsWith("localFile_"))) {
                            thumbnail = asset.url;
                        } else if (asset.url && !asset.url.includes("drive.google.com")) {
                            thumbnail = asset.url;
                        } else {
                            thumbnail = asset.id.includes("mock") ? "../Assets/images/Logo.png" : `https://drive.google.com/thumbnail?id=${asset.id}&sz=w800`;
                        }
                        const card = document.createElement('div');
                        card.className = 'swiper-slide asset-card video-card';
                        card.onclick = () => {
                            if(window.CDF_Player) window.CDF_Player.open(asset);
                            if (typeof triggerNexusGatekeeper === 'function' && !window.agentMuted) {
                                triggerNexusGatekeeper(isXML ? "Bereit für den finalen Schnitt? Lad dir das Projekt in DaVinci." : "Planst du ein Event oder eine Jam-Session?<br>Lass uns über die visuelle Begleitung sprechen.", false);
                            }
                        };
                        let badgeLabel = isXML ? 'AI PROJECT' : 'CINEMATIC FLOW';
                        let metaLabel = isXML ? 'AI Timeline Engine' : 'Documentary Fragment';

                        if (activeCategory === "Artist Spotlight") {
                            badgeLabel = "ARTIST SPOTLIGHT";
                            metaLabel = "Individual Portrait";
                        } else if (activeCategory === "Soundwaves") {
                            badgeLabel = "SOUNDWAVE";
                            metaLabel = "DJ Performance";
                        } else if (activeCategory === "The Atelier") {
                            badgeLabel = "CREATIVE VORTEX";
                            metaLabel = "Artistic Process";
                        }

                        const poetCaption = asset.poet_caption ? 
                            `<div class="poet-desc mt-2 pt-2 border-t border-white/10 italic text-[9px] text-white/50 leading-relaxed whitespace-pre-line">${asset.poet_caption}</div>` : "";

                        const mediaElement = (!isXML && asset.url && (asset.url.toLowerCase().endsWith('.mp4') || asset.url.toLowerCase().endsWith('.mov'))) 
                            ? `<video src="${asset.url}" class="asset-image" autoplay muted loop playsinline></video>`
                            : `<img src="${thumbnail}" class="asset-image ${isXML ? '!object-contain p-8' : ''}" onerror="this.src='../Assets/images/Logo.png'">`;

                        card.innerHTML = `
                            <div class="category-badge border-[#E2725B] text-[#E2725B] shadow-[0_0_15px_rgba(226,114,91,0.4)]">${badgeLabel}</div>
                            <div class="asset-image-wrapper">
                                ${mediaElement}
                            </div>
                            <div class="play-button" style="border-color: ${isXML ? 'var(--haki-gold)' : '#E2725B'}; background: rgba(${isXML ? '212, 175, 55' : '226, 114, 91'}, 0.1);">
                                <span class="material-symbols-outlined" style="color: ${isXML ? 'var(--haki-gold)' : '#E2725B'};">${isXML ? 'auto_awesome' : 'play_arrow'}</span>
                            </div>
                            <div class="asset-overlay">
                                <h3 class="cinzel text-xl text-[var(--haki-gold)] mb-1">${asset.professional_name || asset.name}</h3>
                                <p class="mono text-[10px] text-white/70 tracking-wider">${metaLabel}</p>
                                ${poetCaption}
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                    
                    // Re-init swiper if needed
                    if(window.swiperInstance) window.swiperInstance.destroy();
                    if(window.Swiper) {
                        window.swiperInstance = new Swiper(".mySwiper", {
                            effect: "coverflow",
                            grabCursor: true,
                            centeredSlides: true,
                            slidesPerView: "auto",
                            coverflowEffect: {
                                rotate: 20,
                                stretch: 0,
                                depth: 250,
                                modifier: 1,
                                slideShadows: true,
                            },
                            keyboard: {
                                enabled: true,
                            },
                            pagination: {
                                el: ".swiper-pagination",
                                clickable: true,
                                dynamicBullets: true
                            },
                            navigation: {
                                nextEl: ".swiper-button-next",
                                prevEl: ".swiper-button-prev",
                            }
                        });
                    }
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
                        div.className = 'masonry-item group relative overflow-hidden rounded border border-white/5 bg-white/5 hover:border-[#d4af37]/30 transition-all cursor-pointer';
                        div.onclick = () => {
                            if(window.CDF_Player) window.CDF_Player.open(asset);
                        };
                        const img = document.createElement('img');
                        img.src = thumbnail;
                        img.alt = asset.professional_name || asset.name;
                        img.loading = "lazy";
                        img.className = "w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700";
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

            // Initial render
            renderTabs();
            updateWeeklyFlowBanner();
            renderGrid();
        });

        // Burger Menu Logic
        const burgerBtn = document.getElementById('burger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const spans = burgerBtn?.querySelectorAll('span');
        let menuOpen = false;

        if (burgerBtn && spans) {
            burgerBtn.addEventListener('click', () => {
                menuOpen = !menuOpen;
                if(menuOpen) {
                    mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
                    spans[0].style.transform = 'translateY(8px) rotate(45deg)';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
                } else {
                    mobileMenu.classList.add('opacity-0', 'pointer-events-none');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            });
        }
    </script>
</body>
</html>
"""

# Replace everything from the script that defines DOMContentLoaded down to the end of the file
pattern = r'<script>\s*//\s*(?:Burger Menu Logic|Initialize Translations|Basic Language Switching logic).*?</html>'
portfolio_content = re.sub(pattern, clean_js.strip(), portfolio_content, flags=re.DOTALL)
# It might not match if the string doesn't perfectly match, let's use a simpler pattern
# Just find the first occurrence of <script>\n        // Burger Menu Logic or similar, actually let's match `<script>\s*// Burger Menu Logic.*`
fallback_pattern = r'<script>\s*//\s*Burger Menu Logic.*?</html>'
portfolio_content = re.sub(fallback_pattern, clean_js.strip(), portfolio_content, flags=re.DOTALL)

# But wait, in the previous log, portfolio_anime_reality had:
#     <script>
#         // Burger Menu Logic
#         const burgerBtn = document.getElementById('burger-btn');
# I can just split by `<script>\n        // Burger Menu Logic` and append my `clean_js` !
parts = portfolio_content.split("<script>\n        // Burger Menu Logic")
if len(parts) == 2:
    portfolio_content = parts[0] + clean_js.strip()
else:
    # Try another split if spaces differ
    parts = portfolio_content.split("// Burger Menu Logic")
    if len(parts) >= 2:
        # Go back to the `<script>` tag
        idx = portfolio_content.rfind("<script>", 0, portfolio_content.find("// Burger Menu Logic"))
        if idx != -1:
            portfolio_content = portfolio_content[:idx] + clean_js.strip()


with open(about_path, 'w', encoding='utf-8') as f:
    f.write(about_content)

with open(portfolio_path, 'w', encoding='utf-8') as f:
    f.write(portfolio_content)

print("Fixed Manga images and JS files")
