/**
 * Agent: The Pusher (BridgePusher)
 * Purpose: Momentum & Flow Management.
 * "I ensure no one gets stuck at the Gates. If the path is blocked, I forge a new one."
 */

class BridgePusherAgent {
    constructor() {
        this.name = "Bridge Pusher";
        this.stagnationTimer = null;
        this.STAGNATION_LIMIT = 10000; // 10s of inaction triggers a nudge

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Monitoring Flow Momentum...`);
        this.startStagnationCheck();
        
        // Listen for User Interaction to reset timer
        ['mousemove', 'click', 'keydown'].forEach(evt => 
            document.addEventListener(evt, () => this.resetStagnation())
        );

        // Intercept Gatekeeper's Bypass if possible (by overriding the method or listening to an event)
        // Since Gatekeeper is a global, we can wrap its method once it exists.
        this.interceptGatekeeper();
    }

    startStagnationCheck() {
        this.stagnationTimer = setTimeout(() => {
            this.nudgeUser();
        }, this.STAGNATION_LIMIT);
    }

    resetStagnation() {
        clearTimeout(this.stagnationTimer);
        this.startStagnationCheck();
    }

    nudgeUser() {
        // MESH CHECK: Don't nudge if the Visual Reality is unstable
        if (window.VisualEye && window.VisualEye.status === "critical") {
            console.warn(`[${this.name}] Nudge Aborted. Visual Integrity Critical.`);
            return;
        }

        console.log(`[${this.name}] User Stagnating. Applying Nudge.`);
        // 1. Pulse the CTA
        const cta = document.querySelector('button[onclick*="openExam"]');
        if (cta) {
            cta.classList.add('animate-bounce');
            setTimeout(() => cta.classList.remove('animate-bounce'), 2000);
        }

        // 2. If Flowee exists, make him talk
        if (window.Flowee && !window.Flowee.isTalking) {
            window.Flowee.talk(true, "Don't be shy! The Kingdom awaits! ⚔️");
        }
    }

    interceptGatekeeper() {
        const checkInterval = setInterval(() => {
            if (window.Gatekeeper) {
                clearInterval(checkInterval);
                this.enhanceGatekeeper();
            }
        }, 100);
    }

    enhanceGatekeeper() {
        const originalOpenExam = window.Gatekeeper.openExam.bind(window.Gatekeeper);
        
        // Override openExam to use Pusher's Custom Bypass UI
        window.Gatekeeper.openExam = () => {
            if (window.netlifyIdentity) {
                // Try Normal Open
                window.netlifyIdentity.open();
                
                // Watch for potential CORS failure (hacky, but effective for local)
                setTimeout(() => {
                    // If modal didn't open or we are local, and user clicked...
                    if (!document.querySelector('iframe[id*="netlify-identity"]')) {
                        this.handleFailure();
                    }
                }, 1000);

            } else {
                this.handleFailure();
            }
        };
    }

    handleFailure() {
        console.warn(`[${this.name}] Auth Protocol Stalled. Initiating Override.`);
        
        // Check environment
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        if (isLocal) {
            this.showBypassModal();
        } else {
            // Production Error
            alert("Connection to The Circle is unstable. Please refresh.");
        }
    }

    showBypassModal() {
        // Create a custom styled modal instead of 'confirm'
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in';
        modal.innerHTML = `
            <div class="bg-[#191022] border border-red-500/50 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <div class="mb-4">
                    <span class="material-symbols-outlined text-5xl text-red-500 animate-pulse">lock_open_right</span>
                </div>
                <h3 class="text-2xl font-bold text-white mb-2">DEV PROTOCOL DETECTED</h3>
                <p class="text-white/60 mb-6 text-sm">Netlify Identity is not active in this local environment. <br>The Pusher can force the gates open.</p>
                
                <div class="flex gap-4">
                    <button id="pusher-bypass" class="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg uppercase tracking-wider transition-all">
                        Force Entry
                    </button>
                    <button id="pusher-cancel" class="px-4 py-3 border border-white/10 hover:bg-white/5 text-white/50 rounded-lg uppercase tracking-wider transition-all">
                        Wait
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('pusher-bypass').onclick = () => {
            modal.remove();
            window.Gatekeeper.enterCore();
        };

        document.getElementById('pusher-cancel').onclick = () => {
            modal.remove();
        };
    }
}

window.BridgePusher = new BridgePusherAgent();
