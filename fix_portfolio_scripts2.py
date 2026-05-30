import re

portfolio_path = r'D:\circle-d-flow-web\pages\portfolio_anime_reality.html'
with open(portfolio_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The clean script logic we want:
clean_scripts = """    <!-- External Scripts -->
    <script src="../js/translations.js"></script>
    <script src="../js/data/portfolio_data.js"></script>
    <script src="../js/radial_menu.js" defer></script>
    <script src="../js/agents/agent.js" defer></script>
    <script src="../js/agents/pusher.js" defer></script>
    <script src="../js/agents/helper.js" defer></script>
    <script src="../js/agents/tutorial_core.js" defer></script>
    <script src="../js/agents/quest_controller.js" defer></script>
    <script src="../js/agents/visual_integrity.js" defer></script>
    <script src="../js/agents/sound_engineer.js" defer></script>
    <script type="module" src="../js/agents/flowee_2026.js"></script>

    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const urlParams = new URLSearchParams(window.location.search);
            let activeCategory = urlParams.get('cat') || "Feuer";

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

            function renderTabs() {
                const tabsContainer = document.getElementById('category-tabs');
                if(!tabsContainer) return;
                tabsContainer.innerHTML = '';
                rings.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = `cinzel px-4 py-2 border rounded transition-all duration-300 ${activeCategory.toLowerCase() === cat.toLowerCase() ? 'bg-[var(--haki-gold)] text-black border-[var(--haki-gold)] font-bold' : 'bg-black text-white/70 border-white/20 hover:border-white/50'}`;
                    btn.innerText = cat;
                    btn.onclick = () => window.loadCategory(cat);
                    tabsContainer.appendChild(btn);
                });
            }

            function updateWeeklyFlowBanner() {
                const titleEl = document.getElementById('weekly-focus-title');
                if (titleEl) {
                    titleEl.innerText = `Diese Woche im Fokus: ${activeCategory}`;
                }
            }

            function renderGrid() {
                const grid = document.getElementById('portfolio-grid');
                const masonry = document.getElementById('photography-masonry');
                if (!grid || !masonry) return;
                
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
                    
                    if (matchedAssets.length === 0) {
                        matchedAssets = allAssets.slice(0, 12); // Fallback
                    }

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

                // Clear containers
                grid.innerHTML = "";
                masonry.innerHTML = "";

                if (assets.length === 0) {
                    grid.innerHTML = `<div class="text-white">Loading...</div>`;
                    return;
                }

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

                const pageCaption = document.querySelector('.pt-\\\\[40px\\\\] p');
                if (pageCaption) {
                    pageCaption.innerHTML = `
                        A real-time reflection of the 3D Master Node.<br>
                        Category: ${activeCategory} | Payload: ${assets.length} Traces.
                    `;
                }

                if (topVideos.length > 0) {
                    document.getElementById('video-carousel').style.display = 'block';
                    topVideos.forEach(asset => {
                        const isXML = asset.name.toLowerCase().endsWith('.xml');
                        let thumbnail = asset.thumb_url || asset.url || "../Assets/images/Logo.png";
                        if (!asset.thumb_url && !asset.url.includes("http") && !asset.url.includes("Assets/")) {
                            thumbnail = asset.id.includes("mock") ? "../Assets/images/Logo.png" : `https://drive.google.com/thumbnail?id=${asset.id}&sz=w800`;
                        }
                        const card = document.createElement('div');
                        card.className = 'swiper-slide asset-card video-card';
                        card.onclick = () => {
                            if(window.CDF_Player) window.CDF_Player.open(asset);
                        };
                        card.innerHTML = `
                            <div class="asset-image-wrapper">
                                <img src="${thumbnail}" class="asset-image" loading="lazy" alt="Video Thumbnail">
                                <div class="play-button"><span class="material-symbols-outlined">play_arrow</span></div>
                            </div>
                            <div class="asset-overlay">
                                <h3 class="cinzel text-xl text-[var(--haki-gold)] mb-1">${asset.professional_name || asset.name}</h3>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                } else {
                    document.getElementById('video-carousel').style.display = 'none';
                }

                topPhotos.forEach((asset, idx) => {
                    const sizeClass = idx % 5 === 0 ? 'hero' : (idx % 3 === 0 ? 'tall' : (idx % 4 === 0 ? 'wide' : 'standard'));
                    const card = document.createElement('div');
                    card.className = `asset-card ${sizeClass}`;
                    card.onclick = () => {
                        if(window.CDF_Player) window.CDF_Player.open(asset);
                    };
                    
                    let src = asset.url;
                    if(!src || (!src.includes("http") && !src.includes("Assets/"))) {
                        src = `https://drive.google.com/thumbnail?id=${asset.id}&sz=w1000`;
                    }
                    if(asset.id.startsWith("local_")) {
                        src = asset.url; // Use local path
                    }

                    card.innerHTML = `
                        <div class="asset-image-wrapper">
                            <img src="${src}" class="asset-image" loading="lazy" alt="Photo">
                        </div>
                        <div class="asset-overlay">
                            <h3 class="cinzel text-lg text-[var(--haki-gold)] mb-1">${asset.professional_name || asset.name}</h3>
                        </div>
                    `;
                    masonry.appendChild(card);
                });

                if(window.portfolioSwiper && window.portfolioSwiper.update) {
                    window.portfolioSwiper.update();
                }
            }

            window.loadCategory = function(catName) {
                activeCategory = catName;
                renderTabs();
                updateWeeklyFlowBanner();
                renderGrid();
                
                const gridEl = document.getElementById('photography-masonry');
                if(gridEl) {
                    window.scrollTo({
                        top: gridEl.offsetTop - 150,
                        behavior: 'smooth'
                    });
                }
                
                const radialMenu = document.getElementById('radial-menu');
                const triggerBtn = document.getElementById('radial-trigger');
                if(radialMenu && !radialMenu.classList.contains('pointer-events-none') && triggerBtn) {
                    triggerBtn.click();
                }
            };

            // Init
            renderTabs();
            updateWeeklyFlowBanner();
            renderGrid();

            // Swiper init
            if (typeof Swiper !== 'undefined') {
                window.portfolioSwiper = new Swiper('.portfolio-swiper', {
                    effect: 'coverflow',
                    grabCursor: true,
                    centeredSlides: true,
                    slidesPerView: 'auto',
                    coverflowEffect: {
                        rotate: 15,
                        stretch: 0,
                        depth: 200,
                        modifier: 1.2,
                        slideShadows: true,
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                    },
                    loop: true,
                    autoplay: {
                        delay: 4000,
                        disableOnInteraction: true,
                    }
                });
            }

            if (typeof applyTranslations === 'function') {
                applyTranslations();
            }
        });

        // Burger Menu Logic
        const burgerBtn = document.getElementById('burger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (burgerBtn && mobileMenu) {
            const spans = burgerBtn.querySelectorAll('span');
            let menuOpen = false;
            burgerBtn.addEventListener('click', () => {
                menuOpen = !menuOpen;
                if(menuOpen) {
                    mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
                    if(spans.length >= 3) {
                        spans[0].style.transform = 'translateY(8px) rotate(45deg)';
                        spans[1].style.opacity = '0';
                        spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
                    }
                } else {
                    mobileMenu.classList.add('opacity-0', 'pointer-events-none');
                    if(spans.length >= 3) {
                        spans[0].style.transform = 'none';
                        spans[1].style.opacity = '1';
                        spans[2].style.transform = 'none';
                    }
                }
            });
        }
    </script>
</body>
</html>
"""

# Split right before <!-- External Scripts -->
idx = content.find('<!-- External Scripts -->')
if idx != -1:
    new_content = content[:idx] + clean_scripts
    with open(portfolio_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Portfolio scripts fixed!")
else:
    print("Could not find <!-- External Scripts -->")
