/**
 * Flowee Dashboard Guide — interactive mission routing on Captain's Quarters
 */
(function () {
    const INITIATION = [
        { key: 'cdf_initiation_market_visited', title: 'Visit the Bazaar', hint: 'Inspect an artifact in the Marketplace.', url: 'marketplace.html', planet: 'Bazaar' },
        { key: 'cdf_initiation_rune_found', title: 'Wisdom Rune (Sound)', hint: 'Listen 30s on Outbreak Tunes for the rune.', url: 'outbreak_tunes.html', planet: 'Sound' },
        { key: 'cdf_initiation_kitchen_visited', title: 'Akwaba Kitchen', hint: 'Browse the menu and place a pickup.', url: 'akwaba_kitchen.html', planet: 'Taste' },
        { key: 'cdf_initiation_quests_viewed', title: 'Open Quest Codex', hint: 'View your mission board once.', url: 'quest_board.html', planet: null },
        { key: 'cdf_initiation_vision_found', title: 'Vision Sphere', hint: 'Tap the Vision planet on the compass.', url: 'vision_studio.html', planet: 'Vision' },
        { key: 'cdf_artifact_genesis', title: 'Flow Sync', hint: 'Toggle Flow Sync in your profile tools.', url: 'dashboard.html', planet: null },
    ];

    const BETA_FLAGS = ['cdf_beta_key', 'cqr_auth_state', 'cdf_beta_mission_1'];

    function username() {
        try {
            const u = JSON.parse(localStorage.getItem('cqr_user') || '{}');
            if (u.username) return u.username;
        } catch (_) { /* ignore */ }
        return window.userProfile?.username || document.getElementById('username-display')?.textContent?.trim() || 'Navigator';
    }

    function betaInitialized() {
        return BETA_FLAGS.some((k) => localStorage.getItem(k));
    }

    function orbitTutorialDone() {
        return localStorage.getItem('cdf_dashboard_orbit_tutorial_v1') === 'done';
    }

    function getMissingInitiation() {
        return INITIATION.filter((m) => !localStorage.getItem(m.key));
    }

    function getPendingQuests() {
        const out = [];
        if (!window.LISBON_QUESTS) return out;
        (window.LISBON_QUESTS || []).forEach((q) => {
            if (q.type === 'system') return;
            const done = window.QuestEngine?.isQuestComplete?.(q.id);
            const accepted = window.QuestEngine?.isQuestAccepted?.(q.id);
            if (!done) {
                out.push({
                    id: q.id,
                    title: q.title,
                    hint: q.description,
                    url: q.page || 'quest_map.html',
                    exp: q.reward_exp,
                    accepted,
                });
            }
        });
        return out.slice(0, 5);
    }

    function closeOpts(flowee) {
        return [{ label: '✕ Close', action: () => flowee.shush() }];
    }

    function highlightTarget(sel) {
        if (!sel || !window.Flowee) return;
        setTimeout(() => {
            const el = document.querySelector(sel);
            if (el) window.Flowee.highlight(sel);
        }, 600);
    }

    function routeTo(url, questId) {
        if (questId) sessionStorage.setItem('target_codex_id', questId);
        window.location.href = url;
    }

    function showMissionPicker(flowee, missions) {
        if (!missions.length) {
            flowee.talk(true, 'All initiation checkpoints complete. Explore the compass or accept a Lisbon quest on the Atlas.', 'celebrate', [
                { label: 'Open Atlas', action: () => routeTo('quest_map.html') },
                { label: 'Orbit Tutorial', action: () => runOrbitTutorial(flowee) },
                ...closeOpts(flowee),
            ]);
            return;
        }
        const opts = missions.slice(0, 4).map((m) => ({
            label: m.title.length > 22 ? m.title.slice(0, 20) + '…' : m.title,
            action: () => showMissionDetail(flowee, m),
        }));
        opts.push(
            { label: '← Menu', action: () => showMainMenu(flowee) },
            ...closeOpts(flowee)
        );
        flowee.talk(
            true,
            `<strong>${missions.length} mission(s)</strong> still open on your path. Pick one and I will route you.`,
            'guide',
            opts
        );
    }

    function showMissionDetail(flowee, m) {
        const exp = m.exp ? ` · +${m.exp} XP` : '';
        const planetHint = m.planet ? ` Tap <strong>${m.planet}</strong> on the compass.` : '';
        flowee.talk(
            true,
            `<strong>${m.title}</strong>${exp}<br>${m.hint || ''}${planetHint}`,
            'guide',
            [
                {
                    label: 'Go now',
                    action: () => {
                        if (m.planet) highlightTarget(`#planet-${m.planet}`);
                        setTimeout(() => routeTo(m.url, m.id), m.planet ? 1200 : 400);
                    },
                },
                { label: '← All missions', action: () => showMissionPicker(flowee, [...getMissingInitiation(), ...getPendingQuests()]) },
                ...closeOpts(flowee),
            ]
        );
        if (m.planet) highlightTarget(`#planet-${m.planet}`);
    }

    function runOrbitTutorial(flowee) {
        const steps = [
            { text: 'This is your <strong>Flow Compass</strong>. Each planet is a world — Vision, Sound, Taste, Bazaar, and more.', target: '.mandala-container' },
            { text: 'Tap a planet to open its sphere hub. Long-press Vision for the studio archive.', target: '#planet-Vision' },
            { text: 'Your steps sync to Fitable — walk Lisbon to reveal Atlas fog.', target: '#daily-steps-display' },
            { text: 'Use <strong>To the Sanctuary</strong> for your artist HQ, or WhatsApp (green) for live support.', target: 'a[href*="artist_sanctuary"], #wa-fab' },
        ];
        let i = 0;
        const next = () => {
            if (i >= steps.length) {
                localStorage.setItem('cdf_dashboard_orbit_tutorial_v1', 'done');
                flowee.talk(true, 'Orbit tutorial complete. I am here if you need a mission route.', 'celebrate', closeOpts(flowee));
                return;
            }
            const s = steps[i++];
            flowee.talk(true, s.text, 'guide', [
                { label: i < steps.length ? 'Next' : 'Done', action: next },
                { label: 'Skip', action: () => { localStorage.setItem('cdf_dashboard_orbit_tutorial_v1', 'done'); flowee.shush(); } },
            ]);
            if (s.target) highlightTarget(s.target);
        };
        next();
    }

    function showMainMenu(flowee) {
        const missing = getMissingInitiation();
        const quests = getPendingQuests();
        const total = missing.length + quests.length;
        const name = username();

        flowee.talk(
            true,
            `Hey <strong>${name}</strong> — Orbit online.${total ? ` <strong>${total}</strong> mission(s) waiting.` : ' Your path looks clear.'}`,
            'guide',
            [
                {
                    label: total ? `Missions (${total})` : 'Explore Atlas',
                    action: () => (total ? showMissionPicker(flowee, [...missing, ...quests]) : routeTo('quest_map.html')),
                },
                {
                    label: 'Nearest quest',
                    action: () => {
                        const q = quests[0] || missing[0];
                        if (q) showMissionDetail(flowee, q);
                        else flowee.talk(true, 'No pending quests — create one in the Codex!', 'guide', closeOpts(flowee));
                    },
                },
                {
                    label: orbitTutorialDone() ? 'Replay tutorial' : 'Orbit tutorial',
                    action: () => runOrbitTutorial(flowee),
                },
                { label: '💬 Chat', action: () => flowee.toggleChat() },
                ...closeOpts(flowee),
            ]
        );
    }

    function showBetaWelcome(flowee) {
        flowee.talk(
            true,
            'Beta clearance confirmed. I will guide you through the seven initiation checkpoints and Lisbon quests.',
            'guide',
            [
                {
                    label: 'Start path',
                    action: () => {
                        localStorage.setItem('cdf_beta_mission_1', 'active');
                        showMissionPicker(flowee, [...getMissingInitiation(), ...getPendingQuests()]);
                    },
                },
                { label: 'Orbit tutorial first', action: () => runOrbitTutorial(flowee) },
                ...closeOpts(flowee),
            ]
        );
    }

    function start(flowee) {
        if (!flowee?.bubble) return;
        const imperialStep = parseInt(localStorage.getItem('cdf_imperial_step') || '1', 10);
        if (imperialStep <= 7 && window.Flowee?.imperialSteps) {
            const task = window.Flowee.imperialSteps.find((s) => s.id === imperialStep);
            if (task?.page?.includes('dashboard') && task.check && !task.check()) {
                setTimeout(() => {
                    flowee.talk(true, `[Step ${imperialStep}/7] ${task.text}`, 'guide', [
                        { label: 'Show me how', action: () => { if (task.target) highlightTarget(task.target); } },
                        { label: 'All missions', action: () => showMainMenu(flowee) },
                        ...closeOpts(flowee),
                    ]);
                    if (task.target) highlightTarget(task.target);
                }, 500);
                return;
            }
        }

        if (betaInitialized() && !orbitTutorialDone() && !localStorage.getItem('cdf_dashboard_guide_welcomed')) {
            localStorage.setItem('cdf_dashboard_guide_welcomed', '1');
            showBetaWelcome(flowee);
            return;
        }

        const missing = getMissingInitiation();
        if (missing.length) {
            const m = missing[0];
            flowee.talk(
                true,
                `Next checkpoint: <strong>${m.title}</strong>. ${m.hint}`,
                'guide',
                [
                    { label: 'Guide me', action: () => showMissionDetail(flowee, m) },
                    { label: 'All missions', action: () => showMainMenu(flowee) },
                    ...closeOpts(flowee),
                ]
            );
            if (m.planet) highlightTarget(`#planet-${m.planet}`);
            return;
        }

        showMainMenu(flowee);
    }

    window.FloweeDashboardGuide = {
        start,
        showMainMenu,
        getMissingInitiation,
        getPendingQuests,
    };

    function boot() {
        if (!window.location.pathname.includes('dashboard')) return;
        const run = () => {
            if (!window.Flowee?.bubble) {
                setTimeout(run, 400);
                return;
            }
            const delay = localStorage.getItem('seen_command_trinity') ? 2200 : 4500;
            setTimeout(() => start(window.Flowee), delay);
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(run, 800));
        } else {
            setTimeout(run, 800);
        }
        window.addEventListener('POINTS_SYNCED', () => {
            if (window.userProfile && !window.__dashboardGuideSynced) {
                window.__dashboardGuideSynced = true;
            }
        });
    }

    boot();
})();
