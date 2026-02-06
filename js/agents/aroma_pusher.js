/**
 * The Aroma Pusher Agent
 * ----------------------
 * Role: Notification Engine
 * Goal: Drive traffic to the kitchen with sensory triggers.
 */

window.AromaPusher = {
    name: "The Aroma Pusher",
    scents: [
        "Fresh Jollof Rice is ready! 🍚",
        "Can you smell the grilled Tilapia? 🐟",
        "Hot Plantains just came out of the fryer! 🍌",
        "The Queen is cooking something special... 👑",
        "Hungry? The Hearth is open."
    ],
    
    init() {
        console.log(`[${this.name}] Starting diffusion...`);
        // Start random notifications loop
        this.scheduleNextScent();
    },
    
    scheduleNextScent() {
        // Random interval between 30s and 2min
        const delay = Math.floor(Math.random() * (120000 - 30000 + 1) + 30000);
        setTimeout(() => {
            this.releaseScent();
            this.scheduleNextScent();
        }, delay);
    },
    
    releaseScent() {
        const scent = this.scents[Math.floor(Math.random() * this.scents.length)];
        this.showToast(scent);
    },
    
    showToast(message) {
        // Create container if not exists
        let container = document.getElementById('aroma-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'aroma-container';
            container.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none md:bottom-8 md:left-8 md:translate-x-0';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = 'bg-black/80 backdrop-blur-md border border-amber/50 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,191,0,0.3)] flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-500 animate-bounce-subtle pointer-events-auto cursor-pointer hover:bg-black';
        toast.innerHTML = `
            <span class="material-symbols-outlined text-amber animate-pulse">skillet</span>
            <span class="text-sm font-bold tracking-wide">${message}</span>
        `;
        
        toast.onclick = () => {
             document.getElementById('menu-grid').scrollIntoView({behavior: 'smooth'});
             toast.remove();
        };

        container.appendChild(toast);
        
        // Animate In
        setTimeout(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        }, 100);
        
        // Remove after 5s
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on the kitchen page
    if (window.location.href.includes('african-queen-kitchen')) {
        window.AromaPusher.init();
    }
});
