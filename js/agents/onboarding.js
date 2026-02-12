/**
 * Agent: Onboarding (The Welcome Protocol)
 * Purpose: Handles the initial 4s delay, Welcome Message, and First Quest Offer on Dashboard.
 * Robustness: Uses inline onclicks and explicit z-index/pointer-events.
 */
class OnboardingAgent {
    constructor() {
        this.name = "Onboarding";
        this.hasBoarded = localStorage.getItem('cdf_has_boarded');
        this.DELAY_MS = 4000;
        
        // Expose immediately
        window.Onboarding = this;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (this.hasBoarded) {
             console.log(`[${this.name}] User already onboarded.`);
             return;
        }

        console.log(`[${this.name}] protocol initiated. Waiting ${this.DELAY_MS}ms...`);
        
        setTimeout(() => {
            this.launchSequence();
        }, this.DELAY_MS);
    }

    launchSequence() {
        // 1. Play Sound
        if(window.SoundEngineer) window.SoundEngineer.playSFX('transmission_incoming');

        // 2. Show Modal (Mission Log Style)
        this.renderModal();
    }

    renderModal() {
        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        // Explicit styles for maximum z-index and pointer interaction
        modal.style.cssText = "position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.9); backdrop-filter: blur(4px); opacity: 0; transition: opacity 1s ease; pointer-events: auto;";
        
        // EGYPTIAN PARCHMENT STYLE
        const parchmentStyle = `
            background: url('https://www.transparenttextures.com/patterns/old-paper.png'), linear-gradient(to bottom right, #fdfbf7, #e6dcb1);
            background-blend-mode: multiply;
            box-shadow: 0 0 100px rgba(212, 175, 55, 0.3), inset 0 0 100px rgba(0,0,0,0.1);
            border: 8px double #8b4513;
            color: #2c1b0e;
        `;

        modal.innerHTML = `
            <div class="relative w-full max-w-2xl rounded-sm p-12 transform scale-95 transition-transform duration-500 pointer-events-auto" 
                 id="onboarding-card" 
                 style="${parchmentStyle}">
                
                <!-- CORNER ORNAMENTS -->
                <div class="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-[#8b4513]"></div>
                <div class="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-[#8b4513]"></div>
                <div class="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-[#8b4513]"></div>
                <div class="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-[#8b4513]"></div>

                <!-- Header -->
                <div class="flex flex-col items-center gap-4 mb-8 text-center border-b-2 border-[#8b4513]/20 pb-6">
                    <div class="w-16 h-16 rounded-full border-2 border-[#8b4513] flex items-center justify-center bg-[#d4af37]/20">
                        <span class="material-symbols-outlined text-[#8b4513] text-3xl animate-pulse">history_edu</span>
                    </div>
                    <div>
                        <h2 class="text-3xl font-cinzel text-[#2c1b0e] font-bold tracking-widest">SCROLL OF BEGINNINGS</h2>
                        <p class="text-xs font-mono text-[#8b4513] uppercase tracking-[0.3em] mt-2">The Archive Opens</p>
                    </div>
                </div>

                <!-- Body -->
                <div class="space-y-6 font-cinzel text-[#3e2723] text-lg leading-relaxed text-center">
                    <p>Greetings, Voyager.</p>
                    <p>
                        The winds of fate have guided you to the <strong class="text-[#8b4513]">Captain's Quarters</strong>. 
                        Your legend begins now, but first, you must inscribed your name into the Great Log.
                    </p>
                    
                    <div class="p-6 bg-[#d4af37]/10 border border-[#8b4513]/30 rounded my-6 relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-1 bg-[#d4af37]"></div>
                        <h3 class="text-[#8b4513] font-bold mb-2 uppercase text-sm tracking-widest flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-sm">auto_stories</span> First Trial Found
                        </h3>
                        <p class="text-xs text-gray-500 uppercase tracking-widest mb-1">Status: Pending Action</p>
                        <p class="text-[#2c1b0e] font-bold text-xl">Protocol 01: Identity Sync</p>
                        <p class="text-sm text-[#5d4037] mt-2 italic">"Know thyself, and you shall know the universe."</p>
                        <div class="mt-4 flex justify-center gap-4 text-xs font-mono uppercase text-[#8b4513]">
                            <span class="px-2 py-1 bg-[#8b4513]/10 rounded">Reward: 100 XP</span>
                            <span class="px-2 py-1 bg-[#8b4513]/10 rounded">Badge: Navigator</span>
                        </div>
                    </div>

                    <p class="text-sm">Shall we proceed to the vessel log?</p>
                </div>

                <!-- Footer -->
                <div class="mt-10 flex gap-6 justify-center">
                    <button id="btn-onboarding-accept" 
                        onclick="console.log('Accept Clicked'); window.Onboarding.accept()" 
                        class="px-8 py-3 bg-[#2c1b0e] text-[#f4e4bc] font-bold uppercase tracking-widest rounded hover:bg-[#8b4513] hover:shadow-[0_4px_15px_rgba(44,27,14,0.4)] transition-all cursor-pointer z-[2147483647] pointer-events-auto border border-transparent">
                        Inscribe Name
                    </button>
                    <button id="btn-onboarding-dismiss" 
                        onclick="console.log('Dismiss Clicked'); window.Onboarding.dismiss()" 
                        class="px-8 py-3 border-2 border-[#2c1b0e]/20 text-[#2c1b0e]/60 hover:text-[#2c1b0e] hover:border-[#2c1b0e] hover:bg-[#2c1b0e]/5 uppercase tracking-widest rounded transition-all font-bold cursor-pointer z-[2147483647] pointer-events-auto">
                        Later
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        // Animate In
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('#onboarding-card').classList.remove('scale-95');
            modal.querySelector('#onboarding-card').classList.add('scale-100');
        });
    }

    accept() {
        console.log(`[${this.name}] Mission Accepted.`);
        
        // 1. Mark as Boarded
        localStorage.setItem('cdf_has_boarded', 'true');
        
        // 2. Trigger Tutorial Flow (if Agent exists)
        if(window.TutorialCore) {
            if(window.Pusher) window.Pusher.showToast("Mission Accepted.", "success");
        }

        // 3. Open Captain's Log (The "Mission Log")
        // Redirect to Area to Fulfill (The Log Tab)
        if(window.CaptainsLog) {
            window.CaptainsLog.open('log'); // Opens the profile/log tab directly
        } else {
             // Fallback if somehow missing
             console.warn("CaptainsLog missing, reloading...");
             window.location.reload();
        }

        // 4. Close Modal
        this.closeModal();
    }

    dismiss() {
        console.log(`[${this.name}] Mission Dismissed.`);
        localStorage.setItem('cdf_has_boarded', 'true'); // Still mark as boarded so it doesn't spam
        this.closeModal();
    }

    closeModal() {
        const modal = document.getElementById('onboarding-modal');
        if(modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 1000);
        }
    }
}

new OnboardingAgent();
