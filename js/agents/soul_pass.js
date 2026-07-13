/**
 * Agent: SoulPass (The Seelen-Pass / Soul Nexus)
 * Purpose: A 3D interactive, holographic ID artifact tracking Flow-Siegels (Chakras), Profile, and Settings/Social integration.
 * Functions as the Command Center when the center node of the orbital navigation is clicked.
 */

class SoulPassAgent {
    constructor() {
        this.name = "SoulPass";
        // Ensure immediate availability
        window.SoulPass = this;
        this.isOpen = false;
        
        // Mocked or Local user data
        this.userData = {
            name: localStorage.getItem('cdf_user_username') || "Drifter",
            rank: localStorage.getItem('cdf_user_rank') || "Voyager",
            guild: "",
            exp: 0,
            karma: 0,
            level: 1,
            steps: 0,
            runes: 0,
            preferred_contact_method: "system_chat",
            contact_details: "{}"
        };

        window.addEventListener('POINTS_SYNCED', (e) => this.onPointsSynced(e.detail));
        window.addEventListener('DAILY_ACTIVITY_UPDATED', (e) => {
            this.userData.steps = e.detail?.steps || 0;
            this.refreshIdentityStats();
        });
        window.addEventListener('RUNE_COLLECTED', () => {
            this.userData.runes = Object.keys(JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}')).length;
            this.refreshIdentityStats();
        });

        this.init();
    }

    onPointsSynced(profile) {
        if (!profile) return;
        this.userData.name = profile.username || this.userData.name;
        this.userData.exp = profile.exp || 0;
        this.userData.karma = profile.karma || 0;
        this.userData.level = profile.level || Math.max(1, Math.floor((profile.exp || 0) / 200) + 1);
        const fc = profile.flow_class || 'Navigator';
        const admin = (fc.toLowerCase() === 'adminmaster') || localStorage.getItem('cdf_role') === 'AdminMaster';
        this.userData.rank = admin
            ? `LEVEL ${this.userData.level} · AdminMaster`
            : `LEVEL ${this.userData.level} · ${fc}`;
        this.userData.guild = profile.guild || '';
        const nameDisp = document.getElementById('sn-display-name');
        if (nameDisp) nameDisp.innerText = (this.userData.name || 'Navigator').toUpperCase();
        this.refreshIdentityStats();
    }

    refreshIdentityStats() {
        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set('sn-stat-exp', (this.userData.exp || 0).toLocaleString());
        set('sn-stat-karma', (this.userData.karma || 0).toLocaleString());
        set('sn-stat-steps', (this.userData.steps || 0).toLocaleString());
        set('sn-stat-runes', String(this.userData.runes || 0));
        const uid = this.userData.userId || '';
        set('sn-user-id', uid ? `UID · ${uid}` : 'UID · —');
        set('sn-user-id-account', uid || '—');
        const rankEl = document.getElementById('sn-stat-rank');
        if (rankEl) rankEl.textContent = this.userData.rank || 'LEVEL 1';
        const guildDisp = document.getElementById('sn-display-guild');
        if (guildDisp) {
            const g = this.userData.guild;
            guildDisp.innerText = g
                ? `Guild of ${g.charAt(0).toUpperCase() + g.slice(1)}`
                : 'Unassigned';
        }
        const badge = document.getElementById('sn-admin-badge');
        if (badge) {
            const isAdmin = localStorage.getItem('cdf_role') === 'AdminMaster' || (this.userData.rank || '').includes('AdminMaster');
            badge.style.display = isAdmin ? 'inline-block' : 'none';
        }
    }

    loadDailySteps() {
        const key = `cdf_daily_${new Date().toISOString().slice(0, 10)}`;
        try {
            const d = JSON.parse(localStorage.getItem(key) || '{}');
            this.userData.steps = d.steps || 0;
        } catch (_) {}
        this.userData.runes = Object.keys(JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}')).length;
    }

