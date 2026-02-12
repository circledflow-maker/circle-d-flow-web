/**
 * Agent: Network Nexus (The South Quadrant)
 * Role: Manages the "Nexus Scroll" Lightbox, Tabs, and Sub-Agents (Constructor, Kingdom).
 */

class NetworkNexus {
    constructor() {
        this.name = "NetworkNexus";
        this.activeTab = 'friends';
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Calibrating South Quadrant...`);
        // We override the global ApexNexus.renderNetworkModal if it exists, 
        // or just attach ourselves if we are loaded after.
        // We'll expose a public method for the dashboard to call.
        window.NetworkHub = this;
        this.startHeartbeat();
    }

    /**
     * Opens the Network Lightbox
     */
    openHub() {
        this.injectLightbox();
        this.switchTab('friends'); // Default
    }

    injectLightbox() {
        if(document.getElementById('nexus-lightbox')) return;

        const lightbox = document.createElement('div');
        lightbox.id = 'nexus-lightbox';
        lightbox.className = "fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center opacity-0 transition-opacity duration-300";
        lightbox.innerHTML = `
            <div class="relative w-full max-w-5xl h-[85vh] bg-[#0F0A13] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transform scale-95 transition-transform duration-300" id="nexus-content">
                
                <!-- Header -->
                <div class="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#141018]">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-green-500 text-2xl">hub</span>
                        <h2 class="text-xl font-bold tracking-widest text-white">NETWORK NEXUS</h2>
                    </div>
                    <button onclick="NetworkHub.closeHub()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                        <span class="material-symbols-outlined text-white/50">close</span>
                    </button>
                </div>

                <!-- Main Layout: Sidebar + Content -->
                <div class="flex-1 flex overflow-hidden">
                    
                    <!-- Sidebar Navigation -->
                    <div class="w-16 md:w-64 border-r border-white/5 bg-[#0A080C] flex flex-col py-4 gap-2">
                        ${this.renderNavItem('friends', 'group', 'The Crew')}
                        ${this.renderNavItem('chat', 'forum', 'Resonance Bridge')}
                        ${this.renderNavItem('coop', 'handshake', 'Co-Op Field')}
                        ${this.renderNavItem('siphon', 'school', 'The Siphon')}
                        ${this.renderNavItem('kingdom', 'science', 'Kingdom of Science')}
                    </div>

                    <!-- Content Area -->
                    <div id="nexus-viewport" class="flex-1 bg-[url('../Assets/images/grid_bg.png')] bg-repeat opacity-80 relative overflow-y-auto custom-scrollbar p-0">
                        <!-- Dynamic Content Injected Here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(lightbox);

        // Animate In
        requestAnimationFrame(() => {
            lightbox.classList.remove('opacity-0');
            const content = document.getElementById('nexus-content');
            if(content) content.classList.remove('scale-95');
        });
    }

    renderNavItem(id, icon, label) {
        return `
            <button onclick="NetworkHub.switchTab('${id}')" 
                class="nexus-tab w-full flex items-center gap-4 px-4 py-3 text-left text-white/40 hover:text-white hover:bg-white/5 transition-all border-l-2 border-transparent"
                data-tab="${id}">
                <span class="material-symbols-outlined text-xl">${icon}</span>
                <span class="hidden md:block text-xs font-bold uppercase tracking-wider">${label}</span>
            </button>
        `;
    }

    closeHub() {
        const lb = document.getElementById('nexus-lightbox');
        if(!lb) return;
        
        lb.classList.add('opacity-0');
        document.getElementById('nexus-content').classList.add('scale-95');
        
        setTimeout(() => lb.remove(), 300);
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Update UI Tabs
        document.querySelectorAll('.nexus-tab').forEach(btn => {
            if(btn.dataset.tab === tabId) {
                btn.classList.add('text-electric', 'border-electric', 'bg-white/5');
                btn.classList.remove('text-white/40', 'border-transparent');
            } else {
                btn.classList.remove('text-electric', 'border-electric', 'bg-white/5');
                btn.classList.add('text-white/40', 'border-transparent');
            }
        });

        // Render Content
        const viewport = document.getElementById('nexus-viewport');
        viewport.innerHTML = ''; // Clear

        switch(tabId) {
            case 'friends': this.renderFriends(viewport); break;
            case 'chat': this.renderChat(viewport); break;
            case 'coop': this.renderCoOp(viewport); break;
            case 'siphon': this.renderSiphon(viewport); break;
            case 'kingdom': this.renderKingdom(viewport); break;
        }
    }

