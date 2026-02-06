/**
 * Agent: Hype Ref (The Guardian)
 * Purpose: Validation, Rule Enforcement, Voting Security.
 */
class HypeRefAgent {
    constructor() {
        this.name = "Hype Ref";
        document.addEventListener('agent-alert', (e) => this.handleAlert(e.detail));
    }

    // --- VOTING LOGIC ---
    vote(fighter) {
        if (localStorage.getItem('has_voted')) {
            alert(`🚫 ${this.name} SAYS: "ONE VOTE PER BATTLE! DONT BE GREEDY!"`);
            return;
        }

        // Logic here would call SoundEngineer to increase aura
        if (window.SoundEngineer) {
            window.SoundEngineer.increaseAura(fighter, 500);
            localStorage.setItem('has_voted', 'true');
            alert(`✅ ${this.name}: "VOTE COUNTED FOR ${fighter.toUpperCase()}! CLEAN HIT!"`);
        }
    }

    // --- REGISTRATION VALIDATION ---
    validateEntry(name, style) {
        // Simple check (could be expanded)
        const forbiddenWords = ['test', 'admin', 'null', 'undefined'];
        if (forbiddenWords.includes(name.toLowerCase())) {
            alert(`🛑 ${this.name}: "ILLEGAL NAME! CHOOSE A REAL TITLE!"`);
            return false;
        }
        return true;
    }

    handleAlert(detail) {
        if(detail.message.includes('NEW DATA UPLOADED')) {
            // Ref Acknowledges new Challenger
            console.log(`[${this.name}] "I see a new contender. Paperwork looks legit."`);
        }
    }
}

window.HypeRef = new HypeRefAgent();
