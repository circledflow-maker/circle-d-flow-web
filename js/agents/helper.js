/**
 * Agent: The Helper (The Feedback Siphon)
 * Purpose: Collects bug reports (Glitches), provides Utility functions, and bridges User Actions.
 */

if (typeof window.Agent === 'undefined') {
    window.Agent = class Agent {
        constructor(name) {
            this.name = name || "Unknown Agent";
            this.initialized = false;
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._safeInit());
            } else {
                this._safeInit();
            }
        }
        _safeInit() {
            try {
                console.log(`[${this.name}] Initializing (Fallback)...`);
                this.init();
                this.initialized = true;
                console.log(`[${this.name}] Online.`);
            } catch (e) {
                console.error(`[${this.name}] Initialization Failed:`, e);
            }
        }
        init() {}
        log(msg) { console.log(`[${this.name}] ${msg}`); }
    };
}

class HelperAgent extends Agent {
    constructor() {
        super("Helper");
        this.name = "Helper";
        this.glitchLog = "cdf_glitch_log";
    }

    init() {
        console.log(`[${this.name}] Feedback Siphon Active (v2.2). Utilities Loaded.`);
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
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Report Glitch');
        btn.className = 'cdf-glitch-fab';
        btn.onclick = () => this.openGlitchModal('MANUAL_REPORT', 'User Feedback Button');
        
        btn.innerHTML = `
            <span class="material-symbols-outlined cdf-glitch-fab-icon">bug_report</span>
            <span class="cdf-glitch-fab-tip">Report Glitch</span>
        `;
        document.body.appendChild(btn);
        this.positionGlitchButton(btn);
        this.ensureGlitchModal();
    }

    positionGlitchButton(btn) {
        if (!btn) return;
        const path = window.location.pathname.toLowerCase();
        if (path.includes('artist_sanctuary')) return;
        if (path.includes('quest_map')) {
            btn.style.bottom = 'calc(5.5rem + env(safe-area-inset-bottom, 0px))';
            btn.style.left = '12px';
        }
        if (path.includes('dashboard')) {
            btn.style.bottom = 'calc(7rem + env(safe-area-inset-bottom, 0px))';
            btn.style.left = '4.85rem';
            btn.style.width = '42px';
            btn.style.height = '42px';
        }
    }

