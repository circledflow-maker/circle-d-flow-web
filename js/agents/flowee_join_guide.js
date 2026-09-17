/**
 * Flowee Join Guide — language → center welcome → dock → Botanica intro → register
 */
(function () {
  const EVENT = {
    id: 'botanica-groove-20260924',
    title: 'The Botanical Groove Session',
    venue: 'Botânica Lisboa',
    when: '24 September · 20:00–23:00',
    entry: 'Free entrance · Responsible donations',
    ig: 'https://www.instagram.com/p/DdUqd6ejdZ6/',
  };

  const HINTS = {
    en: {
      identity: 'Your real name — so the Circle knows who walked in.',
      stage: 'Stage name is how Wako Kungo and the family call you on the floor.',
      phone: 'WhatsApp is our fastest lane in Lisbon — country code helps.',
      email: 'Email links this registration to a profile you can claim at login.',
      instagram: 'Your IG handle — @username is enough. We tag creatives from the night.',
      other: 'Name your craft in one clear line.',
      instruments: 'Voice, guitar, camera, paints, decks — whatever you bring.',
      songs: 'Optional for musicians: songs, key, BPM, genre.',
      art: 'Describe what you will share — set, look, series, jam vibe.',
    },
    pt: {
      identity: 'O teu nome real — para o Circle saber quem entrou.',
      stage: 'O nome de palco é como a família Wako Kungo te chama.',
      phone: 'WhatsApp é a via mais rápida em Lisboa — inclui indicativo.',
      email: 'O email liga este registo a um perfil que podes reclamar no login.',
      instagram: 'O teu @ no IG — chega. Marcamos creatives da noite.',
      other: 'Nomeia a tua arte numa linha clara.',
      instruments: 'Voz, guitarra, câmara, tintas, decks — o que trouxeres.',
      songs: 'Opcional para músicos: temas, tom, BPM, género.',
      art: 'Descreve o que queres partilhar — set, look, série, jam.',
    },
    de: {
      identity: 'Dein echter Name — damit der Circle weiß, wer gekommen ist.',
      stage: 'Dein Stage Name ist, wie dich die Wako-Kungo-Familie nennt.',
      phone: 'WhatsApp ist unser schnellster Weg in Lissabon — mit Ländervorwahl.',
      email: 'E-Mail verbindet die Registrierung mit einem Profil beim Login.',
      instagram: 'Dein IG-Handle — @username reicht.',
      other: 'Nenne dein Craft in einer klaren Zeile.',
      instruments: 'Stimme, Gitarre, Kamera, Farbe, Decks — was du mitbringst.',
      songs: 'Optional für Musiker: Songs, Tonart, BPM, Genre.',
      art: 'Beschreibe, was du teilst — Set, Look, Serie, Jam.',
    },
  };

  const SECTION_INTRO = {
    en: {
      1: 'Identity first. Who are you in the Flow?',
      2: 'What lives in you? Music, visual, craft, fashion, audience — pick all that fit.',
      3: 'Botânica on 24/09 — are you coming, and do you want to jam or share art?',
      4: 'How will you flow that night? Solo, jam, freestyle, or art showcase.',
    },
    pt: {
      1: 'Primeiro a identidade. Quem és no Flow?',
      2: 'O que vive em ti? Música, visual, craft, moda, público — escolhe o que cabe.',
      3: 'Botânica a 24/09 — vens, e queres jam ou partilhar arte?',
      4: 'Como vais fluir essa noite? Solo, jam, freestyle ou showcase.',
    },
    de: {
      1: 'Zuerst Identität. Wer bist du im Flow?',
      2: 'Was lebt in dir? Musik, Visual, Craft, Fashion, Audience — wähle passend.',
      3: 'Botânica am 24.09 — kommst du, und willst du jammer oder Kunst teilen?',
      4: 'Wie fließt du an dem Abend? Solo, Jam, Freestyle oder Showcase.',
    },
  };

  const SANCTUARY_AFTER = '/pages/artist_sanctuary.html?welcome=register';
  const MEMBER_THEN_SANCTUARY =
    '/member-card?src=botanica&next=' +
    encodeURIComponent('/pages/artist_sanctuary.html?welcome=card');
  const LOGIN_THEN_SANCTUARY =
    '/login?next=' + encodeURIComponent('/pages/artist_sanctuary.html?welcome=register');
  const DRAFT_KEY = 'cdf_join_draft_botanica';

  let lastHint = '';
  let lastSection = 0;
  let lastError = '';
  let inviteDone = false;
  let stageDone = false;
  let langPicked = false;

  function t(key) {
    return window.CDFi18n ? window.CDFi18n.t(key) : key;
  }

  function lang() {
    return window.CDFi18n ? window.CDFi18n.getLang() : 'en';
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

  function speak(text, type, options) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, text, type || 'guide', options || []);
      return;
    }
    const host = document.getElementById('flowee-agent');
    if (!host) return;
    let bubble = host.querySelector('.join-flowee-fallback');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'join-flowee-fallback';
      bubble.style.cssText =
        'max-width:300px;margin:0 0 8px auto;padding:10px 12px;background:rgba(0,255,204,0.1);' +
        'border:1px solid rgba(0,255,204,0.35);border-radius:14px 14px 4px 14px;color:#fff;font-size:13px;line-height:1.4;';
      host.prepend(bubble);
    }
    bubble.textContent = String(text).replace(/<[^>]+>/g, '');
  }

  function waitForFlowee(ms) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const tick = () => {
        if (agent()?.talk || agent()?.bubble || document.getElementById('flowee-visual')) {
          return resolve(agent());
        }
        if (Date.now() - t0 > ms) return resolve(null);
        setTimeout(tick, 120);
      };
      tick();
    });
  }

  function setStage(mode) {
    document.body.classList.remove('join-flowee-center', 'join-flowee-docked', 'join-intro-dim');
    if (mode === 'center') {
      document.body.classList.add('join-flowee-center', 'join-intro-dim');
    } else if (mode === 'dock') {
      document.body.classList.add('join-flowee-docked');
    }
    refreshVessel();
  }

  function setFormVisible(visible) {
    const form = document.getElementById('join-form');
    const progress = document.getElementById('progress-track');
    const gate = document.getElementById('flowee-invite-gate');
    const journey = document.getElementById('join-journey');
    if (form) form.hidden = !visible;
    if (progress) progress.hidden = !visible;
    if (gate) gate.hidden = visible;
    if (journey) {
      journey.querySelectorAll('li').forEach((li, i) => {
        li.classList.toggle('on', visible ? i === 1 : i === 0);
      });
    }
    document.body.classList.toggle('join-form-ready', !!visible);
  }

  function softFocus(field) {
    if (!field) return;
    const el =
      document.getElementById(field) ||
      document.querySelector(`[name="${field}"]`);
    if (el && typeof el.focus === 'function') {
      try {
        el.focus({ preventScroll: true });
      } catch (_) {
        el.focus();
      }
    }
  }

  function saveDraft() {
    try {
      const form = document.getElementById('join-form');
      if (!form) return;
      const data = {
        fullName: form.fullName?.value || '',
        stageName: form.stageName?.value || '',
        phone: form.phone?.value || '',
        email: form.email?.value || '',
        instagram: form.instagram?.value || '',
        savedAt: new Date().toISOString(),
        eventId: EVENT.id,
        lang: lang(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (_) { /* ignore */ }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const form = document.getElementById('join-form');
      if (!form || !data) return;
      if (data.fullName && form.fullName) form.fullName.value = data.fullName;
      if (data.stageName && form.stageName) form.stageName.value = data.stageName;
      if (data.phone && form.phone) form.phone.value = data.phone;
      if (data.email && form.email) form.email.value = data.email;
      if (data.instagram && form.instagram) form.instagram.value = data.instagram;
    } catch (_) { /* ignore */ }
  }

  function revealForm() {
    inviteDone = true;
    setStage('dock');
    setFormVisible(true);
    restoreDraft();
    const first = document.getElementById('fullName');
    try {
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (_) { /* ignore */ }
    speak(t('reg_open'), 'guide', [
      { label: t('start_name'), action: () => softFocus('fullName') },
    ]);
  }

  function askLanguage() {
    setFormVisible(false);
    setStage('center');
    speak(t('pick_lang'), 'guide', [
      {
        label: 'PORTUGUÊS',
        action: () => {
          window.CDFi18n?.setLang('pt');
          langPicked = true;
          welcomeCenter();
        },
      },
      {
        label: 'ENGLISH',
        action: () => {
          window.CDFi18n?.setLang('en');
          langPicked = true;
          welcomeCenter();
        },
      },
      {
        label: 'DEUTSCH',
        action: () => {
          window.CDFi18n?.setLang('de');
          langPicked = true;
          welcomeCenter();
        },
      },
    ]);
  }

  function welcomeCenter() {
    setStage('center');
    speak(t('hello'), 'guide', [
      { label: t('hello_btn'), action: () => glideAndIntro() },
    ]);
    // Wait for user confirmation — no auto-advance
  }

  async function runOpening() {
    setFormVisible(false);
    setStage('center');
    await waitForFlowee(6000);
    refreshVessel();

    const switcher = document.getElementById('cdf-lang-switch');
    if (window.CDFi18n && switcher) {
      window.CDFi18n.mountSwitcher(switcher, (code) => {
        langPicked = true;
        if (!stageDone) welcomeCenter();
      });
    }

    // Always ask language first; only skip if user already confirmed this session
    try {
      if (sessionStorage.getItem('cdf_join_lang_ok') === '1' && window.CDFi18n?.getLang()) {
        langPicked = true;
        welcomeCenter();
        return;
      }
    } catch (_) { /* ignore */ }

    askLanguage();
  }

  function glideAndIntro() {
    if (stageDone) return;
    stageDone = true;
    try {
      sessionStorage.setItem('cdf_join_lang_ok', '1');
    } catch (_) { /* ignore */ }
    setStage('dock');

    speak(t('dock_intro'), 'guide', [
      { label: t('what_next'), action: () => explainEvent() },
    ]);
  }

  function explainEvent() {
    speak(
      EVENT.title +
        ' — ' +
        EVENT.when +
        ' at ' +
        EVENT.venue +
        '. ' +
        EVENT.entry +
        '. Lapa 71 was August; this night is Botânica.',
      'guide',
      [
        { label: t('register_me'), action: () => revealForm() },
        {
          label: t('have_login'),
          action: () => {
            speak('Login → Sanctuary.', 'guide');
            setTimeout(() => {
              window.location.href = LOGIN_THEN_SANCTUARY;
            }, 800);
          },
        },
        {
          label: t('claim_card'),
          action: () => {
            window.location.href =
              MEMBER_THEN_SANCTUARY + '&lang=' + encodeURIComponent(lang());
          },
        },
        {
          label: t('see_ig'),
          action: () => {
            window.open(EVENT.ig, '_blank', 'noopener');
          },
        },
      ]
    );

    const gate = document.getElementById('flowee-invite-gate');
    if (gate) gate.hidden = false;
  }

  window.FloweeJoinGuide = {
    EVENT,
    boot() {
      setTimeout(() => runOpening(), 400);
    },
    startRegistration() {
      revealForm();
    },
    onSection(step, meta) {
      if (step === lastSection) return;
      lastSection = step;
      lastError = '';
      const pack = SECTION_INTRO[lang()] || SECTION_INTRO.en;
      let msg = pack[step] || 'Keep flowing.';
      if (step === 3 && meta && meta.jam === false) {
        msg =
          lang() === 'pt'
            ? 'Sem jam? Perfeito — submete quando quiseres. Continuas na família.'
            : lang() === 'de'
              ? 'Kein Jam? Perfekt — sende wenn bereit. Du bleibst in der Familie.'
              : 'No jam? Perfect — submit when ready. You are still in the family.';
      }
      speak(msg, 'guide');
      saveDraft();
    },
    onFieldFocus(key) {
      const pack = HINTS[lang()] || HINTS.en;
      const text = pack[key];
      if (!text || text === lastHint) return;
      lastHint = text;
      speak(text, 'guide');
      saveDraft();
    },
    onError(msg, meta) {
      const text = String(msg || '').trim();
      if (!text || text === lastError) return;
      lastError = text;
      softFocus(meta && meta.field);
      speak('Hold on — ' + text, 'error');
    },
    onSuccess(data) {
      lastError = '';
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (_) { /* ignore */ }
      const pid =
        data && data.profileId
          ? ' Your shadow profile is linked.'
          : ' Claim your profile at login when ready.';
      const text =
        "You're in for Botânica." +
        pid +
        ' Next — claim your Wako Kungo Membership Card, then meet me in the 3D Artist Sanctuary.';
      const actions = [
        {
          label: t('claim_card'),
          action: () => {
            window.location.href =
              MEMBER_THEN_SANCTUARY + '&lang=' + encodeURIComponent(lang());
          },
        },
        {
          label: 'ENTER SANCTUARY',
          action: () => {
            window.location.href = SANCTUARY_AFTER;
          },
        },
        {
          label: '€5 / €10 SUPPORT',
          action: () => {
            window.location.href = '/membership';
          },
        },
      ];
      const a = agent();
      if (a && typeof a.talk === 'function') a.talk(true, text, 'success', actions);
      else speak(text, 'success');
    },
  };
})();
