/**
 * Flowee Voice — warmer, empathetic TTS with mute toggle
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
        return voices.find((v) => v.lang.startsWith('en') && /samantha|zira|karen|google uk english female|microsoft.*female/i.test(v.name))
            || voices.find((v) => v.lang.startsWith('en') && !/david|male|daniel/i.test(v.name))
            || voices.find((v) => v.lang.startsWith('en'))
            || voices[0];
    }

    function estimateMs(text) {
        const words = stripForSpeech(text).split(/\s+/).filter(Boolean).length;
        return Math.max(2600, Math.min(16000, words * 420 + 700));
    }

    window.FloweeVoice = {
        enabled: localStorage.getItem('cdf_flowee_voice') !== 'false',
        isSpeaking: false,

        setEnabled(on) {
            this.enabled = !!on;
            localStorage.setItem('cdf_flowee_voice', on ? 'true' : 'false');
            if (!on) this.stop();
            window.dispatchEvent(new CustomEvent('FLOWEE_VOICE_TOGGLED', { detail: { enabled: on } }));
        },

        toggle() {
            this.setEnabled(!this.enabled);
            return this.enabled;
        },

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
                msg.rate = 0.88;
                msg.pitch = 1.18;
                msg.volume = 0.92;

                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    this.isSpeaking = false;
                    resolve(est);
                };

                msg.onend = finish;
                msg.onerror = finish;
                setTimeout(finish, est + 500);

                window.speechSynthesis.speak(msg);
            });
        },

        waitAfterSpeech(extraMs = 500) {
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
