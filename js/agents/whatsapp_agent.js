/**
 * Agent: WhatsApp Agent (The Messenger)
 * Outbound via /api/whatsapp proxy — token never in browser.
 */

class WhatsAppAgent extends Agent {
    constructor() {
        super("WhatsAppAgent");
    }

    init() {
        this.log("Messenger Synapses Connected.");
        window.WhatsApp = this;
        this.proxyUrl = this.getProxyUrl();

        window.addEventListener('CDF_WHATSAPP_INBOUND', (e) => {
            const data = e.detail || {};
            const text = data.text || data.body || "(Media/Other)";
            this.log(`📥 Inbound Signal: ${data.sender} -> ${text}`);
            if (window.showInboundActivity) {
                window.showInboundActivity(`Echo: ${text}`);
            }
        });

        this.startBridgePolling();
        this.checkServerStatus();
    }

    getProxyUrl() {
        const cfg = window.API_CONFIG?.whatsapp || {};
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return cfg.proxyUrl || '/api/whatsapp';
    }

    isLocalBridge() {
        return this.proxyUrl.includes('localhost');
    }

    async checkServerStatus() {
        try {
            const url = this.isLocalBridge()
                ? `${this.proxyUrl}/status`
                : `${this.proxyUrl}?action=status`;
            const res = await fetch(url);
            const data = await res.json().catch(() => ({}));
            if (data.connected) {
                this.log('✅ Meta bridge online.');
            } else if (res.ok) {
                this.log(`⚠️ Meta bridge offline: ${data.error || 'check Vercel env'}`);
            } else {
                this.log('⚠️ Bridge unreachable.');
            }
            return data;
        } catch {
            this.log('⚠️ Bridge unreachable.');
            return { connected: false };
        }
    }

    async startBridgePolling() {
        if (window.FloweeWhatsAppBridge) return;
        const POLL_INTERVAL = 5000;
        const pollUrl = this.isLocalBridge()
            ? `${this.proxyUrl}/poll`
            : `${this.proxyUrl}?action=poll`;

        this.log(`📡 Bridge polling: ${pollUrl}`);

        setInterval(async () => {
            try {
                const response = await fetch(pollUrl);
                if (!response.ok) return;
                const data = await response.json();
                const text = data?.text || data?.message?.body;
                const sender = data?.sender || data?.message?.sender;
                if (text) {
                    window.dispatchEvent(new CustomEvent('CDF_WHATSAPP_INBOUND', {
                        detail: { sender, text }
                    }));
                }
            } catch {
                /* bridge down */
            }
        }, POLL_INTERVAL);
    }

    async proxyRequest(payload) {
        if (this.isLocalBridge()) {
            const res = await fetch(`${this.proxyUrl}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: payload.text || payload.message }),
            });
            const data = await res.json().catch(() => ({}));
            return { ok: res.ok, data };
        }

        const res = await fetch(this.proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    }

    async sendMessage(text, to = null) {
        const config = window.API_CONFIG.whatsapp;
        const target = to || config.recipientPhone;

        try {
            this.log(`Attempting to send message to ${target}...`);
            const { ok, data } = await this.proxyRequest({
                action: 'send',
                text,
                to: target,
            });

            if (ok) {
                this.log("✅ Message Sent Successfully.");
                if (window.Pusher) window.Pusher.showToast("WhatsApp Message Sent", "success");
                return true;
            }

            const errorMsg = data?.error?.message || data?.error || "Unknown Meta Error";
            this.log(`❌ Meta API Error: ${errorMsg}`);
            if (window.Pusher) window.Pusher.showToast(`WhatsApp Error: ${errorMsg}`, "error");

            if (String(errorMsg).includes('token') || String(errorMsg).includes('WHATSAPP_ACCESS_TOKEN')) {
                window.Flowee?.talk(true, "⚠️ **TOKEN**: Set `WHATSAPP_ACCESS_TOKEN` in Vercel → Settings → Environment Variables, then redeploy.", "error");
            }
            return false;
        } catch (error) {
            console.error("[WhatsApp] Proxy Failed:", error);
            if (window.Pusher) window.Pusher.showToast("WhatsApp bridge unreachable", "error");
            return false;
        }
    }

    async sendTemplateMessage(templateName = "hello_world", to = null) {
        const config = window.API_CONFIG.whatsapp;
        const target = to || config.recipientPhone;

        try {
            this.log(`🚀 Sending Template [${templateName}] to ${target}...`);
            const { ok, data } = await this.proxyRequest({
                action: 'template',
                template: templateName,
                to: target,
            });

            if (ok) {
                this.log("✅ Template Sent Successfully.");
                if (window.Pusher) window.Pusher.showToast("Template [HELLO WORLD] Sent", "success");
                return true;
            }

            const errorMsg = data?.error?.message || data?.error || "Unknown Template Error";
            this.log(`❌ Template Error: ${errorMsg}`);

            if (String(errorMsg).includes('expired') || String(errorMsg).includes('token')) {
                window.Flowee?.talk(true, "⚠️ **SESSION EXPIRED**: Generate a new Meta token → Vercel env `WHATSAPP_ACCESS_TOKEN`.", "error");
            } else if (String(errorMsg).includes('verified') || String(errorMsg).includes('sandbox')) {
                window.Flowee?.talk(true, "⚠️ **HANDSHAKE FAILED**: Add your number to Meta Sandbox allowed list.", "error");
            } else {
                if (window.Pusher) window.Pusher.showToast(`Template Error: ${errorMsg}`, "error");
            }
            return false;
        } catch (error) {
            console.error("[WhatsApp] Template Proxy Failed:", error);
            return false;
        }
    }

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
                msg = `🔔 Flowee: ${data.msg || "General Update"}`;
        }
        return await this.sendMessage(msg);
    }
}

new WhatsAppAgent();
