/**
 * Agent: Kingdom of Science (The Profile)
 * Role: Manages User Reputation, Artifact Portfolio, and Permission Gates.
 */

class KingdomScience {
    constructor() {
        this.name = "KingdomScience";
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Compiling Research Data...`);
        window.KingdomScience = this;
    }

    /**
     * Renders the Profile inside the Network Hub Container
     */
    renderProfile(container) {
        // Mock Data (In real scenario, this comes from localStorage or backend)
        const user = {
            name: localStorage.getItem('userName') || 'Guest',
            level: localStorage.getItem('cdf_user_level') || 1,
            class: localStorage.getItem('userClass') || 'Initiate',
            nen: localStorage.getItem('userNenType') || 'Unknown',
            reputation: parseInt(localStorage.getItem('cdf_karma') || 0)
        };

        // If Guest viewing another profile (Mock Logic for now)
        // For tutorial, we show OWN profile.
        
        container.innerHTML = `
            <div class="relative min-h-full bg-[#0F0A13]">
                <!-- Header: Alchemist Identity -->
                <div class="h-48 bg-gradient-to-r from-[#141018] to-black border-b border-white/10 relative p-8 flex items-end">
                     <div class="absolute top-0 right-0 p-4 opacity-10">
                        <span class="material-symbols-outlined text-9xl">science</span>
                     </div>
                     
                     <div class="flex items-end gap-6 relative z-10">
                        <div class="w-24 h-24 rounded-2xl bg-black border-2 border-electric overflow-hidden shadow-[0_0_30px_rgba(154,77,255,0.3)]">
                             <img src="../Assets/images/logo.png" class="w-full h-full object-cover">
                        </div>
                        <div class="mb-2">
                             <div class="flex items-center gap-2 mb-1">
                                <h1 class="text-3xl font-bold text-white tracking-widest uppercase">${user.name}</h1>
                                <span class="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/30 uppercase">Verified</span>
                             </div>
                             <div class="text-xs text-white/60 font-mono flex items-center gap-4">
                                <span>Lvl ${user.level} ${user.class}</span> //
                                <span>Type: ${user.nen}</span> //
                                <span class="text-electric">Reputation: ${user.reputation}</span>
                             </div>
                        </div>
                     </div>
                </div>

                <!-- Main Grid -->
                <div class="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    <!-- Left: Siphon Contributions (Knowledge) -->
                    <div class="lg:col-span-1 space-y-6">
                        <div class="bg-black/40 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden group">
                             <div class="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                             <h4 class="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2 relative z-10">
                                <span class="material-symbols-outlined text-lg">school</span> THE SIPHON
                             </h4>
                             <div class="space-y-3 relative z-10">
                                <div class="text-xs text-white/80 border-l-2 border-white/20 pl-3">
                                    <div class="font-bold">Beta Protocol</div>
                                    <div class="text-[10px] text-white/40">Verified 2 days ago</div>
                                </div>
                                <div class="text-xs text-white/80 border-l-2 border-white/20 pl-3">
                                    <div class="font-bold">Flow Mechanics</div>
                                    <div class="text-[10px] text-white/40">Verified 5 days ago</div>
                                </div>
                             </div>
                        </div>

                         <button class="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2" onclick="alert('Exporting Certificate to PDF...')">
                            <span class="material-symbols-outlined text-sm">download</span> Export Certificate
                         </button>
                    </div>

                    <!-- Center: Artifact Gallery -->
                    <div class="lg:col-span-2">
                         <h4 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg text-amber">diamond</span> ARTIFACT GALLERY
                         </h4>
                         
                         <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                             <!-- Artifact 1 -->
                             <div class="aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center relative group cursor-pointer hover:border-amber transition-colors">
                                 <span class="material-symbols-outlined text-4xl text-white/20 group-hover:text-amber group-hover:scale-110 transition-all">token</span>
                                 <div class="absolute bottom-2 left-2 text-[10px] text-white/50">Quest Token</div>
                             </div>
                             <!-- Empty Slot -->
                             <div class="aspect-square border border-white/5 border-dashed rounded-xl flex items-center justify-center opacity-50">
                                 <span class="material-symbols-outlined text-2xl text-white/10">add</span>
                             </div>
                             <div class="aspect-square border border-white/5 border-dashed rounded-xl flex items-center justify-center opacity-50">
                                 <span class="material-symbols-outlined text-2xl text-white/10">add</span>
                             </div>
                         </div>
                    </div>

                    <!-- Right: Honor Roll -->
                    <div class="lg:col-span-1">
                        <h4 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg text-red-500">history_edu</span> HONOR ROLL
                        </h4>
                        <div class="space-y-2">
                             <!-- Badge -->
                             <div class="bg-black/40 border border-white/10 p-3 rounded-lg flex items-center gap-3">
                                 <div class="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center">
                                     <span class="material-symbols-outlined text-sm text-red-500">verified</span>
                                 </div>
                                 <div>
                                     <div class="text-xs font-bold text-white">Initiation Complete</div>
                                     <div class="text-[9px] text-white/40">The First Step</div>
                                 </div>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }
}

new KingdomScience();