    async init() {
        console.log(`[${this.name}] Forging the Soul Nexus...`);
        this.injectStyles();
        this.loadDailySteps();
        
        if (!this.userData.preferred_contact_method) {
            this.userData.preferred_contact_method = 'system_chat';
            this.userData.contact_details = '{}';
        }

        if(window.supabaseClient) {
            try {
                const { data: { user }, error: authErr } = await window.supabaseClient.auth.getUser();
                if(user && !authErr) {
                    this.userData.userId = user.id;
                    this.userData.email = user.email;
                    const { data: profile, error: dbErr } = await window.supabaseClient.from('profiles').select('*').eq('id', user.id).single();
                    if(profile && !dbErr) {
                        if (window.WorldAccess) {
                            window.WorldAccess.profile = profile;
                            await window.WorldAccess.ensureAdminMaster(user, profile);
                        }
                        this.onPointsSynced(profile);
                        this.userData.preferred_contact_method = profile.preferred_contact_method || 'system_chat';
                        this.userData.contact_details = typeof profile.contact_details === 'string' ? profile.contact_details : JSON.stringify(profile.contact_details || {});
                        
                        const crystal = document.querySelector('.sp-crystal');
                        if(crystal) {
                            let detailsObj = {};
                            try { detailsObj = JSON.parse(this.userData.contact_details); } catch(e) {}
                            const avatar = profile.avatar_url || detailsObj.avatar_url;
                            if(avatar) {
                                crystal.style.background = `url('${avatar}') center/cover no-repeat`;
                            }
                        }
                    }
                }
            } catch(e) {
                console.warn("[SoulPass] Offline or init error:", e);
            }
        }
        if (window.PointsSync) window.PointsSync.refresh();
        this.refreshIdentityStats();
    }

