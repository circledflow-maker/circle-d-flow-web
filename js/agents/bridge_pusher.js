/**
 * Agent: Bridge Pusher (The Verteiler)
 * Purpose: Global Event Bus & WebSocket Simulation.
 *          Distributes "admin pushes" and cross-tab events.
 */

class BridgePusherAgent {
    constructor() {
        this.name = "Bridge Pusher";
        this.CHANNEL = "cdf_bridge_channel";
        
        // Listen for storage events (Cross-Tab Communication)
        window.addEventListener('storage', (e) => {
            if (e.key === this.CHANNEL && e.newValue) {
                try {
                    const packet = JSON.parse(e.newValue);
                    if (packet.timestamp > Date.now() - 1000) { // Only recent events
                        this.handleBroadcast(packet.type, packet.payload);
                    }
                } catch (err) {
                    console.error("Bridge Signal Corrupted:", err);
                }
            }
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Global Verteiler Online (v2.0). Listening on frequency: ${this.CHANNEL}`);
        window.BridgePusher = this; 
    }

    /**
     * Broadcast a message to ALL open tabs (including self via logic, strictly self via direct call usually)
     * @param {string} type - Event Type (e.g., 'ADMIN_ALERT', 'QUEST_DROP')
     * @param {object} payload - Data
     */
    broadcast(type, payload) {
        const packet = {
            type: type,
            payload: payload,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        };

        // 1. Save to Storage (Triggers 'storage' event in OTHER tabs)
        localStorage.setItem(this.CHANNEL, JSON.stringify(packet));

        // 2. Handle locally immediately (since storage event doesn't fire on same tab)
        this.handleBroadcast(type, payload);
    }

    handleBroadcast(type, payload) {
        console.log(`[${this.name}] Signal Received: ${type}`, payload);

        // Dispatch DOM Event for local agents to pick up
        const event = new CustomEvent('bridge-signal', {
            detail: { type, payload }
        });
        window.dispatchEvent(event);

        // Specific Handlers
        if (type === 'ADMIN_ALERT') {
             if (window.Flowee && typeof window.Flowee.talk === 'function') {
                 window.Flowee.talk(true, `⚡ ADMIN SIGNAL: ${payload.msg}`);
             } else {
                 alert(`⚡ ADMIN SIGNAL: ${payload.msg}`);
             }
        }
    }

    // --- NEURAL LINK (Cross-Device Sync) ---
    generateSyncCode() {
        const data = {};
        for(let i=0; i<localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key.startsWith('cdf_') || key.startsWith('user')) {
                data[key] = localStorage.getItem(key);
            }
        }
        // Simple Base64 encode for "security" (obfuscation)
        const json = JSON.stringify(data);
        const code = btoa(unescape(encodeURIComponent(json)));
        
        console.log(`[${this.name}] Neural Link Generated. Length: ${code.length}`);
        return code;
    }

    redeemSyncCode(code) {
        try {
            const json = decodeURIComponent(escape(atob(code)));
            const data = JSON.parse(json);
            
            let count = 0;
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
                count++;
            });
            
            console.log(`[${this.name}] Neural Link Established. Synced ${count} Memory Fragments.`);
            alert("SYNC COMPLETE. REBOOTING SYSTEM...");
            window.location.reload();
            return true;
        } catch(e) {
            console.error("Sync Failed:", e);
            alert("ERROR: Invalid Neural Link Code.");
            return false;
        }
    }
    // --- DEV TOOLS (Auth Bypass) ---
    bypassGenesis() {
        console.log(`[${this.name}] 🔓 executing GENESIS BYPASSS...`);
        localStorage.setItem('cdf_user_username', 'Neo-Tester');
        localStorage.setItem('cdf_user_email', 'neo@matrix.com');
        localStorage.setItem('user_class', 'Operator');
        localStorage.setItem('user_nen_type_v2', 'Specialization (System)');
        localStorage.setItem('cdf_adinkra_symbol', 'Dame-Dame');
        localStorage.setItem('cdf_beta_key', 'DEV-BYPASS-001');
        
        window.location.href = '../pages/dashboard.html';
    }
}

new BridgePusherAgent();
