/**
 * QUEST ENGINE v4.1 (The Animus Core - DE)
 * Consolidates Map (Atlas), Board (Codex), Brotherhood (Legends), and Comms (Chat).
 * Built for "Lisbon Tech-Noir" aesthetics and Supabase Realtime.
 * Localized: GERMAN
 */

class QuestEngine {
    constructor() {
        this.name = "QuestEngine";
        this.supabase = window.supabaseClient; 
        window.QuestEngine = this;

        // Global State
        this.user = null;
        this.profile = null;
        this.currentChatPartner = null;
        this.chatSubscription = null;
        this.pendingKarmaTarget = null;
        
        // Caches
        this.allQuests = []; 
        this.mapMarkers = {};

        // SYSTEM QUEST REGISTRY (Tutorials)
        // SYSTEM QUEST REGISTRY (Tutorials)
        // SYSTEM QUEST REGISTRY (Tutorials)
        this.SYSTEM_QUESTS = [
            {
                id: 'Q-PROTO-01',
                index: 1,
                title: 'ATLAS AWAKENING',
                description: 'Open the Lisbon Atlas, enable GPS, and scan your first mission.',
                reward_exp: 100,
                type: 'story',
                page: 'quest_map.html',
                targetUrl: 'quest_map.html',
                nextLevel: 2,
                text: `<b>Protocol 1 — Lisbon Atlas</b><br><br>
                    The Atlas maps real Lisbon to quests and Adinkra runes.<br><br>
                    1. Allow GPS<br>
                    2. Tap <b>NEARBY</b> for closest missions<br>
                    3. Use filters: Sanctuary, Views (miradouros), Sound, Vision, Kitchen<br>
                    4. Walk to a pin → Accept → <b>Verify GPS</b><br><br>
                    Flowee will guide your first tour automatically.`
            },
            {
                id: 'Q-PROTO-02',
                index: 2,
                title: 'CODEX MISSION LOG',
                description: 'Accept a Lisbon quest in the Codex and complete it on site.',
                reward_exp: 150,
                type: 'story',
                page: 'quest_board.html',
                targetUrl: 'quest_board.html',
                nextLevel: 3,
                text: `<b>Protocol 2 — The Codex</b><br><br>
                    Your mission log lives here.<br><br>
                    • <b>Lisbon Atlas Quests</b> — GPS missions with XP + runes<br>
                    • <b>Protocols</b> — system tutorials (this sequence)<br>
                    • Accept <i>The Hidden Oasis</i> or any LQ quest → Open Map → Verify on site<br><br>
                    <button onclick="window.location.href='quest_board.html'" style="color:#06b6d4;border:1px solid #06b6d4;background:transparent;padding:8px 12px;cursor:pointer;margin-top:8px;">OPEN CODEX</button>`
            },
            {
                id: 'Q-PROTO-03',
                index: 3,
                title: 'BROTHERHOOD RANK',
                description: 'View your Adinkra Codex and live Navigator rankings.',
                reward_exp: 200,
                type: 'story',
                page: 'hall_of_legends.html',
                targetUrl: 'hall_of_legends.html',
                nextLevel: 4,
                text: `<b>Protocol 3 — Brotherhood Rank</b><br><br>
                    Bronze → Silver → Gold runes sync here from the Atlas.<br><br>
                    • Live leaderboard (real profiles)<br>
                    • Adinkra Codex & level unlocks (Lv5 Place Cinema, Lv10 Battlefield vote)<br>
                    • Syndicate tools when you reach Warlord rank<br><br>
                    <button onclick="window.location.href='hall_of_legends.html'" style="color:gold;border:1px solid gold;background:transparent;padding:8px 12px;cursor:pointer;margin-top:8px;">OPEN RANK</button>`
            }
        ];

        this.mergeLocationQuests();
        this.init();
    }

    mergeLocationQuests() {
        const lisbon = window.LISBON_QUESTS || [];
        lisbon.forEach(lq => {
            if (this.SYSTEM_QUESTS.some(q => q.id === lq.id)) return;
            this.SYSTEM_QUESTS.push({
                id: lq.id,
                title: lq.title,
                description: lq.description,
                reward_exp: lq.reward_exp,
                reward_flow: lq.reward_flow,
                reward_rune: lq.reward_rune,
                type: lq.type || 'location',
                page: lq.page,
                latitude: lq.lat,
                longitude: lq.lng,
                radiusM: lq.radiusM,
                isLocation: true
            });
        });
    }

    async init() {
        console.log("⚡ [QuestEngine] Animus System wird gestartet...");
        
        // 1. Auth Check
        const { data: { session } } = await this.supabase.auth.getSession();
        if(session) {
            this.user = session.user;
            await this.loadProfile();
            this.initComms(); 
            this.checkPageQuests(); // Auto-Complete Page Quests
        } else {
            console.warn("[QuestEngine] Kein Navigator aktiv. Zugriff beschränkt.");
        }

        // 2. Initialize Subsystems based on current page
        const path = window.location.pathname;
        if(path.includes('quest_map')) this.initAtlas();
        if(path.includes('quest_board')) this.initCodex();
        if(path.includes('hall_of_legends')) this.initBrotherhood();
        
        // 3. Highlight Nav
        this.updateGlobalNav();
    }

    async loadProfile() {
        if (!this.user || !this.user.id) return;
        const { data } = await this.supabase.from('profiles').select('*').eq('id', this.user.id).single();
        if (!data) return;
        this.profile = data;
        window.userProfile = data; 
        console.log(`[QuestEngine] Profil Sync: ${data.username} | ${data.exp} XP | ${data.karma} Karma`);
        
        window.dispatchEvent(new CustomEvent('PROFILE_UPDATED', { detail: data }));
    }

    checkPageQuests() {
        const path = window.location.pathname;
        this.SYSTEM_QUESTS.forEach(q => {
            if (q.page && path.includes(q.page)) {
                // Check if already completed
                if (this.profile && this.profile.completed_quests && !this.profile.completed_quests.includes(q.id)) {
                    console.log(`[QuestEngine] Auto-Completing Quest: ${q.title}`);
                    // Slight delay for visual effect
                    setTimeout(() => this.grantReward(q.id, q.reward_exp, q.title), 2000);
                }
            }
        });
    }

