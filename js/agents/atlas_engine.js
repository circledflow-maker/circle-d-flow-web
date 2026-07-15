/**
 * Atlas Engine — GPS quests, Adinkra tiers, fog-of-war, map filters
 */
class AtlasEngine {
    constructor() {
        this.map = null;
        this.markers = {};
        this.questMarkers = {};
        this.filter = 'all';
        this.userPos = null;
        this.steps = 0;
        window.AtlasEngine = this;
    }

    init(map) {
        this.map = map;
        this.loadSteps();
        this.renderVenues();
        this.renderQuests();
        this.injectFilterBar();
        window.VisionCinemaEngine?.loadStages().then(() => {
            window.VisionCinemaEngine?.renderOnMap(this.map);
            window.VisionCinemaEngine?.focusFromQuery();
        });
        window.addEventListener('DAILY_ACTIVITY_UPDATED', (e) => {
            this.steps = e.detail?.steps || 0;
            this.updateFog();
        });
    }

    loadSteps() {
        const key = `cdf_daily_${new Date().toISOString().slice(0, 10)}`;
        try {
            const d = JSON.parse(localStorage.getItem(key) || '{}');
            this.steps = d.steps || 0;
        } catch (_) { this.steps = 0; }
    }

    getRunes() {
        return JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}');
    }

    saveRune(venueId, tier, meta) {
        const all = this.getRunes();
        const prev = all[venueId]?.tier;
        const rank = { bronze: 1, silver: 2, gold: 3 };
        if (prev && rank[prev] >= rank[tier]) return false;
        all[venueId] = { tier, ...meta, at: Date.now() };
        localStorage.setItem('cdf_adinkra_runes', JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('RUNE_COLLECTED', { detail: all[venueId] }));
        if (window.AdinkraEngine && meta?.rune) {
            window.AdinkraEngine.unlockSymbol(meta.rune, {
                source: `atlas_${venueId}`,
                tier,
                museum: true,
                upgrade: true,
            });
        }
        return true;
    }

    injectFilterBar() {
        if (document.getElementById('atlas-filter-bar')) return;
        const bar = document.createElement('div');
        bar.id = 'atlas-filter-bar';
        bar.className = 'atlas-filter-bar';
        bar.setAttribute('role', 'toolbar');
        bar.setAttribute('aria-label', 'Atlas map filters');
        bar.innerHTML = `
            <button type="button" class="atlas-filter active" data-f="all" aria-label="Show all venues">ALL</button>
            <button type="button" class="atlas-filter" data-f="miradouro" aria-label="Filter miradouro views">VIEWS</button>
            <button type="button" class="atlas-filter" data-f="sanctuary" aria-label="Filter sanctuaries">SANCTUARY</button>
            <button type="button" class="atlas-filter" data-f="sound" aria-label="Filter sound venues">SOUND</button>
            <button type="button" class="atlas-filter" data-f="vision" aria-label="Filter vision venues">VISION</button>
            <button type="button" class="atlas-filter" data-f="cinema" aria-label="Filter cinema locations">CINEMA</button>
            <button type="button" class="atlas-filter" data-f="kitchen" aria-label="Filter kitchen venues">KITCHEN</button>
            <button type="button" class="atlas-filter atlas-nearby-btn" id="atlas-nearby-btn" data-f="nearby" aria-label="Show nearest missions">NEARBY</button>
        `;
        document.body.appendChild(bar);
        bar.querySelectorAll('.atlas-filter').forEach((btn) => {
            if (btn.id === 'atlas-nearby-btn') {
                btn.onclick = (e) => { e.stopPropagation(); this.showNearestMissions(4); };
                return;
            }
            btn.onclick = () => {
                bar.querySelectorAll('.atlas-filter').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                this.filter = btn.dataset.f;
                this.renderVenues();
                window.VisionCinemaEngine?.renderOnMap(this.map);
            };
        });
    }

    matchesFilter(v) {
        if (this.filter === 'all') return true;
        if (this.filter === 'cinema') return false;
        if (this.filter === 'miradouro') return v.zone === 'high_flow' || (v.id || '').includes('mir_');
        if (this.filter === 'sanctuary') {
            return v.zone === 'community' || ['secret_garden_lx', 'hempy_roots', 'village_underground'].includes(v.id);
        }
        return (v.filter || []).includes(this.filter);
    }

    venueVisible(v) {
        if (this.filter !== 'all' && this.filter !== 'nearby' && !this.matchesFilter(v)) return false;
        const revealed = this.steps >= (v.stepsReveal || 0);
        if (this.userPos && v.lat) {
            const d = this.dist(this.userPos.lat, this.userPos.lng, v.lat, v.lng);
            if (d < 500) return true;
        }
        return revealed;
    }

    bindMarkerA11y(marker, label) {
        marker.on('add', function () {
            const el = this.getElement?.() || this._icon;
            if (!el) return;
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', label);
            el.setAttribute('tabindex', '0');
        });
    }

    popupOpts() {
        return { className: 'atlas-popup', maxWidth: 300, minWidth: 220 };
    }

    tierColor(tier) {
        return { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#d4af37' }[tier] || '#666';
    }

    renderVenues() {
        if (!this.map || !window.getAllVenues) return;
        Object.values(this.markers).forEach((m) => this.map.removeLayer(m));
        this.markers = {};
        const runes = this.getRunes();

        window.getAllVenues().forEach((v) => {
            const visible = this.venueVisible(v);
            const fog = !visible;
            const tier = runes[v.id]?.tier;
            const color = tier ? this.tierColor(tier) : (fog ? '#444' : '#06b6d4');
            const icon = L.divIcon({
                className: 'atlas-venue-pin',
                html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color};border:2px solid ${tier ? '#fff' : 'transparent'};opacity:${fog ? 0.35 : 1}"></div>`,
                iconSize: [14, 14],
            });
            const m = L.marker([v.lat, v.lng], { icon }).addTo(this.map);
            this.bindMarkerA11y(m, fog ? `Hidden venue: ${v.name}` : `Venue: ${v.name}`);
            const stepsLeft = Math.max(0, (v.stepsReveal || 0) - this.steps);
            const dist = this.userPos ? Math.round(this.dist(this.userPos.lat, this.userPos.lng, v.lat, v.lng)) : null;
            m.bindPopup(this.venuePopupHtml(v, fog, stepsLeft, tier, dist), this.popupOpts());
            this.markers[v.id] = m;
        });
    }

    venuePopupHtml(v, fog, stepsLeft, tier, distM) {
        const rune = v.runeName || v.rune || 'Adinkra';
        let body = fog
            ? `<p class="atlas-popup-desc">Hidden in fog. Walk <b>${stepsLeft}</b> more steps — or get within 500m.</p><p class="atlas-popup-meta">${v.vibe || ''}</p>`
            : `<p class="atlas-popup-desc">${v.vibe || v.zone}</p><p class="atlas-popup-meta">Rune: ${rune}</p>`;
        if (distM != null) body += `<p class="atlas-popup-reward">${distM}m away</p>`;
        let actions = '';
        if (!fog && distM != null && distM <= 120) {
            actions = `<button type="button" onclick="window.AtlasEngine.collectBronze('${v.id}')" class="atlas-popup-btn atlas-popup-btn-primary">COLLECT BRONZE RUNE</button>`;
            if (tier === 'bronze' || tier === 'silver') {
                actions += `<button type="button" onclick="window.AtlasEngine.anchorSilver('${v.id}')" class="atlas-popup-btn atlas-popup-btn-secondary">ANCHOR SILVER (scan + 30min)</button>`;
            }
        } else if (!fog) {
            actions = `<button type="button" onclick="QuestEngine.acceptQuest('LQ-VENUE-${v.id}')" class="atlas-popup-btn atlas-popup-btn-primary">ACCEPT NEARBY QUEST</button>`;
        }
        if (v.kitchenPage) {
            actions += `<a href="pages/${v.kitchenPage}" class="atlas-popup-btn atlas-popup-btn-success">OPEN KITCHEN MENU</a>`;
        }
        if (tier) body += `<p class="atlas-popup-meta">Tier: ${tier.toUpperCase()}</p>`;
        return `<div class="atlas-popup-card"><strong class="atlas-popup-title">${v.name}</strong>${body}${actions}</div>`;
    }

    questPopupHtml(q, accepted, done) {
        let actions = '';
        if (done) {
            actions = '<p class="atlas-popup-done">✓ COMPLETED</p>';
        } else if (accepted) {
            actions = `<button type="button" onclick="QuestEngine.fulfillAtGPS('${q.id}')" class="atlas-popup-btn atlas-popup-btn-success">VERIFY GPS</button>`;
        } else {
            actions = `<button type="button" onclick="QuestEngine.acceptQuest('${q.id}')" class="atlas-popup-btn atlas-popup-btn-primary">ACCEPT QUEST</button>`;
        }
        actions += `<button type="button" onclick="sessionStorage.setItem('target_codex_id','${q.id}');location.href='quest_board.html'" class="atlas-popup-btn atlas-popup-btn-secondary">OPEN IN CODEX</button>`;
        return `<div class="atlas-popup-card">
            <strong class="atlas-popup-title">${q.title}</strong>
            <p class="atlas-popup-desc">${q.description}</p>
            <p class="atlas-popup-reward">+${q.reward_exp} XP · +${q.reward_flow || 0} FLOW</p>
            ${actions}
        </div>`;
    }

    renderQuests() {
        if (!this.map || !window.LISBON_QUESTS) return;
        Object.values(this.questMarkers).forEach((m) => this.map.removeLayer(m));
        this.questMarkers = {};
        (window.LISBON_QUESTS || []).forEach((q) => {
            if (!q.lat || !q.lng) return;
            const icon = L.divIcon({
                className: 'atlas-quest-pin',
                html: '<div style="width:18px;height:18px;border:2px solid #E2725B;border-radius:4px;background:rgba(226,114,91,0.3);animation:pulse 2s infinite"></div>',
                iconSize: [18, 18],
            });
            const m = L.marker([q.lat, q.lng], { icon }).addTo(this.map);
            this.bindMarkerA11y(m, `Quest: ${q.title}`);
            const accepted = window.QuestEngine?.isQuestAccepted?.(q.id);
            const done = window.QuestEngine?.isQuestComplete?.(q.id);
            m.bindPopup(this.questPopupHtml(q, accepted, done), this.popupOpts());
            this.questMarkers[q.id] = m;
        });
    }

    onPosition(lat, lng) {
        this.userPos = { lat, lng };
        this.renderVenues();
        if (window.QuestEngine) window.QuestEngine.checkActiveQuestsGPS(lat, lng);
        window.VisionCinemaEngine?.checkProximityVisit(lat, lng);
        (window.getAllVenues?.() || []).forEach((v) => {
            if (!v.lat) return;
            const d = this.dist(lat, lng, v.lat, v.lng);
            if (d < 80 && this.venueVisible(v)) this.collectBronze(v.id, true);
        });
    }

    collectBronze(venueId, silent) {
        const v = window.getAllVenues().find((x) => x.id === venueId);
        if (!v) return;
        if (!this.saveRune(venueId, 'bronze', { rune: v.rune, name: v.runeName, sphere: 'Map' })) return;
        const xp = 50;
        if (window.QuestEngine) window.QuestEngine.grantReward(`RUNE-BRONZE-${venueId}`, xp, `Bronze: ${v.runeName}`);
        if (!silent && window.FloweeReward) {
            window.FloweeReward.grantRune(v.rune, 'bronze');
        } else if (!silent && window.Flowee) {
            window.Flowee.talk(true, `Bronze rune ${v.runeName} collected! +${xp} Wander EXP. Anchor Silver with a scan on site.`, 'celebrate');
        }
        if (window.FloweeNotify) window.FloweeNotify.send('Rune collected', `${v.runeName} — Bronze at ${v.name}`);
        this.renderVenues();
    }

    anchorSilver(venueId) {
        const v = window.getAllVenues().find((x) => x.id === venueId);
        if (!v || !this.userPos) return;
        if (this.dist(this.userPos.lat, this.userPos.lng, v.lat, v.lng) > 120) {
            alert('Move closer to anchor Silver (within 120m).');
            return;
        }
        if (!this.saveRune(venueId, 'silver', { rune: v.rune, name: v.runeName })) return;
        if (window.QuestEngine) window.QuestEngine.grantReward(`RUNE-SILVER-${venueId}`, 100, `Silver: ${v.runeName}`);
        if (window.Flowee) window.Flowee.talk(true, `${v.runeName} anchored in Silver. Permanently in your High Palast Codex.`, 'celebrate');
        this.renderVenues();
    }

    updateFog() { this.renderVenues(); }

    dist(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const toR = (d) => d * Math.PI / 180;
        const a = Math.sin((toR(lat2 - lat1)) / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin((toR(lon2 - lon1)) / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    refreshQuestMarkers() { this.renderQuests(); }

    showNearestMissions(max = 4) {
        if (!this.userPos) {
            if (window.Flowee) window.Flowee.talk(true, 'Enable GPS so I can find the nearest missions.', 'guide');
            if (navigator.geolocation && this.map) {
                this.map.locate({ setView: true, maxZoom: 15 });
            }
            return;
        }
        const { lat, lng } = this.userPos;
        const items = [];
        (window.getAllVenues?.() || []).forEach((v) => {
            if (!v.lat) return;
            items.push({ type: 'venue', name: v.name, lat: v.lat, lng: v.lng, dist: this.dist(lat, lng, v.lat, v.lng), meta: v });
        });
        (window.LISBON_QUESTS || []).forEach((q) => {
            if (!q.lat) return;
            items.push({ type: 'quest', name: q.title, lat: q.lat, lng: q.lng, dist: this.dist(lat, lng, q.lat, q.lng), meta: q });
        });
        items.sort((a, b) => a.dist - b.dist);
        const nearest = items.slice(0, max);
        if (!nearest.length) return;

        this.removeNearbyPanel();
        const panel = document.createElement('div');
        panel.id = 'atlas-nearby-panel';
        panel.className = 'atlas-nearby-panel';
        panel.innerHTML = `<div class="atlas-nearby-title">NEAREST MISSIONS</div>` +
            nearest.map((it, i) => `
                <button type="button" class="atlas-nearby-row" data-i="${i}">
                    <span>${it.type === 'quest' ? '◈' : '●'} ${it.name}</span>
                    <span>${Math.round(it.dist)}m</span>
                </button>`).join('');
        document.body.appendChild(panel);
        panel.querySelectorAll('.atlas-nearby-row').forEach((btn, i) => {
            btn.onclick = () => {
                const it = nearest[i];
                this.map.flyTo([it.lat, it.lng], 16, { duration: 1 });
                if (it.type === 'quest' && window.QuestEngine) {
                    window.QuestEngine.acceptQuest(it.meta.id);
                }
                const m = it.type === 'quest' ? this.questMarkers[it.meta.id] : this.markers[it.meta.id];
                if (m) setTimeout(() => m.openPopup(), 1200);
            };
        });

        this.map.flyTo([nearest[0].lat, nearest[0].lng], 15, { duration: 1 });
        if (window.FloweeQuestTour) window.FloweeQuestTour.onNearbyPressed();
        else if (window.Flowee) window.Flowee.talk(true, `Nearest: ${nearest[0].name} (${Math.round(nearest[0].dist)}m). Tap a row to fly there.`, 'guide');
    }

    removeNearbyPanel() {
        document.getElementById('atlas-nearby-panel')?.remove();
    }
}

new AtlasEngine();
