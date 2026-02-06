/**
 * THE REFEREE AGENT (Arbiter of Flow)
 * Manages the "5 Pillars" Battlefield, Duel Logic, and Legacy Quests.
 */
class RefereeAgent {
    constructor() {
        this.pillars = [
            { id: 'lyric', name: 'The Lyric Field', icon: 'mic', desc: 'MCing & Poetry', color: 'text-yellow-400', border: 'border-yellow-400' },
            { id: 'circle', name: 'The Circle Field', icon: 'accessibility_new', desc: 'B-Boying & Dance', color: 'text-pink-500', border: 'border-pink-500' },
            { id: 'visual', name: 'The Visual Field', icon: 'palette', desc: 'Graffiti & Art', color: 'text-purple-500', border: 'border-purple-500' },
            { id: 'sonic', name: 'The Sonic Field', icon: 'graphic_eq', desc: 'DJing & Production', color: 'text-cyan-400', border: 'border-cyan-400' },
            { id: 'knowledge', name: 'The Knowledge Field', icon: 'school', desc: 'History & Quiz', color: 'text-emerald-400', border: 'border-emerald-400' }
        ];

        this.quizQuestions = [
            { q: "Where can you find the hidden mural in Graça?", a: "Travessa do Monte", options: ["Travessa do Monte", "Largo da Graça", "Miradouro"] },
            { q: "What does the Sankofa symbol represent?", a: "Return and get it", options: ["Strength", "Return and get it", "Unity"] },
            { q: "Who governs the frequencies of the Sonic Field?", a: "DJ Qter", options: ["DJ Ride", "DJ Qter", "Sam the Kid"] }
        ];

        this.leaderboardData = [
            { name: "Sage_Nova", rank: "Master", xp: 15400, icon: "auto_awesome" },
            { name: "Killa_Beat", rank: "Adept", xp: 12350, icon: "graphic_eq" },
            { name: "Graf_X", rank: "Adept", xp: 9800, icon: "brush" },
            { name: "Flow_Rider", rank: "Disciple", xp: 5600, icon: "water_drop" },
            { name: "Zen_Monk", rank: "Disciple", xp: 4200, icon: "self_improvement" }
        ];

        this.init();
    }

    init() {
        console.log("⚖️ [Referee] The Arbiter is watching.");
        this.renderPillars();
        this.renderLeaderboard();
        this.renderLiveFeed();
        // this.updateTicker(); // Handled by CSS for now
    }

    renderPillars() {
        const container = document.getElementById('battle-fields');
        if (!container) return;

        container.innerHTML = this.pillars.map(p => `
            <div onclick="Referee.enterField('${p.id}')" 
                class="portal-card flex-shrink-0 w-64 md:w-72 h-96 bg-black/60 border border-white/10 rounded-3xl relative overflow-hidden cursor-pointer snap-center group">
                
                <!-- Background Image layer would go here -->
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black opacity-90"></div>
                
                <!-- Content -->
                <div class="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <div class="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 bg-white/5 backdrop-blur-sm">
                        <span class="material-symbols-outlined text-5xl ${p.color} text-shadow-neon">${p.icon}</span>
                    </div>
                    
                    <h3 class="text-2xl font-serif font-bold text-white uppercase tracking-widest mb-2 text-center group-hover:text-shadow-glow transition-all">${p.name}</h3>
                    <div class="h-px w-8 bg-white/30 mb-2"></div>
                    <span class="text-[10px] text-white/50 uppercase tracking-[0.2em] text-center">${p.desc}</span>
                </div>

                <!-- Hover Glow -->
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-${p.color.replace('text-', '')}/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
        `).join('');
    }

    renderLeaderboard() {
        const container = document.getElementById('leaderboard-list');
        if (!container) return;

        container.innerHTML = this.leaderboardData.map((user, index) => `
            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-amber-400/30 transition-all cursor-pointer group">
                <span class="text-xs font-bold text-white/30 font-mono w-4 group-hover:text-amber-400">#${index + 1}</span>
                <div class="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-sm text-white/70">${user.icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">${user.name}</h4>
                    <span class="text-[10px] text-white/40 uppercase tracking-wider">${user.rank}</span>
                </div>
                <span class="text-xs font-mono text-cyan-400">${(user.xp / 1000).toFixed(1)}k</span>
            </div>
        `).join('');
    }

