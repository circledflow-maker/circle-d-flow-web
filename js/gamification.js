/**
 * GamificationEngine
 * Handles User XP, Levels, and Permissions.
 * Persists data to localStorage.
 */
class GamificationEngine {
    constructor() {
        this.STORAGE_KEY = 'user_gamification_data';
        this.state = this.loadState();

        // Ensure Wallet State exists
        if (!this.state.wallet) {
            this.state.wallet = {
                flowTokens: 100, // Starting bonus
                pendingFunds: 0, // Euros held in escrow
                availableFunds: 0 // Euros released
            };
            this.saveState();
        }

        // Ensure Badges State exists (Migration)
        if (!this.state.badges) {
            this.state.badges = [];
            this.saveState();
        }

        // Configuration
        this.LEVEL_THRESHOLDS = {
            2: 100,
            3: 300,
            4: 600,
            5: 1000,
            6: 1500,
            7: 2200,
            8: 3000
        };

        this.XP_SOURCES = {
            SETUP_PROFILE: 100,
            TICKET_BUY: 50,
            MARKET_BUY: 30,
            EVENT_CHECKIN: 100,
            SOCIAL_FOLLOW: 20,
            HELP_CONFIRMED: 50,
            COLLAB_PROJECT: 100, // Large collab
            DAILY_LOGIN: 5,     // Small engagement hook
            SIDE_QUEST_DAILY: 15,
            // New Sources
            EVENT_CREATE_INTERNAL: 1500, // High reward for ecosystem
            EVENT_CREATE_EXTERNAL: 300,  // Lower reward for external
            EXTERNAL_LINK_VISIT: 20,     // Visit reward
            // New Advanced Sources
            EVENT_SUCCESS: 500,          // Host reward
            EVENT_ATTENDED: 100,         // User reward
            EVENT_NOSHOW: -50,           // User penalty
            EVENT_CANCEL_BAD: -200,      // Host penalty
            // System Architecture Update
            MARKET_IMMEDIATE_PAY: 200    // Bonus for immediate payment
        };
    }

