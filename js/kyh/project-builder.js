/**
 * Kiss Your Heart — Project Builder (progressive steps)
 */
(function () {
  const STEPS = [
    { id: 'types', title: 'What are you creating?', type: 'multi', field: 'projectTypes' },
    { id: 'heart', title: "Tell us what's in your heart.", type: 'textarea', field: 'vision' },
    { id: 'have', title: 'What do you already have?', type: 'multi', field: 'resources', source: 'resources' },
    { id: 'need', title: 'What do you need?', type: 'multi', field: 'needs', source: 'needs' },
    { id: 'where', title: 'Where?', type: 'single', field: 'location', source: 'locations' },
    { id: 'when', title: 'When?', type: 'when' },
    { id: 'maturity', title: 'How far along are you?', type: 'single', field: 'maturity', source: 'maturity' },
    { id: 'success', title: 'What would success look like?', type: 'textarea', field: 'success' },
  ];

  function cfg() { return window.KYH_CONFIG || {}; }
  function u(path) { return cfg().url ? cfg().url(path) : path; }

  function loadDraft() {
    try {
      const raw = sessionStorage.getItem(cfg().draftKey || 'kyh_project_draft');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function saveDraft(data) {
    sessionStorage.setItem(cfg().draftKey || 'kyh_project_draft', JSON.stringify(data));
  }

  function getOptions(step) {
    const c = cfg();
    if (step.source) return c[step.source] || [];
    if (step.field === 'projectTypes') return c.projectTypes || [];
    return [];
  }

  function renderWhenFields(draft) {
    return `
      <div class="kyh-field">
        <label class="kyh-label" for="kyh-when-type">Timing</label>
        <select id="kyh-when-type" class="kyh-input" name="whenType">
          <option value="FLEXIBLE" ${draft.whenType === 'FLEXIBLE' ? 'selected' : ''}>Flexible</option>
          <option value="SEASON" ${draft.whenType === 'SEASON' ? 'selected' : ''}>Season</option>
          <option value="MONTH" ${draft.whenType === 'MONTH' ? 'selected' : ''}>Month</option>
          <option value="DATE" ${draft.whenType === 'DATE' ? 'selected' : ''}>Exact date</option>
          <option value="UNDECIDED" ${draft.whenType === 'UNDECIDED' ? 'selected' : ''}>Not decided</option>
        </select>
      </div>
      <div class="kyh-field">
        <label class="kyh-label" for="kyh-when-detail">Details (optional)</label>
        <input id="kyh-when-detail" class="kyh-input" name="whenDetail" type="text"
          placeholder="e.g. Spring 2026, September, 15 Oct 2026"
          value="${draft.whenDetail || ''}">
      </div>
    `;
  }

  function renderStep(step, draft, stepNum) {
    const total = STEPS.length;
    const stageName = cfg().stages?.[0] || 'FEEL';

    let body = '';
    if (step.type === 'textarea') {
      const val = draft[step.field] || '';
      body = `
        <div class="kyh-field">
          <label class="kyh-label visually-hidden" for="kyh-field-${step.field}">${step.title}</label>
          <textarea id="kyh-field-${step.field}" class="kyh-input kyh-textarea" name="${step.field}"
            rows="5" placeholder="Share your vision in your own words…">${val}</textarea>
        </div>`;
    } else if (step.type === 'when') {
      body = renderWhenFields(draft);
    } else if (step.type === 'multi' || step.type === 'single') {
      const options = getOptions(step);
      const selected = draft[step.field];
      const selectedArr = Array.isArray(selected) ? selected : selected ? [selected] : [];
      const inputType = step.type === 'multi' ? 'checkbox' : 'radio';
      body = `<div class="kyh-chip-grid" role="${step.type === 'multi' ? 'group' : 'radiogroup'}" aria-label="${step.title}">`;
      options.forEach((opt) => {
        const checked = selectedArr.includes(opt.id) ? ' checked' : '';
        body += `
          <label class="kyh-chip">
            <input type="${inputType}" name="${step.field}" value="${opt.id}"${checked}>
            <span>${opt.label}</span>
          </label>`;
      });
      body += '</div>';
    }

    return `
      <div class="kyh-builder-step" data-step="${stepNum}">
        <p class="kyh-stage-rail__meta">${String(stepNum + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
        <h2 class="kyh-display kyh-display-md">${step.title}</h2>
        ${body}
        <p class="kyh-form-error" id="kyh-step-error" hidden role="alert">Something is missing here. Take another look.</p>
        <div class="kyh-builder-actions">
          ${stepNum > 0 ? '<button type="button" class="kyh-btn kyh-btn--ghost" data-action="back">Back</button>' : '<span></span>'}
          <button type="button" class="kyh-btn kyh-btn--primary" data-action="next">${stepNum === total - 1 ? 'See Your Project Briefing' : 'Continue'}</button>
        </div>
      </div>`;
  }

  function collectStepData(stepEl, step) {
    const data = {};
    if (step.type === 'textarea') {
      const ta = stepEl.querySelector('textarea');
      data[step.field] = ta ? ta.value.trim() : '';
      return data;
    }
    if (step.type === 'when') {
      data.whenType = stepEl.querySelector('[name="whenType"]')?.value || 'FLEXIBLE';
      data.whenDetail = stepEl.querySelector('[name="whenDetail"]')?.value.trim() || '';
      return data;
    }
    if (step.type === 'multi') {
      data[step.field] = [...stepEl.querySelectorAll(`input[name="${step.field}"]:checked`)].map((i) => i.value);
      return data;
    }
    const checked = stepEl.querySelector(`input[name="${step.field}"]:checked`);
    data[step.field] = checked ? checked.value : '';
    return data;
  }

  function validateStep(step, data) {
    if (step.type === 'multi' && (!data[step.field] || !data[step.field].length)) return false;
    if (step.type === 'single' && !data[step.field]) return false;
    if (step.type === 'textarea' && !data[step.field]) return false;
    return true;
  }

  function projectTitle(draft) {
    const types = draft.projectTypes || [];
    const c = cfg();
    const labels = types.map((id) => c.projectTypes?.find((t) => t.id === id)?.label).filter(Boolean);
    if (labels.length) return labels.join(' · ');
    if (draft.vision) return draft.vision.slice(0, 60) + (draft.vision.length > 60 ? '…' : '');
    return 'Your Project';
  }

  window.KYHProjectBuilder = {
    STEPS,
    init(container) {
      if (!container) return;
      let stepIndex = 0;
      let draft = loadDraft();

      function render() {
        const step = STEPS[stepIndex];
        container.innerHTML = renderStep(step, draft, stepIndex);
        if (window.KYHStages) {
          const rail = document.getElementById('kyh-builder-rail');
          if (rail) KYHStages.render(rail, { activeStage: 'FEEL', doneThrough: -1, showMeta: true });
        }
        if (window.FloweeKyhGuide && stepIndex === 0) {
          FloweeKyhGuide.hint('FEEL');
        }
        const stepIds = ['types', 'heart', 'have', 'need', 'where', 'when', 'maturity', 'success'];
        if (window.FloweeKyhGuide && stepIds[stepIndex]) {
          FloweeKyhGuide.onBuilderStep(stepIds[stepIndex]);
        }
      }

      function finish() {
        draft.title = projectTitle(draft);
        if (window.KYHRecommendations) {
          draft.stage = KYHRecommendations.computeStage(draft);
          draft.recommendation = KYHRecommendations.recommend(draft);
        }
        if (window.KYHIntelligence) {
          draft.analysis = KYHIntelligence.analyse(draft);
          draft.id = KYHIntelligence.saveProject(draft, draft.analysis);
        }
        saveDraft(draft);
        window.location.href = u('create/project-map');
      }

      container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const step = STEPS[stepIndex];
        const stepEl = container.querySelector('.kyh-builder-step');
        const err = container.querySelector('#kyh-step-error');

        if (btn.dataset.action === 'back') {
          stepIndex = Math.max(0, stepIndex - 1);
          render();
          return;
        }

        const partial = collectStepData(stepEl, step);
        Object.assign(draft, partial);
        saveDraft(draft);

        if (!validateStep(step, partial)) {
          if (err) err.hidden = false;
          return;
        }
        if (err) err.hidden = true;

        if (stepIndex >= STEPS.length - 1) {
          finish();
          return;
        }
        stepIndex += 1;
        render();
      });

      render();
    },
    loadDraft,
    saveDraft,
  };
})();
