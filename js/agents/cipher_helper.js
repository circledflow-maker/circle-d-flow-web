/**
 * THE CIPHER HELPER (Seal Manager)
 * Manages Content Gating (Nen Seals) based on Level.
 */
class CipherHelper {
    constructor() {
        this.level = 1; // Default
        this.loadStats();
        this.init();
    }

    loadStats() {
        try {
            const stats = JSON.parse(localStorage.getItem('userStats') || '{"level":1}');
            this.level = stats.level || 1;
        } catch(e) { console.error(e); }
    }

    init() {
        console.log(`🔐 [Cipher] Security Level: ${this.level}`);
        this.checkSeals();
    }

    checkSeals() {
        document.querySelectorAll('[data-seal-level]').forEach(seal => {
            const req = parseInt(seal.dataset.sealLevel);
            if (this.level >= req) {
                seal.classList.remove('blur-sm', 'locked');
                seal.classList.add('unlocked');
                const btn = seal.querySelector('.break-seal-btn');
                if(btn) btn.style.display = 'none';
            } else {
                seal.classList.add('blur-sm', 'locked');
            }
        });
    }

    breakSeal(targetLevel) {
        // Simulation for the button click
        if (this.level >= targetLevel) {
            alert("Seal Broken!");
            this.checkSeals();
        } else {
            alert(`Cipher Strength Too High. Requires Level ${targetLevel}.`);
        }
    }
}
window.CipherHelper = new CipherHelper();
