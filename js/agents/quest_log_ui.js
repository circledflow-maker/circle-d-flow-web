/**
 * Agent: Quest Log UI (The Chronicle)
 * Purpose: Renders the active quests in the Dashboard West Quadrant.
 */

class QuestLogUI {
    constructor() {
        this.containerId = 'quest-log-container';
        this.STORAGE_LOG = 'cdf_quest_log';
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log("[QuestLogUI] Chronicle Initialized.");
        this.injectContainer(); // Ensure container exists in West Quadrant
        this.renderDailyQuests(); // Generate dailies if missing
        this.render();
        
        // Listen for updates
        if(window.Pusher) {
            window.Pusher.listen('QUEST_ADDED', () => this.render());
            // window.Pusher.listen('QUEST_UPDATED', () => this.render());
        }
    }

    injectContainer() {
        const sector = document.getElementById('sector-colosseum');
        if (sector && !document.getElementById(this.containerId)) {
            // Clear existing static placeholder text if needed
            // sector.innerHTML = ''; 
            
            const container = document.createElement('div');
            container.id = this.containerId;
            container.className = "w-full h-full overflow-y-auto custom-scrollbar pr-2 space-y-2 pointer-events-auto";
            
            // Append to sector (overwrite or append?)
            // For now, let's append but style it to fit
            const existingTitle = sector.querySelector('h3') || sector.querySelector('.flex');
            
            // Keep title, clear rest
            while(sector.children.length > 1) {
                if(sector.lastChild !== existingTitle) sector.removeChild(sector.lastChild);
            }
            
            sector.appendChild(container);
        }
    }

    renderDailyQuests() {
        // 1. Ensure Tutorial Quest Exists (if not done)
        const log = JSON.parse(localStorage.getItem(this.STORAGE_LOG) || '[]');
        const hasTutorialQuest = log.find(q => q.id === 'Q-INIT-001');
        
        if (!localStorage.getItem('cdf_tour_done') && !hasTutorialQuest) {
            log.unshift({
                title: "System Synchronization",
                desc: "Complete the connection protocol to sync with Apex.",
                xp: 100,
                type: "SYSTEM",
                id: "Q-INIT-001",
                status: "OPEN",
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(this.STORAGE_LOG, JSON.stringify(log));
        }

        // 2. Daily Rotation
        const today = new Date().toDateString();
        const lastGen = localStorage.getItem('cdf_daily_gen_date');
        
        if (lastGen !== today) {
            console.log("[QuestLogUI] Generating Daily Quests...");
            
            const dailies = [
                { title: "Daily Login", desc: "Access the Command Center", xp: 50, type: "SYSTEM", id: "D-LOGIN" },
                { title: "Artifact Scout", desc: "Visit the Bazaar", xp: 50, type: "SYSTEM", id: "D-VISIT-BAZAAR" },
                { title: "Vote in Battle", desc: "Cast a vote in the Colosseum", xp: 100, type: "SYSTEM", id: "D-VOTE" }
            ];

            // Add new dailies ensuring no ID clash
            dailies.forEach(d => {
                const uniqueId = d.id + '-' + Date.now();
                log.push({
                    ...d,
                    id: uniqueId,
                    status: 'OPEN',
                    timestamp: new Date().toISOString()
                });
            });

            localStorage.setItem(this.STORAGE_LOG, JSON.stringify(log));
            localStorage.setItem('cdf_daily_gen_date', today);
        }
    }

    render() {
        const container = document.getElementById(this.containerId);
        if(!container) return; // Wait for injection or DOM
        
        const log = JSON.parse(localStorage.getItem(this.STORAGE_LOG) || '[]');
        // Filter OPEN quests, Limit to 3 for the "Widget" view
        // Prioritize Q-INIT-001 if exists
        const activeQuests = log.filter(q => q.status === 'OPEN').sort((a,b) => (a.id === 'Q-INIT-001' ? -1 : 1)).slice(0, 3);

        if(activeQuests.length === 0) {
            container.innerHTML = `<div class="text-[10px] text-white/30 italic text-center mt-4">No Active Quests. Rest, Hunter.</div>`;
            return;
        }

        container.innerHTML = activeQuests.map(q => `
            <div class="bg-white/5 border border-white/10 rounded p-2 flex justify-between items-center group hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer" id="quest-${q.id}">
                <div class="flex-1 overflow-hidden">
                    <h4 class="text-[10px] font-bold text-white truncate">${q.title}</h4>
                    <p class="text-[9px] text-white/50 truncate">${q.desc}</p>
                </div>
                <div class="flex flex-col items-end gap-1 ml-2">
                    <span class="text-[9px] font-mono text-mystic-gold bg-mystic-gold/10 px-1 rounded">${q.xp} XP</span>
                    <button onclick="window.QuestLogUI.complete('${q.id}', ${q.xp})" class="text-[8px] uppercase font-bold text-green-400 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                        [DONE]
                    </button>
                </div>
            </div>
        `).join('');
    }

    complete(id, xp) {
        // Prevent double-clicks
        const btn = document.querySelector(`#quest-${id} button`);
        if(btn) btn.disabled = true;

        // Visual Feedback (Fade Out)
        const questEl = document.getElementById(`quest-${id}`);
        if(questEl) {
            questEl.classList.add('opacity-0', 'scale-95', 'translate-x-4');
            questEl.style.transition = 'all 0.5s ease-out';
        }

        // Delay logic update to allow animation
        setTimeout(() => {
            // Update Status
            const log = JSON.parse(localStorage.getItem(this.STORAGE_LOG) || '[]');
            const questIndex = log.findIndex(q => q.id === id);
            
            if(questIndex !== -1) {
                log[questIndex].status = 'COMPLETED';
                localStorage.setItem(this.STORAGE_LOG, JSON.stringify(log));
                
                // Give Rewards
                if(window.Resonance) window.Resonance.addXP(xp);
                
                // Visual Feedback
                if(window.Pusher) window.Pusher.showToast(`Quest Complete! +${xp} XP`, 'success');
                
                // Re-render
                this.render();

                // DISPATCH EVENT FOR FLOWEE (Tutorial Handshake)
                // Ensure detail structure matches Flowee's expectation: e.detail.id
                console.log(`[QuestLogUI] Dispatching Completion Event for ${id}`);
                const event = new CustomEvent('cdf-quest-complete', { 
                    detail: { id: id },
                    bubbles: true,
                    composed: true
                });
                window.dispatchEvent(event);
            }
        }, 600); // 600ms delay matches/exceeds CSS transition
    }
}

// Global & Init
window.QuestLogUI = new QuestLogUI();
