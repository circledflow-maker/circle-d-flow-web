/**
 * Agent: FlowCompass (The Imperial Orrery)
 * Purpose: Manages the "Imperial Orrery" Dashboard Navigation.
 * Features: Inner/Outer Orbits, Radial Beaming Menus, Hover-Focus, Flowee Guidance, Secret Triggers.
 */

class FlowCompassAgent {
    constructor() {
        this.name = "ImperialOrrery";
        this.isMobile = window.innerWidth < 768;
        this.activePlanet = null;
        this.userLevel = 1;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log(`[${this.name}] Initializing the Imperial Orrery...`);
        this.injectStyles();
        this.injectUniverse();

        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        // WAIT FOR DATA (Progressive Disclosure)
        await this.fetchUserStatus();

        this.injectOrrery();
        this.bindEvents();
        
        window.FlowCompass = this;
    }

    async fetchUserStatus() {
        const uState = JSON.parse(localStorage.getItem('circle_user_state') || '{}');
        this.userLevel = uState.rankLevel || 1;

        const client = window.supabaseClient;
        if(client) {
            try {
                const { data: { user } } = await client.auth.getUser();
                if(user) {
                    const { data: profile } = await client.from('profiles').select('level, exp, flow_class, username, karma').eq('id', user.id).single();
                    if (profile) {
                        this.userLevel = profile.level || Math.max(1, Math.floor((profile.exp || 0) / 200) + 1);
                        if (window.WorldAccess) {
                            window.WorldAccess.profile = profile;
                            this.isAdminMaster = window.WorldAccess.isAdminMaster();
                        }
                    }
                }
            } catch (e) { console.warn("[Orrery] Offline mode: using local level."); }
        }
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --haki-gold: #d4af37;
                --benin-bronze: #cd7f32;
                --obsidian: #0a0a0a;
            }

