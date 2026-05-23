/**
 * Agent 1: The Aesthete (Visual Integrity)
 * Monitors the box model, prevents overflow, and ensures theme consistency.
 */

class VisualIntegrityAgent {
    constructor() {
        this.name = "The Aesthete";
        this.init();
    }

    init() {
        console.log(`[Phoenix-EE] ${this.name} online.`);
        
        // Run checks on load and resize
        window.addEventListener('load', () => this.checkSystem());
        window.addEventListener('resize', () => this.checkSystem());
        
        // Periodic check (every 5s) for dynamic content
        setInterval(() => this.checkOverflow(), 5000);
    }

    checkSystem() {
        this.checkOverflow();
        this.enforceTheme();
    }

    checkOverflow() {
        const docWidth = document.documentElement.clientWidth;
        const bodyWidth = document.body.scrollWidth;

        if (bodyWidth > docWidth + 2) {
            console.warn(`[${this.name}] Horizontal Overflow Detected! Body: ${bodyWidth}px > Viewport: ${docWidth}px`);
            
            // Find the culprit
            const allElements = document.getElementsByTagName('*');
            let culprit = null;
            let maxRight = docWidth;

            for (let el of allElements) {
                const rect = el.getBoundingClientRect();
                // Check if element is significantly outside right edge (allow small margin for sub-pixel rendering)
                if (rect.right > docWidth + 1) {
                    // Ignore elements explicitly meant to be wider (like mobile drawer if handled correctly)
                    if (el.id === 'mobile-drawer' || el.classList.contains('no-overflow-check')) continue;
                    
                    console.log(`[${this.name}] Culprit found:`, el);
                    culprit = el;
                    // Attempt auto-fix: Apply outline to visualize (in dev) or clip
                    // el.style.outline = "2px solid red"; 
                }
            }

            // Enforce safeguard
            document.body.style.overflowX = 'hidden';
        }
    }

    enforceTheme() {
        // Basic check to ensure midnight/violet theme is present
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        // Approximation of themes logic checking
        if (bodyBg === 'rgba(0, 0, 0, 0)' || bodyBg === 'transparent') {
             // If body has no bg, it might be white by default in some browsers?
             // Not critical if CSS loads, but good to know.
        }
    }
}

// Initialize
new VisualIntegrityAgent();
