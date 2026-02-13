/**
 * THE BRAIN AGENT (Neural Network of Flow)
 * Manages the "7 Questions / 7 Hours" Protocol.
 * Distributes Knowledge and awards XP.
 */
/**
 * THE BRAIN AGENT (Neural Network of Flow)
 * Manages the "7 Questions / 7 Hours" Protocol.
 * Distributes Knowledge and awards XP.
 */
class BrainAgent extends Agent {
    constructor() {
        super("Brain");
        this.COOLDOWN_HOURS = 7;
        this.QUESTIONS_PER_SESSION = 7;
        
        // Knowledge Bank (Mock Data + Custom)
        this.defaultKnowledge = [
            { q: "What is the primary currency of the Circle?", a: "Flow", options: ["Gold", "Flow", "Respect", "Vibe"] },
            // ... (rest implied, or just matching closing brace)
        ];

        // Load Custom Questions
        const customQuestions = JSON.parse(localStorage.getItem('cdf_custom_questions') || '[]');
        this.knowledgeBank = [...this.defaultKnowledge, ...customQuestions];
    }

    init() {
        console.log(`🧠 [Brain] Neural Link Established. Loaded ${this.knowledgeBank.length} synapses.`);
        // Load State
        const savedState = JSON.parse(localStorage.getItem('cdf_brain_state') || '{"lastSession": 0, "questionsAnswered": 0, "currentStreak": 0}');
        this.state = savedState;
        
        this.checkStatus();
    }

    checkStatus() {
        const now = Date.now();
        const diff = now - this.state.lastSession;
        const cooldownMs = this.COOLDOWN_HOURS * 60 * 60 * 1000;

        if (this.state.questionsAnswered >= this.QUESTIONS_PER_SESSION) {
            if (diff < cooldownMs) {
                // Cooldown Active
                this.isLocked = true;
                const remaining = Math.ceil((cooldownMs - diff) / (1000 * 60)); // Minutes
                console.log(`🧠 [Brain] Cooling down. ${remaining} mins remaining.`);
                return { locked: true, remaining: remaining };
            } else {
                // Cooldown Over, Reset
                console.log("🧠 [Brain] Synapse Reset. Ready for input.");
                this.state.questionsAnswered = 0;
                this.saveState();
                this.isLocked = false;
                return { locked: false };
            }
        }
        return { locked: false };
    }

    startQuiz() {
        const status = this.checkStatus();
        if (status.locked) {
            this.renderCooldown(status.remaining);
        } else {
            this.renderQuestion();
        }
    }

    // Helper for Path Resolution
    _resolvePath(filename) {
        // Assumes target files are in 'pages/' directory
        const inPages = window.location.pathname.includes('/pages/');
        return inPages ? filename : `pages/${filename}`;
    }

    // --- CREATION LOGIC ---
    attemptCreation() {
        // Privilege Check
        // Mocking user level/plan for now. 
        // In reality, this would check localStorage or Merchant Agent.
        const userLevel = 5; // Simulating "Disciple"
        const userPlan = 'Pro';

        console.log(`[Brain] Checking Clearance... Level: ${userLevel}, Plan: ${userPlan}`);

        if (userLevel >= 5) {
            // Success Logic
            if(window.SoundEngineer) window.SoundEngineer.playSFX('stone_crack');
            
            // Trigger Styling
            const overlay = document.getElementById('stone-overlay');
            const targetPage = this._resolvePath('quiz_creation.html');

            if(overlay) {
                overlay.classList.remove('hidden');
                setTimeout(() => {
                    window.location.href = targetPage;
                }, 2000); // Wait for anim
            } else {
                 window.location.href = targetPage;
            }
        } else {
            if(window.Pusher) window.Pusher.showToast("Clearance Denied. Level 5 Required.", "error");
        }
    }

    forgeQuestion() {
        // Collect Data
        const q = document.getElementById('q-input').value;
        const a = document.getElementById('a-input').value;
        const options = Array.from(document.querySelectorAll('.opt-input')).map(i => i.value);
        
        // Add correct answer to options and shuffle (simple logic)
        const allOptions = [...options, a].sort(() => Math.random() - 0.5);

        const newQ = { q, a, options: allOptions, custom: true };
        
        // Save to LocalStorage
        const customQuestions = JSON.parse(localStorage.getItem('cdf_custom_questions') || '[]');
        customQuestions.push(newQ);
        localStorage.setItem('cdf_custom_questions', JSON.stringify(customQuestions));

        console.log("Saving new Question:", newQ);

        if(window.Pusher) window.Pusher.showToast("Blueprint Synthesized Successfully.", "success");
        
        setTimeout(() => {
            window.location.href = this._resolvePath('quiz.html');
        }, 1500);
    }


    // --- RENDER LOGIC ---

    renderCooldown(minutes) {
        const container = document.getElementById('quiz-container');
        if(!container) return;

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const libPath = this._resolvePath('library.html');

        container.innerHTML = `
            <div class="text-center animate-pulse box-science p-8 rounded-xl max-w-md mx-auto">
                <div class="inline-block p-6 rounded-full border-2 border-gray-500 bg-black/50 mb-6">
                    <span class="material-symbols-outlined text-6xl text-gray-500">hourglass_disabled</span>
                </div>
                <h2 class="text-3xl font-stone text-gray-400 mb-2 uppercase tracking-widest">Petrification Active</h2>
                <p class="text-white/30 uppercase tracking-widest mb-8 text-xs">Revival Fluid Synthesis in progress</p>
                
                <div class="text-4xl font-mono text-emerald-500 mb-8 science-glow">
                    ${hours}h ${mins}m
                </div>

                <a href="${libPath}" class="px-8 py-3 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black text-emerald-400 uppercase tracking-widest rounded transition-all font-bold">
                    Explore Map
                </a>
            </div>
        `;
    }