            /* UNIVERSE BACKGROUND */
            .cdf-universe {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;
                background: radial-gradient(ellipse at 50% 20%, #1a1025 0%, #050508 45%, #000000 100%);
                overflow: hidden; pointer-events: none;
            }
            .cdf-star { position: absolute; background: white; border-radius: 50%; opacity: 0.35; animation: twinkle var(--duration) ease-in-out infinite; box-shadow: 0 0 4px rgba(255,255,255,0.5); }
            .cdf-star.symbol { background: transparent; color: rgba(212, 175, 55, 0.45); font-size: 10px; font-family: monospace; box-shadow: none; }
            @keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: var(--max-opacity); transform: scale(1.2); } }
            
            .cdf-meteor { position: absolute; width: 2px; height: 2px; background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1)); border-radius: 50%; animation: shower 3s linear infinite; opacity: 0; }
            .cdf-meteor::after { content: ''; position: absolute; top: 50%; transform: translateY(-50%); width: 100px; height: 1px; background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8)); right: 0; }
            @keyframes shower { 0% { transform: translate(300px, -300px) rotate(-45deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate(-100vw, 100vh) rotate(-45deg); opacity: 0; } }

            /* CONTAINER & PERSPECTIVE */
            .orrery-container {
                position: relative; width: 65vmin; height: 65vmin; max-width: 650px; max-height: 650px;
                display: flex; align-items: center; justify-content: center;
                perspective: 1200px; transform-style: preserve-3d; transition: all 0.5s;
            }
            .orrery-container.master-active { transform: scale(0.9) translateZ(-100px); }
            .orrery-container.master-active .planet-node, .orrery-container.master-active .orbit-ring { opacity: 0.15; filter: blur(3px); pointer-events: none; }
            .orrery-container.master-active .master-core { opacity: 0; transform: scale(0); }
            
            @media (max-width: 768px) { .orrery-container { width: 90vmin; height: 90vmin; } }

            /* RINGS & SYSTEMS (PERCENTAGE BASED) */
            .orbit-ring { position: absolute; border-radius: 50%; border: 1px dashed rgba(255,255,255,0.1); top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
            .orbit-system { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; pointer-events: none; }
            
            .ring-inner, .os-inner { width: 50%; height: 50%; border-color: rgba(212, 175, 55, 0.2); }
            .ring-outer, .os-outer { width: 85%; height: 85%; border-color: rgba(255, 255, 255, 0.1); }
            
            .os-inner { animation: orbit-cw 80s linear infinite; }
            .os-outer { animation: orbit-ccw 120s linear infinite; }
            .orrery-container:hover .orbit-system, .orrery-container:hover .planet-node { animation-play-state: paused; }

            /* CORE */
            .master-core {
                position: absolute; width: 85px; height: 85px; background: radial-gradient(circle, #2a2a2a, #000);
                border: 2px solid var(--haki-gold); border-radius: 50%; z-index: 50; box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
                cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.5s;
            }
            .master-core:hover { transform: scale(1.1); box-shadow: 0 0 60px var(--haki-gold); }
            @keyframes core-fade1 { 0%, 45%, 100% { opacity:1; } 50%, 95% { opacity:0; } }
            @keyframes core-fade2 { 0%, 45%, 100% { opacity:0; } 50%, 95% { opacity:1; } }

            /* PLANETS */
            .planet-node { position: absolute; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100; pointer-events: auto; margin-top: -22px; margin-left: -22px; }
            .planet-visual .material-symbols-outlined {
                font-size: 20px; line-height: 1; display: block;
                font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
            }
            .planet-node.locked .planet-visual .material-symbols-outlined { opacity: 0.4; }
            .planet-visual { width: 100%; height: 100%; background: rgba(10, 10, 10, 0.95); border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.3s; position: relative; }
            .planet-node:hover .planet-visual, .planet-node.focused .planet-visual { transform: scale(1.4); border-color: var(--planet-color); box-shadow: 0 0 25px var(--planet-color); background: #111; }
            
            .os-inner .planet-node { animation: counter-orbit-cw 80s linear infinite; }
            .os-outer .planet-node { animation: counter-orbit-ccw 120s linear infinite; }
            .planet-label { position: absolute; bottom: -28px; font-size: 10px; font-family: 'Cinzel', serif; color: var(--haki-gold); opacity: 0; transition: 0.3s; white-space: nowrap; text-shadow: 0 2px 4px black; pointer-events: none; }
            .planet-node:hover .planet-label { opacity: 1; }

            @keyframes orbit-cw { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
            @keyframes orbit-ccw { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }
            @keyframes counter-orbit-cw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
            @keyframes counter-orbit-ccw { from { transform: rotate(-360deg); } to { transform: rotate(0deg); } }

            /* GATE & BOARD */
            .master-command-board { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8); width: 320px; background: rgba(10, 10, 10, 0.98); border: 1px solid var(--haki-gold); border-radius: 15px; padding: 25px; z-index: 1000; opacity: 0; visibility: hidden; transition: 0.4s; backdrop-filter: blur(15px); }
            .master-command-board.visible { opacity: 1; visibility: visible; transform: translate(-50%, -50%) scale(1); }
            .password-gate-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(20px); z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.5s; }
            .password-gate-overlay.visible { opacity: 1; pointer-events: auto; }
            .gate-box { background: #0a0a0a; border: 1px solid var(--haki-gold); padding: 40px; text-align: center; border-radius: 20px; box-shadow: 0 0 60px rgba(0,0,0,1); }
            .gate-input { background: transparent; border: none; border-bottom: 2px solid #333; color: var(--haki-gold); font-family: 'Space Mono', monospace; font-size: 2.2rem; text-align: center; outline: none; margin: 25px 0; width: 220px; letter-spacing: 15px; }
            @keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-12px);} 75% {transform: translateX(12px);} }
            .gate-box.shake { animation: shake 0.5s; }

            /* RADIAL MENU */
            .beaming-menu { position: absolute; width: 220px; height: 220px; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.4); opacity: 0; pointer-events: none; transition: 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); z-index: 300; background: rgba(0,0,0,0.5); }
            .beaming-menu.active { opacity: 1; transform: translate(-50%, -50%) scale(1); pointer-events: auto; backdrop-filter: blur(4px); }
            .beam-option { position: absolute; background: rgba(5,5,5,0.95); border: 1px solid var(--haki-gold); color: var(--haki-gold); padding: 7px 16px; border-radius: 25px; font-size: 11px; font-family: 'Space Mono', monospace; font-weight: bold; cursor: pointer; transition: 0.3s; white-space: nowrap; box-shadow: 0 5px 15px rgba(0,0,0,0.6); }
            .beam-option:hover { background: var(--haki-gold); color: black; transform: scale(1.15) translateY(-5px); box-shadow: 0 0 20px var(--haki-gold); }
            .daily-activity-pill { position: absolute; top: -48px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.75); border: 1px solid rgba(212,175,55,0.35); color: #ccc; font-size: 10px; padding: 6px 14px; border-radius: 20px; white-space: nowrap; z-index: 400; display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; }
            @media (max-width: 640px) { .daily-activity-pill { top: -42px; font-size: 9px; padding: 5px 10px; } }

            /* SPHERE WORLD SHEET (mobile-friendly hub list) */
            .sphere-sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 800; opacity: 0; pointer-events: none; transition: 0.3s; }
            .sphere-sheet-backdrop.active { opacity: 1; pointer-events: auto; }
            .sphere-world-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 900; max-height: 78vh; background: linear-gradient(to top, #0a0a0a, #111); border-top: 2px solid var(--haki-gold); border-radius: 16px 16px 0 0; transform: translateY(105%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; padding: 0 0 env(safe-area-inset-bottom); }
            .sphere-world-sheet.active { transform: translateY(0); }
            .sphere-sheet-header { padding: 16px 20px 8px; border-bottom: 1px solid rgba(212,175,55,0.2); display: flex; justify-content: space-between; align-items: center; }
            .sphere-sheet-title { font-family: 'Cinzel', serif; color: var(--haki-gold); font-size: 1rem; letter-spacing: 0.12em; }
            .sphere-sheet-close { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #aaa; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
            .sphere-sheet-hint { padding: 0 20px 8px; font-size: 10px; color: #666; font-family: 'Space Mono', monospace; }
            .sphere-world-list { overflow-y: auto; padding: 8px 12px 16px; display: flex; flex-direction: column; gap: 8px; -webkit-overflow-scrolling: touch; }
            .sphere-world-btn { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.25); border-radius: 12px; color: #e8e8e8; cursor: pointer; transition: 0.2s; }
            .sphere-world-btn:hover, .sphere-world-btn:active { background: rgba(212,175,55,0.12); border-color: var(--haki-gold); }
            .sphere-world-btn .sw-icon { color: var(--haki-gold); font-size: 22px; flex-shrink: 0; }
            .sphere-world-btn .sw-label { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: bold; letter-spacing: 0.08em; color: var(--haki-gold); }
            .sphere-world-btn .sw-desc { font-size: 10px; color: #888; margin-top: 2px; }
            .sphere-sheet-enter-hub { margin: 0 12px 12px; padding: 12px; background: rgba(212,175,55,0.15); border: 1px dashed var(--haki-gold); border-radius: 10px; color: var(--haki-gold); font-family: 'Cinzel', serif; font-size: 12px; cursor: pointer; text-align: center; }
            
            #flowee-guide-msg { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); border: 1px solid var(--haki-gold); padding: 12px 25px; border-radius: 12px; color: var(--haki-gold); font-family: 'Cinzel', serif; font-size: 1rem; text-align: center; opacity: 0; transition: 0.5s; pointer-events: none; z-index: 500; min-width: 320px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            #flowee-guide-msg.visible { opacity: 1; }

            /* VISION WORLD TRANSITIONS (WARP SPEED) */
            .orrery-container.vision-zoom-transition {
                transform: scale(10) translateZ(600px) rotateX(20deg);
                transition: all 1.8s cubic-bezier(1, 0, 0, 1) !important;
                filter: blur(20px) brightness(3) !important;
                opacity: 0 !important;
            }

            .planet-node.portal-active {
                z-index: 1000;
                transform: translate(-50%, -50%) scale(15);
                transition: transform 1.8s cubic-bezier(1, 0, 0, 1);
                filter: drop-shadow(0 0 50px var(--haki-gold)) brightness(3);
                opacity: 1;
            }

            .portal-flare {
                position: fixed; inset: 0; 
                background: radial-gradient(circle, var(--haki-gold), transparent 70%);
                opacity: 0; pointer-events: none; z-index: 500;
                transition: opacity 1.5s;
            }
            .portal-flare.active { opacity: 0.4; }
        `;
        document.head.appendChild(style);
        
        const gate = document.createElement('div');
        gate.id = 'sound-gate';
        gate.className = 'password-gate-overlay';
        gate.innerHTML = `<div class="gate-box"><span class="material-symbols-outlined" style="font-size: 4rem; color: #d4af37; margin-bottom: 1.5rem;">lock</span><h2 style="font-family: Cinzel, serif; color: white; margin-bottom: 0.5rem; letter-spacing: 4px;">RESTRICTED FREQUENCY</h2><p style="font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 3px;">Enter 4-Digit Access Code</p><input type="password" id="gate-pass" class="gate-input" maxlength="4" placeholder="••••"><div id="gate-error" style="color: #ef4444; font-size: 11px; margin-top: 15px; font-weight: bold; display: none;">BIOMETRIC MISMATCH / DENIED</div></div>`;
        document.body.appendChild(gate);
        
        const input = gate.querySelector('input');
        input.addEventListener('keyup', () => { if(input.value.length === 4) this.checkGate(input.value); });
        gate.addEventListener('click', (e) => { if(e.target === gate) this.closeGate(); });
    }

    injectUniverse() {
        const universe = document.createElement('div');
        universe.className = 'cdf-universe';
        document.body.prepend(universe);
        for(let i=0; i<320; i++) {
            const star = document.createElement('div');
            star.className = (i % 24 === 0) ? 'cdf-star symbol' : 'cdf-star';
            if(i % 24 === 0) star.innerText = Math.random() > 0.5 ? '✦' : '·';
            else { const size = Math.random() * 2.5 + 0.5; star.style.width = `${size}px`; star.style.height = `${size}px`; }
            star.style.left = `${Math.random() * 100}%`; star.style.top = `${Math.random() * 100}%`;
            star.style.setProperty('--duration', `${Math.random() * 5 + 2}s`);
            star.style.setProperty('--max-opacity', Math.random() * 0.9 + 0.35);
            universe.appendChild(star);
        }
        for(let i=0; i<10; i++) {
            const m = document.createElement('div'); m.className = 'cdf-meteor'; m.style.left = `${Math.random() * 100}%`; m.style.top = `${Math.random() * 40}%`; m.style.animationDelay = `${Math.random() * 15}s`;
            universe.appendChild(m);
        }
    }

    injectOrrery() {
        const parent = document.querySelector('.mandala-container') || document.body;
        
        // Define class icon
        const cClass = (localStorage.getItem('userClass') || 'none').toLowerCase();
        let classIco = 'verified';
        const classMap = { 'arcane':'bolt', 'kinetic':'waves', 'visionary':'visibility', 'harmonizer':'diversity_3', 'soundsmith':'graphic_eq', 'alchemist':'science' };
        for(let k in classMap) { if(cClass.includes(k)) classIco = classMap[k]; }

        parent.innerHTML = `
            <div class="orrery-container">
                <div class="orbit-ring ring-outer"></div>
                <div class="orbit-ring ring-inner"></div>
                <div class="orbit-system os-outer" id="os-outer"></div>
                <div class="orbit-system os-inner" id="os-inner"></div>
                <div class="master-core" onclick="window.FlowCompass.toggleMenu('Core')">
                    <div id="mc-icon-display" style="position: absolute; width:100%; height:100%; display:flex; align-items:center; justify-content:center; animation: core-fade1 10s infinite;">
                        <span class="material-symbols-outlined" style="font-size: 3.2rem; color: #d4af37; text-shadow: 0 0 15px #d4af37;">${classIco}</span>
                    </div>
                    <div style="position: absolute; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: core-fade2 10s infinite;">
                        <span style="font-family: 'Space Mono', monospace; font-size: 0.6rem; color: rgba(255,255,255,0.7); margin-bottom: -4px;">LEVEL</span>
                        <span id="mc-lvl-display" style="font-family: 'Cinzel', serif; font-size: 2rem; font-weight: bold; color: #d4af37; text-shadow: 0 0 10px rgba(212,175,55,0.5);">${this.userLevel}</span>
                    </div>
                </div>
            </div>
            <div id="daily-activity-pill" class="daily-activity-pill">
                <span class="material-symbols-outlined" style="font-size:14px;">footprint</span>
                <span id="daily-steps-display">0</span> steps · <span id="daily-distance-display">0.00 km</span>
            </div>
            <div id="flowee-guide-msg"></div>
        `;

        this.container = parent.querySelector('.orrery-container');

        const isSubDir = window.location.pathname.includes('/pages/');
        const prefix = isSubDir ? '' : 'pages/';
        const worlds = window.getSphereWorlds ? window.getSphereWorlds(prefix) : {};

        const innerIds = ['HighPalast', 'Academy', 'Bazaar', 'Battle'];
        const outerIds = ['Vision', 'Sound', 'Taste', 'Connection', 'Quest'];
        const angles = { HighPalast: 270, Academy: 0, Bazaar: 90, Battle: 180, Vision: 0, Sound: 72, Taste: 144, Connection: 216, Quest: 288 };

        const innerOrbit = innerIds.map(id => this.buildPlanetNode(id, worlds[id], angles[id]));
        const outerOrbit = outerIds.map(id => this.buildPlanetNode(id, worlds[id], angles[id]));

        this.planetDefaults = {};
        this.planetOptions = {};
        this.planetMeta = {};
        [...innerOrbit, ...outerOrbit].forEach(p => {
            this.planetDefaults[p.id] = p.hub;
            this.planetOptions[p.id] = p.options;
            this.planetMeta[p.id] = { label: p.label, flowee: p.flowee };
        });

        this.ensureSphereSheet();

        this.renderOrbit(innerOrbit, 'inner');
        this.renderOrbit(outerOrbit, 'outer');
    }

    buildPlanetNode(id, world, angle) {
        if (!world) return { id, icon: 'public', angle, label: id, color: '#d4af37', options: [], hub: '#' };
        return {
            id,
            icon: world.icon,
            angle,
            label: world.label,
            color: world.color,
            hub: world.hub,
            flowee: world.flowee,
            options: world.destinations.map(d => ({ ...d }))
        };
    }

    resolveIcon(name) {
        const map = {
            temple_hindu: 'castle',
            swords: 'shield',
            hub: 'hub',
            headphones: 'headphones',
            visibility: 'visibility',
            restaurant: 'restaurant',
            explore: 'explore',
            storefront: 'storefront',
            school: 'school',
        };
        return map[name] || name || 'public';
    }

    ensureSphereSheet() {
        if (document.getElementById('sphere-sheet-backdrop')) return;
        const backdrop = document.createElement('div');
        backdrop.id = 'sphere-sheet-backdrop';
        backdrop.className = 'sphere-sheet-backdrop';
        backdrop.onclick = () => this.closeSphereSheet();
        const sheet = document.createElement('div');
        sheet.id = 'sphere-world-sheet';
        sheet.className = 'sphere-world-sheet';
        sheet.innerHTML = `
            <div class="sphere-sheet-header">
                <div class="sphere-sheet-title" id="sphere-sheet-title">WORLD</div>
                <button type="button" class="sphere-sheet-close" aria-label="Close">&times;</button>
            </div>
            <div class="sphere-sheet-hint" id="sphere-sheet-hint">Tap a destination · tap sphere again for main hub</div>
            <div class="sphere-world-list" id="sphere-world-list"></div>
            <button type="button" class="sphere-sheet-enter-hub" id="sphere-sheet-hub">Enter Main Hub</button>
        `;
        sheet.querySelector('.sphere-sheet-close').onclick = () => this.closeSphereSheet();
        document.body.appendChild(backdrop);
        document.body.appendChild(sheet);
    }

    renderOrbit(planets, type) {
        const os = document.getElementById(`os-${type}`);
        if(!os) return;
        planets.forEach(p => {
            const node = document.createElement('div');
            node.className = `planet-node planet-${type}`;
            node.id = `planet-${p.id}`;
            node.style.setProperty('--planet-color', p.color || 'var(--haki-gold)');
            const rad = p.angle * (Math.PI / 180);
            const x = 50 + (50 * Math.cos(rad));
            const y = 50 + (50 * Math.sin(rad));
            node.style.left = `${x}%`; node.style.top = `${y}%`;
            node.innerHTML = `<div class="planet-visual"><span class="material-symbols-outlined" aria-hidden="true">${this.resolveIcon(p.icon)}</span><div class="planet-label" style="color: ${p.color}">${p.label}</div></div>`;
            node.onclick = (e) => { e.stopPropagation(); this.toggleMenu(p.id, p.options); };
            os.appendChild(node);
        });
    }

    resolveUrl(u) {
        if (!u || u.startsWith('http')) return u;
        let path = u.replace(/^\.\.\//, '').replace(/^pages\//, '');
        if (!path.includes('.') && !path.includes('?')) path += '.html';
        const inPages = window.location.pathname.includes('/pages/');
        return inPages ? path : `pages/${path}`;
    }

    navigateDestination(planetId, opt) {
        const url = this.resolveUrl(opt.u);
        if (window.WorldAccess && !window.WorldAccess.canAccess(url, planetId, opt)) return;
        this.closeSphereSheet();
        if (opt.gate && !this.isAdminMaster && !(window.WorldAccess && window.WorldAccess.isAdminMaster())) {
            this.showPasswordGate();
            return;
        }
        if (opt.transition === 'vision' || (planetId === 'Vision' && opt.l && opt.l.includes('PLACE'))) {
            this.triggerVisionOasis(url);
            return;
        }
        if (window.WorldAccess) window.WorldAccess.dailyCheckIn(planetId);
        this.beamTo(url);
    }

    toggleMenu(planetId, options = []) {
        if (planetId === 'Core') {
            this.resetFocus();
            this.activePlanet = 'Core';
            if (window.SoulPass) {
                document.querySelector('.orrery-container').classList.add('master-active');
                window.SoulPass.open();
                this.updateFlowee('Core');
            } else {
                console.error("SoulPass agent is offline or missing.");
            }
            return;
        }

        const opts = options.length ? options : (this.planetOptions[planetId] || []);
        if (this.activePlanet === planetId) {
            const hub = this.planetDefaults[planetId];
            if (hub) {
                if (planetId === 'Vision') this.triggerVisionOasis(this.resolveUrl(hub));
                else this.beamTo(this.resolveUrl(hub));
            }
            return;
        }

        this.showSphereSheet(planetId, opts);
    }

    showSphereSheet(planetId, options) {
        this.resetFocus();
        this.activePlanet = planetId;
        const planet = document.getElementById(`planet-${planetId}`);
        if (planet) planet.classList.add('focused');
        const container = document.querySelector('.orrery-container');
        if (container) container.classList.add('focus-mode');

        const meta = this.planetMeta[planetId] || {};
        const title = document.getElementById('sphere-sheet-title');
        const list = document.getElementById('sphere-world-list');
        const hubBtn = document.getElementById('sphere-sheet-hub');
        const backdrop = document.getElementById('sphere-sheet-backdrop');
        const sheet = document.getElementById('sphere-world-sheet');

        if (title) title.textContent = (meta.label || planetId).toUpperCase();
        if (list) {
            list.innerHTML = '';
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sphere-world-btn';
                btn.innerHTML = `
                    <span class="material-symbols-outlined sw-icon">${opt.icon || 'arrow_forward'}</span>
                    <div><div class="sw-label">${opt.l}</div><div class="sw-desc">${opt.desc || ''}</div></div>`;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.navigateDestination(planetId, opt);
                };
                list.appendChild(btn);
            });
        }
        if (hubBtn) {
            hubBtn.onclick = () => {
                const hub = this.planetDefaults[planetId];
                if (hub) this.navigateDestination(planetId, { u: hub, transition: planetId === 'Vision' ? 'vision' : null });
            };
        }
        backdrop.classList.add('active');
        sheet.classList.add('active');
        this.updateFlowee(planetId);
    }

    closeSphereSheet() {
        document.getElementById('sphere-sheet-backdrop')?.classList.remove('active');
        document.getElementById('sphere-world-sheet')?.classList.remove('active');
    }

    showBeamingMenu(planetId, options) {
        /* Radial menu for desktop when few options; sheet is default for rich worlds */
        if (options.length <= 3 && window.innerWidth > 768) {
            this._showRadialMenu(planetId, options);
        } else {
            this.showSphereSheet(planetId, options);
        }
    }

    _showRadialMenu(planetId, options) {
        this.resetFocus();
        this.activePlanet = planetId;
        const planet = document.getElementById(`planet-${planetId}`);
        if (!planet || !options.length) return;
        planet.classList.add('focused');
        const container = document.querySelector('.orrery-container');
        if (container) container.classList.add('focus-mode');

        const menu = document.createElement('div');
        menu.className = 'beaming-menu active';
        menu.id = `beam-${planetId}`;
        const count = options.length;
        options.forEach((opt, i) => {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const r = count > 3 ? 95 : 80;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'beam-option';
            btn.textContent = opt.l;
            btn.style.left = `calc(50% + ${Math.cos(angle) * r}px)`;
            btn.style.top = `calc(50% + ${Math.sin(angle) * r}px)`;
            btn.style.transform = 'translate(-50%, -50%)';
            btn.onclick = (e) => {
                e.stopPropagation();
                this.navigateDestination(planetId, opt);
            };
            menu.appendChild(btn);
        });
        planet.appendChild(menu);
        this.updateFlowee(planetId);
    }

    resetFocus() {
        this.activePlanet = null;
        this.closeSphereSheet();
        const c = document.querySelector('.orrery-container');
        if(c) c.classList.remove('focus-mode', 'master-active');
        document.querySelectorAll('.planet-node').forEach(n => n.classList.remove('focused'));
        document.querySelectorAll('.beaming-menu').forEach(m => m.remove());
        document.getElementById('flowee-guide-msg').classList.remove('visible');
    }

    updateFlowee(p, req, lab) {
        const msg = document.getElementById('flowee-guide-msg');
        let txt = "Awaiting Navigation Coordinates.";
        if (p === 'Locked') txt = `Access Denied. Reach Level ${req} to unlock ${lab}.`;
        else if (this.planetMeta[p]?.flowee) txt = this.planetMeta[p].flowee;
        else {
            const ms = { 'Bazaar': "Captain, the merchants have fresh artifacts from Alfama!", 'HighPalast': "The High Palast. Your Legacy, sovereign.", 'Academy': "The Academy archives every Navigator — tap a manga panel to explore.", 'Battle': "The Arena awaits champions. Ready to spar?", 'Sound': "DJ Qter is broadcasting on a new frequency.", 'Vision': "Visual archives of the Golden Age.", 'Taste': "AkwabaLX — taste the flow.", 'Connection': "Sanctuaries and resonance links await.", 'Quest': "Atlas, Codex, Quiz — pick your path.", 'Core': "Accessing Neural Profile and Security." };
            txt = ms[p] || txt;
        }
        msg.innerText = `FLOWEE: "${txt}"`; msg.classList.add('visible');
    }

    beamTo(u) {
        if(u === 'vision_oasis.html') {
            this.triggerVisionOasis('vision_sanctuary.html');
            return;
        }
        document.body.style.transition = "0.5s"; 
        document.body.style.filter = "brightness(3) blur(10px) hue-rotate(90deg)"; 
        if(window.SoundEngineer) window.SoundEngineer.playSFX('warp_speed'); 
        setTimeout(() => { window.location.href = u; }, 600); 
    }

    triggerVisionOasis(u) {
        const container = document.querySelector('.orrery-container');
        const visionPlanet = document.getElementById('planet-Vision');
        
        if(visionPlanet) visionPlanet.classList.add('portal-active');
        if(container) container.classList.add('vision-zoom-transition');
        
        document.body.style.transition = "1.5s cubic-bezier(0.7, 0, 0.3, 1)";
        document.body.style.background = "#5A2A84"; // Fade into Vision Violet
        
        if(window.SoundEngineer) window.SoundEngineer.playSFX('portal_jump');
        if(window.Flowee) window.Flowee.talk(true, "Navigating to the Sanctuary. The Nachtengel awaits.", "celebrate");

        setTimeout(() => {
            window.location.href = u;
        }, 1800);
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.planet-node') && !e.target.closest('.master-core') && !e.target.closest('.beaming-menu') && !e.target.closest('.sphere-world-sheet')) {
                this.resetFocus();
            }
        });
        window.addEventListener('resize', () => { this.isMobile = window.innerWidth < 768; });
    }
    showPasswordGate() { document.getElementById('sound-gate').classList.add('visible'); setTimeout(() => document.getElementById('gate-pass').focus(), 100); }
    closeGate() { document.getElementById('sound-gate').classList.remove('visible'); }
    checkGate(c) {
        if(['QTER', '1988', 'FLOW', '1234'].includes(c.toUpperCase())) this.beamTo(this.resolveUrl('pages/sound_dashboard.html'));
        else { const b = document.querySelector('.gate-box'); b.classList.add('shake'); document.getElementById('gate-error').style.display = 'block'; setTimeout(() => { b.classList.remove('shake'); document.getElementById('gate-error').style.display = 'none'; }, 2000); document.getElementById('gate-pass').value = ''; }
    }
}

new FlowCompassAgent();


