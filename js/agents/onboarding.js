/**
 * Agent: Onboarding (Static Fallback Version)
 * Purpose: ZERO-DEPENDENCY Welcome Protocol.
 * Guarantee: Works even if class instantiation fails.
 */

window.Onboarding = {
    initialized: false,
    delay: 4000,

    init: function() {
        if (this.initialized) return;
        this.initialized = true;

        // CRITICAL CHECK: Only stop if Mission 1 is COMPLETE.
        // If mission is pending, we MUST show this (unless dismissed this session)
        const missionDone = localStorage.getItem('cdf_mission_identity_complete');
        const sessionDismissed = sessionStorage.getItem('cdf_session_dismissed');

        if (missionDone) {
            console.log("[Onboarding] Mission Complete. Protocol Dormant.");
            return;
        }

        if (sessionDismissed) {
             console.log("[Onboarding] Dismissed for this session.");
             return;
        }

        console.log(`[Onboarding] Protocol initiated. Waiting ${this.delay}ms...`);
        setTimeout(() => this.launch(), this.delay);
    },

    launch: function() {
        // Sound Check (Safe)
        if(window.SoundEngineer && typeof window.SoundEngineer.playSFX === 'function') {
             try { window.SoundEngineer.playSFX('transmission_incoming'); } catch(e) { console.warn(e); }
        }
        this.render();
    },

    render: function() {
        // ... (render content same as before) ... 
        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.style.cssText = "position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.95); opacity: 0; transition: opacity 0.5s ease; pointer-events: auto;";

        const cardStyle = "background: linear-gradient(135deg, #fdfbf7 0%, #e6dcb1 100%); border: 4px double #8b4513; box-shadow: 0 0 50px rgba(212, 175, 55, 0.5); color: #2c1b0e; padding: 40px; max-width: 600px; width: 90%; text-align: center; border-radius: 4px; pointer-events: auto;";

        modal.innerHTML = `
            <div id="onboarding-card" style="${cardStyle}">
                <h2 style="font-family: serif; font-size: 2rem; font-weight: bold; margin-bottom: 5px; color: #2c1b0e; letter-spacing: 2px;">SCROLL OF BEGINNINGS</h2>
                <p style="font-family: monospace; font-size: 0.8rem; color: #8b4513; margin-bottom: 20px; text-transform: uppercase;">The Archive Opens</p>
                
                <hr style="border: 0; border-top: 1px solid rgba(139, 69, 19, 0.3); margin: 20px 0;">

                <p style="font-size: 1.1rem; line-height: 1.5; margin-bottom: 20px;">
                    Greetings, Voyager.<br><br>
                    The winds of fate have guided you to the <strong>Captain's Quarters</strong>. 
                    Your legend begins now, but first, you must inscribe your name into the Great Log.
                </p>

                <div style="background: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 4px; margin-bottom: 25px; border: 1px dashed #8b4513;">
                    <strong style="color: #8b4513; display: block; margin-bottom: 5px; font-size: 0.9rem;">PROTOCOL 01: IDENTITY SYNC</strong>
                    <span style="font-size: 0.8rem; opacity: 0.8;">"Know thyself, and you shall know the universe."</span>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.Onboarding.accept()" 
                        style="background: #2c1b0e; color: #f4e4bc; border: none; padding: 12px 24px; font-weight: bold; letter-spacing: 1px; cursor: pointer; border-radius: 2px;">
                        INSCRIBE NAME
                    </button>
                    <button onclick="window.Onboarding.dismiss()" 
                        style="background: transparent; color: #2c1b0e; border: 2px solid rgba(44, 27, 14, 0.2); padding: 12px 24px; font-weight: bold; letter-spacing: 1px; cursor: pointer; border-radius: 2px;">
                        LATER
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.style.opacity = '1');
    },

    accept: function() {
        console.log("[Onboarding] Accepted.");
        // We do NOT set dismissed here, because we want them to finish the mission.
        // But we close the modal to show the Log.
        
        if (window.CaptainsLog) {
            window.CaptainsLog.open('log');
            this.close();
        } else {
            console.error("CaptainsLog missing.");
            alert("System Error: Captain's Log Agent missing. Reloading...");
            window.location.reload();
        }
    },

    dismiss: function() {
         console.log("[Onboarding] Dismissed (Session Only).");
         sessionStorage.setItem('cdf_session_dismissed', 'true'); // Only verify for this session
         this.close();
    },

    close: function() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 500);
        }
    }
};

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Onboarding.init());
} else {
    window.Onboarding.init();
}
