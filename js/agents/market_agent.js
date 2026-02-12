/**
 * AGENT: MARKET AGENT (The Broker)
 * Role: Manages the economy of the Grand Bazaar.
 * Responsibilities:
 * 1. Calculate Imperial Tax (5%).
 * 2. Validate User Tier (Voyager, Privateer, Commander).
 * 3. Handle Manilla Currency visual logic.
 */

window.MarketAgent = {
    name: "MarketAgent",
    
    // Config
    ROTATION_INTERVAL: 4 * 60 * 60 * 1000, // 4 Hours
    
    init: function() {
        console.log(`[${this.name}] Calibrating Scales...`);
        this.injectForgeButton();
        this.startRotationEngine();
        this.startPitTicker();
    },

    // --- 1. THE ROTATION ENGINE (4-Hour Pulse) ---

    startRotationEngine: function() {
        this.updateRotationDisplay();
        
        // Update countdown every second
        setInterval(() => this.updateRotationDisplay(), 1000);
    },

    updateRotationDisplay: function() {
        const now = Date.now();
        const cycle = Math.floor(now / this.ROTATION_INTERVAL);
        const nextCycle = (cycle + 1) * this.ROTATION_INTERVAL;
        const diff = nextCycle - now;

        // Format Time
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        // Update DOM if exists
        const timerEl = document.getElementById('market-timer');
        if(timerEl) {
            timerEl.innerText = `${hrs}h ${mins}m ${secs}s`;
        }

        // Trigger Shuffle visuals if close to 0 (mock)
        if(diff < 2000 && diff > 1000) {
            this.triggerShuffleVisuals();
        }
        
        // Mock Ticker Update based on "Who is Winning" the rotation
        const ticker = document.getElementById('imperial-ticker-text');
        if(ticker && Math.random() > 0.99) { // Low freq update
             ticker.innerText = `+++ MARKET CYCLE ENDING ${hrs}:${mins} +++ SOVEREIGNS DOMINATING ARTS SECTOR +++ ${Math.floor(Math.random()*5000)} FC TRADED LAST HOUR +++`;
        }
    },

    triggerShuffleVisuals: function() {
        const islands = document.querySelectorAll('.gild-island');
        islands.forEach(el => {
            el.classList.add('animate-pulse');
            setTimeout(() => el.classList.remove('animate-pulse'), 3000);
        });
        if(window.SoundEngineer) window.SoundEngineer.playSFX('stone_crack'); // Heavy sound
        
        // RE-ROLL ITEMS (Logic)
        this.runWeightedRotation();
    },

    // --- WEIGHTED ROTATION ALGORITHM ---
    runWeightedRotation: function() {
        console.log(`[${this.name}] Executing 4-Hour Weighted Rotation...`);
        // 1. Fetch Candidates (Mock)
        // In real backend: SELECT * FROM items WHERE active=true
        
        // 2. Weighting
        // Sovereign: 50% Chance
        // Commander: 30% Chance
        // Voyager: 20% Chance
        
        // 3. Output (Mock)
        if(window.Pusher) window.Pusher.showToast("MARKET SHUFFLE: New Exemplars Selected.", "karma");
    },
    
    // --- FILTERING ---
    enterGild: function(guild) {
        // Just visual feedback for now, would route to refined guild page or filter grid
        console.log(`[${this.name}] Entering Guild: ${guild}`);
        if(window.SoundEngineer) window.SoundEngineer.playSFX('ui_click_hover');
        
        // Add "Active" state visually
        document.querySelectorAll('.gild-island').forEach(el => el.style.opacity = '0.3');
        const active = document.querySelector(`.gild-island[onclick*="${guild}"]`);
        if(active) active.style.opacity = '1';
        
        // Reset after 1s (Mock navigation)
        setTimeout(() => {
             document.querySelectorAll('.gild-island').forEach(el => el.style.opacity = '1');
        }, 1000);
    }

    // --- 2. THE PIT TICKER (Live Auction) ---

    startPitTicker: function() {
        const tickerEl = document.getElementById('pit-ticker-content');
        if(!tickerEl) return;

        const items = [
            { name: "Obsidian Dagger", price: 12500, user: "SovereignX" },
            { name: "Neon Soul Pack", price: 4500, user: "BeatMaker99" },
            { name: "Golden TukTuk Ride", price: 800, user: "AlfamaKing" },
            { name: "Ancient Rune", price: 32000, user: "CryptoSage" },
            { name: "Voice of the Void", price: 1500, user: "Unknown" }
        ];

        let index = 0;
        setInterval(() => {
            const item = items[index];
            // Update Price (Simulation)
            item.price += Math.floor(Math.random() * 100); 
            
            tickerEl.innerHTML = `
                <span class="text-red-500 font-bold text-xs uppercase tracking-widest animate-pulse">● LIVE AUCTION:</span>
                <span class="text-xs text-white/70 ml-2 font-mono">${item.name}</span>
                <span class="text-[#CD7F32] font-bold text-xs ml-2">${item.price} FC</span>
                <span class="text-[9px] text-white/30 ml-2">by ${item.user}</span>
            `;

            index = (index + 1) % items.length;
        }, 4000); // 4s Item Change
    },


    // --- 3. ECONOMY LOGIC ---
    
    calculateTax: function(amount) {
        return Math.floor(amount * 0.05); // 5% Flat Tax
    },

    // --- 4. TIER & LISTING VALIDATION ---

    canForge: function(userTier, activeListings) {
        // Fleet Members get unlimited Service Listings
        if(window.FleetAgent && window.FleetAgent.isDriver()) {
            return true;
        }

        const limits = {
            'Voyager': 1,
            'Privateer': 5,
            'Commander': 999
        };
        return activeListings < limits[userTier] || 1; 
    },

    injectForgeButton: function() {
         // Could inject globally if needed, currently static in HTML
    },

    // --- 5. THE FORGE V2 (MEDIA HANDLERS) ---

    initVisualUpload: function() {
        const dropZone = document.querySelector('.drop-zone');
        const input = document.getElementById('artifact-upload');
        const preview = document.getElementById('artifact-preview-img');
        const icon = document.getElementById('upload-icon');

        if(!dropZone || !input) return;

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('bg-[#CD7F32]/20', 'border-solid');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-[#CD7F32]/20', 'border-solid');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-[#CD7F32]/20', 'border-solid');
            const file = e.dataTransfer.files[0];
            if(file) this.handleFile(file, preview, icon);
        });

        // Click Trigger
        dropZone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) this.handleFile(file, preview, icon);
        });
    },

    handleFile: function(file, previewEl, iconEl) {
        if(!file.type.startsWith('image/')) {
            alert("Only Visual Artifacts (Images) are accepted.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewEl.src = e.target.result;
            previewEl.classList.remove('hidden');
            iconEl.classList.add('hidden');
            if(window.SoundEngineer) window.SoundEngineer.playSFX('equip_item');
        };
        reader.readAsDataURL(file);
    },

    initVoiceMemo: function() {
        const btn = document.getElementById('btn-voice-record');
        if(!btn) return;

        let isRecording = false;
        let mediaRecorder;
        let audioChunks = [];

        btn.onclick = async () => {
            if(!isRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];

                    mediaRecorder.ondataavailable = event => {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        this.voiceBlob = audioBlob;
                        console.log("[Forge] Voice Seal Created:", audioBlob.size, "bytes");
                        alert("Voice Seal Encoded! Ready to Forge.");
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    btn.classList.add('bg-red-500', 'text-white', 'animate-pulse');
                    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">radio_button_checked</span> RECORDING (TAP TO STOP)`;
                    
                    setTimeout(() => {
                        if(isRecording) btn.click();
                    }, 15000);

                } catch(err) {
                    console.error("Mic Access Denied:", err);
                    alert("Voice Seal Failed: Microphone Access Denied.");
                }
            } else {
                mediaRecorder.stop();
                isRecording = false;
                btn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
                btn.innerHTML = `<span class="material-symbols-outlined text-green-400">check_circle</span> VOICE SEALED`;
            }
        }
    },

    submitArtifact: function() {
        const nameInput = document.querySelector('input[name="title"]'); // Select by name as placeholders differ
        const name = nameInput ? nameInput.value : document.querySelector('input[type="text"]').value;
        
        const guild = document.querySelector('select') ? document.querySelector('select').value : 'Artifacts';
        const flow = document.querySelector('input[name="price"]') ? document.querySelector('input[name="price"]').value : 0;
        
        if(!name) {
            alert("Artifact Name is required.");
            return;
        }

        const previewEl = document.getElementById('artifact-preview-img');
        const visualSrc = previewEl ? previewEl.src : "";

        // Determine Type (Product vs Service)
        const isService = window.location.href.includes('service') || guild === 'Services';

        const payload = {
            id: 'lst_' + Date.now(),
            name,
            guild,
            price: flow,
            tax: this.calculateTax(flow),
            visual: visualSrc.length > 100 ? visualSrc : "https://placehold.co/400x400/1a1a1a/gold?text=Artifact",
            voiceMemo: this.voiceBlob ? "Attached" : "None",
            type: isService ? 'SERVICE' : 'PRODUCT',
            ownerRank: window.Gamification ? window.Gamification.getRank().name : 'Voyager',
            timestamp: new Date().toISOString()
        };

        console.log("[The Anvil] Sealing Artifact:", payload);
        
        // Save to LocalStorage (Registry)
        const currentListings = JSON.parse(localStorage.getItem('cdf_listings') || '[]');
        currentListings.unshift(payload);
        localStorage.setItem('cdf_listings', JSON.stringify(currentListings));

        if(window.SoundEngineer) window.SoundEngineer.playSFX('success_bell');
        
        if(confirm(`Artifact Sealed: ${name}\n\nView in Registry?`)) {
            window.location.href = 'marketplace.html'; // Redirect to Market/Registry
        } else {
            document.getElementById('forge-modal').close();
        }
    },

    initForge: function() {
         // Retry a few times in case of race conditions
         const tryInit = () => {
            if(document.querySelector('.drop-zone')) {
                this.initVisualUpload();
                this.initVoiceMemo();
                
                // Attach Submit Handler override
                const submitBtn = document.querySelector('button[type="button"][onclick*="submitArtifact"]');
                if(submitBtn) {
                    submitBtn.onclick = (e) => {
                        e.preventDefault();
                        this.submitArtifact();
                    };
                }
                console.log(`[${this.name}] Forge Systems Online.`);
            } else {
                setTimeout(tryInit, 500);
            }
        };
        tryInit();
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => window.MarketAgent.init());