    injectStyles() {
        if(document.getElementById('soul-nexus-styles')) return;

        const style = document.createElement('style');
        style.id = 'soul-nexus-styles';
        style.textContent = `
            .sn-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px);
                z-index: 100000; display: flex; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none; transition: opacity 0.5s ease;
            }
            .sn-overlay.active { opacity: 1; pointer-events: auto; }

            .sn-modal {
                width: 100vw; max-width: 1000px; height: 100dvh; max-height: 100dvh;
                background: linear-gradient(135deg, rgba(10,10,10,0.95), rgba(20,20,20,0.95));
                border: 1px solid rgba(212,175,55,0.3); border-radius: 20px;
                box-shadow: 0 0 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.1);
                display: flex; flex-direction: column; overflow: hidden;
                transform: scale(0.95) translateY(20px); transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
                box-sizing: border-box;
            }
            @media (min-width: 769px) {
                .sn-modal { width: 95vw; height: 85vh; max-height: 750px; border-radius: 20px; }
            }
            @media (max-width: 768px) {
                .sn-modal { border-radius: 0; border-left: none; border-right: none; }
                .sn-overlay { padding: 0; align-items: stretch; }
                .sn-header { padding: 14px 16px; }
                .sn-title { font-size: 1.1rem; letter-spacing: 2px; }
                .sn-content-area { padding: 16px; }
                .sp-crystal { width: 110px !important; height: 110px !important; }
                .sp-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
                .sn-tab { font-size: 0.7rem; padding: 10px 12px; white-space: nowrap; }
                .sn-tab .material-symbols-outlined { display: none; }
            }
            .sn-overlay.active .sn-modal { transform: scale(1) translateY(0); }

            /* Header */
            .sn-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 20px 30px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.4);
            }
            .sn-title { font-family: 'Cinzel', serif; color: #d4af37; font-size: 1.5rem; letter-spacing: 4px; text-shadow: 0 0 10px rgba(212,175,55,0.4); }
            .sn-close { 
                width: 40px; height: 40px; border-radius: 50%; border: 1px solid #d4af37; color: #d4af37;
                display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s;
                font-family: monospace; font-size: 1.2rem;
            }
            .sn-close:hover { background: #d4af37; color: #000; box-shadow: 0 0 15px #d4af37; transform: rotate(90deg); }

            /* Body & Layout */
            .sn-body { display: flex; flex: 1; overflow: hidden; flex-direction: row; }
            @media (max-width: 768px) {
                .sn-body { flex-direction: column; }
                .sn-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05); flex-direction: row !important; overflow-x: auto; padding: 10px !important; }
                .sn-tab { padding: 10px 15px !important; border-left: none !important; border-bottom: 3px solid transparent; }
                .sn-tab.active { border-left-color: transparent !important; border-bottom-color: #d4af37 !important; }
            }

            .sn-sidebar {
                width: 250px; background: rgba(0,0,0,0.6); border-right: 1px solid rgba(255,255,255,0.05);
                display: flex; flex-direction: column; gap: 5px; padding: 20px 0;
            }
            .sn-tab {
                padding: 15px 30px; color: #aaa; font-family: 'Space Mono', monospace; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;
                cursor: pointer; transition: 0.3s; border-left: 3px solid transparent; display: flex; align-items: center; gap: 10px;
            }
            .sn-tab:hover { background: rgba(212,175,55,0.05); color: #fff; }
            .sn-tab.active { border-left-color: #d4af37; background: rgba(212,175,55,0.1); color: #d4af37; text-shadow: 0 0 10px rgba(212,175,55,0.5); }
            
            .sn-content-area { flex: 1; padding: 30px; overflow-y: auto; position: relative; }
            .sn-content-area::-webkit-scrollbar { width: 6px; }
            .sn-content-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
            .sn-content-area::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 3px; }

            .sn-pane { display: none; animation: snFadeIn 0.4s ease-out; }
            .sn-pane.active { display: block; }
            @keyframes snFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            /* Soul Pass Specifics */
            .sp-crystal {
                width: 150px; height: 150px; margin: 0 auto 20px;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(154,77,255,0.6) 40%, rgba(10,0,30,0.8) 90%);
                border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
                box-shadow: 0 0 50px rgba(154,77,255,0.4), inset 0 0 30px rgba(255,255,255,0.5);
                animation: snBreathe 4s infinite ease-in-out;
            }
            @keyframes snBreathe { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.05) translateY(-10px); box-shadow: 0 0 70px rgba(154,77,255,0.6), inset 0 0 40px rgba(255,255,255,0.8); } }
            
            .sp-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin: 30px 0; }
            .sp-stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; text-align: center; }
            .sp-stat-val { font-size: 1.5rem; color: #d4af37; font-family: 'Space Mono', monospace; font-weight: bold; margin-top: 5px; }
            .sp-stat-label { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 1px; }

            /* Synapse Specifics */
            .sy-group { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .sy-group-title { font-family: 'Cinzel', serif; color: #fff; font-size: 1.1rem; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
            .sy-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .sy-row:last-child { margin-bottom: 0; }
            
            .sy-label { color: #ccc; font-family: 'Space Mono', monospace; font-size: 0.85rem; }
            .sy-input { background: #0a0a0a; border: 1px solid #333; color: #d4af37; padding: 8px 12px; border-radius: 6px; font-family: monospace; outline: none; transition: 0.3s; }
            .sy-input:focus { border-color: #d4af37; box-shadow: 0 0 10px rgba(212,175,55,0.2); }
            
            .sy-toggle { width: 44px; height: 24px; background: #333; border-radius: 12px; position: relative; cursor: pointer; transition: 0.3s; }
            .sy-toggle.on { background: #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.3); }
            .sy-toggle-knob { width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; }
            .sy-toggle.on .sy-toggle-knob { left: 23px; }
            
            .sy-btn { background: transparent; border: 1px solid #d4af37; color: #d4af37; padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: 0.3s; font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
            .sy-btn:hover { background: rgba(212,175,55,0.1); box-shadow: 0 0 15px rgba(212,175,55,0.3); }
            .sy-btn.focus { border-color: #9A4DFF; color: #9A4DFF; }
            .sy-btn.focus:hover { background: rgba(154,77,255,0.1); box-shadow: 0 0 15px rgba(154,77,255,0.3); }
            .sy-btn.danger { border-color: #ef4444; color: #ef4444; }
            .sy-btn.danger:hover { background: rgba(239,68,68,0.1); box-shadow: 0 0 15px rgba(239,68,68,0.3); }

            .sy-social-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
            .sy-social-card { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; text-align: center; cursor: pointer; transition: 0.3s; }
            .sy-social-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.3); }
            .sy-social-card.connected { border-color: #10b981; background: rgba(16,185,129,0.05); }
            .sy-social-icon { font-size: 2rem; margin-bottom: 10px; opacity: 0.6; }
            .sy-social-card.connected .sy-social-icon { opacity: 1; text-shadow: 0 0 15px currentColor; }
        `;
        document.head.appendChild(style);
    }

