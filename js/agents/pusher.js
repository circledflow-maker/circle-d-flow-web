/**
 * Agent: Pusher (The Broadcaster)
 * Role: Handles System Notifications (Toasts), Event Broadcasting, and UI updates.
 */

class PusherAgent extends Agent {
    constructor() {
        super("Pusher");
        this.name = "Pusher";
        this.queue = [];
        this.isToastActive = false;
    }

    init() {
        console.log(`[${this.name}] Signal Amplified. Notification Systems Online.`);
        this.injectStyles();
        window.Pusher = this; // Global Access
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .pusher-toast {
                position: fixed;
                top: 2rem;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                background: rgba(20, 20, 25, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(12px) saturate(180%);
                -webkit-backdrop-filter: blur(12px) saturate(180%);
                color: rgba(255, 255, 255, 0.9);
                padding: 0.75rem 1.5rem;
                border-radius: 9999px;
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 0.85rem;
                letter-spacing: 0.05em;
                z-index: 9999;
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                pointer-events: none; /* Let clicks pass through */
            }
            .pusher-toast.show {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            .pusher-toast.type-xp { border-color: rgba(255, 215, 0, 0.5); background: rgba(255, 215, 0, 0.05); text-shadow: 0 0 10px rgba(255,215,0,0.3); }
            .pusher-toast.type-karma { border-color: rgba(168, 85, 247, 0.5); background: rgba(168, 85, 247, 0.05); }
            .pusher-toast.type-error { border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.1); color: #FCA5A5; }
            .pusher-toast.type-success { border-color: rgba(34, 197, 94, 0.5); background: rgba(34, 197, 94, 0.05); color: #86EFAC; }
        `;
        document.head.appendChild(style);
    }

    /**
     * Broadcasts an event to the internal system.
     * @param {string} eventName 
     * @param {object} data 
     */
    broadcast(eventName, data = {}) {
        console.log(`[${this.name}] Broadcasting: ${eventName}`, data);
        const event = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * Shows a UI Toast.
     * @param {string} message 
     * @param {string} type 'default' | 'xp' | 'karma' | 'success' | 'error'
     */
    showToast(message, type = 'default') {
        // Queue if busy
        if (this.isToastActive) {
            this.queue.push({ message, type });
            return;
        }

        this.isToastActive = true;
        this.renderToast(message, type);
    }

    renderToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `pusher-toast type-${type}`;
        
        let icon = 'info';
        if (type === 'xp') icon = 'bolt';
        if (type === 'karma') icon = 'auto_awesome';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'warning';

        toast.innerHTML = `
            <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1">${icon}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => toast.classList.add('show'));

        // Play Sound (Optional, silent for now)
        // this.playNotificationSound();

        // Remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                this.isToastActive = false;
                this.checkQueue();
            }, 400);
        }, 3000);
    }

    checkQueue() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.showToast(next.message, next.type);
        }
    }

    listen(event, callback) {
        window.addEventListener(event, callback);
    }

    // --- GLOBAL EFFECT HANDLERS ---
    
    handleGlobalPulse(msg) {
        // 1. Dim Screen
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 bg-black/80 z-[200] flex items-center justify-center animate-fade-in pointer-events-none";
        overlay.innerHTML = `
            <div class="text-center transform scale-150">
                <h1 class="text-4xl md:text-6xl font-black text-mystic-gold tracking-widest uppercase drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] animate-pulse">
                    ${msg}
                </h1>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // 2. Sound
        // (Optional: this.playSound('pulse_boom'))

        // 3. Remove
        setTimeout(() => {
            overlay.classList.add('opacity-0', 'transition-opacity', 'duration-1000');
            setTimeout(() => overlay.remove(), 1000);
        }, 4000);
    }

    handleLootRain(amount) {
        this.showToast(`Admin Gift: +${amount} VS Received!`, 'karma');
        // Visual FX could be added here (Canvas rain)
        // For now, simple celebration
        if(window.Flowee) window.Flowee.celebrate();
    }

    handleGlobalSound(trackId) {
        this.showToast(`🎧 DJ OVERRIDE: Dropping Beat ${trackId}`, 'xp');
        if(window.SoundEngineer) {
            // Mock track override
            console.log(`[Pusher] DJ Command: Play ${trackId}`);
        }
    }

    handleTickerUpdate(layer, msg) {
        window.dispatchEvent(new CustomEvent('TICKER_UPDATE', {
            detail: { layer, message: msg }
        }));
    }

    handleCompassBloom(category) {
        // 1. Visual Ripple
        // (Could be handled by FlowCompass, but Pusher handles global effects)
        this.showToast(`Resonance: ${category}`, 'karma');
        
        // 2. Audio Cue (Abstract)
        window.dispatchEvent(new CustomEvent('GLOBAL_SOUND_EVENT', {
            detail: { type: 'FX', id: 'bloom_open' }
        }));
    }
    handleEmergencyOverride(msg) {
        // 1. Audio Haki Alert
        this.showToast("🚨 SYSTEM OVERRIDE INITIATED 🚨", 'error');
        
        // 2. Full Screen Flash
        const flash = document.createElement('div');
        flash.className = "fixed inset-0 bg-red-500/20 z-[9998] pointer-events-none animate-pulse";
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 5000);

        // 3. Dispatch to Ticker
        window.dispatchEvent(new CustomEvent('TICKER_UPDATE', {
            detail: { layer: 'EMERGENCY', message: msg }
        }));
    }
    handleVivreResonance(user, cost) {
        // 1. Ticker Flare
        this.broadcast('TICKER_UPDATE', { layer: 'SOCIAL', message: `VOID-RESONANCE: ${user} HAS OFFERED A VIVRE CARD // SYNC COST: ${cost} EP` });
        
        // 2. Toast
        this.showToast(`Soul-Tether Offered by ${user}`, 'xp');
        
        // 3. Audio (Mock)
        console.log(`[Pusher] Playing Soul Sync Sound`);
    }
    broadcastRankUp(rank, user) {
        this.showToast(
            'workspace_premium',
            `ASCENSION: ${user} reached Floor ${rank}!`,
            'text-haki-gold'
        );
        console.log(`[${this.name}] Ascension Broadcast: ${user} -> Floor ${rank}`);
    }
}

