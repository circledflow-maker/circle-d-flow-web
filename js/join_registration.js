/**
 * Lapa 71 join form — multi-section + conditional jam + POST /api/register-event
 */
(function () {
  const EVENT_ID = 'lapa71-tagus-drop-20260829';
  const form = document.getElementById('join-form');
  const errorEl = document.getElementById('form-error');
  const successPanel = document.getElementById('success-panel');
  const otherCheck = document.getElementById('disc-other-check');
  const otherWrap = document.getElementById('discipline-other-wrap');
  const submitBtn = document.getElementById('submit-btn');

  let currentStep = 1;

  function showError(msg) {
    if (!msg) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
      return;
    }
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function getSection(n) {
    return document.querySelector(`[data-section="${n}"]`);
  }

  function jamYes() {
    const el = form.querySelector('input[name="jamInterested"]:checked');
    return el && el.value === 'yes';
  }

  function updateProgress(step) {
    document.querySelectorAll('.progress-dot').forEach((dot) => {
      const s = Number(dot.dataset.step);
      dot.classList.toggle('active', s === step);
      dot.classList.toggle('done', s < step);
    });
  }

  function goTo(step) {
    const max = jamYes() ? 4 : 3;
    if (step === 4 && !jamYes()) {
      // submit path from section 3 when jam = no
      return;
    }
    document.querySelectorAll('[data-section]').forEach((sec) => {
      sec.hidden = Number(sec.dataset.section) !== step;
    });
    currentStep = step;
    updateProgress(step);
    showError('');
    if (window.FloweeJoinGuide) {
      window.FloweeJoinGuide.onSection(step, { jam: jamYes() });
    }
    getSection(step)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep(step) {
    if (step === 1) {
      const fullName = form.fullName.value.trim();
      const stageName = form.stageName.value.trim();
      const phone = form.phone.value.trim();
      const email = form.email.value.trim();
      const instagram = form.instagram.value.trim();
      if (!fullName) return 'Full name is required.';
      if (!stageName) return 'Preferred / stage name is required.';
      if (!phone) return 'WhatsApp / phone is required.';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'A valid email is required.';
      if (!instagram) return 'Instagram handle is required (e.g. @username).';
      return null;
    }
    if (step === 2) {
      const checked = form.querySelectorAll('input[name="disciplines"]:checked');
      if (!checked.length) return 'Select at least one artistic discipline.';
      if (otherCheck.checked && !form.disciplineOther.value.trim()) {
        return 'Please describe your “Other” discipline.';
      }
      return null;
    }
    if (step === 3) {
      if (!form.querySelector('input[name="attendingAug29"]:checked')) {
        return 'Please choose whether you are attending Aug 29.';
      }
      if (!form.querySelector('input[name="jamInterested"]:checked')) {
        return 'Please choose whether you are interested in the Jam.';
      }
      return null;
    }
    if (step === 4) {
      if (!form.querySelector('input[name="jamPerformStyle"]:checked')) {
        return 'How will you perform?';
      }
      return null;
    }
    return null;
  }

  function collectPayload() {
    const disciplines = Array.from(form.querySelectorAll('input[name="disciplines"]:checked')).map(
      (el) => el.value
    );
    const attending = form.querySelector('input[name="attendingAug29"]:checked')?.value === 'yes';
    const jam = form.querySelector('input[name="jamInterested"]:checked')?.value === 'yes';
    const payload = {
      eventId: EVENT_ID,
      source: 'social_join',
      fullName: form.fullName.value.trim(),
      stageName: form.stageName.value.trim() || null,
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      instagramHandle: form.instagram.value.trim() || null,
      disciplines,
      disciplineOther: form.disciplineOther.value.trim() || null,
      attendingAug29: attending,
      jamInterested: jam,
    };
    if (jam) {
      payload.jamPerformStyle = form.querySelector('input[name="jamPerformStyle"]:checked')?.value || null;
      payload.jamInstruments = form.jamInstruments.value.trim() || null;
      payload.jamSongDetails = form.jamSongDetails.value.trim() || null;
      const bt = form.querySelector('input[name="jamBackingTrack"]:checked');
      payload.jamBackingTrack = bt ? bt.value === 'yes' : null;
    }
    return payload;
  }

  async function submitRegistration() {
    const err4 = jamYes() ? validateStep(4) : null;
    if (err4) {
      showError(err4);
      return;
    }
    const payload = collectPayload();
    submitBtn && (submitBtn.disabled = true);
    const buttons = form.querySelectorAll('button');
    buttons.forEach((b) => { b.disabled = true; });
    showError('');

    try {
      const res = await fetch('/api/register-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Registration failed');
      }
      form.hidden = true;
      document.getElementById('progress-track').hidden = true;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.FloweeJoinGuide) window.FloweeJoinGuide.onSuccess(data);
      try {
        localStorage.setItem('cdf_lapa71_registration_id', data.registrationId || '');
        if (data.profileId) localStorage.setItem('cdf_shadow_profile_id', data.profileId);
      } catch (_) { /* ignore */ }
    } catch (e) {
      showError(e.message || 'Something went wrong. Please try again.');
      buttons.forEach((b) => { b.disabled = false; });
    }
  }

  form.addEventListener('click', (ev) => {
    const next = ev.target.closest('[data-next]');
    const prev = ev.target.closest('[data-prev]');
    if (next) {
      const target = Number(next.dataset.next);
      const err = validateStep(currentStep);
      if (err) {
        showError(err);
        return;
      }
      if (currentStep === 3 && target === 4) {
        if (!jamYes()) {
          submitRegistration();
          return;
        }
        // Replace continue with submit affordance on step 4
        goTo(4);
        return;
      }
      goTo(target);
    }
    if (prev) goTo(Number(prev.dataset.prev));
  });

  // When jam = no, section 3 primary becomes submit-like: change label
  form.addEventListener('change', (ev) => {
    if (ev.target.name === 'jamInterested' || ev.target.name === 'attendingAug29') {
      const nextBtn = getSection(3)?.querySelector('[data-next="4"]');
      if (nextBtn) {
        nextBtn.textContent = jamYes() ? 'Continue' : 'Submit Registration';
      }
    }
    if (ev.target === otherCheck || ev.target.id === 'disc-other-check') {
      otherWrap.hidden = !otherCheck.checked;
    }
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const err = validateStep(4);
    if (err) {
      showError(err);
      return;
    }
    submitRegistration();
  });

  // Field focus → Flowee coaching
  form.addEventListener('focusin', (ev) => {
    const hint = ev.target.getAttribute('data-flowee-hint');
    if (hint && window.FloweeJoinGuide) {
      window.FloweeJoinGuide.onFieldFocus(hint, currentStep);
    }
  });

  // Ensure section 3 button can submit when jam=no (already handled)
  // Boot
  goTo(1);
  if (window.FloweeJoinGuide) window.FloweeJoinGuide.boot();
})();
