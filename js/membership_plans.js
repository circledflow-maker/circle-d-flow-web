/**
 * Membership plans — Flowee language gate, cinematic PiP intro (1–4s), plans + DATEV Q&A
 */
(function () {
  const LANG_KEY = 'cdf_lang';
  const SKIP_KEY = 'cdf_mp_intro_skip';

  const CINE = [
    '/Assets/membership/intro/cine_01_cafe.png',
    '/Assets/membership/intro/cine_02_handpan.png',
    '/Assets/membership/intro/cine_03_smile.png',
    '/Assets/membership/intro/cine_04_gallery.png',
    '/Assets/membership/intro/cine_05_lapa71.png',
  ];
  const PIP = [
    { src: '/Assets/membership/intro/pip_plans.png', label: 'Plans' },
    { src: '/Assets/membership/intro/pip_member.png', label: 'Member Card' },
    { src: '/Assets/membership/intro/pip_admin.png', label: 'Flow Control' },
    { src: '/Assets/membership/intro/pip_admin2.png', label: 'Orbit Admin' },
  ];

  const I18N = {
    en: {
      gate_title: 'Welcome, navigator.',
      gate_lead:
        'We are glad you are on this journey with us. Choose a language — then a short cinematic shows what lives behind Membership.',
      cine: [
        'Lisbon culture · Wako stages · your Member Card.',
        'Prototype peek — plans, card, Sanctuary behind the curtain.',
        'Goals: bridges between artists, audiences, and the city.',
        'Values: kiss your heart · share the Flow · fair exchange.',
        'Thank you for walking with Circle D Flow × Wako Kungo.',
      ],
      title: 'Membership plans',
      lead: 'Bronze is free and enough for Sanctuary. Silver and Gold keep Wako nights and partners alive — thank you for walking with us.',
      about_title: 'About us',
      about_p1:
        'Circle D Flow turns Lisbon into a living culture-tech RPG: Navigators explore real places, earn EXP, and meet artists through digital narrative.',
      about_p2:
        'Wako Kungo — founded in Lisbon 2022 by Mistah Isaac — builds bridges between independent & diaspora artists, audiences, and city spaces. 700+ cultural activations, 367+ artists supported.',
      about_p3:
        'Together we prototype Membership: free Bronze card → Sanctuary & Flow Orbit → optional Silver/Gold support for venues, partners, and documentation.',
      monthly: 'Monthly',
      yearly: 'Yearly (2 months free)',
      bronze_name: 'Free',
      bronze_1: 'Digital Wako Kungo card + QR',
      bronze_2: '+25 EXP on claim · ranking',
      bronze_3: '3D Artist Sanctuary',
      bronze_4: 'Flow Orbit event alerts',
      bronze_cta: 'Stay Bronze · Claim card',
      silver_1: 'Free Wako Kungo event access',
      silver_2: 'Partner coupons · +1 guest',
      silver_3: '1 free drink / month',
      silver_4: 'Early member alerts',
      silver_cta: 'Choose Silver',
      gold_1: 'Everything in Silver',
      gold_2: 'Content folders · 1h shoot booking',
      gold_3: 'Early / discounted events',
      gold_4: '3 free drinks / month',
      gold_cta: 'Choose Gold',
      funds_title: 'How the money is used',
      funds_lead: 'Paid memberships fund real culture work in Lisbon — not ads.',
      funds_1: 'Venue & session costs (Botânica, Alfama/Graça stages, community nights)',
      funds_2: 'Artists, documentation, and Flowee tooling',
      funds_3: 'Partner perks you can redeem',
      funds_4: 'Sanctuary / map / membership infrastructure',
      values_title: 'Values & goals',
      v1: 'Kiss your heart — effort over ego; come as you are.',
      v2: 'Build bridges — diaspora & local artists, audiences, city spaces (Wako).',
      v3: 'Share the Flow — creative immersion for everyone (Circle D Flow).',
      v4: 'Fair exchange — presence and traffic reward the community.',
      v5: 'Transparent tiers — free Bronze stays open; paid is optional support.',
      qa_title: 'Q & A',
      q1: 'Is Bronze really free?',
      a1: 'Yes. Claim your digital Member Card, get +25 EXP, Sanctuary and Orbit alerts. No card required.',
      q2: 'Can I cancel Silver or Gold anytime?',
      a2: 'Yes via Stripe. Paid perks end at period close. EXP and Bronze card remain.',
      q3: 'What is Flowee?',
      a3: 'Your guide in the Circle — language, registration, reminders for Next Flow, and help inside Membership and Admin.',
      q4: 'Do you issue invoices / DATEV?',
      a4: 'Stripe handles payment receipts. For German bookkeeping we keep invoice-ready records (customer, amount, VAT if applicable, period, Stripe ID) exportable for DATEV-compatible accounting on request.',
      q5: 'Where is my data stored?',
      a5: 'Account & profile in Supabase. Payments via Stripe. Cookies for language & card — notifications only with consent.',
      policy_title: 'Legal · Privacy · DATEV',
      policy_lead:
        'Transparent membership terms aligned with EU GDPR and German accounting practice (DATEV-ready records).',
      p1: 'Contract — Digital membership via Stripe. Contact via Instagram @wako.kungo.',
      p2: 'Right of withdrawal — Cancel anytime for the next period; digital services may start immediately after payment.',
      p3: 'Prices & VAT — Charged amount as shown; VAT itemized on Stripe receipts when applicable.',
      p4: 'DATEV / bookkeeping — We retain payment ID, date, customer, net/gross, product, period. Export for Steuerberater on request. Retention typically 10 years (AO).',
      p5: 'GDPR — Contract, legitimate interest, consent for cookies/notifications. Rights: access, erasure, portability, complaint.',
      p6: 'Fair use — Benefit QR personal, one scan, monthly refill. Abuse may pause perks without deleting EXP.',
      p7: 'Processors — Stripe, Supabase, Vercel. No sale of personal data.',
      flowee_hi: 'Language locked. Short cinematic — then plans. Skip anytime. Login or Register when you feel ready.',
    },
    pt: {
      gate_title: 'Bem-vindo/a, navigator.',
      gate_lead:
        'Ficamos felizes por caminhares connosco. Escolhe o idioma — depois um cinematic curto mostra o que há por trás da Membership.',
      cine: [
        'Cultura de Lisboa · palcos Wako · o teu Member Card.',
        'Protótipo — planos, cartão, Santuário por detrás da cortina.',
        'Objetivos: pontes entre artistas, públicos e a cidade.',
        'Valores: kiss your heart · partilhar o Flow · troca justa.',
        'Obrigado por caminhares com Circle D Flow × Wako Kungo.',
      ],
      title: 'Planos de membership',
      lead: 'Bronze é grátis e chega para o Santuário. Silver e Gold mantêm as noites Wako vivas — obrigado por estares connosco.',
      about_title: 'Sobre nós',
      about_p1:
        'Circle D Flow transforma Lisboa num RPG culture-tech: Navigators exploram lugares reais, ganham EXP e encontram artistas.',
      about_p2:
        'Wako Kungo — Lisboa 2022, Mistah Isaac — pontes entre artistas independentes e da diáspora, públicos e espaços da cidade. 700+ ativações, 367+ artistas.',
      about_p3:
        'Juntos prototipamos Membership: cartão Bronze grátis → Santuário & Orbit → apoio opcional Silver/Gold.',
      monthly: 'Mensal',
      yearly: 'Anual (2 meses grátis)',
      bronze_name: 'Grátis',
      bronze_1: 'Cartão digital Wako + QR',
      bronze_2: '+25 EXP no claim · ranking',
      bronze_3: 'Santuário 3D',
      bronze_4: 'Alertas de eventos no Orbit',
      bronze_cta: 'Ficar Bronze · Pedir cartão',
      silver_1: 'Acesso gratuito a eventos Wako',
      silver_2: 'Cupões de parceiros · +1 convidado',
      silver_3: '1 bebida grátis / mês',
      silver_4: 'Alertas early para membros',
      silver_cta: 'Escolher Silver',
      gold_1: 'Tudo do Silver',
      gold_2: 'Pastas de conteúdo · 1h de shoot',
      gold_3: 'Eventos early / com desconto',
      gold_4: '3 bebidas grátis / mês',
      gold_cta: 'Escolher Gold',
      funds_title: 'Como usamos o dinheiro',
      funds_lead: 'Memberships pagas financiam cultura real em Lisboa — não anúncios.',
      funds_1: 'Custos de venue e sessões (Botânica, Alfama/Graça, noites comunitárias)',
      funds_2: 'Artistas, documentação e Flowee',
      funds_3: 'Benefícios de parceiros',
      funds_4: 'Infraestrutura Sanctuary / mapa / membership',
      values_title: 'Valores e objetivos',
      v1: 'Kiss your heart — esforço sobre ego.',
      v2: 'Construir pontes — artistas, públicos, cidade (Wako).',
      v3: 'Partilhar o Flow — imersão criativa para todos.',
      v4: 'Troca justa — presença recompensa a comunidade.',
      v5: 'Níveis transparentes — Bronze grátis permanece aberto.',
      qa_title: 'Perguntas',
      q1: 'Bronze é mesmo grátis?',
      a1: 'Sim. Cartão digital, +25 EXP, Santuário e Orbit. Sem cartão de crédito.',
      q2: 'Posso cancelar Silver/Gold?',
      a2: 'Sim via Stripe. Benefícios pagos terminam no fim do período. EXP e Bronze ficam.',
      q3: 'O que é a Flowee?',
      a3: 'A tua guia no Circle — idioma, registo, lembretes e ajuda em Membership e Admin.',
      q4: 'Faturas / DATEV?',
      a4: 'Stripe emite recibos. Guardamos registos prontos para contabilidade DATEV sob pedido.',
      q5: 'Onde estão os meus dados?',
      a5: 'Perfil no Supabase. Pagamentos no Stripe. Cookies só para idioma/cartão; notificações com consentimento.',
      policy_title: 'Legal · Privacidade · DATEV',
      policy_lead: 'Termos alinhados com RGPD e boa prática contabilística (DATEV).',
      p1: 'Contrato — Membership digital via Stripe. Contacto @wako.kungo.',
      p2: 'Cancelamento — a qualquer momento para o período seguinte.',
      p3: 'Preços e IVA — valor cobrado; IVA no recibo Stripe quando aplicável.',
      p4: 'DATEV — guardamos ID, data, cliente, montantes, produto, período. Exportação sob pedido. Retenção tipicamente 10 anos.',
      p5: 'RGPD — contrato, interesse legítimo, consentimento. Direitos de acesso, apagamento, portabilidade.',
      p6: 'Uso justo — QR pessoal, um scan, refill mensal.',
      p7: 'Processadores — Stripe, Supabase, Vercel. Sem venda de dados.',
      flowee_hi: 'Idioma definido. Cinematic curto — depois os planos. Podes saltar. Login ou Registo quando quiseres.',
    },
    de: {
      gate_title: 'Willkommen, Navigator.',
      gate_lead:
        'Schön, dass du uns auf der Reise begleitest. Sprache wählen — dann zeigt ein kurzes Cinematic, was hinter Membership steckt.',
      cine: [
        'Lisbon Culture · Wako Stages · deine Member Card.',
        'Prototype — Pläne, Karte, Sanctuary hinter dem Vorhang.',
        'Ziele: Brücken zwischen Artists, Publikum und Stadt.',
        'Values: Kiss your heart · Flow teilen · fairer Austausch.',
        'Danke, dass du mit Circle D Flow × Wako Kungo gehst.',
      ],
      title: 'Membership-Pläne',
      lead: 'Bronze ist kostenlos und reicht für die Sanctuary. Silver und Gold halten Wako-Nächte am Leben — danke, dass du dabei bist.',
      about_title: 'Über uns',
      about_p1:
        'Circle D Flow macht Lissabon zum Culture-Tech-RPG: Navigators erkunden echte Orte, sammeln EXP und treffen Artists.',
      about_p2:
        'Wako Kungo — Lissabon 2022, Mistah Isaac — Brücken zwischen Independent- & Diaspora-Artists, Publikum und Stadträumen. 700+ Activations, 367+ Artists.',
      about_p3:
        'Gemeinsam Prototyp Membership: Free Bronze Card → Sanctuary & Orbit → optional Silver/Gold für Venues, Partner, Doku.',
      monthly: 'Monatlich',
      yearly: 'Jährlich (2 Monate gratis)',
      bronze_name: 'Kostenlos',
      bronze_1: 'Digitale Wako-Karte + QR',
      bronze_2: '+25 EXP beim Claim · Ranking',
      bronze_3: '3D Artist Sanctuary',
      bronze_4: 'Flow-Orbit Event-Alerts',
      bronze_cta: 'Bronze bleiben · Karte holen',
      silver_1: 'Freier Zugang zu Wako-Events',
      silver_2: 'Partner-Coupons · +1 Gast',
      silver_3: '1 Free Drink / Monat',
      silver_4: 'Frühe Member-Alerts',
      silver_cta: 'Silver wählen',
      gold_1: 'Alles aus Silver',
      gold_2: 'Content-Ordner · 1h Shoot',
      gold_3: 'Early / vergünstigte Events',
      gold_4: '3 Free Drinks / Monat',
      gold_cta: 'Gold wählen',
      funds_title: 'Wofür das Geld steht',
      funds_lead: 'Bezahlte Memberships finanzieren echte Kultur in Lissabon — keine Ads.',
      funds_1: 'Venue- & Session-Kosten (Botânica, Alfama/Graça, Community Nights)',
      funds_2: 'Artists, Dokumentation und Flowee',
      funds_3: 'Partner-Perks zum Einlösen',
      funds_4: 'Sanctuary / Map / Membership-Infra',
      values_title: 'Values & Goals',
      v1: 'Kiss your heart — Effort vor Ego.',
      v2: 'Brücken bauen — Artists, Publikum, Stadt (Wako).',
      v3: 'Flow teilen — kreatives Eintauchen für alle.',
      v4: 'Fairer Austausch — Präsenz belohnt die Community.',
      v5: 'Transparente Tiers — Free Bronze bleibt offen.',
      qa_title: 'Fragen & Antworten',
      q1: 'Ist Bronze wirklich gratis?',
      a1: 'Ja. Digitale Member Card, +25 EXP, Sanctuary und Orbit. Keine Kreditkarte nötig.',
      q2: 'Kann ich Silver/Gold jederzeit kündigen?',
      a2: 'Ja über Stripe. Bezahlte Perks enden zum Periodenende. EXP und Bronze bleiben.',
      q3: 'Was ist Flowee?',
      a3: 'Dein Guide im Circle — Sprache, Registrierung, Erinnerungen und Hilfe in Membership und Admin.',
      q4: 'Rechnungen / DATEV?',
      a4: 'Stripe liefert Belege. Wir führen buchungsfähige Datensätze (Kunde, Betrag, USt falls, Periode, Stripe-ID) und exportieren DATEV-kompatibel auf Anfrage.',
      q5: 'Wo liegen meine Daten?',
      a5: 'Profil in Supabase. Zahlungen bei Stripe. Cookies für Sprache/Karte; Notifications nur mit Einwilligung.',
      policy_title: 'Rechtliches · Datenschutz · DATEV',
      policy_lead:
        'Transparente Membership-Bedingungen im Einklang mit DSGVO und deutscher Buchführungspraxis (DATEV-ready).',
      p1: 'Vertrag — Digitale Membership via Stripe. Kontakt Instagram @wako.kungo.',
      p2: 'Widerruf/Kündigung — jederzeit zum nächsten Zeitraum; digitale Leistung kann sofort beginnen.',
      p3: 'Preise & USt — angezeigter Betrag; USt auf Stripe-Belegen wenn anwendbar.',
      p4: 'DATEV — Aufbewahrung: Zahlungs-ID, Datum, Kunde, Netto/Brutto, Produkt, Periode. Export für Steuerberater auf Anfrage. Aufbewahrung i. d. R. 10 Jahre (§147 AO).',
      p5: 'DSGVO — Vertrag, berechtigtes Interesse, Einwilligung für Cookies/Notifications. Rechte: Auskunft, Löschung, Portabilität, Beschwerde.',
      p6: 'Fair Use — Benefit-QR persönlich, ein Scan, monatlicher Refill.',
      p7: 'Auftragsverarbeiter — Stripe, Supabase, Vercel. Kein Verkauf personenbezogener Daten.',
      flowee_hi: 'Sprache steht. Kurzes Cinematic — dann die Pläne. Skip jederzeit. Login oder Registration, wann du bereit bist.',
    },
  };

  let lang = 'en';
  let introTimer = null;
  let introStart = 0;
  const INTRO_MS = 12000;

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function say(text) {
    const a = window.flowee || window.Flowee;
    if (a && typeof a.talk === 'function') a.talk(true, text, 'guide');
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) el.innerHTML = val;
    });
    const gateTitle = document.getElementById('mp-gate-title');
    const gateLead = document.getElementById('mp-gate-lead');
    if (gateTitle) gateTitle.textContent = t('gate_title');
    if (gateLead) gateLead.textContent = t('gate_lead');
  }

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

  function showMain() {
    document.getElementById('mp-gate')?.setAttribute('hidden', '');
    document.getElementById('mp-intro')?.setAttribute('hidden', '');
    const main = document.getElementById('mp-main');
    if (main) main.hidden = false;
    applyI18n();
    syncPrices();
    say(t('lead'));
  }

  function setPip(visible, index) {
    const pip = document.getElementById('mp-pip');
    const img = document.getElementById('mp-pip-img');
    const label = document.getElementById('mp-pip-label');
    if (!pip) return;
    if (!visible) {
      pip.hidden = true;
      return;
    }
    const item = PIP[index % PIP.length];
    if (img) img.src = item.src;
    if (label) label.textContent = item.label;
    pip.hidden = false;
  }

  function tickIntro() {
    const elapsed = Date.now() - introStart;
    const p = Math.min(1, elapsed / INTRO_MS);
    const bar = document.getElementById('mp-cine-bar');
    if (bar) bar.style.width = p * 100 + '%';

    const sec = elapsed / 1000;
    const mainIdx = Math.min(CINE.length - 1, Math.floor(sec / 2.2));
    const main = document.getElementById('mp-cine-main');
    if (main && main.dataset.idx !== String(mainIdx)) {
      main.dataset.idx = String(mainIdx);
      main.src = CINE[mainIdx];
    }

    const line = document.getElementById('mp-cine-line');
    const lines = I18N[lang]?.cine || I18N.en.cine;
    if (line) line.textContent = lines[Math.min(lines.length - 1, mainIdx)];

    // Video-in-video screenshots between 1s and 4s
    if (sec >= 1 && sec < 4) {
      const pipIdx = Math.floor((sec - 1) / 0.75);
      setPip(true, pipIdx);
    } else {
      setPip(false, 0);
    }

    if (elapsed >= INTRO_MS) {
      finishIntro();
      return;
    }
    introTimer = requestAnimationFrame(tickIntro);
  }

  function startIntro() {
    document.getElementById('mp-gate')?.setAttribute('hidden', '');
    const intro = document.getElementById('mp-intro');
    if (intro) intro.hidden = false;
    document.getElementById('mp-main')?.setAttribute('hidden', '');
    introStart = Date.now();
    say(t('flowee_hi'));
    cancelAnimationFrame(introTimer);
    introTimer = requestAnimationFrame(tickIntro);
  }

  function finishIntro() {
    cancelAnimationFrame(introTimer);
    introTimer = null;
    try {
      sessionStorage.setItem(SKIP_KEY, '1');
    } catch (_) {}
    showMain();
  }

  function pickLang(code) {
    lang = code === 'pt' || code === 'de' ? code : 'en';
    try {
      localStorage.setItem(LANG_KEY, lang);
      window.CDFi18n?.setLang?.(lang);
    } catch (_) {}
    document.documentElement.lang = lang;
    applyI18n();
    startIntro();
  }

  function boot() {
    document.querySelectorAll('.mp-lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => pickLang(btn.getAttribute('data-lang')));
    });
    document.getElementById('mp-intro-skip')?.addEventListener('click', finishIntro);
    document.getElementById('mp-intro-login')?.addEventListener('click', () => {
      window.location.href = '/member-card?auth=login';
    });
    document.getElementById('mp-intro-register')?.addEventListener('click', () => {
      window.location.href = '/member-card?auth=register';
    });

    document.querySelectorAll('input[name="mp-billing"]').forEach((el) => {
      el.addEventListener('change', syncPrices);
    });
    document.querySelectorAll('[data-checkout]').forEach((btn) => {
      btn.addEventListener('click', () => checkout(btn.getAttribute('data-checkout')));
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('skip') === '1' || params.get('tier')) {
      try {
        lang = localStorage.getItem(LANG_KEY) || 'en';
      } catch (_) {}
      showMain();
      const tier = params.get('tier');
      if (tier === 'flow_supporter') {
        document.getElementById('tier-silver')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (tier === 'flow_crew') {
        document.getElementById('tier-gold')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    applyI18n();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
