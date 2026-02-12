/**
 * GENESIS PROTOCOL: The Initiation
 * Handles the "Genesis Check" (Quiz), Class Assignment, and the Opening of the Yggdrasil Gate.
 */

const Genesis = {
    state: {
        step: 0,
        scores: {
            weaver: 0,
            soundsmith: 0,
            visionary: 0,
            alchemist: 0
        },
        selectedClass: null
    },

    // The "Genesis Check" Questions (Hip Hop, One Piece, Artist Life)
    questions: [
        {
            id: 1,
            theme: "HIP HOP",
            text: "The beat drops. The cypher circle opens. What is your instinct?",
            options: [
                { text: "Weave the connections between the crew.", class: "weaver", icon: "hub" }, // Emerald
                { text: "Drop a flow that shakes the ground.", class: "soundsmith", icon: "graphic_eq" }, // Violet
                { text: "Visualize the scene like a movie director.", class: "visionary", icon: "visibility" }, // Gold
                { text: "Ensure everyone is fed and supplied.", class: "alchemist", icon: "restaurant" } // Red
            ]
        },
        {
            id: 2,
            theme: "ONE PIECE",
            text: "You discover a Devil Fruit. What power does it grant you?",
            options: [
                { text: "The Spider-Web Fruit (Network & Control)", class: "weaver", icon: "share" },
                { text: "The Rumble-Rumble Fruit (Sound & Energy)", class: "soundsmith", icon: "music_note" },
                { text: "The Future-Sight Fruit (Prophecy & Design)", class: "visionary", icon: "light_mode" },
                { text: "The Banquet-Banquet Fruit (Creation & Matter)", class: "alchemist", icon: "science" }
            ]
        },
        {
            id: 3,
            theme: "ARTIST LIFE",
            text: "Deadline is in 1 hour. Zero energy. What saves you?",
            options: [
                { text: "Calling my Nakama for backup.", class: "weaver", icon: "groups" },
                { text: "Putting on the 'God Mode' playlist.", class: "soundsmith", icon: "headphones" },
                { text: "A sudden flash of pure inspiration.", class: "visionary", icon: "bolt" },
                { text: "A strong coffee and a solid meal.", class: "alchemist", icon: "coffee" }
            ]
        }
    ],

    init() {
        console.log("🌀 [Genesis] Protocol Loaded. Waiting for Initiation.");
    },

    startInitiation() {
        console.log("🌀 [Genesis] Initiation Started.");
        
        // 1. Hide Welcome / Hero Section softly
        const hero = document.querySelector('section.max-w-4xl'); // Target the hero section
        if (hero) hero.style.opacity = '0';
        
        // 2. Show Genesis Modal
        const modal = document.getElementById('genesis-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Ensure flex display
        
        // 3. Render First Question
        this.renderQuestion(0);
    },

    renderQuestion(index) {
        if (index >= this.questions.length) {
            this.finalizeInitiation();
            return;
        }

        this.state.step = index;
        const q = this.questions[index];
        const container = document.getElementById('genesis-content');

        // Animation: Fade Out -> In
        container.style.opacity = '0';
        
        setTimeout(() => {
            container.innerHTML = `
                <div class="text-center space-y-8 animate-fade-in-up">
                    <span class="text-xs font-mono text-white/30 tracking-[0.3em]">GENESIS CHECK ${index + 1}/3</span>
                    
                    <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-shadow-neon">
                        <span class="text-primary block text-sm mb-2 font-mono tracking-widest">${q.theme}</span>
                        ${q.text}
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        ${q.options.map((opt, i) => `
                            <button onclick="Genesis.handleAnswer('${opt.class}')" 
                                class="genesis-option group relative p-6 glass-obsidian border border-white/10 hover:border-primary/50 transition-all duration-300 text-left rounded-xl hover:bg-white/5">
                                <div class="flex items-center gap-4">
                                    <span class="material-symbols-outlined text-white/30 group-hover:text-primary transition-colors text-3xl">${opt.icon}</span>
                                    <span class="text-sm font-bold text-white/80 group-hover:text-white uppercase tracking-wider">${opt.text}</span>
                                </div>
                                <!-- Hover Glow -->
                                <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            container.style.opacity = '1';
        }, 300);
    },

    handleAnswer(className) {
        try {
            console.log(`[Genesis] Answered: ${className}`);
            // 1. Score
            this.state.scores[className]++;
            
            // 2. Next Question
            this.renderQuestion(this.state.step + 1);
        } catch (err) {
            console.error("[Genesis] Error in handleAnswer:", err);
            // Attempt recovery
            this.finalizeInitiation();
        }
    },

    finalizeInitiation() {
        console.log("[Genesis] Finalizing Initiation...");
        try {
            // 1. Calculate Winner
            const scores = this.state.scores;
            let winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
            
            // Capitalize for display
            const displayClass = winner.charAt(0).toUpperCase() + winner.slice(1);
            this.state.selectedClass = displayClass;

            console.log("💎 [Genesis] Class Assigned:", displayClass);

            // 2. Persist to LocalStorage (Safe Mode)
            try {
                const userState = {
                    level: 1,
                    xp: 100,
                    class: displayClass,
                    initiated: true,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('user_gamification_state', JSON.stringify(userState));
                localStorage.setItem('userClass', displayClass); 
                localStorage.setItem('cqr_auth_state', 'logged_in'); 
            } catch (e) {
                console.warn("[Genesis] LocalStorage Access Denied:", e);
            }

            // 3. SHOW RESULT CARD (Immediate Visual Feedback)
            const container = document.getElementById('genesis-content');
            if (!container) throw new Error("Genesis Content Container not found");

            container.innerHTML = `
                <div class="text-center space-y-8 animate-float">
                    <span class="material-symbols-outlined text-6xl text-mystic-gold mb-4 animate-pulse-slow">verified</span>
                    <h2 class="text-5xl font-bold text-white">GENESIS COMPLETE</h2>
                    <p class="text-xl text-white/60">Your resonance has been detected.</p>
                    
                    <div class="p-8 border-2 border-primary/50 bg-black/50 rounded-2xl max-w-md mx-auto relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-50"></div>
                        <h3 class="text-3xl font-bold text-white uppercase tracking-widest relative z-10">THE ${displayClass.toUpperCase()}</h3>
                        <p class="text-xs text-primary mt-2 font-mono relative z-10">CLASS ASSIGNED</p>
                    </div>

                    <div class="mt-8">
                         <button onclick="Genesis.openGate()" 
                            class="px-12 py-4 bg-primary text-white font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all rounded-full shadow-[0_0_30px_rgba(138,43,226,0.5)]">
                            Enter The True Kingdom
                        </button>
                        <p class="text-xs text-white/30 mt-4 font-mono">Auto-jump in <span id="jump-timer">10</span>s...</p>
                    </div>
                </div>
            `;

            // 4. SYNC TO SUPABASE (Background Process)
            this.syncToSupabase(displayClass, scores);

            // 5. Auto-Redirect Timer
            let timeLeft = 10;
            const timerEl = document.getElementById('jump-timer');
            const interval = setInterval(() => {
                timeLeft--;
                if(timerEl) timerEl.innerText = timeLeft;
                if(timeLeft <= 0) {
                    clearInterval(interval);
                    this.openGate();
                }
            }, 1000);

        } catch (err) {
            console.error("[Genesis] Critical Error in Finalization:", err);
            alert("Initiation Complete. Press OK to enter.");
            this.openGate(); // Force entry
        }
    },

    openGate() {
        console.log("🌀 [Genesis] Opening The Gate...");
        try {
            // 1. Trigger Animation
            const overlay = document.querySelector('.gate-overlay');
            if(overlay) {
                overlay.classList.remove('hidden');
                const leftGate = document.querySelector('.gate-left');
                const rightGate = document.querySelector('.gate-right');
                
                // Allow layout to settle before animating
                requestAnimationFrame(() => {
                    if(leftGate) leftGate.style.transform = "translateX(0)";
                    if(rightGate) rightGate.style.transform = "translateX(0)";
                    setTimeout(() => {
                        if(leftGate) leftGate.style.transform = "translateX(-100%)";
                        if(rightGate) rightGate.style.transform = "translateX(100%)";
                        overlay.style.opacity = '0'; 
                    }, 100);
                });
            }
        } catch (e) {
            console.warn("Animation failed, skipping...", e);
        }

        // 2. Redirect to Dashboard (The Standard Hub)
        setTimeout(() => {
            console.log("🚀 [Genesis] Jumping to Dashboard.");
            window.location.href = 'dashboard.html';
        }, 2000); 
    }
};

// Initialize if script loaded
if (document.readyState !== 'loading') Genesis.init();
else document.addEventListener('DOMContentLoaded', () => Genesis.init());
