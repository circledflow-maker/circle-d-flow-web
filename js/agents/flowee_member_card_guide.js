/**
 * Flowee guide for Wako Kungo member card (swipe onboarding)
 */
(function () {
  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function say(text, type) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, String(text).replace(/<[^>]+>/g, ''), type || 'guide');
      return;
    }
    const host = document.getElementById('flowee-agent');
    if (!host) return;
    let bubble = host.querySelector('.wk-flowee-fallback');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'wk-flowee-fallback';
      bubble.style.cssText =
        'max-width:260px;margin:0 0 8px auto;padding:10px 12px;background:rgba(10,22,40,0.92);' +
        'border:1px solid rgba(212,175,55,0.45);border-radius:14px 14px 4px 14px;color:#f4efe6;font-size:13px;line-height:1.4;';
      host.prepend(bubble);
    }
    bubble.textContent = String(text).replace(/<[^>]+>/g, '');
  }

  window.FloweeMemberCardGuide = { say };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      say('Swipe with me — name, contact, profile, then your Wako card into inventory.', 'guide');
    }, 700);
  });
})();
