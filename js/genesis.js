/**
 * GENESIS PROTOCOL: The Initiation
 * Handles the "Genesis Check" (Quiz), Class Assignment, and the Opening of the Yggdrasil Gate.
 */

const Genesis = {
    state: {
        step: 0,
        scores: {
            arcane: 0,
            kinetic: 0,
            visionary: 0,
            harmonizer: 0,
            soundsmith: 0,
            alchemist: 0
        },
        selectedClass: null
    },

    // The Oracle of Yggdrasil Questions
    questions: [
        {
            id: 1,
            theme: "RESONANCE CHECK",
            text: "When the cosmic storm rises, what part of the spirit are you?",
            options: [
                { text: "The Lightning - Pulsing with binary codes and systems.", class: "arcane", icon: "bolt" },
                { text: "The Wave - Adapting to the flow with pure physical power.", class: "kinetic", icon: "waves" },
                { text: "The Rock - Standing as the disciplined base of the mountain.", class: "kinetic", icon: "terrain" },
                { text: "The Wind - Moving the seeds of the future through vision.", class: "visionary", icon: "air" }
            ]
        },
        {
            id: 2,
            theme: "FLOW STATE",
            text: "When do you lose your sense of time in the Yggdrasil Matrix?",
            options: [
                { text: "When I create a complex structure from the pure void.", class: "visionary", icon: "auto_fix_high" },
                { text: "When my body and mind vanish into a single perfect motion.", class: "kinetic", icon: "sports_martial_arts" },
                { text: "When I weave the invisible connections between spirits.", class: "harmonizer", icon: "diversity_3" },
                { text: "When I drop a frequency that resonates with the stars.", class: "soundsmith", icon: "graphic_eq" }
            ]
        },
        {
            id: 3,
            theme: "THE TREE OF WORLDS",
            text: "Which part of the Weltenbaum [Yggdrasil] do you protect?",
            options: [
                { text: "The Roots - Guarding the origin and sacred knowledge.", class: "arcane", icon: "psychology" },
                { text: "The Trunk - Holding the stability and raw strength.", class: "kinetic", icon: "fitness_center" },
                { text: "The Leaves - Catching the light of pure innovation.", class: "visionary", icon: "emergency_light" },
                { text: "The Fruits - Alchemizing the essence and nourishment.", class: "alchemist", icon: "science" }
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

    async syncToSupabase(className, scores) {
        console.log("☁️ [Genesis] Syncing to Neural Net (Supabase)...");
        
        if (!window.supabaseClient) {
            console.error("Supabase Client missing. Cannot sync.");
            return;
        }

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if(!user) {
                console.warn("User not authenticated during Genesis. Local only.");
                return;
            }

            // Update Profile
            const { error } = await window.supabaseClient.from('profiles').update({
                character_class: className,
                stats: scores,
                onboarding_complete: true,
                level: 1,
                exp: 100
            }).eq('id', user.id);

            if(error) throw error;
            console.log("✅ [Genesis] Sync Complete.");

        } catch (e) {
            console.error("[Genesis] Sync Failed:", e);
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
            window.location.href = '/pages/dashboard.html';
        }, 2000); 
    }
};

// Initialize if script loaded
if (document.readyState !== 'loading') Genesis.init();
else document.addEventListener('DOMContentLoaded', () => Genesis.init());
