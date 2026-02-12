/**
 * Agent: SocialMatrix (The Network of Souls)
 * Role: Manages Vivre Cards, Friend Requests, Nakama Splits, and Profile Privacy.
 */

class SocialMatrix {
    constructor() {
        this.name = "SocialMatrix";
        this.epCost = 50; // Cost to send a Vivre Card
        this.maxNakama = 5; // The Inner Circle
        
        // Mock Database of "Ghost Navigators"
        this.ghosts = [
            { id: 'scribe_alpha', name: 'Scribe_Alpha', type: 'Specialist', level: 45, plan: 'commander', aura: 'gold' },
            { id: 'queen_beta', name: 'Queen_Beta', type: 'Enhancer', level: 32, plan: 'privateer', aura: 'silver' },
            { id: 'qter_gamma', name: 'Qter_Gamma', type: 'Emitter', level: 28, plan: 'voyager', aura: 'blue' }
        ];

        this.init();
    }

    init() {
        console.log(`[${this.name}] Calibrating Soul-Tethers...`);
        this.initVesselSystem();
        this.bindEvents();
    }

    bindEvents() {
        // Listen for Search Input on Horizon Bar (if exists)
        // Listen for "Offer Vivre Card" events
        window.addEventListener('OFFER_VIVRE', (e) => this.offerVivreCard(e.detail.targetUser));
    }

    /**
     * 1. The Vivre Card Request
     */
    offerVivreCard(targetUserName) {
        // EP Check
        const currentXP = parseInt(localStorage.getItem('cdf_xp') || 0);

        if (currentXP >= this.epCost) {
            // Deduct EP
            this.deductEP(this.epCost);

            // Simulation: Success
            if(window.Pusher) {
                window.Pusher.pushTicker(`VOID-RESONANCE: TETHER OFFERED TO ${targetUserName} // COST: ${this.epCost} EP`, 'xp');
                window.Pusher.showToast(`Vivre Card sent to ${targetUserName}`, 'success');
            }
            
            // Play Sound
            if(window.SoundEngineer) window.SoundEngineer.playSFX('soul_sync');

        } else {
            // Failure
            if(window.Flowee) window.Flowee.talk(true, "Your Will (EP) is too weak to sustain this tether, Navigator. Gather more experience.", "caution");
        }
    }

    deductEP(amount) {
        const currentXP = parseInt(localStorage.getItem('cdf_xp') || 0);
        const newXP = Math.max(0, currentXP - amount);
        localStorage.setItem('cdf_xp', newXP);
        
        // Dispatch Update Event for UI
        window.dispatchEvent(new CustomEvent('XP_UPDATED', { detail: { xp: newXP, delta: -amount } }));
    }

    /**
     * 2. The Nakama Split (Mock)
     */
    initiateNakamaSplit(offeringName, totalCost) {
        // 1. Check Crew Count (Mock)
        const crewCount = 5; // Simulating full crew
        const perPerson = totalCost / crewCount;

        // 2. Global Alert
        if(window.Pusher) {
            window.Pusher.pushTicker(`NAKAMA-PACT INITIATED // RITUAL: ${offeringName} // SHARE: ${perPerson} EP`, 'alert');
        }

        // 3. Flowee Intervention
        if(window.Flowee) {
            window.Flowee.talk(true, `Captain is calling for a shared journey. The Pact Table is open.`, "guide");
        }

        // 4. Open Modal (Simulation)
        // In a real app, this would open a dedicated modal.
        // For now, we flash the screen gold.
        document.body.classList.add('flash-gold');
        setTimeout(() => document.body.classList.remove('flash-gold'), 500);
    }

    /**
     * 3. Profile Plan Ascension
     */
    upgradePlan(newPlan) {
        // 1. Haki Shake
        document.body.classList.add('haki-shake');
        setTimeout(() => document.body.classList.remove('haki-shake'), 1000);

        // 2. Save
        localStorage.setItem('vessel_tier', newPlan);

        // 3. Ticker
        if(window.Pusher) {
            window.Pusher.pushTicker(`VESSEL UPGRADED: YOU ARE NOW A ${newPlan.toUpperCase()}`, 'success');
        }

        // 4. Reload Page to apply styles (Simplest way for Beta)
        setTimeout(() => window.location.reload(), 2000);
    }

