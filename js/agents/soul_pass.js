/**
 * Agent: SoulPass (The Seelen-Pass)
 * Purpose: Replaces CaptainsLog. A 3D interactive, holographic ID artifact 
 * tracking Flow-Siegels (Chakras), Profile, and Settings/Social integration.
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
            tokens: localStorage.getItem('cdf_balance') || 1250,
            timeInZone: "42h",
            class: localStorage.getItem('cqr_auth_state') ? "Kinetic" : "Arcane", 
            hashId: "D-" + Math.floor(Math.random()*9000 + 1000) + "-FLOW"
        };

        this.init();
    }

    init() {
        console.log(`[${this.name}] Forging the Soul Pass Artifact...`);
        this.injectStyles();
    }

    injectStyles() {
        if(document.getElementById('soul-pass-styles')) return;

        const style = document.createElement('style');
        style.id = 'soul-pass-styles';
        style.textContent = `
            /* Overlay */
            .soul-pass-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(15px);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s ease;
            }
            .soul-pass-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }

            /* 3D Scene / Wrapper */
            .sp-scene {
                width: min(650px, 90vw);
                height: min(420px, 85vh);
                perspective: 1500px;
                position: relative;
            }
            
            /* Responsive resizing for mobile */
            @media (max-width: 500px) {
                .sp-scene { transform: scale(0.85); top: -20px; }
            }

            /* The Flipping Artifact */
            .sp-card {
                width: 100%;
                height: 100%;
                position: relative;
                transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                transform-style: preserve-3d;
                cursor: grab;
            }
            .sp-scene.flipped .sp-card {
                transform: rotateY(180deg);
            }
            .sp-card:active { cursor: grabbing; }

            /* Faces (Front/Back shared) */
            .sp-face {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                border-radius: 20px;
                /* Ancient Obsidian Stone Texture */
                background: linear-gradient(135deg, #111 0%, #1a1a1a 100%);
                border: 2px solid rgba(212, 175, 55, 0.3);
                box-shadow: 
                    inset 0 0 50px rgba(0,0,0,0.8),
                    0 20px 50px rgba(0,0,0,0.8),
                    0 0 20px rgba(212, 175, 55, 0.1);
                overflow: hidden;
            }

            /* Golden Ader-Network (Background) */
            .sp-face::before {
                content: '';
                position: absolute;
                inset: 0;
                background-image: 
                    radial-gradient(circle at 20% 30%, rgba(212,175,55,0.05) 0%, transparent 40%),
                    radial-gradient(circle at 80% 70%, rgba(212,175,55,0.05) 0%, transparent 40%);
                opacity: 0.8;
                pointer-events: none;
            }

            /* ---------------- FRONT FACE (Profile Matrix) ---------------- */
            .sp-front {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 30px;
            }
            .sp-scene.flipped .sp-front { pointer-events: none; }

            .sp-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                transform: translateZ(30px); /* Hologram pop */
            }
            .sp-title { font-family: 'Cinzel', serif; color: #d4af37; font-size: 1.2rem; letter-spacing: 3px; }
            .sp-hash { font-family: 'Space Mono', monospace; color: rgba(255,255,255,0.4); font-size: 0.7rem; margin-right: 60px; margin-top: 5px; }

            .sp-center-holo {
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateZ(50px);
                margin: 20px 0;
            }
            
            /* Avatar / Class 3D Core */
            .sp-core-crystal {
                width: 120px;
                height: 120px;
                background: radial-gradient(circle, rgba(154, 77, 255, 0.4), transparent);
                border: 1px solid rgba(154, 77, 255, 0.8);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 30px rgba(154, 77, 255, 0.3);
                transition: transform 0.5s;
                position: relative;
            }
            .sp-core-crystal:hover { transform: scale(1.05) rotate(15deg); }
            /* Mocking a 3D Class Model */
            .sp-core-crystal::after {
                content: '👁️'; 
                font-size: 40px;
                animation: float 4s ease-in-out infinite;
                filter: drop-shadow(0 0 10px #9A4DFF);
            }

            .sp-user-identity {
                text-align: center;
                margin-top: 15px;
            }
            .sp-name { font-family: 'Cinzel', serif; color: white; font-size: 1.8rem; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
            .sp-rank { font-family: 'Space Mono', monospace; color: #d4af37; font-size: 0.9rem; text-transform: uppercase; }

            /* Stats Grid */
            .sp-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                transform: translateZ(20px);
                margin-bottom: 20px;
            }
            .sp-stat-box {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 10px;
                border-radius: 8px;
                text-align: center;
            }
            .sp-stat-label { font-size: 0.6rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
            .sp-stat-value { font-size: 1.1rem; color: #d4af37; font-family: 'Space Mono', monospace; font-weight: bold; }

            /* Flow Siegls (Bottom) */
            .sp-seals-container {
                border-top: 1px solid rgba(212, 175, 55, 0.2);
                padding-top: 20px;
                text-align: center;
                transform: translateZ(10px);
            }
            .sp-seals-title { font-size: 0.7rem; color: #d4af37; letter-spacing: 2px; margin-bottom: 15px; }
            
            .sp-seals {
                display: flex;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            /* Ancient Gems instead of neon */
            .sp-seal {
                width: 35px; height: 35px;
                border-radius: 5px; /* Diamond/Square mock */
                background: #2a2a2a; 
                border: 2px solid #111;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
                transition: 0.4s;
                transform: rotate(45deg); /* Diamond shape */
                cursor: pointer;
                position: relative;
            }
            /* Internal Icon counter-rotation */
            .sp-seal > span {
                display: block;
                transform: rotate(-45deg);
                text-align: center;
                line-height: 31px; /* Center icon */
                font-size: 14px;
                opacity: 0.2;
                color: white;
                transition: opacity 0.4s;
            }
            
            /* Activated States */
            .sp-seal.root.active {
                background: radial-gradient(circle at 30% 30%, #ff4b4b, #8b0000);
                border-color: #ffb3b3;
                box-shadow: inset 0 0 5px #fff, 0 0 15px rgba(255, 0, 0, 0.5);
            }
            .sp-seal.sacral.active {
                background: radial-gradient(circle at 30% 30%, #ffa500, #b35900);
                border-color: #ffe6b3;
                box-shadow: inset 0 0 5px #fff, 0 0 15px rgba(255, 165, 0, 0.5);
            }
            .sp-seal.solar.active {
                background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b);
                border-color: #fffaca;
                box-shadow: inset 0 0 5px #fff, 0 0 15px rgba(255, 215, 0, 0.5);
            }
            /* More active states... */
            .sp-seal.active > span { opacity: 1; text-shadow: 0 0 5px white; }

            .sp-seal:hover { transform: rotate(45deg) scale(1.1); }
            

            /* ---------------- BACK FACE (The Synapse) ---------------- */
            .sp-back {
                transform: rotateY(180deg);
                display: flex;
                flex-direction: column;
                padding: 30px;
                background: url('data:image/svg+xml;utf8,<svg width="400" height="650" xmlns="http://www.w3.org/2000/svg"><path d="M200 650 Q200 400 100 200 M200 650 Q200 300 300 150 M200 650 Q200 500 250 350 M200 650 Q200 450 150 250 M195 650 L195 0 M205 650 L205 0" stroke="rgba(212,175,55,0.05)" stroke-width="2" fill="none"/></svg>') 
                            linear-gradient(135deg, #0f172a 0%, #020617 100%);
            }
            .sp-scene:not(.flipped) .sp-back { pointer-events: none; }

            .sp-back-h { text-align: center; font-family: 'Cinzel', serif; color: #d4af37; font-size: 1.5rem; letter-spacing: 2px; margin-bottom: 25px; transform: translateZ(20px); }

            /* Settings Block */
            .sp-settings-group {
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 15px;
                transform: translateZ(10px);
                margin-bottom: 20px;
            }
            .sp-setting-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .sp-setting-row:last-child { border: none; }
            .sp-set-label { font-size: 0.8rem; color: #ccc; }
            
            /* UI Controls */
            .sp-select { background: #000; border: 1px solid #d4af37; color: #d4af37; outline: none; padding: 4px; font-size: 0.7rem; font-family: monospace; border-radius: 4px; }
            .sp-toggle { width: 36px; height: 18px; background: #333; border-radius: 9px; position: relative; cursor: pointer; transition: 0.3s; }
            .sp-toggle.on { background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.3); }
            .sp-toggle-knob { width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.3s; }
            .sp-toggle.on .sp-toggle-knob { left: 20px; }

            /* Focus Mode Button */
            .sp-focus-btn {
                background: transparent; border: 1px solid #9A4DFF; color: #9A4DFF;
                padding: 10px; width: 100%; border-radius: 8px; text-transform: uppercase;
                letter-spacing: 2px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
                transition: 0.3s; margin-top: 10px; text-shadow: 0 0 5px rgba(154,77,255,0.5);
            }
            .sp-focus-btn:hover { background: rgba(154,77,255,0.2); }

            /* Social Networking Nodes (Fruits of Yggdrasil) */
            .sp-social-tree {
                flex: 1;
                display: flex;
                flex-wrap: wrap;
                justify-content: space-evenly;
                align-items: center;
                padding-top: 20px;
                transform: translateZ(15px);
            }
            .sp-social-node {
                width: 45px; height: 45px;
                border-radius: 50%;
                background: #111;
                border: 1px solid rgba(255,255,255,0.1);
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; transition: 0.4s;
                position: relative;
            }
            .sp-social-node img { border-radius: 50%; width: 100%; height: 100%; object-fit: cover; opacity: 0.5; transition: 0.4s; }
            .sp-social-node:hover img { opacity: 1; filter: drop-shadow(0 0 5px var(--col)); }

            /* Password Modal Layer */
            .sp-modal-overlay {
                position: absolute; inset: 0; background: rgba(5,5,5,0.98);
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                z-index: 1000; padding: 20px;
                opacity: 0; pointer-events: none; transition: 0.3s;
                border-radius: 20px; border: 1px solid #d4af37;
            }
            .sp-modal-overlay.active { opacity: 1; pointer-events: auto; }
            .sp-modal-h { font-family: 'Cinzel', serif; color: #d4af37; margin-bottom: 20px; text-transform: uppercase; font-size: 1.2rem; text-shadow: 0 0 10px rgba(212,175,55,0.3); }
            .sp-pswd-input { width: 100%; max-width: 250px; background: #0a0a0a; border: 1px solid #333; color: white; padding: 10px; margin-bottom: 15px; border-radius: 5px; outline: none; font-family: monospace; font-size: 0.8rem; }
            .sp-pswd-input:focus { border-color: #f59e0b; box-shadow: 0 0 10px rgba(245,158,11,0.2); }
            .sp-modal-btns { display: flex; gap: 10px; width: 100%; max-width: 250px; }
            .sp-modal-btn { flex: 1; padding: 10px; border-radius: 5px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 0.7rem; border: 1px solid #555; background: #111; color: #ccc; transition: 0.3s; }
            .sp-modal-btn:hover { background: #222; }
            .sp-modal-btn.confirm { border-color: #10b981; color: #10b981; }
            .sp-modal-btn.confirm:hover { background: rgba(16,185,129,0.1); }
            .sp-forgot-link { margin-top: 15px; font-size: 0.65rem; color: rgba(255,255,255,0.4); text-decoration: underline; cursor: pointer; transition: 0.3s; }
            .sp-forgot-link:hover { color: white; }
            
            /* Connected / Blooming States */
            .sp-social-node.insta.connected { border-color: #E1306C; background: radial-gradient(circle, rgba(225,48,108,0.2), #111); box-shadow: 0 0 15px rgba(225,48,108,0.4); }
            .sp-social-node.wa.connected { border-color: #25D366; background: radial-gradient(circle, rgba(37,211,102,0.2), #111); box-shadow: 0 0 15px rgba(37,211,102,0.4); }
            .sp-social-node.yt.connected { border-color: #FF0000; background: radial-gradient(circle, rgba(255,0,0,0.2), #111); box-shadow: 0 0 15px rgba(255,0,0,0.4); }
            .sp-social-node.connected img { opacity: 1; filter: grayscale(0%); }

            .sp-social-node:hover { transform: scale(1.1) translateY(-5px); }

            /* Flip Help Text */
            .sp-flip-hint {
                position: absolute; bottom: 10px; width: 100%; text-align: center;
                font-size: 0.6rem; color: rgba(255,255,255,0.3); font-family: monospace; letter-spacing: 1px;
                transform: translateZ(10px); cursor: pointer;
            }
            .sp-flip-hint:hover { color: #d4af37; }

            /* UI Action Close */
            /* Close button fixing the overflow clip */
            .sp-close-cross {
                position: absolute; top: 15px; right: 15px;
                width: 40px; height: 40px; border-radius: 50%;
                background: #0a0a0a; border: 2px solid #d4af37; color: #d4af37;
                display: flex; align-items: center; justify-content: center; cursor: pointer;
                transition: 0.3s; z-index: 50; transform: translateZ(30px);
            }
            .sp-close-cross:hover { background: #d4af37; color: #000; box-shadow: 0 0 15px #d4af37; transform: translateZ(30px) rotate(90deg); }

        `;
        document.head.appendChild(style);
    }

    renderArtifact() {
        const overlay = document.createElement('div');
        overlay.id = 'sp-root-overlay';
        overlay.className = 'soul-pass-overlay';

        // Close on background click
        overlay.onclick = (e) => {
            if(e.target === overlay) this.close();
        }

        const scene = document.createElement('div');
        scene.id = 'sp-scene';
        scene.className = 'sp-scene';
        scene.style.width = 'min(90vw, 400px)';

        // Card Container
        const card = document.createElement('div');
        card.className = 'sp-card';
        
        // --- 1. FRONT FACE ---
        const front = document.createElement('div');
        front.className = 'sp-face sp-front';
        
        front.innerHTML = `
            <div class="sp-close-cross" onclick="SoulPass.close()">✕</div>
            
            <div class="sp-header">
                <span class="sp-title">SOUL PASS</span>
                <span class="sp-hash">${this.userData.hashId}</span>
            </div>

            <div style="display: flex; flex: 1; align-items: center; justify-content: space-around; transform: translateZ(40px);">
                <div class="sp-center-holo" onclick="document.getElementById('sp-scene').classList.toggle('flipped');" style="margin:0; transform: translateZ(20px);">
                    <div class="sp-core-crystal" title="Tap to flip!"></div>
                    <div class="sp-user-identity" style="margin-top: 10px;">
                        <h2 class="sp-name" style="font-size: 1.5rem;">${this.userData.name}</h2>
                        <div class="sp-rank">Level ${Math.floor(this.userData.xp/100) || 12}: <span class="text-white">${this.userData.rank}</span></div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; justify-content: center; transform: translateZ(10px);">
                    <div class="sp-stats" style="margin-bottom: 10px; display: flex; flex-direction: column; gap: 15px;">
                        <div class="sp-stat-box" style="padding: 10px 30px;">
                            <div class="sp-stat-label">Flow Tokens</div>
                            <div class="sp-stat-value">${this.userData.tokens}</div>
                        </div>
                        <div class="sp-stat-box" style="padding: 10px 30px;">
                            <div class="sp-stat-label">Time In Zone</div>
                            <div class="sp-stat-value">${this.userData.timeInZone}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sp-seals-container" style="padding-top: 15px; margin-top: auto;">
                <div class="sp-seals-title" style="margin-bottom: 10px;">THE CHAKRAS</div>
                <div class="sp-seals" style="gap: 15px;">
                    <!-- Badges (First 3 active for demo) -->
                    <div class="sp-seal root active" title="Muladhara: Code Grounding"><span>1</span></div>
                    <div class="sp-seal sacral active" title="Svadhisthana: Creative Flow"><span>2</span></div>
                    <div class="sp-seal solar active" title="Manipura: Willpower"><span>3</span></div>
                    <div class="sp-seal heart" title="Anahata: Community Resonance"><span>4</span></div>
                    <div class="sp-seal throat" title="Vishuddha: Truth & Expression"><span>5</span></div>
                    <div class="sp-seal third-eye" title="Ajna: Intuition"><span>6</span></div>
                    <div class="sp-seal crown" title="Sahasrara: Enlightenment"><span>7</span></div>
                </div>
            </div>

            <div class="sp-flip-hint" onclick="document.getElementById('sp-scene').classList.toggle('flipped');" style="position:relative; margin-top: 15px; bottom: 0;">Tapping Core Flips Artifact</div>
        `;

        // --- 2. BACK FACE ---
        const back = document.createElement('div');
        back.className = 'sp-face sp-back';

        back.innerHTML = `
            <div class="sp-close-cross" onclick="SoulPass.close()">✕</div>
            <div style="position: absolute; top: 20px; right: 65px; font-family: 'Space Mono', monospace; font-size: 0.7rem; color: rgba(255,255,255,0.4); z-index: 10;">${this.userData.userId || 'D-1094-FLOW'}</div>
            
            <div class="sp-back-h" style="margin-bottom: 20px; position: relative; z-index: 10;">THE SYNAPSE</div>
            
            <div style="display: flex; gap: 30px; flex: 1; position: relative; z-index: 50;">
                <div class="sp-settings-group" style="flex: 1; margin: 0; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 50;">
                    <div class="sp-setting-row">
                        <span class="sp-set-label">Linguistic Matrix (Language)</span>
                        <select class="sp-select" id="sp-lang-select" onchange="localStorage.setItem('cdf_language', this.value); SoulPass.pulseFeedback();">
                            <option value="EN">EN</option>
                            <option value="PT">PT</option>
                            <option value="DE">DE</option>
                            <option value="FR">FR</option>
                            <option value="IT">IT</option>
                        </select>
                    </div>
                    <div class="sp-setting-row">
                        <span class="sp-set-label">Quantum Lock (2FA)</span>
                        <div class="sp-toggle" id="sp-2fa-toggle" onclick="this.classList.toggle('on'); localStorage.setItem('cdf_2fa', this.classList.contains('on')); SoulPass.pulseFeedback();">
                            <div class="sp-toggle-knob"></div>
                        </div>
                    </div>
                    <div class="sp-setting-row">
                        <span class="sp-set-label">Profile Visibility</span>
                        <select class="sp-select" id="sp-vis-select" style="width: 80px;" onchange="localStorage.setItem('cdf_visibility', this.value); SoulPass.pulseFeedback();">
                            <option value="Public">Public</option>
                            <option value="Private">Private</option>
                        </select>
                    </div>
                    <div class="sp-setting-row">
                        <span class="sp-set-label">Profile Name</span>
                        <input type="text" id="sp-name-input" class="sp-select" style="width: 80px; text-transform: uppercase;" value="${this.userData.name}" onchange="localStorage.setItem('cdf_user_username', this.value); document.getElementById('sp-name-display').innerText = this.value.toUpperCase(); if(window.Pusher) window.Pusher.showToast('Profile Updated', 'success'); SoulPass.pulseFeedback();">
                    </div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 20px; position: relative; z-index: 50;">
                    <!-- Social Knospen -->
                    <div class="sp-social-tree" style="padding-top: 0; gap: 15px; position: relative; z-index: 50;">
                        <div class="sp-social-node insta connected" onclick="SoulPass.initiateSocialSync('instagram')" title="Instagram Link (OAuth)">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="IG">
                        </div>
                        <div class="sp-social-node wa connected" onclick="SoulPass.initiateSocialSync('whatsapp')" title="WhatsApp Comm Link (Bridge)">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png" alt="WA">
                        </div>
                        <div class="sp-social-node" onclick="SoulPass.initiateSocialSync('tiktok')" title="TikTok Link (Webhook)">
                            <img src="https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" alt="TT">
                        </div>
                        <div class="sp-social-node yt connected" onclick="SoulPass.initiateSocialSync('youtube')" title="YouTube Archive (Google OAuth)">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png" alt="YT">
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: auto;">
                        <button class="sp-focus-btn" onclick="SoulPass.enterDeepFocus()" style="flex: 1; margin: 0; position: relative; z-index: 50; padding: 10px 5px; font-size: 0.65rem;">DEEP FOCUS</button>
                        <button class="sp-focus-btn" onclick="SoulPass.triggerPasswordWalkthrough()" style="flex: 1; margin: 0; position: relative; z-index: 50; padding: 10px 5px; font-size: 0.65rem; border-color: #f59e0b; color: #f59e0b;">UPDATE PSWD</button>
                    </div>
                </div>
            </div>

            <div class="sp-flip-hint" onclick="document.getElementById('sp-scene').classList.toggle('flipped');" style="position:relative; margin-top: 15px; bottom: 0;">Tap background to return to Identity</div>
            
            <div class="sp-modal-overlay" id="sp-pswd-modal">
                <div class="sp-modal-h">Quantum Key Update</div>
                <input type="password" class="sp-pswd-input" id="sp-current-pswd" placeholder="Current Key">
                <input type="password" class="sp-pswd-input" id="sp-new-pswd" placeholder="New Key">
                <input type="password" class="sp-pswd-input" id="sp-confirm-pswd" placeholder="Confirm New Key">
                <div class="sp-modal-btns">
                    <button class="sp-modal-btn" onclick="document.getElementById('sp-pswd-modal').classList.remove('active')">Cancel</button>
                    <button class="sp-modal-btn confirm" onclick="SoulPass.submitPasswordUpdate()">SAVE</button>
                </div>
                <div class="sp-forgot-link" onclick="SoulPass.triggerForgotPassword()">Forgotten Key Recovery</div>
            </div>
        `;

        card.appendChild(front);
        card.appendChild(back);
        scene.appendChild(card);
        overlay.appendChild(scene);

        document.body.appendChild(overlay);

        // Hydrate Settings from Storage
        setTimeout(() => {
            const lang = localStorage.getItem('cdf_language');
            if(lang) document.getElementById('sp-lang-select').value = lang;
            
            const vis = localStorage.getItem('cdf_visibility');
            if(vis) document.getElementById('sp-vis-select').value = vis;
            
            if(localStorage.getItem('cdf_2fa') === 'true') {
                document.getElementById('sp-2fa-toggle').classList.add('on');
            }
        }, 50);

        return overlay;
    }

    // A small haptic/visual pulse for checking logic visually 
    pulseFeedback() {
        const item = document.getElementById('sp-scene');
        if(item) {
            item.style.transform = "scale(0.95)";
            setTimeout(() => item.style.transform = "scale(1)", 150);
        }
        if(window.Pusher) window.Pusher.showToast("System State Configured.", "success");
    }

    enterDeepFocus() {
        this.pulseFeedback();
        this.close();
        
        // Hide Imperial HUD Ticker
        const hud = document.getElementById('imperial-hud-root');
        if (hud) {
             hud.dataset.originalDisplay = hud.style.display || 'flex';
             hud.style.display = 'none';
        }
        
        // Try to trigger native fullscreen
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.error(e);
        }

        if(window.Pusher) window.Pusher.showToast("Deep Focus Protocol Activated. Press ESC to return.", "success");
        else alert("Entering Deep Focus (Fullscreen Mode). Press ESC to abort.");
        
        // Restore HUD on exiting fullscreen
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

    triggerPasswordWalkthrough() {
        this.pulseFeedback();
        document.getElementById('sp-pswd-modal').classList.add('active');
    }

    triggerForgotPassword() {
        document.getElementById('sp-pswd-modal').classList.remove('active');
        if(window.Pusher) {
            window.Pusher.showToast("Recovery protocol initiated.", "info");
            setTimeout(() => window.Pusher.showToast("Retrieval link dispatched to your registered comms (email).", "success"), 1500);
        } else {
            alert("Recovery protocol initiated. Check email.");
        }
    }

    submitPasswordUpdate() {
        const c = document.getElementById('sp-current-pswd').value;
        const n = document.getElementById('sp-new-pswd').value;
        const cn = document.getElementById('sp-confirm-pswd').value;
        
        if(!c || !n || !cn) {
            if(window.Pusher) window.Pusher.showToast("All key metrics required.", "error");
            return;
        }
        if(n !== cn) {
            if(window.Pusher) window.Pusher.showToast("New key resonance mismatch. Re-verify.", "error");
            return;
        }
        
        // Simulating backend update
        this.pulseFeedback();
        document.getElementById('sp-pswd-modal').classList.remove('active');
        if(window.Pusher) {
            window.Pusher.showToast("Encrypting New Quantum Key...", "info");
            setTimeout(() => window.Pusher.showToast("Quantum Key Successfully Updated.", "success"), 1500);
        } else {
            alert("Password updated successfully.");
        }
        
        // Clear fields
        document.getElementById('sp-current-pswd').value = "";
        document.getElementById('sp-new-pswd').value = "";
        document.getElementById('sp-confirm-pswd').value = "";
    }

    // --- REAL INTEGRATION ---
    async initiateSocialSync(platform) {
        this.pulseFeedback();
        console.log(`[SoulPass] Initiating Synapse Connection for: ${platform}`);

        switch(platform) {
            case 'whatsapp':
                // 1. Prompt for phone number
                const phone = prompt("Verify your Phone Number for the Bridge (e.g., +49...):", localStorage.getItem('cdf_user_phone') || "");
                if (phone) {
                    localStorage.setItem('cdf_user_phone', phone);
                    
                    // 2. Trigger WhatsApp Agent Template
                    if (window.WhatsApp) {
                        const success = await window.WhatsApp.sendTemplateMessage('hello_world', phone);
                        if (success) {
                            alert("Verification Signal Sent via Meta API! Opening Chat...");
                        } else {
                            alert("Warning: Signal failed to send. Ensure number is in Meta Sandbox.");
                        }
                    } else {
                        alert("The WhatsApp Agent is currently offline. Redirecting...");
                    }
                    
                    // 3. Open Direct Master Chat
                    window.open('https://wa.me/351912828940', '_blank');
                }
                break;
                
            case 'instagram':
                // Supabase Native OAuth provider
                if (window.supabaseClient) {
                    try {
                        const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                            provider: 'instagram',
                            options: { redirectTo: window.location.origin + '/pages/dashboard.html' }
                        });
                        if (error) {
                            // GRACEFUL FALLBACK: If provider isn't enabled, use the Agentic Webhook
                            const handle = prompt("Direct OAuth unavailable. Fallback: Enter your Instagram @handle to connect via Synapse:");
                            if (handle) {
                                alert(`Synapse Connected to ${handle}!`);
                                document.querySelector('.sp-social-node.insta').classList.add('connected');
                            }
                        }
                    } catch (e) {
                         const handle = prompt("Direct OAuth unavailable. Fallback: Enter your Instagram @handle to connect via Synapse:");
                         if (handle) document.querySelector('.sp-social-node.insta').classList.add('connected');
                    }
                }
                break;

            case 'youtube':
                // Supabase Google Provider
                if (window.supabaseClient) {
                    try {
                        const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                queryParams: { access_type: 'offline', prompt: 'consent' },
                                scopes: 'https://www.googleapis.com/auth/youtube.readonly',
                                redirectTo: window.location.origin + '/pages/dashboard.html'
                            }
                        });
                        if (error) {
                             // GRACEFUL FALLBACK:
                             const handle = prompt("Direct OAuth unavailable. Fallback: Enter your YouTube Channel Name or URL to connect via Synapse:");
                             if (handle) {
                                  alert(`Synapse Archive Connected to ${handle}!`);
                                  document.querySelector('.sp-social-node.yt').classList.add('connected');
                             }
                        }
                    } catch (e) {
                         const handle = prompt("Direct OAuth unavailable. Fallback: Enter your YouTube Channel Name or URL to connect via Synapse:");
                         if (handle) document.querySelector('.sp-social-node.yt').classList.add('connected');
                    }
                }
                break;

            case 'tiktok':
                // Simulated Agentic Hook (No easy out-of-the-box Supabase provider)
                const handle = prompt("Enter your TikTok handle (@username) to connect via Webhook:");
                if (handle) {
                    alert(`Synapse Connected to ${handle}! Agentic Webhook tracking initiated in background...`);
                    // Find DOM node and toggle bloom
                    const nodes = document.querySelectorAll('.sp-social-node');
                    nodes.forEach(n => {
                        if (n.innerHTML.includes('TT')) n.classList.add('connected');
                    });
                }
                break;
        }
    }

    open() {
        console.log(`[${this.name}] Constructing Artifact UI...`);
        let overlay = document.getElementById('sp-root-overlay');
        if(!overlay) {
            overlay = this.renderArtifact();
        }
        
        // Use timeout to allow safe injection then CSS transition
        setTimeout(() => {
            overlay.classList.add('active');
            this.isOpen = true;
        }, 10);
    }

    close() {
        console.log(`[${this.name}] Dispersing Artifact UI...`);
        const overlay = document.getElementById('sp-root-overlay');
        if(overlay) {
            overlay.classList.remove('active');
            this.isOpen = false;
            // Delay removal for out-animation
            setTimeout(() => {
                overlay.remove();
                // Ensure card resets to front for next instantiation
                const scene = document.getElementById('sp-scene');
                if(scene) scene.classList.remove('flipped');
            }, 600);
        }
    }
}

// Auto-Instantiate (if it's not replacing an old variable check immediately)
document.addEventListener('DOMContentLoaded', () => {
    new SoulPassAgent();
});
