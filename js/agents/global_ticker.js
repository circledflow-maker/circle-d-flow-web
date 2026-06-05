/**
 * Global Ticker Agent (The Voice of the Kingdom)
 * Manages the top sticky bar for system-wide announcements.
 */
class GlobalTicker {
    constructor() {
        this.name = "GlobalTicker";
        this.layers = {
            'CAPTAIN': { msg: '', active: false, color: 'text-mystic-gold', icon: '🦅' },
            'QUEEN': { msg: '', active: false, color: 'text-bronze-400', icon: '🍲' },
            'DJ': { msg: '', active: false, color: 'text-gray-300', icon: '🎧' },
            'SYSTEM': { msg: '', active: false, color: 'text-white/80', icon: '💠' },
            'EMERGENCY': { msg: '', active: false, color: 'text-red-500 animate-pulse', icon: '🚨' }
        };
        this.currentLayer = 'SYSTEM';
        this.defaultMsg = "Welcome to the Circle D Flow. The Siege has begun.";
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    listenForBroadcasts() {
        document.addEventListener('cdf-ticker-broadcast', (e) => {
            if(e.detail && e.detail.msg) {
                this.updateLayer(e.detail.layer || 'SYSTEM', e.detail.msg);
            }
        });
    }
    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes ticker-slide {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
            .cdf-ticker-wrap {
                position: fixed;
                top: 0; 
                left: 0;
                width: 100%;
                height: 32px;
                background: linear-gradient(90deg, #000, #1a1a1a, #000);
                z-index: 9999;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                pointer-events: none; /* Let clicks pass through */
            }
            /* Global Layout Adjustments for Ticker */
            body { 
                padding-top: 32px !important; 
            }
            .horizon-bar {
                top: 32px !important;
            }
            /* If Mobile Nav exists */
            #mobile-menu {
                top: 32px !important;
            }
            .cdf-ticker-content {
                display: inline-block;
                white-space: nowrap;
                padding-left: 100%;
                animation: ticker-slide 30s linear infinite;
                font-family: 'Space Mono', monospace;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .cdf-ticker-content:hover {
                animation-play-state: paused;
            }
            /* Layer Specifics */
            .layer-captain { border-bottom: 1px solid #FFD700; }
            .layer-queen { border-bottom: 1px solid #CD7F32; }
            .layer-dj { border-bottom: 1px solid #C0C0C0; }
            .layer-emergency { border-bottom: 1px solid #EF4444; background: #330000 !important; }
        `;
        document.head.appendChild(style);
    }

    renderTicker() {
        const ticker = document.createElement('div');
        ticker.id = 'cdf-global-ticker';
        ticker.className = 'cdf-ticker-wrap';
        ticker.innerHTML = `<div class="cdf-ticker-content" id="cdf-ticker-text">Initializing Network...</div>`;
        document.body.prepend(ticker);
    }

    updateLayer(layer, msg) {
        if(!this.layers[layer]) return;

        this.layers[layer].msg = msg;
        this.layers[layer].active = true;
        this.refreshDisplay();

        // Auto-expire lower layers if needed, but Captain/System usually stay
        if(layer === 'DJ' || layer === 'QUEEN') {
            setTimeout(() => {
                this.layers[layer].active = false;
                this.refreshDisplay();
            }, 10000); // 10s Spotlight
        }
    }

    refreshDisplay() {
        // Determine highest priority active layer
        // Priority: EMERGENCY > CAPTAIN > QUEEN > DJ > SYSTEM
        let activeLayer = 'SYSTEM';
        if(this.layers.EMERGENCY.active) activeLayer = 'EMERGENCY';
        else if(this.layers.CAPTAIN.active) activeLayer = 'CAPTAIN';
        else if(this.layers.QUEEN.active) activeLayer = 'QUEEN';
        else if(this.layers.DJ.active) activeLayer = 'DJ';

        const data = this.layers[activeLayer];
        const tickerContainer = document.getElementById('cdf-global-ticker');
        const tickerText = document.getElementById('cdf-ticker-text');

        if(tickerContainer && tickerText) {
            tickerText.innerHTML = `<span class="${data.color} font-bold mr-4">${data.icon}</span> ${data.msg}`;
            tickerContainer.className = `cdf-ticker-wrap layer-${activeLayer.toLowerCase()}`;
        }
    }

    checkForNewCaptain() {
        const username = localStorage.getItem('cdf_username');
        const hasAnnounced = localStorage.getItem('cdf_announced_arrival');
        
        if (username && !hasAnnounced) {
            // Broadcast Arrival
            this.updateLayer('SYSTEM', `NEW CAPTAIN ON DECK: ${username.toUpperCase()} HAS JOINED THE FLEET.`);
            
            // Mark as done
            localStorage.setItem('cdf_announced_arrival', 'true');
            
            // Post to Chat as System
            const chat = JSON.parse(localStorage.getItem('cdf_global_chat') || '[]');
            chat.push({
                user: 'SYSTEM',
                text: `COMMANDER ${username.toUpperCase()} HAS ENTERED THE SECTOR.`,
                ts: Date.now()
            });
            localStorage.setItem('cdf_global_chat', JSON.stringify(chat));
        }
    }

    init() {
        if(document.getElementById('cdf-global-ticker')) return; 

        this.injectStyles();
        this.renderTicker();
        this.listenForBroadcasts();
        
        // Initial State
        this.updateLayer('SYSTEM', this.defaultMsg);

        // Check for new arrivals
        setTimeout(() => this.checkForNewCaptain(), 2000);

        // Expose Global Helper
        window.pushTickerMessage = (msg, layer = 'SYSTEM') => {
            this.updateLayer(layer, msg);
        };
    }
}

new GlobalTicker();
