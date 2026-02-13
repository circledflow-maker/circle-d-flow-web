/**
 * Agent: CaptainsLog (The Unified Dossier)
 * Purpose: Manages the Central Profile Interface (Core Click).
 * Features: Tabs for Log, Hammer, Active, Treasury, Synthesize.
 */
class CaptainsLogAgent {
    constructor() {
        this.name = "CaptainsLog";
        this.activeTab = 'log';
        // CRITICAL: Expose immediately to beat Onboarding race condition
        window.CaptainsLog = this;
        this.init();
    }

    init() {
        console.log(`[${this.name}] Initializing Dossier Protocol...`);
        this.injectStyles();
        // Fallback or double-check
        if(!window.CaptainsLog) window.CaptainsLog = this;
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* DOSSIER MODAL */
            .dossier-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(8px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s ease;
            }
            .dossier-overlay.active { opacity: 1; pointer-events: auto; }

            .dossier-container {
                width: 90%; max-width: 900px;
                height: 80vh; max-height: 700px;
                background: radial-gradient(circle at top left, #1a1a1a, #0a0a0a);
                border: 1px solid var(--haki-gold);
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 0 50px rgba(212, 175, 55, 0.1);
                overflow: hidden;
                transform: scale(0.95);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .dossier-overlay.active .dossier-container { transform: scale(1); }

            /* HEADER */
            .dossier-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.02);
            }
            .dossier-title { font-family: 'Cinzel', serif; font-size: 1.5rem; color: var(--haki-gold); }
            .dossier-close { 
                cursor: pointer; color: white; opacity: 0.7; transition: 0.3s; 
                font-family: monospace; font-size: 1.2rem;
            }
            .dossier-close:hover { color: red; opacity: 1; }

            /* TABS */
            .dossier-tabs {
                display: flex;
                background: rgba(0,0,0,0.5);
                border-bottom: 1px solid rgba(255,255,255,0.1);
                overflow-x: auto;
            }
            .dossier-tab {
                flex: 1;
                text-align: center;
                padding: 15px;
                color: #888;
                cursor: pointer;
                font-family: 'Space Mono', monospace;
                font-size: 0.9rem;
                transition: 0.3s;
                border-right: 1px solid rgba(255,255,255,0.05);
                position: relative;
                min-width: 100px;
            }
            .dossier-tab:hover { color: white; background: rgba(255,255,255,0.05); }
            .dossier-tab.active { color: var(--haki-gold); background: rgba(212, 175, 55, 0.1); }
            .dossier-tab.active::after {
                content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--haki-gold);
            }

            /* CONTENT BODY */
            .dossier-body {
                flex: 1;
                padding: 24px;
                overflow-y: auto;
            }
            .tab-content { display: none; animation: fadeIn 0.4s; }
            .tab-content.active { display: block; }