    // --- RENDERERS (Placeholders for now, logic will expand) ---

    renderFriends(container) {
        // Mock Database of Agents
        const betaAgents = [
            { id: 'agent_01', name: 'Neon_Viper', role: 'Visual Type', status: 'Online' },
            { id: 'agent_02', name: 'Audio_Monk', role: 'Sound Type', status: 'In Flow' },
            { id: 'agent_03', name: 'Code_Ronin', role: 'Builder', status: 'Offline' },
            { id: 'agent_04', name: 'Luna_Moth', role: 'Healer', status: 'Online' }
        ];

        // Load Friend List
        const myCrew = JSON.parse(localStorage.getItem('cdf_crew') || '[]');

        let html = `
            <div class="p-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <!-- COLUMN 1: MY CREW -->
                    <div>
                        <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-green-500">diversity_3</span> My Crew (${myCrew.length})
                        </h3>
                        <div class="space-y-3">
                            ${myCrew.length === 0 ? '<div class="text-white/30 text-sm italic">No Nakama yet. Connect with Beta Testers below.</div>' : ''}
                            ${myCrew.map(friend => `
                                <div class="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center justify-between group hover:border-[#CD7F32] transition-colors">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">
                                            ${friend.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div class="text-sm font-bold text-white">${friend.name}</div>
                                            <div class="text-[9px] text-white/50">${friend.role}</div>
                                        </div>
                                    </div>
                                    <button class="text-white/30 hover:text-white material-symbols-outlined text-sm" title="Message">chat</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- COLUMN 2: BETA TESTERS -->
                    <div>
                        <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-blue-500">public</span> Beta Network
                        </h3>
                        <div class="space-y-3">
                            ${betaAgents.map(agent => {
                                const isFriend = myCrew.find(f => f.id === agent.id);
                                return `
                                <div class="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs">
                                            <span class="material-symbols-outlined text-sm">person</span>
                                        </div>
                                        <div>
                                            <div class="text-sm font-bold text-white">${agent.name}</div>
                                            <div class="text-[9px] ${agent.status === 'Online' ? 'text-green-400' : 'text-white/30'} flex items-center gap-1">
                                                <div class="w-1.5 h-1.5 rounded-full ${agent.status === 'Online' ? 'bg-green-400 animate-pulse' : 'bg-white/20'}"></div>
                                                ${agent.status}
                                            </div>
                                        </div>
                                    </div>
                                    ${!isFriend ? `
                                        <button onclick="NetworkHub.addFriend('${agent.id}', '${agent.name}', '${agent.role}')" class="px-3 py-1 text-[10px] bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider">
                                            Connect
                                        </button>
                                    ` : `<span class="text-[9px] text-white/30 uppercase">Connected</span>`}
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    addFriend(id, name, role) {
        const myCrew = JSON.parse(localStorage.getItem('cdf_crew') || '[]');
        if(myCrew.find(f => f.id === id)) return;

        myCrew.push({ id, name, role, since: new Date().toISOString() });
        localStorage.setItem('cdf_crew', JSON.stringify(myCrew));
        
        // Refresh
        this.renderFriends(document.getElementById('nexus-viewport'));
        if(window.Pusher) window.Pusher.showToast(`${name} added to Crew!`, 'success');
        if(window.SoundEngineer) window.SoundEngineer.playSFX('equip_item');
    }

    renderChat(container) {
        // Load Chat History
        const chatHistory = JSON.parse(localStorage.getItem('cdf_global_chat') || '[]');
        const username = localStorage.getItem('cdf_username') || 'Captain';

        container.innerHTML = `
            <div class="flex flex-col h-full">
                <!-- Chat Area -->
                <div id="chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
                    <div class="text-center text-xs text-white/20 py-4 border-b border-white/5 mb-4">
                        --- BEGIN ENCRYPTED TRANSMISSION ---
                    </div>
                    ${chatHistory.length === 0 ? '<div class="text-center text-white/30 italic mt-10">Frequency Silent. Be the first to speak.</div>' : ''}
                    ${chatHistory.map(msg => `
                        <div class="flex flex-col ${msg.user === username ? 'items-end' : 'items-start'}">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-bold ${msg.user === 'SYSTEM' ? 'text-red-500' : (msg.user === username ? 'text-electric' : 'text-blue-400')} uppercase tracking-wider">
                                    ${msg.user}
                                </span>
                                <span class="text-[9px] text-white/20">${new Date(msg.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div class="max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${msg.user === username ? 'bg-electric/20 text-white border border-electric/30 rounded-tr-none' : (msg.user === 'SYSTEM' ? 'bg-red-900/20 text-red-200 border border-red-900/50' : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none')}">
                                ${msg.text}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Input Area -->
                <div class="h-20 bg-[#1A1622] border-t border-white/10 p-4 flex items-center gap-4">
                     <input type="text" id="chat-input" placeholder="Broadcast to Network..." 
                        class="flex-1 bg-black/50 border border-white/10 rounded-full px-6 py-2 text-white outline-none focus:border-electric transition-colors"
                        onkeypress="if(event.key === 'Enter') NetworkHub.sendChat()">
                     
                     <button onclick="NetworkHub.sendChat()" class="w-10 h-10 rounded-full bg-electric hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-[0_0_15px_rgba(138,43,226,0.4)]">
                        <span class="material-symbols-outlined text-sm">send</span>
                     </button>
                </div>
            </div>
        `;
        
        // Scroll to bottom
        setTimeout(() => {
            const chatBox = document.getElementById('chat-messages');
            if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 100);
    }

    sendChat() {
        const input = document.getElementById('chat-input');
        if(!input || !input.value.trim()) return;

        const text = input.value.trim();
        const username = localStorage.getItem('cdf_username') || 'Captain';
        
        const chatHistory = JSON.parse(localStorage.getItem('cdf_global_chat') || '[]');
        
        const msg = {
            id: Date.now(),
            user: username,
            text: text,
            ts: Date.now()
        };

        // Limit history to 50
        if(chatHistory.length >= 50) chatHistory.shift();
        
        chatHistory.push(msg);
        localStorage.setItem('cdf_global_chat', JSON.stringify(chatHistory));
        
        input.value = '';
        this.renderChat(document.getElementById('nexus-viewport'));

        // Simulate Reply for basic testing
        if(text.toLowerCase().includes('hello')) {
            setTimeout(() => this.receiveMockReply("Neon_Viper", "Welcome to the grid, Captain."), 2000);
        }
    }

    receiveMockReply(user, text) {
        const chatHistory = JSON.parse(localStorage.getItem('cdf_global_chat') || '[]');
        chatHistory.push({
            id: Date.now(),
            user: user,
            text: text,
            ts: Date.now()
        });
        localStorage.setItem('cdf_global_chat', JSON.stringify(chatHistory));
        
        // Refresh if chat is open
        if(this.activeTab === 'chat') {
            this.renderChat(document.getElementById('nexus-viewport'));
            if(window.SoundEngineer) window.SoundEngineer.playSFX('message_receive');
        }
    }

    renderCoOp(container) {
        // Level Gate Check
        const lvl = parseInt(localStorage.getItem('cdf_user_level') || '1');
        if(lvl < 3) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                    <span class="material-symbols-outlined text-6xl text-white/10 mb-4">lock</span>
                    <h2 class="text-2xl font-bold text-white mb-2">Level 3 Clearance Required</h2>
                    <p class="text-white/50 max-w-md">The Constructor Bot only responds to seasoned Captains. Raise your level to access Event Architecture.</p>
                </div>
            `;
            return;
        }

        // Init Constructor Bot if needed
        if(window.ConstructorBot) {
             window.ConstructorBot.renderUI(container);
        } else {
             container.innerHTML = `<div class="p-8 text-center text-white/50">Initializing Constructor Protocol...</div>`;
        }
    }

    renderSiphon(container) {
        container.innerHTML = `
            <div class="p-8">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-white">The Siphon</h3>
                    <div class="text-xs text-electric">Knowledge Base: Online</div>
                </div>
                <!-- Search -->
                <div class="relative mb-8">
                    <span class="material-symbols-outlined absolute left-4 top-3 text-white/30">search</span>
                    <input type="text" placeholder="Search the Matrix..." class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-white outline-none focus:border-electric transition-colors">
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Cards -->
                    <div class="bg-black/40 border border-white/5 p-4 rounded-xl hover:border-blue-500/50 transition-colors cursor-pointer group">
                        <div class="text-[10px] text-blue-400 mb-2 uppercase tracking-widest">Protocol</div>
                        <h4 class="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">How to Mint Quests</h4>
                        <p class="text-xs text-white/40">Step-by-step guide to verifying your first NFT artifact.</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderKingdom(container) {
         if(window.KingdomScience) {
             window.KingdomScience.renderProfile(container);
         } else {
             container.innerHTML = `<div class="p-8 text-center text-white/50">Loading Kingdom Data...</div>`;
         }
    }
    // --- SYSTEM CORE (Phase 23) ---

    startHeartbeat() {
        // 1. Connection Listener
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));

        // 2. Pulse (Every 30s)
        setInterval(() => this.checkSystemHealth(), 30000);
    }

    handleConnectionChange(isOnline) {
        if(isOnline) {
            console.log(`[${this.name}] Connection Restored. Syncing Queue...`);
            if(window.Pusher) window.Pusher.showToast('Link Re-established. Syncing Data...', 'success');
            this.processSyncQueue();
        } else {
            console.warn(`[${this.name}] Connection Lost. Entering Offline Mode.`);
            if(window.Pusher) window.Pusher.showToast('Link Lost. Data Cached Locally.', 'error');
        }
    }

    checkSystemHealth() {
        const stats = {
            online: navigator.onLine,
            agents: window.Helper ? 'Active' : 'Missing',
            timestamp: new Date().toISOString()
        };
        console.log(`[${this.name}] System Heartbeat: STABLE`, stats);
    }

    // --- DATA LAYER ---

    /**
     * Main Data Entry Point. 
     * Called by Helper.saveData() or agents directly.
     */
    async syncData(key, value) {
        // 1. Save Local (Immediate)
        localStorage.setItem(key, value);
        
        // 2. Sync "Cloud" (Async / Mock)
        if(navigator.onLine) {
            // Simulate Network Request
            // In real app: await fetch('/api/sync', { ... })
            console.log(`[${this.name}] ☁️ Syncing: ${key}`);
        } else {
            this.queueForSync(key, value);
        }

        return true;
    }

    queueForSync(key, value) {
        let queue = JSON.parse(localStorage.getItem('cdf_sync_queue') || '[]');
        queue.push({ key, value, ts: Date.now() });
        localStorage.setItem('cdf_sync_queue', JSON.stringify(queue));
    }

    processSyncQueue() {
        let queue = JSON.parse(localStorage.getItem('cdf_sync_queue') || '[]');
        if(queue.length === 0) return;

        console.log(`[${this.name}] Processing ${queue.length} items from Queue...`);
        // Simulate Batch Sync
        setTimeout(() => {
            localStorage.setItem('cdf_sync_queue', '[]'); // Clear
            if(window.Pusher) window.Pusher.showToast('Cloud Sync Complete.', 'success');
        }, 2000);
    }

    registerAgent(agentName) {
        console.log(`[${this.name}] Agent Registered: ${agentName}`);
    }
}

new NetworkNexus();
