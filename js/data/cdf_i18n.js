/**
 * Circle D Flow — shared PT / EN / DE strings (Join + Member Card + Flowee)
 */
(function () {
  const KEY = 'cdf_lang';
  const SUPPORTED = ['pt', 'en', 'de'];

  const STR = {
    en: {
      lang_label: 'Language',
      hello: 'Akwaaba. I am Flowee — your guide in Circle D Flow and Wako Kungo.',
      hello_btn: 'HELLO FLOWEE',
      pick_lang: 'Choose your language — then I welcome you into the Flow.',
      dock_intro:
        'You landed on the Circle entrance. Here you register, claim your Wako Kungo Membership Card, and enter the 3D Artist Sanctuary.',
      what_next: 'WHAT IS NEXT?',
      register_me: 'REGISTER WITH ME',
      have_login: 'I ALREADY HAVE A LOGIN',
      claim_card: 'CLAIM MEMBER CARD',
      see_ig: 'SEE EVENT ON IG',
      reg_open:
        'Registration is open. I stay with you field by field. When you finish, claim your Wako Kungo Membership Card — then the 3D Sanctuary.',
      start_name: 'START WITH MY NAME',
      card_welcome:
        'Welcome. I am Flowee. Your Wako Kungo Membership Card lives here — benefits, upgrades, Sanctuary.',
      card_glide: 'I move aside so you can swipe. Ask me about benefits anytime.',
      show_benefits: 'SHOW BENEFITS',
      upgrade: 'UPGRADE CARD',
      continue_swipe: 'CONTINUE',
      benefits_title: 'Your benefits',
      benefits_sub: 'Tap a benefit you own to open its QR for staff. ★ = unlock with upgrade. Refills each month.',
      tier_now: 'Current',
      tier_buy: 'Available',
      tier_free: 'Bronze · Free',
      tier_sup: 'Silver · €5/mo or €50/yr',
      tier_crew: 'Gold · €10/mo or €100/yr',
      upgrade_btn: 'Upgrade · Silver / Gold',
      full_tiers: 'Full tiers & rules',
      billing_month: 'Monthly',
      billing_year: 'Yearly (2 months free)',
      b_card: 'Digital Wako Membership Card + QR',
      b_exp: '+25 EXP on claim · Brotherhood ranking',
      b_sanctuary: '3D Artist Sanctuary access',
      b_events: 'Member event alerts in Flow Orbit',
      b_wako_free: 'Free access to Wako Kungo events',
      b_coupons: 'Partner coupons (Humble, Kreativlon, Wako)',
      b_guest: '+1 guest at events',
      b_drink_silver: '1 free drink for one event',
      b_alerts: 'Informed + early alerts for selected events',
      b_folders: 'Access to content folders',
      b_shoot: 'Book 1 hour shooting session',
      b_early: 'Early access / free or discount on selected events',
      b_drink_gold: '1 free drink at 3 events / month',
      guide_benefits:
        'Silver includes free Wako events, coupons, +1 guest and 1 drink. Tap Open on a benefit for staff QR.',
      guide_upgrade: 'Pay monthly or yearly. Bronze is enough for Sanctuary. Silver unlocks events + coupons.',
    },
    pt: {
      lang_label: 'Idioma',
      hello: 'Akwaaba. Sou a Flowee — a tua guia no Circle D Flow e Wako Kungo.',
      hello_btn: 'OLÁ FLOWEE',
      pick_lang: 'Escolhe o idioma — depois dou-te as boas-vindas ao Flow.',
      dock_intro:
        'Chegaste à entrada do Circle. Aqui registas-te, pedes o Wako Kungo Membership Card e entras no Santuário 3D.',
      what_next: 'O QUE SEGUE?',
      register_me: 'REGISTAR COMIGO',
      have_login: 'JÁ TENHO LOGIN',
      claim_card: 'PEDIR MEMBER CARD',
      see_ig: 'VER EVENTO NO IG',
      reg_open:
        'O registo está aberto. Fico contigo campo a campo. No fim, pede o Membership Card — depois o Santuário 3D.',
      start_name: 'COMEÇAR PELO NOME',
      card_welcome:
        'Bem-vindo/a. Sou a Flowee. O teu Wako Kungo Membership Card vive aqui — benefícios, upgrades, Santuário.',
      card_glide: 'Afasto-me para poderes deslizar. Pergunta-me pelos benefícios quando quiseres.',
      show_benefits: 'VER BENEFÍCIOS',
      upgrade: 'UPGRADE DO CARD',
      continue_swipe: 'CONTINUAR',
      benefits_title: 'Os teus benefícios',
      benefits_sub: 'Toca num benefício teu para abrir o QR. ★ = com upgrade. Renova cada mês.',
      tier_now: 'Atual',
      tier_buy: 'Disponível',
      tier_free: 'Bronze · Grátis',
      tier_sup: 'Silver · €5/mês ou €50/ano',
      tier_crew: 'Gold · €10/mês ou €100/ano',
      upgrade_btn: 'Upgrade · Silver / Gold',
      full_tiers: 'Tiers e regras',
      billing_month: 'Mensal',
      billing_year: 'Anual (2 meses grátis)',
      b_card: 'Cartão digital Wako + QR',
      b_exp: '+25 EXP no claim · Brotherhood ranking',
      b_sanctuary: 'Acesso ao Santuário 3D',
      b_events: 'Alertas de eventos no Flow Orbit',
      b_wako_free: 'Acesso grátis a eventos Wako Kungo',
      b_coupons: 'Cupões de parceiros (Humble, Kreativlon, Wako)',
      b_guest: '+1 convidado nos eventos',
      b_drink_silver: '1 bebida grátis num evento',
      b_alerts: 'Info + alertas early para eventos selecionados',
      b_folders: 'Acesso a pastas de conteúdo',
      b_shoot: 'Reservar 1 hora de shooting',
      b_early: 'Early access / grátis ou desconto em eventos',
      b_drink_gold: '1 bebida grátis em 3 eventos / mês',
      guide_benefits:
        'Silver inclui eventos Wako grátis, cupões, +1 e 1 bebida. Toca Open para QR da equipa.',
      guide_upgrade: 'Mensal ou anual. Bronze chega para o Santuário. Silver = eventos + cupões.',
    },
    de: {
      lang_label: 'Sprache',
      hello: 'Akwaaba. Ich bin Flowee — dein Guide in Circle D Flow und Wako Kungo.',
      hello_btn: 'HALLO FLOWEE',
      pick_lang: 'Wähle deine Sprache — dann heiße ich dich im Flow willkommen.',
      dock_intro:
        'Du bist am Circle-Eingang. Hier registrierst du dich, holst deine Wako Kungo Membership Card und gehst in die 3D Artist Sanctuary.',
      what_next: 'WAS ALS NÄCHSTES?',
      register_me: 'MIT MIR REGISTRIEREN',
      have_login: 'ICH HABE SCHON LOGIN',
      claim_card: 'MEMBER CARD HOLEN',
      see_ig: 'EVENT AUF IG',
      reg_open:
        'Registrierung ist offen. Ich bleibe Feld für Feld bei dir. Danach: Membership Card — dann 3D Sanctuary.',
      start_name: 'MIT NAME STARTEN',
      card_welcome:
        'Willkommen. Ich bin Flowee. Deine Wako Kungo Membership Card lebt hier — Benefits, Upgrades, Sanctuary.',
      card_glide: 'Ich gehe zur Seite, damit du swipen kannst. Frag mich jederzeit nach Benefits.',
      show_benefits: 'BENEFITS ZEIGEN',
      upgrade: 'CARD UPGRADEN',
      continue_swipe: 'WEITER',
      benefits_title: 'Deine Benefits',
      benefits_sub: 'Tippe einen eigenen Benefit für den Staff-QR. ★ = Upgrade. Monatlich neu.',
      tier_now: 'Aktuell',
      tier_buy: 'Kaufbar',
      tier_free: 'Bronze · Kostenlos',
      tier_sup: 'Silver · €5/Mon oder €50/Jahr',
      tier_crew: 'Gold · €10/Mon oder €100/Jahr',
      upgrade_btn: 'Upgrade · Silver / Gold',
      full_tiers: 'Tiers & Regeln',
      billing_month: 'Monatlich',
      billing_year: 'Jährlich (2 Monate gratis)',
      b_card: 'Digitale Wako Membership Card + QR',
      b_exp: '+25 EXP beim Claim · Brotherhood Ranking',
      b_sanctuary: 'Zugang zur 3D Artist Sanctuary',
      b_events: 'Event-Alerts im Flow Orbit',
      b_wako_free: 'Freier Zugang zu Wako-Kungo-Events',
      b_coupons: 'Partner-Coupons (Humble, Kreativlon, Wako)',
      b_guest: '+1 Gast bei Events',
      b_drink_silver: '1 Free Drink bei einem Event',
      b_alerts: 'Info + Early Alerts für ausgewählte Events',
      b_folders: 'Zugang zu Content-Ordnern',
      b_shoot: '1 Stunde Shooting buchen',
      b_early: 'Early Access / gratis oder Rabatt bei Events',
      b_drink_gold: '1 Free Drink bei 3 Events / Monat',
      guide_benefits:
        'Silver: freie Wako-Events, Coupons, Gast+1, 1 Drink. Open zeigt Staff-QR.',
      guide_upgrade: 'Monatlich oder jährlich. Bronze reicht für Sanctuary. Silver = Events + Coupons.',
    },
  };

  function normalize(lang) {
    const l = String(lang || '').toLowerCase().slice(0, 2);
    return SUPPORTED.includes(l) ? l : 'en';
  }

  function getLang() {
    try {
      const q = new URLSearchParams(window.location.search).get('lang');
      if (q) return normalize(q);
      return normalize(localStorage.getItem(KEY) || navigator.language);
    } catch (_) {
      return 'en';
    }
  }

  function setLang(lang) {
    const l = normalize(lang);
    try {
      localStorage.setItem(KEY, l);
    } catch (_) { /* ignore */ }
    document.documentElement.lang = l === 'pt' ? 'pt' : l;
    document.dispatchEvent(new CustomEvent('cdf:lang', { detail: { lang: l } }));
    return l;
  }

  function t(key, lang) {
    const l = normalize(lang || getLang());
    return (STR[l] && STR[l][key]) || STR.en[key] || key;
  }

  function mountSwitcher(host, onChange) {
    if (!host) return null;
    host.classList.add('cdf-lang-switch');
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', t('lang_label'));
    const existing = host.querySelectorAll('[data-lang]');
    if (existing.length) {
      existing.forEach((btn) => {
        const code = normalize(btn.getAttribute('data-lang'));
        btn.classList.add('cdf-lang-btn');
        btn.classList.toggle('on', code === getLang());
        btn.setAttribute('aria-pressed', code === getLang() ? 'true' : 'false');
        btn.onclick = () => {
          setLang(code);
          host.querySelectorAll('[data-lang]').forEach((b) => {
            const on = normalize(b.getAttribute('data-lang')) === code;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          if (typeof onChange === 'function') onChange(code);
        };
      });
      return host;
    }
    host.innerHTML = '';
    SUPPORTED.forEach((code) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cdf-lang-btn' + (code === getLang() ? ' on' : '');
      btn.textContent = code.toUpperCase();
      btn.setAttribute('data-lang', code);
      btn.setAttribute('aria-pressed', code === getLang() ? 'true' : 'false');
      btn.addEventListener('click', () => {
        setLang(code);
        host.querySelectorAll('.cdf-lang-btn').forEach((b) => {
          const on = b.getAttribute('data-lang') === code;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (typeof onChange === 'function') onChange(code);
      });
      host.appendChild(btn);
    });
    return host;
  }

  window.CDFi18n = { KEY, SUPPORTED, STR, getLang, setLang, t, mountSwitcher, normalize };
})();