            /* SECTION: VESSEL LOG */
            .vessel-grid { display: grid; grid-template-columns: 200px 1fr; gap: 24px; }
            .vessel-avatar-card { text-align: center; border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; }
            .vessel-avatar { width: 100px; height: 100px; border-radius: 50%; border: 2px solid var(--haki-gold); margin-bottom: 10px; object-fit: cover; }
            .vessel-stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); color: #aaa; font-size: 0.9rem; }
            
            /* SECTION: HAMMER */
            .hammer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .hammer-card { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; cursor: pointer; transition: 0.3s; border: 1px solid transparent; text-align: center; }
            .hammer-card:hover { border-color: var(--haki-gold); transform: translateY(-5px); }
            .hammer-icon { font-size: 40px; color: var(--haki-gold); margin-bottom: 10px; }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            
            /* RESPONSIVE */
            @media (max-width: 768px) {
                .vessel-grid { grid-template-columns: 1fr; }
                .hammer-grid { grid-template-columns: 1fr; }
                .dossier-tab { padding: 10px; font-size: 0.8rem; }
            }
        `;
        document.head.appendChild(style);
    }

    open(defaultTab = 'log') {
        let overlay = document.getElementById('dossier-overlay');
        if(!overlay) {
            overlay = this.renderOverlay();
            document.body.appendChild(overlay);
        }
        
        // Force Reflow & Animate
        setTimeout(() => overlay.classList.add('active'), 10);
        this.switchTab(defaultTab);
    }
    
    close() {
        const overlay = document.getElementById('dossier-overlay');
        if(overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 400); // Remove after anim
        }
        // Reset Orrery State if needed
        if(window.FlowCompass) window.FlowCompass.resetFocus();
    }

    renderOverlay() {
        const div = document.createElement('div');
        div.id = 'dossier-overlay';
        div.className = 'dossier-overlay';
        div.onclick = (e) => { if(e.target === div) this.close(); };

        div.innerHTML = `
            <div class="dossier-container">
                <header class="dossier-header">
                    <div class="dossier-title">CAPTAIN'S LOG</div>
                    <div class="dossier-close" onclick="CaptainsLog.close()">[CLOSE]</div>
                </header>
                
                <nav class="dossier-tabs">
                    <div class="dossier-tab" onclick="CaptainsLog.switchTab('log')" id="tab-btn-log">VESSEL LOG</div>
                    <div class="dossier-tab" onclick="CaptainsLog.switchTab('hammer')" id="tab-btn-hammer">HAMMER</div>
                    <div class="dossier-tab" onclick="CaptainsLog.switchTab('active')" id="tab-btn-active">ACTIVE</div>
                    <div class="dossier-tab" onclick="CaptainsLog.switchTab('treasury')" id="tab-btn-treasury">TREASURY</div>
                    <div class="dossier-tab" onclick="CaptainsLog.switchTab('synthesize')" id="tab-btn-synthesize">SYNTHESIZE</div>
                </nav>

                <main class="dossier-body">
                    <div id="tab-content-log" class="tab-content"></div>
                    <div id="tab-content-hammer" class="tab-content"></div>
                    <div id="tab-content-active" class="tab-content"></div>
                    <div id="tab-content-treasury" class="tab-content"></div>
                    <div id="tab-content-synthesize" class="tab-content"></div>
                </main>
            </div>
        `;
        return div;
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // UI Updates
        document.querySelectorAll('.dossier-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-btn-${tabId}`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const content = document.getElementById(`tab-content-${tabId}`);
        content.classList.add('active');
        
        // Logic Load
        this.renderTabContent(tabId, content);
    }

    renderTabContent(tabId, container) {
        container.innerHTML = `<div class="text-center p-4 text-white/50">Accessing ${tabId.toUpperCase()} Database...</div>`;
        
        // Fetch real data logic
        switch(tabId) {
            case 'log': this.renderLog(container); break;
            case 'hammer': this.renderHammer(container); break;
            case 'active': this.renderActive(container); break;
            case 'treasury': this.renderTreasury(container); break;
            case 'synthesize': this.renderSynthesize(container); break;
        }
    }

    renderLog(container) {
        const user = {
            name: localStorage.getItem('cdf_user_username') || "Drifter",
            rank: localStorage.getItem('cdf_user_rank') || "Voyager",
            xp: localStorage.getItem('cdf_xp') || 0,
            avatar: localStorage.getItem('cdf_avatar_src') || "Assets/images/avatars/avatar_1.png"
        };
        
        // Check Mission Status
        const isMissionPending = !localStorage.getItem('cdf_mission_identity_complete');
        const missionBanner = isMissionPending ? `
            <div class="mb-6 p-3 bg-yellow-900/40 border border-[#d4af37] rounded flex items-center justify-between animate-pulse">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-[#d4af37]">assignment_late</span>
                    <div>
                        <h4 class="text-[#d4af37] font-bold text-sm">MISSION ACTIVE: IDENTITY SYNC</h4>
                        <p class="text-xs text-white/70">Update your profile signature to proceed.</p>
                    </div>
                </div>
                <span class="text-xs font-mono text-[#d4af37] border border-[#d4af37] px-2 py-1 rounded">REWARD: 100 XP</span>
            </div>
        ` : '';

        container.innerHTML = `
            ${missionBanner}
            <div class="vessel-grid">
                <div class="vessel-avatar-card relative group">
                    <img src="${user.avatar}" class="vessel-avatar cursor-pointer hover:scale-110 transition-transform" id="profile-avatar-img" onclick="CaptainsLog.triggerAvatarUpload()" title="Click to Upload Identity">
                    <input type="file" id="cms-avatar-upload" accept="image/*" style="display:none" onchange="CaptainsLog.handleAvatarUpload(this)">
                    
                    <div class="absolute bottom-16 right-16 bg-gold text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span class="material-symbols-outlined text-sm">upload</span>
                    </div>
                    
                    <div id="profile-display-mode">
                        <h3 class="text-xl text-white font-cinzel">${user.name}</h3>
                        <p class="text-sm text-gold">${user.rank}</p>
                    </div>
                    <div id="profile-edit-mode" class="hidden space-y-2 mt-2">
                        <input type="text" id="edit-name" value="${user.name}" class="w-full bg-black/50 border border-white/20 text-white text-center p-1 rounded font-cinzel">
                        <select id="edit-rank" class="w-full bg-black/50 border border-white/20 text-gold text-center p-1 rounded text-xs font-mono">
                            <option value="Voyager">Voyager</option>
                            <option value="Pathfinder">Pathfinder</option>
                            <option value="Architect">Architect</option>
                        </select>
                    </div>
                </div>
                
                <div class="vessel-stats">
                    <h4 class="text-lg text-white mb-4 border-b border-white/10 pb-2">Ship Statistics</h4>
                    <div class="vessel-stat-row"><span>Total XP</span> <span>${user.xp}</span></div>
                    <div class="vessel-stat-row"><span>Missions Completed</span> <span>${localStorage.getItem('cdf_quests_completed') || 0}</span></div>
                    <div class="vessel-stat-row"><span>Artifacts Found</span> <span>${localStorage.getItem('cdf_artifacts_found') || 0}</span></div>
                    
                    <div class="mt-6 flex gap-2">
                        <button id="btn-edit-profile" onclick="CaptainsLog.toggleProfileEdit()" class="flex-1 bg-white/10 hover:bg-gold hover:text-black py-2 rounded transition font-bold font-mono ${isMissionPending ? 'border border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : ''}">
                            ${isMissionPending ? 'EDIT PROFILE (REQUIRED)' : 'EDIT FULL PROFILE'}
                        </button>
                        <button id="btn-save-profile" onclick="CaptainsLog.saveProfile()" class="hidden flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded transition font-bold font-mono">
                            SAVE CHANGES
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    toggleProfileEdit() {
        const display = document.getElementById('profile-display-mode');
        const edit = document.getElementById('profile-edit-mode');
        const btnEdit = document.getElementById('btn-edit-profile');
        const btnSave = document.getElementById('btn-save-profile');

        if(display && edit) {
            display.classList.toggle('hidden');
            edit.classList.toggle('hidden');
            btnEdit.classList.toggle('hidden');
            btnSave.classList.toggle('hidden');
            
            // Focus if editing
            if(!edit.classList.contains('hidden')) {
                document.getElementById('edit-name').focus();
            }
        }
    }

    triggerAvatarUpload() {
        const input = document.getElementById('cms-avatar-upload');
        if(input) input.click();
    }

    handleAvatarUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('profile-avatar-img');
                if(img) {
                    img.src = e.target.result;
                    // Auto-open edit mode if not open, to encourage saving
                    const edit = document.getElementById('profile-edit-mode');
                    if(edit && edit.classList.contains('hidden')) {
                        CaptainsLog.toggleProfileEdit();
                    }
                }
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    saveProfile() {
        console.log("[CaptainsLog] saveProfile triggered."); // DEBUG
        const nameInput = document.getElementById('edit-name');
        const rankInput = document.getElementById('edit-rank');
        const img = document.getElementById('profile-avatar-img');

        if(nameInput && rankInput && img) {
            const newName = nameInput.value;
            const newRank = rankInput.value;
            const newAvatar = img.src; // DataURL from FileReader

            console.log("[CaptainsLog] Saving:", { newName, newRank, avatarLength: newAvatar.length });

            // 1. Save to Storage (Robust)
            try {
                localStorage.setItem('cdf_user_username', newName);
                localStorage.setItem('cdf_user_rank', newRank);
                localStorage.setItem('cdf_avatar_src', newAvatar);
            } catch (e) {
                console.error("Storage Full. Proceeding in RAM-only mode.");
                try { localStorage.removeItem('cdf_glitch_log'); } catch(ex){}
            }

            // 2. Update UI (Toggle + Re-render)
            this.toggleProfileEdit();
            this.renderLog(document.getElementById('tab-content-log')); 

            // 3. Notify System
            if(window.Pusher) {
                window.Pusher.showToast('Profile Updated Successfully', 'success');
                window.Pusher.broadcast('PROFILE_UPDATE', { name: newName, rank: newRank });
            }
            
            // 3b. SYNC TO SUPABASE (Defensive)
            if(window.supabaseClient) {
                const user = window.supabaseClient.auth.user();
                if(user) {
                    window.supabaseClient
                        .from('profiles')
                        .upsert({ 
                            id: user.id, 
                            username: newName, 
                            avatar_url: newAvatar, 
                            updated_at: new Date()
                        })
                        .then(({ error }) => {
                            if(error) console.error("Supabase Sync Failed:", error);
                            else console.log("Supabase Profile Synced.");
                        });
                }
            }

            // 4. Flowee Trigger (Congratulate)
            if(window.Flowee) {
                setTimeout(() => window.Flowee.talk(true, `Splendid, Captain ${newName}!`, 'success'), 500);
            }
            
            // 5. CRITICAL: Complete Mission & Redirect
            // Force this regardless of localStorage state to be safe if user reset but cache lingers
            // OR simply check if we are on the initial quest page logic.
            // For now, allow re-triggering if the flag is missing OR user just wants to see it to ensure redirect works.
            
            console.log("[CaptainsLog] Checking Mission Status...");
            
            // Always run completion logic if quest not marked complete, or for debugging purposes if specifically asked
            const isComplete = localStorage.getItem('cdf_mission_identity_complete');
            
            if(!isComplete) {
                console.log("[CaptainsLog] Completing Mission: Identity Sync");
                localStorage.setItem('cdf_mission_identity_complete', 'true');
                
                try {
                    // Sound (Safe)
                    if(window.SoundEngineer && window.SoundEngineer.playSFX) {
                        try { window.SoundEngineer.playSFX('mission_complete'); } catch(e) {}
                    }
                    
                    // Award XP (Safe)
                    if(window.Helper && window.Helper.awardXP) {
                        try { window.Helper.awardXP(100, 'Identity Established'); } catch(e) {}
                    }

                    // Show Completion Modal (Direct DOM Manipulation)
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.95);';
                    overlay.innerHTML = `
                        <div style="text-align:center; animation: fadeIn 0.5s ease-out;">
                            <div style="font-size: 4rem; color: #22c55e; margin-bottom: 1rem;">check_circle</div>
                            <h2 style="font-size: 2.5rem; color: white; font-family: 'Cinzel', serif; margin-bottom: 0.5rem;">PROTOCOL COMPLETE</h2>
                            <p style="color: #d4af37; font-family: monospace; letter-spacing: 2px;">Identity Synced. Reward: +100 XP</p>
                            
                            <div style="margin-top: 2rem; padding: 1rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); border-radius: 8px;">
                                <p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase;">Next Objective</p>
                                <h3 style="font-size: 1.25rem; color: white; font-weight: bold; margin-top: 0.25rem;">THE ARTIFACT BAZAAR</h3>
                                <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">Warping in <span id="mission-timer" style="color: #d4af37; font-weight: bold;">5</span>s...</p>
                                <button onclick="const t = window.location.pathname.includes('/pages/') ? 'marketplace.html' : 'pages/marketplace.html'; window.location.href=t" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #d4af37; color: black; border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">WARP NOW</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(overlay);
                    
                    // Timer & Redirect
                    let timeLeft = 5;
                    const timerEl = overlay.querySelector('#mission-timer');
                    const interval = setInterval(() => {
                        timeLeft--;
                        if(timerEl) timerEl.innerText = timeLeft;
                        if(timeLeft <= 0) {
                            clearInterval(interval);
                            console.log("[CaptainsLog] Auto-Warping to Marketplace...");
                            const target = window.location.pathname.includes('/pages/') ? 'marketplace.html' : 'pages/marketplace.html';
                            window.location.href = target; 
                        }
                    }, 1000);
                    
                } catch (err) {
                    console.error("[CaptainsLog] CRITICAL ERROR IN MISSION COMPLETION:", err);
                    // Fallback Alert & Redirect
                    alert("IDENTITY SYNCED. Redirecting to Marketplace...");
                    const target = window.location.pathname.includes('/pages/') ? 'marketplace.html' : 'pages/marketplace.html';
                    window.location.href = target;
                }
                
                return; 
            } else {
                 console.log("[CaptainsLog] Mission already complete. Update saved.");
            }
        } else {
            console.error("[CaptainsLog] Save Failed: Missing Input Elements");
        }
    }

    renderHammer(container) {
        container.innerHTML = `
            <div class="hammer-grid">
                <div class="hammer-card" onclick="const t = window.location.pathname.includes('/pages/') ? 'marketplace-upload.html' : 'pages/marketplace-upload.html'; window.location.href=t">
                    <span class="material-symbols-outlined hammer-icon">gavel</span>
                    <h3 class="text-white font-bold">Offer Artifact</h3>
                    <p class="text-xs text-gray-400 mt-2">Upload items to the Bazaar.</p>
                </div>
                <div class="hammer-card" onclick="const t = window.location.pathname.includes('/pages/') ? 'quest-create.html' : 'pages/quest-create.html'; window.location.href=t">
                    <span class="material-symbols-outlined hammer-icon">map</span>
                    <h3 class="text-white font-bold">Chart Quest</h3>
                    <p class="text-xs text-gray-400 mt-2">Create new missions for others.</p>
                </div>
            </div>
        `;
    }
    
    renderActive(container) {
        container.innerHTML = `
            <div class="text-left space-y-4">
                <div class="p-3 bg-white/5 border-l-2 border-red-500 rounded">
                    <h4 class="text-white font-bold">Quest: The First Step</h4>
                    <p class="text-xs text-gray-400">Status: In Progress</p>
                </div>
                <div class="p-3 bg-white/5 border-l-2 border-gold rounded">
                    <h4 class="text-white font-bold">Listing: Ancient Coin</h4>
                    <p class="text-xs text-gray-400">0 Bids • 24h Remaining</p>
                </div>
            </div>
        `;
    }

    renderTreasury(container) {
        const manilla = localStorage.getItem('cdf_balance') || 0;
        container.innerHTML = `
            <div class="text-center py-8">
                <h2 class="text-4xl text-gold font-cinzel mb-2">${manilla} MANILLA</h2>
                <p class="text-sm text-gray-400">Current Balance</p>
                
                <div class="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
                    <button class="p-2 border border-white/20 rounded hover:border-gold hover:text-gold text-white text-sm">Transfer</button>
                    <button class="p-2 border border-white/20 rounded hover:border-gold hover:text-gold text-white text-sm">History</button>
                </div>
            </div>
        `;
    }

    renderSynthesize(container) {
        container.innerHTML = `
             <div class="hammer-grid">
                <div class="hammer-card" onclick="window.location.href='pages/quiz.html'">
                    <span class="material-symbols-outlined hammer-icon">psychology</span>
                    <h3 class="text-white font-bold">Take Quiz</h3>
                    <p class="text-xs text-gray-400 mt-2">Test your knowledge.</p>
                </div>
                <div class="hammer-card" onclick="window.location.href='pages/quiz_creation.html'">
                    <span class="material-symbols-outlined hammer-icon">science</span>
                    <h3 class="text-white font-bold">Forge Quiz</h3>
                    <p class="text-xs text-gray-400 mt-2">Contribute to the Archive.</p>
                </div>
            </div>
        `;
    }
} // End of CaptainsLogAgent

new CaptainsLogAgent();
