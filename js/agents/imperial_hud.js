/**
 * Agent: Imperial HUD (The Nexus)
 * Purpose: Global Navigation, Notification Ticker, and Economy/Profile Access.
 * Replaces: HorizonBar
 */

class ImperialHUDAgent {
    constructor() {
        this.name = "ImperialHUD";
        this.tickerQueue = [];
        this.isTickerActive = false;
        this.balance = 0;
        this.init();
    }

    init() {
        console.log(`[${this.name}] Initializing the Imperial Nexus...`);
        this.injectStyles();
        this.injectHTML();
        this.initTicker();
        this.initFlowee();
        this.loadUserData();
        
        // Expose to window
        window.ImperialHUD = this;
        
        // Proxy legacy global ticker calls to the new HUD
        window.pushTickerMessage = (msg, layer = 'system') => {
            let lowerLayer = layer.toLowerCase();
            // Map common legacy layers
            if(lowerLayer === 'emergency') lowerLayer = 'system';
            if(lowerLayer === 'captain') lowerLayer = 'flowee';
            if(lowerLayer === 'queen') lowerLayer = 'bazaar';
            this.pushMessage(msg, lowerLayer);
        };
    }

    getPathPrefix() {
        const path = window.location.pathname.toLowerCase();
        // Check for common root indicators. 
        // Note: checking endsWith('/') covers "domain.com/"
        const isRoot = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('beta-initiation.html');
        return isRoot ? '' : '../';
    }

    injectStyles() {
        if (document.getElementById('imperial-hud-style')) return;

        const style = document.createElement('style');
        style.id = 'imperial-hud-style';
        style.textContent = `
            :root {
                --haki-gold: #d4af37;
                --benin-bronze: #cd7f32;
                --obsidian: rgba(10, 10, 10, 0.9);
            }

            .imperial-hud {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 25px;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(5px);
                z-index: 99999;
                display: flex;
                align-items: center;
                border-top: 1px solid rgba(0, 255, 212, 0.2);
                transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            
            /* Responsive Shrink */
            @media (max-width: 768px) {
                .imperial-hud {
                    padding: 0 15px;
                    height: 60px;
                    bottom: 10px;
                    top: auto;
                    width: 98%;
                }
                .hud-center { display: none; } /* Hide Ticker on mobile portrait to save space, or make it smaller */
                .cqr-logo span { display: none; }
            }

            /* Top Row Elements container */
            .hud-main-row {
                display: flex;
                width: 100%;
                align-items: center;
                justify-content: space-between;
                padding: 0 30px;
            }

            /* Left Section */
            .hud-left { display: flex; align-items: center; gap: 15px; }

            .flowee-avatar-container {
                position: relative;
                width: 40px;
                height: 40px;
                cursor: pointer;
            }
            .flowee-glow {
                position: absolute;
                inset: -5px;
                border-radius: 50%;
                background: radial-gradient(circle, var(--haki-gold) 0%, transparent 70%);
                opacity: 0.3;
                animation: flowee-pulse 3s infinite;
            }
            @keyframes flowee-pulse {
                0% { transform: scale(0.8); opacity: 0.3; }
                50% { transform: scale(1.1); opacity: 0.6; }
                100% { transform: scale(0.8); opacity: 0.3; }
            }
            .flowee-hud-icon {
                width: 100%; height: 100%; 
                border-radius: 50%; 
                border: 1px solid var(--haki-gold);
                object-fit: cover;
                background: #000;
            }

            .log-pose-branding { display: flex; flex-col; justify-center; }
            .system-status { font-size: 8px; color: #00ff00; letter-spacing: 2px; font-family: monospace; display: block; }
            .cqr-logo { font-family: 'Cinzel', serif; color: white; font-size: 1.2rem; margin: 0; line-height: 1; font-weight: bold; }
            .cqr-logo span { color: var(--haki-gold); font-size: 0.8em; }

            /* Bottom Ticker Stream */
            .hud-bottom-ticker {
                width: 100%;
                border-top: 1px solid rgba(212, 175, 55, 0.1);
                display: flex;
                justify-content: center;
                padding-top: 5px;
                padding-bottom: 5px;
            }
            .ticker-wrap {
                width: 100%;
                max-width: 800px;
                overflow: hidden;
                mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
            }
            .ticker-content {
                font-family: 'Space Mono', monospace;
                font-size: 0.70rem;
                color: #00ffd4;
                text-shadow: 0 0 8px #00ffd4;
                text-transform: uppercase;
                letter-spacing: 2px;
                white-space: nowrap;
                text-align: center;
                transition: opacity 0.5s ease;
            }
            
            /* Ticker Types */
            .ticker-system { color: #d4af37; text-shadow: 0 0 5px #d4af37; }
            .ticker-bazaar { color: #10b981; }
            .ticker-flowee { color: #60a5fa; }

            /* Right Section */
            .hud-right { display: flex; align-items: center; gap: 20px; }

            .manilla-display {
                background: rgba(255, 255, 255, 0.05);
                padding: 5px 15px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                border: 1px solid rgba(205, 127, 50, 0.3);
                gap: 8px;
            }
            .manilla-icon { width: 16px; height: 16px; border-radius: 50%; background: var(--benin-bronze); box-shadow: 0 0 5px var(--benin-bronze); }
            #user-balance { font-family: monospace; color: white; font-size: 0.9rem; }

            .user-mask-profile {
                width: 35px; height: 35px;
                background: #222;
                border: 1px solid var(--benin-bronze);
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.3s;
                background-image: url('${this.getPathPrefix()}Assets/images/mask_icon.png'); /* Placeholder */
                background-size: cover;
            }
            .user-mask-profile:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 0 10px var(--benin-bronze); }
            
            
            .hud-btn:hover { color: var(--haki-gold); }

            /* MINIMIZED STATE */
            .imperial-hud.minimized {
                height: 30px;
                background: rgba(0, 0, 0, 0.95);
                border-radius: 15px;
                padding: 0 15px;
                width: auto;
                min-width: 200px;
            }
            .hud-minimize-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.3s;
            }
            .hud-minimize-btn:hover { opacity: 1; }
            .hud-minimized-content {
                display: flex;
                align-items: center;
                flex: 1;
            }

        `;
        document.head.appendChild(style);
    }

