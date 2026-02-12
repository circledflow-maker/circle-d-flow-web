/**
 * Agent: VaultSpace (The Bazaar & Map)
 * Role: Manages the "Space" Map (Google Maps / Leaflet Mock) and "Bazaar" (Product) integration.
 */

class VaultSpace {
    constructor() {
        this.name = "VaultSpace";
        this.map = null;
        this.pins = [
            { id: 'lx_garden', lat: 38.71, lng: -9.14, title: "Secret Garden LX", type: "COMMUNITY", vibe: "Chill", rating: 4.9 },
            { id: 'lx_hempy', lat: 38.73, lng: -9.13, title: "Hempy Roots", type: "HEALTH", vibe: "Vitality", rating: 4.8 },
            { id: 'lx_mocambo', lat: 38.70, lng: -9.16, title: "Casa Mocambo", type: "CULTURE", vibe: "Eclectic", rating: 4.7 },
            { id: 'lx_chapito', lat: 38.71, lng: -9.13, title: "Chapitô", type: "ART", vibe: "Sky-Flow", rating: 4.8 }
        ];

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Initializing Vault Systems...`);
        this.renderMap();
        this.bindEvents();
    }

    bindEvents() {
        // Listen for "Pin Pulse" events (from dashboard or chat)
        window.addEventListener('VAULT_PULSE', (e) => {
            this.highlightPin(e.detail.id);
        });
    }

    renderMap() {
        // Since we don't have a real map key, we'll create a "Stylized" Mock Map
        const mapContainer = document.getElementById('vault-map');
        if(!mapContainer) return;

        mapContainer.innerHTML = `
            <div class="relative w-full h-full bg-[#1a1a1a] overflow-hidden rounded-xl border border-white/10 group">
                <!-- Static Background Map (Styled) -->
                <div class="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Lisbon_OpenStreetMap.png/640px-Lisbon_OpenStreetMap.png')] bg-cover bg-center grayscale transition-all duration-1000 group-hover:scale-105 group-hover:opacity-50"></div>
                
                <!-- Overlay Grid -->
                <div class="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                <!-- Pins -->
                ${this.pins.map(pin => this.createPinHTML(pin)).join('')}

                <!-- Radar Sweep Effect -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-[spin_10s_linear_infinite] pointer-events-none origin-bottom-left w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2"></div>
                
                <div class="absolute bottom-4 right-4 bg-black/80 backdrop-blur border border-white/10 p-2 rounded text-[10px] text-white/50">
                    <span class="text-amber-500">●</span> 4 Active Resonances
                </div>
            </div>
        `;
    }

    createPinHTML(pin) {
        // Random placement for mock since we don't have real coords mapping to pixels here without a library
        // In a real app, we'd use Leaflet.js
        const top = Math.random() * 80 + 10;
        const left = Math.random() * 80 + 10;
        
        return `
            <div class="absolute group/pin cursor-pointer" style="top: ${top}%; left: ${left}%" onclick="window.Vault.showPinDetails('${pin.id}')">
                <div class="relative">
                    <div class="w-3 h-3 bg-amber-500 rounded-full animate-ping absolute inset-0 opacity-75"></div>
                    <div class="w-3 h-3 bg-amber-500 rounded-full border border-black relative z-10 shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
                    
                    <!-- Tooltip -->
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black/90 border border-amber-500/30 rounded p-2 opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-20">
                        <div class="text-[10px] font-bold text-white">${pin.title}</div>
                        <div class="text-[9px] text-amber-400">${pin.rating} ★ • ${pin.vibe}</div>
                    </div>
                </div>
            </div>
        `;
    }

    showPinDetails(id) {
        const pin = this.pins.find(p => p.id === id);
        if(!pin) return;

        // Dispatch event for UI Modals (e.g., NetworkHub to show details)
        const event = new CustomEvent('SHOW_MODAL', {
            detail: {
                type: 'LOCATION',
                data: pin
            }
        });
        window.dispatchEvent(event);

        if(window.Pusher) window.Pusher.showToast(`Resonating with ${pin.title}`, 'success');
    }
    
    highlightPin(id) {
        // Find pin and trigger pulse effect (Mock)
        console.log(`[Vault] Highlighting ${id}`);
    }

    dropPulse() {
        // 1. Visual Feedback
        if(window.Pusher) window.Pusher.showToast("📡 Broadcasting Resonance Pulse...", "xp");
        
        // 2. Add Pulse Effect to Center
        const map = document.getElementById('vault-map');
        if(map) {
            const pulse = document.createElement('div');
            pulse.className = "absolute top-1/2 left-1/2 w-0 h-0 border-2 border-amber-500 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[ping_2s_ease-out_forwards]";
            map.querySelector('.relative').appendChild(pulse);
            setTimeout(() => pulse.remove(), 2000);
        }

        // 3. XP Reward
        if(window.Gamification) window.Gamification.addXP(25, "Pulse Dropped");
    }
}

// Global Access
window.Vault = new VaultSpace();
