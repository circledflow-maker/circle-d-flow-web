/**
 * Agent: FlowCompass (The Imperial Orrery)
 * Purpose: Manages the "Imperial Orrery" Dashboard Navigation.
 * Features: Inner/Outer Orbits, Radial Beaming Menus, Hover-Focus, Flowee Guidance.
 */

class FlowCompassAgent {
    constructor() {
        this.name = "ImperialOrrery";
        this.isMobile = window.innerWidth < 768;
        this.activePlanet = null;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Initializing the Imperial Orrery...`);
        this.injectStyles();
        this.injectUniverse(); // NEW: Background
        this.injectOrrery();
        this.bindEvents();
        
        // Expose to Window for global onclick handlers
        window.FlowCompass = this;
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
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                z-index: -1;
                background: radial-gradient(circle at center, #1a1025 0%, #000000 100%);
                overflow: hidden;
                pointer-events: none;
            }
            .cdf-star {
                position: absolute;
                background: white;
                border-radius: 50%;
                opacity: 0;
                animation: twinkle var(--duration) ease-in-out infinite;
            }
            .cdf-star.symbol {
                background: transparent;
                color: rgba(255, 255, 255, 0.3);
                font-size: var(--size);
                font-family: monospace;
            }
            @keyframes twinkle {
                0%, 100% { opacity: 0.2; transform: scale(0.8); }
                50% { opacity: var(--max-opacity); transform: scale(1.2); }
            }
            
            /* METEOR SHOWERS */
            .cdf-meteor {
                position: absolute;
                width: 2px;
                height: 2px;
                background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
                border-radius: 50%;
                animation: shower 3s linear infinite;
                opacity: 0;
            }
            .cdf-meteor::after {
                content: ''; position: absolute; top: 50%; transform: translateY(-50%);
                width: 100px; height: 1px;
                background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8));
                right: 0;
            }
            @keyframes shower {
                0% { transform: translate(300px, -300px) rotate(-45deg); opacity: 0; }
                10% { opacity: 1; }
                100% { transform: translate(-100vw, 100vh) rotate(-45deg); opacity: 0; }
            }

            /* CONTAINER & PERSPECTIVE */
            .orrery-container {
                position: relative;
                width: 700px;
                height: 700px;
                padding-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                perspective: 1200px;
                transform-style: preserve-3d;
                transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s;
            }
            
            /* MASTER MODE EXPANSION */
            .orrery-container.master-active {
                transform: scale(1.5);
            }
            .orrery-container.master-active .planet-node {
                opacity: 0.1;
                filter: grayscale(100%) blur(2px);
                pointer-events: none;
            }
            .orrery-container.master-active .orbit-ring {
                opacity: 0.1;
            }
            .orrery-container.master-active .master-core {
                transform: scale(0); /* Hide core button to make room for board */
                opacity: 0;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .orrery-container { width: 350px; height: 400px; }
            }

            /* RINGS */
            .orbit-ring {
                position: absolute;
                border-radius: 50%;
                border: 1px dashed rgba(255,255,255,0.1);
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }
            .ring-inner { width: 280px; height: 280px; border-color: rgba(212, 175, 55, 0.2); }
            .ring-outer { width: 480px; height: 480px; border-color: rgba(255, 255, 255, 0.1); }
            
            @media (max-width: 768px) {
                .ring-inner { width: 160px; height: 160px; }
                .ring-outer { width: 300px; height: 300px; }
            }

            /* LIVE ORBIT SYSTEMS */
            .orbit-system {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                border-radius: 50%;
                pointer-events: none; /* Let clicks pass to planets */
            }
            .orbit-system-inner {
                width: 280px; height: 280px;
                animation: orbit-cw 60s linear infinite;
            }
            .orbit-system-outer {
                width: 480px; height: 480px;
                animation: orbit-ccw 90s linear infinite;
            }
            
            /* Responsive Orbits */
            @media (max-width: 768px) {
                .orbit-system-inner { width: 160px; height: 160px; }
                .orbit-system-outer { width: 300px; height: 300px; }
            }

            /* HOVER PAUSE (GAME FEEL) */
            .orrery-container:hover .orbit-system,
            .orrery-container:hover .planet-node {
                animation-play-state: paused;
            }

            /* CORE */
            .master-core {
                position: absolute;
                width: 80px; height: 80px;
                background: radial-gradient(circle, #2a2a2a, #000);
                border: 2px solid var(--haki-gold);
                border-radius: 50%;
                z-index: 50;
                box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .master-core:hover { transform: scale(1.1); box-shadow: 0 0 50px var(--haki-gold); }
            .master-core img { width: 60%; opacity: 0.8; }

            /* PLANETS (NODES) - LOGIC ONLY (Position + Rotation) */
            .planet-node {
                position: absolute;
                width: 50px; height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100;
                pointer-events: auto;
                /* Center on the orbit line */
                margin-top: -25px; 
                margin-left: -25px;
            }
            
            /* VISUAL WRAPPER for Scaling without breaking rotation */
            .planet-visual {
                width: 100%; height: 100%;
                background: rgba(10, 10, 10, 0.9);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s, background 0.3s;
                position: relative;
            }

            /* COUNTER ROTATION IMPLEMENTED IN ANIMATION ON PARENT */
            .orbit-system-inner .planet-node { animation: counter-orbit-cw 60s linear infinite; }
            .orbit-system-outer .planet-node { animation: counter-orbit-ccw 90s linear infinite; }

            /* HOVER EFFECTS on VISUAL CHILD */
            .planet-node:hover { z-index: 200; }
            
            .planet-node:hover .planet-visual, .planet-node.focused .planet-visual {
                transform: scale(1.3); 
                border-color: var(--planet-color, var(--haki-gold));
                box-shadow: 0 0 20px var(--planet-color, rgba(212, 175, 55, 0.5));
                background: #1a1a1a;
            }
            
            .planet-node span { font-size: 24px; color: #aaa; transition: color 0.3s; }
            .planet-node:hover span { color: var(--planet-color, var(--haki-gold)); }
            
            .planet-label {
                position: absolute;
                bottom: -25px; /* Adjusted for visual container */
                font-size: 10px;
                font-family: 'Cinzel', serif;
                color: var(--haki-gold);
                opacity: 0;
                transition: opacity 0.3s;
                white-space: nowrap;
                text-shadow: 0 2px 2px black;
                pointer-events: none;
            }
            .planet-node:hover .planet-label { opacity: 1; }

            /* ANIMATIONS */
            @keyframes orbit-cw { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
            @keyframes orbit-ccw { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }
            
            /* Counter-rotate to keep icons upright */
            @keyframes counter-orbit-cw { 
                from { transform: rotate(0deg); } 
                to { transform: rotate(-360deg); } 
            }
            @keyframes counter-orbit-ccw { 
                from { transform: rotate(-360deg); } 
                to { transform: rotate(0deg); } 
            }

            /* BEAMING MENU (The Radial Hologram) */
            .beaming-menu {
                position: absolute;
                width: 200px; height: 200px;
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 50%;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) scale(0.5);
                opacity: 0;
                pointer-events: none;
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                z-index: 300;
                background: rgba(0,0,0,0.4);
            }
            .beaming-menu.active {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
                pointer-events: auto;
                box-shadow: 0 0 50px rgba(0,0,0,0.8);
                backdrop-filter: blur(2px);
            }

            .beam-option {
                position: absolute;
                background: rgba(10,10,10,0.95);
                border: 1px solid var(--haki-gold);
                color: var(--haki-gold);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 10px;
                font-family: 'Space Mono', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: 0.3s;
                white-space: nowrap;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                min-width: 70px;
                text-align: center;
            }
            .beam-option:hover {
                background: var(--haki-gold);
                color: black;
                transform: scale(1.1);
                box-shadow: 0 0 15px var(--haki-gold);
            }
            
            /* MASTER COMMAND BOARD OVERLAY */
            .master-command-board {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 320px;
                background: rgba(10, 10, 10, 0.95);
                border: 1px solid var(--haki-gold);
                border-radius: 12px;
                padding: 24px;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.4s ease;
                box-shadow: 0 0 50px rgba(0,0,0,0.8);
                display: flex;
                flex-direction: column;
                gap: 16px;
                backdrop-filter: blur(10px);
            }
            .master-command-board.visible {
                opacity: 1;
                visibility: visible;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .board-header { 
                display: flex; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); 
            }
            .board-avatar { width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--haki-gold); object-fit: cover; }
            .board-user h3 { color: white; font-family: 'Cinzel', serif; margin: 0; font-size: 1rem; }
            .board-user p { color: var(--haki-gold); font-size: 0.8rem; margin: 0; }
            
            .board-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .board-btn {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                color: white;
                padding: 10px;
                border-radius: 6px;
                text-align: center;
                cursor: pointer;
                transition: 0.2s;
                font-size: 0.8rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }
            .board-btn:hover { background: var(--haki-gold); color: black; }
            .board-btn span { font-size: 1.2rem; }
            
            .board-footer { margin-top: 8px; }
            .logout-btn { width: 100%; padding: 8px; background: #c0392b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
            .logout-btn:hover { background: #e74c3c; }

            /* FOCUS BLUR EFFECT */
            body.blur-mode main > *:not(.orrery-container) {
                filter: none; /* Unblurred as requested */
                pointer-events: none;
                transition: all 0.5s;
            }
            .orrery-container.focus-mode .planet-node:not(.focused) {
                opacity: 0.5; /* Increased opacity */
                filter: grayscale(80%); /* Less aggressive grayscale */
            }
            
            /* FLOWEE MESSAGE */
            #flowee-guide-msg {
                position: absolute;
                bottom: 10%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                border: 1px solid var(--haki-gold);
                padding: 10px 20px;
                border-radius: 10px;
                color: var(--haki-gold);
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                text-align: center;
                opacity: 0;
                transition: opacity 0.5s;
                pointer-events: none;
                z-index: 500;
                min-width: 300px;
            }
            #flowee-guide-msg.visible { opacity: 1; }
            
            /* PASSWORD GATE */
            .password-gate-overlay {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.9);
                backdrop-filter: blur(20px);
                z-index: 9999;
                display: flex; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none;
                transition: opacity 0.5s;
            }
            .password-gate-overlay.visible { opacity: 1; pointer-events: auto; }
            .gate-box {
                background: #111; border: 1px solid var(--haki-gold);
                padding: 40px; text-align: center; border-radius: 20px;
                box-shadow: 0 0 50px rgba(212, 175, 55, 0.2);
                transform: scale(0.9); transition: transform 0.3s;
            }
            .gate-box.shake { animation: shake 0.5s; }
            .gate-input {
                background: transparent; border: none; border-bottom: 2px solid #333;
                color: var(--haki-gold); font-family: 'Space Mono', monospace;
                font-size: 2rem; text-align: center; outline: none;
                margin: 20px 0; width: 200px;
                text-transform: uppercase;
            }
            .gate-input:focus { border-color: var(--haki-gold); }
            
            @keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-10px);} 75% {transform: translateX(10px);} }
        `;
        document.head.appendChild(style);
        
        // Inject Gate HTML
        const gate = document.createElement('div');
        gate.id = 'sound-gate';
        gate.className = 'password-gate-overlay';
        gate.innerHTML = `
            <div class="gate-box">
                <span class="material-symbols-outlined text-4xl text-[#d4af37] mb-4">lock</span>
                <h2 class="font-cinzel text-xl text-white mb-2">RESTRICTED FREQUENCY</h2>
                <p class="text-[10px] uppercase text-gray-500 tracking-widest mb-6">Enter Access Code</p>
                <input type="password" id="gate-pass" class="gate-input" maxlength="4" placeholder="••••">
                <div class="mt-4 text-[9px] text-red-500 hidden" id="gate-error">ACCESS DENIED</div>
            </div>
        `;
        document.body.appendChild(gate);
        
        // Gate Event Listener
        const input = gate.querySelector('input');
        input.addEventListener('keyup', (e) => {
            if(input.value.length === 4) {
                this.checkGate(input.value);
            }
        });
        
        // Close on click outside
        gate.addEventListener('click', (e) => {
            if(e.target === gate) this.closeGate();
        });
    }

