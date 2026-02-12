/**
 * MODULE: Quest Log (The Chronicle)
 * Handles: Active Quest Tracking, Admin Quest Creation, and History.
 * Location: West Quadrant (Replacing/Augmenting Discovery)
 */

window.QuestLog = {
    state: {
        activeTab: 'tracker', // 'tracker' | 'maker' | 'history'
        quests: []
    },

    init: function() {
        console.log("[QuestLog] Initializing Chronicle...");
        
        // RACE CONDITION FIX: tailored for clean-cache scenarios
        if(!window.QuestManifest) {
            console.warn("[QuestLog] Manifest pending... Retrying in 500ms.");
            setTimeout(() => this.init(), 500);
            return;
        }

        this.container = document.getElementById('quest-interface');
        
        if(!this.container) {
            console.warn("[QuestLog] Container #quest-interface not found. Injecting into Colosseum Sector...");
            this.injectIntoSector();
        }

        this.loadQuests();
        this.render();
    },

    injectIntoSector: function() {
        const sector = document.getElementById('sector-colosseum');
        if(!sector) return;

        // Transform the sector into a container
        sector.innerHTML = `
            <div id="quest-interface" class="w-full h-full flex flex-col">
                <!-- Header -->
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-red-500">swords</span>
                        DISCOVERY
                    </h3>
                    <div class="flex gap-1">
                        <button onclick="QuestLog.switchTab('tracker')" class="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Tracker">
                            <span class="material-symbols-outlined text-xs">list_alt</span>
                        </button>
                        <button onclick="QuestLog.switchTab('maker')" id="btn-quest-maker" class="hidden p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Create Quest">
                            <span class="material-symbols-outlined text-xs">add_circle</span>
                        </button>
                        <button onclick="QuestLog.switchTab('history')" class="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="History">
                            <span class="material-symbols-outlined text-xs">history</span>
                        </button>
                    </div>
                </div>

                <!-- Content Area -->
                <div id="quest-content" class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `;

        this.container = document.getElementById('quest-interface');
        
        // Show Maker button if Admin
        if(localStorage.getItem('cdf_role') === 'master' || localStorage.getItem('cdf_admin_token')) {
            document.getElementById('btn-quest-maker').classList.remove('hidden');
        }
    },

    loadQuests: function() {
        // 1. Get Stored Quests
        let storedQuests = JSON.parse(localStorage.getItem('cdf_quests') || '[]');
        
        // 2. FORCE SYNC with Manifest (Critical for updates)
        if(window.QuestManifest) {
            // Map over stored quests and update them with latest manifest data
            storedQuests = storedQuests.map(sq => {
                const manifestEntry = window.QuestManifest.find(mq => mq.id === sq.id);
                if(manifestEntry) {
                    // Overwrite static fields (title, desc, link, icon, type, reward)
                    // Keep dynamic fields (completed, progress, timestamp)
                    return { 
                        ...sq, 
                        title: manifestEntry.title,
                        description: manifestEntry.description,
                        actionLink: manifestEntry.actionLink,
                        icon: manifestEntry.icon,
                        type: manifestEntry.type,
                        xp: manifestEntry.xp,
                        karma: manifestEntry.karma,
                        // Ensure completion status is preserved
                        completed: sq.completed,
                        progress: sq.progress || 0
                    };
                }
                return sq;
            });
            
            // Add any NEW quests from Manifest
            window.QuestManifest.forEach(mq => {
                if(!storedQuests.find(sq => sq.id === mq.id)) {
                    console.log(`[QuestLog] Injecting New Protocol: ${mq.title}`);
                    storedQuests.push({
                        ...mq,
                        completed: false, // Default
                        progress: 0,
                        timestamp: Date.now()
                    });
                }
            });
            
            // Save repaired list
            localStorage.setItem('cdf_quests', JSON.stringify(storedQuests));
            this.state.quests = storedQuests;
            console.log("[QuestLog] Codex synced successfully.");
        } else {
             this.state.quests = storedQuests;
        }
    },

    switchTab: function(tab) {
        this.state.activeTab = tab;
        this.render();
    },

    render: function() {
        const content = document.getElementById('quest-content');
        if(!content) return;

        content.innerHTML = '';

        if(this.state.activeTab === 'tracker') {
            this.renderTracker(content);
        } else if(this.state.activeTab === 'maker') {
            this.renderMaker(content);
        } else if(this.state.activeTab === 'history') {
            this.renderHistory(content);
        }
    },

    // --- VIEW: TRACKER (Active Quests) ---
    renderTracker: function(container) {
        // FILTER: Only show top 3 active quests
        const activeQuests = this.state.quests.filter(q => !q.completed).slice(0, 3);
        
        if(activeQuests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 opacity-50">
                    <span class="material-symbols-outlined text-2xl mb-2">check_circle</span>
                    <p class="text-[10px] uppercase tracking-widest">All Mission Complete</p>
                </div>
            `;
            return;
        }

        activeQuests.forEach(q => {
            const card = document.createElement('div');
            card.className = "bg-white/5 border border-white/10 rounded-lg p-3 hover:border-red-500/50 transition-colors group cursor-pointer relative overflow-hidden";
            
            // Dynamic Button Logic
            let actionBtn = '';
            if(q.actionLink === 'manual_Trigger') {
                // Manual Complete Button (System Sync)
                actionBtn = `
                <button onclick="QuestLog.completeQuest('${q.id}')" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded hover:bg-red-400 transition-all z-10">
                    COMPLETE
                </button>`;
            } else if(q.actionLink) {
                // Navigation Button (Go To...)
                actionBtn = `
                <button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-electric/20 border border-electric/50 text-electric text-[9px] px-2 py-0.5 rounded hover:bg-electric hover:text-white transition-all z-10">
                    INITIATE <span class="material-symbols-outlined text-[8px] align-middle">arrow_forward</span>
                </button>`;
            }

            card.innerHTML = `
                <!-- Progress Line -->
                <div class="absolute bottom-0 left-0 h-0.5 bg-red-500 w-[${q.progress || 0}%] transition-all duration-1000"></div>
                
                <div class="flex justify-between items-start mb-1">
                    <span class="text-[9px] text-red-400 font-mono border border-red-500/20 px-1 rounded">${q.type || 'General'}</span>
                    <span class="text-[9px] text-white/40">${q.xp} XP</span>
                </div>
                <h4 class="text-xs font-bold text-white mb-1 group-hover:text-red-400 transition-colors">${q.title}</h4>
                <p class="text-[10px] text-white/60 leading-tight">${q.description}</p>
                
                ${actionBtn}
            `;
            
            // Click Handler
            card.onclick = (e) => {
                // Ignore clicks if they hit the specific complete button (already handled inline)
                if(e.target.tagName === 'BUTTON') return;

                if(q.actionLink === 'manual_Trigger') {
                    // Fix for "System Synchronization": specific check or just allow completion
                    if(confirm(`Complete Mission: ${q.title}?`)) {
                        QuestLog.completeQuest(q.id);
                    }
                } else if(q.actionLink) {
                     if(q.actionLink.includes('.')) {
                        window.location.href = q.actionLink;
                    } else if (q.actionLink === 'profile_trigger') {
                        window.ApexNexus.openProfile();
                    } else if (q.actionLink === 'network_trigger') {
                        window.ApexNexus.renderNetworkModal();
                    } else {
                        window.ApexNexus.openModal(q.actionLink);
                    }
                } else {
                    // Fallback: Expand/Inspect Quest Details if no link
                    alert(`QUEST DETAILS:\n\n${q.title}\n${q.description}\n\nXP Reward: ${q.xp}`);
                }
            };
            container.appendChild(card);
        });
    },

    // --- VIEW: MAKER (Admin Create) ---
    renderMaker: function(container) {
        container.innerHTML = `
            <div class="space-y-3 animate-fade-in text-white">
                <div class="text-[10px] text-white/40 uppercase tracking-widest mb-1">New Protocol</div>
                
                <!-- Input: Mission -->
                <div class="space-y-1">
                    <label class="text-[9px] text-electric uppercase">Mission Directive</label>
                    <input type="text" id="q-title" placeholder="What is the mission?" class="w-full bg-black/50 border border-white/10 rounded p-2 text-xs focus:border-electric outline-none transition-colors">
                    <textarea id="q-desc" placeholder="Brief briefing..." rows="2" class="w-full bg-black/50 border border-white/10 rounded p-2 text-xs focus:border-electric outline-none transition-colors mt-1"></textarea>
                </div>

                <!-- Media Drop (Simulation) -->
                <div class="border border-dashed border-white/20 rounded-lg p-3 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <span class="material-symbols-outlined text-white/30 group-hover:text-electric">add_photo_alternate</span>
                    <p class="text-[9px] text-white/40 group-hover:text-white/80">Drop Visual / Icon</p>
                    <input type="file" class="hidden"> 
                </div>

                <!-- Reward Slider -->
                <div class="space-y-1">
                     <div class="flex justify-between text-[9px] text-orange-400">
                        <label class="uppercase">Reward (Karma/XP)</label>
                        <span id="xp-val">50</span>
                    </div>
                    <input type="range" id="q-xp" min="10" max="500" step="10" value="50" class="w-full accent-orange-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" oninput="document.getElementById('xp-val').innerText = this.value">
                </div>
                
                <!-- Type Selection -->
                <div class="flex gap-2">
                    <select id="q-type" class="bg-black/50 border border-white/10 rounded p-2 text-xs text-white focus:border-electric outline-none flex-1">
                        <option value="General">General</option>
                        <option value="Visual">Visual (Nyame)</option>
                        <option value="Sound">Sound (Anansi)</option>
                        <option value="Taste">Taste (Queen)</option>
                    </select>
                </div>

                <!-- Broadcast Toggle -->
                <div class="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="q-global" class="accent-electric scale-75">
                    <span class="text-[9px] text-white/60">Broadcast Signal</span>
                </div>

                <button onclick="QuestLog.manifestQuest()" class="w-full bg-gradient-to-r from-electric to-purple-800 border border-electric/30 text-white text-xs font-bold py-2 rounded shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] transition-all uppercase tracking-widest mt-1">
                    Manifest Quest
                </button>
            </div>
        `;
    },

    // --- VIEW: HISTORY (Archive) ---
    renderHistory: function(container) {
        const history = this.state.quests.filter(q => q.completed);
        
        if(history.length === 0) {
             container.innerHTML = `<div class="p-4 text-center text-[10px] text-white/30 italic">No Data in Archive.</div>`;
             return;
        }

        history.forEach(q => {
            container.innerHTML += `
                <div class="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-sm text-green-500">check_circle</span>
                    <div>
                        <h4 class="text-[10px] font-bold text-white line-through decoration-red-500">${q.title}</h4>
                        <span class="text-[9px] text-green-400">+${q.xp} XP Earned</span>
                    </div>
                </div>
            `;
        });
    },

    // --- LOGIC: MANIFEST ---
    manifestQuest: function() {
        // 1. Capture Inputs
        const title = document.getElementById('q-title').value;
        const desc = document.getElementById('q-desc').value;
        const type = document.getElementById('q-type').value;
        const xp = parseInt(document.getElementById('q-xp').value || 50);
        const isGlobal = document.getElementById('q-global').checked;

        // 2. Validation
        if(!title || !desc) {
            alert("Protocol Incomplete. Please define Mission Directive and Briefing.");
            return;
        }

        // 3. Construct Quest Object
        const newQuest = {
            id: `static_${Date.now()}`, // Unique ID
            title: title,
            description: desc,
            type: type,
            xp: xp,
            completed: false,
            actionLink: null, // Custom quests might not have links yet, defaulting to null
            icon: 'stars', // Default icon
            timestamp: Date.now()
        };

        // 4. Update State & Storage
        this.state.quests.push(newQuest);
        
        // Persist to localStorage
        localStorage.setItem('cdf_quests', JSON.stringify(this.state.quests));

        // 5. Feedback & Reset
        alert(`PROTOCOL MANIFESTED: ${title}\nReward: ${xp} XP`);
        
        // Clear Form
        document.getElementById('q-title').value = '';
        document.getElementById('q-desc').value = '';
        
        // Broadcast Event (for Chat or external listeners)
        if(isGlobal && window.Flowee) {
            window.Flowee.talk(true, `New Protocol Detected: ${title}. Check your Quest Log.`);
        }

        // 6. Switch to Tracker to show new quest (if it falls in top 3)
        this.switchTab('tracker');
    },



    // --- LOGIC: COMPLETE ---
    completeQuest: function(id) {
        const questIndex = this.state.quests.findIndex(q => q.id === id);
        if(questIndex > -1) {
            const q = this.state.quests[questIndex];
            if(q.completed) return; // Prevent double dip

            q.completed = true;
            q.completedAt = Date.now();
            
            // Save
            localStorage.setItem('cdf_quests', JSON.stringify(this.state.quests));
            
            // Reward
            const currentXP = parseInt(localStorage.getItem('cdf_xp') || 0);
            localStorage.setItem('cdf_xp', currentXP + q.xp);
            
            // Notify System
            window.dispatchEvent(new CustomEvent('cdf-quest-complete', { 
                detail: { 
                    id: id, 
                    xp: q.xp,
                    title: q.title
                } 
            }));

            // Level Up Check handled by Gamification module listening to storage/xp, 
            // but we can fire a manual one if needed.
            // For now, let's assume Gamification.js handles the XP update event if we trigger it,
            // or we manually trigger the level check.
            if(window.Gamification) window.Gamification.Karma.addXP(0); // Hack to trigger check? 
            // Better: fire the generic XP update event
            window.dispatchEvent(new CustomEvent('cdf-xp-update', { detail: { xp: currentXP + q.xp, amount: q.xp } }));
            
            // Re-render
            this.render();
        }
    }
};
