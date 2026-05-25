/**
 * Agent: Flow Vitality & Leveling
 * Purpose: Manages EXP, Soul Level, and Flow Stamina (Healing).
 */

class FlowVitality {
    constructor() {
        this.level = 1;
        this.exp = 0;
        this.maxExp = 1000;
        this.stamina = 100;
        this.maxStamina = 100;
        this.karma = 0;
        this.isResting = false;
        this.rechargeRate = 1; // % per tick
        
        this.loadState();
        this.initUI();
        this.startPassiveRecharge();
    }

    loadState() {
        const saved = localStorage.getItem('flow_vitality_state');
        if (saved) {
            const data = JSON.parse(saved);
            this.level = data.level || 1;
            this.exp = data.exp || 0;
            this.stamina = data.stamina || 100;
        }
        this.syncWithSupabase();
    }

    async syncWithSupabase() {
        if (!window.supabaseClient) return;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            const { data: profile } = await window.supabaseClient.from('profiles').select('exp, level, metadata').eq('id', user.id).single();
            if (profile) {
                // Merge states, database takes priority for level/exp/karma
                this.level = profile.level || this.level;
                this.exp = profile.exp || this.exp;
                this.karma = profile.karma || this.karma;
                if (profile.metadata && profile.metadata.stamina !== undefined) {
                    this.stamina = profile.metadata.stamina;
                }
                this.updateUI();
            }
        } catch (err) {
            console.warn("Vitality Sync: Offline mode active.");
        }
    }

    async saveState() {
        localStorage.setItem('flow_vitality_state', JSON.stringify({
            level: this.level,
            exp: this.exp,
            stamina: this.stamina
        }));

        if (!window.supabaseClient) return;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            await window.supabaseClient.from('profiles').update({
                level: this.level,
                exp: this.exp,
                karma: this.karma,
                metadata: {
                    stamina: this.stamina,
                    last_sync: new Date().toISOString()
                }
            }).eq('id', user.id);
        } catch (err) {
            console.error("Failed to sync vitality to cloud:", err);
        }
    }

    initUI() {
        this.updateUI();
    }

    updateUI() {
        const levelEl = document.getElementById('soul-level');
        const expValEl = document.getElementById('exp-val');
        const expBarEl = document.getElementById('exp-bar');
        const staminaValEl = document.getElementById('stamina-val');
        const staminaBarEl = document.getElementById('stamina-bar');

        if (levelEl) levelEl.innerText = this.level;
        if (expValEl) expValEl.innerText = this.exp;
        if (expBarEl) {
            const pct = (this.exp / this.maxExp) * 100;
            expBarEl.style.width = `${pct}%`;
        }
        if (staminaValEl) staminaValEl.innerText = `${Math.floor(this.stamina)}%`;
        if (staminaBarEl) staminaBarEl.style.width = `${this.stamina}%`;
    }

    addEXP(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.levelUp();
        }
        this.updateUI();
        this.saveState();
        
        if (window.Pusher) window.Pusher.showToast(`+${amount} EXP gained!`, 'success');
    }

    levelUp() {
        this.level++;
        this.exp -= this.maxExp;
        this.maxExp = Math.floor(this.maxExp * 1.2); // Leveling curve
        
        if (window.Flowee) window.Flowee.talk(true, `Soul Level Up! You are now Level ${this.level}.`, 'celebrate');
        if (window.SoundEngineer) window.SoundEngineer.playSFX('ui_confirm');
    }

    useStamina(amount) {
        this.stamina = Math.max(0, this.stamina - amount);
        this.updateUI();
        this.saveState();
    }

    recharge(amount) {
        this.stamina = Math.min(this.maxStamina, this.stamina + amount);
        this.updateUI();
        this.saveState();
    }

    setResting(active) {
        this.isResting = active;
        if (active) {
            if (window.Pusher) window.Pusher.showToast("Resting at Sanctuary... Recharging Flow.", "success");
        }
    }

    startPassiveRecharge() {
        // Passive recharge (1% every 30 seconds, or faster if resting)
        setInterval(() => {
            if (this.stamina < this.maxStamina) {
                const amount = this.isResting ? 5 : 1; // 5x faster when resting
                this.recharge(amount);
                
                // Reward Karma for Resting in Neutral Zones
                if (this.isResting) {
                    this.addKarma(1);
                }
            }
        }, 30000);
    }

    addKarma(amount) {
        this.karma += amount;
        this.saveState();
        // Silent update, maybe a small toast every 10 karma?
        if (this.karma % 10 === 0 && window.Pusher) {
            window.Pusher.showToast(`+10 Flow Karma accumulated.`, 'karma');
        }
    }
}

// Auto Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.VitalityAgent = new FlowVitality();
});
