/**
 * Agent: The Root (Admin Ghost Layer)
 * Access: Ctrl + Shift + F
 * Purpose: Real-time world manipulation, content injection, and system overrides.
 */

class AdminRootAgent {
    constructor() {
        this.name = "The Root";
        this.active = false;
        this.blueprintMode = false;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // key listener
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                this.toggleRootAccess();
            }
        });

        // Footer Secret trigger (Triple Click)
        const footer = document.querySelector('footer');
        if(footer) {
            footer.addEventListener('click', (e) => {
                if(e.detail === 3) this.toggleRootAccess();
            });
        }
    }

    toggleRootAccess() {
        this.active = !this.active;
        if(this.active) {
            this.renderOverlay();
            document.body.classList.add('root-access-active');
            console.log(`[${this.name}] Root Access Granted. The Matrix is open.`);
            if(window.Flowee) window.Flowee.talk(true, "Captain on Deck! Root Access initialized.");
        } else {
            this.removeOverlay();
            document.body.classList.remove('root-access-active');
            console.log(`[${this.name}] Root Access Closed.`);
        }
    }

    renderOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'admin-root-overlay';
        overlay.className = "fixed inset-0 z-[9999] pointer-events-none";
        overlay.innerHTML = `
            <!-- HUD Border -->
            <div class="absolute inset-0 border-4 border-red-500/30 rounded-lg animate-pulse-slow"></div>
            
            <!-- Blueprint Grid -->
            <div class="absolute inset-0 bg-[url('https://pub-24ba376bfccb446996666eaff4dbae12.r2.dev/grid.png')] opacity-10"></div>

            <!-- Top Bar -->
            <div class="absolute top-0 w-full bg-red-900/80 backdrop-blur-md text-white p-2 flex justify-between items-center pointer-events-auto border-b border-red-500">
                <div class="flex items-center gap-4 font-mono text-xs">
                    <span class="text-red-400 font-bold">ROOT ACCESS // SUPERUSER</span>
                    <span class="text-white/50">Memory: ${Math.round(performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0)}MB</span>
                    <span class="text-white/50">DOM Nodes: ${document.querySelectorAll('*').length}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.AdminRoot.toggleBlueprint()" class="px-3 py-1 bg-black/50 hover:bg-red-500/20 border border-red-500/50 rounded text-xs font-mono uppercase transition-colors">
                        Blueprint Mode
                    </button>
                    <button onclick="window.AdminRoot.syncWorld()" class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-mono uppercase font-bold animate-pulse">
                        [SYNC WORLD]
                    </button>
                    <button onclick="window.AdminRoot.toggleRootAccess()" class="px-3 py-1 bg-black hover:text-red-500 text-white rounded text-xs font-mono uppercase">
                        X
                    </button>
                </div>
            </div>

            <!-- Floating Editor (Hidden by default) -->
            <div id="root-editor" class="absolute bottom-20 right-8 w-80 bg-black/90 border border-red-500 rounded-xl p-4 hidden pointer-events-auto shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                <h3 class="text-red-500 font-mono text-xs font-bold mb-2 uppercase">Content Siphon</h3>
                <textarea id="root-edit-input" class="w-full h-32 bg-white/5 border border-white/10 rounded p-2 text-xs text-white font-mono mb-2 focus:outline-none focus:border-red-500"></textarea>
                <button onclick="window.AdminRoot.saveEdit()" class="w-full py-2 bg-red-900/50 hover:bg-red-900 border border-red-500/30 text-red-100 text-xs font-bold uppercase rounded">
                    Inject Update
                </button>
            </div>
            
            <!-- Feedback Hub (The Glitch) -->
            <div class="absolute bottom-8 left-8 pointer-events-auto">
                <div class="flex items-center gap-2 bg-black/80 border border-green-500/30 rounded-full px-4 py-2">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-[10px] font-mono text-green-400">FEEDBACK SIPHON ACTIVE</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Inject Styles for Blueprint Mode
        const style = document.createElement('style');
        style.id = 'root-styles';
        style.textContent = `
            .blueprint-active * {
                outline: 1px dashed rgba(239, 68, 68, 0.3) !important;
                cursor: crosshair !important;
            }
            .blueprint-active *:hover {
                outline: 1px solid rgba(239, 68, 68, 0.8) !important;
                background: rgba(239, 68, 68, 0.1) !important;
            }
            .root-access-active {
                border: 2px solid #ef4444;
            }
        `;
        document.head.appendChild(style);
    }

    removeOverlay() {
        const overlay = document.getElementById('admin-root-overlay');
        if(overlay) overlay.remove();
        const style = document.getElementById('root-styles');
        if(style) style.remove();
        this.blueprintMode = false;
        document.body.classList.remove('blueprint-active');
    }

    toggleBlueprint() {
        this.blueprintMode = !this.blueprintMode;
        if(this.blueprintMode) {
            document.body.classList.add('blueprint-active');
            // Attach listeners to everything
            this.attachInspectors();
        } else {
            document.body.classList.remove('blueprint-active');
            this.detachInspectors();
        }
    }

    attachInspectors() {
        this.clickHandler = (e) => {
            if(!this.blueprintMode) return;
            if(e.target.closest('#admin-root-overlay')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            this.selectElement(e.target);
        };
        document.addEventListener('click', this.clickHandler, true);
    }

    detachInspectors() {
        if(this.clickHandler) document.removeEventListener('click', this.clickHandler, true);
    }

    selectElement(el) {
        this.selectedEl = el;
        const editor = document.getElementById('root-editor');
        const input = document.getElementById('root-edit-input');
        
        if(editor && input) {
            editor.classList.remove('hidden');
            input.value = el.innerText || el.innerHTML; // Simple content edit
            // Highlight
            el.style.outline = "2px solid #ef4444";
        }
    }
    
    saveEdit() {
        if(this.selectedEl) {
            const input = document.getElementById('root-edit-input');
            this.selectedEl.innerText = input.value; // For safety, text only for now or HTML if trusted
            // In a real app, this would send to backend
            console.log(`[${this.name}] Content Edited:`, input.value);
            
            // Animation
            this.selectedEl.classList.add('animate-pulse');
            setTimeout(() => this.selectedEl.classList.remove('animate-pulse'), 1000);
            
            document.getElementById('root-editor').classList.add('hidden');
        }
    }

    syncWorld() {
        alert("⚠️ GLOBAL SYNC INITIATED ⚠️\n\nPushing updates to all connected nodes...");
        // Simulation
        setTimeout(() => {
            if(window.Flowee) window.Flowee.talk(true, "The Architects have shifted the reality. New Quests detected!");
            window.dispatchEvent(new CustomEvent('cdf-global-sync', { detail: { timestamp: Date.now() } }));
        }, 1500);
    }

    // --- GAMIFICATION OVERRIDES ---
    giveKarma(amount) {
        if(window.Gamification) {
            window.Gamification.Karma.addKarma(amount);
            console.log(`[Root] +${amount} Karma injected.`);
            if(window.Flowee) window.Flowee.talk(true, `Divine Intervention! You received ${amount} Karma.`);
        }
    }

    giveXP(amount) {
        if(window.Gamification) {
            window.Gamification.Karma.addXP(amount);
            console.log(`[Root] +${amount} XP injected.`);
             if(window.Flowee) window.Flowee.talk(true, `Knowledge Download! You gained ${amount} XP.`);
        }
    }
}

// Init
window.AdminRoot = new AdminRootAgent();