    /**
     * 4. Founder's Check
     */
    checkFounderStatus() {
        const isFounder = localStorage.getItem('is_founder');
        if(isFounder) {
            console.log(`[${this.name}] Legacy Detected. Welcome, Founder.`);
            return true;
        }
        return false;
    }

    /**
     * 5. Privacy & Logistics
     */
    setPrivacyMode(mode) {
        console.log(`[${this.name}] Privacy Mode set to: ${mode}`);
        localStorage.setItem('cdf_privacy_mode', mode);
        
        if(window.Pusher) {
            let msg = mode === 'ghost' ? "SHROUD ACTIVE: VISIBILITY ZERO" : 
                      mode === 'cloaked' ? "CLOAK ENGAGED: NAKAMA EYES ONLY" : 
                      "BEACON LIT: PUBLIC VISIBILITY";
            window.Pusher.pushTicker(`PRIVACY UPDATE // ${msg}`, 'alert');
        }
    }

    toggleLogistics(setting, isActive) {
        console.log(`[${this.name}] Logistics ${setting}: ${isActive}`);
        localStorage.setItem(`cdf_logistics_${setting}`, isActive);
        if(window.Pusher && isActive) {
            window.Pusher.showToast(`${setting} Logic Activated`, 'success');
        }
    }

    /**
     * 6. Frequency Finder (Search)
     */
    searchFrequency(query) {
        if(!query) return;
        console.log(`[${this.name}] Searching Frequency: ${query}`);
        
        // Mock Results
        const results = this.ghosts.filter(g => g.name.toLowerCase().includes(query.toLowerCase()) || g.type.toLowerCase().includes(query.toLowerCase()));
        
        if(results.length > 0) {
            // Found
            if(window.Flowee) window.Flowee.talk(true, `Frequency matched! ${results.length} signals detected.`, 'guide');
            // In a real app, this would render a dropdown. For now, we Toast the first result.
            const target = results[0];
            if(window.Pusher) window.Pusher.showToast(`Signal Found: ${target.name} [${target.type}]`, 'xp');

            // Simulate offering
            // setTimeout(() => this.offerVivreCard(target.name), 2000); 
        } else {
            if(window.Flowee) window.Flowee.talk(true, "Static... No resonance found on this frequency.", 'caution');
        }
    }

    /**
     * 8. Vessel & Economy (Pricing Plans)
     */
    initVesselSystem() {
        this.vesselConfigs = {
            'voyager': {
                name: 'The Voyager',
                id: 'voyager',
                price: 'Free',
                xpMultiplier: 1.0,
                glowClass: 'frame-voyager',
                maxNakamas: 1,
                perks: ['Basic Map Access']
            },
            'privateer': {
                name: 'The Privateer',
                id: 'privateer',
                price: '9 EUR / Month',
                xpMultiplier: 1.5,
                glowClass: 'frame-privateer',
                maxNakamas: 3,
                perks: ['1.5x XP Boost', 'Silver Aura', 'Crew Size: 3']
            },
            'commander': {
                name: 'The Commander',
                id: 'commander',
                price: '29 EUR / Month',
                xpMultiplier: 2.0,
                glowClass: 'frame-commander',
                maxNakamas: 5,
                perks: ['2.0x XP Boost', 'Gold Haki', 'Crew Size: 5', 'Founder Access']
            }
        };
        
        // Load initial state
        const savedPlan = localStorage.getItem('vessel_tier') || 'voyager';
        this.applyVesselStats(savedPlan);
    }

    upgradePlan(planKey) {
        const config = this.vesselConfigs[planKey];
        if (!config) return;

        console.log(`[${this.name}] Upgrading Vessel to: ${planKey} (${config.price})`);
        
        // 1. Persist
        localStorage.setItem('vessel_tier', planKey);

        // 2. UI Update (External Handler)
        this.applyVesselStats(planKey);

        // 3. Ticker
        if(window.Pusher) {
            window.Pusher.pushTicker(`VESSEL UPGRADE: ${config.name.toUpperCase()} ACTIVE // XP-MULTI: ${config.xpMultiplier}x`, 'success');
            // Audio Cue
            window.dispatchEvent(new CustomEvent('GLOBAL_SOUND_EVENT', { detail: { type: 'FX', id: 'upgrade_complete' } }));
        }

        // 4. Flowee
        if(window.Flowee) window.Flowee.talk(true, `Our vessel is now ${config.name}. The currents feel stronger!`, 'celebrate');
    }

