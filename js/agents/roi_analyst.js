/**
 * The ROI Analyst
 * ---------------
 * Role: Financial Intelligence & Efficiency Tracker
 * Goal: Prove the business case to investors via hard data.
 */

window.ROIAnalyst = {
    name: "The ROI Analyst",
    data: {
        totalRevenue: 124500,
        momGrowth: 18.4,
        locations: [
            { id: 'favela_lx', name: 'Favela LX (HQ)', efficiency: 94, sales: 4500 },
            { id: 'secret_garden', name: 'Secret Garden', efficiency: 88, sales: 3200 },
            { id: 'outbreak_studio', name: 'Outbreak Studio', efficiency: 76, sales: 1500 }
        ]
    },

    init() {
        console.log(`[${this.name}] Analyzing Royal Yield...`);
        this.startSimulation();
    },

    startSimulation() {
        // simulate live data updates
        setInterval(() => {
            this.updateTicker();
        }, 5000);
    },

    updateTicker() {
        // Randomly fluctuate sales
        const location = this.data.locations[Math.floor(Math.random() * this.data.locations.length)];
        const increase = Math.floor(Math.random() * 50) + 10;
        location.sales += increase;
        this.data.totalRevenue += increase;

        // Log to Dashboard if present
        this.logEvent(`New Transaction at ${location.name}: +€${increase} (Eff: ${location.efficiency}%)`);
        
        // Update DOM if on dashboard
        const totalEl = document.querySelector('.text-4xl.font-mono');
        if (totalEl) {
             // Format currency
             totalEl.innerHTML = `€${this.data.totalRevenue.toLocaleString()}<span class="text-amber text-lg">.00</span>`;
        }
    },

    logEvent(message) {
        // Dispatch event or direct append to a log container
        if (window.location.href.includes('investor_dashboard')) {
            const container = document.querySelector('.overflow-y-auto'); // Quick selector
            if (container) {
                const item = document.createElement('div');
                item.className = 'flex gap-4 items-start p-4 bg-white/5 rounded-xl border-l-2 border-green-500 animate-slide-in';
                item.innerHTML = `
                    <div class="bg-green-500/10 p-2 rounded-lg text-green-500">
                        <span class="material-symbols-outlined text-sm">payments</span>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white">ROI-Analyst</h4>
                        <p class="text-xs text-white/60 mt-1">${message}</p>
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
    window.ROIAnalyst.init();
});
