/**
 * Points Sync — unify EXP, Flow Credits, Karma across modules
 */
class PointsSyncAgent {
    constructor() {
        this.cache = { exp: 0, level: 1, karma: 0, fp: 0, flow_credits: 0 };
        window.PointsSync = this;
        window.addEventListener('SUPABASE_READY', () => this.refresh());
        document.addEventListener('DOMContentLoaded', () => this.refresh());
        window.addEventListener('PROFILE_UPDATED', (e) => {
            if (e.detail) this.applyProfile(e.detail);
        });
    }

    applyProfile(p) {
        this.cache = {
            exp: p.exp || 0,
            level: p.level || 1,
            karma: p.karma || 0,
            fp: p.fp || p.flow_credits || 0,
            flow_credits: p.flow_credits || p.fp || 0,
            username: p.username,
            id: p.id,
        };
        this.renderHUD();
    }

    async refresh() {
        const sb = window.supabaseClient;
        if (!sb) return;
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;

        const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();

        const merged = {
            ...(profile || {}),
            id: session.user.id,
            fp: profile?.flow_credits || profile?.fp || 0,
            flow_credits: profile?.flow_credits || profile?.fp || 0,
        };
        this.applyProfile(merged);
        window.userProfile = merged;
        window.dispatchEvent(new CustomEvent('POINTS_SYNCED', { detail: merged }));
        return merged;
    }

    renderHUD() {
        const map = {
            'sync-exp': this.cache.exp,
            'sync-level': this.cache.level,
            'sync-karma': this.cache.karma,
            'sync-flow': this.cache.flow_credits || this.cache.fp,
            'academy-sync-exp': this.cache.exp,
            'academy-sync-flow': this.cache.flow_credits || this.cache.fp,
            'brotherhood-my-exp': this.cache.exp,
        };
        Object.entries(map).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = typeof val === 'number' ? val.toLocaleString() : val;
        });
    }

    async grantExp(amount, reason) {
        const sb = window.supabaseClient;
        if (!sb) return;
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        const { data: profile } = await sb.from('profiles').select('exp').eq('id', session.user.id).single();
        const newExp = (profile?.exp || 0) + amount;
        await sb.from('profiles').update({ exp: newExp }).eq('id', session.user.id);
        await this.refresh();
        if (window.Pusher) window.Pusher.showToast(`+${amount} XP · ${reason}`, 'xp');
    }
}

new PointsSyncAgent();
