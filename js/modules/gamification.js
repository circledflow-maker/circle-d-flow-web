/**
 * Circle D Flow - Gamification Module
 * Handles XP (Resonance), Levels, and Karma (Balance).
 */

const LevelLogic = {
    BASE_XP: 500,
    SCALING_FACTOR: 1.2,

    // 1. Calculate Level from Total XP
    calculateLevel(totalXP) {
        if (totalXP < this.BASE_XP) return 1;
        return Math.floor(Math.pow(totalXP / this.BASE_XP, 1 / this.SCALING_FACTOR)) + 1;
    },

    // 2. Calculate XP required for a specific level
    xpForLevel(level) {
        if (level <= 1) return 0;
        return Math.floor(this.BASE_XP * Math.pow(level - 1, this.SCALING_FACTOR));
    },

    // 3. Get Progress Data for UI
    getLevelProgress(totalXP) {
        const currentLevel = this.calculateLevel(totalXP);
        const xpStartCurrentLevel = this.xpForLevel(currentLevel);
        const xpForNextLevel = this.xpForLevel(currentLevel + 1);
        
        const xpGainedInLevel = totalXP - xpStartCurrentLevel;
        const xpRequiredForLevel = xpForNextLevel - xpStartCurrentLevel;
        const progressPercent = (xpGainedInLevel / xpRequiredForLevel) * 100;
        
        return {
            level: currentLevel,
            percent: Math.min(100, Math.max(0, progressPercent)).toFixed(2),
            currentXP: totalXP,
            nextLevelXP: xpForNextLevel,
            remaining: xpForNextLevel - totalXP
        };
    }
};

const KarmaSystem = {
    actions: {
        LOGIN: { xp: 50, karma: 10, limit: 1 },
        UPLOAD: { xp: 200, karma: 0, limit: 3 },
        BUNDLE: { xp: 500, karma: 50, limit: 0 }, // Master only
        QUEST: { xp: 150, karma: 5, limit: 0 },
        VOTE: { xp: 20, karma: 5, limit: 5 },
        BUG: { xp: 100, karma: 200, limit: 0 }
    },

    // Award Points
    award(actionType, manualOverride = null) {
        const action = this.actions[actionType] || manualOverride;
        if(!action) return console.error("Unknown Action:", actionType);

        // Check Daily Limits (Simplified)
        const today = new Date().toDateString();
        const key = `cdf_daily_${actionType}_${today}`;
        const count = parseInt(localStorage.getItem(key) || '0');

        if(action.limit > 0 && count >= action.limit) {
            console.warn(`Daily Limit reached for ${actionType}`);
            return false;
        }

        // Update Storage
        this.addXP(action.xp);
        this.addKarma(action.karma);
        
        // Log Limit
        if(action.limit > 0) localStorage.setItem(key, count + 1);

        return { xp: action.xp, karma: action.karma };
    },

    addXP(amount) {
        let xp = parseInt(localStorage.getItem('cdf_xp') || '0');
        xp += amount;
        localStorage.setItem('cdf_xp', xp);
        
        // Check Level Up
        const oldLevel = parseInt(localStorage.getItem('cdf_level') || '1');
        const newLevel = LevelLogic.calculateLevel(xp);
        
        if(newLevel > oldLevel) {
            localStorage.setItem('cdf_level', newLevel);
            window.dispatchEvent(new CustomEvent('cdf-level-up', { detail: { level: newLevel } }));
        }
        
        window.dispatchEvent(new CustomEvent('cdf-xp-update', { detail: { xp, amount } }));
    },

    addKarma(amount) {
        let karma = parseInt(localStorage.getItem('cdf_karma') || '0');
        karma += amount;
        localStorage.setItem('cdf_karma', karma);
        window.dispatchEvent(new CustomEvent('cdf-karma-update', { detail: { karma, amount } }));
    }
};

// Global Access
window.Gamification = {
    Level: LevelLogic,
    Karma: KarmaSystem
};
