/**
 * Archive Guardians (Phase 10 Agents)
 * The Inquisitor, The Harmonizer, The Prophet-Pusher.
 * These agents protect and guide the "Archive of Values".
 */

class ArchiveGuardians {
    constructor() {
        this.init();
    }

    init() {
        console.log("🏛️ Archive Guardians Awakened.");
        this.startProphetCycle();
    }

    // --- AGENT: THE PROPHET-PUSHER ---
    // Broadcasts wisdom periodically
    startProphetCycle() {
        const wisdoms = [
            "Honor is not given. It is built.",
            "Resonance is the echo of your actions.",
            "Loyalty to the Craft is loyalty to oneself.",
            "A beat without soul is just noise.",
            "The Circle grows only as we grow."
        ];

        // Every 30 seconds, inject a thought into Flowee if on Archive page
        setInterval(() => {
            const quote = wisdoms[Math.floor(Math.random() * wisdoms.length)];
            this.updateFloweeSage(quote);
        }, 15000); 
    }

    updateFloweeSage(text) {
        const floweeText = document.getElementById('flowee-text');
        if(floweeText) {
            floweeText.style.opacity = 0;
            setTimeout(() => {
                floweeText.innerText = `"${text}"`;
                floweeText.style.opacity = 1;
            }, 500);
        }
    }

    // --- AGENT: THE INQUISITOR ---
    // Checks for "Dark Aura" (Anti-Abuse)
    scanUser(userId) {
        console.log(`[Inquisitor] Scanning ${userId} for corruption...`);
        // Mock scan
        const reputation = localStorage.getItem('user_reputation') || 100;
        if(reputation < 50) {
            console.warn("⚠️ CORRUPTION DETECTED. Dimming Pillars.");
            this.dimPillars();
        }
    }

    dimPillars() {
        const pillars = document.querySelectorAll('.pillar');
        pillars.forEach(p => p.style.filter = "grayscale(100%) brightness(50%)");
    }

    // --- AGENT: THE HARMONIZER ---
    // Suggests connections based on Values
    harmonize() {
        // Logic to run on Dashboard mostly
        console.log("[Harmonizer] Aligning projects with Core Values...");
    }
}

// Initialize
const Guardians = new ArchiveGuardians();
