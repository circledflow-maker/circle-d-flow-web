/**
 * Flowee Join Guide — step coaching + missing-field / API error voice
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
    1: 'Section 1 — identity. Who walks into Lapa 71?',
    2: 'Section 2 — pick every discipline that lives in you. Audience and Other both count.',
    3: 'Section 3 — Aug 29 night. Attending? Jam? Tell the truth of your calendar.',
    4: 'Section 4 — jam details. Solo, with musicians, freestyle, or art showcase — then describe what you bring.',
  };

  let lastHint = '';
  let lastSection = 0;
  let lastError = '';

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function speak(text, type) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, text, type || 'guide');
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

  window.FloweeJoinGuide = {
    boot() {
      setTimeout(() => {
        speak(
          'Welcome to the family. I am <strong>Flowee</strong> — I will walk you through Member & Jam registration for Lapa 71. If something is missing, I will tell you.',
          'guide'
        );
      }, 700);
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
      speak(`Hold on — ${text}`, 'error');
    },
    onSuccess(data) {
      lastError = '';
      const pid =
        data && data.profileId
          ? ' Your shadow profile is linked.'
          : ' Claim your profile at login when ready.';
      speak('Registration sealed.' + pid + ' Sanctuary and Bantaba await.', 'success');
    },
  };
})();
