/**
 * Agent: Flowee (The Navigator of the Flow)
 * Role: Guide, Hype-Man, and Chronos Interface.
 * Version: 4.0 (Unified Consciousness)
 */

class FloweeAgent {
    constructor() {
        this.name = "Flowee";
        this.element = null;
        this.bubble = null;
        this.container = null;
        this.chatInterface = null;
        
        // --- KNOWLEDGE BASE (FAQ) ---
        this.knowledgeBase = [
            {
                keywords: ["quest log", "atlas", "codex", "scriptorium", "brotherhood", "quest map"],
                question: "How does the Quest Log work?",
                answer: "Quest Log workflow: 1) ATLAS — Lisbon map missions. 2) CODEX — active quests. 3) SCRIPTORIUM — lore (Level 2+). 4) BROTHERHOOD — rankings (Level 3+). Type 'atlas' or 'codex' to warp there.",
                deep_link: "pages/quest_map.html"
            },
            {
                keywords: ["high palast", "palast", "museum", "treasury", "bibliothek", "curator"],
                question: "What is the High Palast?",
                answer: "High Palast workflow: Hub → Museum (Lv2) → Library → Treasury (Lv3, 20 trust). Type 'museum' or 'palast' and I'll guide you. Restricted areas show why you're blocked.",
                deep_link: "pages/high_palast.html"
            },
            {
                keywords: ["restrict", "blocked", "access", "trust", "karma", "level"],
                question: "Why am I blocked?",
                answer: "Some worlds need higher Level or Karma trust. Check the Bibliothec for role requirements. Complete Atlas quests for XP and help others for Karma.",
                deep_link: "pages/library.html"
            },
            {
                question: "What is my Flow Certificate?",
                answer: "It’s your digital DNA! It tracks your Resonance Level (RP), Nen-class, and Karma. Level up to unlock features.",
                deep_link: "/dashboard/identity"
            },
            {
                keywords: ["rp", "resonance", "xp", "experience", "points"],
                question: "How do I earn RP (Resonance Points)?",
                answer: "By being active! Daily Logins, completing Quests, and uploading Artifacts all boost your Resonance.",
                deep_link: "/dashboard/quest-log"
            },
            {
                keywords: ["karma", "reputation", "give", "help"],
                question: "What is Karma?",
                answer: "Karma is social energy. Earn it by helping others or reporting bugs. Spend it to create Quests or buy Snacks.",
                deep_link: "/dashboard/quest-log"
            },
            {
                keywords: ["bazaar", "sell", "skill", "upload", "artifact"],
                question: "How do I sell at the Bazaar?",
                answer: "Go to the East Quadrant (Vault). Upload your Skills or Artifacts to trade with the Network.",
                deep_link: "/dashboard/marketplace"
            },
            {
                keywords: ["bot", "make", "quest", "create", "task"],
                question: "Can I create Quests?",
                answer: "Yes! Use the 'Quest Architect' in the West Quadrant. You need Karma to mint new Quests.",
                deep_link: "/dashboard/quest-maker"
            },
            {
                keywords: ["sanctuary", "orbs", "hub", "vision", "path", "grotto"],
                question: "What is the Vision Sanctuary?",
                answer: "The Vision Sanctuary is our central hub. Click the colored orbs to travel: Gold for Portfolio, Blue for the AI Oasis Dashboard, and Green for the Memory Cave."
            },
            {
                keywords: ["portfolio", "gold", "voyage"],
                question: "What is the Voyage Portfolio?",
                answer: "The Voyage Portfolio (Gold Orb) showcases past creations and cinematics."
            },
            {
                keywords: ["oasis", "blue", "dashboard"],
                question: "What is the Vision Oasis?",
                answer: "The Vision Oasis (Blue Orb) is the command center where agents (like me!) process your daily content pipeline."
            },
            {
                keywords: ["cave", "green", "memory", "garden"],
                question: "What is the Memory Cave?",
                answer: "The Memory Cave (Green Orb) or Sacred Garden is where community legacies and past flows are recorded."
            },
            {
                keywords: ["kds", "kitchen", "bestellung", "order", "confirm", "pickup", "akwaba", "taste world", "crew"],
                question: "How does Kitchen Command work?",
                answer: "KDS flow: NEW → Confirm → Cooking → Ready → Picked up. Swipe slides for Menu, Brand, QR & Crew. Guest orders on Akwaba Kitchen sync here in real time.",
                deep_link: "pages/kitchen_workspace.html?kitchen=akwabalx"
            },
            {
                keywords: ["menu sync", "menü", "brand", "qr code", "kitchen qr"],
                question: "How do I sync menu and branding?",
                answer: "In Kitchen Command swipe to Menu (edit items) or Brand (logo/cover). Changes save locally first, then cloud-sync via ops code. QR slide generates guest pickup links.",
                deep_link: "pages/kitchen_workspace.html?kitchen=akwabalx"
            }
        ];

        // --- DIALOGUE MATRIX (Context Awareness) ---
        this.dialogueMatrix = {
            "index.html": { mode: "scan", intro: "Frequency detected! I am Flowee. Your resonance is weak, Drifter." },
            "dashboard.html": { mode: "guide", intro: "Welcome to your Command Center.", action: "Complete your profile to light up the grid." },
            "academy.html": { mode: "guide", intro: "The Academy lists every participant.", action: "Tap a manga panel — edit your bio and media descriptions." },
            "hall_of_legends.html": { mode: "guide", intro: "The Brotherhood ranks Navigators by XP.", action: "Rise in the Atlas, then return here to see your rank sync." },
            "artist_sanctuary.html": { mode: "guide", intro: "Welcome to the Artist Sanctuary — Akwaba zone, Stage, and Archive await.", action: "I can route you to the Lisbon Atlas or your nearest quest." },
            "lapa71_register.html": { mode: "guide", intro: "Welcome to the family — Lapa 71 x Tagus Drop Rhythm registration.", action: "I will coach each section. Start with your name, then disciplines, Aug 29, and jam details if you flow." },
            "join.html": { mode: "guide", intro: "Welcome to the family — Lapa 71 x Tagus Drop Rhythm registration.", action: "I will coach each section. Start with your name, then disciplines, Aug 29, and jam details if you flow." },
            "kitchen_workspace.html": {
                mode: "guide",
                intro: "Kitchen Command online. I guide you through KDS, menu, brand, QR and crew comms.",
                action: "Tap me anytime — ask about orders, sync, or Taste World workflows.",
            },
            "akwaba_kitchen.html": {
                mode: "guide",
                intro: "Guest kitchen live. Orders sync to crew KDS in real time.",
                action: "Ask me about pickup, Soul Ticket, or menu items.",
            },
            "quest_map.html": { mode: "guide", intro: "The Lisbon Atlas links streets to quests and Adinkra runes.", action: "Tap NEARBY for closest missions." },
            "quest_board.html": { mode: "guide", intro: "The Codex holds protocols and GPS quests.", action: "Accept a quest, then verify on the Atlas." },
            "marketplace.html": { mode: "active", intro: "The Bazaar. Where skills become currency.", target: "#upload-btn" },
            "battle.html": { mode: "active", intro: "The Arena. Prove your resonance.", target: "#leaderboard" },
            "default": { mode: "guide", intro: "The Flow is strong here..." }
        };

        // --- TUTORIAL MATRIX (The Ghost-Run) ---
        this.tutorialMatrix = {
            // LANDING / GATEWAY
            "index.html": [
                { text: "Welcome, Voyager. This is the Gateway to the Circle. Hold to grow.", target: "#canvas-container" },
                { text: "Swipe down to explore more information about our network.", target: "body" },
                { text: "Choose your Language at the top right to harmonize the frequency.", target: ".lang-selector" },
                { text: "Discover the Trinity by navigating the 3D space.", target: "#title-overlay" }
            ],
            // DASHBOARD COMPASS
            "dashboard.html": [
                { text: "Welcome to the Command Center. This Compass is your navigation tool.", target: ".mandala-core" },
                { text: "The Trinity Nodes (West) lead to Vision, Taste, and Sound.", target: "#ring-trinity" }
            ],
            // MARKETPLACE
            "marketplace.html": [
                { text: "The Bazaar! meticulous trade happens here. Check the 'Vault' tab to see your inventory.", target: "a[href='#vault']" }, 
                { text: "Use the Upload Button to mint your own Artifacts.", target: "#btn-upload" } 
            ],
            // BATTLE / LADDER
            "ladder.html": [
                 { text: "The Arena. Here we rank the strongest flows.", target: ".leaderboard-header" }
            ],
             // GOAL / PURPOSE
            "goal_purpose.html": [
                 { text: "This is the Heart of our Why. Read the Manifesto.", target: ".hero-title" },
                 { text: "If you resonate, click the Alignment Button to join the cause.", target: "#align-btn" }
            ],
            // LIBRARY
            "library.html": [
                 { text: "The Great Archive. Silence is golden here.", target: "h1" },
                 { text: "Select a Tome from the shelf to begin learning.", target: ".library-shelf" }
            ],
            // KITCHEN
            "akwaba_kitchen.html": [
                 { text: "AkwabaLX at Secret Garden — soul food and pickup at the bar.", target: "h1" },
                 { text: "Browse the menu, add pickup, and share the kitchen QR!", target: "#menu-grid" }
            ],
            "african-queen-kitchen.html": [
                 { text: "Redirecting to AkwabaLX — our first live kitchen.", target: "h1" },
            ],
            // QUEST CREATOR
            "quest-create.html": [
                 { text: "The Forge of Destiny. Here you script the challenges for others.", target: "h1" },
                 { text: "Define the Title and Prophecy (Description).", target: "input[name='title']" },
                 { text: "Choose the Reward and Type. Balance is key.", target: "select[name='xpReward']" },
                 { text: "Manifst your Intent to publish it to the network.", target: "button[type='submit']" }
            ],
            // QUEST CREATOR (Root)
            "pages/quest-create.html": [
                 { text: "The Forge of Destiny. Here you script the challenges for others.", target: "h1" },
                 { text: "Define the Title and Prophecy (Description).", target: "input[name='title']" },
                 { text: "Choose the Reward and Type. Balance is key.", target: "select[name='xpReward']" },
                 { text: "Manifst your Intent to publish it to the network.", target: "button[type='submit']" }
            ],
            // MARKET UPLOAD
            "marketplace-upload.html": [
                 { text: "Declare your Offering to the Grand Bazaar.", target: "h1" },
                 { text: "Select your Listing Type: Deal (Trade), Link (External), or TukTuk (Service).", target: ".grid" },
                 { text: "Fill in the details and Inscribe it to the ledger.", target: "button[type='submit']" }
            ],
             // ARENA HUB
            "arena.html": [
                 { text: "The Battleground. Choose your path, Warrior.", target: "h1" },
                 { text: "The Arena (Left) is for Ranked 1v1 Duels.", target: "a[href='arena1.html']" },
                 { text: "The Ladder (Center) shows the Global Rankings.", target: "a[href='guild.html']" },
                 { text: "The Dojo (Right) is for training and sparring.", target: "a[href='matchroom.html?mode=training']" }
            ],
            // ARENA FIGHT
            "arena1.html": [
                 { text: "Welcome to the Ring. Select your Fighter Class.", target: "#fighter-select" }, // assuming ID
                 { text: "When ready, Signal Ready to find an opponent.", target: "#ready-btn" } // assuming ID
            ],
            // GUILD / LADDER
            "guild.html": [
                 { text: "The Hall of Legends. See who rules the Flow.", target: "h1" },
                 { text: "Check your own standing in the roster.", target: "#my-rank" } // assuming ID
            ]
        };

        // --- IMPERIAL INITIATION MATRIX (The Voyager's Path) ---
        this.imperialSteps = [
            { id: 1, page: "index.html", text: "Welcome, Traveler. Choose your tongue (Top Right) and Identify Yourself to enter the Flow.", target: ".lang-selector", check: () => localStorage.getItem('cdf_user_username') },
            { id: 2, page: "marketplace.html", text: "The Bazaar. Click on an Artifact to inspect its value.", target: ".grid", check: () => localStorage.getItem('cdf_initiation_market_visited') },
            { id: 3, page: "outbreak_tunes.html", text: "Listen... The Wisdom Rune appears after 30 seconds of resonance.", target: "#video-bg", check: () => localStorage.getItem('cdf_initiation_rune_found') },
            { id: 4, page: "akwaba_kitchen.html", text: "Fuel for the Soul. Browse AkwabaLX menu and place a pickup order.", target: "#menu-grid", check: () => localStorage.getItem('cdf_initiation_kitchen_visited') },
            { id: 5, page: "dashboard.html", text: "The Mission Board. Open your Quests to see your path.", target: "#quest-log-btn", check: () => localStorage.getItem('cdf_initiation_quests_viewed') },
            { id: 6, page: "dashboard.html", text: "Psst... This is not for everyone. 3 clicks on the Vision-Icon... only for the Architect.", target: "#planet-Vision", check: () => localStorage.getItem('cdf_initiation_vision_found') },
            { id: 7, page: "/pages/dashboard.html", text: "The Captain's Eye. Toggle the 'Flow Sync' lever to master the system.", target: "#flow-sync-toggle", check: () => localStorage.getItem('cdf_artifact_genesis') }
        ];

        // --- COMMUNITY CONNECTION MATRIX ---
        this.communitySteps = [
            { id: 1, page: "coop.html", text: "Welcome to the Resonance Bar! Tap Start Tutorial — I'll show you and the team how to plan together. Invite Naru & C-riz when ready.", target: "#flowee-tutorial-card" },
            { id: 2, page: "quest-create.html", text: "Welcome to The Forge! Fill out your event details, location needs, and hit Manifest Event.", target: "button[onclick='manifestEvent()']" },
            { id: 3, page: "chat.html", text: "Success! You are now in The Sanctuary. Make sure to open your 'Event Ledger'.", target: "button[onclick=\"switchTab('tasks')\"]" },
            { id: 4, page: "chat.html", text: "Welcome to the Ledger! Scroll down to The Wisdom Wall and engrave a note for the next Master Flow.", target: "#wisdom-form" }
        ];

        // --- TRINITY RESONANCE (Admin Sync) ---
        this.trinityState = {
            vision: 50,
            sound: 50,
            kitchen: 50
        };

        // Initialize
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // Listen for Quest Creation
            window.addEventListener('cdf-quest-created', (e) => {
                 this.handleQuestCreation(e.detail);
            });
            // Listen for Item Minting
            window.addEventListener('cdf-item-minted', (e) => {
                 this.handleItemMinted(e.detail);
            });
            this.init();
        }
    }

    handleQuestCreation(detail) {
        window.floweeRedirected = true;
        // Step 1: Congratulate
        this.talk(true, `Splendid work, Creator! Quest "${detail.title}" has been etched into the Chronicle.`);
        
        // Step 2: Rewards & Redirect Sequence
        setTimeout(() => {
            this.talk(true, "You have gained **+100 XP** and **+50 Karma** for this contribution.", "success");
            
            setTimeout(() => {
                this.talk(true, "Now, let us expand the economy. Warping to the Bazaar in 3 seconds...");
                
                setTimeout(() => {
                     window.location.href = 'marketplace.html?tutorial=true';
                }, 3000);
            }, 4000);
        }, 3000);
    }

    handleItemMinted(detail) {
        // Step 1: Congratulate
        this.talk(true, `Magnificent! "${detail.title}" is now live in the Bazaar.`, 'success');
        
        // Step 2: Prompt for Next Step
        setTimeout(() => {
             this.talk(true, "Your contribution strengthens the Flow. Ready for the next challenge?");
             
             // Create a custom action button in the chat or just wait for text input
             // For now, auto-redirect after a delay or prompt
             setTimeout(() => {
                 if(confirm("Flowee: Ready for the next Quest?")) {
                     window.location.href = 'dashboard.html';
                 }
             }, 4000);
        }, 3000);
    }

    getLang() {
        const raw = localStorage.getItem('cdf_lang')
            || localStorage.getItem('cqr_lang')
            || localStorage.getItem('cdf_language')
            || (navigator.language || 'en');
        const code = String(raw).slice(0, 2).toLowerCase();
        if (code === 'de') return 'de';
        if (code === 'pt') return 'pt';
        return 'en';
    }

    t(key) {
        const lang = this.getLang();
        const table = {
            de: {
                chat_greeting: (name) => `Hallo <strong>${name}</strong>! Ich bin Flowee, dein Navigator. Wie kann ich dir helfen?`,
                chat_placeholder: 'Frage Flowee…',
                chat_title: 'Flowee KI',
                fallback: 'Ich durchsuche die Matrix… Probiere „KDS“, „Bestellung“, „Quests“ oder „Hilfe“.',
                kitchen_intro: 'Kitchen Command aktiv. KDS: NEW → Bestätigen → Kochen → Bereit. Tippe mich für Hilfe.',
                kitchen_action: 'Frag mich zu Bestellungen, Sync, Menü oder QR.',
                guest_intro: 'Gast-Kitchen live. Bestellungen erscheinen im Crew-KDS.',
                sanctuary_intro: 'Willkommen im Artist Sanctuary — Bühne, Archive & Secret Garden.',
                order_confirmed: (step, name) => `Bestellung ${step} — ${name}`,
            },
            en: {
                chat_greeting: (name) => `Hello <strong>${name}</strong>! I am Flowee, your Navigator. How can I assist you today?`,
                chat_placeholder: 'Command the Matrix…',
                chat_title: 'Flowee AI',
                fallback: "I'm searching the Matrix… Try 'KDS', 'Orders', 'Quests', or 'Help'.",
                kitchen_intro: 'Kitchen Command online. KDS: NEW → Confirm → Cooking → Ready. Tap me for help.',
                kitchen_action: 'Ask about orders, sync, menu, or QR.',
                guest_intro: 'Guest kitchen live. Orders sync to crew KDS in real time.',
                sanctuary_intro: 'Welcome to the Artist Sanctuary — stage, archive & Secret Garden.',
                order_confirmed: (step, name) => `Order ${step} — ${name}`,
            },
            pt: {
                chat_greeting: (name) => `Olá <strong>${name}</strong>! Sou Flowee, teu Navigator. Como posso ajudar?`,
                chat_placeholder: 'Pergunta ao Flowee…',
                chat_title: 'Flowee IA',
                fallback: 'A procurar na Matrix… Tenta „KDS“, „Pedido“, „Quests“ ou „Ajuda“.',
                kitchen_intro: 'Kitchen Command ativo. KDS: NOVO → Confirmar → Cozinhar → Pronto.',
                kitchen_action: 'Pergunta sobre pedidos, sync, menu ou QR.',
                guest_intro: 'Cozinha convidado ativa. Pedidos sincronizam com a crew.',
                sanctuary_intro: 'Bem-vindo ao Artist Sanctuary — palco, arquivo & jardim.',
                order_confirmed: (step, name) => `Pedido ${step} — ${name}`,
            },
        };
        const entry = table[lang] || table.de;
        const val = entry[key];
        return typeof val === 'function' ? val : val;
    }

    floweeSvgHtml() {
        return `
            <svg viewBox="0 0 100 100" width="100%" height="100%" style="filter: drop-shadow(0 0 15px rgba(0, 255, 204, 0.8)); overflow: visible;">
                <path d="M40,50 C10,20 -10,60 15,75 C25,80 40,65 40,50 Z" fill="#00ffcc" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" values="0 40 50; -20 40 50; 0 40 50" dur="0.8s" repeatCount="indefinite"/>
                </path>
                <path d="M60,50 C90,20 110,60 85,75 C75,80 60,65 60,50 Z" fill="#00ffcc" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" values="0 60 50; 20 60 50; 0 60 50" dur="0.8s" repeatCount="indefinite"/>
                </path>
                <circle cx="50" cy="50" r="16" fill="#00ffcc">
                    <animate attributeName="r" values="16;18;16" dur="2s" repeatCount="indefinite"/>
                </circle>
            </svg>`;
    }

    detectContext() {
        // PRIORITY: If Tutorial is active, do not override with default context
        if(this.tutorialActive) return;

        const path = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        
        // Tutorial override
        if(urlParams.get('tutorial') === 'true') {
             return { mode: 'guide', intro: "Tutorial Protocol Active. Follow the markers." };
        }

        for(const key in this.dialogueMatrix) {
            if(path.includes(key)) {
                const ctx = { ...this.dialogueMatrix[key] };
                if (key === 'kitchen_workspace.html') {
                    ctx.intro = this.t('kitchen_intro');
                    ctx.action = this.t('kitchen_action');
                } else if (key === 'akwaba_kitchen.html') {
                    ctx.intro = this.t('guest_intro');
                } else if (key === 'artist_sanctuary.html') {
                    ctx.intro = this.t('sanctuary_intro');
                }
                return ctx;
            }
        }
        return { ...this.dialogueMatrix['default'] };
    }

    applyMode(mode) {
        if(!this.element) return;
        this.element.classList.remove('grayscale', 'animate-pulse', 'animate-bounce');
        
        switch(mode) {
            case 'scan':
                this.element.classList.add('animate-pulse');
                break;
            case 'active':
                this.element.classList.add('animate-bounce');
                break;
            case 'triumph':
                this.element.classList.add('animate-spin-slow');
                break;
            case 'dormant':
                this.element.classList.add('grayscale');
                break;
        }
    }

    _isLandingPage() {
        const path = window.location.pathname.toLowerCase();
        return path.endsWith('index.html') || path.endsWith('/') || path === '';
    }

    _syncLandingChrome(visible) {
        if (!this._isLandingPage()) return;
        document.body.classList.toggle('flowee-bubble-open', !!visible);
        const worldNav = document.getElementById('world-quick-nav');
        if (worldNav && window.__landingIntroDone) {
            if (visible) worldNav.classList.remove('visible');
            else worldNav.classList.add('visible');
        }
        this.recalculateBubblePosition();
        window.dispatchEvent(new CustomEvent('LANDING_CHROME_SYNC'));
    }

    talk(visible, text, type="neutral", options=[]) {
        if(!this.bubble) return;

        if (this._talkContentTimer) {
            clearTimeout(this._talkContentTimer);
            this._talkContentTimer = null;
        }
        if (this.talkTimeout) {
            clearTimeout(this.talkTimeout);
            this.talkTimeout = null;
        }
        
        const contentDiv = this.bubble.querySelector('.flowee-text-content');
        const optionsDiv = this.bubble.querySelector('.flowee-options-container');
        
        if (visible && text) {
            this._syncLandingChrome(true);
            this.bubble.style.opacity = '1';
            this.bubble.style.transform = 'translateY(0) scale(1)';
            this.bubble.style.pointerEvents = 'auto';
            
            if (contentDiv) {
                contentDiv.innerHTML = `<span style="animation: pulse-op 1s infinite;">...</span>`;
                optionsDiv.innerHTML = '';
                
                this._talkContentTimer = setTimeout(() => {
                    this._talkContentTimer = null;
                    contentDiv.innerHTML = text;
                    
                    if (options && options.length > 0) {
                        options.forEach(opt => {
                            const btn = document.createElement('button');
                            btn.innerText = opt.label;
                            btn.className = 'hover:scale-105 transition-transform duration-200';
                            btn.style.padding = '6px 12px';
                            btn.style.backgroundColor = 'rgba(0, 255, 204, 0.15)';
                            btn.style.border = '1px solid rgba(0, 255, 204, 0.4)';
                            btn.style.borderRadius = '20px';
                            btn.style.color = '#00ffcc';
                            btn.style.fontSize = '11px';
                            btn.style.cursor = 'pointer';
                            btn.style.textTransform = 'uppercase';
                            btn.style.letterSpacing = '1px';
                            btn.style.fontFamily = "'Montserrat', sans-serif";
                            btn.style.fontWeight = 'bold';
                            
                            btn.onclick = () => {
                                this.shush();
                                if (typeof opt.action === 'function') opt.action();
                            };
                            optionsDiv.appendChild(btn);
                        });
                    }
                }, 400);
            }
            
            if (!options || options.length === 0) {
                this.talkTimeout = setTimeout(() => this.shush(), 8000);
            }
            
            this.addChatMessage(text, 'ai');
        } else {
            this.shush();
        }
    }

    shush() {
        if (this._talkContentTimer) {
            clearTimeout(this._talkContentTimer);
            this._talkContentTimer = null;
        }
        if(this.bubble) {
            this.bubble.style.opacity = '0';
            this.bubble.style.transform = 'translateY(20px) scale(0.9)';
            this.bubble.style.pointerEvents = 'none';
            if(this.talkTimeout) clearTimeout(this.talkTimeout);
        }
        this._syncLandingChrome(false);
    }

    updateVoiceIcon() {
        const el = document.getElementById('flowee-voice-toggle');
        if (!el || !window.FloweeVoice) return;
        const on = window.FloweeVoice.enabled;
        el.textContent = on ? 'volume_up' : 'volume_off';
        el.style.color = on ? 'rgba(0,255,204,0.8)' : 'rgba(255,255,255,0.35)';
    }

    highlight(selector) {
        const el = document.querySelector(selector);
        if(el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-mystic-gold', 'animate-pulse');
            setTimeout(() => el.classList.remove('ring-4', 'ring-mystic-gold', 'animate-pulse'), 3000);
        }
    }

    checkProfileStatus() {
        const username = localStorage.getItem('cdf_user_username');
        if(!username && window.location.pathname.includes('dashboard.html')) {
            this.talk(true, "I don't recognize you. Update your Identity Profile.");
            this.highlight('#user-greeting');
        }
    }

    addChatMessage(text, sender, link=null) {
        const log = document.getElementById('flowee-messages') || document.getElementById('flowee-chat-log');
        if(!log) {
            console.warn("[Flowee] Chat log container not found.");
            return;
        }
        
        const div = document.createElement('div');
        div.className = sender === 'user' 
            ? "ml-auto bg-white/10 p-2 rounded-lg border border-white/20 text-white max-w-[80%] text-right"
            : "mr-auto bg-primary-500/10 p-2 rounded-lg border border-primary-500/20 text-white/80 max-w-[90%]";
            
        div.innerHTML = text;
        
        if(link) {
            const btn = document.createElement('button');
            btn.className = "block mt-2 text-[10px] text-mystic-gold underline hover:text-white";
            btn.innerText = ">> ACCESS LINK";
            btn.onclick = () => window.location.href = link;
            div.appendChild(btn);
        }
        
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    }

    navigate(url) {
        window.location.href = url;
    }

    startTutorial() {
        console.log(`[${this.name}] Starting Tutorial Sequence...`);
        this.tutorialActive = true;
        
        // Force Start if undefined
        if(!this.tutorialStep || this.tutorialStep === 'undefined') {
             this.tutorialStep = 'step_0_welcome';
             localStorage.setItem('cdf_tutorial_step', 'step_0_welcome');
        }

        this.applyTutorialStep(this.tutorialStep);
    }
    
    init() {
        console.log(`[${this.name}] Initializing Unified Protocol v4.5 (Stabilized)...`);
        
        // Ensure Container Exists
        this.renderVessel();
        
        // Render Chat Interface
        this.renderChatInterface();
        
        // Detect Context & Mode
        this.currentContext = this.detectContext();
        this.applyMode(this.currentContext.mode);
        
        // Start Interaction — defer on landing until cinematic intro completes
        const isLanding = this._isLandingPage();
        const startMainIntro = () => {
            if (!isLanding) {
                this.talk(true, this.currentContext.intro);
            }
            if (this.currentContext.target) this.highlight(this.currentContext.target);
            this.checkProfileStatus();
            this.checkMissionBriefing();
        };

        if (isLanding && !window.__landingIntroDone) {
            window.addEventListener('INTRO_NARRATIVE_LINE', (e) => {
                const whisper = document.getElementById('flowee-intro-text');
                if (whisper && e.detail?.text) whisper.textContent = e.detail.text;
            });
            window.addEventListener('LANDING_INTRO_COMPLETE', startMainIntro, { once: true });
        } else {
            setTimeout(startMainIntro, 1000);
        }

        setTimeout(() => {
            this.recalculateBubblePosition();
            window.addEventListener('resize', () => this.recalculateBubblePosition());

            const pathName = window.location.pathname.split('/').pop() || 'index.html';
            if (pathName === 'index.html' || pathName === '') {
                let landingStarted = false;
                const startLandingGuide = () => {
                    if (landingStarted) return;
                    landingStarted = true;
                    if (window.FloweeLandingGuide) window.FloweeLandingGuide.run(this);
                };
                window.addEventListener('LANDING_INTRO_COMPLETE', startLandingGuide, { once: true });
                setTimeout(startLandingGuide, 18000);
            } else {
                this.checkPageTutorial();
            }

            this.checkImperialInitiation();
            this.checkCommunityTutorial();

            if (isLanding && !window.__landingIntroDone) return;

            if(window.Resonance && typeof window.Resonance.getProgress === 'function') {
                const progress = window.Resonance.getProgress();
                if(progress && progress.percent >= 90) {
                     this.talk(true, `Resonance Critical! Only ${progress.remaining} XP to Level ${progress.level + 1}. Push it!`);
                     this.element.classList.add('animate-pulse');
                }
            }
            
            if(window.location.pathname.includes('dashboard.html')) {
                console.log("[Flowee] Dashboard — FloweeDashboardGuide handles routing.");
            }

            if (!isLanding && !window.location.pathname.includes('dashboard.html') && !localStorage.getItem('cdf_beta_mission_1')) {
                console.log("[Flowee] Beta Protocol: Mission #1 Assigning...");
                setTimeout(() => {
                    this.talk(true, "🏴CQR Captain! The Brain is online. I have a mission for you.", "guide");
                    setTimeout(() => {
                         this.talk(true, "MISSION #1: The Grand Line Awakening. Check your Beta Log for details.", "guide");
                         this.addChatMessage("MISSION #1 OBJECTIVES:<br>1. Kiss Your Heart - Check Wisdom Rune<br>2. Kitchen - Test Jamtruck<br>3. Outbreak Tunes - Trigger Sound<br>4. Master Dashboard - Send Log", "ai");
                         localStorage.setItem('cdf_beta_mission_1', 'active');
                         if(window.BetaLogger) window.BetaLogger.toggle(); 
                    }, 4000);
                }, 2000);
            }

        }, isLanding ? 1200 : 1000);
    }

    recalculateBubblePosition() {
        const bubble = document.getElementById('flowee-bubble');
        const container = this.container || document.getElementById('flowee-agent');
        if (!bubble) return;

        const isMobile = window.innerWidth < 768;
        const isLanding = this._isLandingPage();
        const worldNav = document.getElementById('world-quick-nav');
        const navVisible = worldNav?.classList.contains('visible') && !document.body.classList.contains('flowee-bubble-open');
        const safeBottom = 'env(safe-area-inset-bottom, 0px)';

        if (isLanding && isMobile) {
            bubble.style.width = '100%';
            bubble.style.maxWidth = 'none';
            bubble.style.maxHeight = 'min(40vh, 260px)';
            bubble.style.overflowY = 'auto';
            bubble.style.marginRight = '0';
            bubble.style.transformOrigin = 'bottom center';
            const navH = navVisible ? 58 : 0;
            const bottomPx = 52 + navH;
            if (container) {
                container.style.left = '10px';
                container.style.right = '10px';
                container.style.bottom = `calc(${bottomPx}px + ${safeBottom})`;
            }
        } else if (isMobile) {
            bubble.style.width = '260px';
            bubble.style.maxWidth = 'calc(100vw - 40px)';
            bubble.style.maxHeight = '';
            bubble.style.overflowY = '';
            bubble.style.marginRight = '16px';
            if (container) {
                container.style.left = '';
                container.style.right = '20px';
                container.style.bottom = `calc(88px + ${safeBottom})`;
            }
        } else {
            if (container) {
                container.style.left = '';
                container.style.right = '40px';
                container.style.bottom = '40px';
            }
        }
    }

    checkPageTutorial() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        const key = `cdf_tour_done_${path}`;
        
        // If tour already done, skip
        if(localStorage.getItem(key)) return;

        // Find Tutorial for this Page
        const steps = this.tutorialMatrix[path];
        if(steps && steps.length > 0) {
            console.log(`[Flowee] Starting Tutorial for ${path}`);
            this.runTutorialSequence(steps, key);
        }
    }

    runTutorialSequence(steps, completionKey) {
        this.tutorialActive = true;
        let index = 0;

        const next = () => {
             // Stop if tutorial cancelled or done
             if(!this.tutorialActive) return;

            if(index >= steps.length) {
                this.tutorialActive = false;
                localStorage.setItem(completionKey, 'true');
                this.talk(true, "Tutorial Complete. You are ready.", "success");
                return;
            }

            const step = steps[index];
            this.talk(true, step.text, "guide");
            if(step.target) this.highlight(step.target);

            index++;
            // Auto advance
            setTimeout(next, 6000);
        };

        // Start
        this.talk(true, "First time here? Let me show you around...", "guide");
        setTimeout(next, 3000);
    }

    // --- LANDING PAGE ZERO-TYPING ONBOARDING ---
    runLandingOnboarding(forceShow = false) {
        if (window.FloweeLandingGuide) {
            window.FloweeLandingGuide.run(this, forceShow);
            return;
        }
        this.tutorialActive = true;
        let currentState = localStorage.getItem('cdf_landing_flowee_state') || 'step1_arrival';
        
        // If returning from Bantaba
        if (currentState === 'returned_from_bantaba') {
            setTimeout(() => {
                this.talk(true, "Welcome back. Want to explore The Archive next?", "guide", [
                    { label: "Take me to The Archive", action: () => { window.location.href = 'pages/library.html'; } },
                    { label: "Show all realms again", action: () => { this.showCrossroads(); } },
                    { label: "💬 Open Chat", action: () => { this.toggleChat(); } }
                ]);
            }, 2000);
            return;
        }

        if (currentState === 'step1_arrival') {
            setTimeout(() => {
                this.talk(true, "Bem-vindo to the Singularity. I am Flowee, the navigator of this frequency. (Tip: Swipe down for more info!)", "guide", [
                    { label: "Explore (Visitor)", action: () => { 
                        localStorage.setItem('cdf_landing_flowee_state', 'step2_crossroads');
                        this.showCrossroads(); 
                    }},
                    { label: "Return (Login)", action: () => { 
                        if (window.OrbitEngine) {
                            window.OrbitEngine.transitionToLuvo();
                            localStorage.setItem('cdf_landing_flowee_state', 'step1_arrival'); // reset
                        } else {
                            const authModal = document.getElementById('auth-modal');
                            if(authModal) {
                                authModal.style.display = 'flex';
                                setTimeout(() => authModal.style.opacity = '1', 10);
                            }
                        }
                    }},
                    { label: "💬 Open Chat", action: () => { this.toggleChat(); } }
                ]);
            }, 1000);
        } else if (currentState === 'step2_crossroads') {
            setTimeout(() => { this.showCrossroads(); }, 1000);
        }
    }

    showCrossroads() {
        this.talk(true, "The universe is expanding. Right now, three realms are open to your energy. Where should I guide you?", "guide", [
            { label: "Bantaba (Gathering of souls)", action: () => { this.showBantabaEntry(); } },
            { label: "Luvo (Community Hub)", action: () => { 
                if (window.OrbitEngine) {
                    window.OrbitEngine.transitionToLuvo();
                    localStorage.setItem('cdf_landing_flowee_state', 'step1_arrival'); // reset
                } else {
                    window.location.href = 'pages/about.html';
                }
            }},
            { label: "Archive (Portfolio and System knowledge)", action: () => { window.location.href = 'pages/library.html'; } },
            { label: "💬 Open Chat", action: () => { this.toggleChat(); } }
        ]);
    }

    showBantabaEntry() {
        this.talk(true, "Routing to Bantaba... This is our sacred gathering space. Here you will find our local market, the event map, and your first connection to the Luvo system. Ready to step in?", "guide", [
            { label: "Open the Gates", action: () => {
                localStorage.setItem('cdf_landing_flowee_state', 'returned_from_bantaba');
                // Optional: Fade out singularity
                const canvas = document.getElementById('canvas-container');
                if (canvas) canvas.style.transition = 'opacity 1s ease';
                if (canvas) canvas.style.opacity = '0';
                
                setTimeout(() => {
                    window.location.href = 'pages/bantaba.html';
                }, 1000);
            }},
            { label: "💬 Open Chat", action: () => { this.toggleChat(); } }
        ]);
    }

    // --- IMPERIAL INITIATION LOGIC ---
    checkImperialInitiation() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        if (path.includes('dashboard') && window.FloweeDashboardGuide) return;

        const step = parseInt(localStorage.getItem('cdf_imperial_step') || 1);
        const maxSteps = 7;
        
        if(step > maxSteps) return; // Done

        const currentTask = this.imperialSteps.find(s => s.id === step);

        // 1. Check if we are on the right page for the current step
        if(currentTask && path.includes(currentTask.page)) {
             console.log(`[Flowee] Imperial Step ${step} Active`);
             
             // Initial Prompt
             setTimeout(() => {
                 this.talk(true, `[INITIATION STEP ${step}/7] ${currentTask.text}`, "guide");
                 if(currentTask.target) {
                     // Retry finding target if dynamic
                     let attempts = 0;
                     const findTarget = setInterval(() => {
                         attempts++;
                         const el = document.querySelector(currentTask.target);
                         if(el || attempts > 5) {
                             clearInterval(findTarget);
                             if(el) this.highlight(currentTask.target);
                         }
                     }, 1000);
                 }
             }, 2000);

             // Validation Listeners
             this.setupInitiationListeners(step);
        }
    }

    setupInitiationListeners(step) {
        switch(step) {
            case 1: // Gateway
                // Check periodically if user registered
                const checkReg = setInterval(() => {
                    if(localStorage.getItem('cdf_user_username')) {
                        clearInterval(checkReg);
                        this.completeImperialStep(1, 50, "Spirit Identified. Accessing Orbit...");
                    }
                }, 2000);
                break;
            case 2: // Bazaar
                // Listen for clicks on grid items (mock)
                document.body.addEventListener('click', (e) => {
                    if(e.target.closest('.grid') || e.target.closest('.lucide-shopping-bag')) {
                        this.completeImperialStep(2, 20, "Artifact Inspected. Accessing Museum...");
                    }
                }, { once: true });
                break;
            case 3: // Sanctuary
                // Handled by Wisdom Rune Event in outbreak_tunes.html
                window.addEventListener('cdf-wisdom-rune-found', () => {
                     this.completeImperialStep(3, 50, "Wisdom Rune Acquired. Codex Updated.");
                });
                break;
            case 4: // Kitchen
                // Listen for form submit mock
                const form = document.querySelector('form');
                // Use delegation or specific ID if known
                document.body.addEventListener('submit', (e) => {
                     // Assume kitchen form
                     this.completeImperialStep(4, 30, "Fuel Ordered. You are a Gourmet Adept.");
                }, { once: true });
                break;
            case 5: // Dashboard / Mission Board
                 // Listen for Quest Log Open OR Create Quest Page
                 window.addEventListener('cdf-quest-log-opened', () => {
                     this.completeImperialStep(5, 100, "Navigator Rank Achieved. The Eye opens.");
                 });
                 // Fallback: If they manually navigate to quest-create
                 if(window.location.href.includes('quest')) {
                      setTimeout(() => this.completeImperialStep(5, 100, "Navigator Rank Achieved."), 3000);
                 }
                 break;
            case 6: // Vision Entry (Dashboard)
                 // This step completes when they LEAVE to master_dashboard
                 // We can listen for unload? Or just auto-complete when they arrive at Step 7 page?
                 // Update: We'll rely on the user successfully clicking. 
                 // If they are on master_dashboard, they might have skipped step 6 logic if we dont handle it.
                 // Actually, if they arrive at master_dashboard, we should detect "initiation step 6" and auto-promote to 7.
                 // But let's assume they are on dashboard.html for now.
                 break; // Detection happens when they successfully navigate
            case 7: // Master Dashboard
                 // Handled by toggleFlowSync() in HTML
                 // Also listen for event just in case
                 window.addEventListener('cdf-flow-sync', () => {
                      this.completeImperialStep(7, 500, "Compass of the First Hour Unlocked. You are the Architect.");
                      localStorage.setItem('cdf_artifact_genesis', 'true');
                 });
                 break;
        }
    }

    completeImperialStep(step, xp, message) {
        this.talk(true, `✅ ${message}`, "success");
        if(window.Gamification) {
            window.Gamification.addXP(xp, `Initiation Step ${step}`);
        }
        
        const next = step + 1;
        localStorage.setItem('cdf_imperial_step', next);
        
        // Guidance to next step
        setTimeout(() => {
            const nextTask = this.imperialSteps.find(s => s.id === next);
            if(nextTask) {
                this.talk(true, `Next Destination: ${nextTask.page}. Go there to continue.`);
            }
        }, 4000);
    }

    // --- TRINITY RESONANCE BAR ---
    syncTrinityResonance() {
        // Mock specific values or read from storage is enough for now
        // This function is called on init()
        const bar = document.getElementById('trinity-resonance-wrap');
        if(bar) {
             // We have the bar, let's update it
             const v = localStorage.getItem('cdf_synergy_vision') || 50;
             const s = localStorage.getItem('cdf_synergy_sound') || 50;
             const k = localStorage.getItem('cdf_synergy_kitchen') || 50;
             
             if(window.updateTrinitySync) window.updateTrinitySync(v,s,k);
        }
    }

    renderVessel() {
        let container = document.getElementById('flowee-agent');
        
        if (!container) {
            console.warn(`[${this.name}] Container missing! Generating emergency vessel.`);
            container = document.createElement('div');
            container.id = 'flowee-agent';
            document.body.appendChild(container); // Append to body
        }

        // Enforce Stabilized Classes (Bottom-Right Default, Z-Index High, Pointer Events Logic)
        // pointer-events-none on container prevents blocking clicks behind it (invisible box issue)
        // pointer-events-auto on children re-enables clicking Flowee
        // FIX: Increased bottom margin to avoid overlapping with Footer Banners (was bottom-4)
        // FIX: Z-Index 10000 to beat Overlay
        const isMobile = window.innerWidth < 768;
        const isLanding = this._isLandingPage();
        container.style.position = 'fixed';
        container.style.bottom = isMobile ? `calc(88px + env(safe-area-inset-bottom, 0px))` : '40px';
        container.style.right = isMobile ? '20px' : '40px';
        container.style.zIndex = '999999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        container.style.pointerEvents = 'none';
        container.className = 'group transition-all duration-500' + (isLanding && isMobile ? ' flowee-landing-vessel' : '');
        
        this.container = container;

        const path = window.location.pathname.toLowerCase();
        const isRoot = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('beta-initiation.html');
        const pathPrefix = isRoot ? 'Assets/images/' : '../Assets/images/';

        let visual = document.getElementById('flowee-visual');
        if (!visual) {
            visual = document.createElement('div');
            visual.id = 'flowee-visual';
            visual.className = 'hover:scale-110 transition-transform duration-300 animate-float-slow';
            visual.style.width = isMobile ? '80px' : '60px';
            visual.style.height = isMobile ? '80px' : '60px';
            visual.style.cursor = 'pointer';
            visual.style.pointerEvents = 'auto';
            visual.style.zIndex = '1000001';
            visual.style.display = 'flex';
            visual.style.alignItems = 'center';
            visual.style.justifyContent = 'center';

            visual.innerHTML = this.floweeSvgHtml();
            
            visual.addEventListener('click', (e) => {
                console.log("[Flowee] Icon Clicked!");
                e.stopPropagation();
                const pathName = window.location.pathname.split('/').pop() || 'index.html';
                if (pathName === 'index.html' || pathName === '') {
                    this.runLandingOnboarding(true);
                } else {
                    window.Flowee.toggleChat();
                }
            });
            this.container.appendChild(visual);
        } else {
            visual.innerHTML = this.floweeSvgHtml();
        }

        let bubble = document.getElementById('flowee-bubble');
        if (!bubble) {
            bubble = document.createElement('div');
            bubble.id = 'flowee-bubble';
            bubble.style.marginBottom = '12px';
            bubble.style.marginRight = '16px';
            bubble.style.width = '260px';
            bubble.style.maxWidth = 'calc(100vw - 40px)';
            bubble.style.boxSizing = 'border-box';
            bubble.style.backgroundColor = 'rgba(15, 20, 25, 0.75)';
            bubble.style.backdropFilter = 'blur(12px)';
            bubble.style.WebkitBackdropFilter = 'blur(12px)';
            bubble.style.border = '1px solid rgba(0, 255, 204, 0.2)';
            bubble.style.color = '#fff';
            bubble.style.padding = '16px';
            bubble.style.borderRadius = '16px';
            bubble.style.borderBottomRightRadius = '4px';
            bubble.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,204,0.15)';
            bubble.style.fontSize = '13px';
            bubble.style.fontWeight = '400';
            bubble.style.opacity = '0';
            bubble.style.pointerEvents = 'none'; // Will be set to auto when visible
            bubble.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            bubble.style.transform = 'translateY(20px) scale(0.9)';
            bubble.style.transformOrigin = 'bottom right';
            bubble.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:9px;letter-spacing:2px;color:rgba(0,255,204,0.6);text-transform:uppercase">Flowee</span><button type="button" id="flowee-bubble-close" aria-label="Close" style="background:transparent;border:none;color:rgba(255,255,255,0.45);cursor:pointer;font-size:16px;line-height:1;padding:4px 6px">✕</button></div><div class="flowee-text-content" style="line-height: 1.5; font-family: 'Space Mono', monospace;"></div><div class="flowee-options-container" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;"></div>`;

            bubble.querySelector('#flowee-bubble-close')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shush();
            });

            // Swipe to dismiss
            let touchStartY = 0;
            bubble.addEventListener('touchstart', e => { touchStartY = e.changedTouches[0].screenY; }, {passive: true});
            bubble.addEventListener('touchend', e => {
                const touchEndY = e.changedTouches[0].screenY;
                if (touchEndY - touchStartY > 40) {
                    this.shush();
                }
            }, {passive: true});

            this.container.insertBefore(bubble, visual);
        }

        this.element = visual;
        this.bubble = bubble;
    }

    renderChatInterface() {
        let chatDiv = document.getElementById('flowee-chat');
        if (!chatDiv) {
            chatDiv = document.createElement('div');
            chatDiv.id = 'flowee-chat';
        chatDiv.style.position = 'fixed';
        chatDiv.style.bottom = '96px';
        chatDiv.style.right = '32px';
        chatDiv.style.width = '320px';
        chatDiv.style.height = '384px';
        chatDiv.style.zIndex = '1000000';
        chatDiv.style.backgroundColor = 'rgba(0,0,0,0.95)';
        chatDiv.style.border = '1px solid rgba(212,175,55,0.3)';
        chatDiv.style.borderRadius = '16px';
        chatDiv.style.backdropFilter = 'blur(24px)';
        chatDiv.style.padding = '16px';
        chatDiv.style.display = 'none';
        chatDiv.style.flexDirection = 'column';
        chatDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        chatDiv.style.transform = 'scale(0.95)';
        chatDiv.style.opacity = '0';
        chatDiv.style.transformOrigin = 'bottom right';
        chatDiv.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7)';
        chatDiv.style.fontFamily = "'Montserrat', sans-serif";
        chatDiv.style.pointerEvents = 'auto';

        const path = window.location.pathname;
        const isRoot = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('beta-initiation.html');
        const pathPrefix = isRoot ? 'Assets/images/' : '../Assets/images/';

        chatDiv.innerHTML = `
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                         <img src="${pathPrefix}logo.png" style="width: 20px; height: 20px;">
                         <span style="font-family: 'Cinzel', serif; color: var(--haki-gold); font-size: 0.8rem; letter-spacing: 2px; font-weight: bold;">${this.t('chat_title')}</span>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <span id="flowee-voice-toggle" onclick="window.FloweeVoice && window.FloweeVoice.toggle(); window.Flowee.updateVoiceIcon();" style="cursor: pointer; color: rgba(0,255,204,0.8); font-size: 18px;" class="material-symbols-outlined" title="Toggle voice">volume_up</span>
                        <span id="flowee-dismiss-btn" onclick="window.Flowee.dismissCommunityTutorial()" style="display: none; cursor: pointer; color: #EF4444; font-size: 10px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; border: 1px solid #EF4444; padding: 2px 4px; border-radius: 4px;">Dismiss Training</span>
                        <span onclick="window.Flowee.toggleChat()" style="cursor: pointer; color: rgba(255,255,255,0.5); font-size: 18px;" class="material-symbols-outlined">close</span>
                    </div>
                </div>

                <!-- Messages Area -->
                <div id="flowee-messages" style="flex: 1; overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 12px; font-size: 0.8rem; color: #eee; scroll-behavior: smooth;">
                    <div style="background: rgba(212,175,55,0.1); border-left: 3px solid var(--haki-gold); padding: 10px; border-radius: 4px; line-height: 1.4;" id="flowee-greeting-msg">
                        …
                    </div>
                </div>

                <!-- Input Area -->
                <div style="position: relative; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <input id="flowee-input" type="text" placeholder="${this.t('chat_placeholder')}"
                        style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.2); border-radius: 20px; padding: 12px 45px 12px 20px; color: #fff; font-size: 0.8rem; outline: none; box-sizing: border-box; transition: border-color 0.3s;"
                        onfocus="this.style.borderColor='rgba(212,175,55,0.6)'"
                        onblur="this.style.borderColor='rgba(212,175,55,0.2)'"
                        onkeypress="if(event.key === 'Enter') window.Flowee.processInput(this.value)">
                    <button onclick="window.Flowee.processInput(document.getElementById('flowee-input').value)" 
                        style="position: absolute; right: 12px; top: 22px; background: none; border: none; color: var(--haki-gold); cursor: pointer; transition: transform 0.2s;" 
                        onmousedown="this.style.transform='scale(0.9)'" 
                        onmouseup="this.style.transform='scale(1)'"
                        class="material-symbols-outlined">send</button>
                </div>
                <!-- Quick Actions -->
                <div id="flowee-chat-quick-actions" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;"></div>
            `;
            document.body.appendChild(chatDiv);
        }
        this.chatInterface = chatDiv;

        // Dynamic greeting setup
        let uname = 'Navigator';
        try {
            const u = JSON.parse(localStorage.getItem('cqr_user') || '{}');
            if (u.username) uname = u.username;
        } catch(e) {}

        const isDashboard = window.location.pathname.includes('dashboard');
        const isKitchen = window.location.pathname.includes('kitchen_workspace');
        let greetingText = this.t('chat_greeting')(uname);
        if (isKitchen) {
            greetingText += `<br><br><span style="color:var(--haki-gold);font-size:0.85em">${this.t('kitchen_intro')}</span>`;
        }
        
        if (isDashboard) {
            greetingText += `<br><br><strong style="color:var(--haki-gold)">Orbit Agenda:</strong><br>
            <div style="margin-top: 8px; font-size: 0.85em; display:flex; flex-direction:column; gap:4px;">
                <span><strong>High Palast (Aban)</strong>: Museum, Library & Treasury</span>
                <span><strong>Academy (Nea Onnim)</strong>: Manga Portfolios & Navigator Training</span>
                <span><strong>Bazaar (Bese Saka)</strong>: Marketplace for Artifacts</span>
                <span><strong>Battleground (Akofena)</strong>: The Arena</span>
                <span><strong>Vision (Hwe Mu Dua)</strong>: Photo Studio & Gallery</span>
                <span><strong>Sound (Akoma)</strong>: System Radio</span>
                <span><strong>Taste (Ese Ne Tekrema)</strong>: Akwaba Kitchen</span>
                <span><strong>Connection (Nkonsonnkonson)</strong>: Resonance Bar</span>
                <span><strong>Quest Log (Sankofa)</strong>: Missions and Atlas</span>
            </div>`;
        }
        const greetingEl = document.getElementById('flowee-greeting-msg');
        if (greetingEl) greetingEl.innerHTML = greetingText;

        const quick = document.getElementById('flowee-chat-quick-actions');
        if (quick && isKitchen) {
            const lang = this.getLang();
            const chips = lang === 'en'
                ? ['How does KDS work?', 'Order stuck in NEW', 'Menu sync', 'QR for guests']
                : lang === 'pt'
                    ? ['Como funciona o KDS?', 'Pedido preso em NOVO', 'Sync menu', 'QR convidados']
                    : ['Wie funktioniert KDS?', 'Bestellung bleibt in NEW', 'Menü-Sync', 'QR für Gäste'];
            quick.innerHTML = chips.map((c) =>
                `<button type="button" onclick="window.Flowee.processInput('${c.replace(/'/g, "\\'")}')" style="font-size:9px;padding:4px 8px;border-radius:99px;border:1px solid rgba(212,175,55,0.35);background:rgba(212,175,55,0.08);color:#eee;cursor:pointer">${c}</button>`
            ).join('');
        }
    }

    toggleChat() {
        console.log("[Flowee] Toggling Chat Interface...");
        if(!this.chatInterface) {
            console.error("[Flowee] Chat interface NOT initialized!");
            return;
        }
        const chat = this.chatInterface;
        
        if(chat.style.display === 'none') {
            chat.style.display = 'flex';
            // Small delay for transition
            setTimeout(() => {
                chat.style.transform = 'scale(1)';
                chat.style.opacity = '1';
            }, 10);
            const input = document.getElementById('flowee-input');
            if(input) input.focus();
            this.shush();
        } else {
            chat.style.transform = 'scale(0.95)';
            chat.style.opacity = '0';
            setTimeout(() => {
                chat.style.display = 'none';
            }, 300);
        }
    }

    processInput(text) {
        if(!text || !text.trim()) return;
        
        const input = document.getElementById('flowee-input');
        if(input) input.value = '';

        // 1. User Message
        this.addChatMessage(text, 'user');

        // Check if waiting for payment details
        if(this.waitingForPaymentDetails) {
            this.waitingForPaymentDetails = false;
            this.saveCommsDetailField('payment_details', text);
            setTimeout(() => {
                this.addChatMessage("Thank you! I have saved your payment details/tags to your profile. 💰", 'ai');
            }, 600);
            return;
        }

        // World navigation keywords (Quest Log, High Palast, etc.)
        if (window.WorldAccess && window.WorldAccess.handleFloweeKeyword(text)) return;

        const lower = text.toLowerCase().trim();
        if (lower === 'notify on' || lower === 'notifications on' || lower.includes('enable notifications')) {
            if (window.FloweeNotify) {
                window.FloweeNotify.requestPermission().then((ok) => {
                    this.addChatMessage(ok
                        ? 'Notifications enabled. Flowee will alert you for quests, runes, and level-ups.'
                        : 'Notifications blocked. Enable them in browser settings, then type "notify on" again.', 'ai');
                });
            } else {
                this.addChatMessage('Notification agent offline on this page.', 'ai');
            }
            return;
        }
        if (lower === 'notify off' || lower === 'notifications off') {
            localStorage.setItem('cdf_notify_enabled', 'false');
            if (window.FloweeNotify) window.FloweeNotify.enabled = false;
            this.addChatMessage('Notifications paused. Type "notify on" to re-enable.', 'ai');
            return;
        }
        if (lower.includes('high palast') || lower.includes('adinkra') || lower.includes('rune')) {
            const n = Object.keys(JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}')).length;
            this.addChatMessage(`Your Adinkra Codex holds ${n} rune(s). Bronze = walk-by, Silver = scan on site, Gold = community mastery. Open Brotherhood to view.`, 'ai');
            return;
        }

        // Dispatch Global Event for Agentic Brain
        window.dispatchEvent(new CustomEvent('CDF_USER_CHAT', { detail: { text } }));

        // 2. AI Processing
        setTimeout(() => {
            const answer = this.findAnswer(text);
            this.addChatMessage(answer.text, 'ai', answer.link);
            
            if(answer.action) answer.action(); 
        }, 600);
    }

    async saveCommsDetailField(field, val) {
        localStorage.setItem(`cdf_user_${field}`, val);
        if(window.supabaseClient) {
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if(user) {
                    const { data: profile } = await window.supabaseClient.from('profiles').select('contact_details').eq('id', user.id).single();
                    let details = {};
                    if(profile && profile.contact_details) {
                        details = typeof profile.contact_details === 'string' ? JSON.parse(profile.contact_details) : profile.contact_details;
                    }
                    details[field] = val;
                    await window.supabaseClient.from('profiles').update({ contact_details: JSON.stringify(details) }).eq('id', user.id);
                }
            } catch(e) {
                console.warn("[Flowee] Error updating contact details:", e);
            }
        }
    }

    startCountdownAndNavigate(url, message) {
        let count = 3;
        const baseMsg = message || "Initiating Warp Sequence...";
        
        // Immediate Feedback
        this.talk(true, `${baseMsg} (Warp in ${count}s)`);
        
        const timer = setInterval(() => {
            count--;
            if(count > 0) {
                this.talk(true, `${baseMsg} (Warp in ${count}s)`);
            } else {
                clearInterval(timer);
                this.talk(true, "🚀 WARP DRIVE ACTIVE!");
                setTimeout(() => {
                    this.navigate(url);
                }, 500);
            }
        }, 1000);
    }
    
    // ... rest of methods ...

    checkMissionBriefing() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const questId = urlParams.get('quest_id');
        
        if(questId) {
             setTimeout(() => {
                // Specific Quest Briefings
                const questMap = {
                    'Q-INIT-002': "📍 **MISSION: Identify Yourself**\n\nOpen your Profile, update your Avatar/Class, and Save. This stabilizes your digital form.",
                    'Q-SOC-201': "📍 **MISSION: Signal Boost**\n\nFind the 'Signal' button (or a fellow hunter) and send a high-frequency message.",
                    'Q-VIS-103': "📍 **MISSION: Knowledge Seeker**\n\nThe Academy holds the answers. Find the Quiz and answer correctly."
                };

                const msg = questMap[questId] || `📍 **ACTIVE MISSION**\n\nFocus on your task, Hunter. Quest ${questId} is active.`;
                this.talk(true, msg, "guide");
                
                // Hints
                if(questId === 'Q-INIT-002') this.highlight('#user-greeting');
            }, 1500);
        } else if(action) {
            setTimeout(() => {
                switch(action) {
                    case 'open_quest':
                        this.talk(true, "📍 **MISSION 2: The First Call**\n\nYour Goal: Open the Quest Log and accept the 'Say Hello' Quest to earn your first XP.", "guide");
                        this.highlight('#btn-new-quest'); // Highlight the trigger
                        break;
                    case 'open_profile':
                        this.talk(true, "📍 **MISSION 1: Identity**\n\nYour Goal: Update your Avatar & Class to stabilize your Aura.", "guide");
                        break;
                }
            }, 1500);
        }
    }

    // --- COMMAND CORTEX (The Brain) ---
    findAnswer(query) {
        const q = query.toLowerCase();
        
        // 1. ADMIN COMMANDS (Imperial Root Access)
        // In a real app, verify User ID. Here we assume Console Access.
        if(q.startsWith('/')) {
            if(q === '/ignite-reboot') {
                return { text: "⚡ SYSTEM FLUSH INITIATED. Validating 24h cycle... (Mock)", action: () => alert("System Reboot Simulated.") };
            }
            if(q === '/nexus-shield') {
                return { text: "🛡️ SHIELDS UP. Maintenance Mode engaged.", action: () => document.body.classList.add('grayscale') };
            }
            if(q.startsWith('/grant-karma')) {
                 if(window.Gamification) window.Gamification.addKarma(100, "Imperial Decree");
                 return { text: "Karma injected by Imperial Decree." };
            }
            if(q === '/summon-flowee') {
                this.restartTutorial();
                return { text: "Re-calibrating Path of the Initiate..." };
            }
            if(q === '/reset') {
                 this.talk(true, "⚠️ INITIATING SYSTEM WIPE...", "error");
                 setTimeout(() => {
                     if(window.Simulation) window.Simulation.reset();
                     else { 
                        localStorage.clear(); 
                        localStorage.removeItem('cdf_tour_completed'); // Ensure clean slate
                        location.reload(); 
                     }
                 }, 1000);
                 return { text: "Purging Local Reality..." };
            }
            if(q.startsWith('/inspect-vault')) {
                 return { text: "Accessing User Vault... [Access Denied: Requires Key]" };
            }
            if(q === '/wa-ping' || q === '/portal-status' || q === '/sync-full' || q === '/cloud-pulse') {
                return { text: "Acknowledged. Accessing Agentic Bridge protocols..." };
            }
            // If strictly a slash command but not found above, fall through to intentMap OR return error? 
            // Better to fall through so intentMap can catch it if defined there.
            // return { text: "Command not recognized, Captain." }; 
        }

        // 2. SEMANTIC NAVIGATION (Fuzzy Logic)
        
        // REDIRECTION MATRIX
        const redirectionMatrix = [
            // WORLD PROJECTION (The Atlas)
            { keys: ["map", "atlas", "gps", "world", "location", "where"], url: "pages/quest_map.html", msg: "Accessing Satellite Feed... Loading The Atlas." },
            
            // MEMORY SEQUENCES (The Board)
            { keys: ["quest", "mission", "task", "board", "job", "todo", "log"], url: "pages/quest_board.html", msg: "Decrypting Memory Blocks... Opening Bounty Board." },
            
            // BROTHERHOOD (The Hall)
            { keys: ["rank", "leaderboard", "hall", "legend", "score", "top", "xp", "level"], url: "pages/hall_of_legends.html", msg: "Connecting to Animus Network... Accessing Hall of Legends." },
            
            // PROFILE / IDENTITY
            { keys: ["profile", "me", "avatar", "class", "stats"], url: "pages/dashboard.html", msg: "Retinal Scan Initiated... Loading Profile." },
            
            // MARKET / BAZAAR
            { keys: ["shop", "buy", "sell", "market", "bazaar", "trade"], url: "pages/marketplace.html", msg: "Entering Economic Zone... Opening Bazaar." },
            
            // ARENA / BATTLE
            { keys: ["fight", "battle", "arena", "pvp", "duel"], url: "pages/arena.html", msg: "Weapons Check... Entering The Arena." },
            
            // SANCTUARY REPLIES
            { keys: ["sanctuary", "hub", "grotto", "center"], url: "pages/vision_sanctuary.html", msg: "Returning to the Root. Warping to the Sanctuary." },
            { keys: ["portfolio", "voyage", "creations", "art"], url: "pages/voyage_portfolio.html", msg: "Accessing the archives... Opening the Voyage Portfolio." },
            { keys: ["oasis", "pipeline", "agent dashboard", "flowee config"], url: "pages/vision_oasis.html", msg: "Entering the AI Forge... Welcome to the Vision Oasis." },
            { keys: ["cave", "memory", "garden", "cinema"], url: "pages/memory_cave.html", msg: "Quiet your mind... Descending into the Memory Cave." }
        ];

        // Kitchen / Taste World shortcuts
        if (q.includes('kds') || q.includes('kitchen command') || q.includes('delivery board')) {
            const lang = this.getLang();
            return {
                text: lang === 'en'
                    ? 'KDS columns: NEW → tap ✓ to Confirm → Cooking → Ready → Picked up. Swipe for Menu, Brand, QR & Crew comms.'
                    : lang === 'pt'
                        ? 'KDS: NOVO → Confirmar → Cozinhar → Pronto → Recolhido. Desliza para Menu, Brand, QR & Crew.'
                        : 'KDS-Spalten: NEW → ✓ bestätigen → Kochen → Bereit → Abgeholt. Swipe für Menü, Brand, QR & Crew.',
            };
        }
        if (q.includes('stuck') || q.includes('new') && (q.includes('order') || q.includes('bestell'))) {
            const lang = this.getLang();
            return {
                text: lang === 'de'
                    ? 'Wenn Bestätigen nicht springt: Status wird sofort lokal gespeichert und dann in die Cloud synchronisiert. Als Kitchen-Owner einloggen oder Ops-Code prüfen.'
                    : lang === 'pt'
                        ? 'Se Confirmar não mover o cartão: o estado grava localmente primeiro, depois sincroniza na cloud. Verifica login ou código AKWABA-CREW.'
                        : 'If Confirm does not move the card: status saves locally first, then cloud-sync. Check you are signed in as kitchen owner or crew with ops code AKWABA-CREW in env.',
            };
        }

        // 2.5 SPECIAL: CONFIRMATIONS (If Brain is waiting)
        const isConfirm = ["yes", "ja", "ok", "sync", "confirm", "yep", "do it"].some(k => q === k);
        const isDeny = ["no", "nein", "abort", "stop", "cancel"].some(k => q === k);

        if (window.AgenticBrain?.syncPending) {
            if (isConfirm) return { text: "Protocol Authorized. Synchronizing..." };
            if (isDeny) return { text: "Synchronisation aborted." };
        }
        for(const entry of redirectionMatrix) {
            if(entry.keys.some(k => q.includes(k))) {
                return { 
                    text: entry.msg, 
                    link: entry.url // Triggers startCountdownAndNavigate
                };
            }
        }

        const intentMap = [
            // BANK DETAILS / MONEY TRIGGER
            { triggers: ["bank", "iban", "paypal", "revolut", "payment", "send money"], text: "Let's update your payment details. Please type your IBAN, PayPal, or Revolut tag below and I will store it in your profile.", action: () => {
                this.waitingForPaymentDetails = true;
            }},

            // CLOUD PULSE (Agentic Bridge)
            { triggers: ["cloud-pulse", "cloud pulse", "sync cloud", "pulse"], text: "Initiating Cloud Pulse Handshake...", action: () => {
                if(window.AgenticBrain) window.AgenticBrain.requestSyncConsent();
                else this.talk(true, "Agentic Brain not detected. Bridge is offline.", "error");
            }},

            // NEW: MANUAL OVERRIDES (User Request) - TOP PRIORITY
            { triggers: ["next mission", "start mission 2", "start quest", "skip", "next", "continue", "proceed", "go on"], text: "Advancing to the next cycle...", action: () => {
                const current = parseInt(localStorage.getItem('cdf_tutorial_step') || 0);
                const nextStep = current + 1;
                // Cap at max steps (5)
                if(nextStep < 5) {
                    if(window.Helper) window.Helper.saveData('cdf_tutorial_step', nextStep.toString());
                    else localStorage.setItem('cdf_tutorial_step', nextStep.toString());
                    this.tutorialState.step = nextStep;
                    this.advanceTutorial(); 
                } else {
                    this.endTutorial();
                }
            }},

            // NEW: QUEST MAKER (3s Countdown)
            { triggers: ["create quest", "make quest", "new quest", "build quest", "add quest", "quest creator", "quest page"], text: "Initiating Quest Architect Protocol...", action: () => {
                let count = 3;
                this.talk(true, `Initializing Quest Maker... (${count}s)`);
                const timer = setInterval(() => {
                    count--;
                    if(count > 0) {
                        this.talk(true, `Initializing Quest Maker... (${count}s)`);
                    } else {
                        clearInterval(timer);
                        this.talk(true, "PROTOCOL ACTIVE! Warping to Quest Nexus.");
                        
                        // Path Logic
                        const isPages = window.location.pathname.includes('/pages/');
                        const target = isPages ? 'quest-create.html' : 'pages/quest-create.html';
                        window.location.href = target;
                    }
                }, 1000);
            }},

            // BETA PHASE 7 COMMANDS
            { triggers: ["system override"], text: "⚠️ SECURITY PROTOCOL ENGAGED. AUTHENTICATING...", action: () => {
                // Mock Auth
                setTimeout(() => {
                    this.talk(true, "ACCESS GRANTED. BROADCASTING EMERGENCY SIGNAL.", "error");
                    if(window.Pusher) window.Pusher.handleEmergencyOverride("SYSTEM OVERRIDE: THE SIEGE HAS BEGUN. 🚨");
                }, 1500);
            }},
            { triggers: ["sync vault", "refresh"], text: "Syncing with the Imperial Treasury...", action: () => {
                this.talk(true, "Vault Synced. XP and Badges updated.", "success");
                if(window.Gamification) window.Gamification.checkLevelUp();
            }},
            { triggers: ["map pulse", "show map", "lisbon"], text: "Scanning Lisbon's horizons... Here is where the Flow is strongest.", link: "vault_space.html" },
            { triggers: ["vibe check", "frequency"], text: "Adjusting your frequency. Tao vs. Energy?", action: () => {
                if(confirm("Flowee: Switch Vibe? [OK] for One Piece Energy, [Cancel] for Tao Flow.")) {
                    document.body.classList.remove('theme-tao'); document.body.classList.add('theme-energy');
                    this.talk(true, "Energy Frequency set to MAX!", "xp");
                } else {
                    document.body.classList.remove('theme-energy'); document.body.classList.add('theme-tao');
                    this.talk(true, "Tao Frequency stabilized.", "karma");
                }
            }},
            { triggers: ["log entry", "record", "history"], text: "Recording history... What legendary feat did you achieve?", link: "vault_event.html" },
            { triggers: ["order fuel", "hungry", "food", "kitchen"], text: "AkwabaLX is live at Secret Garden! Open the kitchen menu?", link: "akwaba_kitchen.html" },
            { triggers: ["call captain", "help captain", "sos"], text: "Sending a flare to the bridge. Captain Hope will be alerted.", action: () => {
                this.talk(true, "Flare Sent! The Captain is monitoring the sector.", "success");
                // Mock Backend Call
                console.log("[Flowee] SOS Sent to Dashboard.");
            }},
            { triggers: ["bug", "report", "broken", "error"], text: "Acknowledged. Logged in the Bug Tracker. +100 EP for your vigilance.", action: () => { if(window.Gamification) window.Gamification.addXP(100, "Bug Hunter"); } },

            // QUESTS - SMART RELOAD AVOIDANCE
            { triggers: ["quest", "mission", "task", "scroll", "adventure", "job", "to-do"], text: "Accessing Quest Log...", action: () => {
                if(window.location.pathname.includes('dashboard.html')) {
                    if(window.ApexNexus) window.ApexNexus.toggleQuestLog();
                } else {
                    window.location.href = "dashboard.html?action=open_quest";
                }
            }},
            // MARKET
            { triggers: ["shop", "bazaar", "buy", "sell", "market", "trade", "price"], text: "Setting sail for the Merchants' Quay.", link: "marketplace.html" },
            // IDENTITY
            { triggers: ["profile", "me", "level", "rank", "badge", "xp", "identity", "nen", "aura"], text: "Reflecting your Aura...", action: () => {
                 if(window.location.pathname.includes('dashboard.html')) {
                    if(window.ApexNexus) window.ApexNexus.openProfile();
                } else {
                    window.location.href = "dashboard.html?action=open_profile";
                }
            }},
            // KNOWLEDGE
            { triggers: ["knowledge", "learn", "wiki", "fact", "study", "academy", "library"], text: "Opening the Great Library of Flow.", link: "library.html" },
            // BATTLE
            { triggers: ["fight", "battle", "war", "arena", "duel", "tournament"], text: "To the Arena! Glory awaits.", link: "battle.html?tab=arena" },
            // NEW: COLLECTOR BAG
            { triggers: ["bag", "inventory", "vault", "collection", "item", "pouch"], text: "Rummaging through your Collector's Bag...", action: () => this.unlockPouch() },
            // NEW: FUSION FORGE
            { triggers: ["fuse", "craft", "combine", "forge"], text: "The Fusion Forge is hot! (Feature coming in Beta Phase 2)", link: "marketplace.html" },
            
            // SYSTEM RESET (Beta Tool to clear Simulation)
            { triggers: ["/reset", "system reset", "clear data"], text: "⚠️ INITIATING SYSTEM WIPE...", action: () => {
                this.talk(true, "Purging Local Reality... See you on the other side.", "error");
                setTimeout(() => {
                    if(window.Simulation) window.Simulation.reset();
                    else { localStorage.clear(); location.reload(); }
                }, 2000);
            }},

            // SECRET COMMAND
            { triggers: ["will of d"], text: "...", action: () => {
                this.talk(true, "The Will lives on. You seek the roots to find the fruit.", "karma");
                setTimeout(() => {
                    this.talk(true, "Badge Unlocked: 'Ancient Voice'. +150 EP.", "xp");
                    if(window.Simulation) {
                        window.Simulation.unlockBadge('badge-ancient-voice');
                        window.Simulation.addXP(150);
                    }
                }, 3000);
            }},

            // PRICING / SUPPORT
            { triggers: ["price", "cost", "plan", "subscribe", "upgrade", "pact"], text: "Opening the Sacred Offerings...", action: () => {
                // Check if Modal exists, if not load it dynamically (or assuming included)
                // For this implementation, we assume the modal script is loaded or we redirect.
                // Since user asked for "Best possibility", a modal is best.
                // We will simulate the function call.
                if(window.toggleSacredModal) {
                    window.toggleSacredModal(true);
                } else {
                    // Fallback
                    this.navigate('pricing.html');
                }
            }},
            
            // SYSTEM RESET (Beta Tool to clear Simulation)
            { triggers: ["/reset", "system reset", "clear data"], text: "⚠️ INITIATING SYSTEM WIPE...", action: () => {
                this.talk(true, "Purging Local Reality... See you on the other side.", "error");
                setTimeout(() => {
                    if(window.Simulation) window.Simulation.reset();
                    else { 
                        localStorage.clear(); 
                        localStorage.removeItem('cdf_tour_completed'); 
                        location.reload(); 
                    }
                }, 2000);
            }},

            // UTILITY
            { triggers: ["stuck", "help", "lost", "guide", "tutorial", "tour"], text: "Resetting Navigation Systems. Follow the Light.", action: () => {
                const path = window.location.pathname.split('/').pop() || 'index.html';
                localStorage.removeItem(`cdf_tour_done_${path}`);
                this.checkPageTutorial();
            }},
            { triggers: ["reboot", "update", "when"], text: "The System Validates points every 24h at Midnight (Zen Time)." }
        ];

        // 3. SALES LOGIC (The "Pact" Nudge)
        // Hook into Quest Completion or High Activity
        window.addEventListener('cdf-quest-completed', (e) => {
             const xp = window.Gamification ? window.Gamification.getXP() : 0;
             if(xp > 500 && Math.random() > 0.7) { // 30% chance after 500XP
                 setTimeout(() => {
                     this.talk(true, "You have the Will... do you have the Vessel? Check the Sacred Offerings.", "guide");
                     setTimeout(() => {
                         if(confirm("Flowee: View the Captain's Pact?")) {
                             if(window.toggleSacredModal) window.toggleSacredModal(true);
                         }
                     }, 3000);
                 }, 2000);
             }
        });


        // 3. AMBIGUITY CHECK
        if(q.includes("buy") && q.includes("quest")) {
             return { text: "A double-edged request! do you want to **Buy** an Item at the Bazaar, or **Accept** a Quest?" };
        }

        // 4. EXECUTE MATCH
        for(let item of intentMap) {
            if(item.triggers.some(t => q.includes(t))) {
                if(item.action && !item.link) return { text: item.text, action: item.action }; // Prioritize pure action
                return { text: item.text, link: item.link, action: item.action };
            }
        }

        // 5. EXISTING KNOWLEDGE BASE FALLBACK
        for(let entry of this.knowledgeBase) {
            if (!entry.keywords) continue;
            for(let key of entry.keywords) {
                if(q.includes(key)) {
                    return { text: entry.answer, link: entry.deep_link };
                }
            }
        }

        if (window.AgenticBrain?.syncPending) return { text: "Awaiting confirmation for the Cloud Pulse (Yes/No)..." };
        return { text: this.t('fallback'), link: null };
    }

    restartTutorial() {
        localStorage.removeItem('cdf_tour_started');
        localStorage.removeItem('cdf_tour_completed');
        if(window.Helper) {
             window.Helper.saveData('cdf_tutorial_step', '0');
        } else {
             localStorage.setItem('cdf_tutorial_step', '0');
        }
        window.location.href = 'dashboard.html';
    }

    startTutorial() {
        this.initiateTutorialProtocol();
    }

    // --- PATH OF THE INITIATE (TUTORIAL PROTOCOL) ---
    initiateTutorialProtocol() {
        if(localStorage.getItem('cdf_tour_completed') === 'true') {
            this.checkPouchStatus();
            return;
        }

        console.log("[Flowee] Initiating 'Path of the Initiate'...");
        this.tutorialState = { step: 0, active: true };
        
        // ... (Tutorial Steps Definition - Keeping existing structure) ...
        // Note: We need to make sure we don't overwrite the steps array if we are just patching methods.
        // But since this is a clean replacement of init/logic, we should ensure the tutorialSteps definition is reachable or moved to constructor if possible, 
        // OR we just ensure this method has the steps. The prior edit put steps in initiateTutorialProtocol.
        // I will assume the previous tool call set the steps correctly in initiateTutorialProtocol.
        // If I replace initiateTutorialProtocol I must include the steps array again.
        
        this.defineTutorialSteps(); // Extracted to method to keep this clean
        
        // Show Progress Bar
        const bar = document.getElementById('initiate-progress-container');
        if(bar) bar.classList.remove('opacity-0');

        this.advanceTutorial();
    }

    defineTutorialSteps() {
         this.tutorialSteps = [
            // PHASE 1: TRINITY WALKTHROUGH
            {
                id: "step_1_identity",
                title: "Etappe 1: Awakening (Vibe-Check)",
                intro: "Your Aura is unstable, Drifter! We must anchor your Identity.",
                target: "#user-greeting", 
                action: "Click your **Profile Avatar**, Update your details, and click **Confirm Updates**.",
                triggerEvent: "cdf-profile-updated", 
                reward: 300, 
                progress: 10,
                askToContinue: "Flowee: Identity stable. Ready to explore the Trinity?",
                onStart: () => {
                   if(window.ApexNexus) setTimeout(() => window.ApexNexus.openProfile(), 1500);
                }
            },
            {
                id: "step_2_knowledge",
                title: "Etappe 2: The Great Library",
                intro: "To master the Flow, you must understand the Trinity. Visit the Library.",
                target: "a[href='library.html']", 
                action: "Navigate to the **Library** and learn the lore.", 
                triggerEvent: "cdf-library-visit", 
                reward: 100, 
                progress: 30, 
                redirect: 'library.html?tutorial=true'
            },
            {
                id: "step_3_map",
                title: "Etappe 3: Resonance Map",
                intro: "Lisbon is a map of treasures. Let's find the Pulse.",
                target: "a[href='vault_space.html']", 
                action: "Visit the **Space** (Map) and click a Pin.", 
                triggerEvent: "cdf-map-visit", 
                reward: 100, 
                progress: 50, 
                redirect: 'vault_space.html?tutorial=true'
            },
            // MISSING LINK: BAZAAR
            {
                id: "step_3_bazaar",
                title: "Etappe 3.5: The Bazaar",
                intro: "Your XP is currency. Witness the Treasury.",
                target: "a[href='marketplace.html']",
                action: "Visit the **Marketplace** to see what you can earn.",
                triggerEvent: "cdf-market-visit",
                reward: 50,
                progress: 60,
                redirect: 'marketplace.html?tutorial=true'
            },
            // PHASE 2: ARENA & CREATION
            {
                id: "step_4_quest",
                title: "Etappe 4: The First Quest",
                intro: "You are Crew now. Leave your mark. Create a Quest.",
                target: "#btn-new-quest", 
                action: "Type **create quest** or click the button to draft your mission.",
                triggerEvent: "cdf-quest-created", 
                reward: 250, 
                progress: 70,
                onStart: () => {
                     this.talk(true, "Type 'create quest' in the chat to begin.", "guide");
                }
            },
            // PHASE 3: NAKAMA CONNECT
            {
                id: "step_5_nakama",
                title: "Etappe 5: The Nakama Bond",
                intro: "A Captain needs a Crew. Find a partner.",
                target: "#flowee-chat-log", 
                action: "Open the Chat and say 'Hello World' to the Global Network.",
                triggerEvent: "cdf-chat-message",
                reward: 150, 
                progress: 90
            },
            // FINALE
            {
                id: "step_6_finale",
                title: "Etappe 6: The Ruxx Horizon",
                intro: "The Tournament awaits. You are now an Enrolled Flow Creator.",
                target: "#sector-colosseum", 
                action: "Visit the Arena to see the countdown.",
                triggerEvent: "cdf-arena-visit",
                reward: 500, 
                progress: 100,
                redirect: 'vault_event.html?tutorial=true&section=arena'
            }
        ];
    }

    advanceTutorial() {
        if(!this.tutorialState.active) {
            this.initiateTutorialProtocol(); // Auto-activate if logic calls advance
        }
        
        // ... (rest of advanceTutorial logic) ...
        let stepIndex = parseInt(localStorage.getItem('cdf_tutorial_step') || 0);
        if(stepIndex >= this.tutorialSteps.length) {
            this.endTutorial();
            return;
        }

        const step = this.tutorialSteps[stepIndex];
        this.tutorialState.step = stepIndex;

        console.log(`[Flowee] Path of Initiate: ${step.title}`);

        // Update Progress UI
        const barFill = document.getElementById('initiate-bar');
        const barText = document.getElementById('initiate-step-text');
        const instr = document.getElementById('initiate-instruction');
        
        if(barFill) {
            barFill.style.width = `${step.progress}%`;
            barText.innerText = `${stepIndex + 1}/5`;
            instr.innerText = step.action;
        }

        // Action
        setTimeout(() => {
            if(window.location.pathname.includes('dashboard.html')) {
                 this.talk(true, step.intro);
                 if(step.target) this.highlight(step.target);
            }
            // Redirect Logic
            if(step.redirect && !window.location.href.includes(step.redirect.split('?')[0])) {
                setTimeout(() => {
                    if(confirm(`Flowee: Warp to ${step.title.split(':')[1]}?`)) {
                        window.location.href = step.redirect;
                    }
                }, 2000);
            }
            // Exec onStart
            if(step.onStart) step.onStart();
        }, 1000);

        // State Check Logic for current step
        this.overrideStepLogic(step, stepIndex);
    }
    
    // ... (overrideStepLogic remains) ...

    endTutorial() {
        this.talk(true, "PATH COMPLETE! You are now a **Level 3 Flow Master**.");
        this.tutorialState.active = false;
        
        // Hide Bar
        const bar = document.getElementById('initiate-progress-container');
        if(bar) bar.classList.add('opacity-0');
        
        localStorage.setItem('cdf_tour_completed', 'true'); // New Flag
        
        // UNLOCK POUCH
        this.unlockPouch();
        
        // Confetti
        if(window.Gamification) window.Gamification.triggerLevelUp(3);
    }
    
    unlockPouch() {
        const pouch = document.getElementById('collectors-pouch');
        if(pouch) {
            pouch.classList.remove('opacity-50', 'grayscale', 'cursor-not-allowed');
            pouch.classList.add('animate-bounce', 'cursor-pointer');
            pouch.querySelector('.bg-red-500').remove(); // Remove lock
            pouch.onclick = () => {
                alert("Collector's Pouch: \n- 1x Initiate Certificate\n- 1x Starter Badge\n(More features coming soon)");
            };
            this.talk(true, "You have unlocked the **Collector's Pouch**! Check your rewards.");
        }
    }
    
    checkPouchStatus() {
        const lvl = window.Gamification ? window.Gamification.getLevel() : 1;
        if(lvl >= 3) {
            this.unlockPouch();
        } else {
             const pouch = document.getElementById('collectors-pouch');
             if(pouch) {
                 this.talk(true, "Reach Level 3 to unlock this Pouch!");
                 pouch.classList.add('animate-shake');
                 setTimeout(() => pouch.classList.remove('animate-shake'), 500);
             }
        }
    }

    // --- LEVEL UP CEREMONY ---
    levelUpCeremony(level) {
        this.applyMode('triumph');
        this.element.classList.add('animate-spin-slow');
        
        const msg = `RISING TIDE! You have reached Level ${level}! The Network expands.`;
        this.talk(true, msg);
        
        if(window.Pusher) window.Pusher.showToast(msg, 'success');
        
        // Visual Rain (if particles exist)
        if(window.createParticles) window.createParticles(50);
        
        setTimeout(() => {
            this.element.classList.remove('animate-spin-slow');
            this.applyMode('guide');
        }, 5000);
    }
    
    // --- CHRONOS INTERFACE ---
    
    setBufferMode() {
        this.applyMode('buffer');
        this.talk(true, "Submission received! Analyzing data... System Validation pending.");
    }
    
    setTriumphMode(rp, orga) {
        this.applyMode('triumph');
        this.talk(true, `Reboot complete! Your contribution has been rewarded. +${rp} RP | +${orga} Orga Points.`);
    }
    // --- DIRECT TRIGGERS ---
    handleProfileUpdate() {
        console.log("[Flowee] Handling Profile Update Signal...");
        
        // If tutorial is active and we are on Step 0 (Identity)
        if(this.tutorialState.active && this.tutorialState.step === 0) {
             const step = this.tutorialSteps[0];
             
             // Manually finish step 0
             if(window.Gamification) window.Gamification.addXP(step.reward, step.title);
             localStorage.setItem('cdf_tutorial_step', '1'); // Move to next
             
             this.talk(true, `Splendid! Profile Calibrated. +${step.reward} XP.`, "success");
             this.applyMode('triumph');
             
             setTimeout(() => {
                this.applyMode('guide');
                // Ask to continue
                setTimeout(() => {
                     if(confirm(step.askToContinue)) {
                         this.advanceTutorial();
                     }
                }, 1000);
             }, 3000);
        } else {
            this.talk(true, "Profile updated. Looking good, Creator!", "success");
        }
    }

    // --- COMMUNITY TUTORIAL SPECIFIC LOGIC ---
    checkCommunityTutorial() {
        const step = parseInt(localStorage.getItem('cdf_connection_tour_step') || 1);
        if(step > 4) return; // Done or Dimissed

        const currentTask = this.communitySteps.find(s => s.id === step);
        const path = window.location.pathname.split('/').pop() || 'index.html';

        if(currentTask && path.includes(currentTask.page)) {
            // Show dismiss button if chat is rendered
            const dismissBtn = document.getElementById('flowee-dismiss-btn');
            if(dismissBtn) dismissBtn.style.display = 'block';

            setTimeout(() => {
                this.talk(true, `[CONNECTION GUIDE ${step}/4] ${currentTask.text}`, "guide");
                if (currentTask.target) {
                    let attempts = 0;
                    const findTarget = setInterval(() => {
                        attempts++;
                        let el = null;
                        
                        // Handle onClick attribute string matching target more gracefully
                        if(currentTask.target.includes('onclick=')) {
                             // Simple fallback for tricky targets
                             el = document.querySelector('button') // not perfect but just for tutorial glow
                        } else {
                             el = document.querySelector(currentTask.target);
                        }

                        if (el || attempts > 5) {
                            clearInterval(findTarget);
                            if (el) this.highlight(currentTask.target);
                        }
                    }, 1000);
                }

                // Auto-advance step 3 to 4 if they reach chat.html
                if(step === 3) {
                     setTimeout(() => {
                          localStorage.setItem('cdf_connection_tour_step', 4);
                          this.checkCommunityTutorial(); // trigger next hint
                     }, 4000);
                }
            }, 2000);
        }
    }

    dismissCommunityTutorial(isCompleted = false) {
         localStorage.setItem('cdf_connection_tour_step', 5); // mark done
         const dismissBtn = document.getElementById('flowee-dismiss-btn');
         if(dismissBtn) dismissBtn.style.display = 'none';

         if(window.Simulation && typeof window.Simulation.addXP === 'function') {
             window.Simulation.addXP(50);
         } else {
             const xp = parseInt(localStorage.getItem('cdf_xp')) || 0;
             localStorage.setItem('cdf_xp', xp + 50);
             if(window.Pusher) window.Pusher.showToast('SYSTEM: +50 EXP ACCUMULATED', 'xp');
         }
         
         if(!isCompleted) this.talk(true, "Training wheels off. Welcome to the Deep Flow.", "guide");
    }

    startAuthFlow(isRegister) {
        if(!this.bubble) return;
        
        // Ensure Flowee is visible
        if(this.talkTimeout) clearTimeout(this.talkTimeout);
        
        const contentDiv = this.bubble.querySelector('.flowee-text-content');
        const optionsDiv = this.bubble.querySelector('.flowee-options-container');
        
        // Initial options
        this.talk(true, "How would you like to identify your Frequency?", "guide", [
            { label: "Email / Signature", action: () => { this.showEmailAuthForm(isRegister); } },
            { label: "Google (OAuth)", action: () => { 
                if(window.handleOAuthLogin) window.handleOAuthLogin('google'); 
                else alert('OAuth Offline'); 
            }},
            { label: "Discord (OAuth)", action: () => { 
                if(window.handleOAuthLogin) window.handleOAuthLogin('discord'); 
                else alert('OAuth Offline'); 
            }}
        ]);
    }

    showEmailAuthForm(isRegister) {
        if(!this.bubble) return;
        if(this.talkTimeout) clearTimeout(this.talkTimeout);
        
        const contentDiv = this.bubble.querySelector('.flowee-text-content');
        const optionsDiv = this.bubble.querySelector('.flowee-options-container');
        
        let formHtml = '';
        if (isRegister) {
            formHtml = `
                <div style="font-family: 'Space Mono', monospace; text-align: left; animation: scale-in 0.3s ease-out;">
                    <h3 style="color: #00ffcc; margin-bottom: 10px; font-weight: bold; text-transform: uppercase; font-size: 14px;">Register Signature</h3>
                    <form id="flowee-auth-form">
                        <input type="text" id="flowee-reg-username" placeholder="Username (Your Identity)" style="width: 100%; padding: 8px; margin-bottom: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,204,0.3); color: white; border-radius: 4px;" required>
                        <input type="email" id="flowee-reg-email" placeholder="Email Frequency" style="width: 100%; padding: 8px; margin-bottom: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,204,0.3); color: white; border-radius: 4px;" required>
                        <input type="password" id="flowee-reg-password" placeholder="Passcode (Secret)" style="width: 100%; padding: 8px; margin-bottom: 12px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,204,0.3); color: white; border-radius: 4px;" required>
                        <button type="submit" style="width: 100%; padding: 10px; background: rgba(0,255,204,0.2); color: #00ffcc; font-weight: bold; border-radius: 4px; border: 1px solid #00ffcc; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;">Link Identity</button>
                    </form>
                    <button type="button" onclick="window.Flowee.showEmailAuthForm(false)" style="margin-top: 10px; font-size: 10px; color: #aaa; background: none; border: none; cursor: pointer; text-decoration: underline; width: 100%; text-align: center;">Already have an account? Login here</button>
                </div>
            `;
        } else {
            formHtml = `
                <div style="font-family: 'Space Mono', monospace; text-align: left; animation: scale-in 0.3s ease-out;">
                    <h3 style="color: #00ffcc; margin-bottom: 10px; font-weight: bold; text-transform: uppercase; font-size: 14px;">Verify Signature</h3>
                    <form id="flowee-auth-form">
                        <input type="email" id="flowee-login-email" placeholder="Email Frequency" style="width: 100%; padding: 8px; margin-bottom: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,204,0.3); color: white; border-radius: 4px;" required>
                        <input type="password" id="flowee-login-password" placeholder="Passcode (Secret)" style="width: 100%; padding: 8px; margin-bottom: 12px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,204,0.3); color: white; border-radius: 4px;" required>
                        <button type="submit" style="width: 100%; padding: 10px; background: rgba(0,255,204,0.2); color: #00ffcc; font-weight: bold; border-radius: 4px; border: 1px solid #00ffcc; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;">Access Orbit</button>
                    </form>
                    <button type="button" onclick="window.Flowee.showEmailAuthForm(true)" style="margin-top: 10px; font-size: 10px; color: #aaa; background: none; border: none; cursor: pointer; text-decoration: underline; width: 100%; text-align: center;">Need an account? Register here</button>
                </div>
            `;
        }
        
        contentDiv.innerHTML = formHtml;
        optionsDiv.innerHTML = '';
        
        const form = document.getElementById('flowee-auth-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.innerText = "Processing Resonance...";
            btn.style.opacity = '0.5';
            btn.disabled = true;
            
            if (isRegister) {
                const u = document.getElementById('flowee-reg-username').value;
                const em = document.getElementById('flowee-reg-email').value;
                const pw = document.getElementById('flowee-reg-password').value;
                if(window.handleRegister) window.handleRegister(em, pw, u);
                else { alert("Auth System Offline."); btn.innerText = "Link Identity"; btn.disabled = false; btn.style.opacity = '1'; }
            } else {
                const em = document.getElementById('flowee-login-email').value;
                const pw = document.getElementById('flowee-login-password').value;
                if(window.handleLogin) window.handleLogin(em, pw);
                else { alert("Auth System Offline."); btn.innerText = "Access Orbit"; btn.disabled = false; btn.style.opacity = '1'; }
            }
        };
    }

}

// Initialize
window.Flowee = new FloweeAgent();