    applyVesselStats(planKey) {
        const config = this.vesselConfigs[planKey];
        // Dispatch event for UI to catch up
        window.dispatchEvent(new CustomEvent('VESSEL_UPDATE', { detail: config }));
    }

    /**
     * 9. Tether Capacity Logic
     */
    canAddNakama() {
        const currentTier = localStorage.getItem('vessel_tier') || 'voyager';
        const config = this.vesselConfigs[currentTier];
        // Mock current crew count from 'unlocked_badges' or a specific 'tethers' array
        const currentCrew = JSON.parse(localStorage.getItem('cdf_tethers')) || [];
        
        if (currentCrew.length >= config.maxNakamas) {
            if(window.Pusher) window.Pusher.pushTicker(`VESSEL OVERLOAD: ${config.name.toUpperCase()} CAPACITY REACHED (${currentCrew.length}/${config.maxNakamas})`, 'alert');
            if(window.Flowee) window.Flowee.talk(true, "Our ship is too small, Captain! Upgrade to a larger vessel to tether more souls.", 'caution');
            return false;
        }
        return true;
    }

    /**
     * 10. Data Export (Scribe)
     */
    exportLog() {
        console.log(`[${this.name}] Exporting Navigator's Log...`);
        const sessionData = {
            timestamp: new Date().toISOString(),
            identity: {
                name: localStorage.getItem('cdf_name') || 'Navigator',
                isFounder: localStorage.getItem('is_founder') || 'false',
                vesselTier: localStorage.getItem('vessel_tier') || 'voyager'
            },
            stats: {
                xp: localStorage.getItem('cdf_xp') || 0,
                karma: localStorage.getItem('cdf_karma') || 0
            },
            social: {
                tethers: JSON.parse(localStorage.getItem('cdf_tethers')) || [],
                privacy: localStorage.getItem('cdf_privacy_mode') || 'beacon'
            }
        };

        const dataStr = JSON.stringify(sessionData, null, 4);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `Navigator_Log_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if(window.Pusher) window.Pusher.showToast("Log Exported Successfully", 'success');
    }

    /**
     * 11. Aura Theme Toggle
     */
    toggleTheme() {
        const body = document.body;
        const currentTheme = localStorage.getItem('cdf_theme') || 'tao';
        const newTheme = currentTheme === 'tao' ? 'energy' : 'tao';
        
        console.log(`[${this.name}] Switching Theme to: ${newTheme}`);
        localStorage.setItem('cdf_theme', newTheme);
        
        if(newTheme === 'energy') {
            body.classList.add('theme-energy');
            if(window.Pusher) window.Pusher.pushTicker("AURA SHIFT: GOLD ENERGY // HAKI RISING", 'success');
        } else {
            body.classList.remove('theme-energy');
            if(window.Pusher) window.Pusher.pushTicker("AURA SHIFT: TAO FLOW // CALM RESTORED", 'karma');
        }
    }

    /**
     * 12. Profile Identity Management
     */
    updateIdentity(name, type) {
        console.log(`[${this.name}] Updating Identity: ${name} // ${type}`);
        
        if(name) localStorage.setItem('cdf_name', name);
        if(type) localStorage.setItem('user_class', type); // Syncing with 'user_class' used elsewhere
        
        // UI Update
        const nameEl = document.getElementById('profile-name');
        const typeEl = document.getElementById('profile-type');
        if(nameEl) nameEl.innerText = name;
        if(typeEl) typeEl.innerText = type;

        // Feedback
        if(window.Pusher) window.Pusher.showToast("Identity Matrix Updated", 'success');
        if(window.Flowee) window.Flowee.talk(true, "A new designation? The log is updated, Captain.", "write");
    }

    updateAvatar(file) {
        if (!file) return;
        
        console.log(`[${this.name}] Processing Avatar Upload...`);
        
        // Limit size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            if(window.Pusher) window.Pusher.showToast("File too large (Max 2MB)", 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target.result;
            localStorage.setItem('cdf_user_avatar', result);
            
            // Update UI
            const imgs = document.querySelectorAll('.profile-avatar-img'); // Class to add to images
            imgs.forEach(img => img.src = result);
            
            // Feedback
            if(window.Pusher) window.Pusher.showToast("Visual Signature Updated", 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Global Access
window.SocialMatrix = new SocialMatrix();
