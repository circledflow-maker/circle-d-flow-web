/**
 * AGENT: REGISTRY (The Scribe)
 * Role: Manages the "Universal Registry" of User Created Artifacts.
 * storage: 'cdf_registry' (LocalStorage)
 */

class RegistryAgent {
    constructor() {
        this.name = "RegistryAgent";
        this.storageKey = "cdf_registry";
        this.init();
    }

    init() {
        console.log(`[${this.name}] Opening the Vault of Creations...`);
        // Ensure registry exists
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        window.RegistryAgent = this;
    }

    /**
     * Saves a new artifact to the registry.
     * @param {Object} item - { name, guild, price, visual, voiceMemo, ... }
     */
    saveArtifact(item) {
        try {
            const registry = this.getArtifacts();
            
            // Add Metadata
            const entry = {
                id: `ART-${Date.now().toString(36).toUpperCase()}`,
                timestamp: new Date().toISOString(),
                ...item
            };

            // Limit Storage (Simple FIFO) to prevent quota errors
            // If total > 20, remove oldest
            if (registry.length >= 20) {
                registry.shift(); 
                console.warn(`[${this.name}] Registry full. Archived oldest artifact.`);
            }

            registry.push(entry);
            localStorage.setItem(this.storageKey, JSON.stringify(registry));
            
            console.log(`[${this.name}] Artifact Sealed: ${entry.id}`);
            return entry;
        } catch (e) {
            console.error(`[${this.name}] Failed to scribe artifact:`, e);
            alert("Registry Error: Storage Full or Corrupted.");
            return null;
        }
    }

    getArtifacts() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
        } catch (e) {
            return [];
        }
    }

    clearRegistry() {
        if(confirm("Burn the Registry? This cannot be undone.")) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
            console.log(`[${this.name}] Registry Cleared.`);
            location.reload();
        }
    }

    // --- UTILS ---
    
    // Calculates Total Value of Player's Creations
    getPortfolioValue() {
        const items = this.getArtifacts();
        return items.reduce((acc, item) => acc + (parseInt(item.price.flow) || 0), 0);
    }
}

new RegistryAgent();
