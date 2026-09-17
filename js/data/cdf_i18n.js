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
      benefits_sub: 'Current tier vs upgrades you can purchase.',
      tier_now: 'Current',
      tier_buy: 'Available',
      tier_free: 'Registered · Free',
      tier_sup: 'Flow Supporter · €5/mo',
      tier_crew: 'Flow Crew · €10/mo',
      b_card: 'Digital Wako Membership Card + QR',
      b_exp: '+25 EXP on claim · Brotherhood ranking',
      b_sanctuary: '3D Artist Sanctuary access',
      b_coupons: 'Partner codes (Humble, Kreativlon, Wako)',
      b_events: 'Member event alerts in Flow Orbit',
      b_sup_extra: 'Supporter badge · priority Flow Pool alerts',
      b_crew_extra: 'Crew badge · early access · stronger Orbit visibility',
      guide_benefits:
        'Here is your benefit table. Green = included now. Gold = unlock with upgrade.',
      guide_upgrade: 'Optional support keeps the Circle alive. Free card is enough to enter Sanctuary.',
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
      benefits_sub: 'Nível atual vs upgrades que podes comprar.',
      tier_now: 'Atual',
      tier_buy: 'Disponível',
      tier_free: 'Registered · Grátis',
      tier_sup: 'Flow Supporter · €5/mês',
      tier_crew: 'Flow Crew · €10/mês',
      b_card: 'Cartão digital Wako + QR',
      b_exp: '+25 EXP no claim · Brotherhood ranking',
      b_sanctuary: 'Acesso ao Santuário 3D',
      b_coupons: 'Códigos de parceiros (Humble, Kreativlon, Wako)',
      b_events: 'Alertas de eventos no Flow Orbit',
      b_sup_extra: 'Badge Supporter · alertas prioritários Flow Pool',
      b_crew_extra: 'Badge Crew · early access · mais visibilidade no Orbit',
      guide_benefits:
        'Aqui está a tabela de benefícios. Verde = incluído agora. Dourado = desbloqueia com upgrade.',
      guide_upgrade: 'O apoio opcional mantém o Circle vivo. O cartão grátis basta para o Santuário.',
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
      benefits_sub: 'Aktuelle Stufe vs. kaufbare Upgrades.',
      tier_now: 'Aktuell',
      tier_buy: 'Kaufbar',
      tier_free: 'Registered · Kostenlos',
      tier_sup: 'Flow Supporter · €5/Mon',
      tier_crew: 'Flow Crew · €10/Mon',
      b_card: 'Digitale Wako Membership Card + QR',
      b_exp: '+25 EXP beim Claim · Brotherhood Ranking',
      b_sanctuary: 'Zugang zur 3D Artist Sanctuary',
      b_coupons: 'Partner-Codes (Humble, Kreativlon, Wako)',
      b_events: 'Event-Alerts im Flow Orbit',
      b_sup_extra: 'Supporter-Badge · Prioritäts-Alerts Flow Pool',
      b_crew_extra: 'Crew-Badge · Early Access · stärkere Orbit-Sichtbarkeit',
      guide_benefits:
        'Hier ist deine Benefit-Tabelle. Grün = jetzt inklusive. Gold = mit Upgrade freischalten.',
      guide_upgrade: 'Optionale Unterstützung hält den Circle am Leben. Die Free Card reicht für die Sanctuary.',
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
    host.innerHTML = '';
    host.classList.add('cdf-lang-switch');
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', t('lang_label'));
    SUPPORTED.forEach((code) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cdf-lang-btn' + (code === getLang() ? ' on' : '');
      btn.textContent = code.toUpperCase();
      btn.setAttribute('aria-pressed', code === getLang() ? 'true' : 'false');
      btn.addEventListener('click', () => {
        setLang(code);
        host.querySelectorAll('.cdf-lang-btn').forEach((b) => {
          const on = b.textContent.toLowerCase() === code;
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
