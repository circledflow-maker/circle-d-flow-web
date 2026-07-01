/**
 * Quest Triad shell — sync bar, mobile nav, from-atlas context
 * Must run after <body> exists (use defer at end of page).
 */
(function () {
    function boot() {
        const path = window.location.pathname;
        const isTriad = path.includes('quest_map') || path.includes('quest_board') || path.includes('hall_of_legends');
        if (!isTriad || !document.body) return;

        document.body.classList.add('quest-triad-page');
        document.body.style.overflowX = 'hidden';

        if (!document.getElementById('triad-sync-bar')) {
            const bar = document.createElement('div');
            bar.id = 'triad-sync-bar';
            bar.className = 'triad-sync-bar';
            bar.innerHTML = `
                <span class="triad-pill">LVL <span id="triad-level">1</span></span>
                <span class="triad-pill"><span id="triad-exp">0</span> XP</span>
                <span class="triad-pill"><span id="triad-steps">0</span> steps</span>
                <span class="triad-pill"><span id="triad-runes">0</span> runes</span>
            `;
            document.body.prepend(bar);
        }

        function refresh() {
            const runes = Object.keys(JSON.parse(localStorage.getItem('cdf_adinkra_runes') || '{}')).length;
            const key = `cdf_daily_${new Date().toISOString().slice(0, 10)}`;
            let steps = 0;
            try { steps = JSON.parse(localStorage.getItem(key) || '{}').steps || 0; } catch (_) {}
            const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
            el('triad-runes', runes);
            el('triad-steps', steps.toLocaleString());
            if (window.QuestEngine?.profile) {
                el('triad-exp', (window.QuestEngine.profile.exp || 0).toLocaleString());
                el('triad-level', window.QuestEngine.profile.level || Math.floor((window.QuestEngine.profile.exp || 0) / 200) + 1);
            }
        }

        window.addEventListener('POINTS_SYNCED', refresh);
        window.addEventListener('RUNE_COLLECTED', refresh);
        window.addEventListener('DAILY_ACTIVITY_UPDATED', refresh);
        setTimeout(refresh, 1500);

        if (path.includes('hall_of_legends') && new URLSearchParams(location.search).get('from') === 'atlas') {
            const header = document.querySelector('.animus-title')?.parentElement;
            if (header && !document.getElementById('from-atlas-banner')) {
                const b = document.createElement('div');
                b.id = 'from-atlas-banner';
                b.className = 'from-atlas-banner';
                b.innerHTML = `<span>Linked from Lisbon Atlas</span><a href="quest_map.html">← Back to Atlas</a>`;
                header.after(b);
            }
        }

        document.querySelectorAll('.animus-global-nav .nav-btn.exit').forEach((btn) => {
            btn.onclick = (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; };
        });

        const labels = {
            'nav-map': { icon: '📍', text: 'MAP' },
            'nav-board': { icon: '📖', text: 'QUESTS' },
            'nav-bro': { icon: '🏛️', text: 'RANK' },
        };
        Object.entries(labels).forEach(([id, cfg]) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.innerHTML = `<span class="icon">${cfg.icon}</span><span class="nav-label">${cfg.text}</span>`;
        });
        document.querySelectorAll('.animus-global-nav .nav-btn').forEach((btn) => {
            if (btn.id === 'nav-comms' || (btn.textContent || '').includes('COMMS') || btn.innerHTML.includes('💬')) {
                btn.innerHTML = '<span class="icon">💬</span><span class="nav-label">FLOWEE</span>';
            }
            if (btn.classList.contains('exit')) {
                btn.innerHTML = '<span class="icon">⚡</span><span class="nav-label">ORBIT</span>';
            }
        });

        const nav = document.querySelector('.animus-global-nav');
        if (nav) {
            nav.querySelectorAll('.nav-divider').forEach((d) => { d.style.display = 'none'; });
        }
    }

    if (document.body) boot();
    else document.addEventListener('DOMContentLoaded', boot);
})();
