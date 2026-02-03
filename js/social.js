/**
 * C.D.F Social Protocol
 * Handles Scouting (Search), Handshakes (Signals), and Green Light (Connections).
 */
class SocialEngine {
    constructor() {
        this.STORAGE_KEY_CONNECTIONS = 'cdf_connections';
        
        // Mock Database (Ghost Profiles)
        this.mockUsers = [
            { id: 'u1', name: 'DJ Qter', level: 8, class: 'Sonic Architect', avatar: 'Assets/images/logo.png', status: 'online' },
            { id: 'u2', name: 'Hempy Roots', level: 5, class: 'Culinary Alchemist', avatar: '', status: 'offline' },
            { id: 'u3', name: 'ShadowOne', level: 3, class: 'Visual Vanguard', avatar: '', status: 'busy' },
            { id: 'u4', name: 'Kreativlon', level: 7, class: 'Spirit Guide', avatar: '', status: 'online' },
            { id: 'u5', name: 'Outbreak Tunes', level: 4, class: 'Street Kinetic', avatar: '', status: 'online' }
        ];

        this.connections = this.loadConnections();
        this.init();
    }

    init() {
        // Render initial lists if on dashboard
        if (document.getElementById('social-hub-list')) {
            this.renderFriends();
        }
    }

    loadConnections() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY_CONNECTIONS) || '[]');
    }

    saveConnections() {
        localStorage.setItem(this.STORAGE_KEY_CONNECTIONS, JSON.stringify(this.connections));
    }

    /**
     * Phase 1: Scouting (Search)
     */
    searchUsers(query) {
        if (!query || query.length < 2) {
            document.getElementById('flow-network-list').innerHTML = '<div class="text-xs text-mist text-center py-4">Syncing Network...</div>';
            return;
        }

        const lowerQ = query.toLowerCase();
        const results = this.mockUsers.filter(u => 
            u.name.toLowerCase().includes(lowerQ) && 
            !this.isConnected(u.id) // Don't show already connected
        );

        this.renderSearchResults(results);
    }

    renderSearchResults(users) {
        const container = document.getElementById('flow-network-list');
        container.innerHTML = '';

        if (users.length === 0) {
            container.innerHTML = '<div class="text-xs text-red-400 text-center py-4">No signals found.</div>';
            return;
        }

        users.forEach(u => {
            const isPending = this.isPending(u.id);
            const btnHtml = isPending 
                ? `<span class="text-[10px] text-mist uppercase tracking-wider">Signal Sent</span>`
                : `<button onclick="Social.sendSignal('${u.id}')" class="px-3 py-1 bg-electric text-white text-[10px] font-bold rounded hover:bg-white hover:text-black transition-colors">SEND SIGNAL</button>`;

            container.innerHTML += `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xs border border-white/20">
                            ${u.name.charAt(0)}
                        </div>
                        <div>
                            <h4 class="text-sm font-bold text-white leading-none">${u.name}</h4>
                            <p class="text-[10px] text-mist mt-1">Lvl ${u.level} • ${u.class}</p>
                        </div>
                    </div>
                    ${btnHtml}
                </div>
            `;
        });
    }

    /**
     * Phase 2: Handshake (Send Signal)
     */
    sendSignal(targetId) {
        const target = this.mockUsers.find(u => u.id === targetId);
        if (!target) return;

        // Add to connections with 'pending' status
        this.connections.push({
            userId: targetId,
            name: target.name,
            status: 'pending',
            timestamp: Date.now()
        });
        
        this.saveConnections();
        
        // UI Feedback
        if(window.AgentGuide) AgentGuide.speak(`Signal sent to ${target.name}. Waiting for Sync.`);
        
        // Refresh Search Logic to update button
        const searchInput = document.getElementById('social-search');
        if(searchInput) this.searchUsers(searchInput.value); // Re-render

        // Simulation: Auto-Accept after 3 seconds for demo
        setTimeout(() => this.simulateRemoteAccept(targetId), 3000);
    }

    /**
     * Phase 3: Green Light (Sync)
     */
    simulateRemoteAccept(targetId) {
        const conn = this.connections.find(c => c.userId === targetId);
        if(conn) {
            conn.status = 'active'; // Green Light
            this.saveConnections();
            
            if(window.AgentGuide) AgentGuide.speak(`💚 Connection Synced: ${conn.name} is now in your Circle.`);
            this.renderFriends();
            
            // Re-render search to remove from list
            const searchInput = document.getElementById('social-search');
            if(searchInput) this.searchUsers(searchInput.value);
        }
    }

    /**
     * Helper Checks
     */
    isConnected(userId) {
        return this.connections.some(c => c.userId === userId && c.status === 'active');
    }

    isPending(userId) {
        return this.connections.some(c => c.userId === userId && c.status === 'pending');
    }

    /**
     * Dashboard Render
     */
    renderFriends() {
        const container = document.getElementById('social-hub-list');
        const activeFriends = this.connections.filter(c => c.status === 'active');
        
        container.innerHTML = '';

        if (activeFriends.length === 0) {
            container.innerHTML = '<div class="text-xs text-mist text-center py-4">No active connections. <br>Search for Agents below.</div>';
            return;
        }

        activeFriends.forEach(c => {
            const user = this.mockUsers.find(u => u.id === c.userId) || { name: c.name, class: 'Unknown', status: 'offline' };
            const statusColor = user.status === 'online' ? 'bg-green-500' : 'bg-gray-500';
            
            container.innerHTML += `
               <div class="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <div class="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center font-bold text-xs border border-white/20">
                                ${c.name.charAt(0)}
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-2.5 h-2.5 ${statusColor} rounded-full border border-black"></div>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-white group-hover:text-electric transition-colors">${c.name}</h4>
                            <p class="text-[9px] text-mist">${user.class}</p>
                        </div>
                    </div>
                    <button class="text-mist hover:text-white">
                        <span class="material-symbols-outlined text-sm">chat</span>
                    </button>
               </div> 
            `;
        });
    }
}

// Initialize Global
window.Social = new SocialEngine();
