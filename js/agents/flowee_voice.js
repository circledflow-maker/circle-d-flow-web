/**
 * Flowee Voice — English TTS for Quest Triad tours (opt-out via cdf_flowee_voice=false)
 */
(function () {
    function stripForSpeech(text) {
        return String(text || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\*\*/g, '')
            .replace(/[◈●▶]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function pickVoice() {
        const voices = window.speechSynthesis?.getVoices() || [];
        return voices.find((v) => v.lang.startsWith('en') && /female|samantha|zira|google us english/i.test(v.name))
            || voices.find((v) => v.lang.startsWith('en'))
            || voices[0];
    }

    window.FloweeVoice = {
        enabled: localStorage.getItem('cdf_flowee_voice') !== 'false',

        speak(text) {
            if (!this.enabled || !('speechSynthesis' in window)) return;
            const clean = stripForSpeech(text);
            if (!clean) return;
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(clean);
            const voice = pickVoice();
            if (voice) msg.voice = voice;
            msg.lang = 'en-US';
            msg.rate = 0.92;
            msg.pitch = 1.05;
            window.speechSynthesis.speak(msg);
        },

        stop() {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        },
    };

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => pickVoice();
    }
})();