    checkGate(code) {
        // Simple client-side hash check (Mock: 'QTER' or '1988')
        if(code === 'QTER' || code === '1988' || code === 'FLOW') {
            document.getElementById('gate-error').classList.add('hidden');
            // Success Animation
            if(window.SoundEngineer) window.SoundEngineer.playSFX('success_chime');
            window.location.href = 'sound_dashboard.html';
        } else {
            const box = document.querySelector('.gate-box');
            box.classList.add('shake');
            document.getElementById('gate-error').classList.remove('hidden');
            setTimeout(() => box.classList.remove('shake'), 500);
            document.getElementById('gate-pass').value = '';
        }
    }
    
    closeGate() {
        document.getElementById('sound-gate').classList.remove('visible');
    }

    showPasswordGate() {
        const gate = document.getElementById('sound-gate');
        gate.classList.add('visible');
        setTimeout(() => document.getElementById('gate-pass').focus(), 100);
    }

    injectUniverse() {
        // Create Universe Container
        const universe = document.createElement('div');
        universe.className = 'cdf-universe';
        document.body.prepend(universe);

        // 1. Generate Static Stars
        const starCount = 150;
        for(let i=0; i<starCount; i++) {
            const star = document.createElement('div');
            star.className = 'cdf-star';
            
            // Random Position
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 2 + 1;
            const duration = Math.random() * 3 + 2; // 2-5s twinkle
            const maxOpacity = Math.random() * 0.7 + 0.3;

            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.setProperty('--duration', `${duration}s`);
            star.style.setProperty('--max-opacity', maxOpacity);

            // Occasional Symbol Stars (Dust)
            if(i % 15 === 0) {
                star.className = 'cdf-star symbol';
                star.innerText = Math.random() > 0.5 ? '✦' : '·';
                star.style.fontSize = `${Math.random() * 10 + 8}px`;
                star.style.background = 'transparent';
                star.style.width = 'auto';
                star.style.height = 'auto';
            }

            universe.appendChild(star);
        }

        // 2. Generate Meteors
        const meteorCount = 4;
        for(let i=0; i<meteorCount; i++) {
            const meteor = document.createElement('div');
            meteor.className = 'cdf-meteor';
            meteor.style.left = `${Math.random() * 100}%`;
            meteor.style.top = `${Math.random() * 50}%`;
            meteor.style.animationDelay = `${Math.random() * 10}s`;
            meteor.style.animationDuration = `${Math.random() * 2 + 2}s`;
            universe.appendChild(meteor);
        }
    }

