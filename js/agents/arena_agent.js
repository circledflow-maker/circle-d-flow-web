/**
 * Agent: Arena Master (The Gladiator's Mind)
 * Purpose: Manages Pillar Selection, Matchmaking, Voting, and Results.
 */

class ArenaAgent {
    constructor() {
        this.name = "ArenaMaster";
        this.selectedPillars = [];
        this.dailyChallenges = JSON.parse(localStorage.getItem('cdf_arena_challenges') || '{}');
        
        // Haki Voting Power
        this.rankPower = {
            'Voyager': 1,
            'Privateer': 2,
            'Commander': 5,
            'Sovereign': 10
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Entering the Pit.`);
        window.ArenaAgent = this;
        this.loadPillars();
        
        // Check if we are in the lobby
        if(document.getElementById('arena-lobby')) {
            this.renderLobby();
        }

        // Check if we are in a match
        if(document.getElementById('matchroom-root')) {
            this.initMatch();
        }
    }

    // --- PILLAR SELECTION ---

    loadPillars() {
        const saved = localStorage.getItem('cdf_pillars');
        if(saved) {
            this.selectedPillars = JSON.parse(saved);
        }
    }

    savePillars(pillars) {
        this.selectedPillars = pillars;
        localStorage.setItem('cdf_pillars', JSON.stringify(pillars));
        // Save timestamp for 30-day lock
        localStorage.setItem('cdf_pillar_lock', Date.now());
    }

    isPillarLocked() {
        const lockTime = localStorage.getItem('cdf_pillar_lock');
        if(!lockTime) return false;
        const daysPassed = (Date.now() - parseInt(lockTime)) / (1000 * 60 * 60 * 24);
        return daysPassed < 30;
    }

    togglePillar(element, pillar) {
        if(this.selectedPillars.includes(pillar)) {
            this.selectedPillars = this.selectedPillars.filter(p => p !== pillar);
            element.classList.remove('selected');
        } else {
            if(this.selectedPillars.length < 2) {
                this.selectedPillars.push(pillar);
                element.classList.add('selected');
            } else {
                alert("Only 2 Pillars can be mastered at once!");
            }
        }
        document.getElementById('selection-counter').innerText = `Selected: ${this.selectedPillars.length} / 2`;
        document.getElementById('confirm-selection').disabled = this.selectedPillars.length !== 2;
    }

    confirmPillars() {
        this.savePillars(this.selectedPillars);
        
        // Hide Overlay
        const overlay = document.getElementById('pillar-selection-overlay');
        if(overlay) {
            overlay.style.transition = "opacity 0.5s";
            overlay.style.opacity = "0";
            setTimeout(() => overlay.style.display = 'none', 500);
        }

        // Render the Lobby (Fight Options)
        this.renderLobby();
        
        // Notify
        if(window.Pusher) window.Pusher.showToast('Pillars Locked. The Gate is Open.', 'karma');
    }

    // --- LOBBY LOGIC ---

    renderLobby() {
        const grid = document.getElementById('lobby-grid');
        if(!grid) return;

        // Note: In a real app, this would fetch from a DB filtered by selectedPillars
        const mockOpponents = [
            { id: 'u1', name: 'Beat_Ninja', rank: 'Privateer', pillars: ['MCing', 'Breaking', 'Graffiti'], cp: 1250 },
            { id: 'u2', name: 'Flow_Chef', rank: 'Voyager', pillars: ['Taste', 'Knowledge', 'MCing'], cp: 800 },
            { id: 'u3', name: 'Skate_Sage', rank: 'Commander', pillars: ['Action', 'Graffiti', 'Breaking'], cp: 5400 },
        ];

        // Filter: Show opponents that share at least one pillar
        const relevant = mockOpponents.filter(opp => opp.pillars.some(p => this.selectedPillars.includes(p)));

        if(relevant.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-white/30">No opponents found in your Pillars.</div>`;
            return;
        }

        grid.innerHTML = relevant.map(opp => `
            <div class="bg-[#151515] border border-white/10 p-6 rounded-xl hover:border-orange-500/50 transition-all group">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-display font-bold text-white group-hover:text-orange-400">${opp.name}</h3>
                    <span class="text-xs font-mono text-orange-400 border border-orange-400/30 px-2 py-1 rounded">${opp.rank}</span>
                </div>
                <div class="flex gap-2 mb-6 flex-wrap">
                    ${opp.pillars.map(p => `<span class="text-[10px] bg-white/5 text-white/50 px-2 py-1 rounded uppercase">${p}</span>`).join('')}
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/30 font-mono">CP: ${opp.cp}</span>
                    <button class="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold uppercase text-xs rounded hover:brightness-110 transition-all shadow-lg shadow-orange-900/40" 
                        onclick="window.ArenaAgent.challenge('${opp.id}')">
                        Challenge
                    </button>
                </div>
            </div>
        `).join('');
    }

