/**
 * Agent: Chronos Validator (The Watchman of the Night)
 * Purpose: Buffers user actions and processes rewards during the "Midnight Reboot".
 * Dependencies: Flowee Agent
 */

class ChronosValidator {
    constructor() {
        this.name = "Chronos";
        this.STORAGE_BUFFER = "cdf_buffer";
        this.STORAGE_LAST_LOGIN = "cdf_last_reboot_check";
        this.STORAGE_RP = "cdf_rp";
        this.STORAGE_ORGA = "cdf_orga";
        this.STORAGE_QUEUE = "cdf_pending_validations";
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Synchronizing with Phoenix-EE Server...`);
        this.checkMidnightReboot();
    }

    // --- SUBMISSION LOGIC ---

    submitQuest(questId, type = "Standard", description = "Quest Completed") {
        console.log(`[${this.name}] Buffering Quest: ${questId}`);
        
        // 1. Add to Buffer
        const buffer = JSON.parse(localStorage.getItem(this.STORAGE_BUFFER) || '[]');
        buffer.push({
            id: questId,
            type: type,
            desc: description,
            timestamp: new Date().toISOString(),
            status: "PENDING"
        });
        localStorage.setItem(this.STORAGE_BUFFER, JSON.stringify(buffer));
        
        // 2. Trigger Flowee (Validation Pending)
        if(window.Flowee) {
            window.Flowee.setBufferMode();
        }
        
        // 3. UI Feedback (Optional Toast)
        this.showToast("Data Sent to Chronos Buffer");
    }

    // --- REBOOT LOGIC ---

    checkMidnightReboot() {
        const lastCheck = localStorage.getItem(this.STORAGE_LAST_LOGIN);
        const today = new Date().toDateString();

        // If checking for the first time or if it's a new day
        if (lastCheck !== today) {
            console.log(`[${this.name}] Midnight Reboot Detected! Processing Buffer...`);
            this.processBuffer();
            localStorage.setItem(this.STORAGE_LAST_LOGIN, today);
        } else {
            console.log(`[${this.name}] System synchronized. Waiting for next cycle.`);
        }
    }

    processBuffer() {
        const buffer = JSON.parse(localStorage.getItem(this.STORAGE_BUFFER) || '[]');
        
        if (buffer.length === 0) return;

        let rpGained = 0;
        let orgaGained = 0;
        let validatedCount = 0;

        // Calculate Rewards
        buffer.forEach(item => {
            if (item.status === "PENDING") {
                // Base Points
                let rp = 50; 
                let orga = 0;

                // Type Multipliers
                if (item.type === "Orga") {
                    orga = 5;
                    rp = 100;
                } else if (item.type === "Elite") {
                    rp = 150;
                }

                rpGained += rp;
                orgaGained += orga;
                validatedCount++;
                item.status = "VALIDATED";
            }
        });

        // Clear Processed Buffer (Or archive it in a history log)
        // For now, we clear the buffer to reset state, but in a real app we'd move to history
        localStorage.setItem(this.STORAGE_BUFFER, '[]');

        // Award Points
        this.awardPoints(rpGained, orgaGained);

        // Show Report (Delayed slightly for Flowee Init)
        setTimeout(() => {
            this.renderMorningReport(rpGained, orgaGained, validatedCount);
        }, 2000);
    }

    awardPoints(rp, orga) {
        const currentRP = parseInt(localStorage.getItem(this.STORAGE_RP) || '0');
        const currentOrga = parseInt(localStorage.getItem(this.STORAGE_ORGA) || '0');

        localStorage.setItem(this.STORAGE_RP, currentRP + rp);
        localStorage.setItem(this.STORAGE_ORGA, currentOrga + orga);
    }

    // --- UI RENDERER ---

    renderMorningReport(rp, orga, count) {
        // Trigger Flowee Triumph
        if(window.Flowee) window.Flowee.setTriumphMode(rp, orga);

        // Create Lightbox
        const modal = document.createElement('dialog');
        modal.className = "bg-transparent p-0 backdrop:bg-black/95 backdrop:backdrop-blur-sm open:animate-scale-in";
        modal.innerHTML = `
            <div class="w-[400px] bg-[#0F0A13] border border-mystic-gold rounded-xl shadow-[0_0_50px_rgba(255,215,0,0.2)] overflow-hidden relative text-center pb-8">
                <!-- Header -->
                <div class="h-32 bg-gradient-to-b from-mystic-gold/20 to-transparent flex items-center justify-center relative">
                     <span class="material-symbols-outlined text-6xl text-mystic-gold animate-bounce">sunny</span>
                     <div class="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-mystic-gold to-transparent"></div>
                </div>

                <div class="px-6 relative -top-6">
                    <div class="bg-black border border-mystic-gold/50 rounded-full px-4 py-1 inline-block text-[10px] text-mystic-gold font-bold uppercase tracking-widest shadow-lg">
                        Daily Rebirth Report
                    </div>
                </div>

                <div class="px-8 space-y-4">
                    <p class="text-white/80 text-sm font-serif italic">"The Phoenix has risen. Your efforts have been crystalized."</p>
                    
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div class="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div class="text-[10px] text-white/40 uppercase tracking-widest">Resonance</div>
                            <div class="text-2xl font-bold text-white">+${rp} <span class="text-[10px] text-white/30">RP</span></div>
                        </div>
                        <div class="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div class="text-[10px] text-white/40 uppercase tracking-widest">Orga Points</div>
                            <div class="text-2xl font-bold text-mystic-gold">+${orga}</div>
                        </div>
                    </div>

                    <div class="text-xs text-white/40 pt-2 border-t border-white/5">
                        ${count} Quests Validated by System
                    </div>

                    <button onclick="this.closest('dialog').close()" class="w-full py-3 bg-mystic-gold text-black font-bold uppercase tracking-wider rounded text-xs hover:bg-white transition-colors">
                        Claim Energy
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.showModal();
    }

    showToast(msg) {
        // Simple fallback toast
        const toast = document.createElement('div');
        toast.innerText = msg;
        toast.className = "fixed bottom-8 right-8 bg-black border border-mystic-gold text-mystic-gold px-4 py-2 rounded shadow-lg text-xs font-bold uppercase tracking-widest animate-fade-in-up z-50";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize
window.Chronos = new ChronosValidator();
