/**
 * Flowee Join Guide — light step coaching for lapa71_register / join
 */
(function () {
  const HINTS = {
    identity: 'Start with your real name — the Circle needs a clear signal to welcome you.',
    stage: 'Stage name is optional, but it is how the family will call you on the floor.',
    phone: 'WhatsApp is our fastest lane in Lisbon — include country code if you can.',
    email: 'Email links your registration to a shadow profile you can claim at login.',
    instagram: 'Drop your handle without the drama — @optional.',
    instruments: 'List what you play so Mr. Isaac can shape the jam.',
    songs: 'Titles, key, BPM, genre — the more precise, the smoother the drop.',
  };

  const SECTION_INTRO = {
    1: 'Section 1 — identity. Who walks into Lapa 71?',
    2: 'Section 2 — pick every discipline that lives in you. Audience counts.',
    3: 'Section 3 — Aug 29 night. Attending? Jam? Tell the truth of your calendar.',
    4: 'Section 4 — jam details. Solo, with musicians, or freestyle — then instruments & songs.',
  };

  let lastHint = '';
  let lastSection = 0;

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function speak(text, type) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, text, type || 'guide');
      return;
    }
    // Soft fallback bubble if Flowee vessel not ready
    const host = document.getElementById('flowee-agent');
    if (!host) return;
    let bubble = host.querySelector('.join-flowee-fallback');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'join-flowee-fallback';
      bubble.style.cssText =
        'max-width:260px;margin:0 0 8px auto;padding:10px 12px;background:rgba(0,255,204,0.1);' +
        'border:1px solid rgba(0,255,204,0.35);border-radius:14px 14px 4px 14px;color:#fff;font-size:13px;line-height:1.4;';
      host.prepend(bubble);
    }
    bubble.textContent = text.replace(/<[^>]+>/g, '');
  }

  window.FloweeJoinGuide = {
    boot() {
      setTimeout(() => {
        speak(
          'Welcome to the family. I am <strong>Flowee</strong> — I will walk you through Member & Jam registration for Lapa 71.',
          'guide'
        );
      }, 700);
    },
    onSection(step, meta) {
      if (step === lastSection) return;
      lastSection = step;
      let msg = SECTION_INTRO[step] || 'Keep flowing.';
      if (step === 4 && meta && meta.jam) {
        msg = SECTION_INTRO[4];
      }
      if (step === 3 && meta && meta.jam === false) {
        msg = 'No jam? Perfect — hit Submit when ready and stay on the member frequency.';
      }
      speak(msg, 'guide');
    },
    onFieldFocus(key) {
      const text = HINTS[key];
      if (!text || text === lastHint) return;
      lastHint = text;
      speak(text, 'guide');
    },
    onSuccess(data) {
      const pid = data && data.profileId ? ' Your shadow profile is linked.' : ' Claim your profile at login when ready.';
      speak('Registration sealed.' + pid + ' Sanctuary and Bantaba await.', 'success');
    },
  };
})();
