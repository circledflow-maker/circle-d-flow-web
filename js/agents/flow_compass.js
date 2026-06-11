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
                    const { data: profile } = await client.from('profiles').select('level, exp').eq('id', user.id).single();
                    if(profile) this.userLevel = profile.level || this.userLevel;
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
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
                background: radial-gradient(circle at center, #1a1025 0%, #000000 100%); overflow: hidden; pointer-events: none;
            }
            .cdf-star { position: absolute; background: white; border-radius: 50%; opacity: 0; animation: twinkle var(--duration) ease-in-out infinite; }
            .cdf-star.symbol { background: transparent; color: rgba(255, 255, 255, 0.3); font-size: var(--size); font-family: monospace; }
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
            .planet-node.locked { filter: grayscale(100%) brightness(0.3); cursor: not-allowed; }
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
        for(let i=0; i<180; i++) {
            const star = document.createElement('div');
            star.className = (i % 20 === 0) ? 'cdf-star symbol' : 'cdf-star';
            if(i % 20 === 0) star.innerText = Math.random() > 0.5 ? '✦' : '·';
            else { const size = Math.random() * 2 + 0.5; star.style.width = `${size}px`; star.style.height = `${size}px`; }
            star.style.left = `${Math.random() * 100}%`; star.style.top = `${Math.random() * 100}%`;
            star.style.setProperty('--duration', `${Math.random() * 4 + 2}s`); star.style.setProperty('--max-opacity', Math.random() * 0.8 + 0.2);
            universe.appendChild(star);
        }
        for(let i=0; i<5; i++) {
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
            <div id="flowee-guide-msg"></div>
        `;

        this.container = parent.querySelector('.orrery-container');

        const innerOrbit = [
            { id: 'HighPalast', icon: 'temple_hindu', angle: 270, label: 'High Palast', color: '#FFD700', options: [{l:'THE PALAST', u:'high_palast.html'}, {l:'Museum', u:'palast_museum.html'}, {l:'Library', u:'palast_library.html'}] },
            { id: 'Bazaar', icon: 'storefront', angle: 30, label: 'BAZAAR', color: '#cd7f32', options: [{l:'THE BAZAAR', u:'marketplace.html'}, {l:'MY STALL', u:'marketplace-stall.html'}, {l:'THE FORGE', u:'marketplace-upload.html'}] },
            { id: 'Battle', icon: 'swords', angle: 150, label: 'Battleground', color: '#ef4444', options: [{l:'THE COLOSSEUM', u:'battle.html'}, {l:'Arena', u:'arena.html'}, {l:'Hall of Legends', u:'hall_of_legends.html'}] }
        ];

        // Determine path prefix based on location
        const isSubDir = window.location.pathname.includes('/pages/');
        const prefix = isSubDir ? '../' : '';

        const outerOrbit = [
            { id: 'Vision', icon: 'visibility', angle: 0, label: 'Vision', color: '#a855f7', options: [{l:'THE VISION', u: prefix + 'pages/vision_oasis.html'}, {l:'SACRED GARDEN', u: prefix + 'pages/kiss-your-heart.html'}, {l:'GOALS', u: prefix + 'pages/goal_purpose.html'}] },
            { id: 'Sound', icon: 'headphones', angle: 72, label: 'Sound', color: '#06b6d4', options: [{l:'THE SIGNAL', u: prefix + 'pages/outbreak_tunes.html'}, {l:'SANCTUARY', u: prefix + 'pages/qters_sanctuary.html'}, {l:'LABORATORY', u: prefix + 'pages/live_lab.html'}] },
            { id: 'Taste', icon: 'restaurant', angle: 144, label: 'Taste', color: '#22c55e', options: [{l:'THE KITCHEN', u: prefix + 'pages/african-queen-kitchen.html'}, {l:'FLAVOR QUEST', u: prefix + 'pages/flavor_quest.html'}, {l:'INVESTORS', u: prefix + 'pages/investor_portal.html'}] },
            { id: 'Connection', icon: 'hub', angle: 216, label: 'Connection', color: '#ec4899', options: [{l:'RESONANCE BAR', u: prefix + 'pages/coop.html'}, {l:'THE SANCTUARY', u: prefix + 'pages/chat.html'}, {l:'FLOW FINDER', u: prefix + 'pages/partner-scanner.html'}] },
            { id: 'Quest', icon: 'explore', angle: 288, label: 'Quest Log', color: '#94a3b8', options: [
                {l:'QUEST BOARD', u: prefix + 'pages/quest_board.html'}, 
                {l:'MAP', u: prefix + 'pages/quest_map.html'},
                {l:'CALENDAR', u: prefix + 'pages/calendar.html'}
            ] }
        ];

        this.renderOrbit(innerOrbit, 'inner');
        this.renderOrbit(outerOrbit, 'outer');
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
            node.innerHTML = `<div class="planet-visual"><span class="material-symbols-outlined">${p.icon}</span><div class="planet-label" style="color: ${p.color}">${p.label}</div></div>`;
            node.onclick = (e) => { e.stopPropagation(); this.toggleMenu(p.id, p.options); };
            os.appendChild(node);
        });
    }

    toggleMenu(planetId, options = []) {
        // Immediate Transitions for all 8 Worlds
        const urlMap = {
            'HighPalast': 'akademie.html',
            'Bazaar': 'marketplace.html',
            'Battle': 'colosseum.html',
            'Vision': 'vision_oasis.html',
            'Sound': 'sound_dashboard.html',
            'Taste': 'under-construction.html',
            'Connection': 'modal',
            'Quest': 'quest_map.html',
            'Core': null // Core stays on dashboard
        };

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

          if (planetId === 'Connection') {
              const modal = document.getElementById('connection-modal');
              if (modal) {
                  modal.classList.remove('opacity-0', 'pointer-events-none');
                  this.resetFocus();
              }
              return;
          }

          const isSubDir = window.location.pathname.includes('/pages/');
          const prefix = isSubDir ? '' : 'pages/';
          const targetUrl = prefix + urlMap[planetId];

        if (planetId === 'Vision') {
            this.triggerVisionOasis(targetUrl);
        } else {
            this.beamTo(targetUrl);
        }
    }

    resetFocus() {
        this.activePlanet = null;
        const c = document.querySelector('.orrery-container');
        if(c) c.classList.remove('focus-mode', 'master-active');
        document.querySelectorAll('.planet-node').forEach(n => n.classList.remove('focused'));
        document.querySelectorAll('.beaming-menu').forEach(m => m.remove());
        document.getElementById('flowee-guide-msg').classList.remove('visible');
    }

    updateFlowee(p, req, lab) {
        const msg = document.getElementById('flowee-guide-msg');
        let txt = "Awaiting Navigation Coordinates.";
        if(p === 'Locked') txt = `Access Denied. Reach Level ${req} to unlock ${lab}.`;
        else { const ms = { 'Bazaar': "Captain, the merchants have fresh artifacts from Alfama!", 'HighPalast': "The High Palast. Your Legacy, sovereign.", 'Battle': "The Arena awaits champions. Ready to spar?", 'Sound': "DJ Qter is broadcasting on a new frequency.", 'Vision': "Visual archives of the Golden Age.", 'Core': "Accessing Neural Profile and Security." }; txt = ms[p] || txt; }
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

    bindEvents() { document.addEventListener('click', (e) => { if (!e.target.closest('.planet-node') && !e.target.closest('.master-core') && !e.target.closest('.beaming-menu')) { this.resetFocus(); } }); }
    showPasswordGate() { document.getElementById('sound-gate').classList.add('visible'); setTimeout(() => document.getElementById('gate-pass').focus(), 100); }
    closeGate() { document.getElementById('sound-gate').classList.remove('visible'); }
    checkGate(c) {
        if(['QTER', '1988', 'FLOW', '1234'].includes(c.toUpperCase())) window.location.href = 'sound_dashboard.html';
        else { const b = document.querySelector('.gate-box'); b.classList.add('shake'); document.getElementById('gate-error').style.display = 'block'; setTimeout(() => { b.classList.remove('shake'); document.getElementById('gate-error').style.display = 'none'; }, 2000); document.getElementById('gate-pass').value = ''; }
    }
}

new FlowCompassAgent();


