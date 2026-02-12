/**
 * Agent: Quest Maker Bot (The Architect)
 * Purpose: Allows community members to create User-Generated Quests & Knowledge Base Entries.
 * Design: "The Navigator's Scroll" (Parchment/Pirate Style)
 */

class QuestMakerBot {
    constructor() {
        this.name = "QuestBot";
        this.STORAGE_LOG = "cdf_quest_log";
        this.STORAGE_KB = "cdf_knowledge_base";
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Global Access
        window.QuestBot = this;
        // Listen for "Quest Maker" trigger events
        window.openQuestMaker = () => this.openInterface();
        this.injectStyles();
        console.log(`[${this.name}] Systems Online. Parchment Protocol Active.`);
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* Parchment Modal Animation */
            @keyframes unroll {
                0% { height: 0; opacity: 0; transform: translateY(-50px) scaleX(0.1); }
                40% { height: 600px; opacity: 1; transform: translateY(0) scaleX(0.1); }
                100% { transform: scaleX(1); }
            }
            .parchment-scroll {
                background: #f4e4bc url('https://www.transparenttextures.com/patterns/aged-paper.png');
                box-shadow: 
                    inset 0 0 80px rgba(0,0,0,0.5), 
                    0 0 20px rgba(0,0,0,0.8),
                    0 0 0 10px rgba(255,255,255,0.05);
                border-radius: 4px;
                color: #3e2723;
                font-family: 'Cormorant Garamond', serif;
                position: relative;
            }
            .parchment-scroll::before, .parchment-scroll::after {
                content: '';
                position: absolute;
                left: 0; right: 0; height: 30px;
                background: #d7c496;
                box-shadow: 0 5px 10px rgba(0,0,0,0.3);
                z-index: 10;
            }
            .parchment-scroll::before { top: -15px; border-radius: 50% / 10px; }
            .parchment-scroll::after { bottom: -15px; border-radius: 50% / 10px; }
            
            .wax-seal {
                box-shadow: 0 4px 6px rgba(0,0,0,0.4), inset 0 2px 5px rgba(255,255,255,0.3);
                background: radial-gradient(circle at 30% 30%, #ff4d4d, #990000);
            }
            .wax-seal:hover { transform: scale(1.05); }
            .wax-seal:active { transform: scale(0.95); body { cursor: wait; } }

            /* Reward Selection */
            .qm-reward-btn.selected {
                background-color: #fff;
                border-color: #8A2BE2;
                box-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
                opacity: 1 !important;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
    }

    openInterface() {
        let dialog = document.getElementById('quest-maker-scroll');
        if (!dialog) {
            this.createInterface();
            dialog = document.getElementById('quest-maker-scroll');
        }
        dialog.showModal();
        
        // Default to Active Mode
        this.switchMode('ACTIVE');
    }

    switchMode(mode) {
        this.mode = mode; // ACTIVE or KNOWLEDGE
        
        // Visual Toggles
        const tabActive = document.getElementById('tab-active');
        const tabKb = document.getElementById('tab-kb');
        const rewardContainer = document.getElementById('qm-reward-container');
        const sourceContainer = document.getElementById('qm-source-container');
        const titleInput = document.getElementById('qm-title');
        const submitBtn = document.querySelector('#quest-maker-scroll button[onclick*="publish"]'); // We need to add this button ID or selector handling

        if(mode === 'ACTIVE') {
            tabActive.style.borderColor = '#8A2BE2';
            tabActive.style.color = '#8A2BE2';
            tabKb.style.borderColor = 'transparent';
            tabKb.style.color = '#3e2723';
            
            rewardContainer.classList.remove('hidden');
            sourceContainer.classList.add('hidden');
            titleInput.placeholder = "e.g. The Secret of the Beat";
        } else {
            tabActive.style.borderColor = 'transparent';
            tabActive.style.color = '#3e2723';
            tabKb.style.borderColor = '#8A2BE2';
            tabKb.style.color = '#8A2BE2';
            
            rewardContainer.classList.add('hidden');
            sourceContainer.classList.remove('hidden');
            titleInput.placeholder = "e.g. History of the First Circle";
        }
    }

    selectReward(amount, btn) {
        this.selectedReward = amount;
        document.querySelectorAll('.qm-reward-btn').forEach(b => {
            b.classList.remove('selected');
            b.style.opacity = '0.5';
        });
        btn.classList.add('selected');
        btn.style.opacity = '1';
    }

    createInterface() {
        const dialog = document.createElement('dialog');
        dialog.id = 'quest-maker-scroll';
        dialog.className = "bg-transparent p-0 backdrop:bg-black/90 backdrop:backdrop-blur-md";
        
        dialog.innerHTML = `
            <div class="w-[900px] h-[700px] flex items-center justify-center animate-[unroll_0.8s_ease-out_forwards]">
                <div class="parchment-scroll w-full h-full p-12 flex flex-col relative">
                    
                    <!-- Close Button (X) -->
                    <button onclick="document.getElementById('quest-maker-scroll').close()" class="absolute top-4 right-6 text-2xl opacity-50 hover:opacity-100 font-bold z-20">✕</button>

                    <!-- HEADER -->
                    <div class="text-center mb-8 border-b-2 border-[#3e2723]/20 pb-4">
                        <h2 class="text-4xl font-bold uppercase tracking-widest text-[#5d4037]">Navigator's Log</h2>
                        <p class="text-sm italic opacity-70 mt-1">"Record your deeds, or chart a new course."</p>
                    </div>

                    <!-- TABS (Mode Switch) -->
                    <div class="flex justify-center gap-8 mb-6">
                        <button onclick="window.QuestBot.switchMode('ACTIVE')" id="tab-active" class="text-lg font-bold border-b-2 border-[#8A2BE2] text-[#8A2BE2] px-4 py-1 transition-all">Active Quest</button>
                        <button onclick="window.QuestBot.switchMode('KNOWLEDGE')" id="tab-kb" class="text-lg font-bold border-b-2 border-transparent text-[#3e2723]/50 hover:text-[#3e2723] px-4 py-1 transition-all">Knowledge Base</button>
                    </div>

                    <!-- FORM CONTAINER -->
                    <div class="flex-1 flex gap-8 overflow-hidden relative">
                        
                        <!-- LEFT: INPUTS -->
                        <div class="w-1/2 flex flex-col gap-4">
                            <!-- Title -->
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Entry Title</label>
                                <input type="text" id="qm-title" class="w-full bg-[#3e2723]/5 border-b border-[#3e2723]/30 p-2 font-serif text-xl focus:outline-none focus:border-[#8A2BE2] placeholder-[#3e2723]/30" placeholder="e.g. The Secret of the Beat">
                            </div>

                            <!-- Description -->
                            <div class="flex-1">
                                <label class="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Description / Instructions</label>
                                <textarea id="qm-desc" class="w-full h-full bg-[#3e2723]/5 border border-[#3e2723]/10 p-3 italic focus:outline-none resize-none custom-scrollbar" placeholder="Describe the task or the knowledge..."></textarea>
                            </div>

                            <!-- Source (Hidden by default) -->
                            <div id="qm-source-container" class="hidden">
                                <label class="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Source / Origin</label>
                                <input type="text" id="qm-source" class="w-full bg-[#3e2723]/5 border-b border-[#3e2723]/30 p-2 text-sm" placeholder="URL or Original Author">
                            </div>
                        </div>

                        <!-- RIGHT: REWARD & VISUALS -->
                        <div class="w-1/2 flex flex-col gap-6 pl-8 border-l border-[#3e2723]/10">
                            
                            <!-- Reward Selection (Active Only) -->
                            <div id="qm-reward-container">
                                <label class="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Bounty (Reward)</label>
                                <div class="grid grid-cols-3 gap-2">
                                    <button onclick="window.QuestBot.selectReward(150, this)" class="qm-reward-btn selected p-2 border border-[#3e2723]/20 rounded bg-[#fff8e1] hover:bg-white text-center transition-all">
                                        <div class="text-xl">📦</div>
                                        <div class="text-xs font-bold mt-1">150 XP</div>
                                    </button>
                                    <button onclick="window.QuestBot.selectReward(400, this)" class="qm-reward-btn p-2 border border-[#3e2723]/20 rounded bg-[#fff8e1] hover:bg-white text-center transition-all opacity-50">
                                        <div class="text-xl">💰</div>
                                        <div class="text-xs font-bold mt-1">400 XP</div>
                                    </button>
                                    <button onclick="window.QuestBot.selectReward(800, this)" class="qm-reward-btn p-2 border border-[#3e2723]/20 rounded bg-[#fff8e1] hover:bg-white text-center transition-all opacity-50">
                                        <div class="text-xl">🏆</div>
                                        <div class="text-xs font-bold mt-1">800 XP</div>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Image Upload (Real) -->
                            <div class="flex-1 flex flex-col">
                                <label class="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Visual Evidence (+50 XP)</label>
                                <input type="file" id="qm-file-input" class="hidden" accept="image/*" onchange="window.QuestBot.handleImageUpload(this)">
                                <div id="qm-dropzone" class="flex-1 border-2 border-dashed border-[#3e2723]/20 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-[#3e2723]/5 transition-colors" onclick="document.getElementById('qm-file-input').click()">
                                    <span class="material-symbols-outlined text-4xl opacity-30" id="qm-preview-icon">add_a_photo</span>
                                    <span class="text-xs mt-2 opacity-50" id="qm-preview-text">Stamp Image Here</span>
                                    <img id="qm-preview-img" class="hidden w-full h-full object-cover opacity-80" />
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- FOOTER: SEAL BUTTON -->
                    <div class="h-20 flex justify-center items-center mt-6 relative">
                        <button onclick="window.QuestBot.publish()" class="wax-seal w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase tracking-widest transform transition-transform z-20">
                            SEAL
                        </button>
                        <div class="absolute w-full h-[1px] bg-[#3e2723]/20"></div>
                    </div>

                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.currentMode = 'ACTIVE';
        this.selectedReward = 150;
        return dialog;
    }

    // ... (switchMode kept same) ...

    selectReward(amount, btnElement) {
        this.selectedReward = amount;
        
        // Remove 'selected' from all
        document.querySelectorAll('.qm-reward-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.classList.add('opacity-50');
        });

        // Add to clicked
        if(btnElement) {
            btnElement.classList.add('selected');
            btnElement.classList.remove('opacity-50');
        } else {
             // Fallback find by amount logic if needed, but 'this' works best
        }
    }

    handleImageUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('qm-preview-img');
                const icon = document.getElementById('qm-preview-icon');
                const text = document.getElementById('qm-preview-text');
                
                img.src = e.target.result;
                img.classList.remove('hidden');
                icon.classList.add('hidden');
                text.classList.add('hidden');
                
                // Store base64 for publishing
                this.pendingImage = e.target.result;
                window.Pusher.showToast("Image Stamped!", "success");
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    publish() {
        const title = document.getElementById('qm-title').value;
        const desc = document.getElementById('qm-desc').value;

        if(!title || !desc) {
            if(window.Pusher) window.Pusher.showToast("The Scroll is incomplete.", "error");
            return;
        }

        // Logic Switch
        if(this.currentMode === 'ACTIVE') {
            this.publishQuest(title, desc);
        } else {
            this.publishKnowledge(title, desc);
        }

        // Close
        const modal = document.getElementById('quest-maker-scroll');
        if(modal) modal.close();
    }

    publishQuest(title, desc) {
        const newQuest = {
            id: 'Q-USER-' + Date.now(),
            title: title,
            desc: desc,
            xp: this.selectedReward,
            karma: 0, 
            type: 'USER',
            author: localStorage.getItem('cdf_user_username') || 'Unknown',
            status: 'OPEN',
            image: this.pendingImage || null,
            timestamp: new Date().toISOString()
        };

        const log = JSON.parse(localStorage.getItem(this.STORAGE_LOG) || '[]');
        log.push(newQuest);
        localStorage.setItem(this.STORAGE_LOG, JSON.stringify(log));

        // Grant Creation Reward immediately
        if(window.Resonance) {
             window.Resonance.addXP(50); // Creation Bonus
             // If image was added, extra 50
             if(this.pendingImage) window.Resonance.addXP(50);
        }

        if(window.Pusher) window.Pusher.showToast(`Quest Published: ${title}`, "success");

        // Dispatch Event for Flowee
        const event = new CustomEvent('cdf-quest-created', { 
            detail: { id: newQuest.id, title: title },
            bubbles: true, 
            composed: true 
        });
        window.dispatchEvent(event);

        // Direct Flowee Interaction
        if(window.Flowee) {
             const xpGained = (this.selectedReward || 0) + (this.pendingImage ? 50 : 0);
             window.Flowee.talk(true, `Glorious! Quest **"${title}"** is live. You've earned **${xpGained} XP**. Shall we continue your training?`, null);
        }

        console.log(`[QuestBot] Dispatching cdf-quest-created: ${title}`);
        
        // Reset Visuals
        this.pendingImage = null;
    }

    publishKnowledge(title, desc) {
        const entry = {
            id: 'KB-' + Date.now(),
            title: title,
            desc: desc,
            source: document.getElementById('qm-source').value,
            author: localStorage.getItem('cdf_user_username') || 'Unknown',
            votes: 0,
            status: 'PENDING' // Needs validation
        };

        const kb = JSON.parse(localStorage.getItem(this.STORAGE_KB) || '[]');
        kb.push(entry);
        localStorage.setItem(this.STORAGE_KB, JSON.stringify(kb));

        // Reward for contributing knowledge
        if(window.Resonance) window.Resonance.addXP(300);

        window.Pusher.showToast("Knowledge Siphoned to the Core. +300 XP", "success");
    }
}
    // ... (rest of class)


// Initialize QuestBot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.QuestBot = new QuestMakerBot();
    });
} else {
    window.QuestBot = new QuestMakerBot();
}
