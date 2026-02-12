/**
 * Agent: The Helper (The Feedback Siphon)
 * Purpose: Collects bug reports (Glitches), provides Utility functions, and bridges User Actions.
 */

class HelperAgent {
    constructor() {
        this.name = "Helper";
        this.glitchLog = "cdf_glitch_log";
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Feedback Siphon Active (v2.1). Utilities Loaded.`);
        this.injectUI();
        this.checkMobileView();
        window.addEventListener('resize', () => this.checkMobileView());
        window.Helper = this;

        // Asset Fracture Monitoring (Capture Phase for <img>/script errors)
        window.addEventListener('error', (e) => {
            if(e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT')) {
                console.warn(`[${this.name}] Asset Fracture Detected:`, e.target.src);
                this.captureGlitch('ASSET_FRACTURE', `Broken Link: ${e.target.src}`);
            }
        }, true);

        // Global Link Interceptor for "Under Construction"
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href') === '#') {
                e.preventDefault();
                if(window.Pusher) {
                    window.Pusher.showToast('System Under Construction. Architects are working.', 'error');
                } else {
                    alert('System Under Construction.');
                }
            }
        });
    }

    injectUI() {
        // Prevent dupes
        if(document.getElementById("feedback-siphon-btn")) return;

        const btn = document.createElement('button');
        btn.id = "feedback-siphon-btn";
        btn.className = "fixed bottom-24 left-8 w-10 h-10 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all z-50 group shadow-[0_0_15px_rgba(255,42,81,0.2)]";
        btn.onclick = () => this.captureGlitch('MANUAL_REPORT', 'User Feedback Button');
        
        btn.innerHTML = `
            <span class="material-symbols-outlined text-sm animate-pulse-fast">bug_report</span>
            <div class="absolute left-full ml-2 bg-black/80 text-red-500 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-red-500/20 pointer-events-none transition-opacity">
                Report Glitch
            </div>
        `;
        document.body.appendChild(btn);
    }

    registerAlignment() {
        console.log(`[${this.name}] Recording User Alignment...`);
        localStorage.setItem('cdf_alignment_status', 'ALIGNED');
        localStorage.setItem('cdf_alignment_date', new Date().toISOString());
        
        if(window.Pusher) {
            window.Pusher.showToast('Alignment Recorded. The Circle Expands.', 'success');
        } else {
            alert('Alignment Recorded.');
        }
    }

    captureGlitch(type = 'MANUAL_REPORT', details = 'User Initiated', context = 'Global') {
        const snapshot = {
            id: 'GLITCH-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            type: type,
            details: details,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            agent: navigator.userAgent,
            storageUsage: JSON.stringify(localStorage).length,
            screen: `${window.innerWidth}x${window.innerHeight}`
        };

        // Save to Local Log (Simulated Backend)
        const logs = JSON.parse(localStorage.getItem(this.glitchLog) || '[]');
        logs.push(snapshot);
        localStorage.setItem(this.glitchLog, JSON.stringify(logs));

        // Reward User + Notify
        if(window.Resonance) window.Resonance.modKarma(5);
        if(window.Pusher) {
            window.Pusher.showToast(`Glitch Captured [${snapshot.id}]. +5 Karma`, 'karma');
            window.Pusher.broadcast('ADMIN_ALERT', { msg: `New Glitch Report: ${snapshot.id} (${context})` });
        } else {
            console.log(`Glitch Captured [${snapshot.id}]`);
        }
    }

    /**
     * Formal Alignment Registration
     * Connects Goal Page to Community System
     */
    registerAlignment() {
        console.log(`[${this.name}] Registering Alignment...`);
        const now = new Date().toISOString();
        
        // 1. Save Core Data (Trust & Date)
        this.saveData('cdf_alignment_status', 'ALIGNED');
        this.saveData('cdf_alignment_date', now);
        this.saveData('cdf_trust_badge', 'true');

        // 2. Grant Rewards (More Karma than XP as requested)
        const xp = 50;
        const karma = 150; 
        
        // Update XP
        let currentXP = parseInt(localStorage.getItem('cdf_xp') || '0');
        currentXP += xp;
        this.saveData('cdf_xp', currentXP.toString());

        // Update Karma (via Resonance if avail, else local)
        if(window.Resonance) {
            window.Resonance.modKarma(karma);
        } else {
            // Fallback manual karma mod
            /* Note: Karma usually managed by Resonance, but we ensure it's recorded */
            let k = parseInt(localStorage.getItem('cdf_karma') || '0');
            k += karma;
            this.saveData('cdf_karma', k.toString());
        }

        // 3. Notify System
        if(window.Pusher) {
            window.Pusher.broadcast('USER_ALIGNMENT', { status: 'ALIGNED', date: now });
            // Two toasts for dramatic effect
            setTimeout(() => window.Pusher.showToast(`+${xp} XP | +${karma} KARMA`, 'xp'), 100);
            setTimeout(() => window.Pusher.showToast('TRUST BADGE ACQUIRED', 'success'), 800);
        }
    }

    /**
     * CENTRAL DATA SAVER (Phase 23)
     * Use this instead of localStorage.setItem for critical user data.
     */
    saveData(key, value) {
        // 1. Check if NetworkHub is available to handle the "Sync"
        if(window.NetworkHub) {
            window.NetworkHub.syncData(key, value);
        } else {
            // Fallback
            localStorage.setItem(key, value);
            console.warn(`[Helper] NetworkHub missing. Saved locally: ${key}`);
        }
    }

    checkMobileView() {
        if (window.innerWidth < 768) {
            document.body.classList.add('mobile-optimized');
            // Adjust Flowee if present
            const flowee = document.getElementById('flowee-agent');
            if(flowee) {
                flowee.classList.remove('bottom-8', 'right-8');
                flowee.classList.add('bottom-4', 'right-4', 'scale-75'); 
            }
        }
    }

    // --- UTILITIES ---

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    timeSince(dateString) {
        const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }

    triggerSystemOverride(msg) {
        console.warn(`[Helper] SYSTEM OVERRIDE TRIGGERED: ${msg}`);
        window.dispatchEvent(new CustomEvent('SYSTEM_OVERRIDE', {
            detail: { message: msg }
        }));
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // --- HAPTICS & PHYSICS ---
    
    triggerHaptic(pattern = 'soft') {
        if (!navigator.vibrate) return;

        switch(pattern) {
            case 'soft': navigator.vibrate(10); break; // Hover
            case 'light': navigator.vibrate(20); break; // Selection
            case 'medium': navigator.vibrate(50); break; // Activation
            case 'heavy': navigator.vibrate(100); break; // Press/Hold
            case 'double': navigator.vibrate([50, 50, 50]); break; // Error
            case 'pulse': navigator.vibrate([10, 100, 10, 100]); break; // Heartbeat
            case 'bloom': navigator.vibrate([20, 30, 40, 50]); break; // Bloom Expand
        }
    }

    preloadMandalaAssets() {
        const assets = [
            '../Assets/images/logo.png',
            '../Assets/images/flowee_pirate_phoenix.png'
            // Add other core icons here
        ];
        assets.forEach(src => {
            const img = new Image();
            img.src = src;
        });
        console.log(`[${this.name}] Mandala Assets Preloaded.`);
    }

    sanitizeInput(text) {
        if(!text) return '';
        const div = document.createElement('div');
        div.innerText = text; // Encodes HTML
        return div.innerHTML;
    }

    // --- RESOURCE MANAGEMENT ---
    
    // --- RESOURCE MANAGEMENT ---
    
    checkResources(amount) {
        const currentXP = parseInt(localStorage.getItem('cdf_xp') || 0);
        return currentXP >= amount;
    }

    addResources(amount) {
        // 1. Update Legacy/Local Simple XP
        const currentXP = parseInt(localStorage.getItem('cdf_xp') || 0);
        const newXP = currentXP + amount;
        localStorage.setItem('cdf_xp', newXP);
        
        // 2. Sync with Gamification Engine (Community Page)
        try {
            const gameData = localStorage.getItem('user_gamification_data');
            if(gameData) {
                const parsed = JSON.parse(gameData);
                parsed.xp = (parsed.xp || 0) + amount;
                // Add history log if possible
                if(!parsed.history) parsed.history = [];
                parsed.history.push({
                    date: new Date().toISOString(),
                    amount: amount,
                    source: "Helper Agent (Lab/Quest)"
                });
                localStorage.setItem('user_gamification_data', JSON.stringify(parsed));
            }
        } catch(e) {
            console.warn("[Helper] Failed to sync with Gamification data", e);
        }

        // Dispatch UI Update
        window.dispatchEvent(new CustomEvent('cdf-xp-update', { detail: { xp: newXP, delta: amount } }));
        return newXP;
    }

    awardXP(amount, reason) {
        const newTotal = this.addResources(amount);
        if(window.Pusher) {
            window.Pusher.showToast(`+${amount} XP: ${reason}`, 'success');
        }
        return newTotal;
    }

    deductResources(amount) {
        if (!this.checkResources(amount)) return false;
        
        // 1. Deduct from Simple XP
        const currentXP = parseInt(localStorage.getItem('cdf_xp') || 0);
        const newXP = Math.max(0, currentXP - amount);
        localStorage.setItem('cdf_xp', newXP);

        // 2. Sync Deduction with Gamification
        try {
            const gameData = localStorage.getItem('user_gamification_data');
            if(gameData) {
                const parsed = JSON.parse(gameData);
                parsed.xp = Math.max(0, (parsed.xp || 0) - amount);
                 if(!parsed.history) parsed.history = [];
                parsed.history.push({
                    date: new Date().toISOString(),
                    amount: -amount,
                    source: "Helper Agent Deduction"
                });
                localStorage.setItem('user_gamification_data', JSON.stringify(parsed));
            }
        } catch(e) {
             console.warn("[Helper] Failed to sync deduction", e);
        }
        
        // Dispatch UI Update
        window.dispatchEvent(new CustomEvent('cdf-xp-update', { detail: { xp: newXP, delta: -amount } }));
        return true;
    }

    // --- SUPABASE AUTH (BETA) ---

    // --- SUPABASE AUTH (BETA) ---

    async registerUser(email, password, username) {
        // Robust Client Detection: Use Initialized Client OR QuestEngine's
        const client = window.supabaseClient || (window.QuestEngine ? window.QuestEngine.supabase : null);
        
        if(client) {
            console.log(`[Helper] Attempting Supabase Registration for ${username}...`);
            const { data, error } = await client.auth.signUp({ email, password });
            
            if(error) {
                console.error("[Helper] Registration Error:", error);
                alert("Registration Error: " + error.message);
                return false;
            } else {
                // Create Profile
                if(data.user) {
                    const { error: profileError } = await client.from('profiles').insert([
                        { id: data.user.id, username: username, updated_at: new Date() }
                    ]);
                    
                    if(profileError) {
                         console.error("[Helper] Profile Creation Failed:", profileError);
                         // Continue anyway, profile can be created later or via trigger
                    }

                    alert("Welcome, Navigator! Please check your email to verify.");
                    return true;
                }
            }
        } else {
            // Local Fallback
            console.warn("Supabase Offline. Using Local Storage.");
            const user = { username, email, password, joined: new Date().toISOString() };
            localStorage.setItem('cqr_user', JSON.stringify(user));
            localStorage.setItem('cqr_auth_state', 'logged_in');
             if(window.QuestEngine) {
                 window.QuestEngine.userProfile = user; // Sync Engine
                 window.QuestEngine.completeQuest('q1_intro'); // Auto-complete Identity Quest
            }
            return true;
        }
    }

    async loginUser(email, password) {
        const client = window.supabaseClient || (window.QuestEngine ? window.QuestEngine.supabase : null);

        if(client) {
            console.log(`[Helper] Attempting Supabase Login for ${email}...`);
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            
            if(error) {
                console.error("[Helper] Login Error:", error);
                alert("Login Failed: " + error.message);
                return false;
            } else {
                console.log("[Helper] Login Success:", data);
                return true;
            }
        } else {
             // Local Fallback (Mock)
             // We check if cqr_user exists and matches (simple check)
             const stored = JSON.parse(localStorage.getItem('cqr_user'));
             if(stored && stored.email === email && stored.password === password) {
                 localStorage.setItem('cqr_auth_state', 'logged_in');
                 return true;
             } else {
                 // For now, allow any login in beta if no user found, just create it
                 this.registerUser(email, password, email.split('@')[0]);
                 return true;
             }
        }
    }

    async performLogout() {
        if(window.supabase) {
            await window.supabase.auth.signOut();
        }
        
        // Local Clear
        localStorage.removeItem('cqr_auth_state');
        localStorage.removeItem('cdf_user_username'); // Clear legacy keys
        
        // Mystic Fog Transition
        if(window.MasterBrain) {
            window.MasterBrain.triggerMysticFog('index.html');
        } else {
            window.location.href = 'index.html';
        }
    }

    /* --- PROFILE UTILS --- */
    checkProfileStatus() {
        const name = localStorage.getItem('cdf_user_username');
        const avatar = localStorage.getItem('cdf_avatar_src');
        const aligned = localStorage.getItem('cdf_alignment_status');
        
        const isComplete = name && avatar && aligned === 'ALIGNED';
        
        if(isComplete && !localStorage.getItem('cdf_profile_masterey')) {
            localStorage.setItem('cdf_profile_masterey', 'true');
            if(window.Flowee) window.Flowee.talk(true, "Your Identity is now fully integrated with the Flow. Excellent.", "success");
            this.awardXP(100, "Full Profile Integration");
        }
        
        return { name: !!name, avatar: !!avatar, aligned: aligned === 'ALIGNED' };
    }

    getLevel() {
        const xp = parseInt(localStorage.getItem('cdf_xp') || 0);
        // Simple curve: Level = 1 + (XP / 1000)
        return Math.floor(1 + (xp / 1000));
    }

    safeExecute(fn, context = 'Unknown') {
        try {
            fn();
        } catch (e) {
            console.error(`[Helper] Error in ${context}:`, e);
            this.captureGlitch('RUNTIME_ERROR', `${context}: ${e.message}`);
        }
    }
}

new HelperAgent();
