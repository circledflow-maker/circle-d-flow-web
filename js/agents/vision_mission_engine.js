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

    PLACEHOLDER: '../Assets/kitchens/akwabalx/hero-1.jpg',

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

    resolveMediaUrl(url) {
        if (!url || typeof url !== 'string') return null;
        const trimmed = url.trim();
        if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return null;
        if (window.supabaseClient && trimmed.includes('/')) {
            const { data } = window.supabaseClient.storage.from('sanctuary_media').getPublicUrl(trimmed);
            return data?.publicUrl || null;
        }
        return null;
    },

    async loadUploads() {
        const local = JSON.parse(localStorage.getItem('cdf_vision_uploads') || '[]')
            .map((item) => ({
                ...item,
                url: this.resolveMediaUrl(item.url || item.media_url) || (item.dataUrl ? item.dataUrl : null),
            }))
            .filter((item) => item.url);

        if (!window.supabaseClient) return local;

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return local;

            const { data, error } = await window.supabaseClient
                .from('theater_media')
                .select('*')
                .eq('uploader_id', String(user.id))
                .order('created_at', { ascending: false })
                .limit(24);

            if (error) {
                if (error.code !== 'PGRST205' && error.code !== '42P01') {
                    console.warn('[VisionMission] theater_media:', error.message);
                }
                return local;
            }

            const remote = (data || []).map((r) => {
                const url = this.resolveMediaUrl(r.media_url);
                return url ? {
                    id: r.id,
                    url,
                    title: r.title,
                    at: r.created_at,
                    source: 'supabase',
                    type: r.media_type || 'image',
                } : null;
            }).filter(Boolean);

            const seen = new Set();
            return [...remote, ...local].filter((item) => {
                const key = item.url + (item.title || '');
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        } catch (e) {
            return local;
        }
    },

    async fileToDataUrl(file) {
        if (!file.type.startsWith('image/') || file.size > 450000) return null;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async saveUpload(file, title) {
        const dataUrl = await this.fileToDataUrl(file);
        const entry = {
            id: 'v_' + Date.now(),
            title: title || file.name,
            at: new Date().toISOString(),
            source: 'local',
            type: file.type.startsWith('video/') ? 'video' : 'image',
            url: dataUrl || URL.createObjectURL(file),
            dataUrl: dataUrl || undefined,
        };

        const list = JSON.parse(localStorage.getItem('cdf_vision_uploads') || '[]');
        list.unshift(entry);
        localStorage.setItem('cdf_vision_uploads', JSON.stringify(list.slice(0, 50).map((i) => ({
            id: i.id,
            title: i.title,
            at: i.at,
            source: i.source,
            type: i.type,
            url: i.dataUrl || i.url,
            dataUrl: i.dataUrl,
        }))));

        if (window.supabaseClient) {
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    const path = `vision/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                    const { error: upErr } = await window.supabaseClient.storage
                        .from('sanctuary_media')
                        .upload(path, file, { upsert: false });

                    let publicUrl = null;
                    if (!upErr) {
                        const { data: pub } = window.supabaseClient.storage.from('sanctuary_media').getPublicUrl(path);
                        publicUrl = pub?.publicUrl;
                    }

                    if (publicUrl) {
                        const { data: profile } = await window.supabaseClient
                            .from('profiles')
                            .select('username')
                            .eq('id', user.id)
                            .maybeSingle();
                        const row = {
                            title: entry.title,
                            media_url: publicUrl,
                            uploader_id: String(user.id),
                            uploader_name: profile?.username || user.email?.split('@')[0] || 'Navigator',
                            media_type: entry.type,
                        };
                        const { error: insErr } = await window.supabaseClient.from('theater_media').insert([row]);
                        if (insErr && insErr.code !== 'PGRST205' && insErr.code !== '42P01') {
                            console.warn('[VisionMission] insert:', insErr.message);
                        } else {
                            entry.url = publicUrl;
                            entry.source = 'supabase';
                        }
                    }
                }
            } catch (e) {
                console.warn('[VisionMission]', e.message);
            }
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
