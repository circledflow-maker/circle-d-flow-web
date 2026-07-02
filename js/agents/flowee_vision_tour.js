/**
 * Flowee Vision Tour — photo studio onboarding
 */
class FloweeVisionTour {
    constructor() {
        window.FloweeVisionTour = this;
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.start(), 2200));
    }

    async speak(text) {
        if (window.Flowee) window.Flowee.talk(true, text, 'guide');
        if (window.FloweeVoice) { await window.FloweeVoice.speakAsync(text); await window.FloweeVoice.waitAfterSpeech(500); }
        else await new Promise((r) => setTimeout(r, 2800));
    }

    async start() {
        if (!location.pathname.includes('vision_studio')) return;
        if (localStorage.getItem('cdf_vision_studio_tour_v1')) return;
        await this.speak('Your Vision Studio — every photo and reel you upload lives here. Tag places on the Atlas for bonus runes.');
        await this.speak('One daily mission drops each morning: graffiti, plants, buildings, locals. Shoot it, upload, claim XP.');
        await this.speak('Future contests will crown best Lisbon frames. For now, build your portfolio — Flowee will guide contests soon.');
        localStorage.setItem('cdf_vision_studio_tour_v1', '1');
    }
}
new FloweeVisionTour();
