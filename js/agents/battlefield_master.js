/**
 * CIRCLE D FLOW - BATTLEFIELD MASTER CONTROL
 * Version: 2.1 (Lisbon Ghost-Run Edition)
 * Agent: BattlefieldMaster
 * Role: Orchestrates the HUD, Localization Link, and Radar Logic.
 */

const BattlefieldMaster = {
    // 1. SYSTEM INITIALIZATION
    init: function() {
        console.log("[BattlefieldMaster] Initializing Unified HUD...");
        
        // A. Sync Language (Rosetta Core)
        this.syncLanguage();
        
        // B. Init Flowee Intelligence
        this.initFlowee();
        
        // C. Clean Sky Protocol (Radar & Auto-Hide)
        this.initClearSky();
        
        // D. Ticker Welcome
        setTimeout(() => {
            if(window.pushTickerMessage && window.i18n) {
                const lang = localStorage.getItem('preferred_lang') || 'pt';
                const msg = window.i18n[lang]['ticker-welcome'] || "SYSTEM ONLINE";
                window.pushTickerMessage(msg, 'info');
            }
        }, 1500);
    },

    // 2. LANGUAGE SYNC
    syncLanguage: function() {
        const savedLang = localStorage.getItem('preferred_lang') || 'pt';
        if (typeof setLanguage === "function") {
            setLanguage(savedLang);
        } else {
            console.warn("[BattlefieldMaster] Language Matrix not found. Defaulting to Static.");
        }
    },

    // 3. FLOWEE INTELLIGENCE (Quadrant & Haki Dash)
    initFlowee: function() {
        const flowee = document.getElementById('flowee-agent');
        if (!flowee) return;

        // Initial Bubble Check
        this.updateFloweeBubble(flowee);

        // Haki Dash - Avoid Cursor
        flowee.addEventListener('mouseenter', () => {
            // Only dash if system isn't locked in a modal
            const isBusy = document.body.classList.contains('modal-open'); 
            if (!isBusy) {
                this.hakiDash(flowee);
            }
        });

        // Window Resize Re-Calibrate
        window.addEventListener('resize', () => this.updateFloweeBubble(flowee));
    },

    updateFloweeBubble: function(el) {
        const bubble = document.getElementById('flowee-bubble');
        if(!bubble) return;
        
        const rect = el.getBoundingClientRect();
        const isRight = rect.left > (window.innerWidth / 2);
        const isBottom = rect.top > (window.innerHeight / 2);

        // Reset
        bubble.className = "mb-2 mr-4 w-48 bg-white text-black p-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] text-xs font-medium pointer-events-none transition-all duration-300 transform origin-bottom-right absolute";
        
        // Dynamic Classes based on quadrant
        if(isRight) {
             bubble.style.right = '100%';
             bubble.style.left = 'auto';
             bubble.classList.add('rounded-br-none'); // Point Right
             bubble.classList.remove('rounded-bl-none');
        } else {
             bubble.style.left = '100%';
             bubble.style.right = 'auto';
             bubble.classList.add('rounded-bl-none'); // Point Left
             bubble.classList.remove('rounded-br-none');
        }
        
        if(isBottom) {
            bubble.style.bottom = '100%';
            bubble.style.top = 'auto';
        } else {
            bubble.style.top = '100%';
            bubble.style.bottom = 'auto';
        }
    },

    hakiDash: function(el) {
        // Defines 4 Safe Zones (percentages)
        const zones = [
            { bottom: '2rem', right: '2rem' },   // Bottom Right (Standard)
            { bottom: '2rem', right: '85%' },    // Bottom Left
            { bottom: '85%', right: '2rem' },    // Top Right
            { bottom: '85%', right: '85%' }      // Top Left
        ];
        
        // Pick a random new zone that ISN'T the current approximation
        // For simplicity, just random pick
        const randomZone = zones[Math.floor(Math.random() * zones.length)];
        
        // Apply Move
        el.style.bottom = randomZone.bottom;
        el.style.right = randomZone.right;
        el.style.top = 'auto'; // Reset top
        el.style.left = 'auto'; // Reset left
        
        // Animation CSS
        el.classList.add('transition-all', 'duration-500', 'ease-out');
        
        // Re-calculate bubble after move
        setTimeout(() => this.updateFloweeBubble(el), 550);
    },

    // 4. CLEAR SKY PROTOCOL (Radar & Auto-Hide)
    initClearSky: function() {
        const searchBtn = document.getElementById('radar-trigger');
        const horizonBar = document.querySelector('.horizon-bar');

        if (searchBtn && horizonBar) {
            searchBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                horizonBar.classList.toggle('expanded');
                
                const isExpanded = horizonBar.classList.contains('expanded');
                
                if (isExpanded) {
                    // Focus Search Logic
                    const input = document.getElementById('radar-input'); 
                    if(input) input.focus();
                    
                    if(window.Flowee) window.Flowee.talk(true, window.i18n ? window.i18n[localStorage.getItem('preferred_lang')]['flowee-scan'] : "Scanning...", "scan");
                }
            };
        }

        // Auto-Hide on Click Outside
        document.addEventListener('click', (e) => {
            if(!horizonBar) return;
            const isClickInside = horizonBar.contains(e.target);
            const isChallenge = e.target.closest('#challenge-card'); // Don't close if interacting with challenge

            if (!isClickInside && !isChallenge && horizonBar.classList.contains('expanded')) {
                horizonBar.classList.remove('expanded');
            }
        });
    }
};

// Start Control
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BattlefieldMaster.init());
} else {
    BattlefieldMaster.init();
}
