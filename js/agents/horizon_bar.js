/**
 * Agent: Horizon Bar (The Imperial Navigation)
 * Purpose: Standardized Navigation, Ticker Integration, and Trinity Menu
 */

class HorizonBarAgent {
    constructor() {
        this.name = "HorizonBar";
        this.init();
    }

    init() {
        console.log(`[${this.name}] Calibrating Navigation Systems...`);
        
        // 1. Check if Bar exists, if not inject it
        if (!document.querySelector('.horizon-bar')) {
            this.injectBar();
        }

        // 2. Initialize Ticker Link
        this.syncTicker();

        // 3. Highlight Active Page
        this.highlightCurrentPage();

        // 4. Inject Forge Button (If on Marketplace)
        if(window.location.href.includes('marketplace')) {
            this.injectForgeButton();
        }
    }

    injectBar() {
        // 1. Clean up any existing headers to avoid double-nav
        const existingHeader = document.querySelector('header');
        if(existingHeader && !existingHeader.classList.contains('horizon-bar')) {
            existingHeader.style.display = 'none';
        }

        const bar = document.createElement('header');
        bar.className = 'horizon-bar';
        bar.innerHTML = `
            <!-- Left: The Trinity Toggle (Fixed Width, No Shrink) -->
            <div class="trinity-toggle group relative cursor-pointer flex-shrink-0 z-50" onclick="window.HorizonBar.toggleMenu()">
                 <div class="flex flex-col gap-1.5 p-2">
                    <div class="bar w-6 h-0.5 bg-white/80 rounded-full group-hover:bg-amber-400 group-hover:shadow-[0_0_10px_#fbbf24] transition-all"></div>
                    <div class="bar w-6 h-0.5 bg-white/80 rounded-full group-hover:bg-amber-400 group-hover:shadow-[0_0_10px_#fbbf24] transition-all"></div>
                    <div class="bar w-6 h-0.5 bg-white/80 rounded-full group-hover:bg-amber-400 group-hover:shadow-[0_0_10px_#fbbf24] transition-all"></div>
                </div>
                <!-- Notification Dot -->
                <div id="horizon-notif" class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-0 transition-opacity"></div>
            </div>

            <!-- Center: The Unified Ticker (Clean & Centered) -->
            <div class="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center h-10 px-6 max-w-2xl w-full pointer-events-none">
                 <span class="ticker-text text-[10px] text-white/40 font-mono tracking-widest text-center whitespace-nowrap overflow-hidden text-ellipsis" id="horizon-ticker-text">
                    // SYSTEM ONLINE
                </span>
            </div>

            <!-- Right: Fast Travel Links (Replaces Icons) -->
            <div class="flex items-center gap-2 flex-shrink-0 z-50">
                <a href="master_dashboard.html" class="text-white/50 hover:text-amber-500 transition-colors text-[10px] uppercase font-mono tracking-widest flex items-center gap-1.5 border border-white/10 bg-black/40 px-3 py-1.5 rounded-full hover:border-amber-500/50 hidden md:flex">
                    <span class="material-symbols-outlined text-[14px]">grid_view</span> Dashboard
                </a>
                <a href="coop.html" class="text-white/50 hover:text-amber-500 transition-colors text-[10px] uppercase font-mono tracking-widest flex items-center gap-1.5 border border-white/10 bg-black/40 px-3 py-1.5 rounded-full hover:border-amber-500/50">
                    <span class="material-symbols-outlined text-[14px]">public</span> Orbit
                </a>
            </div>

            <!-- The Ghost Menu (Radial/Dropdown) -->
            <div id="ghost-menu" class="absolute top-full left-0 mt-4 w-64 bg-black/95 border border-amber-500/20 rounded-tr-2xl rounded-br-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transform scale-95 opacity-0 pointer-events-none transition-all duration-300 origin-top-left z-40">
                <div class="flex flex-col gap-2">
                    <div class="text-[10px] text-white/30 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Navigation Deck</div>
                    
                    <a href="dashboard.html" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white/80 hover:text-amber-400 transition-colors group">
                        <span class="material-symbols-outlined group-hover:animate-pulse">dashboard</span>
                        <span class="text-sm font-bold uppercase tracking-widest">Command Center</span>
                    </a>
                    <a href="vault_space.html" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white/80 hover:text-amber-400 transition-colors group">
                        <span class="material-symbols-outlined group-hover:animate-bounce">map</span>
                        <span class="text-sm font-bold uppercase tracking-widest">Resonance Map</span>
                    </a>
                    <a href="library.html" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white/80 hover:text-amber-400 transition-colors group">
                        <span class="material-symbols-outlined group-hover:spin-slow">auto_stories</span>
                        <span class="text-sm font-bold uppercase tracking-widest">The Library</span>
                    </a>
                    <a href="marketplace.html" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white/80 hover:text-amber-400 transition-colors group">
                        <span class="material-symbols-outlined group-hover:shake">storefront</span>
                        <span class="text-sm font-bold uppercase tracking-widest">THE BAZAAR</span>
                    </a>
                    <a href="battle.html" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white/80 hover:text-amber-400 transition-colors group">
                        <span class="material-symbols-outlined group-hover:ping">swords</span>
                        <span class="text-sm font-bold uppercase tracking-widest">Battlefield</span>
                    </a>

                     <div class="h-px bg-white/10 my-1"></div>
                     
                     <a href="index.html" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-red-400 hover:text-red-300 transition-colors">
                        <span class="material-symbols-outlined">power_settings_new</span>
                        <span class="text-sm font-bold uppercase tracking-widest">Jack Out</span>
                    </a>
                </div>
            </div>
        `;
        
        // Insert as first child of body to ensure it's on top
        if(document.body) document.body.prepend(bar);

        // Add Styles if not present
        if (!document.getElementById('horizon-style')) {
            const style = document.createElement('style');
            style.id = 'horizon-style';
            style.textContent = `
                .horizon-bar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3.5rem; /* Reduced from 4rem */
                    background: rgba(5, 5, 5, 0.9);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    z-index: 900;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 2rem; /* More padding */
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }
                .horizon-bar.hidden-nav { transform: translateY(-100%); }
                .horizon-bar.expanded { height: auto; align-items: flex-start; padding-top: 1rem; padding-bottom: 1rem; }
            `;
            document.head.appendChild(style);
        }

        // Expose Logic
        window.HorizonBar = this;
    }