    // --- 1. THE ATLAS (Map Logic) ---
    async initAtlas() {
        console.log("📍 [Atlas] Radar Online.");
        window.loadMapPins = (map) => this.loadWorldBeacons(map);
    }

    async loadWorldBeacons(map) {
        const { data: quests, error } = await this.supabase.from('user_quests').select('*');
        if(error) return console.error("Radar Fehler", error);

        const locationQuests = (window.LISBON_QUESTS || []).map(lq => ({
            id: lq.id,
            title: lq.title,
            description: lq.description,
            reward_exp: lq.reward_exp,
            type: lq.type,
            latitude: lq.lat,
            longitude: lq.lng,
            creator_id: null,
            likes: 0,
            isLocation: true
        })).filter(q => q.latitude && q.longitude);

        [...(quests || []), ...locationQuests].forEach(q => this.addPinToMap(map, q));

        if (window.LISBON_VENUES) {
            Object.values(window.LISBON_VENUES).flat().forEach(v => {
                if (!v.lat) return;
                this.addVenuePin(map, v);
            });
        }

        this.supabase
            .channel('public:user_quests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_quests' }, payload => {
                console.log("⚡ [Atlas] Neues Signal entdeckt!", payload.new);
                this.addPinToMap(map, payload.new);
                if(window.Pusher) window.Pusher.showToast("NEUES SIGNAL ENTDECKT", "xp");
            })
            .subscribe();
    }

    addVenuePin(map, venue) {
        const icon = L.divIcon({
            className: 'venue-node-pin',
            html: '<div style="width:10px;height:10px;border-radius:50%;background:#06b6d4;box-shadow:0 0 8px #06b6d4;border:1px solid #fff;"></div>',
            iconSize: [10, 10]
        });
        L.marker([venue.lat, venue.lng], { icon }).addTo(map).bindPopup(
            `<strong>${venue.name}</strong><br><span style="color:#888;font-size:11px;">${venue.zone || 'Lisbon'}</span>`
        );
    }

    addPinToMap(map, quest) {
        if (!quest.latitude || !quest.longitude) return;

        const isMine = (this.user && quest.creator_id === this.user.id);
        const isStory = (quest.type === 'story');
        
        let iconUrl = '../assets/images/beacon-blue.png'; 
        let className = 'glow-blue';
        
        if (isMine) { iconUrl = '../Assets/images/cqr-logo-gold.png'; className = 'glow-gold'; }
        if (isStory) { iconUrl = '../Assets/images/cqr-logo-gold.png'; className = 'animate-pulse-slow glow-gold'; }

        const icon = L.icon({ iconUrl, iconSize: [30, 30], className });

        // Generate Popup (German)
        const popupContent = `
            <div class="animus-popup-content">
                <h3>${quest.title}</h3>
                <p>${isStory ? 'KERN-ERINNERUNG' : 'COMMUNITY ECHO'}</p>
                <p>Belohnung: <span style="color:gold">${quest.reward_exp} XP</span></p>
                <div style="font-size:0.8em; color:#888;">Likes: ${quest.likes || 0}</div>
                
                <button class="animus-popup-btn sync" onclick="QuestEngine.attemptSync(${quest.latitude}, ${quest.longitude}, '${quest.id}', ${quest.reward_exp}, '${quest.creator_id}')">
                    📡 SYNCHRONISIEREN
                </button>
                
                <button class="animus-popup-btn" onclick="QuestEngine.openInCodex('${quest.id}')">
                    📖 IM CODEX ÖFFNEN
                </button>
            </div>
        `;

        L.marker([quest.latitude, quest.longitude], { icon })
         .addTo(map)
         .bindPopup(popupContent);
    }

    attemptSync(questLat, questLng, questId, rewardExp, creatorId) {
        if (!navigator.geolocation) return alert("GPS offline. Enable location services.");
        if(window.Pusher) window.Pusher.showToast("Scanning environment...", "default");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const dist = this.getDistance(pos.coords.latitude, pos.coords.longitude, questLat, questLng);
            if (dist <= 100) {
                await this.grantReward(questId, rewardExp);
                this.pendingKarmaTarget = creatorId;
                const km = document.getElementById('karma-modal');
                if (km) km.style.display = 'flex';
            } else {
                alert(`Too far (${Math.round(dist)}m). Move within 100m to sync.`);
            }
        }, () => alert("GPS blocked. Allow location for quest verification."));
    }

    getAcceptedQuests() {
        return JSON.parse(localStorage.getItem('cdf_accepted_quests') || '[]');
    }

    isQuestAccepted(id) {
        return this.getAcceptedQuests().includes(id);
    }

    isQuestComplete(id) {
        return (this.profile?.completed_quests || []).includes(id);
    }

    acceptQuest(questId) {
        const list = this.getAcceptedQuests();
        if (list.includes(questId)) {
            if (window.Pusher) window.Pusher.showToast('Quest already active', 'info');
            return;
        }
        list.push(questId);
        localStorage.setItem('cdf_accepted_quests', JSON.stringify(list));
        localStorage.setItem('cdf_quests_touched_today', String(parseInt(localStorage.getItem('cdf_quests_touched_today') || '0', 10) + 1));
        const q = (window.LISBON_QUESTS || []).find((x) => x.id === questId);
        const title = q?.title || questId;
        if (window.Pusher) window.Pusher.showToast(`Quest accepted: ${title}`, 'success');
        if (window.FloweeNotify) window.FloweeNotify.questAccepted(title);
        if (window.Flowee) window.Flowee.talk(true, `Quest "${title}" accepted. Go to the Atlas pin and tap VERIFY GPS when you arrive.`, 'guide');
        if (window.AtlasEngine) window.AtlasEngine.refreshQuestMarkers();
        if (questId === 'LQ-010') this.grantReward(questId, 50, 'Codex Awakening');
    }

    async fulfillAtGPS(questId) {
        const q = (window.LISBON_QUESTS || []).find((x) => x.id === questId);
        if (!q || !q.lat) return alert('This quest has no GPS target.');
        if (!this.isQuestAccepted(questId)) return alert('Accept the quest in Codex or Atlas first.');
        if (this.isQuestComplete(questId)) return alert('Quest already completed.');
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const dist = this.getDistance(pos.coords.latitude, pos.coords.longitude, q.lat, q.lng);
            const radius = q.radiusM || 120;
            if (dist <= radius) {
                await this.grantReward(questId, q.reward_exp, q.title);
                if (q.reward_rune && window.AtlasEngine) {
                    const venue = (window.getAllVenues?.() || []).find((v) => v.rune === q.reward_rune);
                    if (venue) window.AtlasEngine.saveRune(venue.id, 'silver', { rune: q.reward_rune, quest: questId });
                }
                if (window.FloweeNotify) window.FloweeNotify.questComplete(q.title, q.reward_exp);
                if (window.AtlasEngine) window.AtlasEngine.refreshQuestMarkers();
            } else {
                alert(`Not at target yet (${Math.round(dist)}m / need ${radius}m). Keep walking.`);
            }
        }, () => alert('Enable GPS to verify quest location.'));
    }

    checkActiveQuestsGPS(lat, lng) {
        this.getAcceptedQuests().forEach((id) => {
            if (this.isQuestComplete(id)) return;
            const q = (window.LISBON_QUESTS || []).find((x) => x.id === id);
            if (!q?.lat) return;
            const dist = this.getDistance(lat, lng, q.lat, q.lng);
            if (dist <= (q.radiusM || 120) * 1.5 && window.Flowee) {
                const key = `proximity_${id}_${new Date().toISOString().slice(0, 10)}`;
                if (!sessionStorage.getItem(key)) {
                    sessionStorage.setItem(key, '1');
                    window.Flowee.talk(true, `You are near "${q.title}". Tap VERIFY GPS on the map pin.`, 'guide');
                }
            }
        });
    }

    async grantReward(questId, xp, titleOverride = null) {
        if(this.profile.completed_quests && this.profile.completed_quests.includes(questId)) {
            // Already done - silent return or log
            return;
        }

        const newExp = (this.profile.exp || 0) + parseInt(xp);
        const newCompleted = [...(this.profile.completed_quests || []), questId];

        const { error } = await this.supabase.from('profiles').update({ exp: newExp, completed_quests: newCompleted }).eq('id', this.user.id);
        
        if(!error) {
            const label = titleOverride || "QUEST COMPLETE";
            if(window.Pusher) window.Pusher.showToast(`✅ ${label}: +${xp} XP`, "success");
            if(window.SoundEngineer) window.SoundEngineer.playSFX('mission_complete');
            if (window.VitalityAgent) window.VitalityAgent.addEXP(parseInt(xp));
            if (window.FloweeReward) window.FloweeReward.xpToast(label, parseInt(xp));
            else if (window.Flowee) window.Flowee.talk(true, `${label}: +${xp} XP`, 'celebrate');
            const accepted = this.getAcceptedQuests().filter((id) => id !== questId);
            localStorage.setItem('cdf_accepted_quests', JSON.stringify(accepted));
            await this.loadProfile();
            this.checkLevelUp();
            window.dispatchEvent(new CustomEvent('POINTS_SYNCED', { detail: this.profile }));
        }
    }

    checkLevelUp() {
        if (!this.profile) return;
        const exp = this.profile.exp || 0;
        const level = Math.max(1, Math.floor(exp / 200) + 1);
        const prev = parseInt(localStorage.getItem('cdf_last_level') || '1', 10);
        if (level > prev) {
            localStorage.setItem('cdf_last_level', String(level));
            const unlock = window.LEVEL_UNLOCKS?.[level];
            const feature = unlock?.feature || `Level ${level}`;
            if (window.AdinkraEngine) window.AdinkraEngine.onLevelUp(level, prev);
            if (window.FloweeReward) window.FloweeReward.celebrate(
                unlock ? `Level ${level} — ${unlock.feature}! ${unlock.desc}` : `Resonance Level ${level} reached!`,
                'celebrate'
            );
            else if (window.Flowee) window.Flowee.talk(true, unlock ? `Level ${level} — ${unlock.feature}!` : `Level ${level}!`, 'celebrate');
            if (window.FloweeNotify && unlock) window.FloweeNotify.levelUp(level, unlock.feature);
        }
    }

    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; 
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Executes the Logic for System Protocols (Tutorials)
     * Handles DB updates, Level Ups, and Redirection.
     */
    async executeProtocolUplink(protocolIndex, btnId) {
        const btn = document.getElementById(btnId);
        const originalText = btn ? btn.innerText : 'Scanning...';
        
        try {
            if(btn) {
                btn.innerText = "[ PROCESSING UPLINK... ]";
                btn.style.color = "#00ff00";
            }

            const proto = this.SYSTEM_QUESTS.find(q => q.index === protocolIndex);
            if(!proto) throw new Error("Protocol Data Corrupt");

            // 1. Auth & Profile
            const { data: { user } } = await this.supabase.auth.getUser();
            
            // GHOST MODE BYPASS
            if(!user) {
                if(this.isOfflineMode) {
                    console.warn("[QuestEngine] Ghost Mode: Mocking Uplink Success.");
                    if(window.Pusher) window.Pusher.showToast(`👻 GHOST UPLINK: +${proto.reward_exp} XP`, "success");
                    if(window.SoundEngineer) window.SoundEngineer.playSFX('mission_complete');
                    
                    if(btn) btn.innerText = "[ GHOST ACCESS GRANTED ]";
                    
                    setTimeout(() => {
                        window.Helper ? window.Helper.safeRedirect(proto.targetUrl) : window.location.href = proto.targetUrl;
                    }, 1000);
                    return;
                } else {
                    throw new Error("Not Authenticated");
                }
            }

            const { data: profile } = await this.supabase.from('profiles').select('exp, level, available_stat_points').eq('id', user.id).single();
            
            // 2. Validation
            if(profile && profile.level >= proto.nextLevel) {
                 if(window.Pusher) window.Pusher.showToast("PROTOCOL ALREADY ASSIMILATED", "info");
                 else alert("PROTOCOL ALREADY ASSIMILATED.");
                 
                 if(btn) btn.innerText = "[ ALREADY COMPLETED ]";
                 
                 // Safe Redirect anyway
                 setTimeout(() => window.Helper ? window.Helper.safeRedirect(proto.targetUrl) : window.location.href = proto.targetUrl, 1000);
                 return;
            }

            // 3. Calculate New Stats
            const newExp = (profile ? profile.exp : 0) + proto.reward_exp;
            const newLevel = Math.max(profile ? profile.level : 1, proto.nextLevel); 
            const newStatPoints = (profile ? profile.available_stat_points : 0) + 10; // Bonus for leveling up via protocol

            // 4. Update Database
            const { error } = await this.supabase.from('profiles').update({ 
                exp: newExp, 
                level: newLevel,
                available_stat_points: newStatPoints 
            }).eq('id', user.id);

            if(error) throw error;

            // 5. Success
            if(window.SoundEngineer) window.SoundEngineer.playSFX('mission_complete');
            if(window.Pusher) window.Pusher.showToast(`UPLINK SECURED! +${proto.reward_exp} XP`, "success");
            
            if(btn) btn.innerText = "[ ACCESS GRANTED ]";

            if (window.FloweeReward) {
                await window.FloweeReward.levelUp(newLevel, `Protocol ${protocolIndex}`, proto.targetUrl);
            } else {
                setTimeout(() => {
                    window.Helper ? window.Helper.safeRedirect(proto.targetUrl) : window.location.href = proto.targetUrl;
                }, 1000);
            }

        } catch (e) {
            console.error("[QuestEngine] Uplink Failed:", e);
            
            if (e.message === "Not Authenticated" || e.message.includes("Auth")) {
                if(window.Pusher) window.Pusher.showToast("SESSION EXPIRED. Redirecting...", "error");
                // Don't auto-redirect in dev/ghost mode if possible, but strict auth might demand it.
                // For now, allow retry.
            } else {
                if(window.Pusher) window.Pusher.showToast("UPLINK FAILED: " + e.message, "error");
                else alert("System Error: " + e.message);
            }
            
            if(btn) {
                btn.innerText = "RETRY UPLINK";
                btn.style.color = "red";
            }
        }
    }

    openInCodex(questId) {
        sessionStorage.setItem('target_codex_id', questId);
        window.location.href = 'quest_board.html';
    }

    // --- 2. THE CODEX (Board Logic) ---
    async initCodex() {
        console.log("📖 [Codex] Archive Online.");
        
        let quests = [];
        try {
            // 1. Load Quests
            const { data, error } = await this.supabase.from('user_quests').select('*').order('created_at', { ascending: false });
            if(error) throw error;
            quests = data || [];
        } catch (e) {
            console.warn("[Codex] Connection Fluctuation. Accessing Local Cache (System Mode).", e);
        }

        // SYSTEM PROTOCOL FALLBACK (If Database Empty)
        const locationQuests = (window.LISBON_QUESTS || []).map(lq => ({
            ...lq,
            latitude: lq.lat,
            longitude: lq.lng,
            reward_exp: lq.reward_exp,
            likes: Math.floor(Math.random() * 50) + 10,
            type: lq.type || 'location'
        }));

        if (quests.length === 0) {
            console.log("[Codex] System Protocol Active. Loading Standard Tutorial Sequence.");
            quests = [...this.SYSTEM_QUESTS.map(q => ({
                ...q,
                latitude: q.latitude || 38.71,
                longitude: q.longitude || -9.14,
                likes: Math.floor(Math.random() * 500)
            })), ...locationQuests];
            
            if(window.Pusher) window.Pusher.showToast("SYSTEM PROTOCOLS LOADED", "success");
        } else {
            const ids = new Set(quests.map(q => q.id));
            locationQuests.forEach(lq => { if (!ids.has(lq.id)) quests.push(lq); });
        }

        this.allQuests = quests;
        this.renderCodexList(this.allQuests);
        this.renderLisbonAtlasQuests();

        // 2. Check Auto-Flip from Map
        const targetId = sessionStorage.getItem('target_codex_id');
        if (targetId) {
            const lisbonQ = (window.LISBON_QUESTS || []).find((q) => q.id === targetId);
            if (lisbonQ) {
                setTimeout(() => {
                    this.showLisbonQuestInCodex(lisbonQ);
                    sessionStorage.removeItem('target_codex_id');
                }, 500);
            } else {
                const target = this.allQuests.find(q => q.id === targetId);
                if (target) {
                    setTimeout(() => {
                        this.showQuestDetails(target);
                        const el = document.getElementById('codex-item-' + targetId);
                        if(el) {
                            el.scrollIntoView({behavior: 'smooth', block: 'center'});
                            el.style.background = 'rgba(255,215,0,0.2)';
                        }
                        sessionStorage.removeItem('target_codex_id');
                    }, 500);
                }
            }
        }
    }

    renderCodexList(quests) {
        const list = document.getElementById('quest-anchor-list');
        if(!list) return; // Should not happen if structure correct
        list.innerHTML = '';

        if(quests.length === 0) {
             list.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">NO MEMORIES FOUND.</div>`;
             return;
        }

        quests.forEach(q => {
            const isStory = (q.type === 'story');
            const div = document.createElement('div');
            div.className = 'quest-item';
            div.id = 'codex-item-' + q.id;
            div.innerHTML = `
                <div style="margin-bottom:5px;">
                    ${isStory ? '<span class="tag-story">STORY</span>' : '<span class="tag-comm">COMMUNITY</span>'}
                </div>
                <strong style="color:${isStory ? 'gold' : 'white'}">${q.title}</strong>
                <div class="quest-karma" style="float:right; font-size:0.8em; color:#888;">❤️ ${q.likes || 0}</div>
            `;
            div.onclick = () => this.showQuestDetails(q);
            list.appendChild(div);
        });
        
        // Auto-show first if exists
        if(quests.length > 0) this.showQuestDetails(quests[0]);
    }

    showQuestDetails(quest) {
        // 3D Flip
        const page = document.getElementById('quest-detail-page'); // Actually we might flip a sub-container, but let's assume the 'detail-card' inside needs update
        // The CSS assumes a class toggle on a container. 
        // Let's simply update content and trigger a visual refresh.
        
        const titleColor = (quest.type === 'story') ? 'gold' : '#00f0ff';
        
        const titleEl = document.getElementById('detail-title');
        if(titleEl) {
            titleEl.innerText = quest.title;
            titleEl.style.color = titleColor;
        }
        
        const descEl = document.getElementById('detail-desc');
        if(descEl) descEl.innerText = quest.description;
        
        const expEl = document.getElementById('detail-exp');
        if(expEl) expEl.innerText = quest.reward_exp;
        
        const btn = document.getElementById('sync-btn');
        if(btn) {
            btn.style.display = 'block';
            
            if (this.isQuestComplete(quest.id)) {
                btn.innerHTML = '✅ COMPLETED';
                btn.onclick = null;
            } else if (quest.lat || quest.latitude) {
                const qid = quest.id;
                if (this.isQuestAccepted(qid)) {
                    btn.innerHTML = '📡 VERIFY GPS (+XP)';
                    btn.onclick = () => this.fulfillAtGPS(qid);
                } else {
                    btn.innerHTML = '✓ ACCEPT QUEST';
                    btn.onclick = () => { this.acceptQuest(qid); this.showQuestDetails(quest); };
                }
            } else if (quest.page) {
                btn.innerHTML = "📂 INITIATE SEQUENCE";
                btn.onclick = () => {
                    // Normalize path
                    let target = quest.page;
                    if(!target.includes('.html') && !target.includes('/')) target = target + '.html';
                    
                    console.log(`[Codex] Redirecting to Mission: ${target}`);
                    window.location.href = target; 
                };
            } else {
                btn.innerHTML = "TARGET ON MAP 🎯";
                btn.onclick = () => {
                     sessionStorage.setItem('target_quest_id', quest.id);
                     sessionStorage.setItem('target_quest_lat', quest.latitude);
                     sessionStorage.setItem('target_quest_lng', quest.longitude);
                     window.location.href = 'quest_map.html';
                };
            }
        }
    }

    filterCodex() { // Search
        const term = document.getElementById('codex-search').value.toLowerCase();
        const filtered = this.allQuests.filter(q => q.title.toLowerCase().includes(term));
        this.renderCodexList(filtered);
    }

    // --- 3. THE BROTHERHOOD (Leaderboard) ---
    displayName(profile) {
        if (window.NavigatorDisplay) return window.NavigatorDisplay.displayNavigatorName(profile);
        const u = String(profile?.username || '').trim();
        if (u && !/^unknown$/i.test(u)) return u;
        return profile?.id ? `Navigator ${String(profile.id).slice(0, 6)}` : 'Navigator';
    }

    async initBrotherhood() {
        console.log("🏛️ [Brotherhood] Hierarchy Loaded.");
        if (window.PointsSync) await window.PointsSync.refresh();
        window.addEventListener('RUNE_COLLECTED', () => this.renderAdinkraCodex());
        window.addEventListener('POINTS_SYNCED', () => { this.renderLevelUnlocks(); this.renderAdinkraCodex(); });

        let agents = [];
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id, username, email, exp, karma, level, avatar_url, guild_id')
                .order('exp', { ascending: false })
                .limit(50);
            if (error) throw error;
            agents = (data || []).filter((ag) =>
                window.NavigatorDisplay ? window.NavigatorDisplay.isRealProfile(ag) : !!ag.id
            );
        } catch(e) {
             console.warn("[Brotherhood] Connection fluctuation.", e);
        }

        const list = document.getElementById('leaderboard-list');
        if(list) {
            list.innerHTML = '';
            if (agents.length === 0) {
                list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#666;font-family:'Courier New',monospace;">
                    <p style="color:#d4af37;margin-bottom:8px;">NO OPERATIVES YET</p>
                    <p style="font-size:0.85em;">Registrierte Navigators erscheinen hier live aus der Datenbank.</p>
                    <a href="bantaba.html" style="color:#00f0ff;font-size:0.85em;display:inline-block;margin-top:12px;">→ Bantaba besuchen</a>
                </div>`;
            } else {
            agents.slice(0, 10).forEach((ag, idx) => {
                 const div = document.createElement('div');
                 div.className = 'leaderboard-item';
                 const label = this.displayName(ag);
                 div.innerHTML = `
                    <div class="agent-link" style="cursor:pointer;display:flex;align-items:center;gap:8px;" onclick="window.location.href='academy.html?user=${ag.id}'">
                        <span class="rank-num" style="color:${idx < 3 ? 'gold' : '#aaa'};width:30px;">#${idx+1}</span>
                        <span class="agent-name hover:text-cyan-400 transition-colors">${label}</span>
                    </div>
                    <div style="color:gold">${(ag.exp || 0).toLocaleString()} XP</div>
                 `;
                 list.appendChild(div);
            });
            }
        }

        const myExp = document.getElementById('brotherhood-my-exp');
        if (myExp && this.profile) myExp.textContent = (this.profile.exp || 0).toLocaleString();

        if (this.profile) {
            this.renderBadges(this.profile.exp, 'my-badge-case');
            this.renderAdinkraCodex();
            this.renderLevelUnlocks();
        }

        if (!this._brotherhoodRealtimeBound && this.supabase) {
            this._brotherhoodRealtimeBound = true;
            this._brotherhoodChannel = this.supabase
                .channel('brotherhood-live-profiles')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                    this.initBrotherhood();
                })
                .subscribe();
        }
    }

    renderLisbonAtlasQuests() {
        const list = document.getElementById('lisbon-quest-list');
        if (!list || !window.LISBON_QUESTS) return;
        list.innerHTML = '';
        window.LISBON_QUESTS.forEach((q) => {
            const li = document.createElement('li');
            li.className = 'quest-item';
            li.id = 'codex-item-' + q.id;
            const done = this.isQuestComplete(q.id);
            const active = this.isQuestAccepted(q.id);
            const badge = done ? '<span style="color:#0f0;font-size:0.65em">DONE</span>'
                : active ? '<span style="color:#d4af37;font-size:0.65em">ACTIVE</span>'
                : '<span style="color:#666;font-size:0.65em">GPS</span>';
            li.innerHTML = `${badge} <strong style="color:#fff">${q.title}</strong><div style="font-size:0.75em;color:#888">+${q.reward_exp} XP</div>`;
            li.onclick = () => this.showLisbonQuestInCodex(q);
            list.appendChild(li);
        });
        const targetId = sessionStorage.getItem('target_codex_id');
        if (targetId) {
            const q = window.LISBON_QUESTS.find((x) => x.id === targetId);
            if (q) setTimeout(() => { this.showLisbonQuestInCodex(q); sessionStorage.removeItem('target_codex_id'); }, 400);
        }
    }

    showLisbonQuestInCodex(q) {
        document.getElementById('protocol-empty').style.display = 'none';
        const display = document.getElementById('protocol-display');
        if (display) display.style.display = 'flex';
        const title = document.getElementById('proto-title');
        const text = document.getElementById('proto-text');
        const status = document.getElementById('proto-status');
        if (title) { title.innerText = q.title; title.style.color = '#06b6d4'; }
        if (status) status.innerText = 'LISBON_ATLAS_QUEST';
        if (text) {
            text.innerHTML = `${q.description}<br><br>
                <span style="color:gold">+${q.reward_exp} XP</span>
                ${q.reward_flow ? ` · <span style="color:#00f0ff">+${q.reward_flow} FLOW</span>` : ''}
                ${q.reward_rune ? `<br>Rune unlock: <b>${q.reward_rune}</b>` : ''}`;
        }
        const btn = document.getElementById('proto-action-btn');
        const mapBtn = document.getElementById('proto-map-btn');
        if (mapBtn) {
            mapBtn.style.display = 'block';
            mapBtn.onclick = () => {
                sessionStorage.setItem('target_codex_id', q.id);
                window.location.href = 'quest_map.html';
            };
        }
        if (!btn) return;
        btn.disabled = false;
        const isAction = ['taste', 'bazaar', 'vision', 'sound'].includes(q.type);
        if (this.isQuestComplete(q.id)) {
            btn.innerText = '[ QUEST COMPLETED ]';
            btn.style.color = '#0f0';
            btn.onclick = null;
        } else if (isAction && q.page) {
            btn.innerText = '[ OPEN PAGE ]';
            btn.style.color = '#22c55e';
            btn.onclick = () => {
                if (!this.isQuestAccepted(q.id)) this.acceptQuest(q.id);
                window.location.href = q.page + (q.page.includes('?') ? '&' : '?') + 'tutorial=' + q.id;
            };
        } else if (this.isQuestAccepted(q.id)) {
            btn.innerText = '[ VERIFY GPS AT LOCATION ]';
            btn.style.color = '#0f0';
            btn.onclick = () => this.fulfillAtGPS(q.id);
        } else {
            btn.innerText = '[ ACCEPT QUEST ]';
            btn.style.color = 'gold';
            btn.onclick = () => { this.acceptQuest(q.id); this.showLisbonQuestInCodex(q); };
        }
        if (mapBtn) mapBtn.innerText = '[ OPEN MAP ]';
        document.querySelectorAll('#lisbon-quest-list .quest-item').forEach((el) => el.style.background = '');
        const el = document.getElementById('codex-item-' + q.id);
        if (el) { el.style.background = 'rgba(6,182,212,0.15)'; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }

    async fulfillTasteQuest(questId) {
        const q = (window.LISBON_QUESTS || []).find((x) => x.id === questId);
        if (!q || q.type !== 'taste') return;
        if (this.isQuestComplete(questId)) return;
        if (!this.isQuestAccepted(questId)) this.acceptQuest(questId);
        await this.grantReward(questId, q.reward_exp, q.title);
        if (q.reward_rune && window.FloweeReward) await window.FloweeReward.grantRune(q.reward_rune, 'bronze');
        this.renderLisbonAtlasQuests();
        if (window.AtlasEngine) window.AtlasEngine.refreshQuestMarkers();
    }

    renderAdinkraCodex() {
        const grid = document.getElementById('adinkra-codex-grid');
        if (!grid) return;
        const runes = JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}');
        const museum = window.AdinkraEngine?.getMuseum() || JSON.parse(localStorage.getItem('cdf_adinkra_museum') || '{}');
        const merged = new Map();
        Object.entries(runes).forEach(([venueId, data]) => {
            const venue = (window.getAllVenues?.() || []).find((v) => v.id === venueId);
            const runeId = data.rune || venue?.rune || venueId;
            merged.set(runeId, { tier: data.tier || 'bronze', source: 'atlas' });
        });
        Object.entries(museum).forEach(([id, data]) => {
            merged.set(id, { tier: data.tier || 'bronze', source: 'museum' });
        });
        if (!merged.size) {
            grid.innerHTML = '<p style="color:#555;font-size:0.8em;grid-column:1/-1">No runes yet — level up for Museum symbols or walk the Atlas.</p>';
            return;
        }
        grid.innerHTML = '';
        merged.forEach((data, runeId) => {
            const meta = window.getAdinkraMeta?.(runeId) || { name: runeId, meaning: '' };
            const chip = document.createElement('div');
            chip.className = `adinkra-chip ${data.tier || 'bronze'}`;
            chip.title = meta.meaning || '';
            const glyph = window.renderAdinkraGlyph?.(runeId, data.tier) || '◈';
            const glossar = meta.glossar ? ` #${meta.glossar}` : '';
            chip.innerHTML = `${glyph}<div style="font-size:0.65em;margin-top:4px">${meta.name}</div><span style="opacity:0.7;font-size:0.55em">${glossar} · ${(data.tier || 'bronze').toUpperCase()}</span>`;
            grid.appendChild(chip);
        });
    }

    renderLevelUnlocks() {
        const el = document.getElementById('level-unlocks');
        if (!el || !window.LEVEL_UNLOCKS) return;
        const exp = this.profile?.exp || 0;
        const level = Math.max(1, Math.floor(exp / 200) + 1);
        const rows = Object.entries(window.LEVEL_UNLOCKS).map(([lv, u]) => {
            const ok = level >= parseInt(lv, 10);
            return `<div style="margin:4px 0;color:${ok ? '#d4af37' : '#444'}">Lv${lv} ${u.feature} — ${u.desc}</div>`;
        }).join('');
        el.innerHTML = `<strong style="color:#d4af37">Resonance Lv ${level}</strong> · Unlocks:<br>${rows}`;
    }

    openNeighborOrbit(userId, username) {
        if(this.user && userId === this.user.id) {
            window.location.href = 'academy.html';
            return;
        }
        if(window.confirm(`Open ${username} in the Academy?`)) {
            window.location.href = `academy.html?user=${userId}`;
        }
    }

    // --- 4. COMMS LINK (Chat & Friends) ---
    async initComms() {
        // Load Pending Requests
        this.loadCommsData();
        
        // subscribe to requests
        this.supabase.channel('public:brotherhood_links')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'brotherhood_links' }, () => {
                this.loadCommsData();
                if(window.Pusher) window.Pusher.showToast("COMMS UPDATE EMPFANGEN", "default");
            })
            .subscribe();
    }

    async loadCommsData() {
        // 1. Pending Requests (I am receiver)
        const { data: requests } = await this.supabase
            .from('brotherhood_links')
            .select('*')
            .eq('receiver_id', this.user.id)
            .eq('status', 'pending');
            
        const reqView = document.getElementById('comms-requests-view');
        if(reqView) {
            reqView.innerHTML = '';
            if(requests && requests.length > 0) {
                requests.forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'comms-item';
                    div.innerHTML = `
                        <span>${r.profiles?.username || 'Unbekannt'}</span>
                        <div>
                            <button onclick="QuestEngine.respondToLink('${r.id}', true)" style="color:#00f0ff;">✔</button>
                            <button onclick="QuestEngine.respondToLink('${r.id}', false)" style="color:red;">✖</button>
                        </div>
                    `;
                    reqView.appendChild(div);
                });
            } else {
                reqView.innerHTML = '<div style="color:#666; text-align:center; margin-top:20px;">Keine Anfragen.</div>';
            }
        }

        const { data: friends } = await this.supabase
            .from('brotherhood_links')
            .select('*')
            .or(`requester_id.eq.${this.user.id},receiver_id.eq.${this.user.id}`)
            .eq('status', 'active');
            
        const netView = document.getElementById('comms-network-view');
        if(netView) {
            netView.innerHTML = '';
            if(friends && friends.length > 0) {
                friends.forEach(f => {
                    // Determine partner
                    const partner = (f.requester_id === this.user.id) ? f.p2 : f.p1;
                    if(!partner) return;
                    
                    const div = document.createElement('div');
                    div.className = 'comms-item';
                    div.innerHTML = `
                        <span style="color:gold;">${partner.username}</span>
                        <button onclick="QuestEngine.openChat('${partner.id}', '${partner.username}')" style="background:#222; border:1px solid gold; color:gold; padding:2px 8px; font-size:0.8em;">CHAT</button>
                    `;
                    netView.appendChild(div);
                });
            } else {
                netView.innerHTML = '<div style="color:#666; text-align:center; margin-top:20px;">Netzwerk leer.</div>';
            }
        }
    }

    async sendFriendRequest(targetId) {
        // Check if exists
        const { data: existing } = await this.supabase.from('brotherhood_links')
            .select('*')
            .or(`and(requester_id.eq.${this.user.id},receiver_id.eq.${targetId}),and(requester_id.eq.${targetId},receiver_id.eq.${this.user.id})`)
            .single();

        if(existing) {
            return alert(existing.status === 'active' ? "Bereits verbunden." : "Anfrage bereits gesendet.");
        }

        const { error } = await this.supabase.from('brotherhood_links').insert([
            { requester_id: this.user.id, receiver_id: targetId, status: 'pending' }
        ]);
        
        if(!error) {
            alert("Signal gesendet.");
            // TRIGGER QUEST: Signal Boost
            this.grantReward('Q-SOC-201', 50, 'PROTOCOL: SIGNAL BOOST');
            this.toggleComms(true); // Open sidebar
        }
    }

    async respondToLink(linkId, accept) {
        const status = accept ? 'active' : 'rejected';
        await this.supabase.from('brotherhood_links').update({ status }).eq('id', linkId);
        this.loadCommsData(); // Refresh UI
    }

    toggleComms(show) {
        const term = document.getElementById('comms-terminal');
        const isHidden = term.classList.contains('comms-hidden'); 
        if (show || isHidden) {
            term.classList.remove('comms-hidden');
            term.classList.add('comms-visible');
            this.loadCommsData();
        } else {
            term.classList.remove('comms-visible');
            term.classList.add('comms-hidden');
        }
    }

    async openChat(partnerId, partnerName) {
        this.currentChatPartner = { id: partnerId, name: partnerName };
        document.getElementById('chat-partner-name').innerText = partnerName;
        document.getElementById('comms-chat-view').style.display = 'flex';
        document.getElementById('comms-network-view').style.display = 'none';
        
        // Load History
        const { data: msgs } = await this.supabase
            .from('comms_messages')
            .select('*')
            .or(`and(sender_id.eq.${this.user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${this.user.id})`)
            .order('created_at', {ascending: true});
            
        const box = document.getElementById('chat-messages');
        box.innerHTML = '';
        if(msgs) msgs.forEach(m => this.renderMessage(m));
        
        // Realtime Subscribe
        if(this.chatSubscription) this.supabase.removeChannel(this.chatSubscription);
        this.chatSubscription = this.supabase
            .channel('public:comms_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comms_messages' }, payload => {
                const m = payload.new;
                if((m.sender_id === partnerId && m.receiver_id === this.user.id) || (m.sender_id === this.user.id && m.receiver_id === partnerId)) {
                    this.renderMessage(m);
                }
            })
            .subscribe();
    }

    renderMessage(msg) {
        const box = document.getElementById('chat-messages');
        const isMe = (msg.sender_id === this.user.id);
        const div = document.createElement('div');
        div.className = `chat-bubble ${isMe ? 'chat-me' : 'chat-them'}`;
        div.innerText = msg.message;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if(!text || !this.currentChatPartner) return;
        
        input.value = '';
        await this.supabase.from('comms_messages').insert([{
            sender_id: this.user.id,
            receiver_id: this.currentChatPartner.id,
            message: text
        }]);
    }

    // --- GLOBAL ---
    updateGlobalNav() {
        const path = window.location.pathname;
        if(path.includes('quest_map')) document.querySelector('#nav-map')?.classList.add('active');
        if(path.includes('quest_board')) document.querySelector('#nav-board')?.classList.add('active');
        if(path.includes('hall_of_legends')) document.querySelector('#nav-bro')?.classList.add('active');
    }
    // --- Helper for Badges (Stub) ---
    renderBadges(xp, containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const level = Math.max(1, Math.floor((xp || 0) / 200) + 1);
            container.innerHTML = `<span style="color:gold;font-size:0.8em">Resonance Lv ${level}</span>`;
        }
        this.renderAdinkraCodex();
    }
}

