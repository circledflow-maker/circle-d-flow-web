/**
 * Agent: The Helper (VisualHelper)
 * Purpose: Visual Integrity & Error Resolution.
 * "I patch the cracks in the reality. If an asset fails, I provide the illusion."
 */

class HelperAgent {
    constructor() {
        this.name = "The Helper";
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Scanning Visual Integrity...`);
        this.monitorAssets();
    }

    monitorAssets() {
        // 1. Listen for global error events on images
        // Note: 'error' event does not bubble, so we must use capture phrase or direct attachment.
        // We'll iterate all current images and observe DOM for new ones.
        
        const images = document.querySelectorAll('img');
        images.forEach(img => this.attachProtector(img));

        // Observer for new images (e.g. rendered by JS)
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.tagName === 'IMG') this.attachProtector(node);
                    if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(img => this.attachProtector(img));
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    attachProtector(img) {
        if (img.dataset.protected) return;
        img.dataset.protected = "true";

        img.addEventListener('error', () => {
             this.repairAsset(img);
        });
        
        // Check if already broken
        if (img.complete && img.naturalHeight === 0) {
            this.repairAsset(img);
        }
    }

    repairAsset(img) {
        console.warn(`[${this.name}] Asset Fracture Detected: ${img.src}`);
        
        const intent = (img.id || img.alt || '').toLowerCase();
        
        if (intent.includes('flowee') || intent.includes('phoenix')) {
            this.replaceWithOrb(img, 'mystic-gold');
            if (window.Flowee) {
                window.Flowee.talk(true, "My visual form is glitching... but I'm still here! 👻");
            }
        } else {
            img.style.display = 'none'; // Hide broken image
        }
    }

    repairBatch(images) {
        console.log(`[${this.name}] Batch Repair Requested: ${images.length} assets.`);
        images.forEach(img => this.repairAsset(img));
    }

    replaceWithOrb(imgElement, colorClass) {
        const wrapper = document.createElement('div');
        wrapper.className = `w-full h-full rounded-full bg-${colorClass}/20 flex items-center justify-center animate-pulse`;
        wrapper.innerHTML = `<span class="material-symbols-outlined text-${colorClass} text-4xl">emoji_nature</span>`;
        
        if (imgElement.parentNode) {
            imgElement.parentNode.replaceChild(wrapper, imgElement);
        }
    }
}

window.Helper = new HelperAgent();
