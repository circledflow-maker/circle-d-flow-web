/**
 * Agent: WhatsApp Agent (The Messenger)
 * Role: Handles communication via the Meta WhatsApp Cloud API.
 */

class WhatsAppAgent extends Agent {
    constructor() {
        super("WhatsAppAgent");
    }

    init() {
        this.log("Messenger Synapses Connected.");
        window.WhatsApp = this;

        // Listen for Inbound signals from n8n (via NetworkHub or Pusher)
        window.addEventListener('CDF_WHATSAPP_INBOUND', (e) => {
            const data = e.detail;
            const text = data.text || "(Media/Other)";
            this.log(`📥 Inbound Signal: ${data.sender} -> ${text}`);
            if (window.showInboundActivity) {
                window.showInboundActivity(`Echo: ${text}`);
            }
        });

        // --- LOCAL BRIDGE POLLING ---
        // Best way to stay connected while PikaPods is being fixed.
        this.startBridgePolling();
    }

    async startBridgePolling() {
        const POLL_INTERVAL = 3000; // 3 seconds
        if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return;
        const BRIDGE_URL = "http://localhost:3001/poll";

        this.log(`📡 Local Bridge Polling started at ${BRIDGE_URL}`);
        
        setInterval(async () => {
            try {
                const response = await fetch(BRIDGE_URL);
                if (response.status === 200) {
                    const data = await response.json();
                    if (data && data.text) {
                        this.log(`⚡ Signal captured from Local Bridge: ${data.text}`);
                        // Dispatch event to trigger the inbound listener above
                        window.dispatchEvent(new CustomEvent('CDF_WHATSAPP_INBOUND', { 
                            detail: data 
                        }));
                    }
                }
            } catch (e) {
                // Silently ignore if bridge is down
            }
        }, POLL_INTERVAL);
    }

    async sendMessage(text, to = null) {
        const config = window.API_CONFIG.whatsapp;
        const localToken = localStorage.getItem('whatsapp_access_token');
        const token = localToken || config.accessToken;
        
        const target = to || config.recipientPhone;
        const url = `${config.apiUrl}/${config.phoneId}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: target.replace(/\+/g, ''),
            type: "text",
            text: { preview_url: false, body: text }
        };

        try {
            this.log(`Attempting to send message to ${target}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                this.log("✅ Message Sent Successfully.");
                if (window.Pusher) window.Pusher.showToast("WhatsApp Message Sent", "success");
                return true;
            } else {
                const errorMsg = data.error?.message || "Unknown Meta Error";
                this.log(`❌ Meta API Error: ${errorMsg}`);
                if (window.Pusher) window.Pusher.showToast(`WhatsApp Error: ${errorMsg}`, "error");
                
                if (errorMsg.includes("verified") || errorMsg.includes("sandbox")) {
                    window.Flowee?.talk(true, "⚠️ **SIGNAL BLOCKED**: Your number is not yet verified in the Meta Sandbox. Please add it to your 'Allowed Numbers' in the Meta Portal.", "error");
                }
                return false;
            }
        } catch (error) {
            console.error("[WhatsApp] Fetch Failed (Network/CORS):", error);
            return false;
        }
    }

    /**
     * Sends a Template Message (Required for Sandbox first-contact)
     * @param {string} templateName - (Optional) Name of the template (default: hello_world)
     */
    async sendTemplateMessage(templateName = "hello_world", to = null) {
        const config = window.API_CONFIG.whatsapp;
        const localToken = localStorage.getItem('whatsapp_access_token');
        const token = localToken || config.accessToken;
        
        const target = to || config.recipientPhone;
        const url = `${config.apiUrl}/${config.phoneId}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            to: target.replace(/\+/g, ''),
            type: "template",
            template: {
                name: templateName,
                language: { code: "en_US" }
            }
        };

        try {
            this.log(`🚀 Sending Template [${templateName}] to ${target}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                this.log("✅ Template Sent Successfully.");
                if (window.Pusher) window.Pusher.showToast("Template [HELLO WORLD] Sent", "success");
                return true;
            } else {
                const errorMsg = data.error?.message || "Unknown Template Error";
                this.log(`❌ Template Error: ${errorMsg}`);
                
                if (errorMsg.includes("expired") || errorMsg.includes("token")) {
                    window.Flowee?.talk(true, "⚠️ **SESSION EXPIRED**: Your Meta Access Token has expired. Please generate a new one in the Developer Portal and update the Bridge.", "error");
                    if (window.Pusher) window.Pusher.showToast("Meta Token Expired", "error");
                } else if (errorMsg.includes("verified") || errorMsg.includes("sandbox")) {
                    window.Flowee?.talk(true, "⚠️ **HANDSHAKE FAILED**: Meta refuses to talk to this number until you add it to your Sandbox 'Allowed Numbers'.", "error");
                } else {
                    if (window.Pusher) window.Pusher.showToast(`Template Error: ${errorMsg}`, "error");
                }
                return false;
            }
        } catch (error) {
            console.error("[WhatsApp] Template Fetch Failed:", error);
            return false;
        }
    }

    /**
     * Sends a notification alert for specific system events
     */
    async sendAlert(type, data = {}) {
        let msg = "";
        switch (type) {
            case 'QUEST_COMPLETE':
                msg = `🏆 Quest Complete: ${data.name}\nXP Earned: +${data.xp}\nNavigator, your flow is strengthening.`;
                break;
            case 'CLOUD_SYNC':
                msg = `🔄 Cloud Sync Pulse: ${data.status}\nKingdom state saved to Weltenbaum-Reaktor.`;
                break;
            case 'ADMIN_ALERT':
                msg = `⚠️ ADMIN ALERT: ${data.msg}\nImmediate review required in Orbit.`;
                break;
            default:
                msg = `🔔 System Notification: ${data.msg || "General Update"}`;
        }

        return await this.sendMessage(msg);
    }
}

// Global Instance
new WhatsAppAgent();
