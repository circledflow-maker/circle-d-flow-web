/**
 * Agent: Beta Observer (The Silent Scribe)
 * Role: Telemetry and Data Collection for the Beta Phase.
 * Logs critical user milestones to localStorage for export.
 */

window.BetaObserver = {
    logs: [],
    
    init: function() {
        console.log("[BetaObserver] Telemetry Online.");
        this.loadLogs();
        this.attachListeners();
    },

    loadLogs: function() {
        this.logs = JSON.parse(localStorage.getItem('cdf_beta_logs') || '[]');
    },

    saveLogs: function() {
        localStorage.setItem('cdf_beta_logs', JSON.stringify(this.logs));
    },

    logEvent: function(type, details) {
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type: type,
            details: details,
            user: localStorage.getItem('cdf_user_username') || 'Guest'
        };
        
        this.logs.push(entry);
        this.saveLogs();
        console.log(`[BetaObserver] Logged: ${type}`, entry);
    },

    attachListeners: function() {
        // 1. Level Up
        window.addEventListener('level-up', (e) => {
            this.logEvent('LEVEL_UP', { level: e.detail.level });
        });

        // 2. Transaction (Merchant)
        window.addEventListener('cdf-transaction', (e) => {
            this.logEvent('TRANSACTION', e.detail);
        });

        // 3. Battle Complete (Referee)
        window.addEventListener('cdf-battle-complete', (e) => {
            this.logEvent('BATTLE_COMPLETE', e.detail);
        });
        
        // 4. Page View
        this.logEvent('PAGE_VIEW', { path: window.location.pathname });

        // 5. Flavor Log (Taste)
        window.addEventListener('cdf-flavor-log', (e) => {
             this.logEvent('COMMENT_SUBMIT', e.detail);
        });

        // 6. Identity Uplink (Avatar)
        window.addEventListener('cdf-identity-uplink', (e) => {
             this.logEvent('IDENTITY_UPDATE', e.detail);
        });

        // 7. Visual Upload (Art)
        window.addEventListener('cdf-art-upload', (e) => {
             this.logEvent('ART_UPLOAD', e.detail);
        });
    },

    exportData: function() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.logs, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "cdf_beta_data_" + Date.now() + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.BetaObserver.init();
});
