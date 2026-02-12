/**
 * Agent: TutorialCore (The Ghost-Run Simulation)
 * Purpose: Manages the "Ghost-Run" Beta Test state, simulating backend persistence (XP, Badges)
 *          and orchestrating the "Path of the Initiate" tutorial.
 */

class TutorialCoreAgent {
    constructor() {
        this.name = "TutorialCore";
        this.isSimulation = true; // Flag for other agents
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Initializing Beta Simulation Protocol...`);
        this.injectStyles();
        
        // Expose Global Tools
        window.Simulation = {
            addXP: (amt) => this.simulateXPGain(amt),
            unlockBadge: (id) => this.unlockBadge(id),
            reset: () => this.resetNavigatorProgress(),
            downloadLog: () => this.downloadLog(),
            ticker: (msg, type) => this.pushTickerMessage(msg, type)
        };

        // Check Badge State on Load
        this.refreshBadgeState();
        this.refreshXPState();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* XP GLOW */
            .xp-pulse-glow {
                box-shadow: 0 0 20px #FFD700;
                filter: brightness(1.5);
                transition: all 0.3s ease-in-out;
            }

            /* BADGE MANIFESTATION */
            .badge-unlock-animation {
                animation: badgePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                filter: none !important;
                opacity: 1 !important;
                border-color: #FFD700 !important;
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
            }

            @keyframes badgePop {
                0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                70% { transform: scale(1.2) rotate(10deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }

            /* TICKER GLITCH */
            .ticker-glitch {
                animation: glitch-text 0.3s infinite;
                color: #EF4444 !important;
                text-shadow: 2px 0 #fff, -2px 0 #000;
            }
            
            @keyframes glitch-text {
                0% { transform: translate(0) }
                20% { transform: translate(-2px, 2px) }
                40% { transform: translate(-2px, -2px) }
                60% { transform: translate(2px, 2px) }
                80% { transform: translate(2px, -2px) }
                100% { transform: translate(0) }
            }
        `;
        document.head.appendChild(style);
    }

    // --- SIMULATION LOGIC ---

    simulateXPGain(amount) {
        let currentXP = parseInt(localStorage.getItem('cdf_xp')) || 0; // consistent key
        currentXP += amount;
        localStorage.setItem('cdf_xp', currentXP);

        // UI Update
        const xpDisplays = document.querySelectorAll('.xp-number, #profile-xp-display');
        xpDisplays.forEach(el => el.innerText = currentXP);

        // Bar Animation
        const xpBar = document.querySelector('.xp-bar-fill');
        if(xpBar) {
            // Mock Level Cap 1000
            const percent = (currentXP % 1000) / 10;
            xpBar.style.width = `${percent}%`;
            xpBar.classList.add('xp-pulse-glow');
            setTimeout(() => xpBar.classList.remove('xp-pulse-glow'), 1000);
        }

        // Ticker Feedback
        this.pushTickerMessage(`SYSTEM: +${amount} XP ACCUMULATED`, 'xp');
        
        // Log
        console.log(`[Simulation] XP Gained: ${amount}. Total: ${currentXP}`);
    }
    
    refreshXPState() {
        const currentXP = parseInt(localStorage.getItem('cdf_xp')) || 0;
         const xpDisplays = document.querySelectorAll('.xp-number, #profile-xp-display');
        xpDisplays.forEach(el => el.innerText = currentXP);
    }

    unlockBadge(badgeId) {
        let unlockedBadges = JSON.parse(localStorage.getItem('unlocked_badges')) || [];
        if (!unlockedBadges.includes(badgeId)) {
            unlockedBadges.push(badgeId);
            localStorage.setItem('unlocked_badges', JSON.stringify(unlockedBadges));
            
            // Notification
            if(window.Pusher) window.Pusher.showToast(`BADGE UNLOCKED: ${badgeId}`, 'success');
        }

        // Trigger Animation (if element exists on page)
        const badgeElement = document.getElementById(badgeId);
        if(badgeElement) {
            badgeElement.classList.remove('grayscale', 'opacity-30'); 
            badgeElement.classList.add('badge-unlock-animation');
            
            // SFX
            // const sfx = new Audio('../Assets/sounds/badge_unlock.mp3'); // path check necessary
            // sfx.play().catch(e => {}); 
        }
    }

    refreshBadgeState() {
        const unlockedBadges = JSON.parse(localStorage.getItem('unlocked_badges')) || [];
        unlockedBadges.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.classList.remove('grayscale', 'opacity-30');
                el.classList.add('opacity-100');
                el.style.filter = 'none';
            }
        });
    }

    pushTickerMessage(message, type = 'info') {
        // Try to update standard Ticker
        const ticker = document.getElementById('unified-ticker-text');
        if(ticker) {
             if(type === 'alert' || type === 'error') ticker.classList.add('ticker-glitch');
             
             // Flash Text
             const original = ticker.innerText;
             ticker.innerText = message;
             
             if(type === 'xp') ticker.style.color = '#FFD700';
             else if(type === 'success') ticker.style.color = '#22C55E';
             else if(type === 'error') ticker.style.color = '#EF4444';
             
             setTimeout(() => {
                 ticker.classList.remove('ticker-glitch');
                 // Revert or Keep? Usually Ticker is a stream. 
                 // We'll leave it for the Ticker Agent to overwrite later, 
                 // or revert if it was a quick alert.
                 // For now, let it stick until next update.
                 ticker.style.color = ''; 
             }, 3000);
        } else {
            // Fallback via Pusher Toast if Ticker missing
            if(window.Pusher) window.Pusher.showToast(message, type);
        }
    }

    downloadLog() {
        const logData = {
            user: localStorage.getItem('cdf_user_username') || 'Guest',
            xp: localStorage.getItem('cdf_xp'),
            badges: localStorage.getItem('unlocked_badges'),
            tutorial_step: localStorage.getItem('cdf_tutorial_step'),
            navigator_log: localStorage.getItem('cdf_navigator_log') || "No Entries",
            timestamp: new Date().toISOString()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logData, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", "cdf_beta_log.json");
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        
        this.pushTickerMessage("SYSTEM: LOG EXPORTED SUCCESSFULLY", 'success');
    }

    resetNavigatorProgress() {
        if(confirm("WARNING: accurate simulation requires a clean slate. Reset all Progress?")) {
            localStorage.clear();
            location.reload();
        }
    }
}

new TutorialCoreAgent();
