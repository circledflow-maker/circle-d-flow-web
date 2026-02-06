/**
 * THE ILLUSTRATOR AGENT (The Visualizer)
 * Injects "Visual Quests" (User Photos) into Manga Panels.
 */
class IllustratorAgent {
    constructor() {
        this.gallery = JSON.parse(localStorage.getItem('cdf_gallery') || '[]');
        this.init();
    }

    init() {
        console.log("🎨 [Illustrator] Mixing colors...");
        this.injectVisuals();
    }

    injectVisuals() {
        // Find panels marked for user art
        const artPanels = document.querySelectorAll('.manga-panel[data-art-slot="true"]');
        if (this.gallery.length > 0 && artPanels.length > 0) {
            // Pick random art
            const art = this.gallery[Math.floor(Math.random() * this.gallery.length)];
            artPanels.forEach(panel => {
                panel.style.backgroundImage = `url('${art.src}')`;
                panel.classList.add('has-user-art');
            });
        }
    }
}
window.Illustrator = new IllustratorAgent();
