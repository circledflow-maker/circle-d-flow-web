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
        await this.speak('Your Vision Studio — upload a frame, then tag it as a <strong>Cinema Stage</strong> on the Atlas (GPS within 50m).');
        await this.speak('Visitors who walk into your stage zone earn XP and see who planted it. Share the QR from the map pin.');
        await this.speak('Daily missions still drop each morning. Build your archive — contests and D Gallery bookings live in the studio paths.');
        localStorage.setItem('cdf_vision_studio_tour_v1', '1');
    }
}
new FloweeVisionTour();