// Auto-Start
document.addEventListener('DOMContentLoaded', () => {
    new QuestEngine();
});

// GLOBAL HELPER BRIDGE (For HTML OnClick)
window.toggleComms = (show) => window.QuestEngine.toggleComms(show);

window.switchCommsTab = (tab) => {
    document.querySelectorAll('.comms-view').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.comms-tabs button').forEach(el => el.classList.remove('active'));
    
    if(tab === 'requests') {
        document.getElementById('comms-requests-view').style.display = 'block';
        document.getElementById('tab-requests').classList.add('active');
    }
    if(tab === 'network') {
        document.getElementById('comms-network-view').style.display = 'block';
        document.getElementById('tab-network').classList.add('active');
    }
    // Check for chat
    if(tab === 'chat') {
        document.getElementById('comms-chat-view').style.display = 'flex';
    }
};

window.closeChat = () => {
    document.getElementById('comms-chat-view').style.display = 'none';
    window.switchCommsTab('network');
};

window.submitKarma = async (isPositive) => {
    const creatorId = window.QuestEngine.pendingKarmaTarget;
    if(!creatorId) return window.closeKarmaModal();

    if(isPositive) {
        // Increment Karma in Database
        const { data } = await window.QuestEngine.supabase.rpc('increment_karma', { user_id: creatorId });
        // NOTE: If RPC doesn't exist, we fall back to a fetch/update pattern, but let's assume standard update for now
        // Simple Update Fallback (Not race-condition safe but works for prototype)
        const { data: profile } = await window.QuestEngine.supabase.from('profiles').select('karma').eq('id', creatorId).single();
        if(profile) {
            await window.QuestEngine.supabase.from('profiles').update({ karma: profile.karma + 1 }).eq('id', creatorId);
        }
        if(window.Pusher) window.Pusher.showToast("COMMENDATION GESENDET (+1 Karma)", "karma");
    } else {
         if(window.Pusher) window.Pusher.showToast("GLITCH GEMELDET.", "error");
    }
    
    window.closeKarmaModal();
};

