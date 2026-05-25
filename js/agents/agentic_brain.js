/**
 * Agent: Agentic Brain (The Link)
 * Role: Coordinates Cloud Sync consent and Weekly Reports via n8n.
 */

class AgenticBrain extends Agent {
    constructor() {
        super("AgenticBrain");
        this.syncPending = false;
    }

    init() {
        this.log("Neural Link Established.");
        window.AgenticBrain = this;

        // Listen for User Chat to capture "Yes/No" for Sync
        window.addEventListener('CDF_USER_CHAT', (e) => this.handleUserChat(e.detail));

        // Periodically check if we should suggest a sync (e.g. every 10 mins?)
        // For testing, let's just trigger it on specific global events
        window.addEventListener('CDF_QUEST_COMPLETE', (e) => this.onQuestComplete(e.detail));
    }

    handleUserChat(detail) {
        const text = detail.text.toLowerCase();
        
        if (this.syncPending) {
            if (text.includes("yes") || text.includes("ja") || text.includes("sync")) {
                this.performSync();
            } else if (text.includes("no") || text.includes("nein")) {
                this.log("Sync Denied by User.");
                this.syncPending = false;
                window.Flowee?.talk(true, "Understood. The local archive is stable for now.", "neutral");
            }
        } else {
            // Manual Trigger via Chat
            if (text === "/cloud-pulse") {
                this.requestSyncConsent();
            } else if (text === "/wa-ping") {
                this.log("Manually Triggering WhatsApp Template...");
                window.WhatsApp?.sendTemplateMessage("hello_world");
            } else if (text === "/portal-status") {
                this.runDiagnostics();
            } else if (text === "/sync-full") {
                this.performSync();
            }
        }
    }

    async runDiagnostics() {
        this.log("Running Portal Diagnostics...");
        window.Flowee?.talk(true, "Scanning Portal Syllables... Please wait.", "active");
        
        let report = "📍 **PORTAL REPORT**\n\n";
        
        // 1. n8n Check
        if (window.NetworkHub) {
            report += "📡 **n8n (Weltenbaum)**: Connected\n";
        } else {
            report += "❌ **n8n (Weltenbaum)**: DISCONNECTED\n";
        }

        // 2. WhatsApp Check
        if (window.WhatsApp) {
            report += "📱 **WhatsApp (Messenger)**: Active\n";
        } else {
            report += "❌ **WhatsApp (Messenger)**: OFFLINE\n";
        }

        // 3. API Config
        if (window.API_CONFIG) {
            report += "🔑 **API Credentials**: Loaded\n";
        } else {
            report += "❌ **API Credentials**: MISSING\n";
        }

        setTimeout(() => {
            window.Flowee?.talk(true, report, "neutral");
            this.log("Diagnostics Complete.");
        }, 2000);
    }

    onQuestComplete(detail) {
        this.log(`Quest Complete: ${detail.name}. Suggesting Cloud Update...`);
        // Notify WhatsApp first
        window.WhatsApp?.sendAlert('QUEST_COMPLETE', detail);
        
        // Then ask for sync
        setTimeout(() => this.requestSyncConsent(), 2000);
    }

    requestSyncConsent() {
        if (this.syncPending) return;
        this.syncPending = true;

        if (window.NetworkHub) {
            window.NetworkHub.triggerConsentSync();
        } else {
            this.log("NetworkHub not found. Cannot sync.");
        }
    }

    async performSync() {
        this.syncPending = false;
        this.log("Initiating Cloud Sync to Weltenbaum-Reaktor...");
        
        window.Flowee?.talk(true, "Pulsing the Flow to PikaPod. Please wait...", "active");

        // Collect all relevant state
        const state = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('cdf_')) {
                state[key] = localStorage.getItem(key);
            }
        }

        if (window.NetworkHub) {
            const success = await window.NetworkHub.pulseToN8N('FULL_SYSTEM_SYNC', state);
            if (success) {
                window.Flowee?.talk(true, "Cloud Sync Complete. WhatsApp Notification Sent.", "success");
                window.WhatsApp?.sendAlert('CLOUD_SYNC', { status: 'SUCCESS' });
            } else {
                window.Flowee?.talk(true, "Connection to Weltenbaum failed. Local cache is safe.", "error");
            }
        }
    }

    /**
     * Trigger for n8n to generate the Weekly Drive Report
     */
    async triggerWeeklyReport() {
        this.log("Requesting Weekly Drive Report from n8n...");
        if (!window.NetworkHub) return;

        const success = await window.NetworkHub.pulseToN8N('WEEKLY_REPORT_TRIGGER', {
            ts: new Date().toISOString(),
            include_graphs: true
        });

        if (success) {
            window.WhatsApp?.sendMessage("🔄 Weeky Drive Changelog being generated. Check your Drive in 5 minutes.");
        }
    }
}

// Global Instance
new AgenticBrain();