    /**
     * Load state from local storage or initialize new
     */
    loadState() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            xp: 0,
            level: 1, // Start at Level 1
            history: [], // Log of XP events
            membership: 'free', // Default membership
            vouchers: [], // Default empty vouchers
            isChampion: false, // Tournament Winner Flag
            championPath: null, // 'master' or 'architect'
            freePublicQuestSlots: 0, // Architect Perk
            badges: [] // Earned Badges
        };
    }

    /**
     * Save state to local storage
     */
    saveState() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    }

    /**
     * Add XP to the user
     * @param {number} amount - Amount of XP to add
     * @param {string} dateOrAction - Description of source
     */
    addXP(amount, sourceDescription) {
        if (!amount || amount <= 0) return;

        const multiplier = this.getXPMultiplier();
        const finalAmount = Math.round(amount * multiplier);

        const oldLevel = this.state.level;
        this.state.xp += finalAmount;

        // Log history
        this.state.history.push({
            date: new Date().toISOString(),
            amount: finalAmount,
            source: sourceDescription + (multiplier > 1 ? ` (${multiplier}x Boost)` : '')
        });

        // Recalculate Level
        this.calculateLevel();

        const newLevel = this.state.level;

        this.saveState();

        // Dispatch Event for UI updates
        window.dispatchEvent(new CustomEvent('xp-added', {
            detail: { amount, source: sourceDescription, totalXP: this.state.xp }
        }));

        if (newLevel > oldLevel) {
            this.triggerLevelUp(newLevel);
        }

        console.log(`[Gamification] Added ${amount} XP (${sourceDescription}). Total: ${this.state.xp}. Level: ${this.state.level}`);
    }

    /**
     * Calculate current level based on XP
     */
    calculateLevel() {
        // Iterate through thresholds to find max level reached
        let currentLevel = 1;
        for (const [lvl, threshold] of Object.entries(this.LEVEL_THRESHOLDS)) {
            if (this.state.xp >= threshold) {
                currentLevel = parseInt(lvl);
            } else {
                break;
            }
        }
        this.state.level = currentLevel;
    }

    /**
     * Trigger Level Up Logic
     */
    triggerLevelUp(newLevel) {
        console.log(`[Gamification] LEVEL UP! Now Level ${newLevel}`);
        window.dispatchEvent(new CustomEvent('level-up', {
            detail: { level: newLevel }
        }));

        // Here we could trigger a modal or confetti
        alert(`🎉 LEVEL UP! You are now Level ${newLevel}. Check your dashboard for new perks.`);
    }

    /**
     * Getters
     */
    getLevel() {
        return this.state.level;
    }

    getXP() {
        return this.state.xp;
    }

    getNextLevelThreshold() {
        const nextLevel = this.state.level + 1;
        if (nextLevel > 7) return this.LEVEL_THRESHOLDS[7]; // Cap
        return this.LEVEL_THRESHOLDS[nextLevel];
    }

    getProgressToNextLevel() {
        const currentLevel = this.state.level;
        if (currentLevel >= 7) return 100;

        const prevThreshold = this.LEVEL_THRESHOLDS[currentLevel] || 0;
        const nextThreshold = this.LEVEL_THRESHOLDS[currentLevel + 1];

        const xpInLevel = this.state.xp - prevThreshold;
        const range = nextThreshold - prevThreshold;

        return Math.min(100, Math.max(0, (xpInLevel / range) * 100));
    }

    /**
     * Get Hunter Stats (Nen, Stamina, Impact)
     * Values are 0-100, derived from XP sources or Level.
     */
    getStats() {
        // Mock calculation based on Level + Random Variance (Deterministic hash of XP)
        // In real app, this would sum specific XP tags.
        const base = this.state.level * 12;
        const variance = (this.state.xp % 20); // 0-19 variation

        return {
            nen: Math.min(100, base + variance + 10),       // Creativity (Base High)
            stamina: Math.min(100, base + (variance * 2)),  // Event Attendance
            impact: Math.min(100, base + 5)                 // Community Support
        };
    }

    /**
     * Dev Tools
     */
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.state = this.loadState();
        console.log("Gamification Reset.");
        location.reload();
    }
    /**
     * Check Attendance for an Event (Simulation)
     * In a real app, this would be server-side or triggered by specific status updates.
     */
    checkAttendance(eventId, userEmail, status) {
        if (status === 'attended') {
            this.addXP(this.XP_SOURCES.EVENT_ATTENDED, `Attended Event: ${eventId}`);
        } else if (status === 'noshow') {
            this.addXP(this.XP_SOURCES.EVENT_NOSHOW, `Missed Event: ${eventId}`);
        }
    }

    /**
     * Wallet / Economy Methods
     */
    addTokens(amount, reason) {
        this.state.wallet.flowTokens += amount;
        this.saveState();
        this.showToast(`+${amount} Flow Tokens`, reason);
    }

    spendTokens(amount, reason) {
        if (this.state.wallet.flowTokens >= amount) {
            this.state.wallet.flowTokens -= amount;
            this.saveState();
            console.log(`Spent ${amount} Tokens: ${reason}`);
            return true;
        }
        this.showToast("Insufficient Tokens", "Need more flow!");
        return false;
    }

    getTokens() {
        return this.state.wallet ? this.state.wallet.flowTokens : 0;
    }

    // ... Existing Fund Logic ...
    addPendingFunds(amount) {
        if (!this.state.wallet.pendingFunds) this.state.wallet.pendingFunds = 0;
        this.state.wallet.pendingFunds += amount;
        this.saveState();
    }

    releaseFunds(amount) {
        if (this.state.wallet.pendingFunds >= amount) {
            this.state.wallet.pendingFunds -= amount;
            this.state.wallet.availableFunds = (this.state.wallet.availableFunds || 0) + amount;
            this.saveState();
            this.showToast(`Funds Released`, `€${amount.toFixed(2)} is now available.`);
            return true;
        }
        return false;
    }

    /**
     * Marketplace Logic
     */
    processMarketplacePayment(amount, method) {
        // "Karma" Update: Immediate Payment Bonus
        if (method === 'immediate') {
            this.addXP(this.XP_SOURCES.MARKET_IMMEDIATE_PAY, 'Marketplace Karma Bonus');
            this.addTokens(5, 'Marketplace Karma Bonus'); // +5 Flow Tokens
            return true;
        }
        // Deferral logic would go here
        return true;
    }

    /**
     * Champion Logic
     */
    setChampion(status) {
        this.state.isChampion = status;
        this.saveState();
    }

    setChampionPath(path) {
        if (!this.state.isChampion) return false;

        this.state.championPath = path;

        if (path === 'master') {
            // Path A: The Master (Instant Lvl 7 + Master Circle)
            this.state.level = 7;
            this.triggerLevelUp(7);
            this.setMembership('master'); // Will trigger reload, but logic handles price separate
        } else if (path === 'architect') {
            // Path B: The Architect (Free Slots)
            this.state.freePublicQuestSlots = 3;
            this.saveState();
            this.showToast('Architect Path Chosen', 'You have 3 Free Public Quest Slots.');
        }
    }


    /**
     * Badges & Limitations
     */
    checkLimit(feature, currentUsage) {
        // Champion Architect Path Override
        if (feature === 'public_quests' && this.state.championPath === 'architect') {
            const architecturalLimit = this.state.freePublicQuestSlots || 3;
            // logic to check usage vs free slots would go here, 
            // for now, we assume if they are architect they have access.
            return true;
        }

        const tier = this.getTier();
        const limit = tier.limits[feature];

        if (limit === null) return true; // Unlimited
        if (currentUsage >= limit) {
            this.triggerUpsell(feature);
            return false;
        }
        return true;
    }

    getStorageQuota() {
        return this.getTier().limits.storage;
    }

    triggerUpsell(feature) {
        console.log(`Upsell triggered for ${feature}`);
        // Dispatch event for UI
        window.dispatchEvent(new CustomEvent('trigger-upsell', { detail: { feature } }));
    }

    awardBadge(badgeId) {
        if (!BADGES[badgeId]) return;
        if (this.hasBadge(badgeId)) return;

        this.state.badges.push({
            id: badgeId,
            earnedAt: new Date().toISOString()
        });

        this.addXP(BADGES[badgeId].xpReward, `Badge Earned: ${BADGES[badgeId].name}`);
        this.saveState();
        this.showToast('Badge Unlocked!', BADGES[badgeId].name);
    }

    hasBadge(badgeId) {
        return this.state.badges.some(b => b.id === badgeId);
    }

    /**
     * Membership Methods
     */
    getTier() {
        const id = (this.state.membership || 'free').toUpperCase();
        return MEMBERSHIP[id] || MEMBERSHIP.FREE;
    }

    getXPMultiplier() {
        return this.getTier().multiplier;
    }

    getMembershipPrice(tierId) {
        const tier = MEMBERSHIP[tierId.toUpperCase()];
        if (!tier) return 0;

        // Level 7 Global Perk: Master Circle is 19€ instead of 29€
        if (tierId === 'master' && this.state.level >= 7) {
            return 19;
        }
        return tier.price;
    }

    setMembership(type) {
        if (MEMBERSHIP[type.toUpperCase()]) {
            this.state.membership = type;

            // Add Vouchers
            if (type === 'rising') this.addVoucher('Snack Voucher', 'African Queen Kitchen');
            if (type === 'master') this.addVoucher('Full Meal Voucher', 'African Queen Kitchen');

            this.saveState();
            window.location.reload();
        }
    }

    addVoucher(type, partner) {
        if (!this.state.vouchers) this.state.vouchers = [];
        this.state.vouchers.push({
            id: 'vch_' + Date.now(),
            type: type,
            partner: partner,
            redeemed: false,
            timestamp: Date.now()
        });
        this.saveState();
    }

    redeemVoucher(id) {
        if (!this.state.vouchers) return false;
        const v = this.state.vouchers.find(v => v.id === id);
        if (v && !v.redeemed) {
            v.redeemed = true;
            v.redeemedAt = Date.now();
            this.saveState();
            return true;
        }
        return false;
    }

    showToast(title, message) {
        // Simple console log fallback or integrate with notification system
        console.log(`Toast: ${title} - ${message}`);
        if (window.Notifications) window.Notifications.send('info', message, 'user');
    }
}

