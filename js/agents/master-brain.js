/**
 * Agent: Master Brain (The Cortex)
 * Purpose: Handles System Configuration, Version Checking, and Mystic Fog Transitions.
 */

const SystemConfig = {
    currentVersion: "1.0-BETA", // Update this for new tours
    
    // Automatic Tour Points for this version
    newFeatures: [
        {
            targetUrl: "/pages/dashboard.html",
            elementId: "#trinity-resonance-wrap", 
            text: "new_feature_trinity", // Key for i18n
            exp: 50
        },
        {
            targetUrl: "akwaba_kitchen.html",
            elementId: ".jamtruck-progress-bar",
            text: "new_feature_jamtruck", // Key for i18n
            exp: 50
        }
    ]
};

/* --- FLOWEE UPDATE CHECKER --- */
function checkSystemUpdates() {
    const user = JSON.parse(localStorage.getItem('cqr_user'));
    if (!user) return;

    // Has user seen this version?
    if (user.last_version !== SystemConfig.currentVersion) {
        console.log(`[MasterBrain] System Update ${SystemConfig.currentVersion} detected.`);
        startUpdateTour(user);
    }
}

function startUpdateTour(user) {
    // Flowee Notification (using i18n if possible, or fallback)
    const msg = window.LanguageMatrix ? 
        (window.LanguageMatrix.translations[localStorage.getItem('cqr_lang') || 'en'].update_msg || "System Update Installed.") 
        : "System Update Installed.";

    if(window.Flowee) window.Flowee.talk(true, msg, "alert");
    else alert(`Flowee: "${msg}"`);
    
    // Save state
    user.last_version = SystemConfig.currentVersion;
    user.xp = (user.xp || 0) + 100; 
    localStorage.setItem('cqr_user', JSON.stringify(user));

    // Start Navigation
    if(SystemConfig.newFeatures.length > 0) {
        triggerMysticFog(SystemConfig.newFeatures[0].targetUrl);
    }
}

/* --- MYSTIC FOG TRANSITION --- */
function triggerMysticFog(targetUrl) {
    // 1. Create Fog in DOM if missing
    if (!document.getElementById('mystic-fog-overlay')) {
        // Text is handled by CSS/HTML injection usually, but we ensure structure here
        const fogHTML = `
        <div id="mystic-fog-overlay" style="background-color: #000;">
            <div class="fog-layer one"></div>
            <div class="fog-layer two"></div>
            <div id="fog-message" data-i18n="fog_message">THE FLOW IS SHIFTING...</div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', fogHTML);
    }

    const fog = document.getElementById('mystic-fog-overlay');
    const msg = document.getElementById('fog-message');

    // Update Text Language if Matrix exists
    if(window.LanguageMatrix) {
        const lang = localStorage.getItem('cqr_lang') || 'en';
        const txt = window.LanguageMatrix.translations[lang].fog_message;
        if(txt) msg.innerText = txt;
    }

    // 2. Dense Fog (Fade In)
    fog.style.opacity = '1';
    fog.style.pointerEvents = 'all'; 
    
    setTimeout(() => {
        msg.style.opacity = '1'; 
    }, 800);

    // 3. Change Page
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 2500);
}

// FADE OUT LOGIC (Runs on page load)
window.addEventListener('load', () => {
    const fog = document.getElementById('mystic-fog-overlay');
    if (fog) {
        const msg = document.getElementById('fog-message');
        if(msg) msg.style.opacity = '0';
        
        setTimeout(() => {
            fog.style.opacity = '0';
            fog.style.pointerEvents = 'none';
        }, 500);
    } else {
        // If coming effectively from a foggy transition but the new page doesn't have fog structure yet,
        // we might want to inject it just to fade it out, but usually the HTML should have it.
        // For now, we assume index.html/dashboard have it injected.
    }
});

// Expose
window.MasterBrain = {
    triggerMysticFog,
    checkSystemUpdates,
    SystemConfig,
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard')) {
        setTimeout(() => {
            try { checkSystemUpdates(); } catch (e) { console.warn('[MasterBrain]', e.message); }
        }, 4000);
    }
});