    renderLiveFeed() {
        const container = document.getElementById('legacy-feed');
        if (!container) return;
        
        // Initial Mock Data
        this.addFeedItem("Sage_Nova", "Legacy Quest", "Knowledge Field");
        setTimeout(() => this.addFeedItem("You", "Joined", "The Arena"), 1000);
    }

    addFeedItem(name, action, location) {
        const container = document.getElementById('legacy-feed');
        if (!container) return;

        const item = document.createElement('div');
        item.className = "flex items-start gap-3 p-3 border-l-2 border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-transparent animate-fade-in";
        item.innerHTML = `
            <span class="material-symbols-outlined text-sm text-cyan-400 mt-1">history_edu</span>
            <div class="text-xs">
                <p class="text-white"><span class="font-bold text-cyan-400">${name}</span> ${action}</p>
                <p class="text-white/40 uppercase tracking-wider text-[10px]">${location}</p>
            </div>
        `;
        
        container.prepend(item);
        
        // Clear "Waiting for signals" if present
        const placeholder = container.querySelector('.italic');
        if(placeholder) placeholder.remove();

        // Limit feed size
        if(container.children.length > 10) container.lastElementChild.remove();
    }

    enterField(fieldId) {
        const field = this.pillars.find(p => p.id === fieldId);
        
        // 1. Flowee Intro
        this.triggerFloweeIntro(field);

        // 2. Open Duel Overlay (Hologram)
        const overlay = document.getElementById('duel-overlay');
        const content = document.getElementById('duel-content');
        
        if (!overlay || !content) return;

        // Reset Content
        content.innerHTML = this.getDuelTemplate(field);
        
        overlay.classList.remove('hidden');
    }

    triggerFloweeIntro(field) {
        const msg = `Creator! You enter the **${field.name}**. Knowledge is the root of your Nen. Prove your worth!`;
        
        // Direct integration if Flowee is present
        if (window.Flowee && window.Flowee.talk) {
             window.Flowee.talk(true, msg);
             // Optional: Make Flowee fly to the portal (if we had coordinates, simplifying for now)
        } else if (window.Notifications) {
            window.Notifications.send('flowee', msg, 'high');
        }
    }

    getDuelTemplate(field) {
        if (field.id === 'knowledge') {
            return this.getQuizTemplate();
        }

        const user = window.Gamification?.state || { level: 1, class: 'Initiate' };
        
        // Hologram UI
        return `
            <!-- LEFT: YOU -->
            <div class="flex flex-col items-center justify-center animate-fade-in-up" style="animation-delay: 0.1s">
                <div class="w-32 h-32 rounded-full border-2 border-cyan-400 p-1 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                    <div class="w-full h-full bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                        <span class="material-symbols-outlined text-6xl text-white/20">person</span>
                    </div>
                </div>
                <h3 class="text-xl font-bold font-serif text-cyan-400 tracking-widest">YOU</h3>
                <p class="text-xs text-white/50 uppercase tracking-widest mt-1">Lvl ${user.level} ${user.class}</p>
            </div>

            <!-- CENTER: ACTION -->
            <div class="flex flex-col items-center justify-center animate-fade-in-up space-y-8 relative" style="animation-delay: 0.2s">
                <div class="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                     <div class="w-64 h-64 border border-white/5 rounded-full animate-pulse-slow"></div>
                </div>

                <div class="text-center">
                    <span class="material-symbols-outlined text-4xl ${field.color} mb-2">${field.icon}</span>
                    <h2 class="text-sm uppercase tracking-[0.3em] text-white/50">${field.name}</h2>
                </div>

                <button onclick="Referee.startClash('${field.name}')" class="group relative px-12 py-6 bg-transparent border-2 border-white/20 hover:border-white text-white font-bold font-serif text-2xl uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] rounded-sm">
                    <span class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    RELEASE THE FLOW
                </button>
                
                <p class="text-[10px] text-white/30 uppercase tracking-widest mt-4">Simulation Mode Active</p>
            </div>

            <!-- RIGHT: OPPONENT -->
            <div class="flex flex-col items-center justify-center animate-fade-in-up" style="animation-delay: 0.3s">
                <div class="w-32 h-32 rounded-full border-2 border-red-500 p-1 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <div class="w-full h-full bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                        <span class="material-symbols-outlined text-6xl text-white/20">robot</span>
                    </div>
                </div>
                <h3 class="text-xl font-bold font-serif text-red-500 tracking-widest">CYPHER_BOT</h3>
                <p class="text-xs text-white/50 uppercase tracking-widest mt-1">Lvl ${Math.max(1, user.level + 1)} Challenger</p>
            </div>
        `;
    }

