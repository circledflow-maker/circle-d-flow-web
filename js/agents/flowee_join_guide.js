/**
 * Flowee Join Guide — center greet → dock → Botanica intro → interactive register
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
    identity: 'Your real name — so the Circle knows who walked in.',
    stage: 'Stage name is how Wako Kungo and the family call you on the floor.',
    phone: 'WhatsApp is our fastest lane in Lisbon — country code helps.',
    email: 'Email links this registration to a profile you can claim at login.',
    instagram: 'Your IG handle — @username is enough. We tag creatives from the night.',
    other: 'Name your craft in one clear line.',
    instruments: 'Voice, guitar, camera, paints, decks — whatever you bring.',
    songs: 'Optional for musicians: songs, key, BPM, genre.',
    art: 'Describe what you will share — set, look, series, jam vibe.',
  };

  const SECTION_INTRO = {
    1: 'Identity first. Who are you in the Flow?',
    2: 'What lives in you? Music, visual, craft, fashion, audience — pick all that fit.',
    3: 'Botânica on 24/09 — are you coming, and do you want to jam or share art?',
    4: 'How will you flow that night? Solo, jam, freestyle, or art showcase.',
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

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
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
    speak(
      'Registration is open. I stay with you field by field. When you finish, claim your Wako Kungo Membership Card — then the 3D Sanctuary.',
      'guide',
      [
        {
          label: 'START WITH MY NAME',
          action: () => softFocus('fullName'),
        },
      ]
    );
  }

  async function runOpening() {
    setFormVisible(false);
    setStage('center');
    await waitForFlowee(6000);

    speak(
      'Akwaaba. I am Flowee — your guide in Circle D Flow and Wako Kungo.',
      'guide',
      [{ label: 'HELLO FLOWEE', action: () => glideAndIntro() }]
    );

    // Auto-continue if user does not tap within ~4s
    setTimeout(() => {
      if (!stageDone) glideAndIntro();
    }, 4200);
  }

  function glideAndIntro() {
    if (stageDone) return;
    stageDone = true;
    setStage('dock');

    speak(
      'You landed on the Circle entrance. Here you register for the community, claim your Wako Kungo Membership Card, and enter the 3D Artist Sanctuary.',
      'guide',
      [{ label: 'WHAT IS NEXT?', action: () => explainEvent() }]
    );
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
        {
          label: 'REGISTER WITH ME',
          action: () => revealForm(),
        },
        {
          label: 'I ALREADY HAVE A LOGIN',
          action: () => {
            speak('Taking you to login — then Sanctuary.', 'guide');
            setTimeout(() => {
              window.location.href = LOGIN_THEN_SANCTUARY;
            }, 800);
          },
        },
        {
          label: 'CLAIM MEMBER CARD',
          action: () => {
            window.location.href = MEMBER_THEN_SANCTUARY;
          },
        },
        {
          label: 'SEE EVENT ON IG',
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
      let msg = SECTION_INTRO[step] || 'Keep flowing.';
      if (step === 3 && meta && meta.jam === false) {
        msg = 'No jam? Perfect — submit when ready. You are still in the family.';
      }
      speak(msg, 'guide');
      saveDraft();
    },
    onFieldFocus(key) {
      const text = HINTS[key];
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
          label: 'CLAIM WAKO CARD',
          action: () => {
            window.location.href = MEMBER_THEN_SANCTUARY;
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