    injectHTML() {
        // Remove old Horizon Bar if exists
        const oldBar = document.querySelector('.horizon-bar');
        if (oldBar) oldBar.remove();

        const prefix = this.getPathPrefix();
        
        // GLITCH FIX: Do NOT render HUD on Landing Page (Gateway)
        if (prefix === '') return; 

        const pagesPrefix = prefix === '' ? 'pages/' : ''; // If root, go into pages/. If deep, stay.
        
        const homeLink = `${prefix}index.html`;
        const marketLink = `${pagesPrefix}marketplace.html`;
        const dashboardLink = `${pagesPrefix}dashboard.html`;

        const bar = document.createElement('header');
        bar.id = 'imperial-hud-root';
        bar.className = 'imperial-hud';
        bar.innerHTML = `

            <div class="hud-bottom-ticker">
                <div class="ticker-wrap">
                    <div id="ticker-text" class="ticker-content">// INITIALIZING IMPERIAL FREQUENCY...</div>
                </div>
            </div>
            
            <!-- MINIMIZED STRIP CONTENT (Hidden by default) -->
            <div class="hud-minimized-content" style="display: none;">
                <span class="text-[#d4af37] font-cinzel text-xs tracking-widest">CQR.NEXUS</span>
                <span id="ticker-mini" class="text-white/50 text-[10px] ml-4 font-mono">...</span>
            </div>
        `;
        document.body.prepend(bar);
    }

    toggleMinimize() {
        // Obsolete function. Heavy UI has been streamlined into a single ticker.
    }

    initTicker() {
        // Integrate GlobalTicker events
        window.addEventListener('TICKER_UPDATE', (e) => {
            this.pushMessage(e.detail.message, e.detail.layer);
        });

        // Start Default Loop
        this.pushMessage("THE GOLDEN VAULT IS UNSEALED. LISBON BETA IS LIVE.", "system");
        this.pushMessage("RHYTHM STEERED BY DJ_QTERS.", "system");
        this.pushMessage("CIRCLE D FLOW JAM TOMORROW AT THE TEJO.", "bazaar");
    }

    pushMessage(text, type = 'system') {
        this.tickerQueue.push({ text, type });
        if (!this.isTickerActive) this.processQueue();
    }

    processQueue() {
        if (this.tickerQueue.length === 0) {
            this.isTickerActive = false;
            // Fallback to random wisdom if empty
            if (Math.random() > 0.7) this.pushMessage(this.getRandomWisdom(), 'flowee');
            return;
        }

        this.isTickerActive = true;
        const msg = this.tickerQueue.shift();
        this.renderTicker(msg);
        
        // Wait based on reading time
        const duration = Math.max(3000, msg.text.length * 100);
        setTimeout(() => this.processQueue(), duration);
    }

    renderTicker(msg) {
        const el = document.getElementById('ticker-text');
        if (!el) return;

        el.style.opacity = '0';
        setTimeout(() => {
            el.innerText = msg.type === 'flowee' ? `FLOWEE: ${msg.text}` : `[${msg.type.toUpperCase()}]: ${msg.text}`;
            el.className = `ticker-content ticker-${msg.type}`;
            el.style.opacity = '1';
        }, 500);
    }

    initFlowee() {
        this.wisdoms = [
            "The wind favors the bold Navigator.",
            "Bronze reflects the soul of the artisan.",
            "Check the Bazaar, a new treasure has appeared!",
            "Haki is not given, it is forged.",
            "Your vessel grows with every connection."
        ];
    }

    getRandomWisdom() {
        return this.wisdoms[Math.floor(Math.random() * this.wisdoms.length)];
    }

    triggerFloweeSpeech() {
        const wisdom = this.getRandomWisdom();
        this.pushMessage(wisdom, 'flowee');
        if(window.SoundEngineer) window.SoundEngineer.playSFX('ui_hover');
    }

    loadUserData() {
        // Load Balance
        const storedBalance = localStorage.getItem('cdf_balance') || '1250';
        this.updateBalance(storedBalance);
    }

    updateBalance(amount) {
        this.balance = amount;
        const el = document.getElementById('user-balance');
        if(el) el.innerText = parseInt(amount).toLocaleString();
    }
}

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ImperialHUDAgent());
} else {
    new ImperialHUDAgent();
}
