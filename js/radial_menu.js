document.addEventListener("DOMContentLoaded", () => {
    const radialTrigger = document.getElementById("radial-trigger");
    const radialMenu = document.getElementById("radial-menu");
    const radialItems = document.querySelectorAll(".radial-item");
    const galleryGrid = document.getElementById("gallery-grid");
    const ringNav = document.getElementById("ring-nav");

    let isMenuOpen = false;

    // Toggle Menu
    radialTrigger.addEventListener("click", () => {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            radialMenu.classList.remove("pointer-events-none");
            
            // GSAP Fan Out Animation
            gsap.to(radialItems, {
                duration: 0.6,
                scale: 1,
                opacity: 1,
                ease: "back.out(1.5)",
                stagger: 0.05,
                x: (i, target) => {
                    // Calculate circular position based on index (semi-circle on top)
                    const angle = Math.PI + (Math.PI / (radialItems.length - 1)) * i;
                    const radius = 120; // radius of the circle
                    return Math.cos(angle) * radius;
                },
                y: (i, target) => {
                    const angle = Math.PI + (Math.PI / (radialItems.length - 1)) * i;
                    const radius = 120;
                    return Math.sin(angle) * radius;
                }
            });
            
            gsap.to(radialTrigger, { rotation: 135, duration: 0.3 });
            radialTrigger.classList.add("bg-[var(--haki-gold)]", "text-black");
            radialTrigger.classList.remove("bg-black", "text-[var(--haki-gold)]");

        } else {
            closeMenu();
        }
    });

    function closeMenu() {
        isMenuOpen = false;
        radialMenu.classList.add("pointer-events-none");
        
        gsap.to(radialItems, {
            duration: 0.4,
            scale: 0,
            opacity: 0,
            x: 0,
            y: 0,
            ease: "power2.in",
            stagger: -0.05
        });
        
        gsap.to(radialTrigger, { rotation: 0, duration: 0.3 });
        radialTrigger.classList.remove("bg-[var(--haki-gold)]", "text-black");
        radialTrigger.classList.add("bg-black", "text-[var(--haki-gold)]");
    }

    // Handle Item Clicks
    radialItems.forEach(item => {
        item.addEventListener("click", (e) => {
            const category = item.getAttribute("data-archive-cat");
            closeMenu();
            loadArchiveCategory(category);
        });
    });

    function loadArchiveCategory(category) {
        galleryGrid.innerHTML = '';
        
        // Hide traditional 5 rings nav when in Archive mode
        if (ringNav) {
            ringNav.style.display = 'none';
        }

        // Add a title indicating we are in the Archive
        const titleDiv = document.createElement('div');
        titleDiv.className = 'w-full col-span-full text-center py-8';
        titleDiv.innerHTML = `<h2 class="text-3xl cinzel text-[var(--haki-gold)] glow-text">${category}</h2>
                              <p class="mono text-xs opacity-70 mt-2">THE GUILD ARCHIVES</p>
                              <button id="btn-back-rings" class="mt-4 border border-[var(--haki-gold)] px-4 py-2 rounded-full text-xs hover:bg-[var(--haki-gold)] hover:text-black transition-all">Back to Rings</button>`;
        galleryGrid.appendChild(titleDiv);

        document.getElementById('btn-back-rings').addEventListener('click', () => {
            if (ringNav) ringNav.style.display = 'flex';
            window.location.reload(); // Quick way to reset state
        });

        let data = [];
        if (category === "Artist Vault" && window.ArtistVault) {
            // Flatten artist vault for gallery, or create sub-folders
            Object.keys(window.ArtistVault).forEach(artist => {
                data = data.concat(window.ArtistVault[artist]);
            });
        } else if (window.PortfolioData && window.PortfolioData[category]) {
            data = window.PortfolioData[category];
        }

        if (data.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'col-span-full text-center text-gray-500 py-10';
            emptyDiv.innerText = "No memories forged yet in this archive.";
            galleryGrid.appendChild(emptyDiv);
            return;
        }

        // Render images exactly like the original portfolio render logic
        data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = "gallery-item relative group overflow-hidden border border-white/10 rounded-sm cursor-pointer";
            
            // Set animation delay for stagger
            card.style.animationDelay = `${index * 0.1}s`;
            card.style.animation = `fadeInUp 0.5s ease forwards`;
            card.style.opacity = '0';

            const mediaEl = item.url.toLowerCase().endsWith('.mp4') || item.url.toLowerCase().endsWith('.mov')
                ? `<video src="${item.url}" class="w-full h-[300px] object-cover transition-transform duration-700 group-hover:scale-105" loop muted playsinline></video>`
                : `<img src="${item.url}" alt="${item.professional_name}" class="w-full h-[300px] object-cover transition-transform duration-700 group-hover:scale-105" onerror="this.src='../Assets/branding/Logo.png'">`;

            const tagsHtml = item.tags.map(t => `<span class="bg-black/80 px-2 py-1 text-[8px] rounded-sm border border-white/20">${t.toUpperCase()}</span>`).join('');

            card.innerHTML = `
                ${mediaEl}
                <!-- Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p class="text-xs text-[var(--haki-gold)] mono mb-1">${item.professional_name}</p>
                    <p class="text-sm cinzel leading-snug">${item.poet_caption}</p>
                    <div class="flex gap-2 mt-3">${tagsHtml}</div>
                </div>
            `;
            
            // Add click event for lightbox
            card.addEventListener('click', () => {
                if(window.openLightbox) window.openLightbox(item);
            });

            // Auto-play videos on hover
            if(item.url.toLowerCase().endsWith('.mp4') || item.url.toLowerCase().endsWith('.mov')) {
                const vid = card.querySelector('video');
                card.addEventListener('mouseenter', () => vid.play().catch(e=>console.log(e)));
                card.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });
            }

            galleryGrid.appendChild(card);
        });
    }
});
