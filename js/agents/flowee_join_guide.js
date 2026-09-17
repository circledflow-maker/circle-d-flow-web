/**
 * Flowee Join Guide — invite chat → register/login → form coaching → sanctuary
 */
(function () {
  const HINTS = {
    identity: 'Start with your real name — the Circle needs a clear signal to welcome you.',
    stage: 'Stage name is how the family will call you on the floor.',
    phone: 'WhatsApp is our fastest lane in Lisbon — include country code if you can.',
    email: 'Email links your registration to a shadow profile you can claim at login.',
    instagram: 'Drop your handle — @username is enough.',
    other: 'Other is welcome. Name your craft in one clear line.',
    instruments: 'Instruments, tools, or medium — voice, guitar, camera, fabric, paint…',
    songs: 'Musicians: titles, key, BPM, genre help Mr. Isaac shape the drop. Optional for others.',
    art: 'Describe your art or performance — theme, medium, format. Visual and fashion creators: this is your stage note.',
  };

  const SECTION_INTRO = {
    1: 'Section 1 — identity. Who walks into the Circle?',
    2: 'Section 2 — pick every discipline that lives in you. Audience and Other both count.',
    3: 'Section 3 — event night. Attending? Jam? Tell the truth of your calendar.',
    4: 'Section 4 — jam details. Solo, with musicians, freestyle, or art showcase — then describe what you bring.',
  };

  const SANCTUARY_AFTER =
    '/pages/artist_sanctuary.html?welcome=register';
  const MEMBER_THEN_SANCTUARY =
    '/member-card?src=join&next=' + encodeURIComponent('/pages/artist_sanctuary.html?welcome=card');
  const LOGIN_THEN_SANCTUARY =
    '/login?next=' + encodeURIComponent('/pages/artist_sanctuary.html?welcome=register');

  let lastHint = '';
  let lastSection = 0;
  let lastError = '';
  let inviteDone = false;

  function params() {
    try {
      return new URLSearchParams(window.location.search || '');
    } catch (_) {
      return new URLSearchParams();
    }
  }

  function isInviteLink() {
    const p = params();
    if (p.get('skipInvite') === '1') return false;
    // Shared / flyer / QR / IG links — and default join entry
    if (p.has('invite') || p.has('from') || p.has('src') || p.has('ref') || p.has('utm_source')) {
      return true;
    }
    // Bare /join and lapa71 register always open with Flowee welcome
    return true;
  }

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
        'max-width:280px;margin:0 0 8px auto;padding:10px 12px;background:rgba(0,255,204,0.1);' +
        'border:1px solid rgba(0,255,204,0.35);border-radius:14px 14px 4px 14px;color:#fff;font-size:13px;line-height:1.4;';
      host.prepend(bubble);
    }
    if (type === 'error') {
      bubble.style.borderColor = 'rgba(231,76,60,0.55)';
      bubble.style.background = 'rgba(231,76,60,0.12)';
    } else {
      bubble.style.borderColor = 'rgba(0,255,204,0.35)';
      bubble.style.background = 'rgba(0,255,204,0.1)';
    }
    bubble.textContent = String(text).replace(/<[^>]+>/g, '');
  }

  function softFocus(field) {
    if (!field) return;
    const el =
      document.getElementById(field) ||
      document.querySelector(`[name="${field}"]`) ||
      document.querySelector(`input[name="${field}"]`);
    if (el && typeof el.focus === 'function') {
      try {
        el.focus({ preventScroll: true });
      } catch (_) {
        el.focus();
      }
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
    if (journey) journey.classList.toggle('active', visible);
    document.body.classList.toggle('join-form-ready', !!visible);
  }

  function revealForm() {
    inviteDone = true;
    setFormVisible(true);
    const first = document.getElementById('fullName');
    if (first) {
      try {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_) { /* ignore */ }
    }
    speak(
      'Registration open. I stay with you — if a field is missing, I tell you. At the end: Member Card, then the 3D Artist Sanctuary.',
      'guide'
    );
  }

  function runInviteChat() {
    setFormVisible(false);
    const src = params().get('src') || params().get('from') || params().get('utm_source') || 'link';

    speak(
      'Akwaaba. I am Flowee — your guide in Circle D Flow.',
      'guide',
      [
        {
          label: 'CONTINUE',
          action: () => explainPlace(src),
        },
      ]
    );
  }

  function explainPlace(src) {
    speak(
      'You opened a Circle invite' +
        (src && src !== 'link' ? ' (' + src + ')' : '') +
        '. You are at the entrance: Join the family, claim your place, then enter the living 3D Artist Sanctuary — cinematic, mystic, guided by me.',
      'guide',
      [
        {
          label: 'WHAT AWAITS ME?',
          action: () => explainPromise(),
        },
      ]
    );
  }

  function explainPromise() {
    speak(
      'At the end of this path: your Member Card (Free / Support / Crew), benefits in your Vault, and the 3D Sanctuary courtyard. Membership never buys Artist status — that grows through the Flow Pool.',
      'guide',
      [
        {
          label: 'REGISTER WITH FLOWEE',
          action: () => revealForm(),
        },
        {
          label: 'I ALREADY HAVE A LOGIN',
          action: () => {
            speak('Taking you to login — after that I meet you in the Sanctuary.', 'guide');
            setTimeout(() => {
              window.location.href = LOGIN_THEN_SANCTUARY;
            }, 900);
          },
        },
        {
          label: 'CLAIM CARD FIRST',
          action: () => {
            window.location.href = MEMBER_THEN_SANCTUARY;
          },
        },
      ]
    );
  }

  window.FloweeJoinGuide = {
    boot() {
      setTimeout(() => {
        if (isInviteLink() && !inviteDone) {
          runInviteChat();
        } else {
          setFormVisible(true);
          speak(
            'Welcome. I am Flowee — I walk you through registration. At the end: Member Card and the 3D Artist Sanctuary.',
            'guide'
          );
        }
      }, 600);
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
        msg = 'No jam? Perfect — hit Submit when ready and stay on the member frequency.';
      }
      if (step === 4 && meta && meta.nonMusic) {
        msg =
          'Art creators: choose Art showcase if it fits, then describe your piece in “Describe your art / performance”.';
      }
      speak(msg, 'guide');
    },
    onFieldFocus(key) {
      const text = HINTS[key];
      if (!text || text === lastHint) return;
      lastHint = text;
      speak(text, 'guide');
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
      const pid =
        data && data.profileId
          ? ' Your shadow profile is linked.'
          : ' Claim your profile at login when ready.';
      const text =
        "You're in." +
        pid +
        ' Next: claim your Member Card — then I meet you in the 3D Artist Sanctuary for a short interface tour.';
      const actions = [
        {
          label: 'CLAIM MEMBER CARD',
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
      ];
      const a = agent();
      if (a && typeof a.talk === 'function') {
        a.talk(true, text, 'success', actions);
      } else {
        speak(text, 'success');
      }
    },
  };
})();
