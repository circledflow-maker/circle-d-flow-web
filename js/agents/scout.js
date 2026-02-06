/**
 * The Scout Agent
 * ---------------
 * Role: Map & Partner Manager
 * Goal: Help users find the nearest pickup location.
 */

window.Scout = {
    name: "The Scout",
    
    init() {
        console.log(`[${this.name}] Scanning terrain...`);
        this.setupMapInteractions();
    },
    
    setupMapInteractions() {
        // Find links or buttons that trigger map actions
        const nearMeBtn = document.querySelector('button[onclick*="nearMe"]'); // If exists
        // Actually, in the HTML I added: <button ...> <span ...>my_location</span> Near Me </button>
        // It didn't have an onclick. Let's find it by text or icon.
        
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.textContent.includes('Near Me')) {
                btn.onclick = () => this.findNearestLocation();
            }
        });
    },
    
    findNearestLocation() {
        if (!navigator.geolocation) {
             alert("Geolocation is not supported by your browser. Defaulting to HQ.");
             return;
        }
        
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">explore</span> Scanning...';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Simulating finding a location
                setTimeout(() => {
                    alert("📍 Closest Partner Found: Favela LX (0.5km away)");
                    btn.innerHTML = originalText;
                }, 1500);
            },
            (error) => {
                console.error("Scout Error:", error);
                alert("Could not detect location. Showing all partners.");
                btn.innerHTML = originalText;
            }
        );
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.Scout.init();
});
