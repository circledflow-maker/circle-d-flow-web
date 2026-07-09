/**
 * Vision Cinema Engine — GPS Cinema Stages on the Atlas
 * 50m radius per stage; uploads only when on-site; proximity XP for visitors
 */
window.VisionCinemaEngine = {
    RADIUS_M: 50,
    stages: [],
    markers: {},
    LOCAL_KEY: 'cdf_cinema_stages',
    VISIT_KEY: 'cdf_cinema_visits',

    haversine(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    loadLocal() {
        try {
            return JSON.parse(localStorage.getItem(this.LOCAL_KEY) || '[]');
        } catch (_) {
            return [];
        }
    },

    saveLocal(list) {
        localStorage.setItem(this.LOCAL_KEY, JSON.stringify(list.slice(0, 200)));
        this.stages = list;
    },

    async loadStages() {
        const local = this.loadLocal();
        this.stages = local;
        const sb = window.supabaseClient;
        if (!sb) return this.stages;
        try {
            const { data, error } = await sb.from('cinema_stages').select('*').order('created_at', { ascending: false }).limit(100);
            if (!error && data?.length) {
                const merged = [...data];
                local.forEach((s) => {
                    if (!merged.find((m) => m.id === s.id)) merged.push(s);
                });
                this.stages = merged;
            }
        } catch (_) { /* offline */ }
        return this.stages;
    },

    canCreateAt(lat, lng, excludeId) {
        return !this.stages.some((s) => {
            if (excludeId && s.id === excludeId) return false;
            return this.haversine(lat, lng, s.lat, s.lng) < this.RADIUS_M;
        });
    },

    nearestStage(lat, lng) {
        let best = null;
        let bestD = Infinity;
        this.stages.forEach((s) => {
            const d = this.haversine(lat, lng, s.lat, s.lng);
            if (d < bestD) { bestD = d; best = s; }
        });
        return best ? { stage: best, distanceM: bestD } : null;
    },

    isNearStage(lat, lng, stage) {
        if (!stage) return false;
        return this.haversine(lat, lng, stage.lat, stage.lng) <= this.RADIUS_M;
    },

    stageUrl(stageId) {
        const base = window.location.origin + window.location.pathname.replace(/[^/]+$/, '');
        return `${base}quest_map.html?cinema=${encodeURIComponent(stageId)}`;
    },

    async getPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error('GPS unavailable')); return; }
            navigator.geolocation.getCurrentPosition(
                (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
                (e) => reject(e),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 8000 }
            );
        });
    },

    async uploadMedia(file) {
        const sb = window.supabaseClient;
        if (!sb) return URL.createObjectURL(file);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return URL.createObjectURL(file);
        const path = `cinema/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error } = await sb.storage.from('sanctuary_media').upload(path, file);
        if (error) {
            console.warn('[VisionCinema] storage upload:', error.message);
            return URL.createObjectURL(file);
        }
        const { data: pub } = sb.storage.from('sanctuary_media').getPublicUrl(path);
        return pub.publicUrl;
    },

    async createStage(file, title, lat, lng) {
        if (!this.canCreateAt(lat, lng)) {
            throw new Error(`Another Cinema Stage is within ${this.RADIUS_M}m. Choose a different spot.`);
        }
        const mediaUrl = await this.uploadMedia(file);
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        let creatorId = null;
        let creatorName = 'Navigator';
        const sb = window.supabaseClient;
        if (sb) {
            const { data: { user } } = await sb.auth.getUser();
            if (user) {
                creatorId = user.id;
                const { data: profile } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle();
                creatorName = profile?.username || user.email?.split('@')[0] || creatorName;
            }
        }
        const stage = {
            id: 'cinema_' + Date.now(),
            creator_id: creatorId,
            creator_name: creatorName,
            title: title || 'Cinema Stage',
            lat, lng,
            cover_url: mediaUrl,
            media_type: mediaType,
            created_at: new Date().toISOString(),
        };
        if (sb && creatorId) {
            const { data, error } = await sb.from('cinema_stages').insert([{
                creator_id: creatorId,
                creator_name: creatorName,
                title: stage.title,
                lat, lng,
                cover_url: mediaUrl,
                media_type: mediaType,
            }]).select().single();
            if (!error && data) stage.id = data.id;
        }
        const list = this.loadLocal();
        list.unshift(stage);
        this.saveLocal(list);
        if (window.PointsSync) await window.PointsSync.grantExp(25, 'Cinema Stage planted');
        if (window.FloweeReward) window.FloweeReward.xpToast('Cinema Stage live on Atlas', 25);
        window.dispatchEvent(new CustomEvent('CINEMA_STAGE_CREATED', { detail: stage }));
        return stage;
    },

    async addUploadToStage(stageId, file, lat, lng, caption) {
        const stage = this.stages.find((s) => s.id === stageId);
        if (!stage) throw new Error('Stage not found');
        if (!this.isNearStage(lat, lng, stage)) {
            throw new Error(`You must be within ${this.RADIUS_M}m to upload to this Cinema Stage.`);
        }
        const mediaUrl = await this.uploadMedia(file);
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const sb = window.supabaseClient;
        if (sb) {
            const { data: { user } } = await sb.auth.getUser();
            if (user) {
                await sb.from('cinema_stage_uploads').insert([{
                    stage_id: stageId,
                    user_id: user.id,
                    media_url: mediaUrl,
                    media_type: mediaType,
                    caption: caption || '',
                }]);
            }
        }
        const uploads = JSON.parse(localStorage.getItem('cdf_cinema_uploads_' + stageId) || '[]');
        uploads.unshift({ media_url: mediaUrl, media_type: mediaType, caption, at: Date.now() });
        localStorage.setItem('cdf_cinema_uploads_' + stageId, JSON.stringify(uploads.slice(0, 30)));
        if (window.PointsSync) await window.PointsSync.grantExp(15, 'Cinema upload on-site');
        return { mediaUrl, mediaType };
    },

    async addComment(stageId, body) {
        const stage = this.stages.find((s) => s.id === stageId);
        if (!stage || !body?.trim()) return;
        const sb = window.supabaseClient;
        if (sb) {
            const { data: { user } } = await sb.auth.getUser();
            if (user) {
                await sb.from('cinema_stage_comments').insert([{ stage_id: stageId, user_id: user.id, body: body.trim() }]);
            }
        }
        const key = 'cdf_cinema_comments_' + stageId;
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.unshift({ body: body.trim(), at: Date.now() });
        localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    },

    visitKey(stageId) {
        return `${stageId}_${new Date().toISOString().slice(0, 10)}`;
    },

    async checkProximityVisit(lat, lng) {
        const visits = JSON.parse(localStorage.getItem(this.VISIT_KEY) || '{}');
        for (const stage of this.stages) {
            const d = this.haversine(lat, lng, stage.lat, stage.lng);
            if (d > this.RADIUS_M) continue;
            const vk = this.visitKey(stage.id);
            if (visits[vk]) continue;
            visits[vk] = true;
            localStorage.setItem(this.VISIT_KEY, JSON.stringify(visits));
            const creator = stage.creator_name || 'a Navigator';
            const msg = `Cinema Stage "${stage.title}" by ${creator} — you're in the frame! +12 XP`;
            if (window.PointsSync) await window.PointsSync.grantExp(12, 'Cinema proximity');
            if (window.Pusher) window.Pusher.showToast(msg, 'xp');
            else if (window.Flowee) window.Flowee.talk(true, msg, 'celebrate');
            if (window.FloweeNotify) {
                window.FloweeNotify.send('Cinema Stage nearby', `${stage.title} · planted by ${creator}`);
            }
            const sb = window.supabaseClient;
            if (sb) {
                const { data: { user } } = await sb.auth.getUser();
                if (user) {
                    await sb.from('cinema_stage_visits').insert([{ stage_id: stage.id, visitor_id: user.id }]);
                }
            }
        }
    },

    renderOnMap(map) {
        if (!map || !window.L) return;
        Object.values(this.markers).forEach((m) => map.removeLayer(m));
        this.markers = {};
        this.stages.forEach((s) => {
            const icon = L.divIcon({
                className: 'cinema-stage-pin',
                html: `<div style="width:22px;height:22px;border-radius:4px;background:linear-gradient(135deg,#a855f7,#d4af37);border:2px solid #fff;box-shadow:0 0 12px rgba(168,85,247,0.9);display:flex;align-items:center;justify-content:center;font-size:10px">🎬</div>`,
                iconSize: [22, 22],
            });
            const m = L.marker([s.lat, s.lng], { icon }).addTo(map);
            const dist = window.AtlasEngine?.userPos
                ? Math.round(this.haversine(window.AtlasEngine.userPos.lat, window.AtlasEngine.userPos.lng, s.lat, s.lng))
                : null;
            const qrLink = this.stageUrl(s.id);
            m.bindPopup(`
                <div style="font-family:monospace;min-width:200px">
                    <strong style="color:#a855f7">🎬 ${s.title}</strong>
                    <p style="font-size:10px;color:#ccc">by ${s.creator_name || 'Navigator'}</p>
                    ${s.cover_url ? `<img src="${s.cover_url}" style="width:100%;max-height:80px;object-fit:cover;border-radius:6px;margin:6px 0">` : ''}
                    <p style="font-size:10px;color:#06b6d4">${dist != null ? dist + 'm away' : 'Enable GPS'}</p>
                    <a href="${qrLink}" style="display:block;margin-top:8px;padding:8px;background:#a855f7;color:#fff;text-align:center;border-radius:6px;font-size:10px;text-decoration:none">OPEN CINEMA · QR</a>
                    <button onclick="VisionCinemaEngine.promptComment('${s.id}')" style="width:100%;margin-top:6px;padding:6px;background:transparent;border:1px solid #666;color:#aaa;border-radius:6px;font-size:10px;cursor:pointer">LEAVE COMMENT</button>
                </div>`);
            m.on('click', () => {
                sessionStorage.setItem('cdf_cinema_focus', s.id);
            });
            this.markers[s.id] = m;
        });
    },

    promptComment(stageId) {
        const body = prompt('Comment on this Cinema Stage:');
        if (body) this.addComment(stageId, body);
    },

    async tagPendingUpload(file, title) {
        let pos;
        try {
            pos = await this.getPosition();
        } catch (e) {
            return { skipped: true, reason: 'GPS unavailable — archive saved without Cinema tag.' };
        }
        if (pos.accuracy > 150) {
            return { skipped: true, reason: 'GPS accuracy low — archive saved. Move outdoors to plant a Cinema Stage.' };
        }
        const near = this.nearestStage(pos.lat, pos.lng);
        if (near && near.distanceM <= this.RADIUS_M) {
            return this.addUploadToStage(near.stage.id, file, pos.lat, pos.lng, title);
        }
        if (!this.canCreateAt(pos.lat, pos.lng)) {
            return { skipped: true, reason: `Another Cinema Stage is within ${this.RADIUS_M}m — archive saved.` };
        }
        return this.createStage(file, title, pos.lat, pos.lng);
    },

    focusFromQuery() {
        const id = new URLSearchParams(window.location.search).get('cinema')
            || sessionStorage.getItem('cdf_cinema_focus');
        if (!id) return;
        const stage = this.stages.find((s) => s.id === id);
        if (stage && window.AtlasEngine?.map) {
            window.AtlasEngine.map.flyTo([stage.lat, stage.lng], 17, { duration: 1.2 });
            this.markers[id]?.openPopup();
        }
        sessionStorage.removeItem('cdf_cinema_focus');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    window.VisionCinemaEngine.loadStages().then(() => {
        if (window.AtlasEngine?.map) window.VisionCinemaEngine.renderOnMap(window.AtlasEngine.map);
    });
});

window.addEventListener('CINEMA_STAGE_CREATED', () => {
    if (window.AtlasEngine?.map) window.VisionCinemaEngine.renderOnMap(window.AtlasEngine.map);
});
