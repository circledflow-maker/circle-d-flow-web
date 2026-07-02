/**
 * Flowee Reward — confirmations for XP, level up, runes (replaces alert())
 */
(function () {
    async function speak(text, mood) {
        if (window.Flowee) window.Flowee.talk(true, text, mood || 'celebrate');
        if (window.FloweeVoice) {
            await window.FloweeVoice.speakAsync(text);
            await window.FloweeVoice.waitAfterSpeech(500);
        } else {
            await new Promise((r) => setTimeout(r, 2800));
        }
    }

    window.FloweeReward = {
        async xpToast(label, xp) {
            const msg = `${label}: +${xp} XP secured.`;
            if (window.Pusher) window.Pusher.showToast(`✅ ${msg}`, 'success');
            await speak(msg, 'celebrate');
        },

        async celebrate(text, mood) {
            if (window.Pusher) window.Pusher.showToast(text, 'success');
            await speak(text, mood || 'celebrate');
        },

        async levelUp(level, feature, redirectUrl) {
            const unlock = window.LEVEL_UNLOCKS?.[level];
            const msg = unlock
                ? `Level ${level} unlocked — ${unlock.feature}! ${unlock.desc}`
                : `Resonance Level ${level} reached, Navigator!`;
            if (window.SoundEngineer) window.SoundEngineer.playSFX('mission_complete');
            if (window.FloweeNotify) window.FloweeNotify.levelUp(level, feature || `Level ${level}`);
            await speak(msg, 'celebrate');
            if (redirectUrl) {
                await speak('Routing you to the next mission area now.', 'guide');
                setTimeout(() => {
                    window.Helper ? window.Helper.safeRedirect(redirectUrl) : (window.location.href = redirectUrl);
                }, 800);
            }
        },

        async grantRune(runeId, tier) {
            const meta = window.getAdinkraMeta?.(runeId) || { name: runeId, meaning: 'Adinkra symbol', glyph: '◈' };
            await speak(`${meta.glyph || '◈'} Adinkra ${meta.name} anchored in ${tier}. ${meta.meaning}`, 'celebrate');
        },
    };
})();
