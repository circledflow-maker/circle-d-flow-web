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
        const sid = String(id);
        const quest = this.state.quests.find(q => String(q.id) === sid);
        if (quest && quest.status !== 'completed') {
            quest.status = 'completed';
            const reward = quest.reward || 50;
            this.state.exp += reward;
            this.state.trust_points += 10;
            localStorage.setItem('cdf_xp', String(this.state.exp));
            localStorage.setItem('cdf_user_xp', String(this.state.exp));
            localStorage.setItem('cdf_trust_points', String(this.state.trust_points));
            this.saveLocal();
            this.renderQuests();
            this.updateHUD();
            if (window.CoopBarkeeper) window.CoopBarkeeper.renderResonanceBar();

            const level = Math.max(1, Math.floor(this.state.exp / 200) + 1);
            const prev = parseInt(localStorage.getItem('cdf_last_level') || '1', 10);
            if (level > prev) {
                localStorage.setItem('cdf_last_level', String(level));
                if (window.AdinkraEngine) window.AdinkraEngine.onLevelUp(level, prev);
            }

            if (window.FloweeReward) {
                await window.FloweeReward.xpToast(quest.title, reward);
            } else if (window.Flowee) {
                window.Flowee.talk(true, `Quest sealed: +${reward} EXP, +10 Trust.`, 'celebrate');
            } else if (window.Pusher) {
                window.Pusher.showToast(`+${reward} EXP · ${quest.title}`, 'success');
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
        const containers = [
            document.getElementById('quest-board-container'),
            document.getElementById('quest-board-container-m'),
        ].filter(Boolean);
        if (!containers.length) return;

        const buildCard = (quest) => {
            const isCompleted = quest.status === 'completed';
            const icon = quest.type === 'system' ? 'smart_toy' : 'person';
            const colorClass = quest.type === 'system' ? 'text-blue-400 border-blue-500/30 bg-blue-900/10' : 'text-green-400 border-green-500/30 bg-green-900/10';
            const opacityClass = isCompleted ? 'opacity-50 grayscale' : '';
            const qid = String(quest.id).replace(/'/g, "\\'");
            const btnHTML = !isCompleted
                ? `<button type="button" data-quest-id="${qid}" class="coop-quest-complete px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest rounded border border-white/20">Complete</button>`
                : `<span class="text-[10px] text-white/50 uppercase tracking-widest font-mono">Completed</span>`;
            return `<div class="flex items-center justify-between p-4 rounded-lg border ${colorClass} ${opacityClass} transition-all mb-3">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="material-symbols-outlined shrink-0">${icon}</span>
                    <div class="min-w-0"><h4 class="font-bold text-sm tracking-wide text-white truncate">${quest.title}</h4>
                    <div class="flex gap-2 text-[10px] mt-1 font-mono uppercase flex-wrap">
                        <span class="text-[#d4af37]">+${quest.reward} EXP</span>
                        <span class="text-white/40">${quest.assignee}</span>
                    </div></div>
                </div>
                <div class="shrink-0">${btnHTML}</div>
            </div>`;
        };

        const html = this.state.quests.map(buildCard).join('');
        containers.forEach((container) => {
            container.innerHTML = html;
            container.querySelectorAll('.coop-quest-complete').forEach((btn) => {
                btn.addEventListener('click', () => GamificationEngine.completeQuest(btn.dataset.questId));
            });
        });
    },

    updateHUD: function() {
        const expEl = document.getElementById('res-bar-exp');
        const tpEl = document.getElementById('res-bar-tp');
        const flowEl = document.getElementById('res-bar-flow');
        const lvlEl = document.getElementById('res-bar-level');
        
        if (expEl) expEl.innerText = this.state.exp;
        if (tpEl) tpEl.innerText = this.state.trust_points;
        if (flowEl) flowEl.innerText = localStorage.getItem('cdf_wallet_flow') || '0';
        if (lvlEl) lvlEl.innerText = Math.max(1, Math.floor(this.state.exp / 200) + 1);
        if (window.CoopBarkeeper) window.CoopBarkeeper.renderResonanceBar();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GamificationEngine.init();
});
