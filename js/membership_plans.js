/**
 * Membership plans page — Stripe checkout for Silver / Gold
 */
(function () {
  function billing() {
    return document.querySelector('input[name="mp-billing"]:checked')?.value || 'month';
  }

  function syncPrices() {
    const interval = billing();
    document.querySelectorAll('.mp-price[data-price-month]').forEach((el) => {
      el.textContent =
        interval === 'year' ? el.getAttribute('data-price-year') : el.getAttribute('data-price-month');
    });
  }

  function msg(text, ok) {
    const el = document.getElementById('mp-msg');
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || '';
    el.classList.toggle('is-ok', !!ok);
  }

  async function checkout(tier) {
    msg('Opening Stripe…', true);
    let card = {};
    try {
      card = JSON.parse(localStorage.getItem('cdf_wako_member_card') || '{}');
    } catch (_) {}
    try {
      const res = await fetch('/api/create-membership-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          interval: billing(),
          displayName: card.displayName || '',
          email: card.email || '',
          userId: card.userId || '',
          source: 'membership_plans',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout unavailable');
      window.location.href = data.url;
    } catch (e) {
      msg(e.message || 'Checkout failed', false);
    }
  }

  function boot() {
    document.querySelectorAll('input[name="mp-billing"]').forEach((el) => {
      el.addEventListener('change', syncPrices);
    });
    syncPrices();
    document.querySelectorAll('[data-checkout]').forEach((btn) => {
      btn.addEventListener('click', () => checkout(btn.getAttribute('data-checkout')));
    });
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier');
    if (tier === 'flow_supporter') {
      document.getElementById('tier-silver')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (tier === 'flow_crew') {
      document.getElementById('tier-gold')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
