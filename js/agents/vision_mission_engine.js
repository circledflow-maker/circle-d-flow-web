/**
 * Vision Mission Engine — daily photo missions + upload sync
 */
window.VisionMissionEngine = {
    missions: [
        { id: 'graffiti', title: 'Street Art Pulse', prompt: 'Capture graffiti or mural within 500m of your position.', rune: 'aya', xp: 40 },
        { id: 'plants', title: 'Green Resonance', prompt: 'Photograph palms, plants, or garden detail — Secret Garden bonus.', rune: 'fihankra', xp: 35 },
        { id: 'building', title: 'Lisbon Facade', prompt: 'Shoot a historic building facade or azulejo pattern.', rune: 'dwennimmen', xp: 45 },
        { id: 'locals', title: 'Local Soul', prompt: 'Respectful portrait or candid of a local artisan (ask permission).', rune: 'nkonsonnkonson', xp: 50 },
        { id: 'place', title: 'Place Tag', prompt: 'Tag your photo to the nearest Atlas venue pin.', rune: 'sankofa', xp: 30 },
    ],

    dailyMission() {
        const day = new Date().toISOString().slice(0, 10);
        const key = 'cdf_vision_daily_' + day;
        let pick = localStorage.getItem(key);
        if (!pick) {
            pick = this.missions[Math.floor(Math.random() * this.missions.length)].id;
            localStorage.setItem(key, pick);
        }
        return this.missions.find((m) => m.id === pick) || this.missions[0];
    },

    async loadUploads() {
        const local = JSON.parse(localStorage.getItem('cdf_vision_uploads') || '[]');
        if (!window.supabaseClient) return local;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return local;
            const { data, error } = await window.supabaseClient
                .from('theater_media')
                .select('*')
                .eq('uploader_id', user.id)
                .order('created_at', { ascending: false })
                .limit(24);
            if (error) {
                if (error.code !== 'PGRST205' && error.code !== '42P01') {
                    console.warn('[VisionMission] theater_media:', error.message);
                }
                return local;
            }
            if (data?.length) {
                return data.map((r) => ({
                    id: r.id,
                    url: r.media_url,
                    title: r.title,
                    at: r.created_at,
                    source: 'supabase',
                    type: r.media_type,
                }));
            }
        } catch (e) { /* offline */ }
        return local;
    },

    async saveUpload(file, title) {
        const entry = { id: 'v_' + Date.now(), title: title || file.name, at: new Date().toISOString(), source: 'local' };
        if (file.type.startsWith('image/')) {
            entry.url = URL.createObjectURL(file);
            entry.type = 'image';
        } else {
            entry.url = URL.createObjectURL(file);
            entry.type = 'video';
        }
        const list = JSON.parse(localStorage.getItem('cdf_vision_uploads') || '[]');
        list.unshift(entry);
        localStorage.setItem('cdf_vision_uploads', JSON.stringify(list.slice(0, 50)));
        if (window.supabaseClient) {
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    const path = `vision/${user.id}/${Date.now()}_${file.name}`;
                    const { data: up, error: upErr } = await window.supabaseClient.storage
                        .from('sanctuary_media')
                        .upload(path, file);
                    if (!upErr && up) {
                        const { data: pub } = window.supabaseClient.storage.from('sanctuary_media').getPublicUrl(path);
                        const { data: profile } = await window.supabaseClient
                            .from('profiles')
                            .select('username')
                            .eq('id', user.id)
                            .maybeSingle();
                        const row = {
                            title: entry.title,
                            media_url: pub.publicUrl,
                            uploader_id: user.id,
                            uploader_name: profile?.username || user.email?.split('@')[0] || 'Navigator',
                            media_type: entry.type,
                        };
                        const { error: insErr } = await window.supabaseClient.from('theater_media').insert([row]);
                        if (insErr && insErr.code !== 'PGRST205' && insErr.code !== '42P01') {
                            console.warn('[VisionMission] insert:', insErr.message);
                        }
                    }
                }
            } catch (e) { console.warn('[VisionMission]', e.message); }
        }
        return entry;
    },

    async completeDaily() {
        const m = this.dailyMission();
        const doneKey = 'cdf_vision_done_' + new Date().toISOString().slice(0, 10);
        if (localStorage.getItem(doneKey)) return;
        localStorage.setItem(doneKey, m.id);
        if (window.QuestEngine) await window.QuestEngine.grantReward('LQ-V01', m.xp, m.title);
        if (window.FloweeReward) await window.FloweeReward.xpToast(`Vision mission: ${m.title}`, m.xp);
    },
};
