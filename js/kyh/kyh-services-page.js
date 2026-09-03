/**
 * Kiss Your Heart — services index renderer (Phase 5)
 */
(function () {
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function renderSessions(container) {
    if (!container || !window.KYHServices) return;
    container.innerHTML = KYHServices.featured()
      .map(
        (s) => `
      <a class="kyh-panel kyh-panel--accent" href="${KYHServices.bookHref(s.slug)}" style="text-decoration:none;color:inherit;">
        <p class="kyh-eyebrow">${esc(s.duration)}</p>
        <h3 class="kyh-display" style="font-size:1.2rem;">${esc(s.title)}</h3>
        <p class="kyh-muted">${esc(s.description)}</p>
        <span class="kyh-btn kyh-btn--ghost" style="margin-top:0.75rem;display:inline-flex;">${esc(s.ctaLabel)}</span>
      </a>`
      )
      .join('');
  }

  window.KYHServicesPage = { renderSessions };
})();
