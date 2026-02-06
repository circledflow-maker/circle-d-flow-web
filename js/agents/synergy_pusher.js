/**
 * The Synergy Pusher
 * ------------------
 * Role: Ecosystem Connector
 * Goal: Prove user value maximization through cross-promotion.
 */

window.SynergyPusher = {
    name: "The Synergy Pusher",
    synergies: [
        { source: 'Kitchen', target: 'Music', desc: "User bought 'Jollof Rice' -> Suggested 'Afrobeat Playlist'." },
        { source: 'Kitchen', target: 'Fashion', desc: "User waited 10m -> Offered 5% off 'Flow Hoodie'." },
        { source: 'Events', target: 'Kitchen', desc: "Event Ticket purchased -> Unlocked 'VIP Meal Deal'." }
    ],

    init() {
        console.log(`[${this.name}] Weaving the web...`);
        this.startSimulation();
    },

    startSimulation() {
        setInterval(() => {
            if (Math.random() > 0.6) { // Occasional trigger
                this.triggerSynergy();
            }
        }, 8000);
    },

    triggerSynergy() {
        const synergy = this.synergies[Math.floor(Math.random() * this.synergies.length)];
        
        let color = 'purple';
        let icon = 'hub';
        
        this.logEvent(synergy.desc, color, icon);
    },

    logEvent(message, color, icon) {
        if (window.location.href.includes('investor_dashboard')) {
            const container = document.querySelector('.overflow-y-auto');
            if (container) {
                const item = document.createElement('div');
                item.className = `flex gap-4 items-start p-4 bg-white/5 rounded-xl border-l-2 border-${color}-500 animate-slide-in`;
                item.innerHTML = `
                    <div class="bg-${color}-500/10 p-2 rounded-lg text-${color}-500">
                        <span class="material-symbols-outlined text-sm">${icon}</span>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white">Synergy-Pusher</h4>
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
    window.SynergyPusher.init();
});
