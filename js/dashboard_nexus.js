/**
 * APEX NEXUS - The Central Nervous System of the Apex Dashboard.
 * Handles: Level Gating, Visual Toggles, and Profile Interactions.
 * Dependencies: Gamification (gamification.js), Visual Eye (visual_eye.js)
 */

window.ApexNexus = {
    state: {
        mode: 'aura', // 'aura' (Dark) | 'lighthouse' (Light/High Contrast)
        currentLevel: 1
    },

    init: function() {
        
        // 1. Sync Level Data
        this.syncLevel();

        // 2. Check Gates (Lock/Unlock Sectors)
        this.checkGates();

        // 3. Initialize Visuals
        this.loadVisualMode();
        
        // 3.5 Check for Fresh Upgrade
        this.checkUpgradeStatus();

        // 3.6 Render Inventory (If exists)
        this.renderInventory();
        
        // 3.7 Render Connections (If exists)
        this.renderConnections();

        // 3.8 Trigger Ecosystem Commentary
        this.checkEcosystemState();
        
        // 3.9 Render Arena Status
        this.renderArenaStatus();
        
        // 3.10 Start System Logs
        this.renderSystemLogs();

        // 4. Listen for User Progression
        window.addEventListener('level-up', (e) => {
            this.syncLevel(); // Re-sync
            this.checkGates(); // Re-check locks
            this.pulseDashboard(); // Visual celebration
            this.showLevelUpModal(e.detail.level);
        });
    },

    // ... (existing code) ...

    renderInventory: function() {
        // 1. Get Inventory
        const inventory = JSON.parse(localStorage.getItem('cdf_inventory') || '[]');
        const sector = document.getElementById('sector-arsenal');
        
        if (!sector || inventory.length === 0) return;

        // 2. Find the description paragraph to replace/append
        const desc = sector.querySelector('p');
        if(desc) {
             desc.style.display = 'none'; // Hide default text
        
            // 3. Create Inventory Preview
            let previewHTML = `<div class="mt-2 space-y-1">`;
            const recent = inventory.slice(-3).reverse(); // Show last 3
            
            recent.forEach(item => {
                previewHTML += `
                    <div class="flex items-center gap-2 text-xs bg-white/5 p-1 rounded border border-white/5">
                        <span class="material-symbols-outlined text-[10px] text-orange-400">diamond</span>
                        <span class="truncate max-w-[100px] text-white/80" title="${item.title}">${item.title}</span>
                    </div>`;
            });
            
            if(inventory.length > 3) {
                previewHTML += `<div class="text-[9px] text-white/40 italic ml-1">+${inventory.length - 3} more in Vault</div>`;
            }
            previewHTML += `</div>`;

            // 4. Inject safely
            const existingInfo = sector.querySelector('.inventory-preview');
            if(existingInfo) existingInfo.remove();
            
            const wrapper = document.createElement('div');
            wrapper.className = 'inventory-preview animate-fade-in';
            wrapper.innerHTML = previewHTML;
            desc.parentNode.appendChild(wrapper);
        }
        
        // 5. Update Status Pill
        const pill = sector.querySelector('.text-white\\/20');
        if(pill) {
            pill.innerText = `${inventory.length} ITEMS`;
            pill.classList.add('text-orange-400', 'border-orange-500/50');
            pill.classList.remove('text-white/20');
        }
    },
    
    openProfile: function() {
        // 1. Get Data
        const userLevel = localStorage.getItem('cdf_level') || 1;
        const userXP = localStorage.getItem('cdf_xp') || 0;
        const className = localStorage.getItem('user_class') || 'Drifter';
        const nenType = localStorage.getItem('user_nen_type_v2') || 'Unknown';
        
        // 2. Create Modal
        let modal = document.getElementById('profile-modal');
        if(!modal) {
            modal = document.createElement('dialog');
            modal.id = 'profile-modal';
            modal.className = "bg-transparent p-0 backdrop:bg-black/90 backdrop:backdrop-blur-md open:animate-scale-in";
            document.body.appendChild(modal);
        }

        // 3. Build UI
        modal.innerHTML = `
            <div class="w-[500px] bg-[#0F0A13] border border-primary-500/30 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden relative">
                <!-- Background FX -->
                <div class="absolute inset-0 bg-[url('https://pub-24ba376bfccb446996666eaff4dbae12.r2.dev/grid.png')] opacity-[0.05]"></div>
                
                <!-- Header -->
                <div class="p-6 border-b border-white/10 flex justify-between items-center bg-primary-900/10 relative z-10">
                    <h2 class="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary-500">Badge</span>
                        Hunter License
                    </h2>
                    <button onclick="document.getElementById('profile-modal').close()" class="text-white/50 hover:text-white transition-colors material-symbols-outlined">close</button>
                </div>
                
                <!-- Content -->
                <div class="p-8 space-y-8 relative z-10">
                    
                    <!-- Avatar & Details -->
                    <div class="flex items-center gap-6">
                        <div class="w-24 h-24 rounded-full border-2 border-primary-500 overflow-hidden shadow-[0_0_20px_#A855F7]">
                            <img src="../Assets/images/logo.png" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-black text-white uppercase tracking-widest">Guest Hunter</h3>
                            <div class="flex gap-2 mt-2">
                                <span class="px-2 py-1 bg-white/10 rounded text-[10px] uppercase tracking-widest text-primary-300 border border-white/5">Class: ${className}</span>
                                <span class="px-2 py-1 bg-white/10 rounded text-[10px] uppercase tracking-widest text-orange-300 border border-white/5">Nen: ${nenType}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div class="text-[10px] text-white/40 uppercase tracking-widest">Level</div>
                            <div class="text-2xl font-bold text-white font-mono">${userLevel}</div>
                        </div>
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div class="text-[10px] text-white/40 uppercase tracking-widest">Experience</div>
                            <div class="text-2xl font-bold text-white font-mono">${userXP} <span class="text-xs text-white/30">XP</span></div>
                        </div>
                    </div>

                    <!-- REBIRTH BUTTON (Step 3 Requirement) -->
                    <div class="pt-6 border-t border-white/10 flex flex-col items-center gap-2">
                        <button onclick="if(confirm('WARNING: Initiate Rebirth Protocol?\n\nThis will reset your Nen Type and Class selection.\nCost: 0 Karma (First Time Free)')) { localStorage.removeItem('user_nen_type_v2'); localStorage.removeItem('user_class'); window.location.reload(); }" 
                            class="group relative px-6 py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500 rounded-lg transition-all w-full flex items-center justify-center gap-3">
                            <span class="material-symbols-outlined text-red-500 group-hover:animate-spin">change_circle</span>
                            <span class="text-xs font-bold text-red-400 uppercase tracking-widest group-hover:text-red-300">Initiate Rebirth</span>
                        </button>
                        <span class="text-[9px] text-white/20 uppercase tracking-widest">Resets Identity Matrix • Consumes Karma</span>
                    </div>

                </div>
            </div>
        `;
        
        modal.showModal();
    },

    openModal: function(type) {
        if(type === 'network') {
            this.renderNetworkModal();
            return;
        }

        // Re-use the Generic Cyber Modal logic if it exists, or alert for now
        if (window.openNexusModal) {
            window.openNexusModal(type);
        } else {
            // Fallback
            alert(`Opening ${type} Interface... (System Connecting)`);
        }
    },
    
    renderNetworkModal: function() {
        // ... (existing network modal code) ...
        // Re-using existing logic logic but ensuring separation 
        // This block is just for context matching in multi_replace if needed, 
        // but since I'm appending a NEW function, I'll place it nicely.
    },
    
    // NEW: The Upgrade Lightbox (Elevate Framework)
    openUpgrade: function() {
        let modal = document.getElementById('upgrade-modal');
        if(!modal) {
            modal = document.createElement('dialog');
            modal.id = 'upgrade-modal';
            modal.className = "bg-transparent p-0 backdrop:bg-black/90 backdrop:backdrop-blur-md open:animate-scale-in";
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="w-[900px] bg-[#0F0A13] border border-electric/30 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <!-- Header -->
                <div class="p-6 border-b border-white/10 flex justify-between items-center bg-electric/10 relative z-10">
                    <h2 class="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <span class="material-symbols-outlined text-electric">bolt</span>
                        Ascend the Hierarchy
                    </h2>
                    <button onclick="document.getElementById('upgrade-modal').close()" class="text-white/50 hover:text-white transition-colors material-symbols-outlined">close</button>
                </div>

                <!-- Tiera Grid -->
                <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <!-- FREE FLOW -->
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/10 transition-all opacity-50 grayscale">
                        <div class="border-b border-white/10 pb-4">
                             <h3 class="text-lg font-bold text-white">Free Flow</h3>
                             <p class="text-[10px] text-white/40 uppercase tracking-widest">Current Status</p>
                        </div>
                        <ul class="text-xs text-white/60 space-y-2">
                            <li>• Access to Archive</li>
                            <li>• 1 Active Quest</li>
                        </ul>
                    </div>

                    <!-- RISING ARTIST -->
                    <div class="relative bg-black border border-electric rounded-2xl p-6 flex flex-col gap-4 transform scale-105 shadow-[0_0_20px_rgba(154,77,255,0.3)]">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-electric text-white text-[9px] font-bold uppercase px-3 py-1 rounded-full">Recommended</div>
                        <div class="border-b border-white/10 pb-4">
                             <h3 class="text-lg font-bold text-electric">Rising Artist</h3>
                             <div class="flex items-baseline gap-1"><span class="text-2xl font-black text-white">9€</span><span class="text-[10px] text-white/50">/mo</span></div>
                        </div>
                        <ul class="text-xs text-white/80 space-y-2">
                            <li class="flex gap-2"><span class="text-electric">✓</span> Sell in Marketplace</li>
                            <li class="flex gap-2"><span class="text-electric">✓</span> 5 Active Quests</li>
                            <li class="flex gap-2"><span class="text-electric">✓</span> 5GB Storage</li>
                        </ul>
                        <button onclick="alert('Redirecting to Stripe...')" class="w-full py-3 rounded-lg bg-electric text-white text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors">
                            Upgrade Now
                        </button>
                    </div>

                    <!-- MASTER WORKSPACE -->
                    <div class="bg-gradient-to-b from-orange-900/20 to-black border border-orange-500/30 rounded-2xl p-6 flex flex-col gap-4 hover:border-orange-500 transition-all group">
                         <div class="border-b border-white/10 pb-4">
                             <h3 class="text-lg font-bold text-orange-500">Master</h3>
                             <div class="flex items-baseline gap-1"><span class="text-2xl font-black text-white">29€</span><span class="text-[10px] text-white/50">/mo</span></div>
                        </div>
                        <ul class="text-xs text-white/60 space-y-2 group-hover:text-white/90">
                            <li>• Unlimited Sales</li>
                            <li>• Real Life Perks</li>
                            <li>• Full API Access</li>
                        </ul>
                        <button onclick="alert('Redirecting to Stripe...')" class="w-full py-3 rounded-lg border border-orange-500 text-orange-500 text-xs font-bold uppercase hover:bg-orange-500 hover:text-black transition-colors">
                            Go Elite
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.showModal();
    },
    
    toggleMenu: function() {
        const menu = document.getElementById('mobile-wave-menu');
        const btn = document.getElementById('menu-btn');
        if(menu) {
             menu.classList.toggle('active');
             if(btn) btn.classList.toggle('active');
        }
    },

    renderConnections: function() {
        // 1. Get Ledger
        const ledger = JSON.parse(localStorage.getItem('cdf_ledger') || '[]');
        const sector = document.getElementById('sector-network');
        
        if (!sector || ledger.length === 0) return;

        // 2. Extract Unique Sellers (Connections)
        const connections = [...new Set(ledger.map(tx => tx.seller))].filter(s => s);
        
        if(connections.length === 0) return;

        // 3. Find Description
        const desc = sector.querySelector('p');
        if(desc) desc.style.display = 'none';

        // 4. Create Network Preview
        let previewHTML = `<div class="mt-2 flex flex-wrap gap-2">`;
        
        connections.slice(0, 4).forEach(name => { // Show max 4 avatars
            // Generate initials
            const initials = name.substring(0,2).toUpperCase();
            previewHTML += `
                <div class="flex items-center gap-1 bg-green-900/40 border border-green-500/30 px-2 py-1 rounded-full" title="Connected to ${name}">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-[10px] text-green-200 font-mono">${initials}</span>
                </div>`;
        });
        
        if(connections.length > 4) {
             previewHTML += `<div class="text-[10px] text-green-400 font-bold px-1">+${connections.length - 4}</div>`;
        }
        
        previewHTML += `</div>`;

        // 5. Inject
        const existingInfo = sector.querySelector('.network-preview');
        if(existingInfo) existingInfo.remove();
        
        const wrapper = document.createElement('div');
        wrapper.className = 'network-preview animate-fade-in';
        wrapper.innerHTML = previewHTML;
        if(desc) desc.parentNode.appendChild(wrapper);

        // 6. Update Status Pill
        const pill = sector.querySelector('.text-white\\/20');
        if(pill) {
            pill.innerText = `${connections.length} LINKS`;
            pill.classList.add('text-green-400', 'border-green-500/50');
            pill.classList.remove('text-white/20');
        }

        // 7. Inject Unread Badge (Simulation)
        if(connections.length > 0) {
            // Check if badge already exists
            if(!sector.querySelector('.network-badge')) {
                const badge = document.createElement('div');
                badge.className = "network-badge absolute top-4 right-4 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse border border-white/20";
                badge.innerText = connections.length; // 1 msg per connection mock
                sector.appendChild(badge);
                
                // Also trigger Flowee if not triggered yet
                if(window.Flowee && !localStorage.getItem('apex_network_badge_seen')) {
                    setTimeout(() => window.Flowee.talk(true, `Incoming transmission! You have ${connections.length} unread signals.`), 2000);
                    localStorage.setItem('apex_network_badge_seen', 'true');
                }
            }
        }
    },

    renderArenaStatus: function() {
        // 1. Get Arena Data (Simulated for now, or read from Battle logic)
        // In real app: JSON.parse(localStorage.getItem('cdf_tournament_state'))
        const activeTournament = "Obsidian Cup";
        const stage = "Qualifiers";
        const entrants = 12;

        const sector = document.getElementById('sector-colosseum') || document.querySelector('.apex-sector[onclick*="battle.html"]');
        if (!sector) return;

        // 2. Find Description
        const desc = sector.querySelector('p');
        if(desc) desc.style.display = 'none';

        // 3. Create Arena Preview
        let previewHTML = `
            <div class="mt-2 flex flex-col gap-1 animate-fade-in">
                <div class="flex justify-between items-center text-[10px] text-red-400 font-mono tracking-widest uppercase">
                    <span>${activeTournament}</span>
                    <span class="animate-pulse">LIVE</span>
                </div>
                <div class="h-1 w-full bg-red-900/30 rounded-full overflow-hidden">
                    <div class="h-full bg-red-500 w-[60%] animate-pulse"></div>
                </div>
                <div class="text-[10px] text-white/50 text-right">${entrants} Challengers</div>
            </div>`;

        // 4. Inject
        const existingInfo = sector.querySelector('.arena-preview');
        if(existingInfo) existingInfo.remove();
        
        const wrapper = document.createElement('div');
        wrapper.className = 'arena-preview';
        wrapper.innerHTML = previewHTML;
        if(desc) desc.parentNode.appendChild(wrapper);

        // 5. Update Status Pill
        const pill = sector.querySelector('.text-white\\/20');
        if(pill) {
            pill.innerText = `${stage.toUpperCase()}`;
            pill.classList.add('text-red-400', 'border-red-500/50');
            pill.classList.remove('text-white/20');
        }
    },

    performGlobalSearch: function(query) {
        if(!query || query.length < 2) {
            document.getElementById('search-results').classList.add('hidden');
            return;
        }

        const lowerQ = query.toLowerCase();
        const results = [];
        
        // 1. Search Navigation (Quests/Pages)
        const pages = [
            { name: "Marketplace", url: "marketplace.html", type: "SECTOR", icon: "storefront" },
            { name: "Colosseum", url: "battle.html", type: "SECTOR", icon: "swords" },
            { name: "Academy", url: "academy.html", type: "SECTOR", icon: "school" },
            { name: "Network", url: "#network", action: "ApexNexus.openModal('network')", type: "SECTOR", icon: "hub" },
            { name: "Profile", url: "#profile", action: "ApexNexus.openProfile()", type: "SYSTEM", icon: "person" }
        ];
        pages.forEach(p => {
            if(p.name.toLowerCase().includes(lowerQ)) results.push(p);
        });

        // 2. Search Inventory (Artifacts)
        const inventory = JSON.parse(localStorage.getItem('cdf_inventory') || '[]');
        inventory.forEach(item => {
            if(item.title.toLowerCase().includes(lowerQ)) {
                results.push({ name: item.title, type: "ARTIFACT", icon: "diamond", action: "window.location.href='marketplace.html'" });
            }
        });

        // 3. Search Connections (Users)
        const ledger = JSON.parse(localStorage.getItem('cdf_ledger') || '[]');
        const connections = [...new Set(ledger.map(tx => tx.seller))].filter(s => s);
        connections.forEach(user => {
            if(user.toLowerCase().includes(lowerQ)) {
                results.push({ name: user, type: "HUNTER", icon: "face", action: "ApexNexus.openModal('network')" });
            }
        });

        // Render Results
        const container = document.getElementById('search-content');
        const wrapper = document.getElementById('search-results');
        
        container.innerHTML = '';
        if(results.length === 0) {
            container.innerHTML = `<div class="p-2 text-white/30 text-xs text-center italic">No signals found.</div>`;
        } else {
            results.forEach(res => {
                const div = document.createElement('div');
                div.className = "flex items-center justify-between p-2 hover:bg-white/10 rounded cursor-pointer group transition-colors";
                div.onclick = () => {
                   if(res.action) { eval(res.action); }
                   else if(res.url) { window.location.href = res.url; }
                };
                div.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-xs text-primary-400">${res.icon}</span>
                        <span class="text-xs font-bold text-white group-hover:text-primary-400">${res.name}</span>
                    </div>
                    <span class="text-[9px] text-white/30 font-mono border border-white/10 px-1 rounded">${res.type}</span>
                `;
                container.appendChild(div);
            });
        }
        
        wrapper.classList.remove('hidden');
    },

    renderSystemLogs: function() {
        const events = [
            "User 'Neon_Ghost' found a Legendary Artifact in the Bazaar.",
            "Network: 5 New Hunters joined the Circle.",
            "System: Weekly Quest 'Void Walker' is now active.",
            "Marketplace: 'Golden Beat Pack' price surged by 10%.",
            "User 'Flow_Master' reached Level 50.",
            "Arena: 'Obsidian Cup' brackets are finalizing...",
            "System: Resilience check complete. All systems nominal.",
            "Connection: 'Sarah_Vibes' sent you a Karma Point."
        ];

        const output = document.getElementById('pulse-text');
        if(!output) return;

        let index = 0;
        
        setInterval(() => {
            // Fade Out
            output.style.opacity = '0';
            
            setTimeout(() => {
                // Update
                output.innerText = events[index];
                index = (index + 1) % events.length;
                // Fade In
                output.style.opacity = '1';
                // Trigger small color shift
                output.classList.toggle('text-primary-400');
                output.classList.toggle('text-white');
            }, 500);
            
        }, 8000); // Cycle every 8 seconds
    },

    toggleMobileSearch: function() {
        const input = prompt("The Third Eye: Enter search term");
        if(input) this.performGlobalSearch(input);
    },

    checkEcosystemState: function() {
        if(!window.Flowee) return;
        
        // Delay to allow intro animations
        setTimeout(() => {
            const inventory = JSON.parse(localStorage.getItem('cdf_inventory') || '[]');
            const ledger = JSON.parse(localStorage.getItem('cdf_ledger') || '[]');
            
            // Priority 1: First Purchase
            if(inventory.length === 1 && !localStorage.getItem('apex_comment_first_buy')) {
                window.Flowee.talk(true, "First artifact secured! The Arsenal is awakening.");
                localStorage.setItem('apex_comment_first_buy', 'true');
                return;
            }
            
            // Priority 2: Growing Network
            if(ledger.length >= 3 && !localStorage.getItem('apex_comment_network_growth')) {
                window.Flowee.talk(true, "Your Network is expanding, Hunter! Keep building bridges.");
                localStorage.setItem('apex_comment_network_growth', 'true');
                return;
            }

            // Priority 3: Arena Hype (Random)
            if(Math.random() > 0.8) {
                window.Flowee.talk(false, "The Colosseum is loud tonight. Can you hear the bass?");
            }
            
            // Priority 4: Rich Vault (Random chance if > 5 items)
            if(inventory.length > 5 && Math.random() > 0.7) {
                 window.Flowee.talk(false, "That Vault is looking heavy... exquisite taste!");
            }
        }, 4000); // 4s delay
    },

    pulseDashboard: function() {
        document.body.classList.add('animate-pulse');
        setTimeout(() => document.body.classList.remove('animate-pulse'), 1000);
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.ApexNexus.init();
});
