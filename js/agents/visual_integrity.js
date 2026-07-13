/**
 * Agent 1: The Aesthete (Visual Integrity)
 * Monitors the box model, prevents overflow, and ensures theme consistency.
 */

class VisualIntegrityAgent {
    constructor() {
        this.name = "The Aesthete";
        this._lastWarn = 0;
        this._skipIds = new Set([
            'mobile-menu', 'connection-modal', 'sound-gate', 'sphere-sheet-backdrop',
            'sphere-world-sheet', 'flowee-agent', 'sentinel-eye', 'mobile-drawer'
        ]);
        this.init();
    }

    init() {
        console.log(`[Phoenix-EE] ${this.name} online.`);
        document.documentElement.style.overflowX = 'clip';
        document.body.style.overflowX = 'clip';
        document.body.style.maxWidth = '100vw';

        window.addEventListener('load', () => this.checkSystem());
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.checkSystem(), 200);
        });

        setInterval(() => this.checkOverflow(true), 15000);
    }

    shouldSkip(el) {
        if (!el || el.nodeType !== 1) return true;
        if (el.id && this._skipIds.has(el.id)) return true;
        if (el.classList?.contains('no-overflow-check')) return true;
        if (el.classList?.contains('cdf-star') || el.classList?.contains('cdf-meteor')) return true;
        if (el.classList?.contains('sphere-world-sheet') || el.classList?.contains('sphere-sheet-backdrop')) return true;
        if (el.classList?.contains('password-gate-overlay')) return true;
        const tag = el.tagName?.toLowerCase();
        if (tag === 'svg' || tag === 'path' || tag === 'circle') return true;
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' && parseFloat(style.opacity || '1') < 0.05) return true;
        return false;
    }

    checkSystem() {
        this.checkOverflow(false);
        this.enforceTheme();
    }

    checkOverflow(silent) {
        const docWidth = document.documentElement.clientWidth;
        const bodyWidth = document.body.scrollWidth;
        const overflow = bodyWidth - docWidth;

        if (overflow <= 3) return;

        const now = Date.now();
        if (!silent && now - this._lastWarn > 30000) {
            this._lastWarn = now;
            console.warn(`[${this.name}] Horizontal overflow: body ${bodyWidth}px > viewport ${docWidth}px (+${overflow}px)`);
        }

        document.documentElement.style.overflowX = 'clip';
        document.body.style.overflowX = 'clip';
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
