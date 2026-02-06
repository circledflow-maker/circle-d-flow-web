/**
 * MATCHMAKER AGENT (Cypher LX)
 * Simulates PvP Duels, manages Leaderboards, and calculates Battle Logic.
 */
class MatchmakerAgent {
    constructor() {
        this.SYSTEM_AGENTS = [
            { name: "Ghost_Writer", level: 7, class: "Weaver", xp: 2400, winRate: 0.8 },
            { name: "Neon_Vibe", level: 6, class: "Sound-Smith", xp: 2150, winRate: 0.6 },
            { name: "Beat_Boxer", level: 5, class: "Sound-Smith", xp: 1980, winRate: 0.5 },
            { name: "Code_Ronin", level: 4, class: "Weaver", xp: 1200, winRate: 0.4 },
            { name: "Pixel_Sage", level: 6, class: "Visionary", xp: 2050, winRate: 0.7 },
            { name: "Brew_Master", level: 3, class: "Alchemist", xp: 800, winRate: 0.3 }
        ];

        this.currentOpponent = null;
        this.isSearching = false;

        this.init();
    }

    init() {
        console.log("⚔️ [Matchmaker] Cypher LX System Online.");
        this.renderLeaderboard();
        this.attachListeners();
    }

    attachListeners() {
        const btn = document.getElementById('find-match-btn');
        if (btn) btn.onclick = () => this.findMatch();
    }

    /**
     * LEADERBOARD SYSTEM
     * Mixes real user with simulated agents.
     */
    renderLeaderboard() {
        const board = document.getElementById('leaderboard-list');
        if (!board) return;

        // Get User Data
        const user = window.Gamification ? window.Gamification.state : { xp: 0, level: 1, class: 'Unknown' };
        const userName = localStorage.getItem('userName') || "You";
        
        // Compile List
        let rankings = [...this.SYSTEM_AGENTS];
        rankings.push({ 
            name: userName, 
            level: user.level, 
            class: user.class, 
            xp: user.xp, 
            isUser: true 
        });

        // Sort by XP
        rankings.sort((a, b) => b.xp - a.xp);

        // Render
        board.innerHTML = rankings.map((p, index) => `
            <div class="flex items-center justify-between p-3 rounded-lg ${p.isUser ? 'bg-electric/20 border border-electric' : 'hover:bg-white/5'} transition-colors">
                <div class="flex items-center gap-4">
                    <span class="${index < 3 ? 'text-amber-400' : 'text-gray-500'} font-bold text-xl w-6">#${index + 1}</span>
                    <div class="w-8 h-8 rounded-full ${this.getClassColor(p.class)} flex items-center justify-center text-[10px] font-bold text-black border border-white/20">
                        ${p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <span class="font-bold ${p.isUser ? 'text-electric' : 'text-white'} block leading-none">${p.name}</span>
                        <span class="text-[10px] text-white/40 font-mono">${p.class} • Lvl ${p.level}</span>
                    </div>
                </div>
                <span class="text-xs font-mono text-white/60">${p.xp} XP</span>
            </div>
        `).join('');
    }

    getClassColor(className) {
        if (className === 'Weaver') return 'bg-emerald-500';
        if (className === 'Sound-Smith') return 'bg-purple-500';
        if (className === 'Visionary') return 'bg-amber-400';
        if (className === 'Alchemist') return 'bg-red-500';
        return 'bg-gray-400';
    }

    /**
     * MATCHMAKING LOGIC
     */
    async findMatch() {
        if (this.isSearching) return;
        this.isSearching = true;

        const container = document.getElementById('active-duel-container');
        const btn = document.getElementById('find-match-btn');
        
        // UI Update: Scanning
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">cyclone</span> SCANNING NET...';
        
        container.innerHTML = `
            <div class="h-64 flex flex-col items-center justify-center animate-pulse">
                <span class="material-symbols-outlined text-6xl text-electric/50 mb-4">radar</span>
                <p class="text-electric font-mono tracking-widest text-sm">SEARCHING FOR OPPONENT...</p>
                <div class="w-48 h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                    <div class="h-full bg-electric animate-[loading_2s_infinite]"></div>
                </div>
            </div>
        `;

        // Simulate Network Delay (Class Perks could speed this up)
        const userClass = window.Gamification ? window.Gamification.state.class : 'Novice';
        const delay = userClass === 'Weaver' ? 1000 : 3000; // Weavers map faster

        await new Promise(r => setTimeout(r, delay));

        // Found Opponent
        this.currentOpponent = this.SYSTEM_AGENTS[Math.floor(Math.random() * this.SYSTEM_AGENTS.length)];
        this.startDuelUI(this.currentOpponent);
        
        this.isSearching = false;
        btn.innerHTML = 'Scan for New Match';
        btn.disabled = false;
    }

