/**
 * Gamification & Quest Engine
 * Hybrid System: Handles human task assignments and automated Python Agent tasks.
 * Connects to Supabase 'event_ledger' table for live updates, with local fallback.
 */

const GamificationEngine = {
    state: {
        quests: [],
        exp: 0,
        trust_points: 0
    },

    init: async function() {
        await this.loadState();
        this.renderQuests();
        this.updateHUD();
    },

    loadState: async function() {
        // Load local exp and trust first
        this.state.exp = parseInt(localStorage.getItem('cdf_xp') || '0');
        this.state.trust_points = parseInt(localStorage.getItem('cdf_trust_points') || '100');

        try {
            // Try Supabase fetch
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('event_ledger')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    this.state.quests = data.map(d => ({
                        id: d.id,
                        title: d.title,
                        type: d.type,
                        status: d.status,
                        reward: d.type === 'system' ? 20 : 50, // Default mock rewards if not in schema
                        assignee: d.assigned_user_id ? "Assigned" : "Unassigned"
                    }));
                    this.saveLocal();
                    return;
                }
            }
        } catch(e) {
            console.warn("GamificationEngine: Could not fetch from Supabase, falling back to local storage.", e);
        }

        // Fallback to local storage if Supabase fails or is empty
        this.state.quests = JSON.parse(localStorage.getItem('cdf_quests') || '[]');
        if (this.state.quests.length === 0) {
            this.state.quests = [
                { id: 1, title: "Cut TinyDesk Reel (-14 LUFS)", type: "system", status: "open", reward: 50, assignee: "Python Agent" },
                { id: 2, title: "Generate Philosophical Captions", type: "system", status: "open", reward: 20, assignee: "Python Agent" },
                { id: 3, title: "Coordinate 3D Village Setup", type: "human", status: "open", reward: 100, assignee: "Initiate" }
            ];
            this.saveLocal();
        }
    },

    saveLocal: function() {
        localStorage.setItem('cdf_quests', JSON.stringify(this.state.quests));
        localStorage.setItem('cdf_xp', this.state.exp);
        localStorage.setItem('cdf_trust_points', this.state.trust_points);
    },

    completeQuest: async function(id) {
        const quest = this.state.quests.find(q => q.id === id);
        if (quest && quest.status !== 'completed') {
            quest.status = 'completed';
            
            // Local update first (Optimistic UI)
            this.state.exp += quest.reward || 50;
            this.state.trust_points += 10;
            this.saveLocal();
            this.renderQuests();
            this.updateHUD();

            // Notify UI
            if (window.FloweeAgent) {
                window.FloweeAgent.speak(Quest completed: $. Resonance expanded.);
            } else {
                alert(Quest Completed! +$ EXP);
            }

            // Sync with Supabase if online
            try {
                if (window.supabaseClient) {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    if (user) {
                        await window.supabaseClient.rpc('complete_ledger_task', {
                            p_task_id: id,
                            p_assigned_user_id: user.id
                        });
                    } else {
                        // Fallback simple update if RPC fails or not authed
                        await window.supabaseClient.from('event_ledger').update({ status: 'completed' }).eq('id', id);
                    }
                }
            } catch(e) {
                console.warn("GamificationEngine: Failed to sync completion to Supabase.", e);
            }
        }
    },

    addQuest: async function(title, type, reward, assignee) {
        // Optimistic UI Update
        const newQuest = {
            id: Date.now().toString(), // local fake UUID
            title: title,
            type: type,
            status: "open",
            reward: parseInt(reward) || 50,
            assignee: assignee || "Unassigned"
        };
        this.state.quests.unshift(newQuest);
        this.saveLocal();
        this.renderQuests();

        // Sync with Supabase
        try {
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient.from('event_ledger').insert([{
                    event_id: 'auto_' + Date.now(),
                    title: title,
                    type: type,
                    status: 'open'
                }]).select();
                
                if (data && data.length > 0) {
                    // Update local quest with real UUID
                    newQuest.id = data[0].id;
                    this.saveLocal();
                    this.renderQuests();
                }
            }
        } catch(e) {
            console.error("GamificationEngine: Failed to add quest to Supabase.", e);
        }
    },

    renderQuests: function() {
        const container = document.getElementById('quest-board-container');
        if (!container) return;

        container.innerHTML = '';
        
        this.state.quests.forEach(quest => {
            const isCompleted = quest.status === 'completed';
            const icon = quest.type === 'system' ? 'smart_toy' : 'person';
            const colorClass = quest.type === 'system' ? 'text-blue-400 border-blue-500/30 bg-blue-900/10' : 'text-green-400 border-green-500/30 bg-green-900/10';
            const opacityClass = isCompleted ? 'opacity-50 grayscale' : '';
            
            const questEl = document.createElement('div');
            questEl.className = "flex items-center justify-between p-4 rounded-lg border " + colorClass + " " + opacityClass + " transition-all mb-3";
            
            let btnHTML = '';
            if (!isCompleted) {
                btnHTML = <button onclick="GamificationEngine.completeQuest('$')" class="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest rounded border border-white/20 transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]">Complete</button>;
            } else {
                btnHTML = <span class="text-[10px] text-white/50 uppercase tracking-widest font-mono">Completed</span>;
            }

            questEl.innerHTML = 
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined">$</span>
                    <div>
                        <h4 class="font-bold text-sm tracking-wide text-white">$</h4>
                        <div class="flex gap-2 text-[10px] mt-1 font-mono uppercase">
                            <span class="text-[#d4af37]">Reward: +$ EXP</span>
                            <span class="text-white/40">| Assigned: $</span>
                        </div>
                    </div>
                </div>
                <div>$</div>
            ;
            container.appendChild(questEl);
        });
    },

    updateHUD: function() {
        const expEl = document.getElementById('res-bar-exp');
        const tpEl = document.getElementById('res-bar-tp');
        
        if (expEl) expEl.innerText = this.state.exp;
        if (tpEl) tpEl.innerText = this.state.trust_points;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GamificationEngine.init();
});