    injectOrrery() {
        const container = document.querySelector('.mandala-container');
        if (!container) return;
        
        container.innerHTML = '';
        container.className = 'orrery-container';

        // 1. RINGS (Static Visuals)
        // 2. ORBIT SYSTEM (Moving Layers)
        // 3. CORE (Static)
        container.innerHTML += `
            <div class="orbit-ring ring-outer"></div>
            <div class="orbit-ring ring-inner"></div>
            
            <div class="orbit-system orbit-system-outer" id="os-outer"></div>
            <div class="orbit-system orbit-system-inner" id="os-inner"></div>

            <div class="master-core" onclick="FlowCompass.toggleMenu('Core')">
                <img src="../Assets/images/logo.png">
            </div>
            
            <!-- FLOWEE & BOARD -->
            <div id="flowee-guide-msg"></div>
            <div id="master-board" class="master-command-board">
                <div class="board-header">
                    <img src="../Assets/images/avatars/avatar_1.png" class="board-avatar" onerror="this.src='https://via.placeholder.com/48'">
                    <div class="board-user">
                        <h3>Navigator</h3>
                        <p>Voyager Rank</p>
                    </div>
                </div>
                <div class="board-actions">
                    <div class="board-btn" onclick="window.location.href='profile.html'">
                        <span class="material-symbols-outlined">person</span>
                        Profile
                    </div>
                    <div class="board-btn" onclick="window.location.href='settings.html'">
                        <span class="material-symbols-outlined">settings</span>
                        Settings
                    </div>
                    <div class="board-btn">
                        <span class="material-symbols-outlined">volume_up</span>
                        Audio
                    </div>
                    <div class="board-btn">
                        <span class="material-symbols-outlined">dark_mode</span>
                        Theme
                    </div>
                </div>
                <div class="board-footer">
                    <button class="logout-btn" onclick="console.log('Logout')">LOG OUT</button>
                </div>
            </div>
        `;

        // 2. PLANET CONFIG
        // Colors: Gold, Bronze, Red, Blue, Green, Pink, Silver
        const innerOrbit = [
            { id: 'HighPalast', icon: 'temple_hindu', angle: 270, label: 'High Palast', color: '#FFD700', options: [
                { l: 'Museum', u: 'palast_museum.html' }, 
                { l: 'Library', u: 'palast_library.html' },
                { l: 'Treasury', u: 'palast_treasury.html' }
            ]},
            { id: 'Bazaar', icon: 'storefront', angle: 30, label: 'Bazaar', color: '#cd7f32', options: [
                { l: 'Shop', u: 'marketplace.html' }, { l: 'My Stall', u: 'marketplace-upload.html' }, { l: 'Index', u: 'marketplace.html#index' }
            ]},
            { id: 'Battle', icon: 'swords', angle: 150, label: 'Battleground', color: '#ef4444', options: [
                { l: 'Arena', u: 'fivedoors.html' }, { l: 'Guild', u: 'guild.html' }, { l: 'Lyric Coloseum', u: 'blog.html' }
            ]}
        ];

        const outerOrbit = [
            { id: 'Vision', icon: 'visibility', angle: 0, label: 'Vision', color: '#a855f7', options: [
                {l:'Gallery', u:'gallery.html'}, 
                {l:'Purpose', u:'goal_purpose.html'},
                {l:'Sacred Garden', u:'kiss-your-heart.html'} 
            ] },
            { id: 'Sound', icon: 'headphones', angle: 72, label: 'Sound', color: '#06b6d4', options: [
                {l:'The Signal', u:'outbreak_tunes.html'}, 
                {l:'Live Lab', u:'live_lab.html'},
                {l:'Sanctuary', u:'qters_sanctuary.html'}
            ]},
            { id: 'Taste', icon: 'restaurant', angle: 144, label: 'Taste', color: '#22c55e', options: [
                {l:'Kitchen', u:'african-queen-kitchen.html'},
                {l:'Quest', u:'flavor_quest.html'},
                {l:'Partner', u:'investor_portal.html'}
            ]},
            { id: 'Connection', icon: 'hub', angle: 216, label: 'Connection', color: '#ec4899', options: [{l:'Hub', u:'vault_space.html'}, {l:'Chat', u:'chat.html'}, {l:'Co-Op', u:'coop.html'}] },
            { id: 'Quest', icon: 'explore', angle: 288, label: 'Quest Log', color: '#94a3b8', options: [{l:'Log', u:'events.html#log'}, {l:'Map', u:'events.html'}] }
        ];

        this.renderOrbit(container, innerOrbit, 'inner');
        this.renderOrbit(container, outerOrbit, 'outer');
    }

