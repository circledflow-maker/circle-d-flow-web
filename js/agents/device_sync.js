/**
 * Agent 2: The Synchronizer (Cross-Device Mirror)
 * Ensures desktop features translate to mobile behaviors.
 */

class DeviceSyncAgent {
    constructor() {
        this.name = "The Synchronizer";
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.init();
    }

    init() {
        console.log(`[Phoenix-EE] ${this.name} online. Mode: ${this.isTouch ? 'Touch' : 'Mouse'}`);

        if (this.isTouch) {
            this.optimizeForTouch();
        }
    }

    optimizeForTouch() {
        // 1. Hover-to-Click mapping
        // Find elements with hover effects that might need touch handling
        const hoverElements = document.querySelectorAll('.group, .hover\\:scale-105');
        
        hoverElements.forEach(el => {
            // Ensure they trigger nicely on tap
            el.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, {passive: true});
            
            el.addEventListener('touchend', function() {
                setTimeout(() => this.classList.remove('touch-active'), 300);
            }, {passive: true});
        });

        // 2. Increase Tap Targets for small links
        const smallLinks = document.querySelectorAll('a, button');
        smallLinks.forEach(link => {
            const rect = link.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                // Add a class or style that ensures min-height/width via padding if strict consistency is needed
                // console.log(`[${this.name}] Small tap target detected:`, link);
            }
        });
    }
}

// Initialize
new DeviceSyncAgent();
