/**
 * BRACKET AGENT
 * Visualizes the Tournament Tree.
 */

class BracketAgent {
    constructor() {
        this.modalId = 'bracket-modal';
        this.contentId = 'bracket-tree';
    }

    open() {
        let modal = document.getElementById(this.modalId);
        
        // Auto-inject if missing (Robustness)
        if (!modal) {
            this.injectModal();
            modal = document.getElementById(this.modalId);
        }

        this.render();
        modal.showModal();
    }

    injectModal() {
        const dialog = document.createElement('dialog');
        dialog.id = this.modalId;
        dialog.className = "bg-transparent p-0 z-[60] backdrop:bg-black/90 backdrop:backdrop-blur-md open:animate-scale-in fixed inset-0 m-auto";
        dialog.innerHTML = `
            <div class="w-[90vw] h-[80vh] bg-[#0F0A13] border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden relative flex flex-col">
                <!-- Header -->
                <div class="p-6 border-b border-white/10 flex justify-between items-center bg-red-900/10 relative z-10">
                    <div class="flex items-center gap-4">
                        <h2 class="text-xl font-bold text-red-500 tracking-widest uppercase flex items-center gap-2">
                            <span class="material-symbols-outlined">trophy</span>
                            Tournament Bracket
                        </h2>
                        <!-- REGISTER BUTTON (Dynamic) -->
                        <div id="bracket-action-area"></div>
                    </div>
                    <button onclick="document.getElementById('${this.modalId}').close()" class="text-white/50 hover:text-white transition-colors material-symbols-outlined">close</button>
                </div>
                
                <!-- Bracket Container -->
                <div id="${this.contentId}" class="flex-1 overflow-x-auto overflow-y-auto p-8 flex items-center gap-12 custom-scrollbar">
                    <!-- Tree Injected Here -->
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    render() {
        const container = document.getElementById(this.contentId);
        const data = window.TournamentManifest || JSON.parse(localStorage.getItem('cdf_tournament') || '{}');
        
        // --- REGISTRATION LOGIC ---
        const actionArea = document.getElementById('bracket-action-area');
        const isRegistered = localStorage.getItem('cdf_tournament_registered') === 'true';

        if(actionArea) {
            if (data.stage === 'Qualifiers' && !isRegistered) {
                actionArea.innerHTML = `
                    <button onclick="BracketAgent.register()" class="px-4 py-2 bg-red-500 text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-lg">
                        Register Now
                    </button>
                `;
            } else if (isRegistered) {
                actionArea.innerHTML = `
                    <div class="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span class="text-[10px] text-green-400 font-bold uppercase tracking-widest">Registered</span>
                    </div>
                `;
            } else {
                actionArea.innerHTML = ``;
            }
        }
        
        if (!data.season) {
            container.innerHTML = `<div class="text-white/50 italic">No Tournament Data Found.</div>`;
            return;
        }

        // Mock Bracket Generation based on Stage
        // Real implementation would parse 'data.brackets'
        // For MVP, we visualize the Stages as columns
        
        const stages = ['Qualifiers', 'Top 32', 'Top 16', 'Top 8', 'Semis', 'Finals'];
        const currentStageIndex = stages.indexOf(data.stage) > -1 ? stages.indexOf(data.stage) : 0;

        let html = '';

        stages.forEach((stage, index) => {
            const isActive = index === currentStageIndex;
            const isPast = index < currentStageIndex;
            const opacity = isActive ? 'opacity-100' : (isPast ? 'opacity-50' : 'opacity-30');
            const glow = isActive ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500' : 'border-white/10';
            
            // Determine match count for visual density
            const matchCount = Math.ceil(32 / Math.pow(2, index)); 
            
            html += `
                <div class="flex flex-col gap-4 min-w-[200px] ${opacity}">
                    <div class="text-center uppercase text-xs font-bold text-white/50 mb-4">${stage}</div>
                    ${this.renderMatchColumn(matchCount, isActive, stage)}
                </div>
            `;
            
            // Connector
            if(index < stages.length - 1) {
                html += `<div class="w-8 h-px bg-white/10"></div>`;
            }
        });

        container.innerHTML = html;
        
        // Scroll to active stage
        setTimeout(() => {
            const activeCol = container.querySelector('.shadow-\\[0_0_20px_rgba\\(239\\,68\\,68\\,0\\.4\\)\\]');
            if(activeCol) activeCol.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }, 100);
    }

    renderMatchColumn(count, isActive, stage) {
        // Limit visual rendering for "Qualifiers" to avoid 1000 divs
        const displayCount = Math.min(count, 8); 
        let html = '';
        
        for(let i=0; i<displayCount; i++) {
             html += `
                <div class="relative bg-black/50 border ${isActive ? 'border-red-500/50' : 'border-white/10'} p-3 rounded flex flex-col justify-center h-16 w-full">
                    <div class="flex justify-between items-center text-[10px] text-white/70">
                        <span>${isActive ? '???' : 'Player ' + (i*2+1)}</span>
                        <span>-</span>
                    </div>
                    <div class="h-px bg-white/10 my-1"></div>
                    <div class="flex justify-between items-center text-[10px] text-white/70">
                        <span>${isActive ? '???' : 'Player ' + (i*2+2)}</span>
                        <span>-</span>
                    </div>
                </div>
             `;
        }
        
        if(count > 8) {
             html += `<div class="text-center text-[10px] text-white/30 italic">+${count - 8} Matches</div>`;
        }

        return html;
    }
    register() {
        if(confirm("Enter the Tournament? This will use 1 Tournament Token (Free for Alpha Testers).")) {
            localStorage.setItem('cdf_tournament_registered', 'true');
            
            // Update Manifest Entrants count visually
            const t = JSON.parse(localStorage.getItem('cdf_tournament') || '{}');
            t.entrants = (t.entrants || 0) + 1;
            localStorage.setItem('cdf_tournament', JSON.stringify(t));

            // Refresh UI
            this.render();
            
            if(window.Flowee && window.Flowee.talk) {
                 window.Flowee.talk(true, "Registration Confirmed! Prepare your loadout, Hunter.");
            }
        }
    }
}

window.BracketAgent = new BracketAgent();
