/**
 * Kiss Your Heart — Project Map result page
 */
(function () {
  function cfg() { return window.KYH_CONFIG || {}; }
  function u(path) { return cfg().url ? cfg().url(path) : path; }
  function labelFor(list, id) {
    return (list || []).find((x) => x.id === id)?.label || id;
  }

  function render(container) {
    if (!container) return;
    let draft;
    try {
      draft = JSON.parse(sessionStorage.getItem(cfg().draftKey || 'kyh_project_draft') || '{}');
    } catch {
      draft = {};
    }

    if (!draft.projectTypes?.length && !draft.vision) {
      container.innerHTML = `
        <div class="kyh-panel kyh-reveal">
          <p class="kyh-display kyh-display-md">No project yet.</p>
          <p class="kyh-muted" style="margin:1rem 0 1.5rem;">Every project starts somewhere. What's in your heart?</p>
          <a class="kyh-btn kyh-btn--primary" href="${u('create/project-builder')}">Start Your Project</a>
        </div>`;
      return;
    }

    const stage = draft.stage || (window.KYHRecommendations?.computeStage(draft) || 'SHAPE');
    const rec = draft.recommendation || window.KYHRecommendations?.recommend(draft) || {};
    const stageIdx = window.KYHRecommendations?.stageIndex(stage) ?? 1;
    const has = draft.resources || [];
    const needs = (draft.needs || []).filter((n) => !(draft.resources || []).includes(n));

    const typeLabels = (draft.projectTypes || []).map((id) => labelFor(cfg().projectTypes, id)).join(' · ');
    const hasHtml = has.length
      ? has.map((id) => `<li>✓ ${labelFor(cfg().resources, id)}</li>`).join('')
      : '<li class="kyh-muted">Nothing selected yet</li>';
    const needsHtml = needs.length
      ? needs.map((id) => `<li>○ ${labelFor(cfg().needs, id)}</li>`).join('')
      : '<li class="kyh-muted">Looking clear — we can refine together</li>';

    container.innerHTML = `
      <article class="kyh-map kyh-reveal">
        <p class="kyh-eyebrow">Your Project Map</p>
        <h1 class="kyh-display kyh-display-lg">${draft.title || 'Your Project'}</h1>
        <p class="kyh-lead">${typeLabels || 'Creative project'}</p>

        <div class="kyh-map-grid">
          <div class="kyh-panel kyh-panel--accent">
            <p class="kyh-eyebrow">Stage</p>
            <p class="kyh-display kyh-display-md" style="font-size:1.75rem;">${String(stageIdx + 1).padStart(2, '0')} — ${stage}</p>
            <div id="kyh-map-stages" style="margin-top:1rem;"></div>
          </div>
          <div class="kyh-panel">
            <p class="kyh-eyebrow">You already have</p>
            <ul class="kyh-map-list">${hasHtml}</ul>
          </div>
          <div class="kyh-panel">
            <p class="kyh-eyebrow">You may need</p>
            <ul class="kyh-map-list">${needsHtml}</ul>
          </div>
        </div>

        <div class="kyh-panel kyh-panel--accent" style="margin-top:1.5rem;">
          <p class="kyh-eyebrow">Recommended next step</p>
          <h2 class="kyh-display kyh-display-md">${rec.title || 'Project Development Session'}</h2>
          <p class="kyh-muted" style="margin:0.75rem 0;">${rec.description || ''}</p>
          <p class="kyh-muted" style="font-size:0.85rem;">${rec.reason || ''}</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1.25rem;">
            <a class="kyh-btn kyh-btn--primary" href="${u('book')}?service=${rec.id || 'PROJECT_DEVELOPMENT'}">${rec.ctaLabel || 'Book a Session'}</a>
            <a class="kyh-btn kyh-btn--ghost" href="${u('book')}?service=FULL_JOURNEY">Build the Full Journey</a>
          </div>
        </div>

        <p style="margin-top:1.5rem;text-align:center;">
          <a class="kyh-btn kyh-btn--text" href="${u('create/project-builder')}">Edit answers</a>
        </p>
      </article>`;

    const rail = document.getElementById('kyh-map-stages');
    if (rail && window.KYHStages) {
      KYHStages.render(rail, { activeStage: stage, doneThrough: stageIdx - 1, showMeta: false });
    }
  }

  window.KYHProjectMap = { render };
})();
