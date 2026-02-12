/**
 * Agent: GuildMaster (The Hall Keeper)
 * Purpose: Manages Guild Logic, Quests, Treasury, and Roster.
 * Theme: Fairy Tail x Vikings
 */

/**
 * Agent: GuildMaster (The Superior)
 * Purpose: Manages Organization XIII Logic, Mission Board, and The Vault.
 * Theme: Kingdom Hearts (Organization XIII) x Circle D Flow
 */

class GuildMasterAgent {
    constructor() {
        this.name = "GuildMaster";
        this.guildDataKey = "cdf_guild_data";
        
        // Circle D Flow Default Data
        this.defaultData = {
            name: "The Inner Circle",
            level: 1,
            xp: 0,
            members: [
                { name: "Prime_CQR", rank: "Architect", role: "Leader", avatar: "avatar_1.png", pillar: "Vision", cp: 13000 },
                { name: "Flow_Axel", rank: "Agent", role: "Member", avatar: "avatar_2.png", pillar: "Battle", cp: 8500 },
                { name: "Neon_Rox", rank: "Key Wielder", role: "Member", avatar: "avatar_3.png", pillar: "Sound", cp: 8200 }
            ],
            treasury: {
                credits: 1500, // Flow Credits (Hearts)
                manillas: 50000 // Munny
            },
            upgrades: [],
            activeQuests: []
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] The Round Room is Assembled.`);
        this.loadData();
        this.renderUI();
        
        window.GuildMaster = this;
    }

    loadData() {
        const stored = localStorage.getItem(this.guildDataKey);
        this.data = stored ? JSON.parse(stored) : this.defaultData;
    }

    saveData() {
        localStorage.setItem(this.guildDataKey, JSON.stringify(this.data));
        this.renderUI(); // Re-render on save
    }

    // --- RENDERERS ---

    renderUI() {
        this.renderRoster();
        this.renderQuestBoard();
        this.renderTreasury();
        this.renderLevel();
    }

    renderLevel() {
        const el = document.getElementById('guild-level-display');
        if(el) {
            el.innerHTML = `
                <div class="text-center group cursor-pointer hover:scale-110 transition-transform">
                    <div class="text-4xl font-black text-gray-200 mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">LVL ${this.data.level}</div>
                    <div class="text-[10px] text-white/30 uppercase tracking-[0.3em] group-hover:text-white transition-colors">The World That Never Was</div>
                    <div class="w-full bg-black h-1 mt-2 rounded-full overflow-hidden border border-white/10">
                        <div class="bg-gray-200 h-full shadow-[0_0_10px_white]" style="width: ${(this.data.xp % 1000) / 10}%"></div>
                    </div>
                </div>
            `;
        }
    }

    renderRoster() {
        const container = document.getElementById('guild-roster-list');
        if(!container) return;

        container.innerHTML = this.data.members.map(m => `
            <div class="flex items-center gap-4 p-3 bg-black/40 border border-white/5 rounded hover:border-white/50 transition-all group backdrop-blur-md">
                <div class="w-12 h-12 rounded-full border border-white/20 overflow-hidden relative shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                     <img src="../Assets/images/avatars/${m.avatar}" onerror="this.src='https://via.placeholder.com/40/000000/FFFFFF?text=Nobody'" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all">
                </div>
                <div>
                    <div class="text-sm font-bold text-gray-200 group-hover:text-white transition-colors uppercase tracking-wider">${m.name}</div>
                    <div class="text-[9px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span>${m.rank}</span> • <span class="text-gray-400">${m.cp} CP</span>
                    </div>
                </div>
                ${m.role === 'Leader' ? '<span class="material-symbols-outlined text-gray-400 ml-auto h-4 w-4 text-sm animate-pulse" title="The Superior">vpn_key</span>' : ''}
            </div>
        `).join('');
        
        // Check for Organization XIII Completion (13 members)
        if(this.data.members.length >= 13) {
            document.body.classList.add('organization-complete');
        }
    }

    renderQuestBoard() {
        const container = document.getElementById('quest-board-grid');
        if(!container) return;
        
        // Will of D / Lisbon Missions
        const quests = [
            { id: 'M1', rank: 'D', title: 'Survey the Tagus River', pillar: 'Vision', reward: 500, xp: 100, expiry: '24h' },
            { id: 'M2', rank: 'B', title: 'Connect with the Earth', pillar: 'Battle', reward: 1200, xp: 300, expiry: '12h' },
            { id: 'M3', rank: 'A', title: 'Find the Will of D Symbol', pillar: 'Specialist', reward: 2500, xp: 600, expiry: '48h' },
            { id: 'M4', rank: 'S', title: 'Unlock the Alfama Secret', pillar: 'Sound', reward: 10000, xp: 2000, expiry: '06h', type: 'raid' } // S-Rank
        ];

        container.innerHTML = quests.map(q => `
            <div class="quest-card aspect-[3/4] bg-black/80 border border-white/10 relative shadow-2xl transform hover:scale-105 transition-transform duration-500 group cursor-pointer overflow-hidden rounded-sm backdrop-blur-xl" onclick="GuildMaster.inspectQuest('${q.id}')">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
                
                <!-- RANK INSIGNIA -->
                <div class="absolute top-4 right-4 w-10 h-10 border border-white/30 flex items-center justify-center rotate-45 group-hover:rotate-0 transition-transform duration-500 bg-black">
                    <span class="font-mono font-bold text-white text-lg -rotate-45 group-hover:rotate-0 transition-transform duration-500">${q.rank}</span>
                </div>

                <!-- CONTENT -->
                <div class="absolute inset-x-6 top-24 text-center">
                    <span class="material-symbols-outlined text-5xl text-gray-500 mb-4 group-hover:text-white transition-colors duration-500 animate-pulse">${this.getPillarIcon(q.pillar)}</span>
                    <h3 class="font-display font-bold text-gray-200 text-xl leading-tight mb-2 uppercase tracking-widest">${q.title}</h3>
                    <p class="font-mono text-[9px] text-gray-500 uppercase tracking-[0.3em] group-hover:text-gray-300 transition-colors">Mission: ${q.pillar}</p>
                </div>

                <!-- REWARD -->
                <div class="absolute bottom-6 inset-x-6 text-center border-t border-white/10 pt-4 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                    <span class="text-xs font-mono text-gray-400">REWARD</span>
                    <div class="flex items-center gap-3 text-white font-bold font-mono text-xs">
                        <span>🌍 ${q.reward}</span>
                        <span>⚡ ${q.xp} XP</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTreasury() {
        const creditDisplay = document.getElementById('treasury-credits');
        const manillaDisplay = document.getElementById('treasury-manillas');
        
        if(creditDisplay) creditDisplay.innerText = this.data.treasury.credits.toLocaleString();
        if(manillaDisplay) manillaDisplay.innerText = this.data.treasury.manillas.toLocaleString();
    }

    // --- ACTIONS ---

    inspectQuest(id) {
        if(window.Pusher) window.Pusher.showToast('Mission Details: Access Restricted (Beta)', 'default');
    }

    getPillarIcon(pillar) {
        const icons = { 'Vision': 'visibility', 'Sound': 'headphones', 'Battle': 'swords', 'Taste': 'restaurant', 'Visual': 'palette', 'Specialist': 'auto_awesome' };
        return icons[pillar] || 'help';
    }

    donateCredits() {
        const amount = 100; // Mock Amount
        // Check User Balance
        if(window.Helper && window.Helper.deductResources(amount)) {
             this.data.treasury.credits += amount;
             this.data.treasury.manillas += (amount * 10); // Conversion
             this.data.xp += amount; // Guild XP for donation
             this.saveData();
             if(window.Pusher) window.Pusher.showToast(`Donated ${amount} Hearts to Organization!`, 'karma');
        } else {
             // Mock User Deduction if Helper fails
             this.data.treasury.credits += amount;
             this.saveData();
             if(window.Pusher) window.Pusher.showToast(`Donated ${amount} Hearts (Dev Mode)`, 'success');
        }
    }

    purchasePackage(type) {
        // Mock Stripe Interaction for "Inner Purchases"
        if(window.Pusher) window.Pusher.showToast(`Accessing Kingdom Hearts for: ${type}...`, 'default');
        
        setTimeout(() => {
            let amount = 0;
            if(type === 'shard') amount = 500;   // Viking -> Shard
            if(type === 'essence') amount = 1200; // Fairy -> Essence
            if(type === 'sigil') amount = 3000;   // Imperial -> Sigil
            if(type === 'keyblade') amount = 7500; // Apostle -> Keyblade

            this.data.treasury.credits += amount;
            this.saveData();

            // Rain Effect
            if(window.Flowee) window.Flowee.celebrate(); // Needs visual update for Hearts instead of Coins ideally
            if(window.Pusher) window.Pusher.showToast(`Hearts Acquired! +${amount}`, 'success');

        }, 1500);
    }
}

new GuildMasterAgent();