    startDuelUI(opponent) {
        const container = document.getElementById('active-duel-container');
        const user = window.Gamification?.state || { level: 1, class: 'Novice' };
        
        container.innerHTML = `
            <div class="relative bg-black/40 p-6 rounded-2xl border border-white/10 flex flex-col items-center">
                <!-- VS BANNER -->
                <div class="flex items-center justify-between w-full mb-8">
                    <div class="text-center w-1/3">
                        <div class="w-16 h-16 rounded-full bg-electric/20 border-2 border-electric mx-auto mb-2 flex items-center justify-center">
                            <span class="material-symbols-outlined text-3xl">person</span>
                        </div>
                        <p class="font-bold text-electric">YOU</p>
                        <p class="text-[10px] text-white/50">Lvl ${user.level} ${user.class}</p>
                    </div>
                    
                    <div class="w-1/3 text-center">
                        <span class="text-4xl font-black italic text-red-500 text-shadow-glitch">VS</span>
                    </div>

                    <div class="text-center w-1/3">
                        <div class="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 mx-auto mb-2 flex items-center justify-center">
                             <span class="material-symbols-outlined text-3xl text-red-500">robot</span>
                        </div>
                        <p class="font-bold text-red-500">${opponent.name}</p>
                        <p class="text-[10px] text-white/50">Lvl ${opponent.level} ${opponent.class}</p>
                    </div>
                </div>

                <!-- ACTIONS -->
                <div class="grid grid-cols-3 gap-2 w-full">
                    <button onclick="Matchmaker.executeMove('hack')" class="p-3 bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500 hover:text-black rounded text-emerald-500 font-bold text-xs uppercase transition-all">
                        Hack (Intel)
                    </button>
                    <button onclick="Matchmaker.executeMove('brute')" class="p-3 bg-red-500/10 border border-red-500/50 hover:bg-red-500 hover:text-black rounded text-red-500 font-bold text-xs uppercase transition-all">
                        Brute (Power)
                    </button>
                    <button onclick="Matchmaker.executeMove('flow')" class="p-3 bg-electric/10 border border-electric/50 hover:bg-electric hover:text-black rounded text-electric font-bold text-xs uppercase transition-all">
                        Flow (Speed)
                    </button>
                </div>
                <p class="mt-4 text-[10px] text-mist text-center">Select your strategy to breach their firewall.</p>
            </div>
        `;
    }

    /**
     * BATTLE LOGIC
     * Simple R-P-S Logic for now.
     * Hack > Flow > Brute > Hack
     */
    executeMove(move) {
        if (!this.currentOpponent) return;

        const moves = ['hack', 'brute', 'flow'];
        const opponentMove = moves[Math.floor(Math.random() * moves.length)];
        
        let result = 'draw';
        
        if (move === opponentMove) result = 'draw';
        else if (
            (move === 'hack' && opponentMove === 'flow') ||
            (move === 'flow' && opponentMove === 'brute') ||
            (move === 'brute' && opponentMove === 'hack')
        ) {
            result = 'win';
        } else {
            result = 'loss';
        }

        this.showResult(result, move, opponentMove);
    }

    showResult(result, userMove, botMove) {
        const container = document.getElementById('active-duel-container');
        
        let color = 'text-gray-400';
        let title = 'STALEMATE';
        let xpGain = 0;

        if (result === 'win') {
            color = 'text-emerald-500';
            title = 'VICTORY';
            xpGain = 50 + (this.currentOpponent.level * 10);
            if (window.Gamification) window.Gamification.addXP(xpGain, `Defeated ${this.currentOpponent.name}`);
        } else if (result === 'loss') {
            color = 'text-red-500';
            title = 'DEFEAT';
            xpGain = 5;
            if (window.Gamification) window.Gamification.addXP(5, `SurvivalXP`);
        } else {
            title = 'DRAW';
            xpGain = 10;
        }

        container.innerHTML = `
            <div class="text-center py-8">
                 <h2 class="text-5xl font-black italic ${color} mb-4 animate-ping-once">${title}</h2>
                 <p class="text-white text-lg">You used <span class="uppercase font-bold">${userMove}</span>. They used <span class="uppercase font-bold">${botMove}</span>.</p>
                 <div class="mt-6 inline-block px-4 py-2 bg-white/10 rounded-lg">
                    <span class="text-xl font-bold text-amber-400">+${xpGain} XP</span>
                 </div>
                 <div class="mt-8">
                    <button onclick="Matchmaker.findMatch()" class="px-6 py-2 border border-white/20 hover:bg-white hover:text-black rounded-full uppercase tracking-widest text-xs transition-colors">
                        Re-Queue
                    </button>
                 </div>
            </div>
        `;

        // Update Leaderboard to reflect new stats
        this.renderLeaderboard();
    }
}

// Global Instance
window.Matchmaker = new MatchmakerAgent();
