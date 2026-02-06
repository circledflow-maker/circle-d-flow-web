/**
 * Agent: Flowee (The Hip Hop Pirate Phoenix)
 * Purpose: Guide, Hype-Man, and Navigator.
 * Personality: Energetic, slang-heavy, helpful but edgy.
 */

class FloweeAgent {
    constructor() {
        this.name = "Flowee";
        this.quotes = [
            "Yo Hunter! Let's get that Flow flowing! 🔥",
            "Don't just stare at the Void, jump in!",
            "Got beats? We got the streets. 🎧",
            "This Nexus is built different. Just like you.",
            "Click that button, let's start the Exam! ⚔️",
            "I smell raw talent... or is that just burnt pixels?",
            "Keep your Nen tight and your flows bright."
        ];
        
        this.onboarding = [
            "Yo Flow Creator! Welcome to the Gateway! 🏴‍☠️",
            "This is the Nexus of Visuals, Sound, and Taste.",
            "See those pillars? That's the Bazaar, the Circle, and the Academy.",
            "But you're just a guest right now...",
            "Smash that 'ENTER' button to start your journey!",
            "Let's get it! 🔥"
        ];
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Spreading wings...`);
        this.element = document.getElementById('flowee-visual');
        this.bubble = document.getElementById('flowee-bubble');
        this.container = document.getElementById('flowee-agent');

        if (!this.element || !this.bubble) {
            console.warn(`[${this.name}] Body not found! I'm a ghost!`);
            return;
        }

        // Initialize Flight
        this.startFlying();

        // Create Skip Button
        this.createControls();

        // Bind Click (Next Line)
        this.container.addEventListener('click', () => this.nextOnboarding());

