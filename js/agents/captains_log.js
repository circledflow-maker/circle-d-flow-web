/**
 * Agent: CaptainsLog (The Unified Dossier)
 * Purpose: Manages the Central Profile Interface (Core Click).
 * Features: Tabs for Log, Hammer, Active, Treasury, Synthesize.
 */
class CaptainsLogAgent {
    constructor() {
        this.name = "CaptainsLog";
        this.activeTab = 'log';
        this.init();
    }

    init() {
        console.log(`[${this.name}] Initializing Dossier Protocol...`);
        this.injectStyles();
        window.CaptainsLog = this;
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
            avatar: "Assets/images/avatars/avatar_1.png"
        };
        
        container.innerHTML = `
            <div class="vessel-grid">
                <div class="vessel-avatar-card">
                    <img src="${user.avatar}" class="vessel-avatar">
                    <h3 class="text-xl text-white font-cinzel">${user.name}</h3>
                    <p class="text-sm text-gold">${user.rank}</p>
                </div>
                <div class="vessel-stats">
                    <h4 class="text-lg text-white mb-4 border-b border-white/10 pb-2">Ship Statistics</h4>
                    <div class="vessel-stat-row"><span>Total XP</span> <span>${user.xp}</span></div>
                    <div class="vessel-stat-row"><span>Missions Completed</span> <span>${localStorage.getItem('cdf_quests_completed') || 0}</span></div>
                    <div class="vessel-stat-row"><span>Artifacts Found</span> <span>${localStorage.getItem('cdf_artifacts_found') || 0}</span></div>
                    <div class="mt-6">
                        <button onclick="window.location.href='profile.html'" class="w-full bg-white/10 hover:bg-gold hover:text-black py-2 rounded transition font-bold font-mono">EDIT FULL PROFILE</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderHammer(container) {
        container.innerHTML = `
            <div class="hammer-grid">
                <div class="hammer-card" onclick="window.location.href='marketplace-upload.html'">
                    <span class="material-symbols-outlined hammer-icon">gavel</span>
                    <h3 class="text-white font-bold">Offer Artifact</h3>
                    <p class="text-xs text-gray-400 mt-2">Upload items to the Bazaar.</p>
                </div>
                <div class="hammer-card" onclick="window.location.href='quest-create.html'">
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
}

new CaptainsLogAgent();
