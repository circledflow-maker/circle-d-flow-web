/**
 * Agent: The Visual Eye (The Visionary)
 * Purpose: Central Visual Cortex. Monitors Layout, Assets, and Theme.
 * Coordinates with: The Helper (Repair), Flowee (Voice), and Pulse (System).
 */

class VisualEyeAgent {
    constructor() {
        this.name = "The Visionary";
        this.status = "observing"; // observing, alerting, correcting
        this.integrityScore = 100;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Opening the Eye... 👁️`);
        
        // 1. Theme Awareness
        this.checkTheme();
        
        window.addEventListener('load', () => this.checkPerformance());
        
        // 2. Continuous Layout Watch (Optimized)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.scanReality(), 200);
        });
        
        // 3. Initial Scan
        setTimeout(() => this.scanReality(), 1000);

        // 4. Connect to Mesh
        this.announcePresence();
    }

    announcePresence() {
        // Dispatch event for other agents
        const evt = new CustomEvent('VisualEye:Awaken', { detail: { agent: this } });
        document.dispatchEvent(evt);
    }

    scanReality() {
        // Check 1: Horizontal Overflow (The Blur)
        const docWidth = document.documentElement.clientWidth;
        const bodyWidth = document.body.scrollWidth;

        if (bodyWidth > docWidth) {
            this.reportAnomaly("Dimensional Bleed (Overflow)", "The layout is stretching beyond the Void.");
            this.integrityScore -= 10;
        }

        // Check 2: Broken Assets (The Glitch)
        // We defer repair to The Helper, but we observe the count.
        const brokenImages = Array.from(document.images).filter(img => !img.complete || img.naturalHeight === 0);
        if (brokenImages.length > 0) {
            this.reportAnomaly("Visual Fracture", `${brokenImages.length} assets are destabilized.`);
            this.integrityScore -= (brokenImages.length * 5);
            
            // Signal The Helper
            if (window.Helper) window.Helper.repairBatch(brokenImages);
        }

        // Check 3: Contrast/Theme Safety
        // this.checkTheme(); // Simple check logic

        this.updateStatus();
    }

    reportAnomaly(type, desc) {
        console.warn(`[${this.name}] ⚠️ ANOMALY: ${type} - ${desc}`);
        
        // Trigger Flowee if critical
        if (this.integrityScore < 80 && window.Flowee) {
            window.Flowee.visionaryMode(true);
            window.Flowee.talk(true, `Architect! The Visuals are glitching! ${desc}`);
        }
    }

    checkTheme() {
        // Ensure we aren't displaying white-on-white text accidentally
        // Simple heuristic for now
        const bg = window.getComputedStyle(document.body).backgroundColor;
        // console.log(`[${this.name}] Theme Background: ${bg}`);
    }

    checkPerformance() {
        if (window.performance) {
            const timing = window.performance.timing;
            if (!timing.loadEventEnd || timing.loadEventEnd <= timing.navigationStart) return;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            if (loadTime > 3000) {
                 this.reportAnomaly("Time Dilation", `Reality loading slow (${loadTime}ms). Optimizing flow...`);
            } else {
                 console.log(`[${this.name}] Reality Sync: Optimal (${loadTime}ms).`);
            }
        }
    }

    updateStatus() {
        if (this.integrityScore < 50) this.status = "critical";
        else if (this.integrityScore < 90) this.status = "alerting";
        else this.status = "observing";
        
        // Optional: Pulse DOM to show "All Good" or "Warning"
        // console.log(`[${this.name}] Integrity: ${this.integrityScore}% [${this.status}]`);
    }
}

// Singleton Init
window.VisualEye = new VisualEyeAgent();
