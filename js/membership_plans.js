/**
 * Membership plans — Flowee language → Confirm → sky intro (Flowee center) → plans
 * Flowee stays in the sky until Login or Registration.
 */
(function () {
  const LANG_KEY = 'cdf_lang';

  const I18N = {
    en: {
      gate_title: 'Welcome, navigator.',
      gate_lead:
        'We are glad you walk this journey with us. Pick a language, confirm — then Flowee greets you in the sky.',
      gate_confirm: 'Confirm · Continue',
      gate_confirm_need: 'Select a language first.',
      flowee_hi:
        'Akwaaba. I am Flowee. I stay with you here until you Log in or Register — or open About us / Partner system.',
      flowee_lines: [
        { t: 0, text: 'I am Flowee — your guide in Circle D Flow and Wako Kungo.' },
        { t: 5, text: 'Free Bronze Member Card opens Sanctuary, Orbit alerts, and +EXP.' },
        { t: 10, text: 'Silver and Gold are optional support for venues, artists, and partners.' },
        { t: 15, text: 'Kiss your heart · share the Flow · fair exchange.' },
        { t: 20, text: 'When you are ready: Log in, or Registration for your free card.' },
      ],
      login: 'Log in',
      register: 'Registration',
      about_btn: 'About us',
      partners_btn: 'Partner system',
      partners_title: 'Partner system',
      partners_lead:
        'Member perks redeem with partners in the Circle. Free Bronze unlocks the path; Silver/Gold add coupons and guest access.',
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
      a4: 'Stripe handles payment receipts. For German bookkeeping we keep invoice-ready records exportable for DATEV-compatible accounting on request.',
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
        'Ficamos felizes por caminhares connosco. Escolhe o idioma, confirma — a Flowee recebe-te no céu.',
      gate_confirm: 'Confirmar · Continuar',
      gate_confirm_need: 'Escolhe um idioma primeiro.',
      flowee_hi:
        'Akwaaba. Sou a Flowee. Fico contigo aqui até fazeres Login ou Registo — ou abrires Sobre nós / Parceiros.',
      flowee_lines: [
        { t: 0, text: 'Sou a Flowee — a tua guia no Circle D Flow e Wako Kungo.' },
        { t: 5, text: 'O cartão Bronze grátis abre Santuário, Orbit e +EXP.' },
        { t: 10, text: 'Silver e Gold são apoio opcional para venues, artistas e parceiros.' },
        { t: 15, text: 'Kiss your heart · partilhar o Flow · troca justa.' },
        { t: 20, text: 'Quando estiveres pronto: Login, ou Registo para o cartão grátis.' },
      ],
      login: 'Log in',
      register: 'Registo',
      about_btn: 'Sobre nós',
      partners_btn: 'Sistema de parceiros',
      partners_title: 'Sistema de parceiros',
      partners_lead:
        'Benefícios de membros resgatam-se com parceiros do Circle. Bronze grátis abre o caminho; Silver/Gold acrescentam cupões e convidados.',
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
        'Schön, dass du uns auf der Reise begleitest. Sprache wählen, bestätigen — Flowee begrüßt dich am Himmel.',
      gate_confirm: 'Bestätigen · Weiter',
      gate_confirm_need: 'Bitte zuerst eine Sprache wählen.',
      flowee_hi:
        'Akwaaba. Ich bin Flowee. Ich bleibe hier, bis du Log in oder Registration wählst — oder About us / Partner system öffnest.',
      flowee_lines: [
        { t: 0, text: 'Ich bin Flowee — dein Guide in Circle D Flow und Wako Kungo.' },
        { t: 5, text: 'Free Bronze Member Card öffnet Sanctuary, Orbit und +EXP.' },
        { t: 10, text: 'Silver und Gold sind optionaler Support für Venues, Artists und Partner.' },
        { t: 15, text: 'Kiss your heart · Flow teilen · fairer Austausch.' },
        { t: 20, text: 'Wenn du bereit bist: Log in — oder Registration für die Free Card.' },
      ],
      login: 'Log in',
      register: 'Registration',
      about_btn: 'About us',
      partners_btn: 'Partner system',
      partners_title: 'Partner system',
      partners_lead:
        'Member-Perks löst du bei Partnern im Circle ein. Free Bronze öffnet den Weg; Silver/Gold bringen Coupons und Gäste.',
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
  let pendingLang = null;
  let introTimer = null;
  let introStart = 0;
  let lastFloweeIdx = -1;
  let skyRaf = null;
  let skyStars = [];
  let panelOpen = false;

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function say(text) {
    try {
      const a = window.flowee || window.Flowee;
      if (a && typeof a.talk === 'function') a.talk(true, text, 'guide');
    } catch (_) {}
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
    if (phase !== 'intro') stopSky();
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
    const login = document.getElementById('mp-intro-login');
    const register = document.getElementById('mp-intro-register');
    const about = document.getElementById('mp-intro-about');
    const partners = document.getElementById('mp-intro-partners');
    if (login) login.textContent = t('login');
    if (register) register.textContent = t('register');
    if (about) about.textContent = t('about_btn');
    if (partners) partners.textContent = t('partners_btn');
  }

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
    startIntro();
  }

  function pickLang(code) {
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

  function showMain(anchor) {
    setPhase('main');
    applyI18n();
    syncPrices();
    say(t('lead'));
    if (anchor) {
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }

  function syncFloweeAt(sec) {
    if (panelOpen) return;
    const lines = I18N[lang]?.flowee_lines || I18N.en.flowee_lines;
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (sec >= lines[i].t) idx = i;
    }
    // loop narration softly while waiting
    const loop = lines[lines.length - 1].t + 5;
    if (sec > loop) {
      const cycle = sec % loop;
      idx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (cycle >= lines[i].t) idx = i;
      }
    }
    if (idx === lastFloweeIdx) return;
    lastFloweeIdx = idx;
    const text = lines[idx].text;
    const guide = document.getElementById('mp-flowee-line');
    if (guide) guide.textContent = text;
    say(text);
  }

  function tickIntro() {
    const sec = (Date.now() - introStart) / 1000;
    syncFloweeAt(sec);
    introTimer = requestAnimationFrame(tickIntro);
  }

  function stopSky() {
    if (skyRaf) cancelAnimationFrame(skyRaf);
    skyRaf = null;
  }

  function startSky() {
    const canvas = document.getElementById('mp-sky-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((canvas.clientWidth * canvas.clientHeight) / 9000);
      skyStars = Array.from({ length: Math.max(40, Math.min(120, count)) }, () => ({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight * 0.85,
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.7 + 0.2,
        s: Math.random() * 0.4 + 0.1,
        tw: Math.random() * Math.PI * 2,
      }));
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let t0 = performance.now();
    function frame(now) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // deep sky wash
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#061226');
      g.addColorStop(0.45, '#0a1a36');
      g.addColorStop(1, '#040812');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // soft aurora bands
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 3; i++) {
        const ag = ctx.createRadialGradient(
          w * (0.3 + i * 0.2),
          h * (0.25 + Math.sin(t * 0.25 + i) * 0.05),
          10,
          w * (0.3 + i * 0.2),
          h * 0.3,
          w * 0.45
        );
        ag.addColorStop(0, i % 2 ? 'rgba(61,224,255,0.55)' : 'rgba(212,175,55,0.35)');
        ag.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.ellipse(w * (0.35 + i * 0.18), h * 0.28, w * 0.35, h * 0.12, Math.sin(t * 0.2 + i) * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      skyStars.forEach((st) => {
        const tw = reduce ? st.a : st.a * (0.55 + 0.45 * Math.sin(t * (1.2 + st.s) + st.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(230,245,255,${tw})`;
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
        if (!reduce) {
          st.y += st.s * 0.15;
          if (st.y > h) {
            st.y = -2;
            st.x = Math.random() * w;
          }
        }
      });

      // drifting particles near center (Flowee wake)
      if (!reduce) {
        ctx.globalAlpha = 0.35;
        for (let i = 0; i < 12; i++) {
          const ang = t * 0.4 + (i / 12) * Math.PI * 2;
          const rad = 70 + Math.sin(t + i) * 18;
          const x = w / 2 + Math.cos(ang) * rad;
          const y = h * 0.42 + Math.sin(ang * 1.2) * (rad * 0.35);
          ctx.beginPath();
          ctx.fillStyle = i % 2 ? 'rgba(61,224,255,0.9)' : 'rgba(212,175,55,0.85)';
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      skyRaf = requestAnimationFrame(frame);
    }
    stopSky();
    skyRaf = requestAnimationFrame(frame);
  }

  function closePanels() {
    panelOpen = false;
    const about = document.getElementById('mp-panel-about');
    const partners = document.getElementById('mp-panel-partners');
    if (about) {
      about.hidden = true;
      about.setAttribute('hidden', '');
    }
    if (partners) {
      partners.hidden = true;
      partners.setAttribute('hidden', '');
    }
  }

  function openPanel(which) {
    closePanels();
    const el = document.getElementById(which === 'partners' ? 'mp-panel-partners' : 'mp-panel-about');
    if (!el) return;
    panelOpen = true;
    el.hidden = false;
    el.removeAttribute('hidden');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const guide = document.getElementById('mp-flowee-line');
    const line = which === 'partners' ? t('partners_lead') : t('about_p1');
    if (guide) guide.textContent = line;
    say(line);
  }

  function startIntro() {
    setPhase('intro');
    applyI18n();
    closePanels();
    lastFloweeIdx = -1;
    const guide = document.getElementById('mp-flowee-line');
    if (guide) guide.textContent = t('flowee_hi');
    say(t('flowee_hi'));
    introStart = Date.now();
    if (introTimer) cancelAnimationFrame(introTimer);
    startSky();
    introTimer = requestAnimationFrame(tickIntro);
  }

  function finishIntro(anchor) {
    if (introTimer) cancelAnimationFrame(introTimer);
    introTimer = null;
    stopSky();
    showMain(anchor);
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
    document.getElementById('mp-intro-login')?.addEventListener('click', () => {
      window.location.href = '/member-card?auth=login';
    });
    document.getElementById('mp-intro-register')?.addEventListener('click', () => {
      window.location.href = '/member-card?auth=register';
    });
    document.getElementById('mp-intro-about')?.addEventListener('click', (e) => {
      e.preventDefault();
      openPanel('about');
    });
    document.getElementById('mp-intro-partners')?.addEventListener('click', (e) => {
      e.preventDefault();
      openPanel('partners');
    });
    document.querySelectorAll('[data-close-panel]').forEach((btn) => {
      btn.addEventListener('click', () => closePanels());
    });

    document.querySelectorAll('input[name="mp-billing"]').forEach((el) => {
      el.addEventListener('change', syncPrices);
    });
    document.querySelectorAll('[data-checkout]').forEach((btn) => {
      btn.addEventListener('click', () => checkout(btn.getAttribute('data-checkout')));
    });

    const params = new URLSearchParams(window.location.search);
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
