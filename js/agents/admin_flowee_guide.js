/**
 * Flowee on Admin / Flow Control — persistent coach dock + bubble guidance
 */
(function () {
  const LINES = {
    welcome:
      'I am Flowee on Flow Control. Unlock with your admin password — then I walk you through Members, Events, Locations, Impact and Invite.',
    unlocked:
      'Unlocked. Start with Impact for the baseline story, then Members and Events. Invite links send visitors to Member Card → Login or Registration.',
    members: 'Members — search tiers, contact, EXP. Living ledger of Navigators.',
    events: 'Events — Next Flow, covers, featured flags. Keep Botanica and Wako nights visible in Orbit.',
    locations: 'Locations — Flow Points on the Lisbon map. Link venues to sessions.',
    impact: 'Impact 2026 — lived culture baseline (700+ activations with Wako). Counters grow as Orbit goes live.',
    partners: 'Partners — venues and brands that redeem member perks. Keep URLs and sort order clean.',
    coupons: 'Coupons — benefit codes staff scan. Tie them to partners and refill monthly.',
    live: 'Live Feed — recent claims and activity. Spot spikes after Instagram or flyer pushes.',
    invite: 'Invite — copy a tagged link. Visitors land on Member Card; Flowee asks language then Login or Register.',
    lock: 'Locked again. I stay quiet until you unlock.',
  };

  const STEPS = [
    { id: 'impact', label: '1 · Impact', hint: 'Baseline story & registrations' },
    { id: 'members', label: '2 · Members', hint: 'Tiers · EXP · contact' },
    { id: 'events', label: '3 · Events', hint: 'Next Flow · featured' },
    { id: 'invite', label: '4 · Invite', hint: 'Share → Member Card' },
  ];

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function say(text, options) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, text, 'guide', options || []);
    }
    const dockText = document.getElementById('admin-flowee-text');
    if (dockText) dockText.textContent = text;
  }

  function guideTab(name) {
    const key = String(name || '').toLowerCase();
    if (LINES[key]) say(LINES[key]);
    document.querySelectorAll('.admin-flowee-step').forEach((el) => {
      el.classList.toggle('on', el.getAttribute('data-tab') === key);
    });
  }

  function ensureDock() {
    let dock = document.getElementById('admin-flowee-dock');
    if (dock) return dock;

    dock = document.createElement('aside');
    dock.id = 'admin-flowee-dock';
    dock.setAttribute('aria-label', 'Flowee admin guide');
    dock.innerHTML =
      '<div class="admin-flowee-head">' +
      '<span class="admin-flowee-kicker">Flowee</span>' +
      '<strong>Flow Control guide</strong>' +
      '</div>' +
      '<p id="admin-flowee-text" class="admin-flowee-text"></p>' +
      '<div class="admin-flowee-steps" id="admin-flowee-steps"></div>' +
      '<div class="admin-flowee-links">' +
      '<a href="/member-card" target="_blank" rel="noopener">Member Card</a>' +
      '<a href="/membership" target="_blank" rel="noopener">Membership + cinematic</a>' +
      '<a href="/pages/membership_plans?skip=1" target="_blank" rel="noopener">Plans only</a>' +
      '</div>';

    const style = document.createElement('style');
    style.textContent =
      '#admin-flowee-dock{position:fixed;right:12px;bottom:12px;z-index:99990;width:min(320px,calc(100vw - 24px));' +
      'padding:14px 14px 12px;border-radius:16px;border:1px solid rgba(212,175,55,.5);' +
      'background:linear-gradient(160deg,rgba(12,22,40,.97),rgba(6,10,18,.98));' +
      'box-shadow:0 18px 50px rgba(0,0,0,.5);font:14px/1.55 "Plus Jakarta Sans",system-ui,sans-serif;color:#f4efe6}' +
      '.admin-flowee-head{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}' +
      '.admin-flowee-kicker{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#3de0ff}' +
      '.admin-flowee-head strong{font-family:Cinzel,Georgia,serif;color:#d4af37;font-size:1.05rem}' +
      '.admin-flowee-text{margin:0 0 10px;color:rgba(244,239,230,.88);font-size:.95rem;line-height:1.65;min-height:3.2em}' +
      '.admin-flowee-steps{display:grid;gap:6px;margin-bottom:10px}' +
      '.admin-flowee-step{appearance:none;text-align:left;border-radius:10px;border:1px solid rgba(61,224,255,.28);' +
      'background:rgba(0,0,0,.35);color:#f4efe6;padding:8px 10px;cursor:pointer;font:inherit}' +
      '.admin-flowee-step small{display:block;color:#9aa3b2;font-size:.78rem;margin-top:2px}' +
      '.admin-flowee-step.on,.admin-flowee-step:hover{border-color:#d4af37;background:rgba(212,175,55,.12)}' +
      '.admin-flowee-links{display:flex;flex-wrap:wrap;gap:8px}' +
      '.admin-flowee-links a{color:#3de0ff;font-size:.82rem;text-decoration:none}' +
      '.admin-flowee-links a:hover{text-decoration:underline}' +
      'body{font-size:16px;line-height:1.55}' +
      '.sub{font-size:.98rem;line-height:1.7;margin-bottom:1.15rem}' +
      'h1{font-size:1.6rem!important;margin-bottom:.5rem!important;line-height:1.3}' +
      'h2{font-size:1.18rem!important;margin-bottom:.8rem!important;line-height:1.35}' +
      '.stat b{font-size:1.55rem}' +
      '.stat span{font-size:.85rem;line-height:1.45}' +
      '.panel p,.panel li{line-height:1.7;font-size:.98rem}' +
      '@media(max-width:720px){#admin-flowee-dock{position:static;width:100%;margin:0 0 1rem;order:-1}' +
      'body{display:flex;flex-direction:column}}';
    document.head.appendChild(style);
    document.body.appendChild(dock);

    const stepsHost = dock.querySelector('#admin-flowee-steps');
    STEPS.forEach((step) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-flowee-step';
      btn.setAttribute('data-tab', step.id);
      btn.innerHTML = step.label + '<small>' + step.hint + '</small>';
      btn.addEventListener('click', () => {
        document.querySelector('.tabs button[data-tab="' + step.id + '"]')?.click();
        guideTab(step.id);
      });
      stepsHost.appendChild(btn);
    });

    return dock;
  }

  function boot() {
    let host = document.getElementById('flowee-agent');
    if (!host) {
      host = document.createElement('div');
      host.id = 'flowee-agent';
      document.body.appendChild(host);
    }

    ensureDock();

    say(LINES.welcome, [
      {
        label: 'OPEN MEMBER CARD',
        action: () => {
          window.open('/member-card', '_blank');
        },
      },
      {
        label: 'MEMBERSHIP + CINE',
        action: () => {
          window.open('/membership', '_blank');
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
          guideTab('impact');
        }
      }, 400);
    });

    document.querySelectorAll('.tabs button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => guideTab(btn.getAttribute('data-tab')));
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => say(LINES.lock));

    window.AdminFlowee = { say, guideTab };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
