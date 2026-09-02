/**
 * Kiss Your Heart — full-viewport scene navigation (zoom transitions, no scroll)
 */
(function () {
  let scenes = [];
  let current = 0;
  let transitioning = false;
  let root = null;

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function updateUI() {
    if (!root) return;
    root.querySelectorAll('[data-scene-index]').forEach((el) => {
      const i = Number(el.getAttribute('data-scene-index'));
      el.classList.toggle('is-active', i === current);
      el.classList.toggle('is-past', i < current);
    });
    root.querySelectorAll('[data-scene-dot]').forEach((dot) => {
      const i = Number(dot.getAttribute('data-scene-dot'));
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-current', i === current ? 'step' : 'false');
    });
    const label = root.querySelector('[data-scene-label]');
    if (label && scenes[current]) label.textContent = scenes[current].label || '';
    window.dispatchEvent(new CustomEvent('kyh:scene-change', { detail: { index: current, id: scenes[current]?.id } }));
  }

  function goTo(index, direction) {
    if (!root || transitioning || index === current) return;
    if (index < 0 || index >= scenes.length) return;

    transitioning = true;
    const prev = current;
    const next = index;
    const dir = direction || (next > prev ? 1 : -1);
    const outEl = root.querySelector(`[data-scene-index="${prev}"]`);
    const inEl = root.querySelector(`[data-scene-index="${next}"]`);

    current = next;
    updateUI();

    if (prefersReduced() || !outEl || !inEl) {
      transitioning = false;
      return;
    }

    inEl.classList.add('is-entering');
    inEl.classList.add(dir > 0 ? 'is-from-right' : 'is-from-left');
    outEl.classList.add(dir > 0 ? 'is-exit-left' : 'is-exit-right');

    requestAnimationFrame(() => {
      inEl.classList.add('is-enter-active');
      outEl.classList.add('is-exit-active');
    });

    setTimeout(() => {
      outEl.classList.remove('is-exit-left', 'is-exit-right', 'is-exit-active');
      inEl.classList.remove('is-entering', 'is-from-right', 'is-from-left', 'is-enter-active');
      transitioning = false;
    }, 620);
  }

  function next() { goTo(current + 1, 1); }
  function prev() { goTo(current - 1, -1); }

  window.KYHScenes = {
    init(container) {
      if (!container) return;
      root = container;
      scenes = [...container.querySelectorAll('[data-scene-index]')].map((el) => ({
        id: el.getAttribute('data-scene-id') || '',
        label: el.getAttribute('data-scene-label') || '',
      }));
      current = 0;
      updateUI();

      container.querySelector('[data-scene-next]')?.addEventListener('click', next);
      container.querySelector('[data-scene-prev]')?.addEventListener('click', prev);
      container.querySelectorAll('[data-scene-dot]').forEach((dot) => {
        dot.addEventListener('click', () => goTo(Number(dot.getAttribute('data-scene-dot'))));
      });

      window.addEventListener('keydown', (e) => {
        if (!document.body.contains(container)) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      });
    },
    goTo,
    next,
    prev,
    get current() { return current; },
    get count() { return scenes.length; },
  };
})();
