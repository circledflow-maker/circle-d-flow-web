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
      b_card: 'Digital Wako Membership Card + QR',
      b_exp: '+25 EXP on claim · Brotherhood ranking',
      b_sanctuary: '3D Artist Sanctuary access',
      b_coupons: 'Partner codes (Humble, Kreativlon, Wako)',
      b_events: 'Member event alerts in Flow Orbit',
      b_sup_extra: 'Supporter badge · priority Flow Pool alerts',
      b_crew_extra: 'Crew badge · early access · stronger Orbit visibility',
      guide_benefits:
        'Here is your benefit table. Green = included now. Gold = unlock with upgrade.',
      guide_upgrade: 'Optional support keeps the Circle alive. Free Bronze card is enough for Sanctuary.',
      auth_gate:
        'Language locked in. Do you already have a Circle login — or shall we register your free Wako Member Card together?',
      auth_login_guide:
        'Enter email + password. I open your Member Card profile and Flow Orbit. +EXP stays on your account.',
      auth_register_guide:
        'We register the free Bronze Member Card together. Name → contact → profile → Claim (+25 EXP). I guide every step.',
      login_go: 'LOGIN · OPEN PROFILE',
      guide_step_name: 'Type the name for the gold plate. This is how the Circle calls you.',
      guide_step_contact: 'Choose how you join — email is safest for Stripe and EXP sync.',
      guide_step_profile: 'Create a password. This binds your card, EXP, and Sanctuary.',
      guide_step_claim: 'Claim stamps member number + QR · +25 EXP · free Bronze is enough.',
      tier_free: 'Bronze · Free',
      tier_sup: 'Silver · €5/mo',
      tier_crew: 'Gold · €10/mo',
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
      b_card: 'Cartão digital Wako + QR',
      b_exp: '+25 EXP no claim · Brotherhood ranking',
      b_sanctuary: 'Acesso ao Santuário 3D',
      b_coupons: 'Códigos de parceiros (Humble, Kreativlon, Wako)',
      b_events: 'Alertas de eventos no Flow Orbit',
      b_sup_extra: 'Badge Supporter · alertas prioritários Flow Pool',
      b_crew_extra: 'Badge Crew · early access · mais visibilidade no Orbit',
      guide_benefits:
        'Aqui está a tabela de benefícios. Verde = incluído agora. Dourado = desbloqueia com upgrade.',
      guide_upgrade: 'O apoio opcional mantém o Circle vivo. O cartão Bronze grátis basta para o Santuário.',
      auth_gate:
        'Idioma definido. Já tens login no Circle — ou registamos juntos o teu Wako Member Card grátis?',
      auth_login_guide:
        'Email + password. Abro o teu perfil Member Card e Flow Orbit. O EXP fica na conta.',
      auth_register_guide:
        'Registamos o Member Card Bronze grátis juntos. Nome → contacto → perfil → Claim (+25 EXP).',
      login_go: 'LOGIN · ABRIR PERFIL',
      guide_step_name: 'Escreve o nome na placa dourada — assim o Circle chama-te.',
      guide_step_contact: 'Escolhe como entras — email é o mais seguro para Stripe e EXP.',
      guide_step_profile: 'Cria uma password. Liga o cartão, EXP e Santuário.',
      guide_step_claim: 'Claim grava número + QR · +25 EXP · Bronze grátis chega.',
      tier_free: 'Bronze · Grátis',
      tier_sup: 'Silver · €5/mês',
      tier_crew: 'Gold · €10/mês',
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
      b_card: 'Digitale Wako Membership Card + QR',
      b_exp: '+25 EXP beim Claim · Brotherhood Ranking',
      b_sanctuary: 'Zugang zur 3D Artist Sanctuary',
      b_coupons: 'Partner-Codes (Humble, Kreativlon, Wako)',
      b_events: 'Event-Alerts im Flow Orbit',
      b_sup_extra: 'Supporter-Badge · Prioritäts-Alerts Flow Pool',
      b_crew_extra: 'Crew-Badge · Early Access · stärkere Orbit-Sichtbarkeit',
      guide_benefits:
        'Hier ist deine Benefit-Tabelle. Grün = jetzt inklusive. Gold = mit Upgrade freischalten.',
      guide_upgrade: 'Optionale Unterstützung hält den Circle am Leben. Die Free Bronze Card reicht für die Sanctuary.',
      auth_gate:
        'Sprache steht. Hast du schon einen Circle-Login — oder registrieren wir zusammen deine kostenlose Wako Member Card?',
      auth_login_guide:
        'E-Mail + Passwort. Ich öffne dein Member-Card-Profil und Flow Orbit. EXP bleibt auf dem Konto.',
      auth_register_guide:
        'Wir registrieren die Free Bronze Member Card zusammen. Name → Kontakt → Profil → Claim (+25 EXP). Ich führe dich Schritt für Schritt.',
      login_go: 'LOGIN · PROFIL ÖFFNEN',
      guide_step_name: 'Tippe den Namen auf die Goldplatte — so ruft dich der Circle.',
      guide_step_contact: 'Wähle den Weg rein — E-Mail ist am sichersten für Stripe und EXP.',
      guide_step_profile: 'Passwort anlegen. Das bindet Karte, EXP und Sanctuary.',
      guide_step_claim: 'Claim setzt Nummer + QR · +25 EXP · Free Bronze reicht.',
      tier_free: 'Bronze · Kostenlos',
      tier_sup: 'Silver · €5/Mon',
      tier_crew: 'Gold · €10/Mon',
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
