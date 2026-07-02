/**
 * Flowee Marketplace Tour — Bazaar onboarding (English)
 */
class FloweeMarketplaceTour {
    constructor() {
        window.FloweeMarketplaceTour = this;
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.start(), 2000));
    }

    async speak(text) {
        if (window.Flowee) window.Flowee.talk(true, text, 'guide');
        if (window.FloweeVoice) {
            await window.FloweeVoice.speakAsync(text);
            await window.FloweeVoice.waitAfterSpeech(500);
        } else await new Promise((r) => setTimeout(r, 2800));
    }

    async start() {
        const path = location.pathname;
        if (!path.includes('marketplace')) return;
        const key = path.includes('marketplace_3d') ? 'cdf_bazaar_3d_tour_v1' : 'cdf_bazaar_tour_v1';
        if (localStorage.getItem(key)) return;
        await this.speak('Welcome to the Grand Bazaar — six guilds, one flow. Arts, Skills, Sounds, Healing, Products, Services.');
        if (path.includes('marketplace_3d')) {
            await this.speak('Swipe the guild cards below, or tap the arrows. The clay huts above match each guild — no spinning circus, just Lisbon soul.');
            await this.speak('Tap Enter on a guild to dive in. Forge mints artifacts. My Stall is your trader desk.');
        } else {
            await this.speak('Tap any guild island, or enter the immersive 3D bazaar. Each hut holds different artifacts and quests.');
        }
        await this.speak('Complete Bazaar Initiation in the Codex for +50 XP when you enter your first guild.');
        localStorage.setItem(key, '1');
    }
}
new FloweeMarketplaceTour();
