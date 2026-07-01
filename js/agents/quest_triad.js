/**
 * Quest Triad shell — sync bar, mobile class, from-atlas context
 */
(function () {
    const path = window.location.pathname;
    const isTriad = path.includes('quest_map') || path.includes('quest_board') || path.includes('hall_of_legends');
    if (!isTriad) return;

    document.body.classList.add('quest-triad-page');
    document.body.style.overflowX = 'hidden';

    const bar = document.createElement('div');
    bar.className = 'triad-sync-bar';
    bar.innerHTML = `
        <span class="triad-pill">LVL <span id="triad-level">1</span></span>
        <span class="triad-pill"><span id="triad-exp">0</span> XP</span>
        <span class="triad-pill"><span id="triad-steps">0</span> steps</span>
        <span class="triad-pill"><span id="triad-runes">0</span> runes</span>
    `;
    document.body.prepend(bar);

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
    document.addEventListener('DOMContentLoaded', () => setTimeout(refresh, 1500));

    if (path.includes('hall_of_legends') && new URLSearchParams(location.search).get('from') === 'atlas') {
        document.addEventListener('DOMContentLoaded', () => {
            const header = document.querySelector('.animus-title')?.parentElement;
            if (!header || document.getElementById('from-atlas-banner')) return;
            const b = document.createElement('div');
            b.id = 'from-atlas-banner';
            b.className = 'from-atlas-banner';
            b.innerHTML = `<span>Linked from Lisbon Atlas</span><a href="quest_map.html">← Back to Atlas</a>`;
            header.after(b);
        });
    }

    document.querySelectorAll('.animus-global-nav .nav-btn.exit').forEach((btn) => {
        btn.onclick = (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; };
    });

    /** Consistent triad nav labels (mobile-friendly) */
    const labels = {
        'nav-map': { icon: '📍', text: 'MAP' },
        'nav-board': { icon: '📖', text: 'QUESTS' },
        'nav-bro': { icon: '🏛️', text: 'RANK' },
    };
    document.addEventListener('DOMContentLoaded', () => {
        Object.entries(labels).forEach(([id, cfg]) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.innerHTML = `<span class="icon">${cfg.icon}</span><br>${cfg.text}`;
        });
        document.querySelectorAll('.animus-global-nav .nav-btn').forEach((btn) => {
            const t = (btn.textContent || '').trim();
            if (t.includes('COMMS') || btn.innerHTML.includes('💬')) {
                btn.innerHTML = '<span class="icon">💬</span><br>FLOWEE';
            }
            if (btn.classList.contains('exit')) {
                btn.innerHTML = '<span class="icon">⚡</span><br>ORBIT';
            }
        });
    });
})();
