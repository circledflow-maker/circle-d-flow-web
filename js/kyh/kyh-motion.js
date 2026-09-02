/**
 * Kiss Your Heart — scroll reveals + reduced motion
 */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAll() {
    document.querySelectorAll('.kyh-reveal').forEach((el) => el.classList.add('is-visible'));
  }

  function initReveals() {
    const nodes = document.querySelectorAll('.kyh-reveal');
    if (!nodes.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    nodes.forEach((el) => io.observe(el));
  }

  window.KYHMotion = {
    init() {
      initReveals();
    },
    revealAll,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveals);
  } else {
    initReveals();
  }
})();
