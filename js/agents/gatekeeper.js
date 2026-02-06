/**
 * Agent: The Gatekeeper
 * Purpose: Authentication State Management & Redirection.
 * "I guard the door. Only the worthy (authenticated) may pass to the Core."
 */

class GatekeeperAgent {
    constructor() {
        this.name = "The Gatekeeper";
        this.isAuthenticated = false;
        
        // Wait for DOM and Netlify Identity
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Scanning Identity...`);
        this.checkAuth();
        
        // Bind to Netlify Events if available
        if (window.netlifyIdentity) {
            window.netlifyIdentity.on('login', user => {
                console.log(`[${this.name}] Identity Confirmed. Opening Gates.`);
                this.enterCore();
            });
        }
    }

    checkAuth() {
        // Simple check using Netlify Identity's local storage key or object
        // Note: Actual verification happens on the dashboard/server, this is a UX redirect.
        const user = window.netlifyIdentity && window.netlifyIdentity.currentUser();
        
        if (user) {
            this.isAuthenticated = true;
            console.log(`[${this.name}] User Detected: ${user.email}`);
            // Auto-Redirect to Core
            this.enterCore();
        } else {
            console.log(`[${this.name}] Stranger Detected. Showing Gateway.`);
            // Ensure Gateway is visible (remove loading states if any)
            document.body.classList.remove('opacity-0');
        }
    }

    enterCore() {
        // Visual transition could go here
        window.location.href = 'pages/dashboard.html';
    }

    openExam() {
        // Trigger the Login Modal
        if (window.netlifyIdentity) {
            window.netlifyIdentity.open();
        } else {
            console.warn(`[${this.name}] Hunter Exam (Auth) Protocol missing!`);
            // Local Dev Bypass
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                if(confirm("[DEV MODE] Netlify Identity not detected. Bypass to Dashboard?")) {
                    this.enterCore();
                }
            } else {
                 alert("Authentication System Offline. Please check console.");
        }
        }
    }

    openBazaarPreview() {
        // 1. Create Modal if missing
        let modal = document.getElementById('bazaar-preview-modal');
        if(!modal) {
            modal = document.createElement('dialog');
            modal.id = 'bazaar-preview-modal';
            modal.className = "bg-transparent p-0 backdrop:bg-black/90 backdrop:backdrop-blur-md open:animate-scale-in";
            document.body.appendChild(modal);
        }

        // 2. Mock Artifacts
        const artifacts = [
            { name: "Void Essence", type: "Legendary", price: "5000 €", image: "https://pub-24ba376bfccb446996666eaff4dbae12.r2.dev/grid.png" },
            { name: "Neon Katana", type: "Rare", price: "1200 €", image: "" },
            { name: "Beat Pack Vol. 1", type: "Common", price: "50 €", image: "" },
            { name: "Cyber Deck", type: "Epic", price: "3500 €", image: "" }
        ];

        // 3. Build UI
        modal.innerHTML = `
            <div class="w-[700px] bg-[#0F0A13] border border-primary-500/30 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden relative">
                <!-- Header -->
                <div class="p-6 border-b border-white/10 flex justify-between items-center bg-primary-900/10 relative z-10">
                    <h2 class="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <span class="material-symbols-outlined text-mystic-gold">storefront</span>
                        Bazaar Preview
                    </h2>
                    <button onclick="document.getElementById('bazaar-preview-modal').close()" class="text-white/50 hover:text-white transition-colors material-symbols-outlined">close</button>
                </div>

                <!-- Slider Container -->
                <div class="p-8 overflow-x-auto custom-scrollbar flex gap-4 snap-x">
                    ${artifacts.map(item => `
                        <div class="min-w-[200px] bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:bg-white/10 transition-colors snap-center group">
                            <div class="aspect-square bg-black/50 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-primary-500/50 transition-colors">
                                <span class="material-symbols-outlined text-4xl text-white/20 group-hover:text-primary-500">diamond</span>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm">${item.name}</h3>
                                <p class="text-[10px] text-white/50 uppercase tracking-widest">${item.type}</p>
                            </div>
                            <div class="mt-auto flex justify-between items-center text-xs">
                                <span class="text-mystic-gold font-mono">${item.price}</span>
                                <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50">PREVIEW</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Footer -->
                <div class="p-4 bg-black/50 border-t border-white/5 text-center">
                    <button onclick="Gatekeeper.openExam()" class="text-xs text-primary-400 hover:text-primary-300 uppercase tracking-widest transition-colors font-bold">
                        Login to Purchase
                    </button>
                </div>
            </div>
        `;

        modal.showModal();
    }
}

// Initialize
window.Gatekeeper = new GatekeeperAgent();