    getQuizTemplate() {
        // Random Question
        const q = this.quizQuestions[Math.floor(Math.random() * this.quizQuestions.length)];
        this.currentQuizAnswer = q.a;

        return `
            <div class="col-span-1 md:col-span-3 flex flex-col items-center justify-center animate-fade-in-up">
                <div class="w-24 h-24 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-white/5 mb-8 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                    <span class="material-symbols-outlined text-5xl text-emerald-400">school</span>
                </div>
                
                <h2 class="text-2xl font-bold font-serif uppercase tracking-widest text-white mb-2">Knowledge Check</h2>
                <div class="h-px w-12 bg-emerald-400/50 mb-8"></div>
                
                <p class="text-2xl md:text-3xl font-bold text-white max-w-2xl mx-auto py-8 text-center leading-relaxed">"${q.q}"</p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
                    ${q.options.map(opt => `
                        <button onclick="Referee.checkAnswer('${opt}', '${q.a}')" 
                            class="py-6 px-4 bg-white/5 border border-white/10 hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-400 text-white rounded-xl text-lg transition-all transform hover:scale-105">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    checkAnswer(selected, correct) {
        if (selected === correct) {
            this.setVerdict('won', 'The Knowledge Field');
        } else {
             // Shake / Error UI
             if (window.Notifications) window.Notifications.send('error', 'Incorrect. Study the Roots.', 'user');
             this.setVerdict('lost', 'The Knowledge Field');
        }
    }

    startClash(fieldName) {
        // Transition to Verdict Screen
        const content = document.getElementById('duel-content');
        content.innerHTML = `
            <div class="col-span-1 md:col-span-3 flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
                <h2 class="text-4xl font-serif font-bold text-white mb-12 tracking-widest text-shadow-neon">THE VERDICT</h2>
                
                <div class="flex gap-8 w-full max-w-2xl px-4">
                    <button onclick="Referee.setVerdict('won', '${fieldName}')" 
                        class="flex-1 py-12 bg-black/50 border border-amber-400/50 hover:bg-amber-400 hover:text-black text-amber-400 font-bold text-2xl md:text-3xl font-serif uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(251,191,36,0.2)] rounded-xl">
                        I WON
                    </button>
                    
                    <button onclick="Referee.setVerdict('lost', '${fieldName}')" 
                        class="flex-1 py-12 bg-black/50 border border-gray-500/50 hover:bg-gray-500 hover:text-black text-gray-500 font-bold text-2xl md:text-3xl font-serif uppercase tracking-widest transition-all duration-300 hover:scale-105 rounded-xl">
                        I LOST
                    </button>
                </div>
            </div>
        `;
    }

    setVerdict(result, fieldName) {
        const content = document.getElementById('duel-content');
        const userName = localStorage.getItem('userName') || 'Initiate';
        
        if (result === 'won') {
            // Reward
            if (window.Gamification) window.Gamification.addXP(100, `Victory in ${fieldName}`);
            
            // Legacy Quest UI
            content.innerHTML = `
                <div class="col-span-1 md:col-span-3 text-center space-y-8 animate-fade-in pb-12">
                    <div class="inline-block p-6 rounded-full border-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] bg-black">
                        <span class="material-symbols-outlined text-6xl text-amber-400">emoji_events</span>
                    </div>
                    
                    <div>
                        <h2 class="text-5xl font-bold font-serif text-amber-400 uppercase tracking-widest mb-2 gold-glow">GLORY</h2>
                        <p class="text-white/60 text-lg tracking-widest uppercase">Your aura expands.</p>
                    </div>
                    
                    <!-- XP BAR SWOOSH -->
                    <div class="w-full max-w-md mx-auto h-4 bg-white/10 rounded-full overflow-hidden relative">
                         <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 w-0 animate-[fillBar_1.5s_ease-out_forwards]"></div>
                    </div>
                    <style> @keyframes fillBar { to { width: 100%; } } </style>

                    <div class="max-w-md mx-auto mt-8 p-6 border border-white/10 bg-white/5 rounded-xl">
                        <h3 class="text-cyan-400 font-bold text-sm uppercase tracking-widest mb-4">Legacy Quest Available</h3>
                        <button onclick="Referee.uploadLegacy('${fieldName}')" class="w-full py-4 bg-cyan-400 text-black font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                            Upload Proof to Ticker
                        </button>
                    </div>
                </div>
            `;
            
            if (window.Flowee && window.Flowee.talk) {
                 window.Flowee.talk(true, "A true King! Upload that legacy! 👑");
            }
        } else {
            // Loss
            if (window.Gamification) window.Gamification.addXP(10, `Training in ${fieldName}`);

            content.innerHTML = `
                <div class="col-span-1 md:col-span-3 text-center space-y-8 animate-fade-in pb-12">
                     <div class="inline-block p-6 rounded-full border-4 border-gray-600 bg-black">
                        <span class="material-symbols-outlined text-6xl text-gray-500">sentiment_dissatisfied</span>
                    </div>
                    <div>
                        <h2 class="text-4xl font-bold font-serif text-gray-400 uppercase tracking-widest mb-2">DEFEAT</h2>
                        <p class="text-white/60 text-lg tracking-widest uppercase">A lesson learned.</p>
                    </div>
                    <button onclick="Referee.closeDuel()" class="px-8 py-3 bg-white/10 hover:bg-white hover:text-black rounded-lg uppercase tracking-widest transition-all">
                        Return to Hub
                    </button>
                </div>
            `;
            if (window.Flowee && window.Flowee.talk) {
                 window.Flowee.talk(true, "Keep grinding. The process is the prize.");
            }
        }
    }

    uploadLegacy(fieldName) {
        // Mock Upload Delay
        const btn = document.querySelector('button.bg-cyan-400');
        if(btn) btn.innerHTML = "<span class='material-symbols-outlined animate-spin'>sync</span> Uploading...";

        setTimeout(() => {
            const userName = localStorage.getItem('userName') || 'A Creator';
            
            // 1. Update Feed Sidebar
            this.addFeedItem(userName, "Conquered", fieldName);

            // 2. Ticker Update
            const msg = `++ [BATTLE] ${userName} dominated ${fieldName} with pure style! ++`;
            const ticker = document.getElementById('colosseum-ticker');
            if(ticker) ticker.innerText = msg + " " + ticker.innerText;

            // 3. Extra XP
            if (window.Gamification) window.Gamification.addXP(50, 'Legacy Upload');

            // 4. Close
            this.closeDuel();
            if (window.Notifications) window.Notifications.send('success', 'Legacy Recorded. Ticker Updated.', 'user');
            
            if (window.Flowee && window.Flowee.talk) {
                 window.Flowee.talk(true, "We live forever through the stories we leave behind!");
            }

        }, 1500);
    }

    closeDuel() {
        document.getElementById('duel-overlay').classList.add('hidden');
    }
}

window.Referee = new RefereeAgent();