const MEMBERSHIP = {
    FREE: {
        id: 'free',
        name: 'Free Flow',
        multiplier: 1.0,
        price: 0,
        limits: {
            marketplace: 2,
            items_museum: 1,
            creation_boards: 1,
            storage: '50MB'
        }
    },
    RISING_ARTIST: {
        id: 'rising',
        name: 'Rising Artist',
        multiplier: 1.2,
        priceId: 'prod_TssNc1UP3ux4D7',
        price: 9, // Display price, actual handled by Stripe
        limits: {
            marketplace: 20,
            items_museum: 5,
            creation_boards: 5,
            storage: '5GB'
        }
    },
    MASTER_CIRCLE: {
        id: 'master',
        name: 'Master Circle',
        multiplier: 1.5,
        priceId: 'prod_TssQ4HLfIruYgF',
        price: 29,
        limits: {
            marketplace: null, // Unlimited
            items_museum: null,
            creation_boards: null,
            storage: 'Unlimited'
        }
    },
    ELITE: { // New Tier
        id: 'elite',
        name: 'Level 7',
        multiplier: 2.0,
        priceId: 'prod_TssTAKBG8NbAdO',
        price: 49, // Assumption based on hierarchy
        limits: {
            marketplace: null,
            items_museum: null,
            creation_boards: null,
            storage: 'Unlimited',
            priority_support: true
        }
    }
};

const BADGES = {
    KARMA_MASTER: { id: 'KARMA_MASTER', name: 'Karma Master', xpReward: 500, icon: 'diversity_3' }, // 5% Rule
    CYPHER_CHAMP: { id: 'CYPHER_CHAMP', name: 'Cypher Champion', xpReward: 1000, icon: 'military_tech' }, // Tournament Win
    CURATOR: { id: 'CURATOR', name: 'Curator', xpReward: 300, icon: 'museum' } // Virtual Exhibition
};

// Global Instance
window.Gamification = new GamificationEngine();
