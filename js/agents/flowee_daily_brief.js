/**
 * Flowee Daily Brief — first login of the day bubbles (English)
 */
class FloweeDailyBrief {
    constructor() {
        this.queue = [];
        this.playing = false;
        window.FloweeDailyBrief = this;
        document.addEventListener('DOMContentLoaded', () => this.maybeRun());
        window.addEventListener('SUPABASE_READY', () => this.maybeRun());
    }

    todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    alreadyShown() {
        return localStorage.getItem('flowee_brief_date') === this.todayKey();
    }

    markShown() {
        localStorage.setItem('flowee_brief_date', this.todayKey());
    }

    async maybeRun() {
        if (this.alreadyShown()) return;
        if (window.location.pathname.includes('dashboard') && window.FloweeDashboardGuide) return;
        if (!window.Flowee || typeof window.Flowee.talk !== 'function') {
            setTimeout(() => this.maybeRun(), 1500);
            return;
        }
        await this.buildQueue();
        if (this.queue.length) {
            this.markShown();
            this.playQueue();
        }
    }

    async buildQueue() {
        this.queue = [
            'Good morning, Navigator. Your Lisbon Atlas is live — tap a sphere for its world hub.',
            'Daily Flow: walk the city to grow your step count. It syncs to your Fitable profile.'
        ];

        try {
            const res = await fetch('../data/system_health_latest.json?t=' + Date.now());
            if (res.ok) {
                const report = await res.json();
                if (report.fixed_count > 0) {
                    this.queue.push(`${report.fixed_count} system issue(s) were healed overnight.`);
                }
                if (report.errors_open > 0) {
                    this.queue.push(`${report.errors_open} report(s) still under review — thank you for your signals.`);
                }
            }
        } catch (_) { /* offline */ }

        if (window.LISBON_QUESTS) {
            const open = window.LISBON_QUESTS.filter(q => q.type !== 'system').length;
            this.queue.push(`${open} location missions are active on the Atlas. Codex awaits.`);
        }
    }

    playQueue() {
        if (this.playing || !this.queue.length) return;
        this.playing = true;
        let i = 0;
        const next = () => {
            if (i >= this.queue.length) { this.playing = false; return; }
            window.Flowee.talk(true, this.queue[i], i === 0 ? 'celebrate' : 'guide');
            i++;
            setTimeout(next, 8000);
        };
        setTimeout(next, 2000);
    }
}

new FloweeDailyBrief();