        // Start Onboarding Sequence
        setTimeout(() => {
            this.detectContext();
            this.startOnboarding();
        }, 1000);
    }

    detectContext() {
        // If quotes were already customized (e.g. by dashboard), don't overwrite
        if (this.hasCustomQuotes) return;

        const path = window.location.pathname;
        const title = document.title.toLowerCase();

        if (path.includes('pricing') || title.includes('price')) {
            this.quotes = [
                "Investment in yourself is the best kind. 💎",
                "Value for value. That's the Law of Equivalent Exchange.",
                "Ready to commit to the Flow?"
            ];
            this.onboarding = ["Yo! Checking the loot tables? 💰", "These plans are designed to scale with you.", "From Scout to King."];
        } else if (path.includes('contact') || title.includes('contact')) {
            this.quotes = [
                "The line is open. 📞",
                "Signal strength: 100%.",
                "Let's weave a new connection."
            ];
            this.onboarding = ["Need to reach the Council? 📨", "Drop a signal flare.", "We respond faster than light."];
        } else if (path.includes('blog') || title.includes('blog')) {
            this.quotes = [
                "Knowledge is power. 📚",
                "Read the scrolls, learn the secrets.",
                "Updates from the front lines."
            ];
            this.onboarding = ["Welcome to the Chronicles! 📜", "Here's what's happening in the Kingdom.", "Stay updated, stay ahead."];
        } else if (path.includes('login') || title.includes('login')) {
             this.quotes = [
                "Identify yourself, Hunter. 🛡️",
                "The Gate is watching.",
                "Enter your seal."
            ];
            this.onboarding = ["Halt! State your business. 🛑", "Just kidding. Log in to access the Core.", "Your dashboard awaits."];
        } else if (path.includes('events') || title.includes('event')) {
            this.quotes = [
                "Where the magic happens. ✨",
                "Don't miss the next gathering.",
                "The party never stops in the Underworld."
            ];
        } else if (path.includes('gallery') || title.includes('gallery')) {
            this.quotes = [
                "Pure visual excellence. 🖼️",
                "A moment frozen in time.",
                "Art is the explosion!"
            ];
            this.visionaryMode(true); // Auto-trigger Aura
        }
    }
    createControls() {
        const controls = document.createElement('div');
        controls.className = "absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 transition-opacity duration-300 pointer-events-none";
        controls.id = "flowee-controls";
        controls.innerHTML = `
            <button id="flowee-skip" class="px-2 py-1 bg-black/80 border border-white/20 text-[8px] text-white/50 hover:text-white rounded uppercase tracking-wider backdrop-blur-sm">Skip Intro</button>
        `;
        this.container.appendChild(controls);
        
        document.getElementById('flowee-skip').addEventListener('click', (e) => {
            e.stopPropagation();
            this.endOnboarding();
        });
    }

    startOnboarding() {
        // Allow external suppression (e.g., by Merchant Agent)
        if (window.suppressFloweeDefault) {
             console.log(`[${this.name}] Default onboarding suppressed by local agent.`);
             return;
        }

        this.isOnboarding = true;
        this.stepIndex = 0;
        this.showControls(true);
        this.talk(true, this.onboarding[0]);
    }

    nextOnboarding() {
        if (window.suppressFloweeDefault) return; // Disable clicks in override mode

        if (!this.isOnboarding) {
            this.talk(true); // Normal chatter
            return;
        }

        this.stepIndex++;
        if (this.stepIndex < this.onboarding.length) {
            const text = this.onboarding[this.stepIndex];
            this.talk(true, text);

            // Context Actions
            if (text.includes("Pillars") || text.includes("Bazaar")) {
                this.highlight('.grid'); // Highlight pillars
            }
            if (text.includes("ENTER")) {
                this.highlight('button'); // Highlight CTA
                // Make Flowee point/shake
                this.element.classList.add('animate-bounce');
            }
        } else {
            this.endOnboarding();
        }
    }

    flyTo(selector) {
        const target = document.querySelector(selector);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        // Calculate position relative to viewport centering
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top - 100; // Hover above

        // Apply visual transformation
        this.container.style.transition = 'all 1.5s ease-in-out';
        this.container.style.left = `${targetX}px`;
        this.container.style.top = `${targetY}px`;
        this.container.style.right = 'auto'; // release default
        
        // Add "Look at" class
        this.element.classList.add('animate-bounce');
        
        // Auto reset after 4 seconds
        setTimeout(() => this.resetPosition(), 4000);
    }

    resetPosition() {
        this.container.style.transition = 'all 1.5s ease-in-out';
        this.container.style.top = '8rem'; // top-32
        this.container.style.right = '2rem'; // right-8
        this.container.style.left = 'auto';
        this.element.classList.remove('animate-bounce');
    }

    highlight(selector) {
        // Remove old highlights
        document.querySelectorAll('.ring-4').forEach(el => el.classList.remove('ring-4', 'ring-mystic-gold', 'animate-pulse'));
        
        const el = document.querySelector(selector);
        if (el) {
            el.classList.add('ring-4', 'ring-mystic-gold', 'animate-pulse');
            // Move Flowee to explain!
            this.flyTo(selector);
        }
    }

    shush() {
        this.isTalking = false;
        // Hide Bubble
        this.bubble.classList.add('opacity-0', 'pointer-events-none');
        this.bubble.classList.remove('scale-100');
        
        // Stop Jitter, Resume smooth flying
        this.element.classList.remove('animate-flowee-talk');
        this.element.classList.add('animate-flowee-fly');
    }
    // --- EYE OF TRUTH FEATURES ---

    scholarMode(active) {
        if (active) {
            this.element.src = "../Assets/images/flowee_scholar.png"; // Fallback to pirate if missing
            this.element.classList.add('filter', 'sepia', 'contrast-125'); // Aesthetic filter
        } else {
            this.element.src = "../Assets/images/flowee_pirate_phoenix.png"; // Reset
            this.element.classList.remove('filter', 'sepia', 'contrast-125');
        }
    }

    visionaryMode(active) {
        if (active) {
            this.element.src = "../Assets/images/flowee_pirate_phoenix.png"; 
            // Add Pink Eye/Camera Aura
            this.element.style.filter = "drop-shadow(0 0 10px #EC4899) contrast(1.2)";
            this.quotes = [
                "Focus on the Soul, Captain. 📸",
                "Capture the Flow before it fades.",
                "The Eye sees what the lens misses.",
                "Every portrait is a mirror. Look closer."
            ];
            this.talk(true, "Shh... The light is perfect. Welcome to the Visionary's Den.");
        } else {
            this.element.style.filter = ""; // Reset
             this.quotes = [
                "Yo Hunter! Let's get that Flow flowing! 🔥",
                "Don't just stare at the Void, jump in!",
                "Got beats? We got the streets. 🎧",
                "This Nexus is built different. Just like you.",
                "Click that button, let's start the Exam! ⚔️",
                "I smell raw talent... or is that just burnt pixels?",
                "Keep your Nen tight and your flows bright."
            ];
        }
    }

    djMode(active) {
        if (active) {
            this.element.src = "../Assets/images/flowee_pirate_phoenix.png"; // Placeholder for specific DJ Image
            // Add Headphones Aura
            this.element.style.filter = "drop-shadow(0 0 10px #9A4DFF) hue-rotate(270deg)";
            this.quotes = [
                "Feel that bass, Captain? 🎧",
                "The Frequency is aligned.",
                "Drop it like it's hot!",
                "This sound... it's the heartbeat of Yggdrasil."
            ];
            this.talk(true, "Yo Captain! Welcome to the Sound Command. I'm tuning into the Frequency...");
        } else {
            this.element.style.filter = ""; // Reset
             this.quotes = [
                "Yo Hunter! Let's get that Flow flowing! 🔥",
                "Don't just stare at the Void, jump in!",
                "Got beats? We got the streets. 🎧",
                "This Nexus is built different. Just like you.",
                "Click that button, let's start the Exam! ⚔️",
                "I smell raw talent... or is that just burnt pixels?",
                "Keep your Nen tight and your flows bright."
            ];
        }
    }

    whisper(text) {
        // Create a temporary popup near Flowee
        const whisperEl = document.createElement('div');
        whisperEl.className = "absolute -top-16 right-0 bg-[#E3D4B5] text-[#1A1622] text-[10px] font-serif p-2 rounded border border-[#C9B48C] shadow-lg animate-fade-in-up w-48 z-50 pointer-events-none";
        whisperEl.innerHTML = `<span class="font-bold">✨ Insight:</span> ${text}`;
        this.container.appendChild(whisperEl);

        // Remove after 5s
        setTimeout(() => whisperEl.remove(), 5000);
    }

    smartSearch(topic) {
        this.talk(true, `You ask about "${topic}"? Let me check the Archives...`);
        this.flyTo('#codex-search'); // Pretend to fly to search bar
        setTimeout(() => {
            if (this.scholarMode) this.whisper(`Found 3 Scrolls related to ${topic}.`);
        }, 2000);
    }

    // --- NEW MODES (Phase 17) ---

    resetModes() {
        this.element.style.filter = "";
        // Reset to default image if needed, though we often keep the pirate one as base
        // this.element.src = "../Assets/images/flowee_pirate_phoenix.png"; 
    }

    initRoyalMode() {
        this.resetModes();
        // Gold Aura + Sepia for "Royal" look
        this.element.style.filter = "drop-shadow(0 0 15px #FFD700) sepia(1) contrast(1.1)";
        this.quotes = [
            "Heavy is the head that wears the crown... 👑",
            "This Kingdom is yours to command.",
            "The pulse of the network is steady.",
            "Shall we expand the territory, Architect?"
        ];
        // Immediate Greeting happens in master_dashboard.js, but we can double down or just set state
        this.isRoyal = true;
    }

    initScientistMode() {
        this.resetModes();
        // Green/Matrix Aura + Hue Rotate for "Science" look
        this.element.style.filter = "drop-shadow(0 0 15px #00FF41) hue-rotate(45deg) contrast(1.2)";
        this.quotes = [
            "Hypothesis confirmed: You are awesome. 🧪",
            "The variables are aligning perfectly.",
            "Just one more experiment...",
            "Science is the elegant language of the universe.",
            "10 Billion Percent certainty!"
        ];
        this.isScientist = true;
    }
}

// Initialize
window.Flowee = new FloweeAgent();
