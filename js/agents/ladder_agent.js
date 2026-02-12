/**
 * Agent: LadderAgent (The Guardian of the Floor)
 * Purpose: Manages Ranking Logic, "Fog of War" visibility, and Ascension animations.
 * Theme: Bleach x Tower of God
 */

class LadderAgent {
    constructor() {
        this.name = "LadderAgent";
        this.ladderDataKey = "cdf_ladder_data";
        this.currentUserCP = 13000; // Mock User CP (Prime_CQR)
        this.userCredits = 1250; 
        
        // Mock Ranking Data (Until Backend)
        this.rankings = [
            { id: "p1", rank: 1, name: "King_Kyoraku", guild: "Soul Society", pillar: "Sound-Smith", cp: 99999, avatar: "avatar_1.png", tier: "god", shoutout: "Flower Wind Rage and Flower God Roar!" },
            { id: "p2", rank: 2, name: "Grimmjow_X", guild: "Espada", pillar: "Alchemist", cp: 95000, avatar: "avatar_2.png", tier: "god", shoutout: null },
            { id: "p3", rank: 3, name: "Baam_25th", guild: "FUG", pillar: "Visionary", cp: 92000, avatar: "avatar_3.png", tier: "god", shoutout: "I will follow my own stars." },
            { id: "p4", rank: 4, name: "Yhwach_Eyes", guild: "Wandenreich", pillar: "Visionary", cp: 88000, avatar: "avatar_1.png", tier: "god" },
            { id: "p5", rank: 5, name: "Urek_Mazino", guild: "Wolhaiksong", pillar: "Alchemist", cp: 86000, avatar: "avatar_2.png", tier: "god" },
            { id: "p12", rank: 12, name: "Prime_CQR", guild: "The Inner Circle", pillar: "Visionary", cp: 13000, avatar: "avatar_1.png", tier: "commander" }, // USER
            { id: "p45", rank: 45, name: "Renji_Abarai", guild: "Gotei 6", pillar: "Alchemist", cp: 5000, avatar: "avatar_3.png", tier: "commander" },
            { id: "p102", rank: 102, name: "Kon_Mod", guild: "Karakura", pillar: "Weaver", cp: 800, avatar: "avatar_2.png", tier: "voyager" }
        ];

        // CONFIG
        this.config = {
            seasonResetRetain: 0.25, // Keep 25% CP
            costs: { spy: 1, goldShout: 2, aegis: 10 }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] The Tower is Open. Guardian observing.`);
        this.renderTower();
        this.setupScrollObserver();
        window.LadderAgent = this;
    }

    // --- RENDERING ---

    renderTower() {
        this.renderTopThree();
        this.renderList();
        this.updateFloorDisplay();
    }

    renderTopThree() {
        const container = document.getElementById('ladder-top-three');
        if(!container) return;

        const top3 = this.rankings.slice(0, 3);
        
        container.innerHTML = top3.map((r, i) => `
            <div class="relative group cursor-pointer transform hover:-translate-y-2 transition-transform duration-500 ${i === 1 ? 'md:-mt-12 scale-110 z-10' : ''}">
                <!-- REIATSU AURA (Only Top 3) -->
                <div class="reiatsu-aura opacity-0 group-hover:opacity-60 transition-opacity"></div>
                
                <div class="bg-black/40 backdrop-blur-md border border-white/10 p-6 clip-path-polygon relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.1)] group-hover:border-haki-gold transition-colors">
                    <div class="absolute top-0 right-0 p-4 font-black text-6xl text-white/5 z-0">#${r.rank}</div>
                    
                    <div class="relative z-10 text-center">
                        <div class="w-24 h-24 mx-auto rounded-full border-2 border-haki-gold p-1 mb-4">
                            <img src="https://placehold.co/100x100/111/gold?text=${r.name.charAt(0)}" class="w-full h-full rounded-full object-cover">
                        </div>
                        <h3 class="text-xl font-bold text-white mb-1 tracking-widest">${r.name.toUpperCase()}</h3>
                        <div class="text-[10px] font-mono text-haki-gold mb-2 bg-haki-gold/10 inline-block px-2 py-1 rounded">${r.guild}</div>
                        <div class="mt-2 font-mono text-white/80">
                            <span class="material-symbols-outlined text-xs align-middle text-haki-gold">bolt</span> 
                            ${r.cp.toLocaleString()} CP
                        </div>
                        <!-- GOLDEN SHOUTOUT PREVIEW -->
                        ${r.shoutout ? `<div class="mt-4 text-[10px] italic text-haki-gold/80 border-t border-white/5 pt-2">"${r.shoutout}"</div>` : ''}
                    </div>
                </div>
            </div>`).join('');
    }

    renderList() {
        const container = document.getElementById('ladder-list');
        if(!container) return;

        const list = this.rankings.slice(3); 

        container.innerHTML = list.map(r => {
            const isUser = r.name === "Prime_CQR";
            const floor = r.rank <= 10 ? 'Golden Floor' : r.rank <= 50 ? 'Commander Floor' : 'Voyager Floor';
            const tierClass = r.rank <= 10 ? 'tier-god' : r.rank <= 50 ? 'tier-commander' : 'tier-voyager';
            const canBlitz = Math.abs(r.rank - 12) <= 5 && r.rank < 12; // Mock: User is Rank 12

            return `
            <div data-rank="${r.rank}" class="ladder-item ${tierClass} p-4 flex items-center gap-6 relative group hover:pl-8 transition-all duration-300 border-l-[4px] ${isUser ? 'border-l-haki-gold bg-white/10' : 'border-l-transparent'}">
                
                <!-- Rank -->
                <div class="font-black text-3xl opacity-50 w-16 text-right font-mono text-white/20">#${r.rank}</div>
                
                <!-- Avatar -->
                <div class="w-12 h-12 rounded-full border border-white/10 bg-black overflow-hidden relative">
                     <img src="https://placehold.co/100x100/333/white?text=${r.name.charAt(0)}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all">
                </div>

                <!-- Info -->
                <div class="flex-1">
                    <div class="flex items-center gap-3">
                        <h3 class="font-bold uppercase tracking-wider ${isUser ? 'text-haki-gold' : 'text-gray-300'}">${r.name}</h3>
                        ${isUser ? '<span class="text-[8px] bg-haki-gold text-black px-1 rounded font-bold">YOU</span>' : ''}
                        
                        <!-- GUILD BANNER -->
                        <div class="text-[9px] text-white/40 px-2 py-0.5 border border-white/10 rounded flex items-center gap-1">
                            <span class="material-symbols-outlined text-[10px]">shield</span> ${r.guild}
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-4">
                    
                    <!-- BLITZ (Challenge) -->
                    ${canBlitz ? `
                    <button class="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all animate-pulse" title="Challenge Blitz">
                        <span class="material-symbols-outlined text-sm">flash_on</span>
                    </button>` : ''}

                    <!-- CP -->
                    <div class="text-right font-mono font-bold ${isUser ? 'text-white' : 'text-gray-500'}">
                        ${r.cp.toLocaleString()} CP
                    </div>

                    <!-- SPY MODE (Toggle) -->
                    <button onclick="LadderAgent.toggleSpy('${r.id}')" class="text-white/20 hover:text-haki-gold transition-colors">
                        <span class="material-symbols-outlined text-lg">visibility_off</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    updateFloorDisplay() {
        const el = document.getElementById('current-floor');
        if(el) {
            // Find user rank
            const user = this.rankings.find(r => r.name === "Prime_CQR");
            const floor = user ? Math.floor((1000 - user.rank) / 10) : 1; // Mock Floor Calc
            el.innerText = floor;
        }
    }

    // --- LOGIC FEATURES ---

    toggleSpy(targetId) {
        // Mock Implementation
        if(this.userCredits >= this.config.costs.spy) {
            console.log(`[Spy] Revealing ${targetId} (-1 Credit)`);
            alert(`SPY MODE ACTIVE: ${targetId} favors 'Battle Pillar'. Weakness: 'Vision'.`);
            // In real app, decrement credits and show modality
        } else {
            alert("Not enough Flow Credits for Spy Mode.");
        }
    }

    setupScrollObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const rank = entry.target.getAttribute('data-rank');
                    // Simple console log for now, but this is where we'd trigger "Floor Transition" videos
                    if(rank == 10) console.log("ENTERING GOD TIER");
                    if(rank == 50) console.log("ENTERING COMMANDER TIER");
                }
            });
        }, { threshold: 0.5 });

        setTimeout(() => {
            document.querySelectorAll('.ladder-item').forEach(el => observer.observe(el));
        }, 1000); // Wait for render
    }

    // --- LOGIC ---

    triggerAscension() {
        const overlay = document.getElementById('ascension-overlay');
        const sfx = new Audio('../Assets/audio/sfx/glass_shatter.mp3'); // Mock path
        
        if(overlay) {
            overlay.style.display = 'flex';
            // sfx.play().catch(() => {}); 
            
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 3000);

            // Broadcast
            if(window.Pusher) {
                window.Pusher.broadcastRankUp(11, "Prime_CQR");
            }
        }
    }
}

new LadderAgent();
