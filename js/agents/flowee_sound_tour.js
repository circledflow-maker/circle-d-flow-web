/**
 * Flowee Sound Tour — library + system radio onboarding
 */
class FloweeSoundTour {
    constructor() {
        window.FloweeSoundTour = this;
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.start(), 2200));
    }

    async speak(text) {
        if (window.Flowee) window.Flowee.talk(true, text, 'guide');
        if (window.FloweeVoice) { await window.FloweeVoice.speakAsync(text); await window.FloweeVoice.waitAfterSpeech(500); }
        else await new Promise((r) => setTimeout(r, 2800));
    }

    async start() {
        if (!location.pathname.includes('system_radio') && !location.pathname.includes('sound_dashboard')) return;
        const key = location.pathname.includes('system_radio') ? 'cdf_radio_tour_v1' : 'cdf_sound_dash_tour_v1';
        if (localStorage.getItem(key)) return;
        await this.speak('Sound sphere online. Mihaly Flow: challenge matches skill — upload, share, get played on System Radio.');
        await this.speak('Mark your role: producer, DJ, instrumentalist, or multi-artist. License your track so Navigators can use it with credit.');
        await this.speak('Connect Spotify or SoundCloud soon. For now, upload WAV or MP3 and queue for radio rotation.');
        localStorage.setItem(key, '1');
    }
}
new FloweeSoundTour();
