/**
 * Kiss Your Heart — full project briefing (after complete workflow only)
 */
(function () {
  function cfg() { return window.KYH_CONFIG || {}; }
  function u(path) { return cfg().url ? cfg().url(path) : path; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function riskClass(level) {
    if (level === 'high') return 'kyh-risk kyh-risk--high';
    if (level === 'medium') return 'kyh-risk kyh-risk--medium';
    return 'kyh-risk';
  }

  function render(container) {
    if (!container) return;
    let draft;
    try {
      draft = JSON.parse(sessionStorage.getItem(cfg().draftKey || 'kyh_project_draft') || '{}');
    } catch { draft = {}; }

    if (!draft.projectTypes?.length && !draft.vision) {
      container.innerHTML = `<div class="kyh-panel"><p class="kyh-display kyh-display-md">Start with your heart first.</p>
        <a class="kyh-btn kyh-btn--primary" href="${u('create/project-builder')}" style="margin-top:1rem;">Start Your Project</a></div>`;
      return;
    }

    const analysis = draft.analysis || (window.KYHIntelligence?.analyse(draft));
    const id = window.KYHIntelligence?.saveProject(draft, analysis) || draft.id;
    const stage = analysis.stage || 'SHAPE';
    const stageIdx = window.KYHRecommendations?.stageIndex(stage) ?? 1;
    const rec = analysis.recommendation || {};
    const shareUrl = `${location.origin}${u('dashboard')}?project=${id}`;

    container.innerHTML = `
      <article class="kyh-briefing">
        <header class="kyh-briefing__hero kyh-reveal">
          <p class="kyh-eyebrow">Your Project Briefing · after full workflow</p>
          <h1 class="kyh-display kyh-display-lg">${esc(draft.title || analysis.concept?.headline)}</h1>
          <p class="kyh-lead">${esc(analysis.concept?.pitch)}</p>
          <p class="kyh-muted">${esc(analysis.concept?.format)}</p>
        </header>

        <div class="kyh-briefing__actions kyh-reveal">
          <a class="kyh-btn kyh-btn--primary" href="${u('dashboard')}?project=${id}">Open Team Dashboard</a>
          <button type="button" class="kyh-btn kyh-btn--ghost" id="kyh-copy-share">Copy share link</button>
          <a class="kyh-btn kyh-btn--text" href="${u('create/project-builder')}">Edit answers</a>
        </div>

        <section class="kyh-briefing__grid kyh-reveal">
          <div class="kyh-panel kyh-panel--accent">
            <p class="kyh-eyebrow">Journey · ${esc(stage)}</p>
            <div id="kyh-map-stages"></div>
          </div>
          <div class="kyh-panel">
            <p class="kyh-eyebrow">What you can create</p>
            <p>${esc(analysis.concept?.headline)}</p>
            <p class="kyh-muted" style="margin-top:0.5rem;font-size:0.9rem;">${esc(draft.success || 'Success = a real experience people remember and share.')}</p>
          </div>
        </section>

        <section class="kyh-briefing__section kyh-reveal">
          <h2 class="kyh-display kyh-display-md">Fitting places · Lisbon</h2>
          <div class="kyh-venue-grid">
            ${(analysis.venues || []).map((v) => `
              <article class="kyh-panel">
                <h3 class="kyh-display" style="font-size:1.15rem;">${esc(v.name)}</h3>
                <p class="kyh-muted">${esc(v.vibe)}</p>
                <p style="font-size:0.85rem;margin-top:0.5rem;color:var(--kyh-gold);">${esc(v.fitReason)}</p>
              </article>`).join('') || '<p class="kyh-muted">Tell us your location preference — we match Supported Spaces.</p>'}
          </div>
        </section>

        <section class="kyh-briefing__section kyh-reveal">
          <h2 class="kyh-display kyh-display-md">Fitting artists &amp; crew</h2>
          <div class="kyh-venue-grid">
            ${(analysis.artists || []).map((a) => `
              <article class="kyh-panel kyh-panel--accent">
                <h3 class="kyh-display" style="font-size:1.15rem;">${esc(a.name)}</h3>
                <p class="kyh-eyebrow" style="margin-top:0.35rem;">${esc(a.roles.join(' · '))}</p>
                <p class="kyh-muted">${esc(a.strength)}</p>
              </article>`).join('')}
          </div>
        </section>

        <div class="kyh-briefing__split kyh-reveal">
          <section class="kyh-panel">
            <p class="kyh-eyebrow">Benefits</p>
            <ul class="kyh-map-list">${(analysis.benefits || []).map((b) => `<li>✓ ${esc(b)}</li>`).join('')}</ul>
          </section>
          <section class="kyh-panel">
            <p class="kyh-eyebrow">Risks to watch</p>
            <ul class="kyh-map-list">${(analysis.risks || []).map((r) => `<li class="${riskClass(r.level)}">${esc(r.text)}</li>`).join('')}</ul>
          </section>
        </div>

        <section class="kyh-briefing__section kyh-reveal">
          <p class="kyh-eyebrow">What's missing · next moves</p>
          <div class="kyh-gap-grid">
            ${(analysis.gaps || []).map((g) => `
              <div class="kyh-panel"><strong>${esc(g.label)}</strong><p class="kyh-muted" style="margin-top:0.35rem;">${esc(g.action)}</p></div>
            `).join('') || '<p class="kyh-muted">Looking strong — book a session to refine execution.</p>'}
          </div>
        </section>

        <section class="kyh-briefing__section kyh-reveal">
          <h2 class="kyh-display kyh-display-md">Pay model</h2>
          <div class="kyh-panel kyh-panel--accent" style="margin-bottom:1rem;">
            <p class="kyh-eyebrow">Recommended</p>
            <h3 class="kyh-display" style="font-size:1.25rem;">${esc(analysis.payModel?.label)} · ${esc(analysis.payModel?.range)}</h3>
            <p class="kyh-muted">${esc(analysis.payModel?.desc)}</p>
          </div>
          <div class="kyh-gap-grid">
            ${(analysis.payOptions || []).map((p) => `
              <div class="kyh-panel"><strong>${esc(p.label)}</strong> <span class="kyh-muted">${esc(p.range)}</span>
              <p class="kyh-muted" style="font-size:0.85rem;margin-top:0.25rem;">${esc(p.desc)}</p></div>
            `).join('')}
          </div>
        </section>

        <section class="kyh-briefing__section kyh-reveal">
          <h2 class="kyh-display kyh-display-md">Marketing flow · Feel → Share</h2>
          <ol class="kyh-marketing-flow">
            ${(analysis.marketingFlow || []).map((m) => `
              <li><span class="kyh-eyebrow">${esc(m.stage)}</span><p>${esc(m.action)}</p></li>
            `).join('')}
          </ol>
        </section>

        <section class="kyh-panel kyh-panel--accent kyh-reveal" style="text-align:center;margin-top:1.5rem;">
          <p class="kyh-eyebrow">Recommended next step</p>
          <h2 class="kyh-display kyh-display-md">${esc(rec.title || 'Project Development')}</h2>
          <p class="kyh-muted">${esc(rec.description)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;margin-top:1.25rem;">
            <a class="kyh-btn kyh-btn--primary" href="${esc(rec.bookHref || (window.KYHServices?.bookHref(rec.id || 'PROJECT_DEVELOPMENT')))}">${esc(rec.ctaLabel || 'Book a Session')}</a>
            <a class="kyh-btn kyh-btn--ghost" href="${u('feedback')}?project=${id}">Schedule feedback session</a>
          </div>
        </section>
      </article>`;

    if (window.KYHStages) {
      KYHStages.render(document.getElementById('kyh-map-stages'), { activeStage: stage, doneThrough: stageIdx - 1, showMeta: true });
    }

    document.getElementById('kyh-copy-share')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(shareUrl).then(() => {
        if (window.FloweeKyhGuide) FloweeKyhGuide.onCta('Share link copied');
      });
    });

    if (window.FloweeKyhGuide) {
      setTimeout(() => FloweeKyhGuide.onBriefingReady(analysis), 1200);
    }
  }

  window.KYHProjectMap = { render };
})();
