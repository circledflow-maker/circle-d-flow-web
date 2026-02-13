/**
 * QUEST ENGINE v4.0 (The Animus Core)
 * Consolidates Map (Atlas), Board (Codex), Brotherhood (Legends), and Comms (Chat).
 * Built for "Lisbon Tech-Noir" aesthetics and Supabase Realtime.
 */

class QuestEngine {
    constructor() {
        this.name = "QuestEngine";
        this.supabase = window.supabaseClient; // Assumes supabase_client.js loaded first
        window.QuestEngine = this;

        // Global State
        this.user = null;
        this.profile = null;
        this.currentChatPartner = null;
        this.chatSubscription = null;
        
        // Caches
        this.allQuests = []; 
        this.mapMarkers = {};

        this.init();
    }

    async init() {
        console.log("⚡ [QuestEngine] Animus System Booting...");
        
        // 1. Auth Check
        const { data: { session } } = await this.supabase.auth.getSession();
        if(session) {
            this.user = session.user;
            await this.loadProfile();
        } else {
            console.warn("[QuestEngine] No active navigator. Access restricted.");
        }

        // 2. Initialize Subsystems based on current page
        const path = window.location.pathname;
        if(path.includes('quest_map')) this.initAtlas();
        if(path.includes('quest_board')) this.initCodex();
        if(path.includes('hall_of_legends')) this.initBrotherhood();
        
        // 3. Initialize Global Comms (Sidebar)
        this.initComms();

        // 4. Highlight Nav
        this.updateGlobalNav();
    }