    renderQuestion() {
        const container = document.getElementById('quiz-container');
        if(!container) return;

        // Pick a random question
        const qIndex = Math.floor(Math.random() * this.knowledgeBank.length);
        const qData = this.knowledgeBank[qIndex];
        this.currentQuestion = qData;

        const progress = this.state.questionsAnswered + 1;

        container.innerHTML = `
            <div class="w-full max-w-2xl animate-fade-in-up">
                <!-- Header -->
                <div class="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                    <div>
                        <div class="text-[10px] text-emerald-400 font-mono uppercase tracking-widest mb-1">Experiment 00${progress}</div>
                        <div class="text-2xl font-bold font-stone text-white">Compound Analysis</div>
                    </div>
                     <div class="text-right">
                        <div class="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">Yield</div>
                        <div class="text-xl font-bold text-emerald-400 science-glow">+50 XP</div>
                    </div>
                </div>

                <!-- Question -->
                <div class="p-8 box-science rounded-2xl mb-8 min-h-[200px] flex items-center justify-center text-center">
                    <h3 class="text-xl md:text-2xl font-mono text-white leading-relaxed">
                        "${qData.q}"
                    </h3>
                </div>

                <!-- Options -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${qData.options.map(opt => `
                        <button onclick="Brain.submitAnswer('${opt}')" 
                            class="p-4 bg-black/40 border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-xl text-left transition-all uppercase tracking-widest text-sm group flex items-center gap-3">
                            <span class="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">bicarbonate</span> 
                            <span>${opt}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="text-center mt-8 text-xs text-white/20 font-mono">
                    Step ${progress} of ${this.QUESTIONS_PER_SESSION} // Kingdom of Science
                </div>
            </div>
        `;
    }

    submitAnswer(answer) {
        const isCorrect = answer === this.currentQuestion.a;
        
        if (isCorrect) {
            // Correct - "Breaking Styles" to be handled by CSS class triggers ideally
            if(window.Pusher) window.Pusher.showToast("Hypothesis Confirmed. +50 XP", "success");
            
            // TRIGGER QUEST: Quiz Master
            if(window.QuestEngine) {
                window.QuestEngine.grantReward('Q-KNO-102', 100, 'PROTOCOL: QUIZ MASTER');
            }

            // Award XP
            if(window.Helper) {
                window.Helper.awardXP(50, "Hypothesis Confirmed");
            } else {
                // Fallback if Helper missing
                let currentXP = parseInt(localStorage.getItem('cdf_xp') || '0');
                currentXP += 50;
                localStorage.setItem('cdf_xp', currentXP.toString());
            }
            
            this.state.questionsAnswered++;
            this.saveState();

            if (this.state.questionsAnswered >= this.QUESTIONS_PER_SESSION) {
                this.finishSession();
            } else {
                this.renderQuestion();
            }

        } else {
            // Incorrect
            if(window.Pusher) window.Pusher.showToast("Test Failed. Try Again Next Cycle.", "error");
            this.state.questionsAnswered++; // Still counts as usage
            this.saveState();
             if (this.state.questionsAnswered >= this.QUESTIONS_PER_SESSION) {
                this.finishSession();
            } else {
                this.renderQuestion();
            }
        }
    }

    finishSession() {
        this.state.lastSession = Date.now();
        this.saveState();
        
        const container = document.getElementById('quiz-container');
        if(!container) return;

        const libPath = this._resolvePath('library.html');

        container.innerHTML = `
            <div class="text-center animate-scale-in box-science p-10 rounded-xl">
                <div class="inline-block p-6 rounded-full border-4 border-emerald-500 bg-black/50 shadow-[0_0_80px_rgba(16,185,129,0.4)] mb-8">
                    <span class="material-symbols-outlined text-6xl text-emerald-500">science</span>
                </div>
                <h2 class="text-4xl font-stone font-black text-white mb-2 tracking-widest">Discovery Made</h2>
                <p class="text-emerald-400 text-sm tracking-[0.2em] uppercase mb-8">Data Logged</p>
                
                <p class="text-white/60 mb-12 max-w-md mx-auto font-mono text-sm">
                    Research complete for this session. Take a break to let the chemicals settle. 
                    <br><br>Co-Efficient: 100 Billion Percent.
                </p>

                <a href="${libPath}" class="px-8 py-3 bg-emerald-600 text-white hover:bg-emerald-500 font-bold uppercase tracking-widest rounded shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all">
                    Return to Map
                </a>
            </div>
        `;
    }

    saveState() {
        localStorage.setItem('cdf_brain_state', JSON.stringify(this.state));
        // Also helper backup
         if(window.Helper) {
            window.Helper.saveData('cdf_brain_state', JSON.stringify(this.state));
        }
    }
}

// Auto-Init
window.Brain = new BrainAgent();
