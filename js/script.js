// --- PROTOCOL: TOTAL CONVERGENCE (PLATINUM SWARM) ---
// SYSTEM ARCHITECTURE: DUAL-CORE AGENTIC SYSTEM
// BUILD_ID: CONVERGENCE_V1

const SYSTEM_CONFIG = {
    BUILD_ID: 'CONVERGENCE_V1',
    DEBUG: true,
    MAINTENANCE_WINDOW: { start: 0, end: 1 } // 00:00 - 01:00
};

// --- CORE 0: THE NERVOUS SYSTEM (EventBus) ---
class EventBus {
    constructor() {
        this.events = {};
        this.history = [];
    }

    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    publish(event, data = {}) {
        if (SYSTEM_CONFIG.DEBUG) {
            // Filter noise
            if (event !== 'HEARTBEAT') console.log(`[BUS] FLASH: ${event}`, data);
        }

        this.history.push({ timestamp: Date.now(), event, data });

        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

const SystemBus = new EventBus();


// --- AGENT 1: THE OVERSEER (System Core & Time) ---
class AgentOverseer {
    constructor() {
        this.name = 'OVERSEER';
        this._internal();
        this._external();
    }

    _internal() {
        // Brain: Heartbeat & Time Monitoring
        setInterval(() => this.checkTime(), 60000);
        setInterval(() => this.heartbeat(), 10000);

        SystemBus.subscribe('SYSTEM_INIT', () => {
            console.log(`[${this.name}] Systems Online.`);
            this.checkTime();
        });
    }

    _external() {
        SystemBus.subscribe('SYSTEM_LOCKDOWN', () => this.renderMaintenanceMode());
        SystemBus.subscribe('SYSTEM_BOOT', () => this.renderBootSequence());
    }

    checkTime() {
        const now = new Date();
        const hours = now.getHours();

        if (hours >= SYSTEM_CONFIG.MAINTENANCE_WINDOW.start && hours < SYSTEM_CONFIG.MAINTENANCE_WINDOW.end) {
            SystemBus.publish('SYSTEM_LOCKDOWN');
        } else {
            const lastPurge = localStorage.getItem('last_midnight_purge');
            const today = new Date().toDateString();

            if (lastPurge !== today && hours === 1) {
                this.midnightPurge();
            }
        }
    }

    midnightPurge() {
        console.log(`[${this.name}] EXECUTE: MIDNIGHT PURGE`);
        localStorage.setItem('daily_xp_current', '0');
        localStorage.setItem('last_midnight_purge', new Date().toDateString());
        SystemBus.publish('DAILY_RESET');
    }

    heartbeat() {
        const crucialElements = ['body', 'nav'];
        const missing = crucialElements.filter(el => !document.querySelector(el));

        if (missing.length > 0) {
            console.error(`[${this.name}] CRITICAL FAILURE: Missing DOM Elements`, missing);
            SystemBus.publish('CRITICAL_FAILURE', { missing });
        }
    }

    renderMaintenanceMode() {
        if (document.getElementById('maintenance-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'maintenance-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 999999;
            background: black; color: #00FF00; font-family: 'Courier New', monospace;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            text-align: center;
        `;
        overlay.innerHTML = `
            <h1 style="font-size: 4rem; text-transform: uppercase;">System Purge</h1>
            <p style="font-size: 1.5rem; margin-top: 1rem;">Protocol "Total Convergence" Maintenance</p>
            <p class="blink" style="margin-top: 2rem;">[HARD LOCK ACTIVE: 00:00 - 01:00]</p>
            <style>.blink { animation: blink 1s infinite; } @keyframes blink { 50% { opacity: 0; } }</style>
        `;
        document.body.appendChild(overlay);
    }

    renderBootSequence() {
        const footer = document.querySelector('footer');
        if (footer) {
            const existing = document.getElementById('boot-msg');
            if (existing) existing.remove();

            const bootMsg = document.createElement('div');
            bootMsg.id = 'boot-msg';
            bootMsg.className = 'text-[10px] text-electric/30 font-mono mt-2 uppercase tracking-widest';
            bootMsg.innerText = `OS: ${SYSTEM_CONFIG.BUILD_ID} // OVERSEER: ACTIVE`;
            footer.appendChild(bootMsg);
        }
    }
}


// --- AGENT 2: SENTINEL (Security) ---
class AgentSentinel {
    constructor() {
        this.name = 'SENTINEL';
        this._internal();
        this._external();
    }

    _internal() {
        SystemBus.subscribe('SYSTEM_INIT', () => this.validateSession());
        SystemBus.subscribe('CHECK_ACCESS', (data) => this.checkAdminAccess(data.zone, data.password));
    }

    _external() {
        SystemBus.subscribe('SESSION_EXPIRED', () => this.performLogout());
        SystemBus.subscribe('LOCK_ZONES', () => this.lockUI());
    }

    validateSession() {
        const tokenDate = localStorage.getItem('session_start');
        if (tokenDate) {
            const now = Date.now();
            const diff = now - parseInt(tokenDate);
            const hours24 = 24 * 60 * 60 * 1000;

            if (diff > hours24) {
                SystemBus.publish('SESSION_EXPIRED');
            }
        } else {
            localStorage.setItem('session_start', Date.now().toString());
        }
    }

    checkAdminAccess(zone, passwordHash) {
        if (passwordHash === 'admin_secret') {
            SystemBus.publish('ACCESS_GRANTED', { zone });
        } else {
            SystemBus.publish('ACCESS_DENIED', { zone });
        }
    }

    lockUI() {
        const restricted = document.querySelectorAll('.restricted-zone');
        restricted.forEach(el => {
            el.classList.add('opacity-50', 'pointer-events-none');
            // Check if lock already exists
            if (!el.querySelector('.sentinel-lock')) {
                const lock = document.createElement('span');
                lock.className = 'material-symbols-outlined absolute top-2 right-2 text-red-500 sentinel-lock';
                lock.innerText = 'lock';
                el.style.position = 'relative';
                el.appendChild(lock);
            }
        });
    }

    performLogout() {
        console.warn(`[${this.name}] SESSION EXPIRED. LOGGING OUT.`);
        // Note: In a real app we might redirect to login, but here we just warn.
        // window.location.href = 'index.html'; 
    }
}


// --- AGENT 3: MERKUR (Economy & Stats) ---
class AgentMerkur {
    constructor() {
        this.name = 'MERKUR';
        this._internal();
        this._external();
    }

    _internal() {
        SystemBus.subscribe('XP_EARNED', (data) => this.calculateXP(data.amount));
        SystemBus.subscribe('TRANSACTION_REQUEST', (data) => this.transactionLogic(data.cost));
    }

    _external() {
        SystemBus.subscribe('BALANCE_UPDATED', () => this.updateHUD());
        SystemBus.subscribe('CAP_REACHED', () => this.showToast('Daily Energy Depleted'));
    }

    calculateXP(amount) {
        let currentXP = parseInt(localStorage.getItem('user_xp') || '0');
        let dailyXP = parseInt(localStorage.getItem('daily_xp_current') || '0');

        if (dailyXP >= 1000) {
            SystemBus.publish('CAP_REACHED');
            return 0;
        }

        const allowed = Math.min(amount, 1000 - dailyXP);
        if (allowed > 0) {
            currentXP += allowed;
            dailyXP += allowed;

            localStorage.setItem('user_xp', currentXP);
            localStorage.setItem('daily_xp_current', dailyXP);

            SystemBus.publish('XP_GAINED', { total: currentXP, gained: allowed });
            SystemBus.publish('BALANCE_UPDATED');

            // Trigger Level Up Check
            if (window.Gamification) {
                // Determine if level up
                // Simplified: GamificationEngine (if imported) handles Level Up event via 'xp-added'
                // We just rely on that or re-implement if needed.
                // For now, let's emit a bus event.
            }
        }
    }

    transactionLogic(cost) {
        // Placeholder
        console.log(`[${this.name}] Transaction: ${cost}`);
    }

    updateHUD() {
        // Targets: dash-xp-text, dash-xp-fill
        const xpText = document.getElementById('dash-xp-text');
        const xpFill = document.getElementById('dash-xp-fill');

        if (xpText && xpFill) {
            const currentXP = parseInt(localStorage.getItem('user_xp') || '0');
            // Assuming next level is static for now or retrieved
            const nextLevelXP = 2200; // Mock current level cap for Lvl 7

            xpText.innerText = `${currentXP} / ${nextLevelXP}`;

            // Calculate percentage
            // Simplified logic: Assuming 0 - 2200 for progress bar
            const percent = Math.min(100, (currentXP / nextLevelXP) * 100);
            xpFill.style.width = `${percent}%`;
        }
    }

    showToast(message) {
        console.log(`[${this.name}] TOAST: ${message}`);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-xl z-[99999] animate-bounce';
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}


// --- AGENT 4: HERMES (Social & Connection) ---
class AgentHermes {
    constructor() {
        this.name = 'HERMES';
        this.pendingRequests = [];
        this.friends = ['DJ Qter', 'Hempy Roots'];
        this._internal();
        this._external();
    }

    _internal() {
        SystemBus.subscribe('SYSTEM_INIT', () => {
            // Mock inbound request
            if (Math.random() > 0.7) {
                this.queueRequest('ShadowOne');
            }
            this.refreshFriendList();
        });

        SystemBus.subscribe('REQUEST_ACTION', (data) => this.resolveRequest(data.id, data.action));
        SystemBus.subscribe('NAV_CHECK_BADGE', () => this.renderBadge());
    }

    _external() {
        SystemBus.subscribe('REQUEST_QUEUED', () => this.renderBadge());
        SystemBus.subscribe('FRIEND_ADDED', () => {
            this.refreshFriendList();
            this.renderBadge();
        });
    }

    queueRequest(targetID) {
        if (!this.pendingRequests.includes(targetID) && !this.friends.includes(targetID)) {
            this.pendingRequests.push(targetID);
            SystemBus.publish('REQUEST_QUEUED', { id: targetID });
        }
    }

    resolveRequest(targetID, action) {
        this.pendingRequests = this.pendingRequests.filter(id => id !== targetID);

        if (action === 'ACCEPT') {
            this.friends.push(targetID);
            SystemBus.publish('FRIEND_ADDED', { id: targetID });
            SystemBus.publish('XP_EARNED', { amount: 50 });
        } else {
            this.renderBadge();
        }
        this.refreshFriendList();
    }

    renderBadge() {
        // Look for the "Hub" link in navigation to place the badge
        const hubLink = document.querySelector('a[href="dashboard.html"]');
        if (hubLink) {
            const existingBadge = hubLink.querySelector('.notification-badge');

            if (this.pendingRequests.length > 0) {
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'notification-badge absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse';
                    hubLink.style.position = 'relative';
                    hubLink.appendChild(badge);
                }
            } else {
                if (existingBadge) existingBadge.remove();
            }
        }
    }

    refreshFriendList() {
        const list = document.getElementById('social-hub-list');
        if (!list) return;

        let html = '';

        // Pending
        this.pendingRequests.forEach(id => {
            html += `
                <div class="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-electric/30 mb-2">
                    <span class="text-xs text-white font-bold">${id}</span>
                    <div class="flex gap-1">
                        <button onclick="SystemBus.publish('REQUEST_ACTION', {id: '${id}', action: 'ACCEPT'})" class="text-green-400 hover:text-white px-1">✓</button>
                        <button onclick="SystemBus.publish('REQUEST_ACTION', {id: '${id}', action: 'DENY'})" class="text-red-400 hover:text-white px-1">✕</button>
                    </div>
                </div>
            `;
        });

        // Friends
        this.friends.forEach(id => {
            html += `
                <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-electric"></div>
                        <span class="text-xs text-white/80">${id}</span>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                </div>
            `;
        });

        list.innerHTML = html;
    }
}


// --- AGENT 5: DA VINCI (Architect, UX & Medic) ---
class AgentDaVinci {
    constructor() {
        this.name = 'DA_VINCI';
        this._internal();
        this._external();
    }

    _internal() {
        SystemBus.subscribe('SYSTEM_INIT', () => {
            this.auditTouchTargets();
            this.monitorAssets();
        });
    }

    _external() {
        SystemBus.subscribe('ASSET_ERROR', (data) => this.emergencyAssetSwap(data.element));
    }

    auditTouchTargets() {
        setTimeout(() => {
            const buttons = document.querySelectorAll('button, a');
            buttons.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                if ((rect.height > 0 && rect.height < 44) || (rect.width > 0 && rect.width < 44)) {
                    // Check if not already adjusted
                    if (!btn.style.minHeight) {
                        btn.style.minHeight = '44px';
                        btn.style.minWidth = '44px';
                        // Keep content centered
                        btn.style.display = 'inline-flex';
                        btn.style.alignItems = 'center';
                        btn.style.justifyContent = 'center';
                    }
                }
            });
        }, 1000);
    }

    monitorAssets() {
        window.addEventListener('error', (e) => {
            if (e.target && e.target.tagName === 'IMG') {
                SystemBus.publish('ASSET_ERROR', { element: e.target });
            }
        }, true);
    }

    emergencyAssetSwap(imgElement) {
        // Adinkra Symbol SVG (Wisdom Knot)
        const fallbackSVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iIzE5MTAyMiIgc3Ryb2tlPSIjOEEyQkUyIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzAgMzAgUSA1MCAxMCA3MCAzMCBUIDcwIDcwIFQgMzAgNzAgVCAzMCAzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZENzAwIiBzdHJva2Utd2lkdGg9IjQiLz48L3N2Zz4=";

        imgElement.src = fallbackSVG;
        imgElement.classList.add('border-2', 'border-red-500/50');
    }
}


// --- AGENT 6: THE HEDONIST (Joy & Micro-Interactions) ---
class AgentHedonist {
    constructor() {
        this.name = 'HEDONIST';
        this._internal();
        this._external();
    }

