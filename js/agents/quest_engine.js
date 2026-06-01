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
            // 1. LEVEL 1: AWAKENING (Unlocks Map & Sound)
            { 
                id: 'Q-PROTO-01', 
                index: 1,
                title: 'THE FIRST BREATH', 
                description: 'Initialize your connection. Visit the Quest Map and secure a signal.', 
                reward_exp: 100, 
                type: 'story', 
                page: 'quest_map.html',
                targetUrl: 'quest_map.html',
                nextLevel: 2,
                text: `Welcome to the Matrix of Lisbon, Navigator.<br><br>
                       You have joined the <b>Circle-D-Flow</b>. We are not an app, we are a network. We connect the physical world (Hip-Hop, Arthouse, Rhythm) with the digital Matrix.<br><br>
                       Your first lesson: <b>The Atlas & The Sound World</b>.<br>
                       Once you confirm this uplink, the system will calibrate your GPS signals and unlock the nodes for Live-Events and Beats (Sound World) in your Dashboard.<br><br>
                       Let the flow move through you.`
            },
            // 2. LEVEL 2: COMMERCE (Unlocks Bazaar)
            { 
                id: 'Q-PROTO-02', 
                index: 2,
                title: 'MARKET ONBOARDING PROTOCOL', 
                description: 'Master the economy. Learn to Navigate, Forge, and Trade.', 
                reward_exp: 230, // Total possible (50+30+150)
                type: 'tutorial', 
                page: 'marketplace.html?tutorial=active',
                targetUrl: 'marketplace.html?tutorial=active',
                nextLevel: 3,
                text: `The economy of the Matrix awaits.<br><br>
                       Before you engage in turf wars, you must understand the flow of credits.<br>
                       <b>PHASE 1: Reconnaissance (+50 XP)</b><br>Scan the Bazaar by using a Guild Filter.<br><br>
                       <b>PHASE 2: The Blueprint (+30 XP)</b><br>Visit the Forge and test the Currency Converter.<br><br>
                       <b>PHASE 3: The Artisan (+150 XP)</b><br>Forge your first artifact (Optional).<br><br>
                       <button onclick="window.location.href='marketplace.html?tutorial=active'" style="color:gold; border:1px solid gold; background:transparent; padding:5px;">ENTER THE BAZAAR 🚀</button>`
            },
            // 3. LEVEL 3: WARFARE (Unlocks Brotherhood)
            { 
                id: 'Q-PROTO-03', 
                index: 3,
                title: 'THE ART OF WAR', 
                description: 'Prove your worth. Enter the Hall of Legends.', 
                reward_exp: 500, 
                type: 'story', 
                page: 'hall_of_legends.html',
                targetUrl: 'hall_of_legends.html',
                nextLevel: 4,
                text: `The streets belong to no one, until someone claims them.<br><br>
                       Welcome to the <b>Turf Wars</b>. On your Atlas, you now see red nodes (e.g. Favela LX). To capture them, you must physically navigate there, use your 5 Pillars (Animus Stats), and hack the firewalls.<br><br>
                       Control the nodes for your future Guild and farm passive Flow Credits. The War for Lisbon begins now.<br><br>
                       Complete this final protocol to spin up the weapon systems and become a fully sanctioned Agent.`
            }
        ];

        this.init();
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
        const { data } = await this.supabase.from('profiles').select('*').eq('id', this.user.id).single();
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

        quests.forEach(q => this.addPinToMap(map, q));

        this.supabase
            .channel('public:user_quests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_quests' }, payload => {
                console.log("⚡ [Atlas] Neues Signal entdeckt!", payload.new);
                this.addPinToMap(map, payload.new);
                if(window.Pusher) window.Pusher.showToast("NEUES SIGNAL ENTDECKT", "xp");
            })
            .subscribe();
    }

    addPinToMap(map, quest) {
        if (!quest.latitude || !quest.longitude) return;

        const isMine = (this.user && quest.creator_id === this.user.id);
        const isStory = (quest.type === 'story');
        
        let iconUrl = '../assets/images/beacon-blue.png'; 
        let className = 'glow-blue';
        
        if (isMine) { iconUrl = '../assets/images/cqr-logo-gold.png'; className = 'glow-gold'; }
        if (isStory) { iconUrl = '../assets/images/cqr-logo-gold.png'; className = 'animate-pulse-slow glow-gold'; }

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
        if (!navigator.geolocation) return alert("ANIMUS FEHLER: GPS Offline.");
        
        if(window.Pusher) window.Pusher.showToast("📡 SCANNE UMGEBUNG...", "default");

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const dist = this.getDistance(pos.coords.latitude, pos.coords.longitude, questLat, questLng);
            
            if (dist <= 100) { 
                await this.grantReward(questId, rewardExp);
                
                // Set Karma Target and Open Modal
                this.pendingKarmaTarget = creatorId; // Store content creator ID
                document.getElementById('karma-modal').style.display = 'flex';
                
            } else {
                alert(`SYNC FEHLGESCHLAGEN. Distanz: ${Math.round(dist)}m. Gehe näher ran (<100m).`);
            }
        }, err => alert("GPS BLOCKIERT: " + err.message));
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
            
            // Sync with Vitality Agent if present
            if (window.VitalityAgent) {
                window.VitalityAgent.addEXP(parseInt(xp));
            }

            await this.loadProfile();
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

            setTimeout(() => {
                alert(`LEVEL UP: You are now Level ${newLevel}.\nRedirecting to Mission Area...`);
                window.Helper ? window.Helper.safeRedirect(proto.targetUrl) : window.location.href = proto.targetUrl;
            }, 1000);

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
        if (quests.length === 0) {
            console.log("[Codex] System Protocol Active. Loading Standard Tutorial Sequence.");
            quests = this.SYSTEM_QUESTS.map(q => ({
                ...q,
                latitude: 38.71, // Mock coords for map
                longitude: -9.14,
                likes: Math.floor(Math.random() * 500)
            }));
            
            if(window.Pusher) window.Pusher.showToast("SYSTEM PROTOCOLS LOADED", "success");
        }

        this.allQuests = quests;
        this.renderCodexList(this.allQuests);

        // 2. Check Auto-Flip from Map
        const targetId = sessionStorage.getItem('target_codex_id');
        if (targetId) {
            const target = this.allQuests.find(q => q.id === targetId);
            if (target) {
                setTimeout(() => {
                    this.showQuestDetails(target);
                    // Scroll to item
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
            
            // REDIRECTION LOGIC
            if (quest.page) {
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
    async initBrotherhood() {
        console.log("🏛️ [Brotherhood] Hierarchy Loaded.");
        
        let agents = [];
        try {
            // 1. Leaderboard
            const { data, error } = await this.supabase.from('profiles').select('*').order('exp', { ascending: false }).limit(20);
            if(error) throw error;
            agents = data || [];
        } catch(e) {
             console.warn("[Brotherhood] Connection Fluctuation. Accessing Local Cache (Demo Mode).", e);
        }

        // DEMO MODE FALLBACK
        if(agents.length === 0) {
            console.log("[Brotherhood] No agents found. Simulating Roster.");
            agents = [
                { id: 'bot-1', username: 'FlowMaster_Zero', exp: 9001, karma: 50 },
                { id: 'bot-2', username: 'Neon_Ninja', exp: 5000, karma: 20 },
                { id: 'bot-3', username: 'Cyber_Muse', exp: 3200, karma: 30 },
                { id: 'bot-me', username: (this.profile?.username || 'Initiate'), exp: (this.profile?.exp || 0), karma: 0 }
            ];
            // Sort simulated
            agents.sort((a,b) => b.exp - a.exp);
            if(window.Pusher) window.Pusher.showToast("DEMO MODE ACTIVE: SIMULATED AGENTS LOADED", "error");
        }

        const list = document.getElementById('leaderboard-list');
        if(list) {
            list.innerHTML = '';
            
            agents.forEach((ag, idx) => {
                 const div = document.createElement('div');
                 div.className = 'leaderboard-item';
                 div.innerHTML = `
                    <div class="agent-link" onclick="QuestEngine.openNeighborOrbit('${ag.id}', '${ag.username}')" style="cursor:pointer; display:flex; align-items:center;">
                        <span class="rank-num" style="color:${idx < 3 ? 'gold' : '#aaa'}; width:30px;">#${idx+1}</span>
                        <span class="agent-name hover:text-cyan-400 transition-colors">${ag.username || 'Unknown'}</span>
                    </div>
                    <div style="color:gold">${ag.exp} XP</div>
                 `;
                 list.appendChild(div);
            });
        }
        
        // Auto-load my own badges
        if(this.profile) this.renderBadges(this.profile.exp, 'my-badge-case'); // Assuming this ID exists in HTML
    }

    openNeighborOrbit(userId, username) {
        if(userId === this.user.id) return alert("Das bist du selbst.");
        
        // Open Comms directly
        if(window.confirm(`Vebindung zu ${username} herstellen?`)) {
            this.sendFriendRequest(userId);
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
            .select('*, profiles!requester_id(username)')
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

        // 2. Active Friends (Network)
        const { data: friends } = await this.supabase
            .from('brotherhood_links')
            .select(`
                id, 
                requester_id, receiver_id,
                p1:profiles!requester_id(username, id),
                p2:profiles!receiver_id(username, id)
            `)
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
        // Simple implementation for now
        const container = document.getElementById(containerId);
        if(!container) return;
        // Logic to add badges based on XP would go here
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

// Check if we need to show the modal on load
window.addEventListener('load', () => {
    // If we are on quest_map and came from Protocol 1 (or just check if it's done?)
    // For simplicity, if we are in Ghost Mode or Session exists, check if Quest 1 is done?
    // Let's just show it if the URL or Session Storage says so?
    // OR: Just show it if we are on quest_map.html and it's not done.
    
    setTimeout(() => {
        // Logic: If user has NOT completed Q-PROTO-01, show modal.
        // For prototype/walkthrough, let's show it if NO pins are loaded locally? 
        // Or better: Checking Profile requires async.
        
        if(document.getElementById('protocol-modal')) {
             // We can expose a method to check status
             // For now, let's force it open if we detect we are in "Tutorial Mode" or just arrived.
             // Simplest: If sessionStorage has 'target_quest_id' === 'Q-PROTO-01' ? No, that was for map target.
             // Let's check profile.
             
             const engine = window.QuestEngine;
             if(engine && (engine.user || engine.isOfflineMode)) {
                 // Check if incomplete
                 // Mock check for now: always show if not explicitly done this session?
                 // Real check:
                 // if(!engine.profile?.completed_quests?.includes('Q-PROTO-01')) {
                     document.getElementById('protocol-modal').style.display = 'flex';
                 // }
             }
        }
    }, 1000);
});

// End of Valid File Content
