/**
 * Flowee — interactive experience feedback session
 */
(function () {
  const STEPS = [
    { q: 'How did the experience feel overall?', type: 'rating', field: 'overall' },
    { q: 'What worked beautifully?', type: 'text', field: 'worked' },
    { q: 'What could grow next time?', type: 'text', field: 'improve' },
    { q: 'Would you recommend Kiss Your Heart to another creator?', type: 'choice', field: 'recommend', options: ['Yes', 'Maybe', 'Not yet'] },
    { q: 'Anything else for Hope and the team?', type: 'text', field: 'extra' },
  ];

  let step = 0;
  let data = {};

  function agent() { return window.flowee || window.Flowee; }
  function speak(t) { agent()?.talk?.(true, t, 'guide'); }

  function renderStep(root) {
    const s = STEPS[step];
    speak(s.q);
    let input = '';
    if (s.type === 'rating') {
      input = `<div class="kyh-chip-grid">${[1,2,3,4,5].map(n=>`
        <label class="kyh-chip"><input type="radio" name="rating" value="${n}"><span>${n} ★</span></label>`).join('')}</div>`;
    } else if (s.type === 'choice') {
      input = `<div class="kyh-chip-grid">${s.options.map(o=>`
        <label class="kyh-chip"><input type="radio" name="choice" value="${o}"><span>${o}</span></label>`).join('')}</div>`;
    } else {
      input = `<textarea class="kyh-textarea" id="kyh-fb-field" rows="4" placeholder="Share honestly…"></textarea>`;
    }
    root.innerHTML = `
      <p class="kyh-stage-rail__meta">${step+1} / ${STEPS.length}</p>
      <h2 class="kyh-display kyh-display-md">${s.q}</h2>
      ${input}
      <div class="kyh-builder-actions">
        ${step ? '<button type="button" class="kyh-btn kyh-btn--ghost" data-fb="back">Back</button>' : '<span></span>'}
        <button type="button" class="kyh-btn kyh-btn--primary" data-fb="next">${step === STEPS.length-1 ? 'Send feedback' : 'Continue'}</button>
      </div>`;
  }

  function collect(s) {
    if (s.type === 'rating') return document.querySelector('input[name="rating"]:checked')?.value;
    if (s.type === 'choice') return document.querySelector('input[name="choice"]:checked')?.value;
    return document.getElementById('kyh-fb-field')?.value?.trim();
  }

  window.FloweeKyhFeedback = {
    init(root, meta) {
      data = { ...meta, createdAt: new Date().toISOString() };
      step = 0;
      renderStep(root);
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-fb]');
        if (!btn) return;
        const s = STEPS[step];
        if (btn.dataset.fb === 'back') { step--; renderStep(root); return; }
        const val = collect(s);
        if (!val) { speak('Take your time — your voice matters here.'); return; }
        data[s.field] = val;
        if (step >= STEPS.length - 1) {
          let list = [];
          try { list = JSON.parse(localStorage.getItem('kyh_feedback') || '[]'); } catch { list = []; }
          list.push(data);
          localStorage.setItem('kyh_feedback', JSON.stringify(list));
          root.innerHTML = `<div class="kyh-panel kyh-panel--accent" style="text-align:center;">
            <p class="kyh-display kyh-display-md">Thank you.</p>
            <p class="kyh-muted">Your feedback shapes the next experience. With heart.</p></div>`;
          speak('Thank you — your feedback is received. Culture grows when we listen.', 'success');
          return;
        }
        step++;
        renderStep(root);
      });
      setTimeout(() => speak('Welcome to the feedback session. I will ask a few honest questions — no wrong answers.'), 800);
    }
  };
})();
