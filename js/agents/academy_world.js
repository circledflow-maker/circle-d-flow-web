/**
 * Academy World — participant manga roster, portfolios, media player
 */
class AcademyWorldAgent {
    constructor() {
        this.participants = [];
        this.current = null;
        this.currentMedia = null;
        this.filter = 'all';
        this.userId = null;
        window.AcademyWorld = this;
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        await this.waitSupabase();
        await this.loadRoster();
        this.bindUI();
        this.renderGrid();
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('user');
        if (uid) setTimeout(() => this.openDetail(uid), 600);
        if (window.PointsSync) await window.PointsSync.refresh();
        setTimeout(() => {
            if (window.Flowee) {
                window.Flowee.talk(true, 'Welcome to the Academy. Tap a manga panel to open a Navigator portfolio — locations, role, and compressed media await.', 'guide');
            }
        }, 1200);
    }

    waitSupabase() {
        return new Promise((resolve) => {
            if (window.supabaseClient) return resolve();
            window.addEventListener('SUPABASE_READY', resolve, { once: true });
            setTimeout(resolve, 2000);
        });
    }

    async loadRoster() {
        const roster = [...(window.ACADEMY_PARTICIPANTS || [])];
        const sb = window.supabaseClient;
        if (sb) {
            const { data: { session } } = await sb.auth.getSession();
            if (session) this.userId = session.user.id;
            try {
                const { data: profiles } = await sb.from('profiles').select('*').order('exp', { ascending: false }).limit(50);
                (profiles || []).forEach((p) => {
                    const meta = this.parseMeta(p);
                    const locations = meta.visited_locations || meta.locations || [];
                    roster.push({
                        id: p.id,
                        name: p.username || 'Navigator',
                        role: p.role_calling || p.guild || 'Navigator',
                        flow: meta.flow || 'Explorer-Flow',
                        locations: locations.length ? locations : this.sampleLocations(p.username),
                        type: 'navigator',
                        profile: p,
                        bio: p.bio || '',
                        exp: p.exp || 0,
                        karma: p.karma || 0,
                    });
                });
            } catch (e) {
                console.warn('[Academy] profiles offline', e);
            }
        }
        this.participants = this.dedupeRoster(roster);
    }

    parseMeta(p) {
        if (!p.metadata) return {};
        if (typeof p.metadata === 'object') return p.metadata;
        try { return JSON.parse(p.metadata); } catch (_) { return {}; }
    }

    sampleLocations(name) {
        const venues = window.LISBON_ACADEMY_VENUES || [];
        const hash = (name || '').length;
        return venues.slice(0, 2 + (hash % 3));
    }

