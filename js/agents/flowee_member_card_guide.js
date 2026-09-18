/**
 * Flowee Member Card Guide
 * Language → Login OR Registration → guided free Member Card (+EXP) → Orbit profile
 */
(function () {
  let stageDone = false;

  function t(key) {
    return window.CDFi18n ? window.CDFi18n.t(key) : key;
  }

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function flow() {
    return window.MemberCardFlow || null;
  }

  function refreshVessel() {
    const a = agent();
    if (a && typeof a.renderVessel === 'function') {
      try {
        a.renderVessel();
      } catch (_) { /* ignore */ }
    }
  }

  function setStage(mode) {
    document.body.classList.remove('wk-flowee-center', 'wk-flowee-docked', 'wk-intro-dim');
    if (mode === 'center') {
      document.body.classList.add('wk-flowee-center', 'wk-intro-dim');
    } else if (mode === 'dock') {
      document.body.classList.add('wk-flowee-docked');
    }
    refreshVessel();
  }

  function say(text, type, options) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, String(text).replace(/<[^>]+>/g, ''), type || 'guide', options || []);
      return;
    }
    const host = document.getElementById('flowee-agent');
    if (!host) return;
    let bubble = host.querySelector('.wk-flowee-fallback');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'wk-flowee-fallback';
      bubble.style.cssText =
        'max-width:280px;margin:0 0 8px auto;padding:10px 12px;background:rgba(10,22,40,0.94);' +
        'border:1px solid rgba(212,175,55,0.45);border-radius:14px 14px 4px 14px;color:#f4efe6;font-size:13px;line-height:1.4;';
      host.prepend(bubble);
    }
    bubble.textContent = String(text).replace(/<[^>]+>/g, '');
  }

  function showBenefitsPanel(open) {
    const panel = document.getElementById('wk-benefits-panel');
    if (!panel) return;
    panel.hidden = !open;
    if (open) {
      try {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (_) { /* ignore */ }
      renderBenefitsTable();
    }
  }

  function currentTier() {
    try {
      const card = JSON.parse(localStorage.getItem('cdf_wako_member_card') || '{}');
      return card.tier || 'registered';
    } catch (_) {
      return 'registered';
    }
  }

  function renderBenefitsTable() {
    const body = document.getElementById('wk-benefits-body');
    const title = document.getElementById('wk-benefits-title');
    const sub = document.getElementById('wk-benefits-sub');
    if (title) title.textContent = t('benefits_title');
    if (sub) sub.textContent = t('benefits_sub');
    if (!body) return;

    const tier = currentTier();
    const rows = [
      { key: 'b_card', free: true, sup: true, crew: true },
      { key: 'b_exp', free: true, sup: true, crew: true },
      { key: 'b_sanctuary', free: true, sup: true, crew: true },
      { key: 'b_coupons', free: true, sup: true, crew: true },
      { key: 'b_events', free: true, sup: true, crew: true },
      { key: 'b_sup_extra', free: false, sup: true, crew: true },
      { key: 'b_crew_extra', free: false, sup: false, crew: true },
    ];

    const mark = (ok, owned) => {
      if (!ok) return '<span class="wk-ben-off">—</span>';
      return owned
        ? '<span class="wk-ben-on" title="included">✓</span>'
        : '<span class="wk-ben-buy" title="upgrade">★</span>';
    };

    body.innerHTML = rows
      .map((r) => {
        const ownFree = tier === 'registered' || tier === 'flow_supporter' || tier === 'flow_crew';
        const ownSup = tier === 'flow_supporter' || tier === 'flow_crew';
        const ownCrew = tier === 'flow_crew';
        return (
          `<tr>` +
          `<td>${t(r.key)}</td>` +
          `<td>${mark(r.free, r.free && ownFree)}</td>` +
          `<td>${mark(r.sup, r.sup && ownSup)}</td>` +
          `<td>${mark(r.crew, r.crew && ownCrew)}</td>` +
          `</tr>`
        );
      })
      .join('');

    const chip = document.getElementById('wk-tier-chip');
    if (chip) {
      chip.textContent =
        tier === 'flow_crew'
          ? t('tier_crew')
          : tier === 'flow_supporter'
            ? t('tier_sup')
            : t('tier_free');
    }
  }

  function openUpgrade() {
    say(t('guide_upgrade'), 'guide', [
      {
        label: t('tier_sup'),
        action: () => {
          window.location.href = '/membership?skip=1&tier=flow_supporter#tier-silver';
        },
      },
      {
        label: t('tier_crew'),
        action: () => {
          window.location.href = '/membership?skip=1&tier=flow_crew#tier-gold';
        },
      },
      {
        label: t('tier_free'),
        action: () => showBenefitsPanel(true),
      },
    ]);
  }

  function startLoginPath() {
    stageDone = true;
    setStage('dock');
    showBenefitsPanel(false);
    const f = flow();
    if (f?.showLogin) f.showLogin();
    else {
      const panel = document.getElementById('wk-login-panel');
      if (panel) panel.hidden = false;
      if (f?.goStep) f.goStep(0);
    }
    say(t('auth_login_guide'), 'guide', [
      {
        label: t('login_go'),
        action: () => {
          if (f?.loginWithPassword) f.loginWithPassword();
          else document.getElementById('wk-login-btn')?.click();
        },
      },
      {
        label: t('register_me'),
        action: () => startRegisterPath(),
      },
    ]);
  }

  function startRegisterPath() {
    stageDone = true;
    setStage('dock');
    showBenefitsPanel(false);
    const f = flow();
    if (f?.startRegister) f.startRegister();
    else if (f?.goStep) f.goStep(1);
    say(t('auth_register_guide'), 'guide', [
      {
        label: t('start_name'),
        action: () => {
          if (f?.goStep) f.goStep(1);
          document.getElementById('member-name-input')?.focus();
          say(t('guide_step_name'), 'guide');
        },
      },
      {
        label: t('show_benefits'),
        action: () => {
          showBenefitsPanel(true);
          say(t('guide_benefits'), 'guide');
        },
      },
    ]);
  }

  /** After language: Login or Registration — not the old HELLO → benefits path */
  function askAuthGate() {
    setStage('center');
    showBenefitsPanel(false);
    say(t('auth_gate'), 'guide', [
      { label: t('have_login'), action: () => startLoginPath() },
      { label: t('register_me'), action: () => startRegisterPath() },
    ]);
  }

  function askLanguage() {
    setStage('center');
    showBenefitsPanel(false);
    say(t('pick_lang'), 'guide', [
      {
        label: 'PORTUGUÊS',
        action: () => {
          window.CDFi18n?.setLang('pt');
          askAuthGate();
        },
      },
      {
        label: 'ENGLISH',
        action: () => {
          window.CDFi18n?.setLang('en');
          askAuthGate();
        },
      },
      {
        label: 'DEUTSCH',
        action: () => {
          window.CDFi18n?.setLang('de');
          askAuthGate();
        },
      },
    ]);
  }

  function boot() {
    const switcher = document.getElementById('cdf-lang-switch');
    if (window.CDFi18n && switcher) {
      window.CDFi18n.mountSwitcher(switcher, () => {
        renderBenefitsTable();
      });
    }
    document.getElementById('wk-benefits-toggle')?.addEventListener('click', () => {
      const panel = document.getElementById('wk-benefits-panel');
      const open = panel?.hidden;
      showBenefitsPanel(!!open);
      if (open) say(t('guide_benefits'), 'guide');
    });
    document.getElementById('wk-upgrade-btn')?.addEventListener('click', () => {
      window.location.href = '/membership?skip=1#mp-billing';
    });

    const params = new URLSearchParams(location.search);
    const auth = params.get('auth');
    if (auth === 'login' || auth === 'register') {
      setStage('dock');
      showBenefitsPanel(false);
      // member_card.js boot already enters auth mode — only assist if it has not
      setTimeout(() => {
        if (document.body.classList.contains('wk-auth-gate')) return;
        if (window.MemberCardFlow?.enterAuthMode) {
          window.MemberCardFlow.enterAuthMode(auth);
        } else if (auth === 'login') startLoginPath();
        else startRegisterPath();
      }, 700);
      return;
    }

    // Orbit deep links are session-gated by member_card.js — stay docked, no language interrupt
    if (params.has('view') || params.get('orbit') === '1') {
      setStage('dock');
      showBenefitsPanel(false);
      return;
    }

    try {
      const card = JSON.parse(localStorage.getItem('cdf_wako_member_card') || '{}');
      // Do not skip auth when only a local claimed draft exists
      if (card.claimed && typeof window.cdfEnterFlowOrbit === 'function') {
        const seen = sessionStorage.getItem('cdf_flowee_auth_gate');
        if (seen === '1') {
          setStage('dock');
          return;
        }
      }
    } catch (_) { /* ignore */ }

    showBenefitsPanel(false);
    renderBenefitsTable();
    askLanguage();
  }

  window.FloweeMemberCardGuide = {
    say,
    showBenefits: () => showBenefitsPanel(true),
    renderBenefitsTable,
    askAuthGate,
    startLoginPath,
    startRegisterPath,
    boot,
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(boot, 450);
  });
})();
