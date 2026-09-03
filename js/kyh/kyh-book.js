/**
 * Kiss Your Heart — book page renderer (Phase 5)
 */
(function () {
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function renderGrid(container) {
    if (!container || !window.KYHServices) return;
    const params = new URLSearchParams(location.search);
    const highlight = params.get('service');
    const items = KYHServices.CATALOG.filter((s) => s.id !== 'CREATIVE_CONSULTATION' || true);

    container.innerHTML = items
      .map((s) => {
        const active = highlight && (highlight === s.slug || highlight === s.id);
        const href = KYHServices.bookHref(s.slug);
        const btnClass = s.primary ? 'kyh-btn kyh-btn--primary' : 'kyh-btn kyh-btn--ghost';
        return `
          <article class="kyh-panel kyh-panel--accent${active ? ' kyh-panel--active' : ''}" data-service="${esc(s.slug)}">
            <p class="kyh-eyebrow">${esc(s.duration)} · ${esc(s.tier)}</p>
            <h3 class="kyh-display" style="font-size:1.25rem;">${esc(s.title)}</h3>
            <p class="kyh-muted">${esc(s.description)}</p>
            <a class="${btnClass}" href="${href}" style="margin-top:0.75rem;">${esc(s.ctaLabel)}</a>
          </article>`;
      })
      .join('');

    container.innerHTML += `
      <article class="kyh-panel">
        <p class="kyh-eyebrow">After an experience</p>
        <h3 class="kyh-display" style="font-size:1.25rem;">Experience Feedback</h3>
        <p class="kyh-muted">Send a link — Flowee guides the feedback session.</p>
        <a class="kyh-btn kyh-btn--ghost" href="/pages/kyh/feedback" style="margin-top:0.75rem;">Send feedback link</a>
      </article>`;

    if (highlight) {
      const el = container.querySelector(`[data-service="${CSS.escape(highlight)}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  window.KYHBook = { renderGrid };
})();
