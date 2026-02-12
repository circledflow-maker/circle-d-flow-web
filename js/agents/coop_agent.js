/**
 * Agent: Co-Op Coordinator
 * Role: Manages Lobby Listings and Team Finding.
 */
class CoopAgent {
    constructor() {
        this.name = "CoopAgent";
        this.grid = null;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Scanning for Lobbies...`);
        this.grid = document.getElementById('lobby-grid');
        this.currentTab = 'available';
        
        // Simulate Network Delay
        setTimeout(() => this.renderLobbies(), 1000);
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.renderLobbies();
        
        // Visual Update for Tabs (Simplified)
        document.querySelectorAll('button[onclick^="window.CoopAgent.switchTab"]').forEach(btn => {
            if(btn.getAttribute('onclick').includes(tab)) {
                btn.classList.add('bg-orange-500', 'text-black');
                btn.classList.remove('text-white/50');
            } else {
                btn.classList.remove('bg-orange-500', 'text-black');
                btn.classList.add('text-white/50');
            }
        });
    }

    getMockLobbies() {
        // Includes Past/Future examples
        const all = [
            { id: 1, name: "Harmonizing the Garden", host: "Captain_Jack", mode: "Balance", slots: "3/4", level: "The Source", status: 'open' },
            { id: 2, name: "Scouting the Grid", host: "Sage_Master", mode: "Discovery", slots: "2/10", level: "Spark", status: 'open' },
            { id: 3, name: "Weaving the Beat", host: "DJ_Qter", mode: "Creation", slots: "1/4", level: "Wave", status: 'open' },
            { id: 4, name: "Guided Meditation", host: localStorage.getItem('cdf_username') || 'You', mode: "Harmony", slots: "4/5", level: "Circle", status: 'my_mission' },
            { id: 5, name: "Initiation Ritual", host: "You", mode: "Ritual", slots: "Closed", level: "Omen", status: 'completed' }
        ];

        if(this.currentTab === 'available') return all.filter(x => x.status === 'open');
        if(this.currentTab === 'mine') return all.filter(x => x.host === (localStorage.getItem('cdf_username') || 'You'));
        if(this.currentTab === 'log') return all.filter(x => x.status === 'completed');
        
        return [];
    }

    renderLobbies() {
        if(!this.grid) return;
        const lobbies = this.getMockLobbies();

        if(lobbies.length === 0) {
             this.grid.innerHTML = `
                <div class="col-span-full text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <span class="material-symbols-outlined text-5xl text-white/20 mb-4">wind_power</span>
                    <p class="text-white/40 font-mono">The Wind is silent here.</p>
                </div>
            `;
            return;
        }

        this.grid.innerHTML = lobbies.map(lobby => `
            <div class="bg-[#0F0A13] border border-white/10 hover:border-orange-500/50 rounded-xl p-6 transition-all group hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-600 to-transparent"></div>
                <div class="flex justify-between items-start mb-4">
                    <span class="px-2 py-1 rounded bg-orange-500/20 text-orange-300 text-[10px] font-mono uppercase tracking-widest border border-orange-500/30">
                        ${lobby.mode}
                    </span>
                    <span class="text-xs text-white/40 font-mono">${lobby.slots}</span>
                </div>
                
                <h3 class="text-xl font-display font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">${lobby.name}</h3>
                <p class="text-xs text-white/50 mb-6 font-mono">Guide: <span class="text-white/80">${lobby.host}</span></p>
                
                <div class="flex justify-between items-center border-t border-white/5 pt-4">
                    <span class="text-[10px] text-white/30 uppercase font-bold text-orange-500/80">RESONANCE: ${lobby.level.toUpperCase()}</span>
                    ${lobby.status === 'open' ? `<button class="px-4 py-2 bg-white/5 hover:bg-orange-600 hover:text-black text-orange-400 text-xs font-bold uppercase rounded transition-colors" onclick="alert('Aligning with: ${lobby.name}')">Enter Flow</button>` : ''}
                    ${lobby.status === 'completed' ? `<span class="text-xs text-green-500 font-bold uppercase">Fulfilled</span>` : ''}
                </div>
            </div>
        `).join('');
    }
}

new CoopAgent();
