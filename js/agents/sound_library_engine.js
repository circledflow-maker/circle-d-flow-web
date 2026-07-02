/**
 * Sound Library Engine — uploads, radio queue, Mihaly Flow gamification
 */
window.SoundLibraryEngine = {
    async loadTracks() {
        const local = JSON.parse(localStorage.getItem('cdf_sound_library') || '[]');
        if (!window.supabaseClient) return local;
        try {
            const { data } = await window.supabaseClient.from('sound_tracks').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(30);
            if (data?.length) return data;
        } catch (e) { /* table may not exist */ }
        return local;
    },

    async uploadTrack(file, meta) {
        const entry = {
            id: 's_' + Date.now(),
            title: meta.title || file.name,
            artist: meta.artist || 'Navigator',
            role: meta.role || 'producer',
            url: URL.createObjectURL(file),
            at: new Date().toISOString(),
            plays: 0,
            licensed: meta.licensed !== false,
        };
        const list = JSON.parse(localStorage.getItem('cdf_sound_library') || '[]');
        list.unshift(entry);
        localStorage.setItem('cdf_sound_library', JSON.stringify(list.slice(0, 40)));
        return entry;
    },

    radioQueue() {
        return JSON.parse(localStorage.getItem('cdf_radio_queue') || '[]');
    },

    addToRadio(trackId) {
        const q = this.radioQueue();
        if (!q.includes(trackId)) {
            q.push(trackId);
            localStorage.setItem('cdf_radio_queue', JSON.stringify(q));
        }
    },

    grantFlowUpload() {
        if (window.QuestEngine) window.QuestEngine.grantReward('LQ-S01', 45, 'Sound upload');
        if (window.FloweeReward) window.FloweeReward.xpToast('Track added to library', 45);
    },
};
