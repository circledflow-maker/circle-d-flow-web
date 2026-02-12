/**
 * Agent: Base Class
 * Purpose: Standardized structure for all Agents in the Mesh.
 */
class Agent {
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
            console.log(`[${this.name}] Initializing...`);
            this.init();
            this.initialized = true;
            console.log(`[${this.name}] Online.`);
        } catch (e) {
            console.error(`[${this.name}] Initialization Failed:`, e);
        }
    }

    init() {
        // Override me
    }

    log(msg) {
        console.log(`[${this.name}] ${msg}`);
    }
}
