/**
 * Agent 3: The Synchronizer (Device Sync)
 * Ensures user state is consistent across all open tabs/windows.
 */

class DeviceSyncAgent {
    constructor() {
        this.name = "The Synchronizer";
        this.init();
    }

    init() {
        console.log(`[Phoenix-EE] ${this.name} online.`);
        
        // Listen for changes in other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === 'circle_user_state') {
                this.handleStateChange(event.newValue);
            }
        });
    }

    handleStateChange(newStateJson) {
        if (!newStateJson) return; // Cleared

        try {
            const newState = JSON.parse(newStateJson);
            const currentState = JSON.parse(localStorage.getItem('circle_user_state') || '{}');

            // Detected a Status Change (e.g. Login in other tab)
            if (newState.status !== currentState.status) {
                console.log(`[${this.name}] Syncing state: ${currentState.status} -> ${newState.status}`);
                
                // If we became authenticated elsewhere...
                if (newState.status === 'member' || newState.status === 'authenticated') {
                    // If we are on the login page/iframe, we MUST go to dashboard
                    if (window.location.href.includes('login.html')) {
                        const isPages = window.location.pathname.includes('/pages/');
                        window.location.href = isPages ? 'dashboard.html' : 'pages/dashboard.html';
                    } else {
                        // Otherwise just reload to update the UI
                        window.location.reload(); 
                    }
                }
                
                // If we logged out elsewhere, reload to show login
                if (newState.status === 'fresh' && (currentState.status === 'member' || currentState.status === 'visitor')) {
                    window.location.reload();
                }
            }
        } catch (e) {
            console.error(`[${this.name}] Sync Error:`, e);
        }
    }
}

// Initialize
new DeviceSyncAgent();
