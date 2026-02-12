/**
 * Agent: The Constructor (Architect Bot)
 * Role: Generates Event Roadmaps in the Co-Op Field.
 */

class ConstructorBot {
    constructor() {
        this.name = "Constructor";
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Systems Online. Ready for Blueprinting.`);
        window.ConstructorBot = this;
    }

    renderUI(container) {
        // Inject Blueprint CSS
        if(!document.getElementById('blueprint-style')) {
            const style = document.createElement('style');
            style.id = 'blueprint-style';
            style.innerHTML = `
                .blueprint-mode {
                    background-image: 
                        linear-gradient(rgba(0, 100, 255, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 100, 255, 0.2) 1px, transparent 1px) !important;
                    background-size: 20px 20px !important;
                    background-color: #001a33 !important;
                }
                .blueprint-overlay {
                    position: fixed; inset: 0; pointer-events: none; z-index: 0;
                    background: radial-gradient(circle, transparent 20%, #001a33 90%);
                }
            `;
            document.head.appendChild(style);
        }

        container.innerHTML = `
            <div class="flex flex-col h-full relative">
                <!-- Toggle Blueprint Button -->
                <button onclick="ConstructorBot.toggleBlueprintMode()" class="absolute top-2 right-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/50 hover:bg-blue-500 hover:text-white transition-colors z-20">
                    <span class="material-symbols-outlined text-xs align-middle">grid_on</span> VIEW BLUEPRINT
                </button>

                <!-- Background Gear Animation -->
                <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <span class="material-symbols-outlined text-[300px] animate-spin-slow">settings</span>
                </div>
                <!-- ... existing header ... -->
                <div class="p-6 border-b border-white/10 flex justify-between items-center z-10">
                    <div>
                        <h3 class="text-xl font-bold text-amber">Co-Op Field</h3>
                        <div class="text-[10px] text-white/50">Architect Bot Active • Latency: 12ms</div>
                    </div>
                </div>

                <!-- Interaction Area -->
                <div class="flex-1 overflow-y-auto p-6 z-10" id="coop-display">
                    <!-- Bot Greeting -->
                    <div class="flex gap-4 mb-6">
                        <div class="w-12 h-12 rounded-lg bg-amber-900/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-amber-500">precision_manufacturing</span>
                        </div>
                        <div class="bg-black/60 border border-white/10 p-4 rounded-r-xl rounded-bl-xl max-w-lg">
                            <p class="text-sm text-white/90">Greetings, Captains. I am The Constructor.</p>
                            <p class="text-sm text-white/90 mt-2">Give me a <strong class="text-amber">Purpose</strong> (e.g., "Create an Underground Concert"), and I shall calculate the Path.</p>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-6 border-t border-white/10 bg-black/40 z-10">
                    <div class="flex gap-2">
                        <input type="text" id="coop-input" placeholder="Type your Purpose..." 
                            class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber transition-colors font-mono text-sm"
                            onkeypress="if(event.key === 'Enter') ConstructorBot.handleInput()">
                        <button onclick="ConstructorBot.handleInput()" class="bg-amber-600 hover:bg-amber-500 text-black font-bold px-6 rounded-xl transition-colors">
                            BUILD
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    toggleBlueprintMode() {
        document.body.classList.toggle('blueprint-mode');
        const isBlue = document.body.classList.contains('blueprint-mode');
        // Feedback
        if(window.Pusher) window.Pusher.showToast(isBlue ? "Blueprint Mode: ACTIVE" : "Blueprint Mode: OFF", isBlue ? 'info' : 'default');
        if(window.Helper) window.Helper.triggerHaptic('medium');
    }

    handleInput() {
        const input = document.getElementById('coop-input');
        const purpose = input.value.trim();
        if(!purpose) return;

        // User Message
        this.addMessage(purpose, 'user');
        input.value = '';

        // Bot Thinking
        this.addMessage('Analyzing Keywords...', 'bot-loading');

        setTimeout(() => {
            //Remove loading
            const loader = document.getElementById('bot-loader');
            if(loader) loader.remove();

            // Generate Roadmap
            this.generateRoadmap(purpose);
        }, 1500);
    }

    addMessage(text, type) {
        const display = document.getElementById('coop-display');
        const div = document.createElement('div');
        div.className = `flex gap-4 mb-6 ${type === 'user' ? 'flex-row-reverse' : ''}`;
        
        if(type === 'user') {
            div.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                     <span class="material-symbols-outlined text-white/50">person</span>
                </div>
                <div class="bg-electric/20 border border-electric/30 p-3 rounded-l-xl rounded-br-xl text-sm text-white">
                    ${text}
                </div>
            `;
        } else if (type === 'bot-loading') {
            div.id = 'bot-loader';
            div.innerHTML = `
                 <div class="w-12 h-12 rounded-lg bg-amber-900/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-amber-500 animate-spin">settings</span>
                </div>
                <div class="bg-black/60 border border-white/10 p-4 rounded-r-xl rounded-bl-xl text-sm text-amber-500 font-mono animate-pulse">
                    ${text}
                </div>
            `;
        }

        display.appendChild(div);
        display.scrollTop = display.scrollHeight;
    }

    generateRoadmap(purpose) {
        const keywords = purpose.toLowerCase().split(' ');
        let steps = [];
        let type = "Standard Protocol";

        if (keywords.includes('event') || keywords.includes('concert') || keywords.includes('party')) {
            steps = [
                "Define Space & Time (Virtual or Physical)",
                "Set Victory Scrap (VS) Budget",
                "Recruit Sound Masters (DJs)",
                "Draft Ticker Announcement",
                "Launch Countdown Sequence"
            ];
            type = "Event Architecture";
        } else if (keywords.includes('quest') || keywords.includes('mission')) {
            steps = [
                "Define Objective & Rewards",
                "Write Lore Description",
                "Set Difficulty & Level Gate",
                "Assets Check (Images/Audio)",
                "Submit to Quest Log"
            ];
            type = "Quest Forge";
        } else {
            steps = [
                "Brainstorming Phase",
                "Assign Roles (Captain/Specialist)",
                "Resource Check",
                "Draft Logic Flow",
                "Final Review & Sign-off"
            ];
        }

        const display = document.getElementById('coop-display');
        const roadmapHTML = `
            <div class="flex gap-4 mb-6">
                <div class="w-12 h-12 rounded-lg bg-amber-900/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-amber-500">precision_manufacturing</span>
                </div>
                <div class="w-full max-w-lg">
                    <div class="bg-black/80 border border-amber-500/50 rounded-lg overflow-hidden">
                        <div class="bg-amber-900/30 p-2 border-b border-amber-500/30 flex justify-between items-center">
                            <span class="text-[10px] text-amber uppercase tracking-widest font-bold">Blueprint: ${type}</span>
                            <span class="material-symbols-outlined text-xs text-amber">architecture</span>
                        </div>
                        <div class="p-4 space-y-3">
                            ${steps.map((step, i) => `
                                <div class="flex items-center gap-3">
                                    <div class="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-[10px] text-white/50 font-mono">${i+1}</div>
                                    <span class="text-sm text-white/80">${step}</span>
                                    <div class="ml-auto w-2 h-2 rounded-full bg-red-500 indicator" title="Pending"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="text-[10px] text-white/30 mt-2 text-center italic">
                        Ping me if the gears rust (24h inactivity check active).
                    </div>
                </div>
            </div>
        `;
        
        display.insertAdjacentHTML('beforeend', roadmapHTML);
        display.scrollTop = display.scrollHeight;
    }
}

new ConstructorBot();
