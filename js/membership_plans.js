/**
 * Membership plans — Flowee language → Confirm → cinematic still intro → plans
 * Cinematic: Member Card prototype + Lisbon / Wako portraits (Ken Burns), no reel.
 */
(function () {
  const LANG_KEY = 'cdf_lang';

  const CINE = [
    '/Assets/membership/wako_card_front.webp',
    '/Assets/membership/intro/cine_01_cafe.png',
    '/Assets/membership/intro/cine_02_handpan.png',
    '/Assets/membership/intro/cine_03_smile.png',
    '/Assets/membership/intro/cine_04_gallery.png',
    '/Assets/membership/intro/cine_05_lapa71.png',
  ];

  const PIP = [
    { src: '/Assets/membership/intro/pip_viv_01.png', label: 'Lisbon' },
    { src: '/Assets/membership/intro/pip_viv_02.png', label: 'Sound' },
    { src: '/Assets/membership/intro/pip_viv_03.png', label: 'Joy' },
    { src: '/Assets/membership/intro/pip_viv_04.png', label: 'Crew' },
    { src: '/Assets/membership/intro/pip_viv_05.png', label: 'Circle' },
  ];

  const I18N = {
    en: {
      gate_title: 'Welcome, navigator.',
      gate_lead:
        'We are glad you walk this journey with us. Pick a language, confirm — then a short cinematic shows Membership with Flowee.',
      gate_confirm: 'Confirm · Continue',
      gate_confirm_need: 'Select a language first.',
      flowee_hi:
        'Akwaaba. I am Flowee. A short cinematic opens Membership — your card, our values, how we walk together. Skip anytime for Log in or Registration.',
      flowee_lines: [
        { t: 0, text: 'Your free Bronze Member Card is enough to enter Sanctuary and Orbit.' },
        { t: 3, text: 'Lisbon tables and stages — the real people behind Circle D Flow and Wako.' },
        { t: 6, text: 'Music, joy, and bridges between artists, audiences, and the city.' },
        { t: 9, text: 'Silver and Gold are optional support — venues and partners stay alive.' },
        { t: 12, text: 'Kiss your heart · share the Flow · fair exchange.' },
        { t: 15, text: 'Ready? Log in if you already walk with us — or Register for your free card.' },
      ],
      cine: [
        'Your Wako Member Card — free Bronze is enough to enter.',
        'Lisbon tables · real stages · real people behind the Circle.',
        'Music and joy on the journey — we are glad you are here.',
        'Goals: bridges between artists, audiences, and the city.',
        'Optional Silver / Gold keeps Wako nights alive.',
        'Follow · Join · Support — Log in or Register when ready.',
      ],
      cta_follow: 'Follow',
      cta_join: 'Join',
      cta_support: 'Support',
      skip_hint: 'Skip intro',
      login: 'Log in',
      register: 'Registration',
      title: 'Membership plans',
      lead: 'Bronze is free and enough for Sanctuary. Silver and Gold keep Wako nights and partners alive — thank you for walking with us.',
      now_title: 'What you can do now',
      now_card: 'Claim / open Member Card',
      now_sanctuary: 'Enter Sanctuary',
      now_join: 'Join an event',
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
    },
    pt: {
      gate_title: 'Bem-vindo/a, navigator.',
      gate_lead:
        'Ficamos felizes por caminhares connosco. Escolhe o idioma, confirma — um curto cinematic mostra a Membership com a Flowee.',
      gate_confirm: 'Confirmar · Continuar',
      gate_confirm_need: 'Escolhe um idioma primeiro.',
      flowee_hi:
        'Akwaaba. Sou a Flowee. Um cinematic abre a Membership — o teu cartão, os nossos valores. Podes saltar para Login ou Registo.',
      flowee_lines: [
        { t: 0, text: 'O cartão Bronze grátis chega para o Santuário e o Orbit.' },
        { t: 3, text: 'Mesas e palcos de Lisboa — as pessoas reais no Circle e no Wako.' },
        { t: 6, text: 'Música, alegria e pontes entre artistas, públicos e a cidade.' },
        { t: 9, text: 'Silver e Gold são apoio opcional — venues e parceiros.' },
        { t: 12, text: 'Kiss your heart · partilhar o Flow · troca justa.' },
        { t: 15, text: 'Pronto? Login se já caminhas connosco — ou Registo para o cartão grátis.' },
      ],
      cine: [
        'O teu Wako Member Card — Bronze grátis chega para entrar.',
        'Mesas de Lisboa · palcos reais · pessoas reais no Circle.',
        'Música e alegria na jornada — estamos felizes por estares aqui.',
        'Objetivos: pontes entre artistas, públicos e a cidade.',
        'Silver / Gold opcional mantém as noites Wako vivas.',
        'Follow · Join · Support — Login ou Registo quando quiseres.',
      ],
      cta_follow: 'Follow',
      cta_join: 'Join',
      cta_support: 'Support',
      skip_hint: 'Saltar intro',
      login: 'Log in',
      register: 'Registo',
      title: 'Planos de membership',
      lead: 'Bronze é grátis e chega para o Santuário. Silver e Gold mantêm as noites Wako vivas — obrigado por estares connosco.',
      now_title: 'O que podes fazer agora',
      now_card: 'Pedir / abrir Member Card',
      now_sanctuary: 'Entrar no Santuário',
      now_join: 'Juntar a um evento',
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
    },
    de: {
      gate_title: 'Willkommen, Navigator.',
      gate_lead:
        'Schön, dass du uns auf der Reise begleitest. Sprache wählen, bestätigen — ein kurzes Cinematic zeigt Membership mit Flowee.',
      gate_confirm: 'Bestätigen · Weiter',
      gate_confirm_need: 'Bitte zuerst eine Sprache wählen.',
      flowee_hi:
        'Akwaaba. Ich bin Flowee. Ein kurzes Cinematic öffnet Membership — deine Karte, unsere Values. Skip jederzeit für Login oder Registration.',
      flowee_lines: [
        { t: 0, text: 'Deine Free Bronze Member Card reicht für Sanctuary und Orbit.' },
        { t: 3, text: 'Lisbon tables und Stages — die echten Menschen hinter Circle und Wako.' },
        { t: 6, text: 'Musik, Freude und Brücken zwischen Artists, Publikum und Stadt.' },
        { t: 9, text: 'Silver und Gold sind optionaler Support — Venues und Partner.' },
        { t: 12, text: 'Kiss your heart · Flow teilen · fairer Austausch.' },
        { t: 15, text: 'Bereit? Login wenn du schon dabei bist — oder Registration für die Free Card.' },
      ],
      cine: [
        'Deine Wako Member Card — Free Bronze reicht zum Einstieg.',
        'Lisbon tables · echte Stages · echte Menschen hinter dem Circle.',
        'Musik und Freude auf der Reise — wir freuen uns, dass du da bist.',
        'Ziele: Brücken zwischen Artists, Publikum und Stadt.',
        'Optional Silver / Gold hält Wako-Nächte am Leben.',
        'Follow · Join · Support — Login oder Registration.',
      ],
      cta_follow: 'Follow',
      cta_join: 'Join',
      cta_support: 'Support',
      skip_hint: 'Intro überspringen',
      login: 'Log in',
      register: 'Registration',
      title: 'Membership-Pläne',
      lead: 'Bronze ist kostenlos und reicht für die Sanctuary. Silver und Gold halten Wako-Nächte am Leben — danke, dass du dabei bist.',
      now_title: 'Was du jetzt tun kannst',
      now_card: 'Member Card holen / öffnen',
      now_sanctuary: 'Sanctuary betreten',
      now_join: 'Bei Event anmelden',
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
      a4: 'Stripe liefert Belege. Wir führen buchungsfähige Datensätze und exportieren DATEV-kompatibel auf Anfrage.',
      q5: 'Wo liegen meine Daten?',
      a5: 'Profil in Supabase. Zahlungen bei Stripe. Cookies für Sprache/Karte; Notifications nur mit Einwilligung.',
      policy_title: 'Rechtliches · Datenschutz · DATEV',
      policy_lead:
        'Transparente Membership-Bedingungen im Einklang mit DSGVO und deutscher Buchführungspraxis (DATEV-ready).',
      p1: 'Vertrag — Digitale Membership via Stripe. Kontakt Instagram @wako.kungo.',
      p2: 'Widerruf/Kündigung — jederzeit zum nächsten Zeitraum.',
      p3: 'Preise & USt — angezeigter Betrag; USt auf Stripe-Belegen wenn anwendbar.',
      p4: 'DATEV — Aufbewahrung: Zahlungs-ID, Datum, Kunde, Netto/Brutto, Produkt, Periode. Export für Steuerberater auf Anfrage. i. d. R. 10 Jahre (§147 AO).',
      p5: 'DSGVO — Vertrag, berechtigtes Interesse, Einwilligung. Rechte: Auskunft, Löschung, Portabilität, Beschwerde.',
      p6: 'Fair Use — Benefit-QR persönlich, ein Scan, monatlicher Refill.',
      p7: 'Auftragsverarbeiter — Stripe, Supabase, Vercel. Kein Verkauf personenbezogener Daten.',
    },
  };

  let lang = 'en';
  let introTimer = null;
  let introStart = 0;
  let lastFloweeIdx = -1;
  const INTRO_MS = 18000;
  const SCENE_MS = 2800;

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function say(text) {
    try {
      const a = window.flowee || window.Flowee;
      if (a && typeof a.talk === 'function') a.talk(true, text, 'guide');
    } catch (_) { /* never block intro */ }
  }

  function setPhase(phase) {
    document.body.classList.remove('mp-phase-gate', 'mp-phase-intro', 'mp-phase-main');
    document.body.classList.add('mp-phase-' + phase);
    const gate = document.getElementById('mp-gate');
    const intro = document.getElementById('mp-intro');
    const main = document.getElementById('mp-main');
    if (gate) gate.hidden = phase !== 'gate';
    if (intro) intro.hidden = phase !== 'intro';
    if (main) main.hidden = phase !== 'main';
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) el.innerHTML = val;
    });
    const gateTitle = document.getElementById('mp-gate-title');
    const gateLead = document.getElementById('mp-gate-lead');
    const confirmBtn = document.getElementById('mp-lang-confirm');
    if (gateTitle) gateTitle.textContent = t('gate_title');
    if (gateLead) gateLead.textContent = t('gate_lead');
    if (confirmBtn) confirmBtn.textContent = t('gate_confirm');
    const skip = document.getElementById('mp-intro-skip');
    const login = document.getElementById('mp-intro-login');
    const register = document.getElementById('mp-intro-register');
    if (skip) skip.textContent = t('skip_hint');
    if (login) login.textContent = t('login');
    if (register) register.textContent = t('register');
  }

  let pendingLang = null;

  function selectLang(code) {
    pendingLang = code === 'pt' || code === 'de' ? code : 'en';
    document.querySelectorAll('.mp-lang-btn').forEach((btn) => {
      const on = btn.getAttribute('data-lang') === pendingLang;
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const confirmBtn = document.getElementById('mp-lang-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = t('gate_confirm');
    }
    // Preview copy in selected language before confirm
    lang = pendingLang;
    applyI18n();
    say(t('gate_confirm'));
  }

  function confirmLang() {
    if (!pendingLang) {
      say(t('gate_confirm_need'));
      return;
    }
    lang = pendingLang;
    try {
      localStorage.setItem(LANG_KEY, lang);
      if (window.CDFi18n && typeof window.CDFi18n.setLang === 'function') {
        window.CDFi18n.setLang(lang);
      }
    } catch (_) {}
    document.documentElement.lang = lang;
    applyI18n();
    // Gate disappears → cinematic starts
    startIntro();
  }

  function pickLang(code) {
    // Back-compat for MembershipPlansIntro.pickLang
    selectLang(code);
    confirmLang();
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
    setPhase('main');
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

  function syncFloweeAt(sec) {
    const lines = I18N[lang]?.flowee_lines || I18N.en.flowee_lines;
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (sec >= lines[i].t) idx = i;
    }
    if (idx === lastFloweeIdx) return;
    lastFloweeIdx = idx;
    const text = lines[idx].text;
    const guide = document.getElementById('mp-flowee-line');
    if (guide) guide.textContent = 'Flowee · ' + text;
    const caption = document.getElementById('mp-cine-line');
    const cineLines = I18N[lang]?.cine || I18N.en.cine;
    if (caption) {
      caption.hidden = false;
      caption.textContent = cineLines[Math.min(cineLines.length - 1, idx)] || text;
    }
    say(text);
  }

  function syncEndCta(sec) {
    const nearEnd = sec >= INTRO_MS / 1000 - 4;
    const cta = document.getElementById('mp-cine-cta');
    const caption = document.getElementById('mp-cine-line');
    if (!cta) return;
    if (nearEnd) {
      const spans = cta.querySelectorAll('span');
      if (spans[0]) spans[0].textContent = t('cta_follow');
      if (spans[1]) spans[1].textContent = t('cta_join');
      if (spans[2]) spans[2].textContent = t('cta_support');
      cta.hidden = false;
      cta.setAttribute('aria-hidden', 'false');
      if (caption) caption.hidden = true;
    } else {
      cta.hidden = true;
      cta.setAttribute('aria-hidden', 'true');
      if (caption) caption.hidden = false;
    }
  }

  function setScene(idx) {
    const main = document.getElementById('mp-cine-main');
    if (!main) return;
    const next = CINE[Math.min(CINE.length - 1, idx)];
    if (main.dataset.idx === String(idx)) return;
    main.classList.add('is-swap');
    setTimeout(() => {
      main.dataset.idx = String(idx);
      main.src = next;
      main.classList.remove('is-swap');
    }, 220);
  }

  function tickIntro() {
    const elapsed = Date.now() - introStart;
    const sec = elapsed / 1000;
    const p = Math.min(1, elapsed / INTRO_MS);
    const bar = document.getElementById('mp-cine-bar');
    if (bar) bar.style.width = p * 100 + '%';

    setScene(Math.min(CINE.length - 1, Math.floor(elapsed / SCENE_MS)));
    syncFloweeAt(sec);
    syncEndCta(sec);

    // Soft PiP accents early in the intro (Stories portraits)
    if (sec >= 1.2 && sec < 4.2) setPip(true, Math.floor((sec - 1.2) / 0.6));
    else setPip(false, 0);

    if (elapsed >= INTRO_MS) {
      finishIntro();
      return;
    }
    introTimer = requestAnimationFrame(tickIntro);
  }

  function startIntro() {
    setPhase('intro');
    applyI18n();
    lastFloweeIdx = -1;
    setPip(false, 0);
    const main = document.getElementById('mp-cine-main');
    if (main) {
      main.classList.remove('is-swap');
      main.dataset.idx = '0';
      main.src = CINE[0];
      main.hidden = false;
    }
    const cta = document.getElementById('mp-cine-cta');
    if (cta) {
      cta.hidden = true;
      cta.setAttribute('aria-hidden', 'true');
    }
    const line = document.getElementById('mp-cine-line');
    if (line) {
      line.hidden = false;
      line.textContent = (I18N[lang]?.cine || I18N.en.cine)[0];
    }
    const guide = document.getElementById('mp-flowee-line');
    if (guide) guide.textContent = 'Flowee · ' + t('flowee_hi');
    say(t('flowee_hi'));
    introStart = Date.now();
    if (introTimer) cancelAnimationFrame(introTimer);
    introTimer = requestAnimationFrame(tickIntro);
  }

  function finishIntro() {
    if (introTimer) cancelAnimationFrame(introTimer);
    introTimer = null;
    showMain();
  }

  function boot() {
    setPhase('gate');

    document.querySelectorAll('.mp-lang-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectLang(btn.getAttribute('data-lang'));
      });
    });
    document.getElementById('mp-lang-confirm')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      confirmLang();
    });
    document.getElementById('mp-intro-skip')?.addEventListener('click', (e) => {
      e.preventDefault();
      finishIntro();
    });
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
    // Only skip cinematic when explicitly requested or returning from Stripe tier deep-link
    if (params.get('skip') === '1') {
      try {
        lang = localStorage.getItem(LANG_KEY) || 'en';
      } catch (_) {}
      showMain();
      return;
    }
    if (params.get('tier') && params.get('cine') !== '1') {
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

  window.MembershipPlansIntro = { startIntro, pickLang, finishIntro, selectLang, confirmLang };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
