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

    function langLine(key) {
        const lang = localStorage.getItem('cqr_lang') || 'en';
        const dict = {
            welcome: {
                en: 'I am <strong>Flowee</strong>, your Navigator. The <strong>Weltenbaum</strong> is awake — four crystals orbit its crown under the Lisbon stars.',
                de: 'Ich bin <strong>Flowee</strong>, dein Navigator. Der <strong>Weltenbaum</strong> ist erwacht — vier Kristalle kreisen unter dem Lissabon-Sternenhimmel.',
                fr: 'Je suis <strong>Flowee</strong>, ton Navigateur. L\'<strong>arbre-monde</strong> est éveillé — quatre cristaux sous les étoiles de Lisbonne.',
                pt: 'Sou <strong>Flowee</strong>, teu Navigator. A <strong>Árvore-Mundo</strong> despertou — quatro cristais sob as estrelas de Lisboa.',
            },
            tour: {
                en: 'Realm {n}/4: <strong>{label}</strong><br>{desc}',
                de: 'Reich {n}/4: <strong>{label}</strong><br>{desc}',
                fr: 'Royaume {n}/4: <strong>{label}</strong><br>{desc}',
                pt: 'Reino {n}/4: <strong>{label}</strong><br>{desc}',
            },
        };
        return (dict[key] && dict[key][lang]) || dict[key].en;
    }

    function dismiss(flowee) {
        localStorage.setItem('cdf_landing_flowee_state', 'dismissed');
        flowee.tutorialActive = false;
        flowee.shush();
        const worldNav = document.getElementById('world-quick-nav');
        if (worldNav && window.__landingIntroDone) worldNav.classList.add('visible');
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
        if (window.OrbitEngine?.highlightWorld) window.OrbitEngine.highlightWorld(world.id);
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
                label: '🎬 Guided realm tour',
                action: () => startGuidedTour(flowee, 0),
            },
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

    function startGuidedTour(flowee, index) {
        if (index >= WORLDS.length) {
            localStorage.setItem('cdf_landing_flowee_state', 'step2_worlds');
            showWorldPicker(flowee);
            return;
        }
        const w = WORLDS[index];
        if (window.OrbitEngine?.highlightWorld) window.OrbitEngine.highlightWorld(w.id);
        const line = langLine('tour')
            .replace('{n}', String(index + 1))
            .replace('{label}', w.label)
            .replace('{desc}', w.desc);
        flowee.talk(true, line, 'guide', [
            { label: index < WORLDS.length - 1 ? 'Next realm →' : 'Finish tour', action: () => startGuidedTour(flowee, index + 1) },
            { label: `Enter ${w.label}`, action: () => enterWorld(flowee, w) },
            { label: 'Skip tour', action: () => showWorldPicker(flowee) },
            ...closeOpts(flowee).slice(0, 1),
        ]);
    }

    function isMobile() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function showWelcome(flowee) {
        const mobile = isMobile();
        const welcome = langLine('welcome');
        flowee.talk(
            true,
            mobile
                ? `${welcome}<br><br>Tap a crystal or pick a realm below.`
                : `${welcome}<br><br>Tap a glowing world — <em>Luvo, Bantaba, Archive, or Heart</em> — or let me walk you through each realm.`,
            'guide',
            mobile
                ? [
                    { label: '🎬 Guided tour', action: () => { localStorage.setItem('cdf_landing_flowee_state', 'step2_worlds'); startGuidedTour(flowee, 0); } },
                    { label: 'Pick a realm', action: () => { localStorage.setItem('cdf_landing_flowee_state', 'step2_worlds'); showWorldPicker(flowee); } },
                    { label: 'Explore tree', action: () => { localStorage.setItem('cdf_landing_flowee_state', 'dismissed'); flowee.talk(true, 'Tap a crystal on Yggdrasil. I am here if you need me.', 'guide', closeOpts(flowee)); } },
                    ...closeOpts(flowee).slice(0, 1),
                ]
                : [
                    {
                        label: '🎬 Guide me through all realms',
                        action: () => {
                            localStorage.setItem('cdf_landing_flowee_state', 'step2_worlds');
                            startGuidedTour(flowee, 0);
                        },
                    },
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
        const worldNav = document.getElementById('world-quick-nav');
        if (worldNav) worldNav.classList.add('visible');
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
                setTimeout(() => showWelcome(flowee), 900);
            }
        },
        reset() {
            localStorage.setItem('cdf_landing_flowee_state', 'step1_arrival');
            this._started = false;
        },
    };
})();