    renderArtifact() {
        const overlay = document.createElement('div');
        overlay.id = 'sp-root-overlay';
        overlay.className = 'sn-overlay';
        overlay.onclick = (e) => { if(e.target === overlay) this.close(); }

        const modal = document.createElement('div');
        modal.className = 'sn-modal';
        
        // Header
        const header = document.createElement('div');
        header.className = 'sn-header';
        header.innerHTML = `
            <div class="sn-title">SOUL NEXUS</div>
            <div class="sn-close" onclick="SoulPass.close()">X</div>
        `;

        // Body
        const body = document.createElement('div');
        body.className = 'sn-body';

        // Sidebar
        const sidebar = document.createElement('div');
        sidebar.className = 'sn-sidebar';
        sidebar.innerHTML = `
            <div class="sn-tab active" onclick="SoulPass.switchTab('pane-identity', this)">
                <span class="material-symbols-outlined">badge</span> Profile
            </div>
            <div class="sn-tab" onclick="SoulPass.switchTab('pane-synapse', this)">
                <span class="material-symbols-outlined">settings_input_component</span> Synapse
            </div>
            <div class="sn-tab" onclick="SoulPass.switchTab('pane-network', this)">
                <span class="material-symbols-outlined">hub</span> Comms
            </div>
            <div class="sn-tab" onclick="SoulPass.switchTab('pane-settings', this)">
                <span class="material-symbols-outlined">settings</span> Account
            </div>
        `;

        // Content Area
        const content = document.createElement('div');
        content.className = 'sn-content-area';
        
        let avatarStyle = '';
        let detailsObj = {};
        try { detailsObj = JSON.parse(this.userData.contact_details || '{}'); } catch(e) {}
        if(detailsObj.avatar_url) {
            avatarStyle = `style="background: url('${detailsObj.avatar_url}') center/cover no-repeat;"`;
        }

        // Pane: Identity (Soul Pass)
        const paneIdentity = document.createElement('div');
        paneIdentity.id = 'pane-identity';
        paneIdentity.className = 'sn-pane active';
        paneIdentity.innerHTML = `
            <div class="sp-crystal-container" style="text-align:center;">
                <div class="sp-crystal" ${avatarStyle}></div>
                <h2 style="font-family: 'Cinzel', serif; font-size: clamp(1.5rem, 6vw, 2.5rem); color: #fff; text-shadow: 0 0 15px rgba(255,255,255,0.3); margin-top: 16px;" id="sn-display-name">${(this.userData.name || "Navigator").toUpperCase()}</h2>
                <span id="sn-admin-badge" style="display:none; font-size:10px; color:#10b981; border:1px solid #10b981; padding:3px 8px; border-radius:12px; letter-spacing:1px;">ADMIN MASTER · ALL WORLDS</span>
                <p id="sn-user-id" style="font-family:'Space Mono',monospace;color:#666;font-size:0.65rem;letter-spacing:1px;margin-top:10px;word-break:break-all;">UID · —</p>
                <p style="font-family: 'Space Mono', monospace; color: #d4af37; letter-spacing: 2px; font-size: 0.75rem; margin-top: 8px;" id="sn-stat-rank">${this.userData.rank || 'LEVEL 1'}</p>
            </div>
            <label style="display:block;text-align:center;margin:12px 0 0;cursor:pointer;font-size:10px;color:#d4af37;letter-spacing:1px;text-transform:uppercase;">
                <input type="file" accept="image/*" class="hidden" onchange="SoulPass.uploadAvatar(this.files[0]); this.value='';">
                Upload portrait
            </label>
            
            <div class="sp-stats-grid">
                <div class="sp-stat-card">
                    <div class="sp-stat-label">Experience</div>
                    <div class="sp-stat-val" id="sn-stat-exp">${(this.userData.exp || 0).toLocaleString()}</div>
                </div>
                <div class="sp-stat-card">
                    <div class="sp-stat-label">Karma</div>
                    <div class="sp-stat-val" id="sn-stat-karma">${this.userData.karma || 0}</div>
                </div>
                <div class="sp-stat-card">
                    <div class="sp-stat-label">Steps Today</div>
                    <div class="sp-stat-val" id="sn-stat-steps">${(this.userData.steps || 0).toLocaleString()}</div>
                </div>
                <div class="sp-stat-card">
                    <div class="sp-stat-label">Adinkra Runes</div>
                    <div class="sp-stat-val" id="sn-stat-runes">${this.userData.runes || 0}</div>
                </div>
                <div class="sp-stat-card">
                    <div class="sp-stat-label">Allegiance</div>
                    <div class="sp-stat-val text-haki-gold" id="sn-display-guild" style="font-size:0.9rem;">${this.userData.guild ? "Guild of " + this.userData.guild.charAt(0).toUpperCase() + this.userData.guild.slice(1) : "Unassigned"}</div>
                </div>
            </div>
        `;

        // Pane: The Synapse (Settings)
        const paneSynapse = document.createElement('div');
        paneSynapse.id = 'pane-synapse';
        paneSynapse.className = 'sn-pane';
        paneSynapse.innerHTML = `
            <div class="sy-group">
                <div class="sy-group-title">Core Preferences</div>
                <div class="sy-row">
                    <span class="sy-label">Profile Name</span>
                    <input type="text" id="sy-name-input" class="sy-input" style="text-transform: uppercase;" value="${this.userData.name}" onchange="SoulPass.updateName(this.value)">
                </div>
                <div class="sy-row">
                    <span class="sy-label">Guild Allegiance</span>
                    <select class="sy-input" id="sy-guild-select" onchange="SoulPass.updateGuild(this.value)">
                        <option value="">-- No Guild --</option>
                        <option value="arts">Guild of Arts</option>
                        <option value="skills">Guild of Skills</option>
                        <option value="sounds">Guild of Sounds</option>
                        <option value="healing">Guild of Healing</option>
                        <option value="products">Guild of Products</option>
                        <option value="services">Guild of Services</option>
                        <option value="taste">Guild of Taste</option>
                    </select>
                </div>
                <div class="sy-row">
                    <span class="sy-label">Linguistic Matrix (Language)</span>
                    <select class="sy-input" id="sy-lang-select" onchange="localStorage.setItem('cdf_language', this.value); SoulPass.pulseFeedback();">
                        <option value="EN">EN - English</option>
                        <option value="PT">PT - Portuguese</option>
                        <option value="DE">DE - German</option>
                    </select>
                </div>
                <div class="sy-row">
                    <span class="sy-label">Profile Visibility</span>
                    <select class="sy-input" id="sy-vis-select" onchange="localStorage.setItem('cdf_visibility', this.value); SoulPass.pulseFeedback();">
                        <option value="Public">Public (Visible to all)</option>
                        <option value="Private">Private (Hidden)</option>
                    </select>
                </div>
            </div>

            <div class="sy-group">
                <div class="sy-group-title">Security & Operations</div>
                <div class="sy-row">
                    <span class="sy-label">Quantum Lock (2FA)</span>
                    <div class="sy-toggle" id="sy-2fa-toggle" onclick="this.classList.toggle('on'); localStorage.setItem('cdf_2fa', this.classList.contains('on')); SoulPass.pulseFeedback();">
                        <div class="sy-toggle-knob"></div>
                    </div>
                </div>
                <div class="sy-row" style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                    <button class="sy-btn focus" onclick="SoulPass.enterDeepFocus()" style="width: 100%;">Initiate Deep Focus</button>
                </div>
            </div>
        `;

        // Pane: Network (Social Connections)
        const paneNetwork = document.createElement('div');
        paneNetwork.id = 'pane-network';
        paneNetwork.className = 'sn-pane';
        paneNetwork.innerHTML = `
            <div class="sy-group">
                <div class="sy-group-title">Primary Comms Protocol</div>
                <div class="sy-row" style="flex-direction: column; align-items: stretch; gap: 15px;">
                    <select class="sy-input" id="sy-comms-method" onchange="SoulPass.updateCommsMethod(this.value)">
                        <option value="system_chat">System Chat (Default)</option>
                        <option value="whatsapp">WhatsApp Bridge</option>
                        <option value="instagram">Instagram Sync</option>
                    </select>
                    <input type="text" id="sy-comms-details" class="sy-input" style="display: none;" placeholder="Enter details..." onchange="SoulPass.saveCommsDetails(this.value)">
                </div>
            </div>

            <div class="sy-group">
                <div class="sy-group-title">External Bridges</div>
                <div class="sy-social-grid">
                    <div class="sy-social-card" onclick="SoulPass.initiateSocialSync('whatsapp')">
                        <div class="sy-social-icon text-green-500">ðŸ’¬</div>
                        <div class="sy-label text-center">WhatsApp</div>
                    </div>
                    <div class="sy-social-card" onclick="SoulPass.initiateSocialSync('instagram')">
                        <div class="sy-social-icon text-pink-500">ðŸ“¸</div>
                        <div class="sy-label text-center">Instagram</div>
                    </div>
                    <div class="sy-social-card" onclick="SoulPass.initiateSocialSync('youtube')">
                        <div class="sy-social-icon text-red-500">â–¶ï¸</div>
                        <div class="sy-label text-center">YouTube</div>
                    </div>
                    <div class="sy-social-card" onclick="SoulPass.initiateSocialSync('tiktok')">
                        <div class="sy-social-icon text-white">ðŸŽµ</div>
                        <div class="sy-label text-center">TikTok</div>
                    </div>
                </div>
            </div>
        `;

        content.appendChild(paneIdentity);
        content.appendChild(paneSynapse);
        content.appendChild(paneNetwork);

        // Pane: Settings
        const paneSettings = document.createElement('div');
        paneSettings.id = 'pane-settings';
        paneSettings.className = 'sn-pane';
        paneSettings.innerHTML = `
            <div class="sy-group">
                <div class="sy-group-title">Account Information</div>
                <div class="sy-row">
                    <div class="sy-label">Registered Email</div>
                    <div class="sy-value" id="sn-user-email" style="color:#d4af37; font-family:'Space Mono', monospace;">${this.userData.email || 'Loading...'}</div>
                </div>
                <div class="sy-row">
                    <div class="sy-label">User ID</div>
                    <div class="sy-value" id="sn-user-id-account" style="color:#888; font-family:'Space Mono', monospace; font-size:0.75rem; word-break:break-all;">${this.userData.userId || '—'}</div>
                </div>
            </div>

            <div class="sy-group">
                <div class="sy-group-title">Security Actions</div>
                <div class="sy-row" style="margin-top: 10px;">
                    <button class="sy-btn" style="flex:1;" onclick="SoulPass.changePassword()">Reset Password</button>
                    <button class="sy-btn" style="flex:1; border-color:#eab308; color:#eab308;" onclick="SoulPass.logout()">Disconnect (Logout)</button>
                </div>
                <div class="sy-row" style="margin-top:15px;">
                    <button class="sy-btn" style="flex:1; border-color:#ef4444; color:#ef4444;" onclick="SoulPass.deleteProfile()">Erase Existence (Delete Profile)</button>
                </div>
            </div>
        `;
        content.appendChild(paneSettings);
        
        body.appendChild(sidebar);
        body.appendChild(content);

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);

