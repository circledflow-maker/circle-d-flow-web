/**
 * Community Log System
 * Handles Quests (Missions), Skills (Prisma), and Karma tracking.
 * Bridges data between JSON storage and Gamification engine.
 */

const FALLBACK_DATA = {
    "quests": [
        {
            "id": "q1",
            "title": "Enter the Circle",
            "description": "Complete your profile to unlock the full potential of the Nexus.",
            "xp": 100,
            "type": "Onboarding",
            "actionText": "Profile",
            "actionLink": "#profile-section",
            "karma": 10
        },
        {
            "id": "q2",
            "title": "First Connection",
            "description": "Visit the Bazaar and view an item to understand the economy.",
            "xp": 50,
            "type": "Discovery",
            "actionText": "Bazaar",
            "actionLink": "marketplace.html",
            "expires": "2025-12-31"
        },
        {
            "id": "q3",
            "title": "Knowledge Seeker",
            "description": "Read one article in the Academy to gain wisdom.",
            "xp": 75,
            "type": "Education",
            "actionText": "Academy",
            "actionLink": "academy.html"
        }
    ],
    "skills": [
        {
            "id": "s1",
            "title": "Visual Arts V1",
            "category": "Visuals",
            "price": 150,
            "userId": "current_user",
            "views": 42
        },
        {
            "id": "s2",
            "title": "Beat Making Basic",
            "category": "Sound",
            "price": 80,
            "userId": "current_user",
            "views": 12
        }
    ]
};

class CommunityLogSystem {
    constructor() {
        // Determine path to data based on current location
        const isPagesDir = window.location.pathname.includes('/pages/');
        this.DATA_URL = isPagesDir ? '../data/community_log.json' : 'data/community_log.json';
        
        this.quests = [];
        this.skills = [];
        this.isReady = false;

        this.init();
    }



