/**
 * World Access — level, trust, karma gates with Flowee explanations
 */
class WorldAccessAgent {
    constructor() {
        this.profile = null;
        this.checkedIn = JSON.parse(localStorage.getItem('cdf_daily_checkins') || '{}');
        window.WorldAccess = this;
        window.addEventListener('SUPABASE_READY', () => this.loadProfile());
        document.addEventListener('DOMContentLoaded', () => this.loadProfile());
        window.addEventListener('POINTS_SYNCED', (e) => { this.profile = e.detail; });
    }

    async loadProfile() {
        const sb = window.supabaseClient;
        if (!sb) return;
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (data) {
            this.profile = data;
            await this.ensureAdminMaster(session.user, data);
        }
    }

  /** AdminMaster: all sphere access, normal XP/level progression */
    isAdminMaster() {
        if (localStorage.getItem('cdf_role') === 'AdminMaster') return true;
        const fc = (this.profile?.flow_class || '').toLowerCase();
        const role = (this.profile?.role || '').toLowerCase();
        if (fc === 'adminmaster' || role === 'admin_master' || role === 'adminmaster') return true;
        const un = (this.profile?.username || '').toLowerCase();
        const em = (this.profile?.email || '').toLowerCase();
        if (un === 'dark' || em === 'circle.d.flow@gmail.com') return true;
        return false;
    }

    async ensureAdminMaster(user, profile) {
        const un = (profile?.username || user.email?.split('@')[0] || '').toLowerCase();
        const em = (user.email || '').toLowerCase();
        const isOwner = un === 'dark' || em === 'circle.d.flow@gmail.com';
        if (!isOwner) return;
        localStorage.setItem('cdf_role', 'AdminMaster');
        window.CDF_ADMIN_MASTER = true;
        if ((profile.flow_class || '').toLowerCase() !== 'adminmaster') {
            try {
                await window.supabaseClient.from('profiles')
                    .update({ flow_class: 'AdminMaster' })
                    .eq('id', user.id);
                this.profile = { ...profile, flow_class: 'AdminMaster' };
            } catch (_) { /* RLS may block — client flag still works */ }
        }
    }

    getLevel() {
        return this.profile?.level || Number(localStorage.getItem('userLevel')) || 1;
    }

    getTrust() {
        return this.profile?.karma || 0;
    }

    getExp() {
        return this.profile?.exp || 0;
    }

    ruleFor(url) {
        const file = (url || '').split('?')[0].split('/').pop();
        for (const sphere of Object.values(window.WORLD_ROLES || {})) {
            const r = sphere.destinations?.[file];
            if (r) return { ...r, sphere: sphere.label, file };
        }
        return null;
    }

    canAccess(url, planetId, opt) {
        if (this.isAdminMaster()) return true;
        const rule = this.ruleFor(url);
        if (!rule) return true;
        const lvl = this.getLevel();
        const trust = this.getTrust();
        const karma = this.profile?.karma || 0;

        if (lvl < (rule.minLevel || 1)) {
            this.block(`Access restricted. ${rule.desc || opt?.l} requires Level ${rule.minLevel}. You are Level ${lvl}. Complete Atlas quests to level up.`, planetId);
            return false;
        }
        if (trust < (rule.trust || 0)) {
            this.block(`Trust too low. ${rule.desc || opt?.l} needs ${rule.trust} Karma trust. You have ${trust}. Help the community to earn trust.`, planetId);
            return false;
        }
        if (rule.karma && karma < rule.karma) {
            this.block(`Not enough Karma. ${opt?.l} costs ${rule.karma} Karma. You have ${karma}.`, planetId);
            return false;
        }
        return true;
    }

    block(message, planetId) {
        if (window.Flowee) window.Flowee.talk(true, message, 'warn');
        if (window.Pusher) window.Pusher.showToast('ACCESS RESTRICTED', 'error');
        const guide = window.FLOWEE_WORLD_GUIDES?.[planetId];
        if (guide && window.Flowee) {
            setTimeout(() => window.Flowee.talk(true, `${guide.title}: ${guide.steps[0]}`, 'guide'), 2500);
        }
    }

    async dailyCheckIn(sphereId) {
        const key = `${sphereId}_${new Date().toISOString().slice(0, 10)}`;
        if (this.checkedIn[key]) return;
        this.checkedIn[key] = true;
        localStorage.setItem('cdf_daily_checkins', JSON.stringify(this.checkedIn));
        const xpMap = { Quest: 10, HighPalast: 5, Academy: 5 };
        const xp = xpMap[sphereId] || 5;
        if (window.PointsSync) await window.PointsSync.grantExp(xp, `${sphereId} daily visit`);
        if (window.Flowee) window.Flowee.talk(true, `+${xp} XP for your daily ${sphereId} check-in.`, 'celebrate');
    }

    handleFloweeKeyword(text) {
        const t = (text || '').toLowerCase();
        for (const [id, guide] of Object.entries(window.FLOWEE_WORLD_GUIDES || {})) {
            if (guide.keywords?.some((k) => t.includes(k))) {
                const steps = guide.steps.join('\n');
                if (window.Flowee) window.Flowee.talk(true, `${guide.title}:\n${steps}`, 'guide');
                const dest = this.keywordToUrl(t);
                if (dest && this.canAccess(dest, id, {})) {
                    setTimeout(() => { window.location.href = window.CdfNav.to(dest); }, 3000);
                }
                return true;
            }
        }
        return false;
    }

    keywordToUrl(text) {
        const map = {
            atlas: 'quest_map.html', codex: 'quest_board.html', scriptorium: 'codex.html',
            brotherhood: 'hall_of_legends.html', calendar: 'calendar.html',
            palast: 'high_palast.html', museum: 'palast_museum.html', treasury: 'palast_treasury.html',
            bibliothek: 'library.html', library: 'palast_library.html', academy: 'academy.html',
        };
        for (const [k, v] of Object.entries(map)) {
            if (text.includes(k)) return v;
        }
        return null;
    }
}

window.CdfNav = {
    inPages() {
        return window.location.pathname.includes('/pages/');
    },
    to(page) {
        const clean = (page || '').replace(/^\.\.\//, '').replace(/^pages\//, '');
        return this.inPages() ? clean : `pages/${clean}`;
    },
    go(page) {
        window.location.href = this.to(page);
    },
};

new WorldAccessAgent();