    renderOrbit(container, planets, type) {
        // Use the orbit-system containers we just created
        const orbitSystem = container.querySelector(type === 'inner' ? '#os-inner' : '#os-outer');
        if(!orbitSystem) return;

        // Radius is now relative to the rotating container (50% from center)
        const radius = this.isMobile ? (type === 'inner' ? 80 : 150) : (type === 'inner' ? 140 : 240);
        
        planets.forEach(p => {
            const node = document.createElement('div');
            node.className = `planet-node planet-${type}`;
            node.id = `planet-${p.id}`;
            
            // Set Color Var for CSS Hover
            node.style.setProperty('--planet-color', p.color || 'var(--haki-gold)');
            
            // Positioning within the ROTATING container
            // SIMPLIFIED APPROACH:
            // Absolute position using sin/cos relative to the 280x280 or 480x480 container center.
            const rad = p.angle * (Math.PI / 180);
            
            // Container Widths defined in CSS
            const containerSize = this.isMobile ? (type === 'inner' ? 160 : 300) : (type === 'inner' ? 280 : 480);
            const r = containerSize / 2; // Radius matches container edge basically
            
            const x = r + (r * Math.cos(rad));
            const y = r + (r * Math.sin(rad));

            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            
            // WRAP CONTENT IN .planet-visual to separate Scaling from Rotation
            node.innerHTML = `
                <div class="planet-visual">
                    <span class="material-symbols-outlined">${p.icon}</span>
                    <div class="planet-label" style="color: ${p.color}">${p.label}</div>
                </div>
            `;
            
            // Interaction
            node.onclick = (e) => {
                e.stopPropagation();
                this.toggleMenu(p.id, p.options);
            };

            orbitSystem.appendChild(node);
        });
    }