window.closeKarmaModal = () => { document.getElementById('karma-modal').style.display='none'; };

// --- PROTOCOL 1 SPECIFIC ---
QuestEngine.prototype.establishUplink = async function(questId) {
    console.log("📡 Initiating Uplink for:", questId);
    
    // 1. Visuals
    const btn = document.querySelector('#uplink-stage-1 button');
    if(btn) btn.innerHTML = "⏳ SYNCHRONIZING...";
    
    await new Promise(r => setTimeout(r, 1500)); // Fake delay

    // 2. Grant Reward (Logic from executeProtocolUplink)
    try {
        const proto = this.SYSTEM_QUESTS.find(q => q.id === questId);
        if(!proto) throw new Error("Protocol Not Found");

        // Auth Check (or Ghost)
        const { data: { user } } = await this.supabase.auth.getUser();
        
        if(user) {
             const { data: profile } = await this.supabase.from('profiles').select('exp, completed_quests').eq('id', user.id).single();
             if(profile && !profile.completed_quests?.includes(questId)) {
                 const newExp = (profile.exp || 0) + proto.reward_exp;
                 const newCompleted = [...(profile.completed_quests || []), questId];
                 await this.supabase.from('profiles').update({ exp: newExp, completed_quests: newCompleted }).eq('id', user.id);
             }
        } else if(this.isOfflineMode) {
            console.log("👻 Ghost Uplink Complete");
            // PERSIST GHOST PROGRESS
            let ghostProgress = JSON.parse(sessionStorage.getItem('ghost_progress') || '[]');
            if(!ghostProgress.includes(questId)) {
                ghostProgress.push(questId);
                sessionStorage.setItem('ghost_progress', JSON.stringify(ghostProgress));
            }
            // PERSIST GHOST MODE flag itself is usually session based, but let's ensure it.
            sessionStorage.setItem('ghost_mode_active', 'true');

        } else {
             throw new Error("No Signal");
        }

        // 3. Success State
        if(window.SoundEngineer) window.SoundEngineer.playSFX('success_chime');
        if(window.Pusher) window.Pusher.showToast("UPLINK SECURED", "success");

        // Save state to not show modal again
        localStorage.setItem('cqr_uplink_established', 'true');
        // If map exists, trigger location
        if (window.map) {
            window.map.locate({setView: true, maxZoom: 16, watch: true});
        }

        document.getElementById('uplink-stage-1').style.display = 'none';
        const modal = document.getElementById('protocol-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    } catch(e) {
        console.error("Uplink Error:", e);
        alert("SIGNAL LOST. RETRYING...");
        if(btn) btn.innerHTML = "✍️ ESTABLISH UPLINK (+100 XP)";
    }
};

// Removed redundant load listener for protocol-modal

// End of Valid File Content