    async loadProfile() {
        const { data } = await this.supabase.from('profiles').select('*').eq('id', this.user.id).single();
        this.profile = data;
        window.userProfile = data; // Legacy support
        console.log(`[QuestEngine] Profile Sync: ${data.username} | ${data.exp} XP | ${data.karma} Karma`);
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('PROFILE_UPDATED', { detail: data }));
    }

    // --- 1. THE ATLAS (Map Logic) ---
    async initAtlas() {
        console.log("📍 [Atlas] Radar Online.");
        
        // Note: Leaflet map object 'map' is global in the HTML script.
        // We wait for window.map to be ready or we assume the HTML calls loadWorldBeacons(map)
        window.loadMapPins = (map) => this.loadWorldBeacons(map);
    }

    async loadWorldBeacons(map) {
        // 1. Load Existing
        const { data: quests, error } = await this.supabase.from('user_quests').select('*');
        if(error) return console.error("Radar Error", error);

        quests.forEach(q => this.addPinToMap(map, q));

        // 2. Subscribe to Realtime Updates
        this.supabase
            .channel('public:user_quests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_quests' }, payload => {
                console.log("⚡ [Atlas] New signal detected!", payload.new);
                this.addPinToMap(map, payload.new);
                if(window.Pusher) window.Pusher.showToast("NEW BEACON DETECTED", "xp");
            })
            .subscribe();
    }

    addPinToMap(map, quest) {
        if (!quest.latitude || !quest.longitude) return;

        const isMine = (this.user && quest.creator_id === this.user.id);
        const isStory = (quest.type === 'story');
        
        // Icon Logic
        let iconUrl = '../assets/images/beacon-blue.png'; // Community Default
        let className = 'glow-blue';
        
        if (isMine) { iconUrl = '../assets/images/cqr-logo-gold.png'; className = 'glow-gold'; }
        if (isStory) { iconUrl = '../assets/images/cqr-logo-gold.png'; className = 'animate-pulse-slow glow-gold'; }

        const icon = L.icon({ iconUrl, iconSize: [30, 30], className });

        // Popup Logic
        const popupContent = `
            <div class="animus-popup-content">
                <h3>${quest.title}</h3>
                <p>${isStory ? 'CORE MEMORY' : 'COMMUNITY ECHO'}</p>
                <p>Reward: <span style="color:gold">${quest.reward_exp} XP</span></p>
                <div style="font-size:0.8em; color:#888;">Likes: ${quest.likes || 0}</div>
                
                <button class="animus-popup-btn sync" onclick="QuestEngine.attemptSync(${quest.latitude}, ${quest.longitude}, '${quest.id}', ${quest.reward_exp}, '${quest.creator_id}')">
                    📡 SYNCHRONIZE
                </button>
                
                <button class="animus-popup-btn" onclick="QuestEngine.openInCodex('${quest.id}')">
                    📖 VIEW IN CODEX
                </button>
            </div>
        `;

        L.marker([quest.latitude, quest.longitude], { icon })
         .addTo(map)
         .bindPopup(popupContent);
    }

    // GPS Sync & Karma Logic
    attemptSync(questLat, questLng, questId, rewardExp, creatorId) {
        if (!navigator.geolocation) return alert("ANIMUS ERROR: GPS Offline.");
        
        if(window.Pusher) window.Pusher.showToast("📡 SCANNING AREA...", "default");

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const dist = this.getDistance(pos.coords.latitude, pos.coords.longitude, questLat, questLng);
            
            if (dist <= 100) { // 100m Radius
                // Success!
                await this.grantReward(questId, rewardExp);
                
                // Show Karma Modal
                this.pendingKarmaTarget = creatorId;
                document.getElementById('karma-modal').style.display = 'flex';
                
            } else {
                alert(`SYNC FAILED. Distance: ${Math.round(dist)}m. Move closer (<100m).`);
            }
        }, err => alert("GPS BLOCK: " + err.message));
    }

    async grantReward(questId, xp) {
        // Check if already completed
        if(this.profile.completed_quests && this.profile.completed_quests.includes(questId)) {
            alert("⚠️ MEMORY ALREADY SYNCHRONIZED.");
            return;
        }

        // Update Profile
        const newExp = (this.profile.exp || 0) + parseInt(xp);
        const newCompleted = [...(this.profile.completed_quests || []), questId];

        const { error } = await this.supabase.from('profiles').update({ exp: newExp, completed_quests: newCompleted }).eq('id', this.user.id);
        
        if(!error) {
            if(window.Pusher) window.Pusher.showToast(`SYNC COMPLETE: +${xp} XP`, "success");
            if(window.SoundEngineer) window.SoundEngineer.playSFX('mission_complete');
            await this.loadProfile(); // Refresh local state
        }
    }

    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // metres
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
        
        // 1. Load Quests
        const { data: quests } = await this.supabase.from('user_quests').select('*').order('created_at', { ascending: false });
        this.allQuests = quests || [];
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
        if(!list) return;
        list.innerHTML = '';

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
    }

    showQuestDetails(quest) {
        // 3D Flip
        const page = document.getElementById('quest-detail-page'); // Actually we might flip a sub-container, but let's assume the 'detail-card' inside needs update
        // The CSS assumes a class toggle on a container. 
        // Let's simply update content and trigger a visual refresh.
        
        const titleColor = (quest.type === 'story') ? 'gold' : '#00f0ff';
        
        document.getElementById('detail-title').innerText = quest.title;
        document.getElementById('detail-title').style.color = titleColor;
        document.getElementById('detail-desc').innerText = quest.description;
        document.getElementById('detail-exp').innerText = quest.reward_exp;
        
        const btn = document.getElementById('sync-btn');
        btn.style.display = 'block';
        btn.onclick = () => {
             sessionStorage.setItem('target_quest_id', quest.id);
             sessionStorage.setItem('target_quest_lat', quest.latitude);
             sessionStorage.setItem('target_quest_lng', quest.longitude);
             window.location.href = 'quest_map.html';
        };
    }

    filterCodex() { // Search
        const term = document.getElementById('codex-search').value.toLowerCase();
        const filtered = this.allQuests.filter(q => q.title.toLowerCase().includes(term));
        this.renderCodexList(filtered);
    }

    // --- 3. THE BROTHERHOOD (Brotherhood Logic) ---
    async initBrotherhood() {
        console.log("🏛️ [Brotherhood] Hierarchy Loaded.");
        
        // 1. Leaderboard
        const { data: agents } = await this.supabase.from('profiles').select('*').order('exp', { ascending: false }).limit(20);
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        
        agents.forEach((ag, idx) => {
             const div = document.createElement('div');
             div.className = 'leaderboard-item';
             div.innerHTML = `
                <div class="agent-link" onclick="QuestEngine.openNeighborOrbit('${ag.id}', '${ag.username}')">
                    <span class="rank-num" style="color:${idx < 3 ? 'gold' : '#aaa'}">#${idx+1}</span>
                    <span class="agent-name">${ag.username || 'Unknown'}</span>
                </div>
                <div style="color:gold">${ag.exp} XP</div>
             `;
             list.appendChild(div);
        });
        
        // Auto-load my own badges
        if(this.profile) this.renderBadges(this.profile.exp, 'my-badge-case'); // Assuming this ID exists in HTML
    }

    openNeighborOrbit(userId, username) {
        if(userId === this.user.id) return alert("That is your own reflection.");
        
        // Populate "Neighbor" View (Requires HTML Structure in hall_of_legends.html)
        // For now, let's open the Comms Link directly
        this.currentChatPartner = { id: userId, name: username };
        this.openChat(userId, username);
        this.toggleComms(true);
    }

    renderBadges(exp, containerId) {
        // Simple Badge Logic
        // ... (Implement based on provided snippet if container exists)
    }

    // --- 4. COMMS LINK (Chat) ---
    initComms() {
        // Inject Terminal HTML if missing? 
        // User instructions imply HTML is added to layout.
        // This function handles the logic.
    }

    toggleComms(show) {
        const term = document.getElementById('comms-terminal');
        const isHidden = term.classList.contains('comms-hidden'); // The CSS uses 'comms-hidden' for hidden state
        if (show || isHidden) {
            term.classList.remove('comms-hidden');
            term.classList.add('comms-visible');
            this.loadPendingRequests();
        } else {
            term.classList.remove('comms-visible');
            term.classList.add('comms-hidden');
        }
    }

    async loadPendingRequests() {
        // Populate Request Tab
        // ...
    }

    async openChat(partnerId, partnerName) {
        this.currentChatPartner = { id: partnerId, name: partnerName };
        document.getElementById('chat-partner-name').innerText = partnerName;
        document.getElementById('comms-chat-view').classList.add('active');
        document.getElementById('comms-network-view').classList.remove('active');
        
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
        // Hightlight active page in dock
        const path = window.location.pathname;
        if(path.includes('quest_map')) document.querySelector('#nav-map')?.classList.add('active');
        if(path.includes('quest_board')) document.querySelector('#nav-board')?.classList.add('active');
        if(path.includes('hall_of_legends')) document.querySelector('#nav-bro')?.classList.add('active');
    }
}

// Auto-Start
document.addEventListener('DOMContentLoaded', () => {
    new QuestEngine();
});

// Global Helpers for HTML triggers
window.toggleComms = () => window.QuestEngine.toggleComms();
window.switchCommsTab = (tab) => { /* ... UI Logic ... */ };
window.closeChat = () => { /* ... */ };
window.submitKarma = (isPos) => { /* ... */ };
window.closeKarmaModal = () => { document.getElementById('karma-modal').style.display='none'; };