// Extend Init to listen
const originalInit = PusherAgent.prototype.init;
PusherAgent.prototype.init = function() {
    originalInit.apply(this);
    
    // Global Listeners
    window.addEventListener('GLOBAL_UI_EVENT', (e) => {
        if(e.detail.type === 'PULSE') this.handleGlobalPulse(e.detail.msg);
        if(e.detail.type === 'TICKER') this.handleTickerUpdate(e.detail.layer, e.detail.msg);
    });

    window.addEventListener('GLOBAL_SOUND_EVENT', (e) => {
        if(e.detail.type === 'OVERRIDE') this.handleGlobalSound(e.detail.track);
    });

    window.addEventListener('ROOM_LOOT_EVENT', (e) => {
        this.handleLootRain(e.detail.amount);
    });

    window.addEventListener('SYSTEM_OVERRIDE', (e) => {
        this.handleEmergencyOverride(e.detail.message);
    });

    // NEW: Vivre Card Listener
    window.addEventListener('VIVRE_RESONANCE', (e) => {
        this.handleVivreResonance(e.detail.user, e.detail.cost);
    });

    // NEW: Quest Handler
    window.addEventListener('QUEST_COMPLETE', (e) => {
        this.handleQuestComplete(e.detail.title, e.detail.xp);
    });

};

PusherAgent.prototype.handleQuestComplete = function(title, xp) {
    this.showToast(`QUEST COMPLETE: ${title}`, 'success');
    this.showToast(`+${xp} XP Gained`, 'xp');
    // Trigger Konfetti or Sound if available
    if(window.Flowee) window.Flowee.celebrate();
};


new PusherAgent();
