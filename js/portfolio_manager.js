class PortfolioManager {
    constructor() {
        this.player = null;
        this.voice = window.speechSynthesis;
        this.bgAudio = new Audio('../Assets/audio/ambient.mp3');
        this.bgAudio.loop = true;
        this.bgAudio.volume = 0.1;
        this.isAnalyzing = false;
        this.init();
    }

    init() {
        console.log("[Portfolio] Agentic Mode: ACTIVE");
        this.injectHUDStyles();
        this.createPlayerUI();
        window.CDF_Player = this; // Global access
    }

    injectHUDStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #agentic-player {
                position: fixed; inset: 0; background: rgba(0,0,0,0.98);
                z-index: 10000; display: none; flex-direction: column;
                align-items: center; justify-content: center; backdrop-filter: blur(20px);
                opacity: 0; transition: opacity 0.5s ease; overflow: hidden;
            }
            .neural-hud {
                position: absolute; inset: 0; pointer-events: none;
                border: 2px solid rgba(0, 240, 255, 0.1);
                box-shadow: inset 0 0 100px rgba(0, 240, 255, 0.05);
            }
            .scanning-line {
                position: absolute; width: 100%; height: 2px;
                background: linear-gradient(90deg, transparent, var(--electric, #00f0ff), transparent);
                top: -10%; animation: scan-anim 4s linear infinite;
            }
            @keyframes scan-anim {
                0% { top: -10%; opacity: 0; }
                50% { opacity: 1; }
                100% { top: 110%; opacity: 0; }
            }
            .hud-corner {
                position: absolute; width: 40px; height: 40px;
                border: 1px solid var(--haki-gold, #d4af37);
                opacity: 0.5;
            }
            .top-left { top: 40px; left: 40px; border-right: 0; border-bottom: 0; }
            .top-right { top: 40px; right: 40px; border-left: 0; border-bottom: 0; }
            .bot-left { bottom: 40px; left: 40px; border-right: 0; border-top: 0; }
            .bot-right { bottom: 40px; right: 40px; border-left: 0; border-top: 0; }

            .analysis-panel {
                position: absolute; left: 60px; top: 50%; transform: translateY(-50%);
                width: 250px; font-family: 'Space Mono', monospace; color: var(--electric, #00f0ff);
                font-size: 10px; line-height: 1.8; text-transform: uppercase;
            }
            .data-node { opacity: 0; transform: translateX(-10px); }
            
            .player-content {
                width: 85%; height: 75%; position: relative;
                border: 1px solid rgba(255,255,255,0.1);
                background: #000; display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 50px rgba(0,0,0,1);
            }
            .status-badge {
                position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
                background: #000; border: 1px solid var(--haki-gold, #d4af37);
                color: var(--haki-gold, #d4af37); padding: 5px 20px;
                font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 3px;
            }
            .close-player {
                position: absolute; top: 40px; right: 40px; cursor: pointer; color: white;
                opacity: 0.6; transition: 0.3s; pointer-events: auto;
            }
            .close-player:hover { opacity: 1; transform: rotate(90deg); color: var(--haki-gold, #d4af37); }
        `;
        document.head.appendChild(style);
    }

    createPlayerUI() {
        const ui = document.createElement('div');
        ui.id = 'agentic-player';
        ui.innerHTML = `
            <div class="neural-hud">
                <div class="scanning-line"></div>
                <div class="hud-corner top-left"></div>
                <div class="hud-corner top-right"></div>
                <div class="hud-corner bot-left"></div>
                <div class="hud-corner bot-right"></div>
                
                <div class="analysis-panel" id="analysis-panel">
                    <div class="data-node">>> INITIALIZING NEURAL LINK...</div>
                    <div class="data-node">>> SOURCE: GOOGLE DRIVE MASTER</div>
                    <div class="data-node">>> ENCRYPTED TUNNEL: STABLE</div>
                    <div class="data-node">>> ANALYZING FLOW PATTERNS...</div>
                    <div class="data-node">>> MAPPING FLOW MATRIX...</div>
                    <div class="data-node">>> DECODING SUBTEXT...</div>
                    <div class="data-node">>> OPTIMIZING VISUALS...</div>
                    <div class="data-node" id="final-node" style="color: var(--haki-gold, #d4af37);">>> NEURAL LOCK ACQUIRED.</div>
                </div>
            </div>

            <div class="close-player" onclick="window.CDF_Player.close()">
                <span class="material-symbols-outlined" style="font-size: 40px;">close</span>
            </div>

            <div class="player-content">
                <div class="status-badge" id="player-status">INITIALIZING...</div>
                <div id="media-viewport" style="width: 100%; height: 100%;"></div>
            </div>

            <div id="player-caption" style="margin-top: 30px; text-align: center; color: white;">
                <h2 id="player-title" class="cinzel text-2xl text-[var(--haki-gold, #d4af37)] mb-2">SCANNING MEMORY...</h2>
                <div id="agent-meta" class="mono text-[10px] text-white/40 tracking-[5px] uppercase">Wait for agent analysis</div>
            </div>
        `;
        document.body.appendChild(ui);
        this.player = ui;
    }

    open(asset) {
        if (this.isAnalyzing) return;
        this.isAnalyzing = true;
        
        const isVideo = asset.name.toLowerCase().endsWith('.mp4') || asset.name.toLowerCase().endsWith('.mov');
        const agentTitle = `[NEURAL-TRACE] ${asset.professional_name || asset.name}`;
        
        this.player.style.display = 'flex';
        gsap.to(this.player, { opacity: 1, duration: 0.5 });
        
        try { this.bgAudio.play(); } catch(e) { console.warn("Audio Context Blocked"); }

        // Reset UI
        document.getElementById('player-status').innerText = "ANALYZING SEGMENT...";
        document.getElementById('player-title').innerText = "SCANNING...";
        document.getElementById('media-viewport').innerHTML = '';
        document.getElementById('agent-meta').innerText = "CALIBRATING SYMBOLISM...";

        // Animate Panel
        const nodes = document.querySelectorAll('.data-node');
        gsap.set(nodes, { opacity: 0, x: -10 });
        gsap.to(nodes, { 
            opacity: 1, x: 0, stagger: 0.3, duration: 0.4, 
            onComplete: () => this.startPlayback(asset, isVideo, agentTitle)
        });
    }

    startPlayback(asset, isVideo, agentTitle) {
        const viewport = document.getElementById('media-viewport');
        const status = document.getElementById('player-status');
        const titleEl = document.getElementById('player-title');
        const metaEl = document.getElementById('agent-meta');

        status.innerText = isVideo ? "CINEMATIC STREAM ACTIVE" : "VISUAL NODE STABILIZED";
        titleEl.innerText = agentTitle.toUpperCase();
        
        // Step 3: Poetic Agentic Caption
        metaEl.innerText = this.generatePoeticCaption(asset);
        metaEl.style.opacity = 0;
        gsap.to(metaEl, { opacity: 1, duration: 1, delay: 0.5 });

        // Content Injection
        if (isVideo) {
            // Use GDrive Preview for reliability, but HUD stays on top
            viewport.innerHTML = `<iframe src="https://drive.google.com/file/d/${asset.id}/preview" width="100%" height="100%" frameborder="0" allow="autoplay" referrerpolicy="no-referrer"></iframe>`;
        } else {
            viewport.innerHTML = `<img src="https://drive.google.com/thumbnail?id=${asset.id}&sz=w1600" style="max-width: 100%; max-height: 100%; object-fit: contain;" referrerpolicy="no-referrer">`;
        }

        // Voice Announcement
        this.announce(agentTitle);

        this.isAnalyzing = false;
    }

    generatePoeticCaption(asset) {
        const name = asset.name.toLowerCase();
        
        const fragments = {
            rhythm: ["The rhythm of the pulse", "A beat in the silence", "Flowing through the frequency"],
            roots: ["Rooted in the stones", "Ancestral echoes", "The foundation of the narrative"],
            motion: ["Unstoppable kinetic energy", "The dance of the present", "Motion captured in amber"],
            human: ["A soul revealed", "The essence of being", "Vulnerability as strength"],
            urban: ["Echoes of Lisbon", "The architecture of resistance", "Where the city breathes"]
        };

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        if (name.includes('jam') || name.includes('music')) return `${pick(fragments.rhythm)} // Performance & Art Layer`;
        if (name.includes('philosophy') || name.includes('narrative')) return `${pick(fragments.roots)} // Narrative & Philosophy Layer`;
        if (name.includes('basket') || name.includes('stop')) return `${pick(fragments.motion)} // Kinesthetic Layer`;
        if (name.includes('portrait') || name.includes('face')) return `${pick(fragments.human)} // Visual & Portrait Layer`;
        
        return `${pick(fragments.urban)} // Flow Matrix Active`;
    }

    announce(text) {
        if (!this.voice) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.8;
        utterance.rate = 0.9;
        utterance.volume = 0.6;
        this.voice.speak(utterance);
    }

    close() {
        if (this.voice) this.voice.cancel();
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
        gsap.to(this.player, { opacity: 0, duration: 0.5, onComplete: () => {
            this.player.style.display = 'none';
            document.getElementById('media-viewport').innerHTML = '';
        } });
    }
}

// Auto-Init
window.CDF_Portfolio = new PortfolioManager();
