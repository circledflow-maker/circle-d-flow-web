/**
 * Flowee Voice — English TTS with paced tour support
 */
(function () {
    function stripForSpeech(text) {
        return String(text || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\*\*/g, '')
            .replace(/[◈●▶⌇⊕⇄◉▣⌂⋈│∿✧∞?⛓▦✿☽↺❧⌘⊛⚔▤☮♡☺◎✦↻♥⚑]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function pickVoice() {
        const voices = window.speechSynthesis?.getVoices() || [];
        return voices.find((v) => v.lang.startsWith('en') && /female|samantha|zira|google us english/i.test(v.name))
            || voices.find((v) => v.lang.startsWith('en'))
            || voices[0];
    }

    function estimateMs(text) {
        const words = stripForSpeech(text).split(/\s+/).filter(Boolean).length;
        return Math.max(2800, Math.min(18000, words * 480 + 800));
    }

    window.FloweeVoice = {
        enabled: localStorage.getItem('cdf_flowee_voice') !== 'false',
        isSpeaking: false,

        speak(text) {
            if (!this.enabled || !('speechSynthesis' in window)) return Promise.resolve(0);
            return this.speakAsync(text);
        },

        speakAsync(text) {
            return new Promise((resolve) => {
                if (!this.enabled || !('speechSynthesis' in window)) {
                    resolve(estimateMs(text));
                    return;
                }
                const clean = stripForSpeech(text);
                if (!clean) {
                    resolve(0);
                    return;
                }

                const est = estimateMs(clean);
                window.speechSynthesis.cancel();
                this.isSpeaking = true;

                const msg = new SpeechSynthesisUtterance(clean);
                const voice = pickVoice();
                if (voice) msg.voice = voice;
                msg.lang = 'en-US';
                msg.rate = 0.82;
                msg.pitch = 1.02;

                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    this.isSpeaking = false;
                    resolve(est);
                };

                msg.onend = finish;
                msg.onerror = finish;
                setTimeout(finish, est + 600);

                window.speechSynthesis.speak(msg);
            });
        },

        waitAfterSpeech(extraMs = 600) {
            return new Promise((r) => setTimeout(r, extraMs));
        },

        stop() {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            this.isSpeaking = false;
        },
    };

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => pickVoice();
    }
})();
