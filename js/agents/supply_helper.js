/**
 * The Supply Helper Agent
 * -----------------------
 * Role: Roadmap Calculator
 * Goal: Vizualize the "Steps to the Truck" progress.
 */

window.SupplyHelper = {
    name: "The Supply Helper",
    currentFuel: 65, // Base %
    
    init() {
        console.log(`[${this.name}] Calibrating fuel gauge...`);
        this.animateBar();
    },
    
    animateBar() {
        const bar = document.getElementById('journey-bar');
        if (!bar) return;
        
        // Reset to 0 for animation effect
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = `${this.currentFuel}%`;
        }, 500);
    },
    
    updateProgress(amount) {
        this.currentFuel = Math.min(100, this.currentFuel + amount);
        const bar = document.getElementById('journey-bar');
        if (bar) {
            bar.style.width = `${this.currentFuel}%`;
            
            // Show +Effect
            this.showFuelAddedEffect(amount);
        }
    },
    
    showFuelAddedEffect(amount) {
        // Find the bar
        const bar = document.getElementById('journey-bar');
        if (!bar) return;
        
        const rect = bar.getBoundingClientRect();
        
        const effect = document.createElement('div');
        effect.className = 'fixed text-green-500 font-bold text-xl z-[70] pointer-events-none animate-float-up';
        effect.style.left = `${rect.right}px`;
        effect.style.top = `${rect.top - 20}px`;
        effect.innerText = `+${amount}% Fuel`;
        
        document.body.appendChild(effect);
        
        // Clean up
        setTimeout(() => effect.remove(), 2000);
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.SupplyHelper.init();
});
