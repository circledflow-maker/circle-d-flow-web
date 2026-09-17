/**
 * Flowee Member Card Guide — language → center welcome → dock + benefits tour
 */
(function () {
  let stageDone = false;

  function t(key) {
    return window.CDFi18n ? window.CDFi18n.t(key) : key;
  }

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
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
        'max-width:260px;margin:0 0 8px auto;padding:10px 12px;background:rgba(10,22,40,0.92);' +
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
    // Bronze=registered · Silver=flow_supporter · Gold=flow_crew
    const rows = [
      { key: 'b_card', bronze: true, silver: true, gold: true },
      { key: 'b_exp', bronze: true, silver: true, gold: true },
      { key: 'b_sanctuary', bronze: true, silver: true, gold: true },
      { key: 'b_events', bronze: true, silver: true, gold: true },
      { key: 'b_wako_free', bronze: false, silver: true, gold: true, grant: 'wako_event' },
      { key: 'b_coupons', bronze: false, silver: true, gold: true },
      { key: 'b_guest', bronze: false, silver: true, gold: true, grant: 'guest_plus1' },
      { key: 'b_drink_silver', bronze: false, silver: true, gold: true, grant: 'drink_1' },
      { key: 'b_alerts', bronze: false, silver: true, gold: true },
      { key: 'b_folders', bronze: false, silver: false, gold: true },
      { key: 'b_shoot', bronze: false, silver: false, gold: true, grant: 'shoot_1h' },
      { key: 'b_early', bronze: false, silver: false, gold: true },
      { key: 'b_drink_gold', bronze: false, silver: false, gold: true, grant: 'drink_3' },
    ];

    const mark = (ok, owned) => {
      if (!ok) return '<span class="wk-ben-off" title="not in this tier">—</span>';
      return owned
        ? '<span class="wk-ben-on" title="yours">✓</span>'
        : '<span class="wk-ben-buy" title="upgrade to unlock">Unlock</span>';
    };

    const ownBronze = true;
    const ownSilver = tier === 'flow_supporter' || tier === 'flow_crew';
    const ownGold = tier === 'flow_crew';
    const grants =
      window.CdfBenefitGrants && ownSilver
        ? window.CdfBenefitGrants.listForTier(tier)
        : [];

    body.innerHTML = rows
      .map((r) => {
        const owned =
          (r.bronze && ownBronze) ||
          (r.silver && ownSilver && !r.bronze) ||
          (r.gold && ownGold && !r.silver);
        // owned for silver-only rows when silver+
        const has =
          (r.bronze && ownBronze) ||
          (r.silver && ownSilver) ||
          (r.gold && ownGold);
        let openBtn = '';
        if (r.grant && has && ownSilver) {
          const g = grants.find((x) => x.benefitId === r.grant && !x.used);
          const used = grants.find((x) => x.benefitId === r.grant && x.used);
          if (g) {
            openBtn =
              `<button type="button" class="wk-ben-open" data-benefit-code="${g.code}" data-benefit-label="${t(r.key)}">Open QR</button>`;
          } else if (used) {
            openBtn = `<span class="wk-ben-used">Used · next month</span>`;
          }
        }
        return (
          `<tr class="wk-ben-row">` +
          `<td><div class="wk-ben-name">${t(r.key)}</div>${openBtn}</td>` +
          `<td>${mark(r.bronze, r.bronze && ownBronze)}</td>` +
          `<td>${mark(r.silver, r.silver && ownSilver)}</td>` +
          `<td>${mark(r.gold, r.gold && ownGold)}</td>` +
          `</tr>`
        );
      })
      .join('');

    body.querySelectorAll('[data-benefit-code]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-benefit-code');
        const label = btn.getAttribute('data-benefit-label') || 'Benefit';
        showBenefitQr(code, label);
      });
    });

    const chip = document.getElementById('wk-tier-chip');
    if (chip) {
      chip.textContent =
        tier === 'flow_crew'
          ? t('tier_crew')
          : tier === 'flow_supporter'
            ? t('tier_sup')
            : t('tier_free');
    }

    const upBtn = document.getElementById('wk-upgrade-btn');
    if (upBtn && t('upgrade_btn') !== 'upgrade_btn') {
      upBtn.textContent = t('upgrade_btn');
    }
  }

  function showBenefitQr(code, label) {
    let modal = document.getElementById('wk-benefit-qr-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wk-benefit-qr-modal';
      modal.className = 'wk-benefit-qr-modal';
      modal.innerHTML =
        '<div class="wk-benefit-qr-card">' +
        '<button type="button" class="wk-benefit-qr-close" aria-label="Close">×</button>' +
        '<p class="wk-benefit-qr-label"></p>' +
        '<img class="wk-benefit-qr-img" alt="Benefit QR" width="220" height="220">' +
        '<p class="wk-benefit-qr-code"></p>' +
        '<p class="wk-hint">Staff scans once. Refills next month.</p>' +
        '</div>';
      document.body.appendChild(modal);
      modal.querySelector('.wk-benefit-qr-close').addEventListener('click', () => {
        modal.hidden = true;
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.hidden = true;
      });
    }
    modal.querySelector('.wk-benefit-qr-label').textContent = label;
    modal.querySelector('.wk-benefit-qr-code').textContent = code;
    const img = modal.querySelector('.wk-benefit-qr-img');
    img.src = window.CdfBenefitGrants
      ? window.CdfBenefitGrants.qrUrl(code)
      : 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(code);
    modal.hidden = false;
    say('Show this QR to staff. One scan per month.', 'guide');
  }

  function openUpgrade() {
    showBenefitsPanel(true);
    say(t('guide_upgrade'), 'guide', [
      {
        label: t('tier_sup'),
        action: () => {
          document.querySelector('[data-tier-select="flow_supporter"]')?.click();
          const btn = document.getElementById('to-tiers-btn');
          if (btn) btn.click();
          else window.location.href = '/membership';
        },
      },
      {
        label: t('tier_crew'),
        action: () => {
          document.querySelector('[data-tier-select="flow_crew"]')?.click();
          const btn = document.getElementById('to-tiers-btn');
          if (btn) btn.click();
          else window.location.href = '/membership';
        },
      },
      {
        label: t('tier_free'),
        action: () => showBenefitsPanel(true),
      },
    ]);
  }

  function glideAndGuide() {
    if (stageDone) return;
    stageDone = true;
    setStage('dock');
    say(t('card_glide'), 'guide', [
      {
        label: t('show_benefits'),
        action: () => {
          showBenefitsPanel(true);
          say(t('guide_benefits'), 'guide', [
            { label: t('upgrade'), action: () => openUpgrade() },
            { label: t('continue_swipe'), action: () => showBenefitsPanel(false) },
          ]);
        },
      },
      { label: t('upgrade'), action: () => openUpgrade() },
      { label: t('continue_swipe'), action: () => showBenefitsPanel(false) },
    ]);
  }

  function welcomeCenter() {
    setStage('center');
    say(t('card_welcome'), 'guide', [
      { label: t('hello_btn'), action: () => glideAndGuide() },
    ]);
    // Wait for user tap — no auto-advance
  }

  function askLanguage() {
    setStage('center');
    say(t('pick_lang'), 'guide', [
      {
        label: 'PORTUGUÊS',
        action: () => {
          window.CDFi18n?.setLang('pt');
          welcomeCenter();
        },
      },
      {
        label: 'ENGLISH',
        action: () => {
          window.CDFi18n?.setLang('en');
          welcomeCenter();
        },
      },
      {
        label: 'DEUTSCH',
        action: () => {
          window.CDFi18n?.setLang('de');
          welcomeCenter();
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
    document.getElementById('wk-upgrade-btn')?.addEventListener('click', () => openUpgrade());

    // Benefits visible by default
    showBenefitsPanel(true);
    renderBenefitsTable();
    askLanguage();
  }

  window.FloweeMemberCardGuide = {
    say,
    showBenefits: () => showBenefitsPanel(true),
    renderBenefitsTable,
    boot,
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(boot, 500);
  });
})();
