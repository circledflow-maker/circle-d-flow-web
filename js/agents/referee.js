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

        // Initialize Leaderboard (Persistent)
        const savedLeaderboard = JSON.parse(localStorage.getItem('cdf_leaderboard') || 'null');
        if (savedLeaderboard) {
            this.leaderboardData = savedLeaderboard;
        } else {
            this.leaderboardData = [
                { name: "Sage_Nova", rank: "Master", xp: 15400, icon: "auto_awesome" },
                { name: "Killa_Beat", rank: "Adept", xp: 12350, icon: "graphic_eq" },
                { name: "Graf_X", rank: "Adept", xp: 9800, icon: "brush" },
                { name: "Flow_Rider", rank: "Disciple", xp: 5600, icon: "water_drop" },
                { name: "Zen_Monk", rank: "Disciple", xp: 4200, icon: "self_improvement" }
            ];
            if(window.Helper) {
                window.Helper.saveData('cdf_leaderboard', JSON.stringify(this.leaderboardData));
            } else {
                localStorage.setItem('cdf_leaderboard', JSON.stringify(this.leaderboardData));
            }
        }

        this.init();
    }

    async init() {
        console.log("⚖️ [Referee] The Arbiter is watching.");
        
        // SYNC WITH SUPABASE (Fitable Table)
        await this.syncFitable();

        this.renderPillars();
        this.renderLeaderboard();
        this.renderLiveFeed();
        this.syncTournament();
    }

    async syncFitable() {
        if (!window.supabaseClient) return;

        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        console.log(`[Referee] Syncing Fitable Stats for ${user.id}...`);

        const { data, error } = await window.supabaseClient
            .from('fitable')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error("[Referee] Sync Error:", error.message);
            return;
        }

        if (data) {
            // Update Local state for faster UI reaction
            this.xp = data.xp;
            this.wins = data.wins;
            this.streak = data.streak;
            
            // Sync to LocalStorage for offline/legacy support
            localStorage.setItem('cdf_xp', data.xp.toString());
            localStorage.setItem('cdf_wins', data.wins.toString());
            localStorage.setItem('cdf_streak', data.streak.toString());
            
            console.log("[Referee] Fitable Stats Synchronized.");
        }
    }

    syncTournament() {
        const tournament = window.TournamentManifest || JSON.parse(localStorage.getItem('cdf_tournament') || 'null');
        if (!tournament) return;

        // 1. Update Ticker
        const ticker = document.getElementById('colosseum-ticker');
        if (ticker && tournament.status === 'LIVE') {
            ticker.innerText = `+++ ${tournament.season.toUpperCase()} IS LIVE +++ STAGE: ${tournament.stage.toUpperCase()} +++ ${tournament.entrants} CHALLENGERS REMAINING +++`;
            ticker.classList.add('text-red-500'); // Make it alarming
        }

        // 2. Inject Tournament Bracket Portal (Optional: Prepend to pillars)
        if (tournament.status === 'LIVE') {
            const container = document.getElementById('battle-fields');
            const tournamentPortal = `
                <div onclick="window.BracketAgent ? window.BracketAgent.open() : alert('Bracket System Loading...')" 
                    class="portal-card flex-shrink-0 w-64 md:w-72 h-96 bg-red-900/20 border-2 border-red-500 rounded-3xl relative overflow-hidden cursor-pointer snap-center group animate-pulse">
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/50 to-black opacity-90"></div>
                    <div class="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                        <div class="w-24 h-24 rounded-full border-2 border-red-500 flex items-center justify-center mb-6 bg-black shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                            <span class="material-symbols-outlined text-5xl text-red-500">trophy</span>
                        </div>
                        <h3 class="text-2xl font-serif font-bold text-red-500 uppercase tracking-widest mb-2 text-center">TOURNAMENT</h3>
                        <div class="h-px w-8 bg-red-500/50 mb-2"></div>
                        <span class="text-[10px] text-white/50 uppercase tracking-[0.2em] text-center">${tournament.stage}</span>
                    </div>
                </div>
            `;
            // Check if already injected to avoid dupes (simple check)
            if (container && !container.innerHTML.includes('TOURNAMENT')) {
                 container.insertAdjacentHTML('afterbegin', tournamentPortal);
            }
        }
    }

    enterField(fieldId) {
        console.log(`[Referee] Entering Field: ${fieldId}`);
        const routes = {
            'lyric': 'blog.html',           // The Lyric Colosseum
            'circle': 'services-community.html', // Community/Circle
            'visual': 'kiss-your-heart.html',    // Visual Arts
            'sonic': 'outbreak_tunes.html',      // Sound/DJ
            'knowledge': 'library.html'          // Knowledge/Academy
        };

        const target = routes[fieldId];
        if (target) {
            if(window.SoundEngineer) window.SoundEngineer.playSFX('warp_engaged');
            // Add a small delay for effect
             if(window.Pusher) window.Pusher.showToast(`Warping to ${fieldId.toUpperCase()} Sector...`, 'info');
            setTimeout(() => {
                window.location.href = target;
            }, 800);
        } else {
            console.warn(`[Referee] Unknown Field: ${fieldId}`);
            alert("This Sector is currently under construction.");
        }
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

    // --- COMBAT ENGINE CORE ---

    /**
     * Matchmaking Logic: Finds a suitable opponent based on Nen Type and Level.
     * @param {string} nenType - The user's Nen type (optional filter)
     * @param {number} level - Used to find opponents within range (+/- 2 levels)
     */
    findOpponent(nenType = null, level = 1) {
        console.log(`[Referee] Scanning for opponents... Type: ${nenType}, Level: ${level}`);
        // Mock Database of Opponents
        const opponents = [
            { id: 'cpu1', name: 'Neon_Viper', type: 'Enhancer', level: 1, winRate: 0.4 },
            { id: 'cpu2', name: 'Shadow_Weaver', type: 'Transmuter', level: 2, winRate: 0.6 },
            { id: 'cpu3', name: 'Iron_Golem', type: 'Emitter', level: 3, winRate: 0.8 },
            { id: 'cpu4', name: 'Psycho_Mantis', type: 'Manipulator', level: 4, winRate: 0.9 },
            { id: 'cpu5', name: 'Chrollo_Lucilfer', type: 'Specialist', level: 5, winRate: 0.99 }
        ];

        // Filter Logic
        let candidates = opponents.filter(op => Math.abs(op.level - level) <= 2);
        if (nenType) {
            // 30% chance to prioritize same type, else random
            if (Math.random() < 0.3) candidates = candidates.filter(op => op.type === nenType);
        }

        return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : opponents[0];
    }

    /**
     * Validates if the user has enough EP (Energy Points) for the stake.
     * @param {number} stake - The required entry fee.
     * @returns {boolean}
     */
    validateEntryFee(stake) {
        const userXP = parseInt(localStorage.getItem('cdf_xp') || '0'); 
        // Assuming EP ~ XP for this simulation, or fetch strict EP if separate.
        // Let's assume 1 XP = 1 EP for simplicity in this phase.
        if (userXP >= stake) {
            return true;
        } else {
            this.triggerAccessDenied(stake);
            return false;
        }
    }

    triggerAccessDenied(needed) {
        console.warn(`[Referee] Access Denied. Needed: ${needed} EP`);
        if (window.Pusher) {
            window.Pusher.showToast(`Insufficient Energy. Need ${needed} EP.`, 'error');
        } else {
            alert(`Insufficient Energy. Need ${needed} EP.`);
        }
    }

    // --- WEEKLY CORONATION ---
    checkWeeklyCoronation() {
        const lastCheck = localStorage.getItem('cdf_last_coronation');
        const now = new Date();
        const isMonday = now.getDay() === 1;

        if (isMonday && lastCheck !== now.toDateString()) {
            console.log("👑 [Referee] Initiating Weekly Coronation...");
            // Simulate Awarding Crowns
            this.leaderboardData.forEach((user, index) => {
                if (index < 3) {
                    user.crowns = (user.crowns || 0) + 1;
                    console.log(`Awarded Crown to ${user.name}`);
                }
            });
            
            if(window.Helper) {
                window.Helper.saveData('cdf_leaderboard', JSON.stringify(this.leaderboardData));
                window.Helper.saveData('cdf_last_coronation', now.toDateString());
            } else {
                localStorage.setItem('cdf_leaderboard', JSON.stringify(this.leaderboardData));
                localStorage.setItem('cdf_last_coronation', now.toDateString());
            }
            
            if (window.Pusher) window.Pusher.showToast("Weekly Crowns Awarded!", 'success');
        }
    }

    /**
     * Helper for Non-Combat Victories (e.g. Quizzes, Donations)
     */
    recordVictory(amount, source) {
        let currentXP = parseInt(localStorage.getItem('cdf_xp') || '0');
        let wins = parseInt(localStorage.getItem('cdf_wins') || '0');
        let streak = parseInt(localStorage.getItem('cdf_streak') || '0');
        
        const oldLevel = Math.floor(currentXP / 1000) + 1;

        currentXP += amount;
        wins++;
        streak++;
        
        const newLevel = Math.floor(currentXP / 1000) + 1;
        if(newLevel > oldLevel && window.Pusher) {
            setTimeout(() => {
                window.Pusher.showToast(`LEVEL UP! You are now Rank ${newLevel} 🌟`, 'xp');
            }, 500); 
        }

        if(window.Helper) {
            window.Helper.saveData('cdf_xp', currentXP.toString());
            window.Helper.saveData('cdf_wins', wins.toString());
            window.Helper.saveData('cdf_streak', streak.toString());
        } else {
            localStorage.setItem('cdf_xp', currentXP.toString());
            localStorage.setItem('cdf_wins', wins.toString());
            localStorage.setItem('cdf_streak', streak.toString());
        }

        if(window.Pusher) window.Pusher.showToast(`${source}: +${amount} XP | Streak: ${streak} 🔥`, 'success');
    }

    /**
     * Combat Engine: Calculates Rewards based on the Fitable Point System
     * Formula: (Base + (Diff * Multiplier)) * StreakBonus
     */
    resolveBattle(fieldId) {
        // 1. Get User State
        let currentXP = parseInt(localStorage.getItem('cdf_xp') || '0');
        let wins = parseInt(localStorage.getItem('cdf_wins') || '0');
        let streak = parseInt(localStorage.getItem('cdf_streak') || '0');
        
        const oldLevel = Math.floor(currentXP / 1000) + 1;

        // 2. Determine Outcome
        // Win rate decreases slightly as you level up (Simulated difficulty)
        const difficulty = 0.5; 
        const outcome = Math.random() > difficulty ? 'win' : 'loss';

        let xpChange = 0;
        let karmaChange = 0;

        // 3. Calculate Rewards
        if (outcome === 'win') {
            const baseXP = 100;
            const streakBonus = Math.min(streak * 10, 50); // Cap streak bonus at 50
            const randomFlux = Math.floor(Math.random() * 20); // +/- 10 variation
            
            xpChange = baseXP + streakBonus + randomFlux;
            
            // Allow Critical Success chance (5%)
            if (Math.random() < 0.05) {
                xpChange *= 2; 
                console.log("CRITICAL FLOW!");
            }

            // Update State
            wins++;
            streak++;
            currentXP += xpChange;

        } else {
            // Loss Logic
            const baseLoss = 10;
            karmaChange = baseLoss;
            streak = 0; // Reset streak
            
            // Consolation XP (Learning from failure)
            xpChange = 25; 
            currentXP += xpChange;
        }

        // 4. Level Up Check
        const newLevel = Math.floor(currentXP / 1000) + 1;
        if(newLevel > oldLevel && window.Pusher) {
            setTimeout(() => {
                window.Pusher.showToast(`LEVEL UP! You are now Rank ${newLevel} 🌟`, 'xp');
            }, 500); // Slight delay after result
        }

        // 5. Save State
        if(window.Helper) {
            window.Helper.saveData('cdf_xp', currentXP.toString());
            window.Helper.saveData('cdf_wins', wins.toString());
            window.Helper.saveData('cdf_streak', streak.toString());
        } else {
            localStorage.setItem('cdf_xp', currentXP.toString());
            localStorage.setItem('cdf_wins', wins.toString());
            localStorage.setItem('cdf_streak', streak.toString());
        }

        console.log(`[Battle] Result: ${outcome.toUpperCase()} | XP: +${xpChange} | Streak: ${streak}`);

        // 6. SYNC TO SUPABASE
        this.updateFitableDB(currentXP, wins, streak);

        return { outcome, xp: xpChange, loss: karmaChange, streak: streak };
    }

    async updateFitableDB(xp, wins, streak) {
        if (!window.supabaseClient) return;
        
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        const { error } = await window.supabaseClient
            .from('fitable')
            .update({ 
                xp: xp, 
                wins: wins, 
                streak: streak,
                last_battle_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) console.error("[Referee] DB Update Failed:", error.message);
        else console.log("[Referee] DB Synced.");
    }

    renderVerdict(win, data) {
        const modal = document.getElementById('fates-verdict');
        if(!modal) return;

        // Persist Stats (Phase 15)
        const stats = JSON.parse(localStorage.getItem('cdf_battle_records') || '{"wins":0, "losses":0, "streak":0}');
        if(win) {
            stats.wins++;
            stats.streak++;
        } else {
            stats.losses++;
            stats.streak = 0; // Reset streak on loss
        }
        
        if(window.Helper) {
            window.Helper.saveData('cdf_battle_records', JSON.stringify(stats));
        } else {
            localStorage.setItem('cdf_battle_records', JSON.stringify(stats));
        }

        modal.classList.remove('hidden');
        
        if(win) {
            // Victory
             if (window.Gamification) window.Gamification.addXP(data.stake, `Defeated ${data.opponent}`);
             
             modal.innerHTML = `
                <div class="text-center animate-fade-in-up">
                    <div class="inline-block p-8 rounded-full border-4 border-amber-400 bg-black shadow-[0_0_80px_rgba(251,191,36,0.6)] mb-8">
                         <span class="material-symbols-outlined text-7xl text-amber-400">emoji_events</span>
                    </div>
                    <h2 class="text-6xl font-black font-serif text-white mb-2 tracking-widest text-shadow-neon">VICTORY</h2>
                    <p class="text-amber-400 text-sm tracking-[0.5em] uppercase mb-8">Legend Arisen</p>
                    
                    <div class="ep-gain mb-12">+${data.stake} EP</div>
                    
                    <div class="flex gap-4 justify-center">
                        <button onclick="document.getElementById('fates-verdict').classList.add('hidden')" class="px-8 py-3 border border-white/20 hover:bg-white hover:text-black text-white uppercase tracking-widest rounded-lg transition-all">
                            Return
                        </button>
                        <button onclick="Referee.shareGlory('${data.opponent}', ${data.stake})" class="px-8 py-3 bg-amber-400 text-black font-bold uppercase tracking-widest rounded-lg shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:scale-105 transition-all">
                            Share Glory
                        </button>
                    </div>
                </div>
             `;
        } else {
            // Defeat
            modal.innerHTML = `
                <div class="text-center animate-fade-in-up">
                    <div class="inline-block p-8 rounded-full border-4 border-red-600 bg-black shadow-[0_0_80px_rgba(220,38,38,0.4)] mb-8">
                         <span class="material-symbols-outlined text-7xl text-red-600">heart_broken</span>
                    </div>
                    <h2 class="text-6xl font-black font-serif text-gray-500 mb-2 tracking-widest">DEFEAT</h2>
                    <p class="text-red-500 text-sm tracking-[0.5em] uppercase mb-8">Haki Crushed</p>
                    
                    <div class="text-4xl font-bold text-red-600 mb-12 ep-loss">-${data.stake} EP</div>
                    
                    <div class="flex gap-4 justify-center">
                        <button onclick="document.getElementById('fates-verdict').classList.add('hidden')" class="px-8 py-3 border border-white/20 hover:bg-white hover:text-black text-white uppercase tracking-widest rounded-lg transition-all">
                            Retreat
                        </button>
                        <button onclick="Referee.triggerRevenge('${data.opponent}')" class="px-8 py-3 bg-red-600 text-white font-bold uppercase tracking-widest rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 transition-all">
                            Double or Nothing
                        </button>
                    </div>
                </div>
             `;
        }
    }

    // 3. Manual Reporting
    confirmResult(outcome) { // 'win' or 'loss'
        clearInterval(this.battleTimerInterval);
        
        let xpChange, title, msg, icon;

        if(outcome === 'win') {
            xpChange = 150; // Manual fights give good XP
            title = "VICTORY CONFIRMED";
            msg = "Glory to the victor.";
            icon = "emoji_events";
            this.recordVictory(xpChange, `Live Battle vs ${this.currentOpponent.name}`);
        } else {
            xpChange = 25; // Participation
            title = "DEFEAT ACKNOWLEDGED";
            msg = "Honor in effective failure.";
            icon = "handshake"; // Respect
             // Log loss but give small XP
            let currentXP = parseInt(localStorage.getItem('cdf_xp') || '0');
            currentXP += xpChange;
            
            if(window.Helper) {
                window.Helper.saveData('cdf_xp', currentXP.toString());
            } else {
                localStorage.setItem('cdf_xp', currentXP.toString());
            }
            
            if(window.Pusher) window.Pusher.showToast(`Defeat Logged. +${xpChange} XP for consistency.`, 'info');
        }

        // Show Verdict UI
        const arenaInterface = document.getElementById('live-arena-interface');
        arenaInterface.innerHTML = `
             <div class="text-center animate-fade-in-up">
                <div class="inline-block p-6 rounded-full border-4 border-${outcome === 'win' ? 'amber-400' : 'gray-500'} bg-black mb-6">
                     <span class="material-symbols-outlined text-6xl text-${outcome === 'win' ? 'amber-400' : 'gray-500'}">${icon}</span>
                </div>
                <h2 class="text-4xl font-black font-serif text-white mb-2 uppercase tracking-widest">${title}</h2>
                <p class="text-white/50 uppercase tracking-widest mb-8">${msg}</p>
                <a href="../Index.html" class="px-8 py-3 bg-white/10 hover:bg-white hover:text-black text-white font-bold uppercase tracking-widest rounded transition-all">
                    Return to Hub
                </a>
            </div>
        `;
    }

    shareGlory(opponent, amount) {
        if(window.Pusher) window.Pusher.pushTicker(`ARENA-NEWS: YOU HAVE DEFEATED ${opponent} // +${amount} EP CLAIMED`, 'success');
        document.getElementById('fates-verdict').classList.add('hidden');
    }

    triggerRevenge(opponentName) {
        document.getElementById('fates-verdict').classList.add('hidden');
        this.openChallengeCard({ name: opponentName, rank: "Rival" });
        // Auto-set stake to double?
        if(window.Pusher) window.Pusher.showToast("Revenge Match Initiated!", 'warning');
    }

    crownWeeklyKings() {
        const fields = ['Tournament', 'Lyric', 'Circle', 'Soul', 'Taste'];
        const randomKing = "Navigator_X"; // Placeholder
        
        if(window.Pusher) window.Pusher.pushTicker(`🏆 CORONATION: ${randomKing} IS THE NEW KING OF ${fields[0].toUpperCase()} FIELD!`, 'success');
    }

    // --- LEGACY METHODS (Kept for compatibility) ---
    startCasualDuel() { this.enterTheFlow(); } // Redirect casual clicking to new flow
    enterTournament() {
        const level = window.Gamification ? window.Gamification.getLevel() : 0;
        if (level < 3) {
            alert(`⛔ ACCESS DENIED\n\nLevel 3 Required.\nCurrent Level: ${level}\n\nTrain in the Casual Grounds first!`);
            return;
        }
        if (window.BracketAgent) window.BracketAgent.open();
    }
    closeDuel() { document.getElementById('duel-overlay')?.classList.add('hidden'); }
}

// Auto-Init
window.Referee = new RefereeAgent();
