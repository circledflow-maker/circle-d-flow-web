/**
 * Flowee Notify — browser push (no n8n). Future: WhatsApp bridge.
 */
class FloweeNotifyAgent {
    constructor() {
        this.enabled = localStorage.getItem('cdf_notify_enabled') === 'true';
        window.FloweeNotify = this;
        document.addEventListener('DOMContentLoaded', () => this.maybePrompt());
    }

    async maybePrompt() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            this.enabled = true;
            localStorage.setItem('cdf_notify_enabled', 'true');
            return;
        }
        if (Notification.permission === 'denied') return;
        setTimeout(() => {
            if (window.Flowee) {
                window.Flowee.talk(true, 'Enable notifications? Flowee can send quest updates and rune alerts. Type "notify on" in chat.', 'guide');
            }
        }, 8000);
    }

    async requestPermission() {
        if (!('Notification' in window)) return false;
        const p = await Notification.requestPermission();
        this.enabled = p === 'granted';
        localStorage.setItem('cdf_notify_enabled', String(this.enabled));
        return this.enabled;
    }

    send(title, body, tag) {
        if (!this.enabled || Notification.permission !== 'granted') return;
        try {
            new Notification(title, { body, icon: '/Assets/images/logo.png', tag: tag || 'cdf', silent: false });
        } catch (_) { /* mobile quirks */ }
        if (window.ImperialHUD) window.ImperialHUD.pushMessage(body, 'flowee');
    }

    questAccepted(title) {
        this.send('Quest accepted', title, 'quest');
    }

    questComplete(title, xp) {
        this.send('Quest complete', `${title}: +${xp} XP`, 'quest-done');
    }

    levelUp(level, feature) {
        this.send('Level up!', `Nexus Level ${level}. Unlocked: ${feature}`, 'level');
    }
}

new FloweeNotifyAgent();
