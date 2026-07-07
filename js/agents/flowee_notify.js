/**
 * Flowee Notify — browser push; Flowee always asks (retry if denied).
 */
class FloweeNotifyAgent {
    constructor() {
        this.enabled = localStorage.getItem('cdf_notify_enabled') === 'true';
        window.FloweeNotify = this;
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.promptViaFlowee(), 6000);
        });
    }

    speak(text, mood) {
        if (window.Flowee) window.Flowee.talk(true, text, mood || 'guide');
        if (window.FloweeVoice) window.FloweeVoice.speak(text);
    }

    shouldAskAgain() {
        const last = parseInt(localStorage.getItem('cdf_notify_last_ask') || '0', 10);
        const denied = Notification.permission === 'denied';
        const wait = denied ? 4 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        return Date.now() - last > wait;
    }

    async promptViaFlowee() {
        if (!('Notification' in window)) {
            this.speak('Notifications are not supported in this browser. I will still guide you in chat.');
            return;
        }
        if (Notification.permission === 'granted') {
            this.enabled = true;
            localStorage.setItem('cdf_notify_enabled', 'true');
            return;
        }
        if (!this.shouldAskAgain()) return;

        localStorage.setItem('cdf_notify_last_ask', String(Date.now()));
        this.injectNotifyButtons();

        if (Notification.permission === 'denied') {
            this.speak('Notifications were blocked earlier. Enable them in browser settings, or tap "Ask again" — I can retry when you are ready.');
        } else {
            this.speak('Navigator, may I send you quest updates, rune alerts, and Lisbon news? Tap Allow below or type "notify on" in chat.');
        }
    }

    injectNotifyButtons() {
        if (document.getElementById('flowee-notify-actions')) return;
        if (window.Flowee && !document.getElementById('flowee-messages')) {
            window.Flowee.renderChatInterface();
        }
        const host = document.getElementById('flowee-messages')
            || document.getElementById('flowee-chat-log')
            || document.getElementById('flowee-chat-messages')
            || document.querySelector('.flowee-chat-body');
        if (!host) {
            if (window.Flowee) {
                window.Flowee.talk(true, 'Tap ALLOW in chat when you open FLOWEE, or type "notify on".', 'guide', [
                    { label: 'ALLOW', action: async () => { await this.requestPermission(); } },
                    { label: 'NOT NOW', action: () => { localStorage.setItem('cdf_notify_enabled', 'false'); } },
                ]);
            }
            return;
        }
        const denied = Notification.permission === 'denied';
        const box = document.createElement('div');
        box.id = 'flowee-notify-actions';
        box.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;padding:8px;';
        box.innerHTML = `
            <button type="button" id="flowee-notify-allow" style="flex:1;min-width:90px;padding:10px;background:#d4af37;color:#000;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:11px;">ALLOW</button>
            <button type="button" id="flowee-notify-later" style="flex:1;min-width:90px;padding:10px;background:transparent;color:#888;border:1px solid #444;border-radius:8px;cursor:pointer;font-size:11px;">NOT NOW</button>
            ${denied ? '<button type="button" id="flowee-notify-retry" style="flex:1;min-width:90px;padding:10px;background:transparent;color:#06b6d4;border:1px solid #06b6d4;border-radius:8px;cursor:pointer;font-size:11px;">ASK AGAIN</button>' : ''}
        `;
        host.appendChild(box);
        if (window.Flowee?.toggleChat && document.getElementById('flowee-chat')?.style.display === 'none') {
            window.Flowee.toggleChat();
        }
        document.getElementById('flowee-notify-allow')?.addEventListener('click', async () => {
            const ok = await this.requestPermission();
            box.remove();
            this.speak(ok
                ? 'Signal linked. I will ping you for quests and runes.'
                : 'Permission denied. I will ask again later — or type "notify on" when ready.', ok ? 'celebrate' : 'guide');
        });
        document.getElementById('flowee-notify-later')?.addEventListener('click', () => {
            box.remove();
            localStorage.setItem('cdf_notify_enabled', 'false');
            this.speak('Understood. I will remind you later. You can always type "notify on" in chat.');
        });
        document.getElementById('flowee-notify-retry')?.addEventListener('click', () => {
            localStorage.setItem('cdf_notify_last_ask', '0');
            box.remove();
            this.speak('I will ask again when the browser allows. You can also enable notifications in site settings.');
            setTimeout(() => this.promptViaFlowee(), 800);
        });
    }

    async requestPermission() {
        if (!('Notification' in window)) return false;
        const p = await Notification.requestPermission();
        this.enabled = p === 'granted';
        localStorage.setItem('cdf_notify_enabled', String(this.enabled));
        localStorage.setItem('cdf_notify_last_ask', String(Date.now()));
        return this.enabled;
    }

    send(title, body, tag) {
        if (!this.enabled || Notification.permission !== 'granted') return;
        try {
            new Notification(title, { body, icon: '/Assets/images/logo.png', tag: tag || 'cdf', silent: false });
        } catch (_) {}
        if (window.ImperialHUD) window.ImperialHUD.pushMessage(body, 'flowee');
    }

    questAccepted(title) { this.send('Quest accepted', title, 'quest'); }
    questComplete(title, xp) { this.send('Quest complete', `${title}: +${xp} XP`, 'quest-done'); }
    coopReminder(title, body) { this.send(title, body, 'coop'); }
    levelUp(level, feature) { this.send('Level up!', `Level ${level} — ${feature}`, 'level'); }
}

new FloweeNotifyAgent();
