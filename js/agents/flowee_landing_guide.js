/**
 * Flowee Landing Guide — post-intro world explainer for index.html
 * Landing worlds: Luvo, Bantaba, Archive, Heart
 */
(function () {
    const WORLDS = [
        {
            id: 'luvo',
            label: 'Luvo',
            icon: '✦',
            desc: 'Community hub at the roots — login, initiation doors, Navigator identity and the Oracle chamber.',
            action: 'luvo',
        },
        {
            id: 'bantaba',
            label: 'Bantaba',
            icon: '🌍',
            desc: 'Sacred gathering space — local market, event map, Guild of Destiny, first IRL connection.',
            url: 'pages/bantaba.html',
        },
        {
            id: 'archive',
            label: 'Archive',
            icon: '📜',
            desc: 'Portfolio and system knowledge — pillars of light, lore records, creative artifacts.',
            url: 'pages/archive.html',
        },
        {
            id: 'heart',
            label: 'Heart',
            icon: '♥',
            desc: 'Kiss Your Heart world — resonance, healing frequency, emotional pulse of the Flow.',
            url: 'pages/heart.html',
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
        if (world.action === 'luvo') {
            if (window.OrbitEngine?.transitionToLuvo) {
                flowee.talk(true, 'Opening the Luvo chamber — choose Return (login) or Initiation.', 'guide', closeOpts(flowee));
                window.OrbitEngine.transitionToLuvo();
            } else if (window.Gatekeeper) {
                window.Gatekeeper.openLoginModal();
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
            {
                label: 'Explore the 3D Tree',
                action: () => {
                    localStorage.setItem('cdf_landing_flowee_state', 'dismissed');
                    flowee.talk(
                        true,
                        'Tap a glowing crystal — Luvo, Bantaba, Archive, or Heart — then tap the card to enter.',
                        'guide',
                        closeOpts(flowee)
                    );
                },
            },
            ...closeOpts(flowee)
        );
        flowee.talk(
            true,
            'Four realms orbit this tree: <strong>Luvo</strong>, <strong>Bantaba</strong>, <strong>Archive</strong>, and <strong>Heart</strong>. Where should I guide you?',
            'guide',
            opts
        );
    }

    function showWelcome(flowee) {
        const lang = localStorage.getItem('cqr_lang') || 'en';
        const hello = { en: 'Welcome', de: 'Willkommen', fr: 'Bienvenue', pt: 'Bem-vindo' }[lang] || 'Welcome';
        flowee.talk(
            true,
            `${hello} to Circle D Flow. I am <strong>Flowee</strong>, your Navigator guide.<br><br>`
            + 'Tap a glowing world on the tree — <em>Luvo, Bantaba, Archive, or Heart</em> — read the card, tap again to enter. '
            + 'Or let me explain each realm below.',
            'guide',
            [
                {
                    label: 'Show me the realms',
                    action: () => {
                        localStorage.setItem('cdf_landing_flowee_state', 'step2_worlds');
                        showWorldPicker(flowee);
                    },
                },
                {
                    label: 'Explore tree myself',
                    action: () => {
                        localStorage.setItem('cdf_landing_flowee_state', 'dismissed');
                        flowee.talk(
                            true,
                            'Tap a crystal on Yggdrasil. I am here if you need me.',
                            'guide',
                            closeOpts(flowee)
                        );
                    },
                },
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
            this._started = false;
        },
    };
})();
