
/**
 * QUEST ENGINE (The Animus Core)
 * Manages Quest Tracking, GPS Sync, Codex Logic, and Brotherhood Ranking.
 */

// Global Registry of System Quests
window.QUEST_REGISTRY = {
    'q1_identity': { id: 'q1_identity', title: 'The Awakening', description: 'Establish your identity in the flow.', exp: 100, type: 'story' },
    'q2_first_step': { id: 'q2_first_step', title: 'First Step', description: 'Begin your journey.', exp: 50, type: 'story' },
    'q4_kitchen': { id: 'q4_kitchen', title: 'The Fuel', description: 'Visit African Queen for sustenance.', exp: 75, type: 'location', lat: 38.6963, lng: -9.2044 }
};

class QuestEngine {
    constructor() {
        this.name = "QuestEngine";
        this.initialized = false;
        window.QuestEngine = this; // Expose globally
        this.init();
    }

    async init() {
        console.log("[QuestEngine] Initializing Animus Protocol...");
        // Ensure Supabase
        if(window.supabaseClient) {
            this.supabase = window.supabaseClient;
        } else {
            console.warn("[QuestEngine] Supabase not found. Retrying in 1s...");
            setTimeout(() => this.init(), 1000);
            return;
        }

        // Load User Profile
        await this.loadUserProfile();
        this.initialized = true;
        console.log("[QuestEngine] Animus Online.");
    }

    async loadUserProfile() {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            const { data } = await this.supabase.from('profiles').select('*').eq('id', session.user.id).single();
            window.userProfile = data;
             // Ensure completed_quests array exists
            if(window.userProfile && !window.userProfile.completed_quests) window.userProfile.completed_quests = [];
            console.log("[QuestEngine] Profile Sync Complete:", window.userProfile?.username);
        }
    }

    // --- CORE QUEST LOGIC (XP & Completion) ---

    async completeQuest(questId) {
        if(!window.userProfile) await this.loadUserProfile();
        
        const profile = window.userProfile;
        if(profile.completed_quests.includes(questId)) {
            console.log("[QuestEngine] Memory already synchronized.");
            return false;
        }

        // 1. Add to local list
        profile.completed_quests.push(questId);
        
        // 2. Award XP (Fetch from registry or DB)
        let xpReward = 50; // default
        if(window.QUEST_REGISTRY[questId]) xpReward = window.QUEST_REGISTRY[questId].exp;
        
        // 3. Update DB
        const newExp = (profile.exp || 0) + xpReward;
        
        const { error } = await this.supabase.from('profiles').update({
            completed_quests: profile.completed_quests,
            exp: newExp
        }).eq('id', profile.id);

        if(error) {
            console.error("[QuestEngine] Sync Error:", error);
            return false;
        }

        // 4. Notify
        console.log(`[QuestEngine] Sequence ${questId} Complete! +${xpReward} XP`);
        if(window.Pusher) window.Pusher.showToast(`Sequence Complete: +${xpReward} XP`, "success");
        if(window.SoundEngineer) window.SoundEngineer.playSFX('mission_complete');

        // Update local object
        window.userProfile.exp = newExp;
        return true;
    }
}

// Auto-start
new QuestEngine();


/* --- CODEX LOGIC (Quest Board) --- */

// 1. Tab Logic for Reading/Encoding Memories
window.switchTab = function(mode) {
    const readPage = document.getElementById('quest-detail-page');
    const writePage = document.getElementById('quest-create-page');
    const readBtn = document.getElementById('tab-read');
    const writeBtn = document.getElementById('tab-write');
    
    if(readBtn && writeBtn) {
        readBtn.classList.toggle('active', mode === 'read');
        writeBtn.classList.toggle('active', mode === 'write');
    }

    if(mode === 'read') {
        if(readPage) readPage.style.display = 'flex'; // It's a flex container
        if(writePage) writePage.style.display = 'none';
        // Reload list just in case
        if(window.loadAllQuests) window.loadAllQuests();
    } else {
        if(readPage) readPage.style.display = 'none';
        if(writePage) writePage.style.display = 'flex'; // Assuming flex for layout
    }
}