    challenge(opponentId) {
        // Daily Limit Check
        const today = new Date().toDateString();
        const record = this.dailyChallenges[opponentId] || { date: today, count: 0 };
        
        if(record.date !== today) { record.date = today; record.count = 0; }
        
        if(record.count >= 2) {
            alert("The Spirit needs rest. You have challenged this opponent twice today.");
            return;
        }

        record.count++;
        this.dailyChallenges[opponentId] = record;
        localStorage.setItem('cdf_arena_challenges', JSON.stringify(this.dailyChallenges));

        // Redirect to Matchroom
        window.location.href = `matchroom.html?opponent=${opponentId}`;
    }

    // --- MATCHROOM LOGIC ---

    initMatch() {
        const params = new URLSearchParams(window.location.search);
        const opponentId = params.get('opponent') || 'Training_Bot';
        
        console.log(`[Arena] Initializing Match vs ${opponentId}`);
        
        // Start Countdown
        this.startCountdown();
    }

    startCountdown() {
        let count = 3;
        const overlay = document.getElementById('match-overlay');
        const text = document.getElementById('overlay-text');
        
        const interval = setInterval(() => {
            text.innerText = count;
            // Play sound?
            if(count === 0) {
                clearInterval(interval);
                text.innerText = "FORGE!";
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.style.display = 'none', 500);
                    this.startBattleTimer();
                }, 1000);
            }
            count--;
        }, 1000);
    }

    startBattleTimer() {
        let time = 60;
        const timerEl = document.getElementById('combat-timer');
        
        this.battleInterval = setInterval(() => {
            time--;
            timerEl.innerText = time;
            if(time <= 0) {
                clearInterval(this.battleInterval);
                this.endMatch('draw'); // Or calculate winner based on votes
            }
        }, 1000);
    }

    sendEnergy(side) {
        const fighter = document.getElementById(side === 'left' ? 'fighter-a' : 'fighter-b');
        fighter.classList.add('power-up');
        setTimeout(() => fighter.classList.remove('power-up'), 500);

        // Visual Feedback
        const bar = fighter.querySelector('.hp-fill');
        let currentW = parseFloat(bar.style.width) || 50;
        bar.style.width = Math.min(100, currentW + 5) + '%';

        // Check for "KO" (Filling the bar / overwhelming vibe)
        if(currentW + 5 >= 100) {
            clearInterval(this.battleInterval);
            this.endMatch(side === 'left' ? 'win' : 'lose');
        }
    }

    endMatch(result) {
        let overlay;
        if(result === 'win') {
            overlay = document.getElementById('victory-screen');
            // Mock Rewards
            this.updateRewards(500, 100); 
        } else {
            overlay = document.getElementById('defeat-screen');
            this.updateRewards(50, 0);
        }
        
        overlay.style.display = 'flex';
        // Cleanup
        localStorage.removeItem('cdf_active_match');
    }

    updateRewards(xp, cp) {
        // Here we would call Helper/Network to save
        console.log(`[Arena] Rewards: +${xp} XP, ${cp} CP`);
        // Simple mock storage update for demo
        let currentXP = parseInt(localStorage.getItem('cdf_xp') || 0);
        localStorage.setItem('cdf_xp', currentXP + xp);
    }
}

new ArenaAgent();
