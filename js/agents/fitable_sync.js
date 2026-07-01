/**
 * Fitable Daily Sync — steps / walking distance visible system-wide
 */
class FitableSyncAgent {
    constructor() {
        this.steps = 0;
        this.distanceM = 0;
        this.lastPos = null;
        this.watchId = null;
        this.syncTimer = null;
        this.todayKey = new Date().toISOString().slice(0, 10);
        window.FitableSync = this;
        this.init();
    }

    async init() {
        this.loadLocal();
        this.renderHUD();
        this.startTracking();
        this.syncTimer = setInterval(() => this.pushToCloud(), 120000);
        window.addEventListener('beforeunload', () => this.pushToCloud());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.loadLocal();
        });
    }

    loadLocal() {
        const key = `cdf_daily_${this.todayKey}`;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const d = JSON.parse(raw);
                this.steps = d.steps || 0;
                this.distanceM = d.distanceM || 0;
            }
        } catch (_) { /* ignore */ }
    }

    saveLocal() {
        const key = `cdf_daily_${this.todayKey}`;
        localStorage.setItem(key, JSON.stringify({
            steps: this.steps,
            distanceM: Math.round(this.distanceM),
            updated: Date.now()
        }));
        this.renderHUD();
    }

    renderHUD() {
        const el = document.getElementById('daily-steps-display');
        if (el) el.textContent = this.steps.toLocaleString();
        const dist = document.getElementById('daily-distance-display');
        if (dist) dist.textContent = (this.distanceM / 1000).toFixed(2) + ' km';
        window.dispatchEvent(new CustomEvent('DAILY_ACTIVITY_UPDATED', {
            detail: { steps: this.steps, distanceM: this.distanceM }
        }));
    }

    haversine(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const toRad = (d) => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    startTracking() {
        if (!navigator.geolocation) return;
        this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.onPosition(pos),
            () => { /* permission denied — local-only mode */ },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
    }

    onPosition(pos) {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 80) return;
        if (this.lastPos) {
            const d = this.haversine(this.lastPos.lat, this.lastPos.lng, latitude, longitude);
            if (d > 2 && d < 40) {
                this.distanceM += d;
                this.steps += Math.round(d / 0.75);
                this.saveLocal();
            }
        }
        this.lastPos = { lat: latitude, lng: longitude };
    }

    addSteps(n, reason) {
        this.steps += n;
        this.saveLocal();
        if (window.ImperialHUD) window.ImperialHUD.pushMessage(`+${n} steps · ${reason}`, 'flowee');
    }

    async pushToCloud() {
        const sb = window.supabaseClient;
        if (!sb) return;
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        await sb.from('daily_activity').upsert({
            id: session.user.id,
            activity_date: this.todayKey,
            steps: this.steps,
            distance_m: Math.round(this.distanceM),
            updated_at: new Date().toISOString()
        }, { onConflict: 'id,activity_date' });
    }

    async fetchCloud() {
        const sb = window.supabaseClient;
        if (!sb) return;
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        const { data } = await sb.from('daily_activity')
            .select('steps, distance_m')
            .eq('id', session.user.id)
            .eq('activity_date', this.todayKey)
            .maybeSingle();
        if (data && data.steps > this.steps) {
            this.steps = data.steps;
            this.distanceM = Number(data.distance_m) || 0;
            this.saveLocal();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.supabaseClient) new FitableSyncAgent();
    else window.addEventListener('SUPABASE_READY', () => new FitableSyncAgent(), { once: true });
});