        document.body.appendChild(overlay);

        // Hydrate Settings
        setTimeout(() => {
            const lang = localStorage.getItem('cdf_language');
            if(lang) document.getElementById('sy-lang-select').value = lang;
            
            const vis = localStorage.getItem('cdf_visibility');
            if(vis) document.getElementById('sy-vis-select').value = vis;
            
            if(localStorage.getItem('cdf_2fa') === 'true') {
                document.getElementById('sy-2fa-toggle').classList.add('on');
            }

            const methodSelect = document.getElementById('sy-comms-method');
            if(methodSelect && this.userData.preferred_contact_method) {
                methodSelect.value = this.userData.preferred_contact_method;
                this.updateCommsMethod(this.userData.preferred_contact_method, false);
            }
            const guildSelect = document.getElementById('sy-guild-select');
            if(guildSelect && this.userData.guild) {
                guildSelect.value = this.userData.guild;
            }
        }, 50);

        return overlay;
    }

    switchTab(paneId, tabEl) {
        document.querySelectorAll('.sn-pane').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.sn-tab').forEach(el => el.classList.remove('active'));
        
        document.getElementById(paneId).classList.add('active');
        if(tabEl) tabEl.classList.add('active');
        
        if(window.SoundEngineer) window.SoundEngineer.playSFX('ui_click');
    }

    async updateName(newVal) {
        newVal = newVal.trim();
        if(!newVal) return;
        localStorage.setItem('cdf_user_username', newVal);
        this.userData.name = newVal;
        const nameDisp = document.getElementById('sn-display-name');
        if(nameDisp) nameDisp.innerText = newVal.toUpperCase();
        
        // sync to profiles username
        if(window.supabaseClient && this.userData.userId) {
            await window.supabaseClient.from('profiles').update({ username: newVal }).eq('id', this.userData.userId);
            
            // Also sync to master_artists name if email exists
            if(this.userData.email) {
                try {
                    await window.supabaseClient.from('master_artists').update({ name: newVal }).eq('email', this.userData.email);
                } catch(e) {}
            }
        }
        
        if(window.Pusher) window.Pusher.showToast('Profile Updated', 'success');
        this.pulseFeedback();
    }

    async updateGuild(newGuild) {
        this.userData.guild = newGuild;
        const guildDisp = document.getElementById('sn-display-guild');
        if(guildDisp) {
            guildDisp.innerText = newGuild ? "Guild of " + newGuild.charAt(0).toUpperCase() + newGuild.slice(1) : "None";
        }
        
        if(window.supabaseClient && this.userData.userId) {
            await window.supabaseClient.from('profiles').update({ guild: newGuild }).eq('id', this.userData.userId);
            this.pulseFeedback();
        }
    }

    async updateCommsMethod(method, saveToDb = true) {
        this.userData.preferred_contact_method = method;
        const detailsInput = document.getElementById('sy-comms-details');
        
        let details = {};
        try { details = JSON.parse(this.userData.contact_details || '{}'); } catch(e) {}

        if (method === 'whatsapp') {
            detailsInput.style.display = 'block';
            detailsInput.placeholder = "Phone Number (e.g., +49...)";
            detailsInput.value = details.whatsapp || '';
        } else if (method === 'instagram') {
            detailsInput.style.display = 'block';
            detailsInput.placeholder = "Instagram Handle (e.g., @user)";
            detailsInput.value = details.instagram || '';
        } else {
            detailsInput.style.display = 'none';
        }

        if(saveToDb && window.supabaseClient && this.userData.userId) {
            await window.supabaseClient.from('profiles').update({ preferred_contact_method: method }).eq('id', this.userData.userId);
            this.pulseFeedback();
        }
    }

    async saveCommsDetails(val) {
        const method = this.userData.preferred_contact_method;
        let details = {};
        try { details = JSON.parse(this.userData.contact_details || '{}'); } catch(e) {}
        
        if (method === 'whatsapp') details.whatsapp = val;
        else if (method === 'instagram') details.instagram = val;
        
        this.userData.contact_details = JSON.stringify(details);

        if(window.supabaseClient && this.userData.userId) {
            await window.supabaseClient.from('profiles').update({ contact_details: JSON.stringify(details) }).eq('id', this.userData.userId);
            this.pulseFeedback();
        }
    }

    pulseFeedback() {
        if(window.Pusher) window.Pusher.showToast("System State Configured.", "success");
        if(window.SoundEngineer) window.SoundEngineer.playSFX('ui_click');
    }

    enterDeepFocus() {
        this.pulseFeedback();
        this.close();
        
        const hud = document.getElementById('imperial-hud-root');
        if (hud) {
             hud.dataset.originalDisplay = hud.style.display || 'flex';
             hud.style.display = 'none';
        }
        
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } catch (e) { console.error(e); }

        if(window.Pusher) window.Pusher.showToast("Deep Focus Protocol Activated. Press ESC to return.", "success");
        
        if(!this.fsListenerBound) {
            document.addEventListener('fullscreenchange', () => {
                const h = document.getElementById('imperial-hud-root');
                if (!document.fullscreenElement && h) {
                    h.style.display = h.dataset.originalDisplay || 'flex';
                    if(window.Pusher) window.Pusher.showToast("Deep Focus Terminated.", "info");
                }
            });
            this.fsListenerBound = true;
        }
    }

    async initiateSocialSync(platform) {
        this.pulseFeedback();
        
        // Find clicked card and toggle connected
        const cards = document.querySelectorAll('.sy-social-card');
        let targetCard = null;
        cards.forEach(c => {
            if(c.innerText.toLowerCase().includes(platform)) targetCard = c;
        });

        if(platform === 'whatsapp') {
            const phone = prompt("Verify Phone Number for Bridge (e.g., +49...):", localStorage.getItem('cdf_user_phone') || "");
            if (phone) {
                localStorage.setItem('cdf_user_phone', phone);
                if (window.WhatsApp) {
                    const success = await window.WhatsApp.sendTemplateMessage('hello_world', phone);
                    if(success) alert("Signal Sent via Meta API!");
                }
                window.open('https://wa.me/351912828940', '_blank');
                if(targetCard) targetCard.classList.add('connected');
            }
        } else {
            const handle = prompt(`Enter ${platform.toUpperCase()} Handle/URL to sync with Synapse:`);
            if (handle) {
                alert(`Synapse Connected to ${handle}!`);
                if(targetCard) targetCard.classList.add('connected');
            }
        }
    }

    async changePassword() {
        if(!window.supabaseClient) return;
        const email = this.userData.email;
        if(!email) return alert("Email not found.");
        const confirmMsg = confirm(`Send password reset link to ${email}?`);
        if(confirmMsg) {
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/pages/dashboard.html'
            });
            if(error) alert("Error sending reset link: " + error.message);
            else alert("Password reset link sent to your email!");
        }
    }

    async logout() {
        if(!window.supabaseClient) return;
        const confirmMsg = confirm("Are you sure you want to disconnect from the Nexus?");
        if(confirmMsg) {
            await window.supabaseClient.auth.signOut();
            window.location.href = '/index.html';
        }
    }

    async uploadAvatar(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result;
            let details = {};
            try { details = JSON.parse(this.userData.contact_details || '{}'); } catch (e) {}
            details.avatar_url = dataUrl;
            this.userData.contact_details = JSON.stringify(details);
            const crystal = document.querySelector('.sp-crystal');
            if (crystal) crystal.style.background = `url('${dataUrl}') center/cover no-repeat`;
            localStorage.setItem('cdf_avatar_src', dataUrl);
            if (window.supabaseClient && this.userData.userId) {
                await window.supabaseClient.from('profiles').update({
                    avatar_url: dataUrl,
                    contact_details: JSON.stringify(details),
                }).eq('id', this.userData.userId);
            }
            if (window.Pusher) window.Pusher.showToast('Portrait synced', 'success');
        };
        reader.readAsDataURL(file);
    }

    async deleteProfile() {
        if(!window.supabaseClient) return;
        const confirm1 = confirm("WARNING: This will permanently erase your existence from the Circle D Flow network. Are you absolutely sure?");
        if(confirm1) {
            const confirm2 = prompt("Type 'DELETE' to confirm eradication of your profile:");
            if(confirm2 === 'DELETE') {
                try {
                    await window.supabaseClient.from('profiles').delete().eq('id', this.userData.userId);
                    alert("Profile data wiped. Disconnecting from Nexus.");
                    await window.supabaseClient.auth.signOut();
                    window.location.href = '/index.html';
                } catch(err) {
                    alert("Error: " + err.message);
                }
            }
        }
    }

    open() {
        this.loadDailySteps();
        this.init().then(() => {
            let overlay = document.getElementById('sp-root-overlay');
            if (!overlay) overlay = this.renderArtifact();
            else this.refreshIdentityStats();
            requestAnimationFrame(() => overlay.classList.add('active'));
            this.isOpen = true;
            if (window.SoundEngineer) window.SoundEngineer.playSFX('menu_open');
            document.body.style.overflow = 'hidden';
            console.log(`[SoulPass] Soul Nexus Opened.`);
        });
    }

    close() {
        const overlay = document.getElementById('sp-root-overlay');
        if (overlay) overlay.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
        
        const orreryContainer = document.querySelector('.orrery-container');
        if (orreryContainer) {
            orreryContainer.classList.remove('master-active');
        }

        if(window.FlowCompass) {
            window.FlowCompass.updateFlowee('Zone');
            window.FlowCompass.activePlanet = null;
        }

        if(window.SoundEngineer) window.SoundEngineer.playSFX('menu_close');
        console.log(`[SoulPass] Soul Nexus Closed.`);
    }
}

// Auto-Instantiate if not existing
if (!window.SoulPass) {
    new SoulPassAgent();
}

