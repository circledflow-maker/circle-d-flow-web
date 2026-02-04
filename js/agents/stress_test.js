/**
 * Agent 4: The Destroyer (Stress-Test)
 * Simulates chaos to find weak points.
 * Usage: Type 'startChaos()' in console.
 */

class StressTestAgent {
    constructor() {
        this.name = "The Destroyer";
        this.active = false;
        
        // Expose to global
        window.startChaos = () => this.start();
        window.stopChaos = () => this.stop();

        // Auto-start if query param present
        if (new URLSearchParams(window.location.search).has('chaos')) {
            this.start();
        }
    }

    start() {
        if (this.active) return;
        this.active = true;
        console.warn(`[${this.name}] CHAOS MODE INITIATED. BRACE YOURSELF.`);

        this.interval = setInterval(() => {
            this.performAction();
        }, 300); // Fast actions
    }

    stop() {
        this.active = false;
        clearInterval(this.interval);
        console.log(`[${this.name}] Chaos mode deactivated.`);
    }

    performAction() {
        const actions = ['scroll', 'click', 'input'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        try {
            switch(action) {
                case 'scroll':
                    window.scrollTo({
                        top: Math.random() * document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                    break;
                case 'click':
                    const clickables = document.querySelectorAll('button, a, div');
                    const target = clickables[Math.floor(Math.random() * clickables.length)];
                    if (target) {
                        target.click();
                        // Highlight clicked element
                        target.style.outline = "2px solid red";
                        setTimeout(() => target.style.outline = "", 200);
                    }
                    break;
                case 'input':
                    const inputs = document.querySelectorAll('input, textarea');
                    const input = inputs[Math.floor(Math.random() * inputs.length)];
                    if (input) {
                        input.value = "CHAOS_" + Math.random().toString(36).substring(7);
                    }
                    break;
            }
        } catch (e) {
            console.error(`[${this.name}] Exception caught:`, e);
        }
    }
}

// Initialize
new StressTestAgent();