    async init() {
        await this.loadData();
        this.isReady = true;
        console.log("🦅 [CommunityLog] System Online. Quests & Skills Loaded.");
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('community-log-ready'));


    }

    /**
     * Load Data from JSON
     */
    async loadData() {
        try {
            const response = await fetch(this.DATA_URL);
            if (!response.ok) throw new Error('Failed to load Community Log data');
            
            const data = await response.json();
            this.quests = data.quests || [];
            this.skills = data.skills || [];
        } catch (error) {
            console.error("⚠️ [CommunityLog] Data Load Error:", error);
            
            // Fallback / Offline Mode
            console.warn("⚠️ [CommunityLog] Using Fallback Data (Dev/Offline Mode)");
            this.quests = FALLBACK_DATA.quests || [];
            this.skills = FALLBACK_DATA.skills || [];
        }
    }

    /**
     * Get Active Quests
     */
    getActiveQuests() {
        // Filter by expiration if needed
        const now = new Date();
        return this.quests.filter(q => {
            if (q.expires) {
                return new Date(q.expires) > now;
            }
            return true;
        });
    }

    /**
     * Get User Skills
     * @param {string} userId - 'current_user' for now
     */
    getUserSkills(userId = 'current_user') {
        return this.skills.filter(s => s.userId === userId);
    }

    /**
     * Handle Quest Action (Quick-Jump)
     */
    handleQuestAction(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (!quest) return;

        console.log(`🦅 [CommunityLog] Initiating Quest: ${quest.title}`);

        // Navigation logic
        if (quest.actionLink) {
            if (quest.actionLink.startsWith('#')) {
                // Internal Anchor / Function
                const element = document.querySelector(quest.actionLink);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    element.classList.add('animate-pulse'); // Visual cue
                }
            } else {
                // Page Navigation
                window.location.href = quest.actionLink;
            }
        }
    }

    /**
     * Complete a Quest
     */
    completeQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (!quest) return false;

        // Check if already completed (would need persistence checks here)
        // For now, assuming direct firing

        if (window.Gamification) {
            // Award XP
            window.Gamification.addXP(quest.xp, `Quest Complete: ${quest.title}`);
            
            // Award Karma
            if (quest.karma && window.Gamification.addKarma) {
                window.Gamification.addKarma(quest.karma, `Quest Complete: ${quest.title}`);
            }
        }

        // Play Sound
        this.playSound('quest_complete');

        return true;
    }

    /**
     * Render UI
     */
    /**
     * Render UI (Deprecated: Now handled by dashboard_logic.js overlay system)
     * Kept for reference or fallback.
     */
    renderUI() {
        // No-op for Zen Dashboard
    }

    renderQuestCards() {
        if (this.quests.length === 0) return `<div class="text-mist italic">No active quests.</div>`;

        return this.quests.map(q => `
            <div class="prisma-card relative p-6 bg-black/40 border border-electric/30 rounded-xl overflow-hidden group hover:border-electric transition-all duration-300">
                <div class="absolute inset-0 bg-electric/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="relative z-10 flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-[10px] font-bold px-2 py-1 rounded bg-electric/20 text-electric uppercase tracking-wider">${q.type}</span>
                            ${q.karma ? `<span class="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">handshake</span>+${q.karma} Karma</span>` : ''}
                        </div>
                        <h4 class="text-lg font-bold text-white mb-1 shadow-neon">${q.title}</h4>
                        <p class="text-xs text-gray-400 mb-4">${q.description}</p>
                    </div>
                    <div class="text-right">
                         <span class="text-xl font-bold text-electric block">${q.xp} XP</span>
                    </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-white/10 flex justify-between items-center">
                     <button onclick="CommunityLog.handleQuestAction('${q.id}')" 
                        class="px-4 py-2 bg-electric hover:bg-white hover:text-black text-white text-xs font-bold uppercase tracking-widest rounded transition-all shadow-[0_0_10px_rgba(138,43,226,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center gap-2">
                        ${q.actionText || 'Go'} <span class="material-symbols-outlined text-sm">arrow_forward</span>
                     </button>
                </div>
            </div>
        `).join('');
    }

    renderSkillCards() {
        if (this.skills.length === 0) return `<div class="text-mist italic">No skills listed to Prisma.</div>`;

        return this.skills.map(s => `
            <div class="prisma-card relative p-6 bg-black/40 border border-amber/30 rounded-xl overflow-hidden group hover:border-amber transition-all duration-300">
                 <div class="absolute inset-0 bg-amber/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 
                 <div class="relative z-10">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] font-bold px-2 py-1 rounded bg-amber/20 text-amber uppercase tracking-wider">${s.category}</span>
                        <div class="flex items-center gap-2 text-white/50">
                             <span class="flex items-center gap-1 text-[10px]"><span class="material-symbols-outlined text-[10px]">visibility</span> ${s.views || 0}</span>
                        </div>
                    </div>
                    
                    <h4 class="text-lg font-bold text-white mb-1">${s.title}</h4>
                    <p class="text-xl font-bold text-white mb-4">€${s.price}</p>
                    
                    <div class="flex gap-2">
                        <button class="flex-1 px-3 py-2 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all">
                            Manage
                        </button>
                        <button class="flex-1 px-3 py-2 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded transition-all">
                            Pause
                        </button>
                    </div>
                 </div>
            </div>
        `).join('');
    }

    /**
     * Manage Skill (Edit, Pause, Delete)
     */
    manageSkill(skillId, action) {
        console.log(`🦅 [Prisma] ${action} on Skill ${skillId}`);
        // Implementation for CRUD operations would go here
        // Currently just mocking the interaction
        if (action === 'delete') {
            this.skills = this.skills.filter(s => s.id !== skillId);
            // re-render UI
        }
    }

    playSound(type) {
        // Placeholder for audio agent integration
        console.log(`🎵 [Audio] Playing: ${type}`);
    }
}

// Initialize Global Instance
window.CommunityLog = new CommunityLogSystem();
