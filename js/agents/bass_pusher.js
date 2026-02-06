/**
 * Agent: Bass Pusher (The Announcer)
 * Purpose: Global announcements, Ticker updates, Hype generation.
 */
class BassPusherAgent {
    constructor() {
        this.name = "Bass Pusher";
        
        // Listen for internal events
        document.addEventListener('agent-alert', (e) => this.handleAlert(e.detail));
        
        // Init Ticker (if present)
        this.initTicker();
    }

    initTicker() {
        // In the future, this could hook into a global marquee/ticker element
        console.log(`[${this.name}] Monitoring frequencies...`);
    }

    handleAlert(detail) {
        // If another agent speaks, maybe echo or hype it up
        if(detail.agent === 'SoundEngineer' && detail.message.includes('AURA DETECTED')) {
            console.log(`[${this.name}] ⚠️ ENERGY SPIKE CONFIRMED!`);
        }
        
        if(detail.message.includes('NEW DATA UPLOADED')) {
             this.announce(`🚨 NEW CHALLENGER DETECTED: ${detail.message.split(': ')[1]} 🚨`);
        }
    }

    announce(msg) {
        console.log(`[${this.name}] BROADCAST: ${msg}`);
        // Visual Feedback (Toast)
        const toast = document.createElement('div');
        toast.className = "fixed top-24 right-0 bg-red-600 text-white font-black italic px-8 py-2 transform skew-x-12 z-[200] animate-slide-in-right shadow-[0_0_20px_#ef4444]";
        toast.innerText = msg;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 5000);
    }
}

window.BassPusher = new BassPusherAgent();
