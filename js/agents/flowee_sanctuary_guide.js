/**
 * Flowee Sanctuary Guide — artist_sanctuary interactive companion (English)
 */
class FloweeSanctuaryGuide {
    constructor() {
        this.profile = null;
        this.artist = null;
        window.FloweeSanctuaryGuide = this;
    }

    async speak(text, mood, options) {
        if (window.Flowee) window.Flowee.talk(true, text, mood || 'guide', options || []);
        if (window.FloweeVoice) await window.FloweeVoice.speakAsync(text);
        if (window.FloweeVoice) await window.FloweeVoice.waitAfterSpeech(500);
    }

    async start(artistData, profile) {
        if (!artistData) return;
        this.artist = artistData;
        this.profile = profile;

        await this.waitForFlowee(8000);
        if (!window.Flowee) return;

        const overlay = document.getElementById('flowee-overlay');
        if (overlay && !overlay.classList.contains('hidden')) return;

        const localData = JSON.parse(localStorage.getItem('soul_data_' + (artistData.id || '')) || 'null');
        if (window.ArtistProfileSync?.needsSoulprint(artistData, localData)) return;

        const key = 'cdf_sanctuary_guide_v1';
        const done = localStorage.getItem(key) === 'done';

        if (!done) {
            await this.runFirstVisitGuide();
            localStorage.setItem(key, 'done');
            await this.saveOnboarding(true);
        } else {
            await this.runReturningPulse();
        }
    }

    waitForFlowee(ms) {
        return new Promise((resolve) => {
            const t0 = Date.now();
            const tick = () => {
                if (window.Flowee?.bubble) return resolve();
                if (Date.now() - t0 > ms) return resolve();
                setTimeout(tick, 200);
            };
            tick();
        });
    }

    username() {
        return this.profile?.username || this.artist?.name || 'Navigator';
    }

    async runFirstVisitGuide() {
        await this.speak(`Akwaaba, ${this.username()}. I am Flowee — your guide in the Circle D Flow sanctuary.`);

        if (window.FloweeNotify) await window.FloweeNotify.promptViaFlowee();

        await this.runInterfaceTutorial({ firstVisit: true });
        await this.offerPathChoice();
    }

    async runReturningPulse() {
        const quest = this.suggestQuest();
        const actions = [
            { label: 'ENTER ATLAS', action: () => { window.location.href = 'quest_map.html'; } },
            { label: 'OPEN QUESTS', action: () => { window.location.href = 'quest_board.html'; } },
            {
                label: 'INTERFACE TOUR',
                action: () => this.runInterfaceTutorial({ firstVisit: false }),
            },
        ];
        if (window.ArtistProfileSync?.needsSoulprint(this.artist)) {
            actions.unshift({
                label: 'COMPLETE SOUL IMPRINT',
                action: () => {
                    if (window.FloweeSoulprint) {
                        window.FloweeSoulprint.start(this.artist, this.artist?.id, () => {
                            if (typeof initData === 'function') initData();
                        });
                    } else if (typeof startInSanctuaryDeepFlow === 'function') {
                        startInSanctuaryDeepFlow();
                    }
                },
            });
        }
        actions.push({ label: 'RESONANCE BAR', action: () => { window.location.href = 'coop.html'; } });
        actions.push({ label: 'STAY HERE', action: () => window.Flowee?.shush() });
        await this.speak(
            `Welcome back, ${this.username()}. ${quest ? `Nearest mission: ${quest.title} — ${quest.reward_exp || 600} XP.` : 'The Atlas awaits your next move.'}`,
            'guide',
            actions
        );
    }

