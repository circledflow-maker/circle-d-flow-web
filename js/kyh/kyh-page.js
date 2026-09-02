/**
 * Kiss Your Heart — shared page boot
 */
window.KYHPage = {
  boot(options) {
    const opts = options || {};
    document.addEventListener('DOMContentLoaded', function () {
      if (window.KYHShell) KYHShell.mount({ activeSlug: opts.activeSlug || '' });
      if (window.KYHMotion) KYHMotion.init();
      if (opts.onReady) opts.onReady();
      if (window.KYH_CONFIG?.floweeEnabled && window.FloweeKyhGuide) {
        FloweeKyhGuide.boot(opts.floweeDelay || 1000);
      }
    });
  },
};
