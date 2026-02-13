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
        this.SYSTEM_QUESTS = [
            // 1. INITIATION
            { id: 'Q-INIT-001', title: 'PROTOCOL: THE FIRST BREATH', description: 'Enter the Gateway. Begin your journey.', reward_exp: 10, type: 'story', page: 'index.html' },
            { id: 'Q-INIT-002', title: 'PROTOCOL: IDENTIFICATION', description: 'Update Profile in Dashboard.', reward_exp: 50, type: 'story', page: 'dashboard.html' }, // Triggered manually in Profile
            // 2. TRINITY
            { id: 'Q-VIS-101', title: 'PROTOCOL: VISIONARY WITNESS', description: 'Visit the Gallery or Kiss Your Heart.', reward_exp: 30, type: 'story', page: 'gallery.html' },
            { id: 'Q-SOU-101', title: 'PROTOCOL: SONIC RESONANCE', description: 'Enter the Soundscape (Outbreak Tunes).', reward_exp: 30, type: 'story', page: 'outbreak_tunes.html' },
            { id: 'Q-TAS-101', title: 'PROTOCOL: CULINARY ALCHEMIST', description: 'Visit the African Queen Kitchen.', reward_exp: 30, type: 'story', page: 'african-queen-kitchen.html' },
            // 3. HIGH PALACE
            { id: 'Q-GOV-101', title: 'PROTOCOL: SOVEREIGN PATH', description: 'Enter the High Palast Hub.', reward_exp: 50, type: 'story', page: 'high_palast.html' },
            { id: 'Q-SOC-102', title: 'PROTOCOL: WISDOM KEEPER', description: 'Enter the Royal Library.', reward_exp: 40, type: 'story', page: 'library.html' },
            { id: 'Q-ECO-103', title: 'PROTOCOL: TREASURY INSPECTOR', description: 'Visit the Palast Treasury.', reward_exp: 40, type: 'story', page: 'palast_treasury.html' },
            // 4. BATTLE FIELD
            { id: 'Q-BAT-101', title: 'PROTOCOL: ENTER THE ARENA', description: 'Step into the Battle Arena.', reward_exp: 50, type: 'story', page: 'arena.html' },
            { id: 'Q-BAT-102', title: 'PROTOCOL: LADDER CLIMBER', description: 'Check the Hall of Legends.', reward_exp: 30, type: 'story', page: 'hall_of_legends.html' },
            // 5. MARKET
            { id: 'Q-ECO-101', title: 'PROTOCOL: BAZAAR WALKER', description: 'Enter the Marketplace.', reward_exp: 30, type: 'community', page: 'marketplace.html' },
            { id: 'Q-ECO-102', title: 'PROTOCOL: MERCHANTS MIND', description: 'Visit the Upload Station.', reward_exp: 50, type: 'community', page: 'marketplace-upload.html' },
            // 6. CONNECTION
            { id: 'Q-SOC-201', title: 'PROTOCOL: SIGNAL BOOST', description: 'Send a Friend Request.', reward_exp: 50, type: 'community', page: 'comms' }, // Manual Trigger
            { id: 'Q-SOC-202', title: 'PROTOCOL: GUILD MEMBER', description: 'Visit the Guild Hall.', reward_exp: 30, type: 'community', page: 'guild.html' },
            // 7. KNOWLEDGE
            { id: 'Q-KNO-101', title: 'PROTOCOL: ARCHIVE ACCESS', description: 'Open the Codex.', reward_exp: 30, type: 'story', page: 'quest_board.html' },
            { id: 'Q-KNO-102', title: 'PROTOCOL: QUIZ MASTER', description: 'Complete a Quiz.', reward_exp: 100, type: 'story', page: 'quiz.html' } // Manual Trigger
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

// End of Valid File Content
