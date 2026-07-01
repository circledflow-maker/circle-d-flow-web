/**
 * Adinkra Sync — localStorage cdf_adinkra_runes ↔ Supabase user_runes
 */
(function () {
    async function syncToCloud() {
        if (!window.supabaseClient) return;
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        const local = JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}');
        const rows = Object.entries(local)
            .map(([venueId, data]) => ({
                user_id: user.id,
                rune_id: data.rune || venueId,
                venue_id: venueId,
                tier: data.tier || 'bronze',
                sphere: data.sphere || 'Map',
                rune_name: data.name || window.getAdinkraMeta?.(data.rune)?.name,
            }))
            .filter((r) => window.ADINKRA_CATALOG?.[r.rune_id] || r.rune_id);

        if (!rows.length) return;

        try {
            const { error } = await window.supabaseClient
                .from('user_runes')
                .upsert(rows, { onConflict: 'user_id,venue_id,tier', ignoreDuplicates: false });
            if (error) console.warn('[AdinkraSync]', error.message);
        } catch (e) {
            console.warn('[AdinkraSync] offline', e);
        }
    }

    async function syncFromCloud() {
        if (!window.supabaseClient) return;
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        try {
            const { data, error } = await window.supabaseClient
                .from('user_runes')
                .select('venue_id, rune_id, tier, sphere')
                .eq('user_id', user.id);
            if (error || !data?.length) return;

            const local = JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}');
            data.forEach((r) => {
                const meta = window.getAdinkraMeta?.(r.rune_id);
                local[r.venue_id] = {
                    tier: r.tier,
                    rune: r.rune_id,
                    name: meta?.name || r.rune_id,
                    sphere: r.sphere,
                    at: Date.now(),
                };
            });
            localStorage.setItem('cdf_adinkra_runes', JSON.stringify(local));
            window.dispatchEvent(new CustomEvent('RUNE_COLLECTED'));
        } catch (e) {
            console.warn('[AdinkraSync] pull failed', e);
        }
    }

    window.AdinkraSync = { syncToCloud, syncFromCloud };

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => syncFromCloud(), 2000);
    });
    window.addEventListener('RUNE_COLLECTED', () => syncToCloud());
})();
