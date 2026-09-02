/**
 * Kiss Your Heart — six-stage journey visual component
 */
(function () {
  const cfg = () => window.KYH_CONFIG || {};

  function stageIndex(name) {
    const stages = cfg().stages || [];
    const i = stages.indexOf(String(name || '').toUpperCase());
    return i >= 0 ? i : 0;
  }

  function renderStageRail(container, options) {
    if (!container) return;
    const stages = cfg().stages || ['FEEL', 'SHAPE', 'CONNECT', 'BUILD', 'EXPERIENCE', 'SHARE'];
    const active = String(options?.activeStage || 'FEEL').toUpperCase();
    const activeIdx = stageIndex(active);
    const doneThrough = typeof options?.doneThrough === 'number' ? options.doneThrough : activeIdx - 1;
    const showMeta = options?.showMeta !== false;
    const stepNum = String(activeIdx + 1).padStart(2, '0');
    const total = String(stages.length).padStart(2, '0');

    const steps = stages
      .map((name, i) => {
        let cls = 'kyh-stage-rail__step';
        if (i <= doneThrough) cls += ' is-done';
        if (i === activeIdx) cls += ' is-active';
        return `
          <div class="${cls}" aria-current="${i === activeIdx ? 'step' : 'false'}">
            <span class="kyh-stage-rail__dot" aria-hidden="true"></span>
            <span class="kyh-stage-rail__label">${name}</span>
          </div>
        `;
      })
      .join('');

    const question = cfg().stageQuestions?.[active] || '';

    container.innerHTML = `
      <div class="kyh-stage-rail" role="group" aria-label="Project journey stages">
        ${showMeta ? `<p class="kyh-stage-rail__meta">${stepNum} / ${total} · ${active}</p>` : ''}
        <div class="kyh-stage-rail__track">${steps}</div>
        ${question ? `<p class="kyh-lead" style="margin-top:0.75rem;font-size:1rem;">${question}</p>` : ''}
      </div>
    `;
  }

  window.KYHStages = {
    render: renderStageRail,
    index: stageIndex,
  };
})();
