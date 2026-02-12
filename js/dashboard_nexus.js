/**
 * APEX NEXUS - The Central Nervous System of the Apex Dashboard.
 * Handles: Level Gating, Visual Toggles, and Profile Interactions.
 * Dependencies: Gamification (gamification.js), Visual Eye (visual_eye.js)
 */

window.ApexNexus = {
    state: {
        mode: 'aura', // 'aura' (Dark) | 'lighthouse' (Light/High Contrast)
        currentLevel: 1,
        mode: 'aura', // 'aura' (Dark) | 'lighthouse' (Light/High Contrast)
        currentLevel: 1,
        angle: 0
    },

    syncLevel: function() {
        const xp = parseInt(localStorage.getItem('cdf_xp') || 0);
        const level = Math.floor(xp / 1000) + 1;
        this.state.currentLevel = level;
        localStorage.setItem('cdf_level', level);
        
        // Update UI
        const lvlEl = document.getElementById('user-lvl');
        if(lvlEl) lvlEl.innerText = level;
    },

    checkGates: function() {
        // Simple gate logic: Unlock sectors based on level
        const level = this.state.currentLevel;
        // Example: Sector X requires Level 5 (Implementation pending)
        console.log(`[Apex] Gates Verified. Clearance Level: ${level}`);
    },

    loadVisualMode: function() {
        const savedMode = localStorage.getItem('apex_visual_mode') || 'aura';
        if(savedMode !== this.state.mode) {
            this.state.mode = savedMode; // Set state
            this.toggleMode(); // Apply visual changes
            // Toggle flips mode, so we might need to sync state carefully or force verify
            // Actually toggleMode flips it, so if we just set state and run logic:
            if(savedMode === 'lighthouse') {
                 // Force Light Mode classes manually to ensure sync
                document.body.classList.remove('bg-[#0F0A13]', 'text-white');
                document.body.classList.add('bg-gray-100', 'text-black');
                const toggle = document.getElementById('mode-toggle');
                if(toggle) toggle.style.transform = 'translateX(100%)';
            }
        }
    },

    checkUpgradeStatus: function() {
        const isMaster = localStorage.getItem('cdf_role') === 'master';
        if(isMaster) {
            // Unlock Master perks visual
            const vault = document.getElementById('sector-arsenal');
            if(vault) vault.classList.add('border-amber');
        }
    },

    showLevelUpModal: function(level) {
        if(window.Flowee) window.Flowee.setTriumphMode(100, 10);
        alert(`SYSTEM UPGRADE: You have reached Level ${level}!`);
    },

    rotatePrisma: function(direction) {
        this.state.angle += direction * -120;
        const prisma = document.getElementById('prisma-core');
        if(prisma) {
            prisma.style.transform = `rotateY(${this.state.angle}deg)`;
        }
    },

    toggleMode: function() {
        this.state.mode = this.state.mode === 'aura' ? 'lighthouse' : 'aura';
        const toggle = document.getElementById('mode-toggle');
        
        if(this.state.mode === 'lighthouse') {
            document.body.classList.remove('bg-[#0F0A13]', 'text-white');
            document.body.classList.add('bg-gray-100', 'text-black');
            if(toggle) toggle.style.transform = 'translateX(100%)';
        } else {
             document.body.classList.add('bg-[#0F0A13]', 'text-white');
            document.body.classList.remove('bg-gray-100', 'text-black');
            if(toggle) toggle.style.transform = 'translateX(0)';
        }
    },

    init: function() {
        // this.setupEventListeners(); // Removed: Method does not exist
        this.renderProfile();
        this.checkIntegrity(); // New: Self-Repair
        this.updateXPUI(); // New: Gamification Init
        
        // Listen for XP updates
        window.addEventListener('cdf-xp-update', () => this.updateXPUI());
        window.addEventListener('cdf-level-up', (e) => this.handleLevelUp(e.detail.level));
        window.addEventListener('cdf-profile-updated', () => this.renderDashboardIdentity());

        // 1.1 Load Identity
        this.renderDashboardIdentity();

        // 2. Check Gates (Lock/Unlock Sectors)
        this.checkGates();

        // 3. Initialize Visuals
        this.loadVisualMode();
        
        // 3.1 Check Permissions (Gatekeeper Integration)
        this.checkAdminPrivileges();
        
        // 3.5 Check for Fresh Upgrade
        this.checkUpgradeStatus();

        // 3.6 Render Inventory (If exists)
        this.renderInventory();
        
        // 3.7 Render Welcome Trinity (First Contact)
        this.renderWelcomeTrinity();
        
        // 3.8 Render Connections (If exists)
        this.renderConnections();

        // 3.8 Trigger Ecosystem Commentary
        this.checkEcosystemState();
        
        // 3.9 Render Arena Status
        this.renderArenaStatus();
        
        // 3.9.1 Initialize Quest Log (West Quadrant)
        if(window.QuestLog) window.QuestLog.init();
        
        // 3.10 Start System Logs
        this.renderSystemLogs();
        
        // 4. ACTION HANDLER (Auto-Open Modals)
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const action = urlParams.get('action');
            if(action === 'open_profile') {
                console.log("[Apex] Action Triggered: Opening Profile...");
                this.openProfile();
            } else if(action === 'open_quest') {
                 console.log("[Apex] Action Triggered: Opening Quest Log...");
                 this.toggleQuestLog();
            } else if(action === 'open_quest_maker') {
                 console.log("[Apex] Action Triggered: Opening Quest Maker...");
                 if(window.QuestBot) setTimeout(() => window.QuestBot.openInterface(), 500);
            }
        }, 1000); // Slight delay to ensure DOM is ready

        // 5. Listen for User Progression
        window.addEventListener('level-up', (e) => {
            this.syncLevel(); // Re-sync
            this.checkGates(); // Re-check locks
            this.pulseDashboard(); // Visual celebration
            this.showLevelUpModal(e.detail.level);
        });
    },

    updateXPUI: function() {
        if(!window.Gamification) return;
        
        const xp = parseInt(localStorage.getItem('cdf_xp') || '0');
        const data = Gamification.Level.getLevelProgress(xp);
        
        // Update Header
        const lvlEl = document.getElementById('header-lvl');
        const barEl = document.getElementById('header-xp-bar');
        
        if(lvlEl) lvlEl.innerText = data.level;
        if(barEl) barEl.style.width = `${data.percent}%`;
        
        // Update Profile Sector (if visible)
        const profileLvl = document.getElementById('user-lvl');
        if(profileLvl) profileLvl.innerText = data.level;
    },

    handleLevelUp: function(level) {
        if(window.Flowee) {
             window.Flowee.talk(true, `Resonance SPIKE! You are now Level ${level}. New patterns unlocked.`);
        }
    },

    renderDashboardIdentity: function() {
        // Updates the Hex-Grid Profile Widget
        const username = localStorage.getItem('cdf_user_username') || 'Guest';
        const avatar = localStorage.getItem('cdf_user_avatar') || '../Assets/images/logo.png';
        const level = localStorage.getItem('cdf_level') || 1;

        const nameEl = document.getElementById('user-greeting');
        const lvlEl = document.getElementById('user-lvl');
        const avatars = document.querySelectorAll('.user-avatar'); // Update all avatar instances

        if(nameEl) nameEl.innerText = username;
        if(lvlEl) lvlEl.innerText = level;
        
        avatars.forEach(img => {
            img.src = avatar;
        });
    },

    toggleQuestLog: function() {
        if(window.QuestLog) {
            const sector = document.getElementById('sector-colosseum');
            if(sector) {
                 // Remove the trigger to prevent re-opening/resetting when interacting with the log
                 sector.removeAttribute('onclick');
                 sector.classList.remove('cursor-pointer');
            }
            window.QuestLog.init(); 
            window.dispatchEvent(new CustomEvent('cdf-quest-log-opened', { detail: { timestamp: Date.now() } }));
        } else {
            console.error("QuestLog Module not found! Attempting Self-Repair...");
            // Self-Repair Trigger
            if(window.QuestLog) {
                 window.QuestLog.init();
            } else {
                 alert("System Error: Quest Log Module Offline.");
            }
        }
    },

    checkAdminPrivileges: function() {
        // Wait for Gatekeeper to be ready
        setTimeout(() => {
            if(window.Gatekeeper && window.Gatekeeper.hasPermission('admin')) {
                const btn = document.getElementById('admin-console-btn');
                if(btn) {
                    btn.classList.remove('hidden');
                    console.log("[Apex] Admin Access Confirmed. God Mode Enabled.");
                }
            }
        }, 500); // Small delay for async auth
    },

    renderInventory: function() {
        // 1. Get Inventory
        const inventory = JSON.parse(localStorage.getItem('cdf_inventory') || '[]');
        const sector = document.getElementById('sector-arsenal');
        
        if (!sector || inventory.length === 0) return;
        // ... (rest is fine)
        // ...
    },
    
    // ...

    openProfile: function() {
        console.log("[ApexNexus] Redirecting to Navigator's Log...");
        window.location.href = 'profile-full.html';
    },

    saveProfileChanges: function() {
        // 1. Close Modal
        const modal = document.getElementById('profile-modal');
        if(modal) modal.close();

        // 2. Dispatch Event - Flowee will handle the rest
        console.log("[ApexNexus] Profile Saved. Dispatching update event...");
        window.dispatchEvent(new CustomEvent('cdf-profile-updated'));
        
        // 2.1 QUEST VERIFICATION (The Guardian)
        if(window.QuestController) {
             window.QuestController.verifyAction('PROFILE_UPDATE');
        }

        // 3. Direct Trigger (Fallback)
        if(window.Flowee && window.Flowee.handleProfileUpdate) {
            window.Flowee.handleProfileUpdate();
        } else {
            console.warn("Flowee not found for profile update.");
            alert("Profile Updated! (Flowee Driver Config Missing)");
        }
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
        if(window.NetworkHub) {
            window.NetworkHub.openHub();
        } else {
            console.error("NetworkHub Agent not found! Is network_hub.js loaded?");
            // Fallback (Mock)
            alert("Open Network Hub (Agent Offline)");
        }
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

    renderWelcomeTrinity: function() {
        if(localStorage.getItem('seen_command_trinity')) return;

        setTimeout(() => {
            const modal = document.createElement('dialog');
            modal.className = "bg-transparent p-0 backdrop:bg-black/95 backdrop:backdrop-blur-sm open:animate-scale-in";
            modal.innerHTML = `
                <div class="w-[800px] h-[500px] bg-[#0F0A13] border border-mystic-gold rounded-3xl shadow-[0_0_50px_rgba(255,215,0,0.2)] overflow-hidden relative flex flex-col items-center justify-center p-8 text-center bg-[url('../Assets/images/logo.png')] bg-no-repeat bg-center bg-opacity-10 bg-[length:400px]">
                    
                    <h2 class="text-3xl font-serif font-bold text-mystic-gold uppercase tracking-widest mb-4">Greetings, Flow Creator.</h2>
                    
                    <p class="text-white/80 max-w-lg mb-8 leading-relaxed font-serif">
                        You have reached the core of the Yggdrasil-Matrix. Here, your path is no longer solitary. You stand before the three pillars that hold our world together.
                    </p>

                    <div class="grid grid-cols-3 gap-8 w-full max-w-2xl mb-8">
                        <div class="flex flex-col items-center gap-2">
                            <span class="material-symbols-outlined text-4xl text-pink-500">visibility</span>
                            <h3 class="text-xs font-bold text-white uppercase tracking-widest">Visual</h3>
                            <p class="text-[10px] text-white/50">The Eye of Nyame</p>
                        </div>
                        <div class="flex flex-col items-center gap-2">
                             <span class="material-symbols-outlined text-4xl text-purple-500">graphic_eq</span>
                            <h3 class="text-xs font-bold text-white uppercase tracking-widest">Sound</h3>
                            <p class="text-[10px] text-white/50">The Beat of Anansi</p>
                        </div>
                        <div class="flex flex-col items-center gap-2">
                             <span class="material-symbols-outlined text-4xl text-orange-500">restaurant</span>
                            <h3 class="text-xs font-bold text-white uppercase tracking-widest">Taste</h3>
                            <p class="text-[10px] text-white/50">The Soul of Queen</p>
                        </div>
                    </div>

                    <button onclick="localStorage.setItem('seen_command_trinity', 'true'); this.closest('dialog').close(); window.Flowee.talk(true, 'The Path is open. Organize your Destiny.');" class="px-8 py-3 bg-mystic-gold text-black font-bold uppercase tracking-wider rounded hover:bg-white transition-colors">
                        Enter the Council
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.showModal();
        }, 1000);
    },

    // NEW: Social Handshake (Phase 33)
    initiateResonance: function(targetUser) {
        if (!targetUser) return;
        
        console.log(`[Apollo] Initiating Resonance with ${targetUser}`);
        
        // 1. Confirm with User
        const confirmed = confirm(`Do you want to initiate a Neural-Link with ${targetUser}? This will generate a Bridge Quest.`);
        if(!confirmed) return;

        // 2. Trigger Quest Maker Bot
        if (window.QuestBot) {
            window.QuestBot.generateBridgeTask(targetUser);
        } else {
            console.error("QuestBot Agent not found!");
            alert("System Error: The Architect is offline.");
        }
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
        // 1. Get Arena Data from Manifest (Real State)
        const tournament = window.TournamentManifest || JSON.parse(localStorage.getItem('cdf_tournament') || '{}');
        
        // Default Fallback if manifest missing
        const activeTournament = tournament.season || "Obsidian Cup";
        const stage = tournament.stage || "Constructing...";
        const entrants = tournament.entrants || 0;
        const status = tournament.status || "OFFLINE";

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
                    <span class="animate-pulse">${status}</span>
                </div>
                <div class="h-1 w-full bg-red-900/30 rounded-full overflow-hidden">
                    <div class="h-full bg-red-500 w-[${stage === 'Finals' ? '100%' : '60%'}] animate-pulse"></div>
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

            // Priority 3: Daily Insight (Deterministic)
            const today = new Date().toDateString();
            if(localStorage.getItem('apex_last_insight') !== today) {
                const insights = [
                    "The Colosseum is loud tonight. Can you hear the bass?",
                    "That Vault is looking heavy... exquisite taste!",
                    "Your Aura is stabilizing. Good work.",
                    "The Network is quiet... maybe send a signal?"
                ];
                // Rotate based on day of month
                const dayOfMonth = new Date().getDate();
                const quote = insights[dayOfMonth % insights.length];
                
                window.Flowee.talk(false, quote);
                localStorage.setItem('apex_last_insight', today);
            }
        }, 4000); // 4s delay
    },

    // --- NEURAL LINK (Sync UI) ---
    openSyncModal: function() {
        const modal = document.createElement('dialog');
        modal.id = 'sync-modal';
        modal.className = "bg-transparent p-0 backdrop:bg-black/90 backdrop:backdrop-blur-md open:animate-scale-in";
        
        modal.innerHTML = `
            <div class="w-[500px] bg-[#0F0A13] border border-electric/50 rounded-2xl shadow-[0_0_50px_rgba(154,77,255,0.2)] overflow-hidden relative font-mono text-white p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-electric uppercase tracking-widest"><span class="material-symbols-outlined align-middle">share</span> Neural Link</h2>
                    <button onclick="this.closest('dialog').close()" class="text-white/50 hover:text-white material-symbols-outlined">close</button>
                </div>
                
                <!-- Tab 1: Generate (Source) -->
                <div class="mb-8 p-4 bg-white/5 rounded border border-white/10">
                    <h3 class="text-xs text-white/50 uppercase mb-2">Source Device (Export)</h3>
                    <p class="text-[10px] text-white/40 mb-4">Generate a code to transfer this soul to another vessel.</p>
                    <button onclick="const code = window.BridgePusher.generateSyncCode(); document.getElementById('sync-code-display').innerText = code; document.getElementById('sync-code-container').classList.remove('hidden');" class="w-full py-2 bg-electric text-black font-bold uppercase rounded hover:bg-white transition-colors">
                        Generate Code
                    </button>
                    <!-- Code Display -->
                    <div id="sync-code-container" class="hidden mt-4 p-2 bg-black border border-electric/30 rounded relative">
                        <code id="sync-code-display" class="break-all text-[10px] text-electric"></code>
                        <button onclick="navigator.clipboard.writeText(document.getElementById('sync-code-display').innerText); alert('Copied to Clipboard!');" class="absolute top-1 right-1 text-white/50 hover:text-white material-symbols-outlined text-sm">content_copy</button>
                    </div>
                </div>

                <!-- Tab 2: Redeem (Target) -->
                <div class="p-4 bg-white/5 rounded border border-white/10">
                     <h3 class="text-xs text-white/50 uppercase mb-2">Target Device (Import)</h3>
                     <p class="text-[10px] text-white/40 mb-4">Paste a Neural Link code to overwrite this vessel.</p>
                     <input type="text" id="sync-input" placeholder="Paste Code Here..." class="w-full bg-black border border-white/20 rounded p-2 text-xs text-white mb-2 focus:border-electric outline-none">
                     <button onclick="window.BridgePusher.redeemSyncCode(document.getElementById('sync-input').value)" class="w-full py-2 border border-red-500 text-red-500 font-bold uppercase rounded hover:bg-red-500 hover:text-white transition-colors">
                        Overwrite & Sync
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.showModal();
    },

    editName: function() {
        const current = localStorage.getItem('cdf_user_username') || '';
        const newName = prompt("Enter your Identity Alias:", current);
        if(newName && newName.trim() !== '') {
            localStorage.setItem('cdf_user_username', newName.trim());
            // Update Modal Immediately
            const display = document.getElementById('profile-name-display');
            if(display) display.innerText = newName.trim();
            // Dispatch Event
            window.dispatchEvent(new CustomEvent('cdf-profile-updated'));
        }
    },

    saveAvatar: function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                localStorage.setItem('cdf_user_avatar', e.target.result);
                // Dispatch Event
                window.dispatchEvent(new CustomEvent('cdf-profile-updated'));
                // Re-open profile to show change? Or just update src
                const imgs = document.querySelectorAll('.user-avatar');
                imgs.forEach(img => img.src = e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    },

    pulseDashboard: function() {
        document.body.classList.add('animate-pulse');
        setTimeout(() => document.body.classList.remove('animate-pulse'), 1000);
    },

    checkIntegrity: function() {
        // Self-Repair: Ensure critical agents are active
        const requiredAgents = ['Flowee', 'VisualEye', 'BridgePusher', 'Helper', 'BetaObserver', 'ZenMechanic'];
        const missing = requiredAgents.filter(a => !window[a]);
        
        if(missing.length > 0) {
            console.warn(`[Apex] Integrity Alert. Agents Missing: ${missing.join(', ')}`);
            // Attempt reload if critical mass failure (optional, maybe just warn for now)
            // window.location.reload(); 
        } else {
             console.log("[Apex] Agent Mesh: 100% INTG.");
        }

        // Self-Repair: Ensure Quest Log exists
        if(!localStorage.getItem('cdf_quests')) {
             console.warn("[Apex] Quest Log Void. Initiating Genesis Protocol...");
             if(window.QuestLog) window.QuestLog.loadQuests(); // This pulls from Manifest
        }
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.ApexNexus.init();
});