    toggleMenu(planetId, options = []) {
        console.log(`[Orrery] Focusing: ${planetId}`);
        
        // --- 3-CLICK TRIGGER LOGIC ---
        if (planetId === 'Vision') {
            this.visionClickCount = (this.visionClickCount || 0) + 1;
            console.log(`[Vision] Clicks: ${this.visionClickCount}`);
            
            clearTimeout(this.visionClickTimer);
            this.visionClickTimer = setTimeout(() => { 
                this.visionClickCount = 0; 
                console.log("[Vision] Click reset");
            }, 2000); 

            if (this.visionClickCount >= 3) {
                console.log("[Vision] Animus Link Established");
                // Visual Glitch Effect before redirect
                document.body.classList.add('glitch-effect');
                setTimeout(() => {
                    window.location.href = 'master_dashboard.html';
                }, 1000);
                this.visionClickCount = 0;
                this.resetFocus();
                return;
            }
        }

        if (planetId === 'Sound') {
            this.soundClickCount = (this.soundClickCount || 0) + 1;
            console.log(`[Sound] Clicks: ${this.soundClickCount}`);
            
            clearTimeout(this.soundClickTimer);
            this.soundClickTimer = setTimeout(() => { 
                this.soundClickCount = 0; 
                console.log("[Sound] Click reset");
            }, 2000); 

            if (this.soundClickCount >= 3) {
                console.log("[Sound] Restricted Frequency Found");
                this.showPasswordGate();
                this.soundClickCount = 0;
                this.resetFocus();
                return;
            }
        }

        if (planetId === 'Taste') { // African Queen Kitchen Trigger
            this.tasteClickCount = (this.tasteClickCount || 0) + 1;
            
            clearTimeout(this.tasteClickTimer);
            this.tasteClickTimer = setTimeout(() => { 
                this.tasteClickCount = 0; 
            }, 2000); 

            if (this.tasteClickCount >= 3) {
                console.log("[Taste] Kitchen Door Unlocked");
                document.body.classList.add('glitch-effect'); // Reuse glitch
                setTimeout(() => {
                    window.location.href = 'kitchen-dashboard.html';
                }, 1000);
                this.tasteClickCount = 0;
                this.resetFocus();
                return;
            }
        }
        // -----------------------------

        // Close if clicking same
        if (this.activePlanet === planetId) {
            this.resetFocus();
            return;
        }

        this.resetFocus();
        this.activePlanet = planetId;
        
        // SPECIAL CASE: CORE (CAPTAIN'S LOG / MASTER DASHBOARD)
        if (planetId === 'Core') {
            // --- SECRET TRIGGER: MASTER DASHBOARD (3 Clicks) ---
            this.coreClickCount = (this.coreClickCount || 0) + 1;
            console.log(`[Core] Clicks: ${this.coreClickCount}`);
            
            clearTimeout(this.coreClickTimer);
            this.coreClickTimer = setTimeout(() => { 
                // Reset count if too slow
                this.coreClickCount = 0; 
                
                // If single click (and not triggered master), open Log
                if (window.CaptainsLog) {
                    document.body.classList.add('blur-mode');
                    document.querySelector('.orrery-container').classList.add('master-active');
                    window.CaptainsLog.open();
                    this.updateFlowee('Core');
                } else {
                    // Lazy Load
                     console.warn("[Orrery] Captains Log Agent missing! Attempting lazy load...");
                    const script = document.createElement('script');
                    script.src = '../js/agents/captains_log.js';
                    script.onload = () => { window.CaptainsLog.open(); this.updateFlowee('Core'); };
                    document.body.appendChild(script);
                }
            }, 500); // 500ms window for multi-click

            if (this.coreClickCount >= 3) {
                 clearTimeout(this.coreClickTimer); // Stop the single click logic
                 console.log("[Core] MASTER ACCESS GRANTED");
                 
                 // Visual Effect
                 document.body.classList.add('glitch-effect');
                 if(window.SoundEngineer) window.SoundEngineer.playSFX('warp_speed');
                 
                 setTimeout(() => {
                     window.location.href = 'master_dashboard.html';
                 }, 1000);
                 
                 this.coreClickCount = 0;
                 return;
            }
            return;
        }

        // STANDARD CASE: PLANET
        document.body.classList.add('blur-mode');
        document.querySelector('.orrery-container').classList.add('focus-mode');
        
        const planetNode = document.getElementById(`planet-${planetId}`);
        if(planetNode) planetNode.classList.add('focused');

        // Create Radial Menu
        document.querySelectorAll('.beaming-menu').forEach(m => m.remove());
        const menu = document.createElement('div');
        menu.className = 'beaming-menu active';
        
        options.forEach((opt, index) => {
            const btn = document.createElement('div');
            btn.className = 'beam-option';
            btn.innerText = opt.l.toUpperCase();
            btn.onclick = (e) => {
                e.stopPropagation();
                this.beamTo(opt.u);
            };

            // Positioning
            if (index === 0) { btn.style.top = '-10%'; btn.style.left = '50%'; btn.style.transform = 'translateX(-50%)'; }
            if (index === 1) { btn.style.bottom = '15%'; btn.style.left = '-10%'; }
            if (index === 2) { btn.style.bottom = '15%'; btn.style.right = '-10%'; }

            menu.appendChild(btn);
        });

        planetNode.appendChild(menu);
        this.updateFlowee(planetId);
    }

