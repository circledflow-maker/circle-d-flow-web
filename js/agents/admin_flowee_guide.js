/**
 * Flowee on Admin / Flow Control — guide operators through the dashboard
 */
(function () {
  const LINES = {
    welcome:
      'I am Flowee on Flow Control. Unlock with your admin password — then I walk you through Members, Events, Locations, Impact and Invite links.',
    unlocked:
      'Unlocked. Start with Impact for the baseline story, then Members and Events. Invite links send visitors to Member Card → Login or Registration.',
    members: 'Members — search tiers, contact, EXP. This is your living ledger of Navigators.',
    events: 'Events — Next Flow, cover images, featured flags. Keep Botanica and Wako nights visible in Orbit.',
    locations: 'Locations — Flow Points on the Lisbon map. Link venues to upcoming sessions.',
    impact: 'Impact 2026 — lived culture baseline (700+ activations story lives with Wako). Counters grow as Orbit goes live.',
    invite: 'Invite — copy a tagged link. Visitors land on Member Card; Flowee asks language then Login or Register.',
    lock: 'Locked again. I stay quiet until you unlock.',
  };

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function say(text, options) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, text, 'guide', options || []);
      return;
    }
    const host = document.getElementById('flowee-agent');
    if (!host) return;
    let bubble = host.querySelector('.admin-flowee-fallback');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'admin-flowee-fallback';
      bubble.style.cssText =
        'position:fixed;right:12px;bottom:88px;z-index:99999;max-width:280px;padding:12px 14px;' +
        'background:rgba(8,14,26,.96);border:1px solid rgba(212,175,55,.45);border-radius:14px;' +
        'color:#f4efe6;font:14px/1.55 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.4)';
      host.appendChild(bubble);
    }
    bubble.textContent = text;
  }

  function guideTab(name) {
    const key = String(name || '').toLowerCase();
    if (LINES[key]) say(LINES[key]);
  }

  function boot() {
    let host = document.getElementById('flowee-agent');
    if (!host) {
      host = document.createElement('div');
      host.id = 'flowee-agent';
      document.body.appendChild(host);
    }

    // Soft style refresh for readability
    const style = document.createElement('style');
    style.textContent =
      'body{font-size:16px;line-height:1.55}' +
      '.sub{font-size:0.95rem;line-height:1.65;margin-bottom:1.15rem}' +
      'h1{font-size:1.55rem;margin-bottom:0.45rem}' +
      'h2{font-size:1.15rem;margin-bottom:0.75rem;line-height:1.35}' +
      '.stat b{font-size:1.5rem}' +
      '.stat span{font-size:0.82rem;line-height:1.4}' +
      '.panel p,.panel li{line-height:1.65}' +
      '#flowee-agent{position:relative;z-index:99998}';
    document.head.appendChild(style);

    say(LINES.welcome, [
      {
        label: 'OPEN MEMBER CARD',
        action: () => {
          window.open('/member-card', '_blank');
        },
      },
      {
        label: 'MEMBERSHIP PLANS',
        action: () => {
          window.open('/pages/membership_plans', '_blank');
        },
      },
    ]);

    document.getElementById('gate-btn')?.addEventListener('click', () => {
      setTimeout(() => {
        if (document.getElementById('app') && !document.getElementById('app').hidden) {
          say(LINES.unlocked, [
            { label: 'IMPACT', action: () => document.querySelector('.tabs button[data-tab="impact"]')?.click() },
            { label: 'INVITE', action: () => document.querySelector('.tabs button[data-tab="invite"]')?.click() },
          ]);
        }
      }, 400);
    });

    document.querySelectorAll('.tabs button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => guideTab(btn.getAttribute('data-tab')));
    });

    window.AdminFlowee = { say, guideTab };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