    dedupeRoster(list) {
        const seen = new Set();
        return list.filter((p) => {
            const key = (p.name || '').toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    getPortfolioFor(participant) {
        const data = window.AkademieData || [];
        const name = (participant.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = data.find((a) => {
            const n = (a.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return n && (n.includes(name) || name.includes(n));
        });
        if (!match) return [];
        const files = [];
        (match.chapters || []).forEach((ch) => {
            (ch.files || []).slice(0, 12).forEach((f) => {
                files.push({ ...f, chapter: ch.title });
            });
        });
        return files.slice(0, 9);
    }

    mediaUrl(file, thumb) {
        const id = file.id;
        if (!id) return '';
        if (file.type === 'video') {
            return thumb
                ? `https://drive.google.com/thumbnail?id=${id}&sz=w400`
                : `https://drive.google.com/uc?export=download&id=${id}`;
        }
        return `https://drive.google.com/thumbnail?id=${id}&sz=w${thumb ? '400' : '1200'}`;
    }

    getMediaMeta(participantId, fileId) {
        const all = JSON.parse(localStorage.getItem('academy_media_meta') || '{}');
        return all[participantId]?.[fileId] || { description: '', title: '' };
    }

    saveMediaMeta(participantId, fileId, data) {
        const all = JSON.parse(localStorage.getItem('academy_media_meta') || '{}');
        if (!all[participantId]) all[participantId] = {};
        all[participantId][fileId] = { ...all[participantId][fileId], ...data };
        localStorage.setItem('academy_media_meta', JSON.stringify(all));
    }

    getBio(participant) {
        const local = localStorage.getItem(`academy_bio_${participant.id}`);
        if (local) return local;
        return participant.bio || `${participant.name} — ${participant.role}. Flow: ${participant.flow || 'Circle D Flow'}.`;
    }

    async saveBio(participantId, text) {
        localStorage.setItem(`academy_bio_${participantId}`, text);
        const p = this.participants.find((x) => x.id === participantId);
        if (p && p.profile && this.userId === participantId && window.supabaseClient) {
            await window.supabaseClient.from('profiles').update({ bio: text }).eq('id', participantId);
        }
        if (window.Pusher) window.Pusher.showToast('Bio updated', 'success');
    }

    bindUI() {
        document.querySelectorAll('.academy-filter-btn').forEach((btn) => {
            btn.onclick = () => {
                document.querySelectorAll('.academy-filter-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                this.filter = btn.dataset.filter || 'all';
                this.renderGrid();
            };
        });
        document.getElementById('academy-detail-close')?.addEventListener('click', () => this.closeDetail());
        document.getElementById('academy-player-close')?.addEventListener('click', () => this.closePlayer());
        document.getElementById('academy-save-desc')?.addEventListener('click', () => this.saveCurrentDescription());
        document.getElementById('academy-save-bio')?.addEventListener('click', () => {
            const ta = document.getElementById('academy-bio-edit');
            if (ta && this.current) this.saveBio(this.current.id, ta.value);
        });
        document.getElementById('academy-detail-sheet')?.addEventListener('click', (e) => {
            if (e.target.id === 'academy-detail-sheet') this.closeDetail();
        });
    }

    renderGrid() {
        const grid = document.getElementById('academy-manga-grid');
        if (!grid) return;
        let list = this.participants;
        if (this.filter === 'artist') list = list.filter((p) => p.type === 'artist');
        if (this.filter === 'crew') list = list.filter((p) => p.type === 'crew');
        if (this.filter === 'navigator') list = list.filter((p) => p.type === 'navigator');

        grid.innerHTML = list.map((p, i) => {
            const files = this.getPortfolioFor(p);
            const thumb = files[0] ? this.mediaUrl(files[0], true) : '';
            const portrait = p.profile?.avatar_url || thumb;
            return `
            <article class="manga-panel" style="animation-delay:${i * 0.05}s" onclick="AcademyWorld.openDetail('${p.id}')">
                <div class="manga-speedlines"></div>
                ${portrait
                    ? `<img class="manga-panel-portrait" src="${portrait}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">`
                    : `<div class="manga-panel-placeholder"><span class="material-symbols-outlined">person</span></div>`}
                <div class="manga-panel-info">
                    <div class="manga-panel-name">${p.name}</div>
                    <div class="manga-panel-role">${p.role}</div>
                </div>
            </article>`;
        }).join('');
    }

    openDetail(id) {
        const p = this.participants.find((x) => x.id === id);
        if (!p) return;
        this.current = p;
        const sheet = document.getElementById('academy-detail-sheet');
        const title = document.getElementById('academy-detail-name');
        const role = document.getElementById('academy-detail-role');
        const locs = document.getElementById('academy-detail-locations');
        const grid = document.getElementById('academy-detail-portfolio');
        const bioTa = document.getElementById('academy-bio-edit');
        const stats = document.getElementById('academy-detail-stats');

        if (title) title.textContent = p.name;
        if (role) role.textContent = `${p.role} · ${p.flow || 'Flow'}`;
        if (locs) {
            locs.innerHTML = (p.locations || []).map((l) => `<span class="academy-loc-tag">${l}</span>`).join('');
        }
        if (stats) {
            stats.innerHTML = p.exp != null
                ? `<span class="academy-sync-pill">${p.exp} XP</span><span class="academy-sync-pill">${p.karma || 0} Karma</span>`
                : '<span class="academy-sync-pill">C4C Participant</span>';
        }
        if (bioTa) {
            bioTa.value = this.getBio(p);
            bioTa.readOnly = !(this.userId && (this.userId === p.id || p.type === 'navigator' && this.userId === p.profile?.id));
        }

        const files = this.getPortfolioFor(p);
        if (grid) {
            grid.innerHTML = files.length
                ? files.map((f) => `
                <div class="academy-portfolio-cell" onclick="AcademyWorld.openPlayer('${p.id}','${f.id}','${f.type}')">
                    <img src="${this.mediaUrl(f, true)}" alt="" loading="lazy">
                </div>`).join('')
                : `<p style="font-size:11px;color:#666;grid-column:1/-1;">No compressed media yet. Upload via Vision or link Akademie archive.</p>`;
        }
        sheet?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    closeDetail() {
        document.getElementById('academy-detail-sheet')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    openPlayer(participantId, fileId, type) {
        const p = this.participants.find((x) => x.id === participantId);
        if (!p) return;
        this.current = p;
        this.currentMedia = { fileId, type };
        const modal = document.getElementById('academy-player-modal');
        const wrap = document.getElementById('academy-player-wrap');
        const meta = this.getMediaMeta(participantId, fileId);
        const desc = document.getElementById('academy-desc-edit');
        const file = { id: fileId, type };

        if (wrap) {
            if (type === 'video') {
                wrap.innerHTML = `<video controls playsinline src="${this.mediaUrl(file, false)}" style="max-width:100%;max-height:55dvh;"></video>`;
            } else {
                wrap.innerHTML = `<img src="${this.mediaUrl(file, false)}" alt="">`;
            }
        }
        if (desc) {
            desc.value = meta.description || `${p.name} — ${meta.title || 'Portfolio piece'}`;
            desc.readOnly = false;
        }
        modal?.classList.add('open');
    }

    closePlayer() {
        document.getElementById('academy-player-modal')?.classList.remove('open');
        const wrap = document.getElementById('academy-player-wrap');
        if (wrap) wrap.innerHTML = '';
    }

    saveCurrentDescription() {
        if (!this.current || !this.currentMedia) return;
        const desc = document.getElementById('academy-desc-edit')?.value || '';
        this.saveMediaMeta(this.current.id, this.currentMedia.fileId, { description: desc });
        if (window.Pusher) window.Pusher.showToast('Description saved', 'success');
    }
}

new AcademyWorldAgent();