    resetFocus() {
        this.activePlanet = null;
        document.body.classList.remove('blur-mode');
        
        const container = document.querySelector('.orrery-container');
        if(container) {
            container.classList.remove('focus-mode');
            container.classList.remove('master-active');
        }
        
        document.querySelectorAll('.planet-node').forEach(n => n.classList.remove('focused', 'blur'));
        
        document.querySelectorAll('.beaming-menu').forEach(m => m.remove());
        document.getElementById('flowee-guide-msg').classList.remove('visible');
        
        const board = document.getElementById('master-board');
        if(board) board.classList.remove('visible');
    }

    updateFlowee(planetId) {
        const msgEl = document.getElementById('flowee-guide-msg');
        let text = "";

        switch(planetId) {
            case 'Bazaar': text = "Captain, the merchants have fresh artifacts from Alfama!"; break;
            case 'HighPalast': text = "The High Palast. Your Legacy, sovereign."; break;
            case 'Battle': text = "The Arena awaits champions. Ready to spar?"; break;
            case 'Sound': text = "DJ Qter is broadcasting on a new frequency."; break;
            case 'Vision': text = "Visual archives of the Golden Age."; break;
            case 'Core': text = "Accessing Neural Profile and Security."; break;
            default: text = "Awaiting Navigation Coordinates.";
        }

        msgEl.innerText = `FLOWEE: "${text}"`;
        msgEl.classList.add('visible');
    }

    beamTo(url) {
        if(url.startsWith('javascript')) {
            // Eval safely or specific mapping
            console.log("Running command:", url);
            return;
        }

        // Warp Effect
        document.body.style.transition = "filter 0.5s ease";
        document.body.style.filter = "brightness(3) blur(10px) hue-rotate(90deg)";
        
        if(window.SoundEngineer) window.SoundEngineer.playSFX('warp_speed');
        
        setTimeout(() => {
            window.location.href = url;
        }, 600);
    }

    bindEvents() {
        // Close menu on bg click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.planet-node') && !e.target.closest('.master-core') && !e.target.closest('.beaming-menu')) {
                this.resetFocus();
            }
        });
    }
}

new FlowCompassAgent();