    /**
     * Cinematic / mystic interface tutorial — CDF dock, locked wings, member vault.
     */
    async runInterfaceTutorial(opts = {}) {
        const key = 'cdf_sanctuary_ui_tutorial_v2';
        if (!opts.force && !opts.fromCard && !opts.fromRegister && !opts.firstVisit) {
            if (localStorage.getItem(key) === 'done') return;
        }

        if (opts.fromRegister) {
            await this.speak(
                `You're in the Circle, ${this.username()}. Registration landed you in the 3D Sanctuary — I will show you the interface.`
            );
        } else if (opts.fromCard) {
            await this.speak(
                `Your membership card${opts.memberNumber ? ' (' + opts.memberNumber + ')' : ''} is synced to the Vault. Welcome home.`
            );
        } else if (opts.firstVisit) {
            await this.speak(
                'This Sanctuary is cinematic and mystic — a living stage for your navigator path.'
            );
        }

        if (typeof toggleSanctuaryDock === 'function') toggleSanctuaryDock(true);

        await this.speak(
            'Tap the Circle D Flow logo on the right — that is your control. Confirm it, and the tools stack underneath.'
        );

        await this.speak(
            'Eye is The Vision — theater & archive. Cap is Akademiy — skills & quests. Storefront is the Marketplace. Those three are password-sealed while under construction.'
        );

        await this.speak(
            'Book is the Ledger. Pouch is your Vault — member card and benefits live there. QR is your Soul Seal. Camera captures. Wings open me again anytime.'
        );

        await this.speak(
            'Membership tier is not Artist status. Free members can still join the Flow Pool later — pay never buys the title Artist.',
            'guide',
            [
                {
                    label: 'OPEN VAULT',
                    action: () => {
                        if (typeof toggleModal === 'function') toggleModal('data-modal');
                        window.Flowee?.shush();
                    },
                },
                {
                    label: 'CLAIM / EDIT CARD',
                    action: () => {
                        window.location.href = '/member-card?src=sanctuary&next=' + encodeURIComponent('/pages/artist_sanctuary.html?welcome=card');
                    },
                },
                {
                    label: 'EXPLORE 3D',
                    action: async () => {
                        await this.speak('Use the joystick. Walk the courtyard. I stay with you.');
                        window.Flowee?.shush();
                    },
                },
            ]
        );

        try {
            localStorage.setItem(key, 'done');
        } catch (_) { /* ignore */ }
    }

    onDockExpanded() {
        if (this._dockHinted) return;
        this._dockHinted = true;
        if (window.Flowee?.talk) {
            window.Flowee.talk(
                true,
                'Tools aligned. Vision · Akademiy · Marketplace are locked with a construction password. Vault holds your card.',
                'guide'
            );
        }
    }

    suggestQuest() {
        if (!window.LISBON_QUESTS?.length) return null;
        const active = JSON.parse(localStorage.getItem('cdf_active_quests') || '[]');
        const pending = window.LISBON_QUESTS.find((q) => !active.includes(q.id));
        return pending || window.LISBON_QUESTS[0];
    }

    async offerPathChoice() {
        const quest = this.suggestQuest();
        const questHint = quest
            ? `Try "${quest.title}" — accept it in the Codex, then verify GPS at the pin.`
            : 'Open the Codex to accept your first Lisbon quest.';

        await this.speak('Where should I guide you next?', 'guide', [
            {
                label: 'ENTER ATLAS MAP',
                action: async () => {
                    await this.speak('Routing to the Lisbon Atlas. Enable GPS for NEARBY missions.');
                    setTimeout(() => { window.location.href = 'quest_map.html'; }, 1200);
                },
            },
            {
                label: 'NEAREST QUEST',
                action: async () => {
                    if (quest) {
                        sessionStorage.setItem('target_codex_id', quest.id);
                        await this.speak(`${questHint} Opening the Codex now.`);
                        setTimeout(() => { window.location.href = 'quest_board.html'; }, 1500);
                    } else {
                        await this.speak('No quest data loaded yet. I will open the Codex.');
                        setTimeout(() => { window.location.href = 'quest_board.html'; }, 1200);
                    }
                },
            },
            {
                label: 'SANCTUARY TUTORIAL',
                action: () => this.runSanctuaryTutorial(),
            },
            {
                label: 'EXPLORE HERE',
                action: async () => {
                    await this.speak('Use the joystick to walk. Enter the Kitchen Bar zone for Akwaba menu and Bazaar trade.');
                    window.Flowee?.shush();
                },
            },
        ]);
    }

    async runSanctuaryTutorial() {
        await this.speak('Walk toward the golden zone — Akwaba Kitchen Bar. Taste the art or trade at the Bazaar.');
        await this.speak('Find the Cypher Stage for live soul bubbles. The inner bar holds the Video Archive — upload your moments.');
        await this.speak('When you are ready for the city, tap ENTER ATLAS from my chat options anytime.');
        await this.offerPathChoice();
    }

    async saveOnboarding(guideDone, deepDone) {
        const uid = this.profile?.id || (await window.supabaseClient?.auth.getUser())?.data?.user?.id;
        if (!window.supabaseClient || !uid) return;
        try {
            await window.supabaseClient.from('sanctuary_onboarding').upsert({
                user_id: uid,
                guide_completed: guideDone,
                deep_flow_completed: !!deepDone,
                last_news_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
        } catch (_) {}
    }
}

new FloweeSanctuaryGuide();
