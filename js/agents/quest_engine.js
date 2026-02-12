/**
 * Agent: Universal Quest Engine (The Navigator's Awakening)
 * Purpose: Manages the "Grand Line" tutorial storyline, cross-device sync (Supabase), and persistent user progress.
 * Version: 2.0 (Grand Line Edition)
 */

/* --- 1. CONFIGURATION --- */
const SUPABASE_URL = 'https://agkmbaephgsnunlarntm.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_VwT4qFpNCgNizSXMILBcKQ_aevHvWvM'; // User Provided Key

// Fallback Mode (if no keys provided or placeholder detected)
const USE_LOCAL_STORAGE_ONLY = (SUPABASE_URL.includes('YOUR_SUPABASE'));
let supabase = null;

if (!USE_LOCAL_STORAGE_ONLY && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// --- EXTENDED QUEST REGISTRY (The Grand Line) ---
const QUEST_REGISTRY = {
    // --- PHASE 1: BASICS ---
    'q1_intro': {
        next: 'q2_library',
        location: 'master_dashboard.html', 
        title: "The Awakening",
        text: "Welcome, Navigator! Before you conquer the Grand Line, you must master your tools.",
        action: 'ACCEPT', 
        reward: { exp: 50, credits: 10 }
    },

    // --- PHASE 2: WISDOM & COLLECTION ---
    'q2_library': {
        next: 'q3_connect',
        location: 'library.html',
        title: "The Keeper of Knowledge",
        text: "A true Captain never stops learning. Add an item (Song or Text) to your personal library.",
        action: 'CLICK_ELEMENT',
        selector: '.add-to-library-btn', // Button ID on the page
        hint: "Search for the 'Bookmark' icon on an article.",
        reward: { exp: 75, credits: 0 }
    },

    // --- PHASE 3: SOCIAL & CONNECTIONS ---
    'q3_connect': {
        next: 'q4_wisdom',
        location: 'guild.html',
        title: "The Alliance",
        text: "Alone you are strong, together we are a fleet. Send a friend request to another Navigator.",
        action: 'CLICK_ELEMENT',
        selector: '.add-friend-btn',
        hint: "Click the '+' next to a User Name.",
        reward: { exp: 100, credits: 20 }
    },

    // --- PHASE 4: THE QUIZ (WISDOM CHECK) ---
    'q4_wisdom': {
        next: 'q5_arena',
        location: 'library.html', // Or sanctuary
        title: "The Oracle's Test",
        text: "Prove your knowledge of the Flow.",
        action: 'QUIZ', 
        quizData: {
            question: "What is the currency of Circle-D-Flow?",
            options: ["Gold Coins", "Flow Credits", "Bitcoins", "Haki Points"],
            correct: 1 // Index (Flow Credits)
        },
        reward: { exp: 150, credits: 50 }
    },

    // --- PHASE 5: BATTLE GROUND ---
    'q5_arena': {
        next: 'q6_create',
        location: 'arena.html',
        title: "The Proving Ground",
        text: "Enter the Arena. Legends are forged here. Click 'Enter Battle' to register for a match.",
        action: 'CLICK_ELEMENT',
        selector: '#enter-battle-btn',
        reward: { exp: 200, credits: 100 }
    },

    // --- PHASE 6: CREATION (USER GENERATED CONTENT) ---
    'q6_create': {
        next: 'q7_highpalace',
        location: 'master_dashboard.html',
        title: "The Architect",
        text: "A Captain doesn't just follow orders, they give them. Create your own Mini-Quest for your crew.",
        action: 'SUBMIT_FORM', 
        selector: '#create-quest-form',
        hint: "Use the 'Quest Creator' in the Dashboard.",
        reward: { exp: 300, credits: 150 }
    },

    // --- PHASE 7: ENDGAME ---
    'q7_highpalace': {
        next: null, // END
        location: 'high_palace.html', 
        title: "The High Palace",
        text: "You have passed all trials. You have access to the High Palace. Enjoy the view, Elite Navigator.",
        action: 'VISIT',
        reward: { exp: 1000, credits: 500, rank: "Admiral" }
    }
};

/* --- 2. ENGINE LOGIC --- */
class QuestEngineAgent {
    constructor() {
        this.name = "QuestEngine";
        this.userProfile = null;
        this.init();
    }

    async init() {
        console.log(`[${this.name}] Initializing Grand Line Logic...`);
        
        if (USE_LOCAL_STORAGE_ONLY) {
            console.warn(`[${this.name}] Running in LocalStorage Fallback Mode.`);
            this.loadProfileLocal();
        } else {
            await this.loadProfileSupabase();
        }

        // Start Loop
        this.checkActiveQuest();
        
        // Expose
        window.QuestEngine = this;
    }

    // --- PROFILE MANAGEMENT ---
    loadProfileLocal() {
        let profile = JSON.parse(localStorage.getItem('cqr_user'));
        if (!profile) return; 

        if (!profile.current_quest_id) profile.current_quest_id = 'q1_intro';
        this.userProfile = profile;
    }

    async loadProfileSupabase() {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (data) {
                this.userProfile = data;
                localStorage.setItem('cqr_user', JSON.stringify(data));
            }
        }
    }

    // --- MAIN LOOP ---
    checkActiveQuest() {
        if (!this.userProfile || !this.userProfile.current_quest_id) return;
        
        const questId = this.userProfile.current_quest_id;
        const quest = QUEST_REGISTRY[questId];
        if (!quest) return; 

        // 1. HUD ALWAYS ON
        this.renderQuestHUD(quest);

        // 2. LOCATION CHECK
        if (window.location.href.includes(quest.location)) {
            // Correct Location -> Execute Action Logic
            if (quest.action === 'ACCEPT') setTimeout(() => this.renderParchment(quest), 1000);
            if (quest.action === 'QUIZ') this.renderQuiz(quest, questId);
            if (quest.action === 'CLICK_ELEMENT') this.setupClickTrigger(quest, questId);
            if (quest.action === 'SUBMIT_FORM') this.setupFormTrigger(quest, questId);
            if (quest.action === 'VISIT') setTimeout(() => this.completeQuest(questId), 2000);
        } else {
            // Wrong Location -> Guide User
            this.highlightNavigation(quest.location);
        }
    }

    // --- UI RENDERERS ---
    renderQuestHUD(quest) {
        const old = document.getElementById('quest-hud'); if(old) old.remove();
        const html = `
        <div id="quest-hud">
            <h4>🎯 CURRENT OBJECTIVE</h4>
            <p>${quest.title}</p>
            <div class="hint">${quest.hint || "Follow the Flow..."}</div>
            <div style="margin-top:5px; font-size:0.7em; color:#00f0ff;">Reward: ${quest.reward.exp} EXP</div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    renderQuiz(quest, questId) {
        if (document.getElementById('quest-overlay')) return;
        const quiz = quest.quizData;
        const html = `
        <div id="quest-overlay" class="fixed inset-0 bg-black/90 z-[20000] flex items-center justify-center p-4">
            <div class="parchment-scroll bg-[#d4c5a3] w-full max-w-md p-8 text-center" style="border: 5px solid #5c4033; border-radius: 10px;">
                <h2 style="color:#8b0000; font-family: serif; font-size: 2rem; margin-bottom: 1rem;">${quest.title}</h2>
                <p style="font-weight:bold; font-size:1.2em; color:#333; margin-bottom: 2rem;">${quiz.question}</p>
                <div class="flex flex-col gap-3">
                    ${quiz.options.map((opt, i) => 
                        `<button class="quiz-option-btn p-3 bg-white border border-[#5c4033] hover:bg-gold transition-colors" onclick="window.QuestEngine.solveQuiz(${i}, ${quiz.correct}, '${questId}')">${opt}</button>`
                    ).join('')}
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    renderParchment(quest) {
        if (document.getElementById('quest-overlay')) return;
        const html = `
        <div id="quest-overlay" class="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-6">
            <div class="bg-[#d4c5a3] w-full max-w-lg p-8 rounded shadow-[0_0_50px_rgba(218,165,32,0.5)] text-center relative">
                 <h2 class="text-3xl font-serif font-bold text-[#3e2723] mb-4">${quest.title}</h2>
                 <p class="text-[#5c4033] text-lg mb-6">${quest.text}</p>
                 <button onclick="window.QuestEngine.completeQuest('${this.userProfile.current_quest_id}')" class="px-6 py-2 bg-[#8b0000] text-white font-bold rounded hover:scale-105 transition">ACCEPT QUEST</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    highlightNavigation(targetUrl) {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            if(link.href.includes(targetUrl)) {
                link.classList.add('flowee-target');
            }
        });
    }

    // --- ACTIONS ---
    async solveQuiz(selected, correct, questId) {
        if (selected === correct) {
            document.getElementById('quest-overlay').remove();
            alert("Correct! Wisdom assimilated.");
            await this.completeQuest(questId);
        } else {
            alert("Incorrect. The Flow is disrupted.");
        }
    }

    setupClickTrigger(quest, questId) {
        const el = document.querySelector(quest.selector);
        if (el) {
            el.addEventListener('click', async (e) => {
                // DB Interactions
                if(quest.selector.includes('library')) await this.addToLibraryDB('item_01');
                if(quest.selector.includes('friend')) await this.addFriendDB('target_user_dummy');
                
                await this.completeQuest(questId);
            }, { once: true });
        }
    }

    setupFormTrigger(quest, questId) {
        const form = document.querySelector(quest.selector);
        if(form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createQuestDB(form);
                await this.completeQuest(questId);
            }, { once: true });
        }
    }

    // --- DB HELPERS ---
    async addToLibraryDB(itemId) {
        if(supabase) await supabase.from('library').insert([{ user_id: this.userProfile.id, item_id: itemId }]);
    }
    async addFriendDB(friendId) {
        if(supabase) await supabase.from('connections').insert([{ user_id: this.userProfile.id, friend_id: friendId || this.userProfile.id }]); // Self-friend for beta
    }
    async createQuestDB(form) {
        const title = form.querySelector('input').value;
        if(supabase) await supabase.from('user_quests').insert([{ creator_id: this.userProfile.id, title: title }]);
    }

    // --- COMPLETION ---
    async completeQuest(questId) {
        const quest = QUEST_REGISTRY[questId];
        
        // 1. Update State
        this.userProfile.exp = (this.userProfile.exp || 0) + quest.reward.exp;
        this.userProfile.credits = (this.userProfile.credits || 0) + quest.reward.credits;
        this.userProfile.current_quest_id = quest.next;

        // 2. Persist
        if (USE_LOCAL_STORAGE_ONLY) {
             localStorage.setItem('cqr_user', JSON.stringify(this.userProfile));
        } else if (supabase) {
             await supabase.from('profiles').update({
                 exp: this.userProfile.exp,
                 credits: this.userProfile.credits,
                 current_quest_id: this.userProfile.current_quest_id
             }).eq('id', this.userProfile.id);
        }

        // 3. Feedback & Transition
        if(document.getElementById('quest-overlay')) document.getElementById('quest-overlay').remove();
        
        if(window.Pusher) window.Pusher.showToast(`QUEST COMPLETE! +${quest.reward.exp} XP`, 'success');
        else alert(`QUEST COMPLETE! +${quest.reward.exp} XP`);

        if (quest.next) {
            setTimeout(() => {
                 location.reload(); // Reload to trigger next quest logic (HUD update etc)
            }, 1000);
        } else {
             if(window.Pusher) window.Pusher.showToast("GRAND LINE CONQUERED. WELCOME ADMIRAL.", 'success');
        }
    }
    // --- ADMIN OVERSEER (BETA) ---
    async updateAdminStats() {
        const panel = document.getElementById('admin-overseer-panel');
        if(panel) panel.style.display = 'block';

        console.log(`[${this.name}] Scanning Fleet...`);

        // 1. Mock Data (Visual Feedback immediately)
        document.getElementById('stat-total-users').innerText = "Scanning...";
        
        let total = 0;
        let active = 0;

        if (supabase) {
            // Real Data
            const { count: totalCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            total = totalCount || 0;
            
            // Active in last 10 mins
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('updated_at', tenMinsAgo);
            active = activeCount || 0;
        } else {
            // Simulation Mode
            total = Math.floor(Math.random() * 50) + 10;
            active = Math.floor(Math.random() * total);
        }

        // Update UI
        document.getElementById('stat-total-users').innerText = total;
        document.getElementById('stat-active-users').innerText = active;
        
        // Quest Breakdown (Simulated for Visual)
        const breakdownHTML = `
            <div style="margin-top:10px; font-size: 0.8em; color: #aaa;">
                <div>Phase 1 (Awakening): <span style="color:white">${Math.floor(total * 0.2)}</span></div>
                <div>Phase 2 (Library): <span style="color:white">${Math.floor(total * 0.3)}</span></div>
                <div>Phase 3 (Connections): <span style="color:white">${Math.floor(total * 0.1)}</span></div>
                <div>Phase 7 (High Palace): <span style="color:gold">${Math.floor(total * 0.05)}</span></div>
            </div>
        `;
        document.getElementById('quest-breakdown').innerHTML = breakdownHTML;
    }
}

// Auto-Init
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new QuestEngineAgent());
} else {
    new QuestEngineAgent();
}
