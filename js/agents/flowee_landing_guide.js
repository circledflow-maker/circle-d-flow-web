/**
 * Flowee Landing Guide — post-intro world explainer for index.html
 */
(function () {
    const WORLDS = [
        {
            id: 'visionary',
            label: 'Vision Studio',
            icon: '👁',
            desc: 'Daily photo missions across Lisbon. Upload shots, earn XP, collect Adinkra runes, tag Atlas pins.',
            url: 'pages/vision_studio.html',
        },
        {
            id: 'arcane',
            label: 'Grand Bazaar',
            icon: '🏛',
            desc: 'Six guild huts in 3D — browse stalls, forge artifacts, trade with Navigators. Alfama meets Web3.',
            url: 'pages/marketplace_3d.html',
        },
        {
            id: 'kinetic',
            label: 'System Radio',
            icon: '🎧',
            desc: 'Upload MP3/WAV, license tracks to the community, Mihaly Flow queue, future Spotify bridge.',
            url: 'pages/system_radio.html',
        },
        {
            id: 'harmonizer',
            label: 'Connection',
            icon: '🤝',
            desc: 'Cooperation portal, event calendar, Bantaba gathering — where Navigators meet IRL.',
            action: 'connection',
        },
        {
            id: 'taste',
            label: 'Taste · AkwabaLX',
            icon: '🍲',
            desc: 'Secret Garden kitchen — live menu, pickup orders, QR share, Navigator discounts.',
            url: 'pages/akwaba_kitchen.html',
        },
    ];

    function dismiss(flowee) {
        localStorage.setItem('cdf_landing_flowee_state', 'dismissed');
        flowee.tutorialActive = false;
        flowee.shush();
    }

    function closeOpts(flowee) {
        return [
            { label: '✕ Close', action: () => dismiss(flowee) },
            { label: '💬 Open Chat', action: () => flowee.toggleChat() },
        ];
    }

    function enterWorld(flowee, world) {
        if (world.action === 'connection') {
            const modal = document.getElementById('connection-modal');
            if (modal) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                flowee.talk(true, 'Connection hub open — pick Cooperation, Bantaba, Calendar, or Taste.', 'guide', closeOpts(flowee));
            }
            return;
        }
        flowee.talk(true, `Routing to ${world.label}…`, 'guide');
        setTimeout(() => {
            window.location.href = world.url;
        }, 900);
    }

    function showWorldDetail(flowee, world) {
        flowee.talk(
            true,
            `${world.icon} <strong>${world.label}</strong><br><br>${world.desc}`,
            'guide',
            [
                { label: `Enter ${world.label}`, action: () => enterWorld(flowee, world) },
                { label: '← All realms', action: () => showWorldPicker(flowee) },
                ...closeOpts(flowee),
            ]
        );
    }

    function showWorldPicker(flowee) {
        const opts = WORLDS.map((w) => ({
            label: `${w.icon} ${w.label}`,
            action: () => showWorldDetail(flowee, w),
        }));
        opts.push(
            { label: 'Explore the 3D Tree', action: () => {
                dismiss(flowee);
                if (window.OrbitEngine) {
                    flowee.talk(true, 'Tap any glowing crystal on the tree — then tap the card to enter.', 'guide', closeOpts(flowee));
                }
            }},
            { label: 'Login / Return', action: () => {
                if (window.OrbitEngine?.transitionToLuvo) window.OrbitEngine.transitionToLuvo();
                else if (window.Gatekeeper) window.Gatekeeper.openLoginModal();
            }},
            ...closeOpts(flowee)
        );
        flowee.talk(
            true,
            'Four spheres orbit this tree — plus Taste at Secret Garden. Pick a realm and I will guide you in:',
            'guide',
            opts
        );
    }

    function showWelcome(flowee) {
        const lang = localStorage.getItem('cqr_lang') || 'en';
        const hello = { en: 'Welcome', de: 'Willkommen', fr: 'Bienvenue', pt: 'Bem-vindo' }[lang] || 'Welcome';
        flowee.talk(
            true,
            `${hello} to Circle D Flow. I am <strong>Flowee</strong> — your Navigator guide.<br><br>`
            + 'After the intro: <em>tap a glowing world</em> on the tree, read the card, tap again to enter. '
            + 'Or let me explain each realm below.',
            'guide',
            [
                { label: 'Show me the realms', action: () => {
                    localStorage.setItem('cdf_landing_flowee_state', 'step2_worlds');
                    showWorldPicker(flowee);
                }},
                { label: 'Explore tree myself', action: () => {
                    localStorage.setItem('cdf_landing_flowee_state', 'dismissed');
                    flowee.talk(true, 'Tap a crystal on Yggdrasil — Vision, Bazaar, Sound, or Connection. I am here if you need me.', 'guide', closeOpts(flowee));
                }},
                { label: 'Login / Return', action: () => {
                    if (window.OrbitEngine?.transitionToLuvo) window.OrbitEngine.transitionToLuvo();
                    else if (window.Gatekeeper) window.Gatekeeper.openLoginModal();
                }},
                ...closeOpts(flowee),
            ]
        );
    }

    window.FloweeLandingGuide = {
        WORLDS,
        _started: false,
        run(flowee, forceShow) {
            if (!flowee) return;
            if (this._started && !forceShow) return;
            const state = localStorage.getItem('cdf_landing_flowee_state') || 'step1_arrival';
            if (state === 'dismissed' && !forceShow) return;
            this._started = true;
            flowee.tutorialActive = true;
            if (state === 'step2_worlds') {
                setTimeout(() => showWorldPicker(flowee), 600);
            } else {
                setTimeout(() => showWelcome(flowee), 800);
            }
        },
        reset() {
            localStorage.setItem('cdf_landing_flowee_state', 'step1_arrival');
        },
    };
})();
