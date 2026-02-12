/**
 * Circle D Flow - Level Logic (Resonance System)
 * Formula: EP = Base_XP * (Level ^ Scaling_Factor)
 */

class ResonanceSystem {
    constructor() {
        this.BASE_XP = 500; // XP needed for Level 1 -> 2
        this.SCALING_FACTOR = 1.2; // Difficulty multiplier
        this.STORAGE_KEY_XP = 'cdf_user_xp';
        this.STORAGE_KEY_KARMA = 'cdf_user_karma';
        this.STORAGE_KEY_LEVEL = 'cdf_user_level';

        // Bind global access
        window.Resonance = this;
    }

    /**
     * Calculates current level based on Total XP.
     * @param {number} totalXP 
     * @returns {number} Current Level (1-based)
     */
    calculateLevel(totalXP) {
        if (totalXP < this.BASE_XP) return 1;
        // Inverse of the formula: Level = (XP / Base)^(1/Scaling) + 1
        return Math.floor(Math.pow(totalXP / this.BASE_XP, 1 / this.SCALING_FACTOR)) + 1;
    }

    /**
     * Calculates Total XP required to reach a specific level.
     * @param {number} level 
     * @returns {number} Total XP required
     */
    xpForLevel(level) {
        if (level <= 1) return 0;
        return Math.floor(this.BASE_XP * Math.pow(level - 1, this.SCALING_FACTOR));
    }

    /**
     * Returns progress data for the Dashboard UI/Flowee.
     * @param {number} currentTotalXP (Optional: defaults to stored)
     * @returns {object} { level, percent, remaining, currentXP, nextLevelXP }
     */
    getProgress(currentTotalXP = null) {
        const xp = currentTotalXP !== null ? currentTotalXP : this.getXP();
        const currentLevel = this.calculateLevel(xp);
        
        const xpStartCurrentLevel = this.xpForLevel(currentLevel);
        const xpForNextLevel = this.xpForLevel(currentLevel + 1);
        
        const xpGainedInLevel = xp - xpStartCurrentLevel;
        const xpRequiredForLevel = xpForNextLevel - xpStartCurrentLevel;
        
        // Prevent division by zero
        const progressPercent = xpRequiredForLevel > 0 
            ? (xpGainedInLevel / xpRequiredForLevel) * 100 
            : 0;
        
        return {
            level: currentLevel,
            percent: Math.min(100, Math.max(0, progressPercent)).toFixed(2),
            remaining: xpForNextLevel - xp,
            currentXP: xp,
            nextLevelXP: xpForNextLevel
        };
    }

    // --- STORAGE MANAGEMENT ---

    getXP() {
        return parseInt(localStorage.getItem(this.STORAGE_KEY_XP) || '0');
    }

    getKarma() {
        return parseInt(localStorage.getItem(this.STORAGE_KEY_KARMA) || '0');
    }

    /**
     * Adds XP and handles Level-Up Events.
     * @param {number} amount 
     * @returns {boolean} True if leveled up
     */
    addXP(amount) {
        const oldXP = this.getXP();
        const oldLevel = this.calculateLevel(oldXP);
        const newXP = oldXP + amount;
        
        localStorage.setItem(this.STORAGE_KEY_XP, newXP);
        console.log(`[Resonance] +${amount} XP | Total: ${newXP}`);

        const newLevel = this.calculateLevel(newXP);
        if (newLevel > oldLevel) {
            this.handleLevelUp(newLevel);
            return true;
        }
        return false;
    }

    /**
     * Modifies Karma (positive or negative).
     * @param {number} amount 
     */
    modKarma(amount) {
        const current = this.getKarma();
        const newVal = current + amount;
        localStorage.setItem(this.STORAGE_KEY_KARMA, newVal);
        console.log(`[Resonance] Karma Modified: ${amount} | Total: ${newVal}`);
        return newVal;
    }

    handleLevelUp(newLevel) {
        console.log(`[Resonance] LEVEL UP! Reached Level ${newLevel}`);
        localStorage.setItem(this.STORAGE_KEY_LEVEL, newLevel);
        
        this.updateDashboardUI();

        // Notify Flowee/Pusher if available
        if(window.Flowee) window.Flowee.levelUpCeremony(newLevel);
        if(window.Pusher) window.Pusher.broadcast('LEVEL_UP', { level: newLevel });
    }

    /**
     * Updates the Dashboard Header UI (Level & Bar)
     */
    updateDashboardUI() {
        const lvlEl = document.getElementById('header-lvl');
        const barEl = document.getElementById('header-xp-bar');
        
        if(lvlEl && barEl) {
            const progress = this.getProgress();
            lvlEl.innerText = progress.level;
            barEl.style.width = `${progress.percent}%`;
            
            // Tooltip or Title for clarity
            barEl.parentElement.title = `${progress.currentXP} / ${progress.nextLevelXP} XP`;
        }
    }
}

// Initialize
const sys = new ResonanceSystem();
// Try to update UI if DOM is ready, or wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => sys.updateDashboardUI());
} else {
    sys.updateDashboardUI();
}
