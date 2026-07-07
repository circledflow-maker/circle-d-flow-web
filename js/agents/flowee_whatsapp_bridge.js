/**
 * Flowee ↔ WhatsApp Bridge
 * Polls server for inbound WhatsApp, shows Pusher toast + Flowee interactive replies.
 */

class FloweeWhatsAppBridge {
    constructor() {
        this.apiBase = this.resolveApiBase();
        this.pollMs = 5000;
        this._timer = null;
        this.init();
    }

    resolveApiBase() {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return '/api/whatsapp';
    }

    init() {
        window.FloweeWhatsAppBridge = this;
        window.addEventListener('CDF_WHATSAPP_INBOUND', (e) => this.handleInbound(e.detail));

        this.checkStatus();
        this.startPolling();
        this.hookNotifications();
    }

    async checkStatus() {
        try {
            const url = this.apiBase.includes('localhost')
                ? `${this.apiBase.replace(/\/$/, '')}/status`
                : `${this.apiBase}?action=status`;
            const res = await fetch(url);
            const data = await res.json().catch(() => ({}));
            if (typeof window.updateWaStatus === 'function') {
                window.updateWaStatus(data.connected ? 'resonant' : 'offline', data.connected ? 'Resonant (Ready)' : (data.error || 'Handshake Offline'));
            }
            return data;
        } catch {
            if (typeof window.updateWaStatus === 'function') {
                window.updateWaStatus('offline', 'Bridge Unreachable');
            }
            return { connected: false };
        }
    }

    startPolling() {
        if (this._timer) clearInterval(this._timer);
        this._timer = setInterval(() => this.poll(), this.pollMs);
        this.poll();
    }

    async poll() {
        try {
            if (this.apiBase.includes('localhost')) {
                const res = await fetch(`${this.apiBase.replace(/\/$/, '')}/poll`);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.text) this.handleInbound({ sender: data.sender, text: data.text });
                return;
            }

            const res = await fetch(`${this.apiBase}?action=poll`);
            if (!res.ok) return;
            const data = await res.json();
            const row = data?.message;
            if (row?.body) {
                this.handleInbound({ sender: row.sender, text: row.body });
            }
        } catch {
            /* bridge down */
        }
    }

    handleInbound(detail = {}) {
        const text = detail.text || detail.body || '';
        const sender = detail.sender || 'Navigator';
        if (!text) return;

        window.dispatchEvent(new CustomEvent('CDF_WHATSAPP_INBOUND', { detail: { sender, text } }));

        if (window.Pusher) {
            window.Pusher.showToast(`WhatsApp: ${text.slice(0, 80)}`, 'success');
        }

        if (window.Flowee) {
            window.Flowee.talk(true, `📱 **WhatsApp** from ${sender}: "${text}"`, 'guide', [
                { label: 'Reply via WA', action: () => window.open('https://wa.me/351912828940', '_blank') },
                { label: 'Open Dashboard', action: () => { window.location.href = '/pages/dashboard.html'; } },
            ]);
        }

        if (typeof window.showInboundActivity === 'function') {
            window.showInboundActivity(text);
        }
    }

    hookNotifications() {
        if (!window.WhatsApp) return;

        const origAlert = window.WhatsApp.sendAlert.bind(window.WhatsApp);
        window.WhatsApp.sendAlert = async (type, data = {}) => {
            const ok = await origAlert(type, data);
            if (ok && window.Pusher) {
                window.Pusher.showToast(`WhatsApp alert: ${type}`, 'success');
            }
            if (window.FloweeNotify?.enabled && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Flowee · WhatsApp', { body: data.msg || type, icon: '/Assets/images/cqr-logo-gold.png' });
            }
            return ok;
        };
    }
}

document.addEventListener('DOMContentLoaded', () => new FloweeWhatsAppBridge());