    injectForgeButton() {
        // Injects the Forge button into the navbar
        const rightSection = document.querySelector('.horizon-bar .flex.items-center.gap-2'); 
        
        if (rightSection && !document.getElementById('hb-forge-btn')) {
            const btn = document.createElement('a');
            btn.id = 'hb-forge-btn';
            btn.href = 'marketplace-upload.html';
            btn.className = "hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#CD7F32]/10 border border-[#CD7F32]/50 text-[#CD7F32] text-[10px] font-bold uppercase rounded hover:bg-[#CD7F32] hover:text-black transition-all mr-2";
            btn.innerHTML = `
                <span class="material-symbols-outlined text-sm">auto_fix</span>
                <span>The Forge</span>
            `;
            
            // Insert at the beginning of the right section
            rightSection.prepend(btn);
        }
    }

    toggleMode() {
        // Toggle Aura/Lighthouse Logic (Mock)
        if(window.ApexNexus) window.ApexNexus.toggleMode();
        else console.log("[Horizon] Toggle Mode Clicked");
    }

    toggleMenu() {
        const menu = document.getElementById('ghost-menu');
        const isHidden = menu.classList.contains('opacity-0');
        
        if (isHidden) {
            menu.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            menu.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
            // Play Sound
             if(window.SoundEngineer) window.SoundEngineer.playSFX('ui_hover');
        } else {
            menu.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            menu.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        }
    }

    syncTicker() {
        // Listen for Global Ticker Events to update the bar's ticker too
        window.addEventListener('TICKER_UPDATE', (e) => {
            const el = document.getElementById('horizon-ticker-text');
            if(el) el.innerText = `// ${e.detail.layer}: ${e.detail.message}`;
        });
    }

    highlightCurrentPage() {
        // Simple logic to glow the icon if it matches URL
        // (Simplified for now as main navigation is in Ghost Menu)
    }

    setNotification(active) {
        const dot = document.getElementById('horizon-notif');
        if(dot) dot.style.opacity = active ? '1' : '0';
    }
}

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new HorizonBarAgent());
} else {
    new HorizonBarAgent();
}
