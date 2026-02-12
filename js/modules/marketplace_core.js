/**
 * MARKETPLACE CORE (The Trade Nexus)
 * Handles:
 * 1. Hybrid Currency Logic (Euro vs Flow)
 * 2. Netlify Forms Integration (P2P Trade Triggers)
 * 3. Auction Real-Time Simulation
 * 4. Supporter System (Stripe Mocks)
 */

window.MarketplaceCore = {
    state: {
        activeAuctions: [],
        currentSector: 'imperial', // 'imperial' | 'mercenary' | 'auction'
        cart: []
    },

    init: function() {
        console.log("[Marketplace] Core System Online.");
        this.startAuctionTimers();
        this.setupFormListeners();
    },

    // --- 1. TRADE LOGIC ---

    /**
     * Initiate a Trade
     * @param {Object} item - The artifact data
     * @param {string} currency - 'EUR' or 'FLOW'
     */
    initiateTrade: async function(item, currency) {
        console.log(`[Marketplace] Initiating Trade for ${item.title} via ${currency}`);

        if (currency === 'FLOW') {
            return this.processFlowPayment(item);
        } else {
            return this.openEuroTradeModal(item);
        }
    },

    processFlowPayment: function(item) {
        if (!window.Gamification) {
            console.error("Gamification Agent offline.");
            alert("System Error: Wallet not found.");
            return false;
        }

        const cost = parseInt(item.priceFlow);
        if (window.Gamification.spendTokens(cost, `Bought Artifact: ${item.title}`)) {
            // Success
            this.triggerSuccessModal(item, `${cost} FLOW`, 'INSTANT_TRANSFER');
            
            // Notify Merchant (Simulated)
            console.log(`[Marketplace] Flow transferred to ${item.ownerId}`);
            return true;
        } else {
            // Failed
            return false;
        }
    },

    openEuroTradeModal: function(item) {
        // Find existing modal or create dynamic one
        const modal = document.getElementById('euro-trade-modal');
        if(!modal) return; // Should be in HTML

        // Populate
        document.getElementById('trade-item-name').value = item.title;
        document.getElementById('trade-item-id').value = item.id;
        document.getElementById('trade-merchant-email').value = item.merchantEmail || 'admin@circledflow.com';
        document.getElementById('trade-price-display').innerText = `€${item.priceEur}`;

        modal.showModal();
    },

    // --- 2. NETLIFY FORMS HANDLING ---

    submitEuroTrade: function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        // Visual Feedback
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "Encrypting Transmission...";
        btn.disabled = true;

        // Fetch API for Netlify Forms (AJAX)
        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData).toString(),
        })
        .then(() => {
            document.getElementById('euro-trade-modal').close();
            this.triggerSuccessModal(
                { title: formData.get('item_name') }, 
                `€${formData.get('price_snapshot') || '?'}`, 
                'EMAIL_SENT'
            );
            form.reset();
        })
        .catch((error) => {
            console.error("Transmission Failed:", error);
            alert("Signal Jammed. Please try again.");
        })
        .finally(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        });
    },

    // --- 3. AUCTION SYSTEM ---

    startAuctionTimers: function() {
        setInterval(() => {
            const timers = document.querySelectorAll('[data-auction-end]');
            timers.forEach(timer => {
                const end = parseInt(timer.dataset.auctionEnd);
                const now = Date.now();
                const diff = end - now;

                if (diff <= 0) {
                    timer.innerText = "SOLD";
                    timer.classList.add('text-red-600');
                    // Trigger "Hammer" logic via event if not done
                } else {
                    timer.innerText = this.formatTime(diff);
                }
            });
        }, 1000);
    },

    formatTime: function(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    },

    placeBid: function(itemId, amount) {
        // Logic for backend (simulated)
        console.log(`[Auction] Bid of ${amount} placed on ${itemId}`);
        
        // Anti-Snipe: Check time
        // If < 60s remaining, add 30s (Mock logic)
        
        if(window.Gamification) {
             // Block funds? Or just check?
             // usually escrow. ensure user has funds.
        }

        // Notify
        if(window.Pusher) window.Pusher.showToast("Bid Placed!", "success");
    },

    // --- 4. SUPPORTER SYSTEM ---

    // --- 4. SUPPORTER SYSTEM ---

    openSupporterGateway: function() {
        // Mock Stripe Checkout
        const tiers = [
            { name: "Bronze Mate", price: 5 },
            { name: "Silver Scout", price: 15 },
            { name: "Gold Founder", price: 50 }
        ];
        
        let choice = prompt(`Choose your tier (1-3):\n1. Bronze (€5)\n2. Silver (€15)\n3. Gold (€50)`);
        if(!choice) return;

        alert("Redirecting to Stripe Secure Gateway...");
        // window.open('https://buy.stripe.com/mock_link', '_blank');
        
        setTimeout(() => {
            if(window.Gamification) {
                window.Gamification.addTokens(choice * 100, "Supporter Bonus"); // 1€ = 100FC
                window.Gamification.addKarma(choice * 10, "Donation");
            }
        }, 2000);
    },

    // --- 5. THE FORGE (UPLOAD ENGINE) ---
    
    openForge: function() {
        const modal = document.getElementById('forge-modal');
        if(modal) {
             modal.showModal();
             // Play Sound
             // AudioController.play('forge_open');
        } else {
            console.error("Forge Modal not found.");
        }
    },

    enterGild: function(gildName) {
        console.log(`[Grand Bazaar] Entering Guild: ${gildName}`);
        
        // Visual Transition (Zoom Effect)
        // In a real app, this would route to ?gild=arts or similar
        // For now, we simulate the "Dive"
        
        const map = document.querySelector('.bazaar-map');
        if(map) {
            map.style.transform = "scale(3)";
            map.style.opacity = "0";
            
            setTimeout(() => {
                 alert(`Entering the ${gildName.toUpperCase()} GUILD...\n(Sub-Page Loading...)`);
                 // Reset for Demo
                 map.style.transform = "scale(1)";
                 map.style.opacity = "1";
            }, 800);
        }
    },

    // --- 6. AUDIO SYSTEM (DJ CENTRAL) ---
    
    duckAudio: function(active) {
        // Simulates ducking the global volume when focusing on an artifact
        if(window.SoundEngineer) {
            const targetVol = active ? 0.1 : 0.8;
            console.log(`[DJ Central] Ducking Volume to ${targetVol * 100}%`);
            // window.SoundEngineer.setVolume(targetVol);
        } else {
            console.log(`[DJ Central] ${active ? 'Dimming' : 'Restoring'} Background Ambiance...`);
        }
    },

    // --- UTILS ---
    
    triggerSuccessModal: function(item, cost, type) {
        this.duckAudio(true); // Focus Audio
        
        const modal = document.getElementById('success-modal');
        if(modal) {
             document.getElementById('success-item-name').innerText = item.title;
             document.getElementById('success-price').innerText = cost;
             
             const msg = type === 'EMAIL_SENT' 
                ? "Request Sent! Check your email to finalize the trade." 
                : "Artifact transferred to your Vault.";
             
             document.getElementById('success-message').innerText = msg;
             
             modal.showModal();
             
             // Restore audio when closed
             modal.addEventListener('close', () => this.duckAudio(false), {once:true});
        } else {
            alert("Success: " + item.title);
            this.duckAudio(false);
        }
    },

    setupFormListeners: function() {
        // Attach to potential static forms or delegate
        document.addEventListener('submit', (e) => {
            if (e.target.getAttribute('name') === 'euro-trade') {
                this.submitEuroTrade(e);
            }
        });
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => window.MarketplaceCore.init());
