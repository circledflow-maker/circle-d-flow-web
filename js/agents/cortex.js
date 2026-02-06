/**
 * CORTEX AGENT
 * The Central Nervous System of Circle D Flow.
 * Coordinate Agents: BridgePusher (Guide), Gamification (Rules), and UI.
 */

class CortexAgent {
    constructor() {
        this.name = "Cortex";
        this.version = "1.0.0";
        this.events = new EventTarget();
        this.state = {
            userLevel: 0,
            userClass: null,
            isProfileComplete: false
        };
        
        this.init();
    }

    init() {
        console.log("ðŸ§  [Cortex] Online. Connecting synapses...");
        
        // Listen for Global Events
        window.addEventListener('CDF_USER_LOGIN', (e) => this.handleLogin(e.detail));
        window.addEventListener('CDF_CLASS_SELECTED', (e) => this.handleClassSelection(e.detail));
        window.addEventListener('CDF_PROFILE_UPDATED', (e) => this.handleProfileUpdate(e.detail));
        
        // Initial State Check
        this.syncState();
    }

    syncState() {
        this.state.userClass = localStorage.getItem('userClass');
        const gamification = JSON.parse(localStorage.getItem('user_gamification_data') || '{}');
        this.state.userLevel = gamification.level || 0;
        this.state.isProfileComplete = localStorage.getItem('isProfileComplete') === 'true';

        console.log("ðŸ§  [Cortex] State Synced:", this.state);
        
        // Trigger Logic based on State
        if (window.location.href.includes('dashboard.html')) {
            this.runDashboardLogic();
        }
    }

    runDashboardLogic() {
        // 1. Check Class Selection
        if (!this.state.userClass) {
            console.log("ðŸ§  [Cortex] Class not found. Commanding Flowee to Guide.");
            this.dispatchToAgent('BridgePusher', 'START_TOUR', { step: 'CLASS_SELECTION' });
            this.lockUI(['hex-bazaar', 'hex-battle', 'hex-museum', 'hex-knowledge', 'hex-admin']);
        } else {
            // Class Exists. Check Profile.
            if (!this.state.isProfileComplete) {
                console.log("🧠 [Cortex] Profile incomplete. Commanding Flowee to Guide.");
                this.dispatchToAgent('BridgePusher', 'START_TOUR', { step: 'PROFILE_SETUP' });
                this.lockUI(['hex-battle', 'hex-museum', 'hex-knowledge', 'hex-admin']); // Keep advanced stuff locked
            } else {
                // All Good. Unlock Level Features
                this.unlockFeaturesByLevel();
            }
        }
    }

    handleClassSelection(detail) {
        console.log("🧠 [Cortex] Class Selected:", detail.className);
        localStorage.setItem('userClass', detail.className);
        this.state.userClass = detail.className;
        
        // Trigger Next Step
        this.dispatchToAgent('BridgePusher', 'NextStep', { step: 'PROFILE_SETUP' });
    }

    handleProfileUpdate(detail) {
        console.log("🧠 [Cortex] Profile Updated. verifying quest...");
        if (!this.state.isProfileComplete) {
            localStorage.setItem('isProfileComplete', 'true');
            this.state.isProfileComplete = true;
            
            // Award XP (Quest)
            this.awardXP(500, "Identity Established");
            
            // Unlock Next Phase
            this.unlockFeaturesByLevel();
            this.dispatchToAgent('BridgePusher', 'CELEBRATE', { msg: "Identity Confirmed! Access Granted." });
        }
    }

    // --- UTILS ---
    
    lockUI(features) {
        features.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('feature-locked'); // Use class for styling
                // Find lock overlay
                const lock = el.querySelector('.lock-overlay');
                if (lock) lock.classList.remove('hidden');
            }
        });
    }

    unlockFeaturesByLevel() {
        const lvl = this.state.userLevel;
        console.log(`🧠 [Cortex] Unlocking features for Level ${lvl}`);
        
        // Define Requirements
        const requirements = [
            { id: 'hex-bazaar', level: 1 },
            { id: 'hex-battle', level: 2 },
            { id: 'hex-museum', level: 3 },
            { id: 'hex-knowledge', level: 3 },
            { id: 'hex-admin', level: 5 }
        ];

        requirements.forEach(req => {
            const el = document.getElementById(req.id);
            if (el) {
                if (lvl >= req.level) {
                   // Unlock
                   el.classList.remove('feature-locked');
                   el.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
                   const lock = el.querySelector('.lock-overlay');
                   if (lock) lock.classList.add('hidden');
                } else {
                   // Lock (Enforce)
                   el.classList.add('feature-locked');
                   const lock = el.querySelector('.lock-overlay');
                   if (lock) lock.classList.remove('hidden');
                }
            }
        });
    }

    dispatchToAgent(agentName, action, payload) {
        const event = new CustomEvent(`CDF_AGENT_COMMAND_${agentName.toUpperCase()}`, {
            detail: { action, payload }
        });
        window.dispatchEvent(event);
    }
    
    awardXP(amount, reason) {
        // Integrate with existing gamification if possible, or direct storage
        // Emulating Gamification Agent call
        console.log(`ðŸ§  [Cortex] Awarding ${amount} XP: ${reason}`);
        // Simple write for now, ideally calls Gamification.addXP()
        let gData = JSON.parse(localStorage.getItem('user_gamification_data') || '{"xp":0, "level":0}');
        gData.xp += amount;
        localStorage.setItem('user_gamification_data', JSON.stringify(gData));
        window.location.reload(); // Refresh to show stats
    }
}

// Global Instance
window.Cortex = new CortexAgent();
