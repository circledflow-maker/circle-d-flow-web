/**
 * The Expansion Scout (Upgrade)
 * -----------------------------
 * Role: Strategic Location Analyst
 * Goal: Visualize growth opportunities via Heatmaps.
 */

window.ExpansionScout = {
    name: "The Expansion Scout",
    hotspots: [
        { name: "Marvila", demand: 85, saturation: 10 },
        { name: "Santos", demand: 72, saturation: 40 },
        { name: "Alvalade", demand: 60, saturation: 20 },
        { name: "Baixa", demand: 90, saturation: 80 } // High demand, high saturation (bad for expansion)
    ],

    init() {
        console.log(`[${this.name}] Calibrating Heatmap...`);
        // If we are on the dashboard, we might want to render a mini-map or log output
        this.analyzeTerrain();
    },

    analyzeTerrain() {
        // Find the best expansion spot (High Demand, Low Saturation)
        const bestSpot = this.hotspots.reduce((prev, current) => {
            const currentScore = current.demand - current.saturation;
            const prevScore = prev.demand - prev.saturation;
            return currentScore > prevScore ? current : prev;
        });

        this.logAnalysis(bestSpot);
    },

    logAnalysis(bestSpot) {
         if (window.location.href.includes('investor_dashboard')) {
            const container = document.querySelector('.overflow-y-auto');
            if (container) {
                 const item = document.createElement('div');
                item.className = 'flex gap-4 items-start p-4 bg-white/5 rounded-xl border-l-2 border-blue-500 animate-slide-in';
                item.innerHTML = `
                    <div class="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                        <span class="material-symbols-outlined text-sm">map</span>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white">Expansion-Scout</h4>
                        <p class="text-xs text-white/60 mt-1">Heatmap Analysis Complete. Prime Vector: <b class="text-white">${bestSpot.name}</b> (Score: ${bestSpot.demand - bestSpot.saturation}).</p>
                        <span class="text-[10px] text-white/30 mt-2 block font-mono">Just Now</span>
                    </div>
                `;
                container.prepend(item);
            }
        }
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.ExpansionScout.init();
});