    _internal() {
        SystemBus.subscribe('XP_GAINED', () => this.analyzeTrigger('XP_GAINED'));
        SystemBus.subscribe('LEVEL_UP', () => this.analyzeTrigger('LEVEL_UP'));
    }

    _external() {
        this.enforceSmoothScroll();
    }

    analyzeTrigger(eventType) {
        if (eventType === 'LEVEL_UP') {
            this.fireConfetti();
            this.triggerHaptics();
        }
        if (eventType === 'XP_GAINED') {
            // Maybe small haptic
        }
    }

    triggerHaptics() {
        if (window.navigator && window.navigator.vibrate) {
            try { navigator.vibrate(5); } catch (e) { }
        }
    }

    fireConfetti() {
        const count = 50;
        const container = document.body;

        // Add minimal CSS for confetti
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.innerHTML = `
                .confetti { position: fixed; width: 8px; height: 8px; z-index: 10000; pointer-events: none; animation: fall 3s linear forwards; top:-10px; }
                @keyframes fall { to { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }

        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'confetti';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.backgroundColor = ['#8A2BE2', '#FFD700', '#00FF00', '#FF0055'][Math.floor(Math.random() * 4)];
            el.style.animationDuration = (Math.random() * 2 + 2) + 's';
            el.style.animationDelay = Math.random() + 's';
            container.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }
    }

    enforceSmoothScroll() {
        document.documentElement.style.scrollBehavior = 'smooth';
    }
}


// --- AGENT 7: THE GUIDE (Contextual Onboarding) ---
class AgentGuide {
    constructor() {
        this.name = 'GUIDE';
        this.tourSteps = {
            'dashboard.html': [
                { target: '#stats-container', title: 'Agent Stats', text: 'This is your potential. Gain XP to level up.' },
                { target: '#daily-quest-card', title: 'Mission Board', text: 'Accept contracts here to earn reputation and credits.' },
                { target: '#social-hub', title: 'Social Uplink', text: 'Connect with other Agents in the network.' }
            ],
            'marketplace.html': [
                { target: '#products-grid', title: 'The Bazaar', text: 'Trade resources, art, and tools.' },
                { target: '#btn-create-listing', title: 'Become a Merchant', text: 'Upload your own goods to the network.' }
            ],
            'kiss-your-heart.html': [
                { target: '#gallery-grid', title: 'The Museum', text: 'Curate or upload visual masterpieces.' },
                { target: '#upload-art-btn', title: 'Contribute', text: 'Share your vision with the world.' }
            ]
        };
        this.currentTour = null;
        this.stepIndex = 0;
        this.overlay = null;
        this._internal();
    }

    _internal() {
        SystemBus.subscribe('SYSTEM_INIT', () => this.checkTourStatus());
    }

    _external() { }

    checkTourStatus() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const done = localStorage.getItem(`tour_done_${page}`);

        if (this.tourSteps[page] && !done) {
            setTimeout(() => this.startTour(page), 1500);
        }
    }

    safetyCheck(elementID) {
        const el = document.querySelector(elementID);
        if (el && el.offsetParent !== null) return true;
        return false;
    }

    startTour(page) {
        this.currentTour = this.tourSteps[page];
        this.stepIndex = 0;
        this.createOverlay();
        this.showStep();
    }

    createOverlay() {
        if (this.overlay) return;
        this.overlay = document.createElement('div');
        this.overlay.id = 'guide-overlay';
        this.overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 100000;
            background: rgba(0,0,0,0.7); pointer-events: auto;
        `;
        document.body.appendChild(this.overlay);
    }