    ensureGlitchModal() {
        const existing = document.getElementById('glitch-report-modal');
        if (existing) {
            if (existing.classList.contains('cdf-glitch-overlay')) {
                existing.style.display = 'none';
                return;
            }
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'glitch-report-modal';
        modal.className = 'cdf-glitch-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="cdf-glitch-panel" role="dialog" aria-labelledby="glitch-modal-title">
                <div class="cdf-glitch-header">
                    <h3 id="glitch-modal-title">Report Glitch</h3>
                    <button type="button" id="glitch-modal-close" aria-label="Close">✕</button>
                </div>
                <p class="cdf-glitch-desc">Describe what broke or felt wrong. You can queue it for <strong>Main evening review</strong> to track progress updates.</p>
                <textarea id="glitch-details-input" rows="4" placeholder="What happened? Which icon, zone, or step failed?"></textarea>
                <label class="cdf-glitch-check">
                    <input type="checkbox" id="glitch-queue-main" checked>
                    <span>Send to <strong>Main</strong> for evening evaluation &amp; progress update</span>
                </label>
                <div class="cdf-glitch-actions">
                    <button type="button" id="glitch-submit-btn" class="cdf-glitch-send">Send Report</button>
                    <button type="button" id="glitch-cancel-btn" class="cdf-glitch-cancel">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeGlitchModal();
        });
        modal.querySelector('#glitch-modal-close')?.addEventListener('click', () => this.closeGlitchModal());
        modal.querySelector('#glitch-cancel-btn')?.addEventListener('click', () => this.closeGlitchModal());
        modal.querySelector('#glitch-submit-btn')?.addEventListener('click', () => this.submitGlitchModal());
    }

    openGlitchModal(type = 'MANUAL_REPORT', defaultDetails = 'User Initiated') {
        this.ensureGlitchModal();
        this._pendingGlitchType = type;
        this._pendingGlitchDefault = defaultDetails;
        const modal = document.getElementById('glitch-report-modal');
        const input = document.getElementById('glitch-details-input');
        const queue = document.getElementById('glitch-queue-main');
        if (input) input.value = type === 'MANUAL_REPORT' ? '' : defaultDetails;
        if (queue) queue.checked = true;
        if (modal) {
            modal.style.display = 'flex';
            input?.focus();
        }
    }

    closeGlitchModal() {
        const modal = document.getElementById('glitch-report-modal');
        if (modal) modal.style.display = 'none';
    }

    async submitGlitchModal() {
        const details = document.getElementById('glitch-details-input')?.value?.trim()
            || this._pendingGlitchDefault
            || 'User report';
        const queueMain = document.getElementById('glitch-queue-main')?.checked ?? true;
        const snapshot = await this.captureGlitch(this._pendingGlitchType || 'MANUAL_REPORT', details, window.location.pathname, { queueMain });
        this.closeGlitchModal();
        if (window.Pusher) {
            window.Pusher.showToast(
                queueMain ? 'Glitch queued for Main evening review.' : 'Glitch captured locally.',
                'success'
            );
        }
        if (window.Flowee) {
            window.Flowee.talk(false, queueMain
                ? 'Signal logged. Main will review tonight and push a progress update.'
                : 'Glitch noted. Thank you for sharpening the sanctuary.');
        }
        return snapshot;
    }

    async queueForMainReview(snapshot) {
        let queue = [];
        try {
            queue = JSON.parse(localStorage.getItem('cdf_glitch_main_queue') || '[]');
            if (queue.length > 40) queue = queue.slice(-40);
            queue.push(snapshot);
            localStorage.setItem('cdf_glitch_main_queue', JSON.stringify(queue));
        } catch (e) {
            console.warn('[Helper] Main queue save failed', e);
        }

        const client = window.supabaseClient || (window.QuestEngine && window.QuestEngine.supabase);
        if (!client) return false;

        try {
            const { data: sessionData } = await client.auth.getSession();
            const userId = sessionData?.session?.user?.id || null;
            const { error } = await client.from('system_reports').insert({
                report_type: 'glitch',
                status: 'queued_evening',
                payload: {
                    ...snapshot,
                    user_id: userId,
                    page: window.location.pathname,
                    queued_for_main: true
                }
            });
            if (error) {
                console.warn('[Helper] system_reports insert failed:', error.message);
                return false;
            }
            return true;
        } catch (e) {
            console.warn('[Helper] Supabase glitch queue error', e);
            return false;
        }
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

    /** Visual Eye delegates broken <img> recovery here */
    repairBatch(images) {
        if (!images || !images.length) return 0;
        let repaired = 0;
        const fallback = window.location.pathname.includes('/pages/')
            ? '../Assets/images/logo.png'
            : 'Assets/images/logo.png';
        images.forEach((img) => {
            if (!img || img.dataset.helperRepaired === '1') return;
            img.dataset.helperRepaired = '1';
            const orig = img.getAttribute('src') || '';
            img.dataset.fallbackSrc = img.dataset.fallbackSrc || fallback;
            img.onerror = () => {
                if (img.src !== img.dataset.fallbackSrc) {
                    img.src = img.dataset.fallbackSrc;
                    repaired += 1;
                }
            };
            if (!img.complete || img.naturalHeight === 0) {
                const base = orig.split('?')[0];
                if (base) img.src = `${base}?repair=${Date.now()}`;
            }
        });
        if (repaired > 0) console.log(`[${this.name}] Repaired ${repaired} asset(s).`);
        return repaired;
    }

    async captureGlitch(type = 'MANUAL_REPORT', details = 'User Initiated', context = 'Global', options = {}) {
        const snapshot = {
            id: 'GLITCH-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            type: type,
            details: details,
            context: context,
            page: window.location.pathname,
            queuedForMain: !!options.queueMain,
            timestamp: new Date().toISOString()
        };

        // Safe Save with Rotation
        try {
            let logs = JSON.parse(localStorage.getItem(this.glitchLog) || '[]');
            // Limit to last 20 logs to prevent overflow
            if (logs.length > 20) logs = logs.slice(-20);
            logs.push(snapshot);
            localStorage.setItem(this.glitchLog, JSON.stringify(logs));
        } catch (e) {
            console.warn("[Helper] Storage Quota Exceeded. Clearing old logs...");
            // Emergency Dump
            localStorage.removeItem(this.glitchLog);
        }

        if (snapshot.queuedForMain) {
            await this.queueForMainReview(snapshot);
        }

        // Notify (throttled)
        if(window.Pusher && !this.isSpamming) {
            this.isSpamming = true;
            setTimeout(() => this.isSpamming = false, 2000);
            console.log(`Glitch Captured: ${type}`);
        }

        return snapshot;
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
            const flowee = document.getElementById('flowee-agent');
            if (flowee && !document.body.classList.contains('artist-sanctuary')) {
                flowee.classList.remove('bottom-8', 'right-8');
                flowee.classList.add('bottom-4', 'right-4', 'scale-75');
            }
            if (flowee && document.body.classList.contains('artist-sanctuary')) {
                flowee.classList.remove('bottom-4', 'right-4', 'scale-75', 'bottom-8', 'right-8');
            }
            const glitchBtn = document.getElementById('feedback-siphon-btn');
            if (glitchBtn) this.positionGlitchButton(glitchBtn);
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
            '../Assets/images/flowee.svg'
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

    async hardReset() {
        if(!confirm("⚠️ WARNING: This will WIPE your identity, XP, and progress. Are you sure?")) return;
        
        console.log("[Helper] INITIATING HARD RESET...");
        localStorage.clear();
        
        if(window.supabaseClient) {
            // Optional: We could delete from DB, but usually we just sign out and clear local state for 'New Account' feel
            await window.supabaseClient.auth.signOut();
        }
        
        alert("SYSTEM WIPED. REBOOTING...");
        window.location.href = '../index.html';
    }

    /**
     * Resets only the Walkthrough/Tutorial flags to allow re-testing the First World flow.
     */
    resetWalkthrough() {
        console.log("[Helper] Resetting Walkthrough Flags...");
        const keys = [
            'cdf_tour_started', 
            'cdf_tour_done_dashboard.html',
            'cdf_imperial_step',
            'cdf_initiation_market_visited',
            'cdf_initiation_rune_found',
            'onboardingComplete'
        ];
        keys.forEach(k => localStorage.removeItem(k));
        
        if(window.Pusher) window.Pusher.showToast("Walkthrough Reset. Reloading...", "success");
        setTimeout(() => window.location.reload(), 1500);
    }

    // --- NAVIGATION SAFETY ---
    
    /**
     * Safely redirects the user, ensuring the target page exists (conceptually)
     * and handling relative paths logic.
     */
    safeRedirect(target) {
        if(!target) {
            console.warn("[Helper] Empty redirect target. Defaulting to Dashboard.");
            target = 'dashboard.html';
        }

        // Handle "Right Area" logic
        if(target === 'home' || target === 'root') target = '../index.html';
        if(target === 'dashboard') target = 'dashboard.html';
        if(target === 'codex') target = 'quest_board.html';

        // Check if we need to adjust path based on current location
        const isPages = window.location.pathname.includes('/pages/');
        const isRoot = !isPages;

        let finalPath = target;
        
        // --- 0. SPECIAL EXCEPTION FOR ROOT-LEVEL INITIATION ---
        const rootExceptions = ['beta-initiation.html'];
        const isRootException = rootExceptions.some(exc => target.endsWith(exc)); // Corrected check

        // If target implies pages/ but we are IN pages/, remove prefix
        if(isPages && target.startsWith('pages/')) {
            finalPath = target.replace('pages/', '');
        }
        // If target does NOT have pages/ but we are in ROOT, and it's a page (and not a root exception)
        else if(isRoot && !target.startsWith('pages/') && !target.includes('index.html') && !target.startsWith('../') && !isRootException) {
           finalPath = 'pages/' + target;
        }

        console.log(`[Helper] Redirecting: ${target} -> ${finalPath}`);
        window.location.href = finalPath;
    }

    /**
     * Inserts keywords or parameters into the URL for specific page states.
     * e.g. opening a specific tab or quest.
     */
    insertKeywords(params = {}) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));
        window.history.pushState({}, '', url);
        console.log("[Helper] Keywords Inserted:", params);
    }

}

new HelperAgent();
