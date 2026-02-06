/**
 * Agent 4: The Sentinel (Performance Monitor)
 * Formerly 'Stress Test'. Monitors FPS and simplifies visuals if needed.
 */

class PerformanceAgent {
    constructor() {
        this.name = "The Sentinel";
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.lowFpsCount = 0;
        this.isOptimized = false;
        
        this.init();
    }

    init() {
        console.log(`[Phoenix-EE] ${this.name} online.`);
        this.monitor();
    }

    monitor() {
        const now = performance.now();
        this.frameCount++;

        if (now >= this.lastTime + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;

            // Health Check
            if (this.fps < 30) {
                this.lowFpsCount++;
                console.warn(`[${this.name}] Low FPS detected: ${this.fps}`);
            } else {
                this.lowFpsCount = Math.max(0, this.lowFpsCount - 1); // Recover
            }

            // Trigger Optimization if sustained lag
            if (this.lowFpsCount > 3 && !this.isOptimized) {
                this.optimize();
            }
        }

        requestAnimationFrame(() => this.monitor());
    }

    optimize() {
        console.warn(`[${this.name}] Sustained Low FPS. Engaging Optimization Protocol.`);
        
        // 1. Disable Blurs
        document.body.classList.add('reduce-motion');
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                backdrop-filter: none !important;
                box-shadow: none !important;
                transition: none !important;
                animation: none !important;
            }
            .bg-overlay { opacity: 1 !important; background: #000 !important; }
        `;
        document.head.appendChild(style);

        // 2. Notify User
        this.notify("Visuals optimized for smoother flow.");
        this.isOptimized = true;
    }

    notify(msg) {
        // Use BridgePusher's flowee if available, or simple console
        if (window.BridgePusher && window.BridgePusher.elements.floweeText) {
             // Don't interrupt flow if intro is active, but we can log it
             console.log(`[${this.name}] Notification: ${msg}`);
        }
    }
}

// Initialize
new PerformanceAgent();
