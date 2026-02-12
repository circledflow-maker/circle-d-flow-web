/**
 * Agent: PalastAgent (The Majordomo)
 * Purpose: Manages the High Palast logic (Warp, Environments, Gatekeeper).
 */

class PalastAgent {
    constructor() {
        this.name = "PalastAgent";
        this.userCredits = 1250; // Mock
        this.dailyRune = "HAKI-VIBE-2026"; // Mock Daily Rune
        this.rooms = {
            'museum': { class: 'env-olympus', music: 'olympus_theme.mp3', gate: true, name: "The Museum" },
            'library': { class: 'env-library', music: 'archive_echo.mp3', gate: false, name: "The Library" },
            'treasury': { class: 'env-forge', music: 'anvil_beat.mp3', gate: false, name: "The Treasury" }
        };
        
        this.init();
    }

    init() {
        console.log("🏰 PalastAgent: Online");
        this.injectStyles();
        this.setupNavigation();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* WARP EFFECT */
            #warp-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: black; z-index: 9999;
                opacity: 0; pointer-events: none;
                transition: opacity 0.5s;
                display: flex; align-items: center; justify-content: center;
            }
            #warp-overlay.active { opacity: 1; pointer-events: all; }
            .warp-streak {
                width: 200%; height: 2px; background: white;
                position: absolute; transform: rotate(45deg);
                animation: warpSpeed 0.2s infinite;
            }

            /* ENVIRONMENTS */
            .env-olympus { background: linear-gradient(to bottom, #f0f0f0, #e0e0e0); color: #333; }
            .env-library { background: #0f0a13; color: #d4af37; }
            .env-forge { background: #1a0505; color: #cd7f32; }

            /* GATEKEEPER MODAL */
            #palast-gate {
                position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 5000;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(10px);
            }
        `;
        document.head.appendChild(style);
        
        // Add Warp Overlay
        const warp = document.createElement('div');
        warp.id = 'warp-overlay';
        warp.innerHTML = '<div class="text-white font-mono animate-pulse">WARPING...</div>';
        document.body.appendChild(warp);
    }

    setupNavigation() {
        // Listen for "beam-to" clicks
        document.addEventListener('click', (e) => {
            const beamTarget = e.target.closest('[data-beam]');
            if(beamTarget) {
                e.preventDefault();
                const roomKey = beamTarget.getAttribute('data-beam');
                this.beamToRoom(roomKey);
            }
        });
    }

    beamToRoom(roomKey) {
        const room = this.rooms[roomKey];
        if(!room) return;

        console.log(`🚀 Beaming to ${room.name}...`);
        
        // 1. Warp Effect
        const warp = document.getElementById('warp-overlay');
        warp.classList.add('active');

        // 2. Gate Check (if Gate exists)
        if(room.gate && !this.checkGateAccess(roomKey)) {
            setTimeout(() => {
                warp.classList.remove('active');
                this.triggerGateSequence(roomKey);
            }, 1000);
            return;
        }

        // 3. Navigation (Simulated or Real)
        setTimeout(() => {
            window.location.href = `palast_${roomKey}.html`;
        }, 800);
    }

    // --- GATEKEEPER LOGIC ---

    checkGateAccess(roomKey) {
        // Mock: Check localStorage or Session
        return localStorage.getItem(`access_${roomKey}`) === 'granted';
    }

    triggerGateSequence(roomKey) {
        // Flowee Intercept
        if(window.Flowee) window.Flowee.talk(true, "Halt! This is a Sacred Hall.");

        const modal = document.createElement('div');
        modal.id = 'palast-gate';
        modal.innerHTML = `
            <div class="text-center p-12 border-2 border-gold rounded-xl bg-black max-w-lg relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none"></div>
                
                <h2 class="text-4xl font-serif text-gold mb-4">Sanctuary Gate</h2>
                <p class="text-white/60 mb-8 italic">"To witness the legacy, a tribute is required."</p>
                
                <div class="space-y-4">
                    <button onclick="PalastAgent.payTribute('${roomKey}')" class="w-full py-4 bg-gold text-black font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                        Pay 7 Flow Credits
                    </button>
                    <div class="relative">
                        <input type="text" id="rune-input" placeholder="Enter Holy Rune" class="w-full bg-white/10 border border-white/20 p-3 text-center text-white uppercase tracking-widest focus:border-gold outline-none">
                        <button onclick="PalastAgent.checkRune('${roomKey}')" class="absolute right-2 top-2 text-gold hover:text-white">
                            <span class="material-symbols-outlined">key</span>
                        </button>
                    </div>
                </div>
                <div class="mt-6 text-xs text-white/30">Owner: King_Kyoraku</div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    payTribute(roomKey) {
        if(this.userCredits >= 7) {
            this.userCredits -= 7;
            alert(`Tribute Accepted. -7 Credits.`);
            this.grantAccess(roomKey);
        } else {
            alert("Insufficient Haki (Credits).");
        }
    }

    checkRune(roomKey) {
        const input = document.getElementById('rune-input').value;
        if(input === this.dailyRune) {
            alert("The Rune resonates! Enter.");
            this.grantAccess(roomKey);
        } else {
            alert("The Gate remains closed.");
        }
    }

    grantAccess(roomKey) {
        localStorage.setItem(`access_${roomKey}`, 'granted');
        document.getElementById('palast-gate').remove();
        this.beamToRoom(roomKey);
    }

    // --- HOLY RUNE GENERATOR (Library) ---
    generateDailyRune() {
        const runes = ["ODIN", "ZEUS", "RA", "THOR", "HAKI"];
        const random = runes[Math.floor(Math.random() * runes.length)];
        this.dailyRune = `${random}-${Math.floor(Math.random()*1000)}`;
        
        // Pusher Notification
        if(window.Pusher) {
            window.Pusher.showToast(`Daily Rune Generated: ${this.dailyRune}`, 'success');
        }
        
        return this.dailyRune;
    }
}

// Global Instance
window.PalastAgent = new PalastAgent();