    showStep() {
        if (!this.currentTour || this.stepIndex >= this.currentTour.length) {
            this.endTour();
            return;
        }

        const step = this.currentTour[this.stepIndex];

        if (!this.safetyCheck(step.target)) {
            console.warn(`[${this.name}] Target ${step.target} unsafe. Skipping.`);
            this.stepIndex++;
            this.showStep();
            return;
        }

        this.spotlight(step.target, step);
    }

    spotlight(targetID, step) {
        const el = document.querySelector(targetID);
        // Clean highlight
        document.querySelectorAll('.guide-highlight').forEach(e => {
            e.classList.remove('guide-highlight');
            e.style.zIndex = '';
            e.style.position = '';
            e.style.boxShadow = '';
        });

        el.classList.add('guide-highlight');
        el.style.zIndex = '100001';
        el.style.position = 'relative';
        el.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.8), 0 0 30px rgba(138,43,226,0.8)';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        this.showTooltip(step, el);
    }

    showTooltip(step, el) {
        const existing = document.getElementById('guide-tooltip');
        if (existing) existing.remove();

        const rect = el.getBoundingClientRect();
        const tooltip = document.createElement('div');
        tooltip.id = 'guide-tooltip';
        tooltip.style.cssText = `
            position: fixed; z-index: 100002; width: 280px;
            background: #191022; border: 1px solid #8A2BE2; padding: 20px;
            border-radius: 12px; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        // Positioning logic
        let top = rect.bottom + 15;
        let left = rect.left;

        if (top + 150 > window.innerHeight) top = rect.top - 160;
        if (left + 280 > window.innerWidth) left = window.innerWidth - 300;
        if (left < 0) left = 10;

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';

        tooltip.innerHTML = `
            <h3 class="text-electric font-bold text-lg mb-2">${step.title}</h3>
            <p class="text-sm text-gray-300 mb-4">${step.text}</p>
            <div class="flex justify-between">
                <button id="guide-skip" class="text-xs text-gray-500 hover:text-white">Skip</button>
                <button id="guide-next" class="px-4 py-2 bg-electric rounded-md text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors">
                    ${this.stepIndex === this.currentTour.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        `;

        document.body.appendChild(tooltip);

        document.getElementById('guide-next').onclick = () => {
            this.stepIndex++;
            this.showStep();
        };

        document.getElementById('guide-skip').onclick = () => this.endTour();
    }

    endTour() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        localStorage.setItem(`tour_done_${page}`, 'true');

        if (this.overlay) this.overlay.remove();
        const tooltip = document.getElementById('guide-tooltip');
        if (tooltip) tooltip.remove();

        document.querySelectorAll('.guide-highlight').forEach(e => {
            e.classList.remove('guide-highlight');
            e.style.zIndex = '';
            e.style.position = '';
            e.style.boxShadow = '';
        });

        this.overlay = null;
        SystemBus.publish('XP_EARNED', { amount: 100 });
    }
}


// --- INITIALIZATION ---
// Instantiate Agents
const Overseer = new AgentOverseer();
const Sentinel = new AgentSentinel();
const Merkur = new AgentMerkur();
const Hermes = new AgentHermes();
const DaVinci = new AgentDaVinci();
const Hedonist = new AgentHedonist();
const Guide = new AgentGuide();

document.addEventListener('DOMContentLoaded', () => {
    // Start the Chain Reaction
    SystemBus.publish('SYSTEM_INIT');
    SystemBus.publish('SYSTEM_BOOT');
});

// --- EXPORTS ---
window.SystemBus = SystemBus;
window.Overseer = Overseer;
window.Merkur = Merkur;
window.Hermes = Hermes;