// 2. Load Quests into the Codex List
window.loadAllQuests = async function() {
    const listElement = document.getElementById('quest-anchor-list');
    if(!listElement) return;
    
    listElement.innerHTML = '<div class="loader text-gold blink">SEARCHING ANIMUS...</div>';

    // Fetch from Supabase
    const { data: quests, error } = await window.supabaseClient.from('user_quests').select('*').order('created_at', {ascending: false});
    if (error) {
        console.error(error);
        listElement.innerHTML = '<div class="text-red-500">MEMORY CORRUPTION DETECTED.</div>';
        return;
    }

    listElement.innerHTML = ''; // Clear

    // Add System Quests First (from Registry)
    Object.values(window.QUEST_REGISTRY).forEach(q => {
        if(q.type === 'location') createQuestListItem(q, listElement, true);
    });

    // Add User Quests
    if(quests && quests.length > 0) {
        quests.forEach(q => createQuestListItem(q, listElement, false));
    } else {
        listElement.innerHTML += '<div class="p-4 text-gray-500">No user fragments found.</div>';
    }
}

function createQuestListItem(q, container, isSystem) {
    const div = document.createElement('div');
    div.className = 'quest-item';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <strong>${isSystem ? '⭐ ' : ''}${q.title}</strong>
            <span style="color:gold;">${q.reward_exp} XP</span>
        </div>
        <small style="color:#666;">${isSystem ? 'System Core' : 'User Fragment'}</small>
    `;
    div.onclick = () => window.showQuestDetails(q);
    container.appendChild(div);
}

// 3. Show Details with Book Flip Animation
window.showQuestDetails = function(quest) {
    const page = document.getElementById('quest-detail-page');
    // Trigger Reflow for Animation re-run
    page.classList.remove('page-flip');
    void page.offsetWidth; 
    page.classList.add('page-flip');

    window.currentSelectedQuest = quest;
    
    document.getElementById('detail-title').innerText = quest.title;
    document.getElementById('detail-desc').innerText = quest.description || "No data available.";
    document.getElementById('detail-exp').innerText = quest.reward_exp;
    document.getElementById('detail-credits').innerText = (quest.reward_exp / 10).toFixed(0); // Dummy credit calc
    
    // Show/Hide Sync Button based on geo-data availability
    const btn = document.getElementById('sync-btn');
    if(quest.latitude && quest.longitude || (quest.lat && quest.lng)) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}

// 4. Redirect to Atlas with Focus
window.redirectToQuest = function() {
    if (!window.currentSelectedQuest) return;

    const q = window.currentSelectedQuest;
    const lat = q.latitude || q.lat;
    const lng = q.longitude || q.lng;
    const id = q.id;

    if(lat && lng) {
        sessionStorage.setItem('target_quest_lat', lat);
        sessionStorage.setItem('target_quest_lng', lng);
        sessionStorage.setItem('target_quest_id', id);
        window.location.href = 'quest_map.html';
    }
}


/* --- THE CODEX GUARDIAN (Validation) --- */

const BLACKLIST = ["spam", "fake", "badword", "idiot", "test"]; // Expand as needed

function validateQuestContent(title, desc) {
    const combined = (title + " " + desc).toLowerCase();
    
    // 1. Blacklist Check
    const hasForbiddenWord = BLACKLIST.some(word => combined.includes(word));
    if (hasForbiddenWord) return { valid: false, msg: "ANIMUS ERROR: Corrupted data string detected (Profanity/Spam)." };

    // 2. Length Check
    if (title.length < 3) return { valid: false, msg: "ERROR: Title too weak for synchronization." };
    if (desc.length < 10) return { valid: false, msg: "ERROR: Description lacks necessary depth." };

    return { valid: true };
}

/* --- GPS & CREATION LOGIC --- */

// 1. Get GPS for Form
window.getCurrentLocation = function() {
    if (!navigator.geolocation) return alert("GPS Module Offline.");
    
    const btn = document.querySelector('.geo-btn');
    if(btn) btn.innerText = "🛰️ TRIANGULATING...";
    
    navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById('new-lat').value = pos.coords.latitude;
        document.getElementById('new-lng').value = pos.coords.longitude;
        if(btn) btn.innerText = "📍 COORDINATES LOCKED";
        // alert("Coordinates Synchronized.");
    }, (err) => {
        alert("GPS Error: " + err.message);
        if(btn) btn.innerText = "❌ GPS ERROR";
    });
}

// 2. Submit New Quest (With Guardian Check)
window.submitNewQuest = async function() {
    const title = document.getElementById('new-title').value;
    const desc = document.getElementById('new-desc').value;
    const lat = document.getElementById('new-lat').value;
    const lng = document.getElementById('new-lng').value;
    const exp = document.getElementById('new-exp').value;

    // GUARDIAN CHECK
    const validation = validateQuestContent(title, desc);
    if (!validation.valid) {
        alert(validation.msg);
        return;
    }

    if(!title || !lat || !lng) return alert("Data Incomplete. Cannot Encode.");

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    const { data, error } = await window.supabaseClient.from('user_quests').insert([
        { 
            title: title, 
            description: desc, 
            latitude: parseFloat(lat), 
            longitude: parseFloat(lng), 
            reward_exp: parseInt(exp),
            creator_id: user.id
        }
    ]);

    if(error) {
        alert("Upload Error: " + error.message);
    } else {
        alert("BEACON ESTABLISHED. The Codex has been updated.");
        location.reload(); 
    }
}


/* --- BROTHERHOOD ENGINE (Hall of Legends) --- */

window.initBrotherhood = async function() {
    // 1. Fetch Leaderboard
    const { data: topAgents, error } = await window.supabaseClient
        .from('profiles')
        .select('username, exp')
        .order('exp', { ascending: false })
        .limit(10);

    if (error) return console.error(error);

    const list = document.getElementById('leaderboard-list');
    if(!list) return;

    list.innerHTML = '';

    topAgents.forEach((agent, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        // Rank 1 Gold, 2-3 Silver
        let rankColor = 'white';
        if(index === 0) rankColor = 'gold';
        if(index > 0 && index < 3) rankColor = 'silver';

        item.innerHTML = `
            <div><span class="rank-num" style="color:${rankColor}">#${index + 1}</span> <span class="${index < 3 ? 'glitch-text' : ''}" data-text="${agent.username}">${agent.username}</span></div>
            <div style="color:gold;">${agent.exp} XP</div>
        `;
        list.appendChild(item);
    });

    // 2. Fetch Own Data for Dossier
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if(user) {
        const { data: myProfile } = await window.supabaseClient.from('profiles').select('*').eq('id', user.id).single();
        if (myProfile) {
            if(document.getElementById('my-codename')) document.getElementById('my-codename').innerText = myProfile.username || "SUBJECT 17";
            if(document.getElementById('my-exp')) document.getElementById('my-exp').innerText = myProfile.exp;
            
            // Rank Calc
            window.updateRankUI(myProfile.exp);
            
            // Sync Rate
            // Mock total for now or fetch count
            const totalQuests = 20; // approximation
            const completed = myProfile.completed_quests ? myProfile.completed_quests.length : 0;
            const syncPercent = Math.min(100, Math.round((completed / totalQuests) * 100));
            
            if(document.getElementById('my-sync')) document.getElementById('my-sync').innerText = syncPercent + "%";
        }
    }
}

window.updateRankUI = function(exp) {
    let rank = "INITIATE";
    let nextXP = 500;
    
    if (exp >= 500) { rank = "ASSASSIN"; nextXP = 1500; }
    if (exp >= 1500) { rank = "MASTER"; nextXP = 5000; }
    if (exp >= 5000) { rank = "GRANDMASTER"; nextXP = 10000; }

    if(document.getElementById('my-rank-label')) document.getElementById('my-rank-label').innerText = rank;
    
    // Progress Bar
    const progress = Math.min(100, (exp / nextXP) * 100);
    if(document.getElementById('rank-progress-bar')) document.getElementById('rank-progress-bar').style.width = progress + "%";
}


/* --- ANIMUS MAP LOGIC (Atlas) --- */

window.loadMapPins = async function(mapObject) {
    // 1. Session Storage Focus Check
    const targetLat = sessionStorage.getItem('target_quest_lat');
    const targetLng = sessionStorage.getItem('target_quest_lng');
    const targetId = sessionStorage.getItem('target_quest_id');

    if (targetLat && targetLng) {
        mapObject.setView([targetLat, targetLng], 18);
        // Clear after use
        sessionStorage.removeItem('target_quest_lat');
        sessionStorage.removeItem('target_quest_lng');
    }

    // 2. Load System Quests
    const sysIcon = L.icon({
        iconUrl: '../assets/images/cqr-logo-gold.png', 
        iconSize: [30, 30],
        className: 'animate-pulse-slow' 
    });
    
    const userIcon = L.icon({
        iconUrl: '../assets/images/beacon-blue.png', 
        iconSize: [25, 25],
        className: 'opacity-80'
    });

    Object.values(window.QUEST_REGISTRY).forEach(q => {
        if(q.type === 'location' && q.lat && q.lng) {
            L.marker([q.lat, q.lng], {icon: sysIcon}).addTo(mapObject)
             .bindPopup(createPopupContent(q.title, "System Beacon", q.lat, q.lng, q.id));
             
             // Open popup if target
             if(targetId === q.id) {
                 // setTimeout(() => marker.openPopup(), 500); 
             }
        }
    });

    // 3. Load User Quests
    const { data: userQuests } = await window.supabaseClient.from('user_quests').select('*');
    if(userQuests) {
        userQuests.forEach(q => {
            if(q.latitude && q.longitude) {
                const marker = L.marker([q.latitude, q.longitude], {icon: userIcon}).addTo(mapObject);
                marker.bindPopup(createPopupContent(q.title, "User Fragment", q.latitude, q.longitude, q.id));
                 
                 if(targetId === q.id) {
                     setTimeout(() => marker.openPopup(), 1000);
                 }
            }
        });
    }
}

// Map Helpers
function createPopupContent(title, subtitle, lat, lng, questId) {
    return `
    <div style="text-align:center; font-family:'Courier New'; min-width:200px;">
        <h3 style="margin:0; color:#333; font-weight:bold;">${title}</h3>
        <p style="font-size:0.8em; color:#666;">${subtitle}</p>
        <button onclick="attemptSync(${lat}, ${lng}, '${questId}')" 
            style="background:black; color:gold; border:1px solid gold; width:100%; padding:8px; cursor:pointer; font-weight:bold; margin-top:5px;">
            📡 SYNCHRONIZE
        </button>
    </div>`;
}

window.attemptSync = async function(targetLat, targetLng, questId) {
    if(!navigator.geolocation) return alert("Animus Error: GPS Module not found.");

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const dist = getDistanceFromLatLonInM(userLat, userLng, targetLat, targetLng);
        
        if(dist < 100) { 
            const success = await window.QuestEngine.completeQuest(questId);
            if(success) {
                alert(`SYNCHRONIZATION COMPLETE. Distance: ${Math.round(dist)}m. XP Awarded.`);
                location.reload(); 
            } else {
                alert("Memory already synchronized.");
            }
        } else {
            alert(`SYNC FAILED. Target out of range. Distance: ${Math.round(dist)}m.`);
        }
    }, (err) => alert("GPS Error: " + err.message));
};

function getDistanceFromLatLonInM(lat1,lon1,lat2,lon2) {
  var R = 6371; 
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c * 1000;
}
function deg2rad(deg) { return deg * (Math.PI/180); }
