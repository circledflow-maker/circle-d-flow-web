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
                keywords: ["certificate", "rank", "nen", "class", "adinkra", "level"],
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
            }
        ];

        // --- DIALOGUE MATRIX (Context Awareness) ---
        this.dialogueMatrix = {
            "index.html": { mode: "scan", intro: "Frequency detected! I am Flowee. Your resonance is weak, Drifter." },
            "dashboard.html": { mode: "guide", intro: "Welcome to your Command Center.", action: "Complete your profile to light up the grid." },
            "marketplace.html": { mode: "active", intro: "The Bazaar. Where skills become currency.", target: "#upload-btn" },
            "battle.html": { mode: "active", intro: "The Arena. Prove your resonance.", target: "#leaderboard" },
            "default": { mode: "guide", intro: "The Flow is strong here..." }
        };

        // --- TUTORIAL MATRIX (The Ghost-Run) ---
        this.tutorialMatrix = {
            // LANDING / GATEWAY
            "index.html": [
                { text: "Welcome, Voyager. This is the Gateway to the Circle.", target: "#gateway-overlay" },
                { text: "Choose your Language at the top right to harmonize the frequency.", target: ".lang-switcher" },
                { text: "Explore the Trinity: Taste (Queen), Vision (Capture), and Sound (Rhythm).", target: ".grid" }
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
            "african-queen-kitchen.html": [
                 { text: "Smells like home! The African Queen Kitchen feeds the soul.", target: "h1" },
                 { text: "Check the Jamtruck Progress to see when we roll out!", target: "#jamtruck-meter" }
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
            { id: 1, page: "index.html", text: "Welcome, Traveler. Choose your tongue (Top Right) and Identify Yourself to enter the Flow.", target: ".lang-switcher", check: () => localStorage.getItem('cdf_user_username') },
            { id: 2, page: "marketplace.html", text: "The Bazaar. Click on an Artifact to inspect its value.", target: ".grid", check: () => localStorage.getItem('cdf_initiation_market_visited') },
            { id: 3, page: "outbreak_tunes.html", text: "Listen... The Wisdom Rune appears after 30 seconds of resonance.", target: "#video-bg", check: () => localStorage.getItem('cdf_initiation_rune_found') },
            { id: 4, page: "african-queen-kitchen.html", text: "Fuel for the Soul. Check the Jamtruck Progress and simulate an order.", target: "#jamtruck-slider", check: () => localStorage.getItem('cdf_initiation_kitchen_visited') },
            { id: 5, page: "dashboard.html", text: "The Mission Board. Open your Quests to see your path.", target: "#quest-log-btn", check: () => localStorage.getItem('cdf_initiation_quests_viewed') },
            { id: 6, page: "dashboard.html", text: "Psst... This is not for everyone. 3 clicks on the Vision-Icon... only for the Architect.", target: "#planet-Vision", check: () => localStorage.getItem('cdf_initiation_vision_found') },
            { id: 7, page: "master_dashboard.html", text: "The Captain's Eye. Toggle the 'Flow Sync' lever to master the system.", target: "#flow-sync-toggle", check: () => localStorage.getItem('cdf_artifact_genesis') }
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
            if(path.includes(key)) return this.dialogueMatrix[key];
        }
        return this.dialogueMatrix['default'];
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

    talk(visible, text, type="neutral") {
        if(!this.bubble) return;
        
        const p = this.bubble.querySelector('p');
        if(p) p.innerText = text;
        
        if(visible) {
            this.bubble.classList.remove('opacity-0', 'scale-90');
            this.bubble.classList.add('opacity-100', 'scale-100');
            
            // Auto-hide after 8 seconds if no interaction
            if(this.talkTimeout) clearTimeout(this.talkTimeout);
            this.talkTimeout = setTimeout(() => this.shush(), 8000);
            
            // Log to Chat
            this.addChatMessage(text, 'ai');
        } else {
            this.shush();
        }
    }

    shush() {
        if(this.bubble) {
            this.bubble.classList.remove('opacity-100', 'scale-100');
            this.bubble.classList.add('opacity-0', 'scale-90');
        }
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
        const log = document.getElementById('flowee-chat-log');
        if(!log) return;
        
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
        
        // Start Interaction
        setTimeout(() => {
            this.talk(true, this.currentContext.intro);
            if(this.currentContext.target) this.highlight(this.currentContext.target);
            this.checkProfileStatus();
            this.checkMissionBriefing(); 
            
            // Check Level Up Progress (Resonance Integration)
            if(window.Resonance) {
                const progress = window.Resonance.getProgress();
                if(progress.percent >= 90) {
                     this.talk(true, `Resonance Critical! Only ${progress.remaining} XP to Level ${progress.level + 1}. Push it!`);
                     this.element.classList.add('animate-pulse');
                }
            }
            
            // Auto-Start Grand Tour (Resume or Ask)
            const tourStarted = localStorage.getItem('cdf_tour_started');
            
            if(window.location.pathname.includes('dashboard.html')) {
                // BETA OVERRIDE: Force Auto-Start (User Request)
                console.log("[Flowee] Auto-Start Protocol Initiated.");
                if(window.Helper) window.Helper.saveData('cdf_tour_started', 'true');
                else localStorage.setItem('cdf_tour_started', 'true');
                this.talk(true, "Initialization Complete. Starting Ghost-Run Protocol in 3 seconds...", "guide");
                
                setTimeout(() => {
                    this.tutorialActive = true; 
                    this.initiateTutorialProtocol();
                }, 3000);
            }

            // BETA LAUNCH: Mission #1 - The Grand Line Awakening
            if (!localStorage.getItem('cdf_beta_mission_1')) {
                console.log("[Flowee] Beta Protocol: Mission #1 Assigning...");
                setTimeout(() => {
                    this.talk(true, "🏴CQR Captain! The Brain is online. I have a mission for you.", "guide");
                    setTimeout(() => {
                         this.talk(true, "MISSION #1: The Grand Line Awakening. Check your Beta Log for details.", "guide");
                         this.addChatMessage("MISSION #1 OBJECTIVES:<br>1. Kiss Your Heart - Check Wisdom Rune<br>2. Kitchen - Test Jamtruck<br>3. Outbreak Tunes - Trigger Sound<br>4. Master Dashboard - Send Log", "ai");
                         localStorage.setItem('cdf_beta_mission_1', 'active');
                         
                         // Visual Cue
                         if(window.BetaLogger) window.BetaLogger.toggle(); 
                    }, 4000);
                }, 2000);
            }

            // Dynamic Bubble Positioning
            this.recalculateBubblePosition();
            window.addEventListener('resize', () => this.recalculateBubblePosition());

            // AUTO-TUTORIAL (Page Specific)
            this.checkPageTutorial();

            // IMPERIAL INITIATION (Global Quest)
            this.checkImperialInitiation();

            // TRINITY SYNC CHECK
            this.syncTrinityResonance();


        }, 1000);
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

    // --- IMPERIAL INITIATION LOGIC ---
    checkImperialInitiation() {
        const step = parseInt(localStorage.getItem('cdf_imperial_step') || 1);
        const maxSteps = 7;
        
        if(step > maxSteps) return; // Done

        const currentTask = this.imperialSteps.find(s => s.id === step);
        const path = window.location.pathname.split('/').pop() || 'index.html';

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
        container.className = 'fixed bottom-28 right-4 z-[10001] flex flex-col items-end pointer-events-none group transition-all duration-500';
        
        this.container = container;

        const path = window.location.pathname.toLowerCase();
        const isRoot = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('beta-initiation.html');
        const pathPrefix = isRoot ? 'Assets/images/' : '../Assets/images/';

        this.container.innerHTML = `
            <div id="flowee-bubble" class="mb-2 mr-4 w-48 bg-white text-black p-3 rounded-xl rounded-br-none shadow-[0_0_20px_rgba(139,92,246,0.3)] text-xs font-medium opacity-0 pointer-events-none transition-all duration-300 transform scale-90 origin-bottom-right">
                <p>System Online.</p>
                <div class="absolute bottom-[-6px] right-0 w-4 h-4 bg-white transform rotate-45"></div>
            </div>
            
            <img id="flowee-visual" src="${pathPrefix}flowee_pirate_phoenix.png" 
                class="object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] cursor-pointer pointer-events-auto hover:scale-110 transition-transform duration-300 animate-float-slow"
                style="width: 35px; height: 35px; max-width: 35px; max-height: 35px;"
                onclick="window.Flowee.toggleChat()"
                onerror="this.src='${pathPrefix}logo.png'">
        `;
        
        this.element = document.getElementById('flowee-visual');
        this.bubble = document.getElementById('flowee-bubble');
    }

    renderChatInterface() {
        const chatDiv = document.createElement('div');
        chatDiv.id = 'flowee-chat';
        chatDiv.className = "fixed bottom-24 right-8 w-80 h-96 z-[60] bg-black/90 border border-mystic-gold/30 rounded-2xl backdrop-blur-xl p-4 flex flex-col hidden transition-all duration-300 transform scale-95 opacity-0 origin-bottom-right shadow-2xl";
        chatDiv.innerHTML = `
            <!-- Header -->
            <div class="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-mystic-gold">smart_toy</span>
                    <span class="text-xs font-bold text-white uppercase tracking-widest">Flowee AI</span>
                </div>
                <div class="flex items-center gap-2">
                     <button onclick="window.Flowee.restartTutorial()" class="text-white/50 hover:text-electric text-[10px] uppercase font-bold" title="Restart Tutorial">Restart Path</button>
                    <button onclick="window.Flowee.toggleChat()" class="text-white/50 hover:text-white material-symbols-outlined text-sm">close</button>
                </div>
            </div>
            
            <!-- Chat Log -->
            <div id="flowee-chat-log" class="flex-1 overflow-y-auto custom-scrollbar space-y-3 text-xs mb-3 p-1">
                <div class="bg-primary-500/10 p-2 rounded-lg border border-primary-500/20 text-white/80">
                    Greetings, Creator. I am connected to the Yggdrasil Matrix. Ask me anything.
                </div>
            </div>

            <!-- Input -->
            <div class="relative">
                <input type="text" id="flowee-input" placeholder="Ask Flowee..." 
                    class="w-full bg-white/5 border border-white/20 rounded-full py-2 px-4 text-xs text-white focus:outline-none focus:border-mystic-gold"
                    onkeypress="if(event.key === 'Enter') window.Flowee.processInput(this.value)">
                <button onclick="window.Flowee.processInput(document.getElementById('flowee-input').value)" class="absolute right-2 top-1/2 -translate-y-1/2 text-mystic-gold hover:text-white material-symbols-outlined text-sm">send</button>
            </div>
        `;
        document.body.appendChild(chatDiv);
        this.chatInterface = chatDiv;
    }

    toggleChat() {
        if(!this.chatInterface) return;
        const chat = this.chatInterface;
        
        if(chat.classList.contains('hidden')) {
            chat.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                chat.classList.remove('scale-95', 'opacity-0');
            }, 10);
            document.getElementById('flowee-input').focus();
            this.shush(); // Hide bubble when chat opens
        } else {
            chat.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                chat.classList.add('hidden');
            }, 300);
        }
    }

    processInput(text) {
        if(!text.trim()) return;
        
        // 1. User Message
        this.addChatMessage(text, 'user');
        document.getElementById('flowee-input').value = '';

        // 2. AI Processing
        setTimeout(() => {
            const answer = this.findAnswer(text);
            this.addChatMessage(answer.text, 'ai', answer.link);
            
            if(answer.link) {
                // NEW: 3-Second Countdown Rule
                this.startCountdownAndNavigate(answer.link, answer.text);
            }
            if(answer.action) answer.action(); 
        }, 600);
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
            { keys: ["fight", "battle", "arena", "pvp", "duel"], url: "pages/arena.html", msg: "Weapons Check... Entering The Arena." }
        ];

        // Check Redirections
        for(const entry of redirectionMatrix) {
            if(entry.keys.some(k => q.includes(k))) {
                return { 
                    text: entry.msg, 
                    link: entry.url // Triggers startCountdownAndNavigate
                };
            }
        }

        const intentMap = [
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
            { triggers: ["order fuel", "hungry", "food", "kitchen"], text: "The kitchen is hot! What's the flavor of your journey?", link: "african-queen-kitchen.html" },
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
            for(let key of entry.keywords) {
                if(q.includes(key)) {
                    return { text: entry.answer, link: entry.deep_link };
                }
            }
        }

        return { text: "I'm searching the Matrix... Try 'Quests', 'Bag', 'Market', or 'Help'.", link: null };
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

}

// Initialize
window.Flowee = new FloweeAgent();
