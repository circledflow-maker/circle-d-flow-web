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

  function floweeError(msg, meta) {
    if (window.FloweeJoinGuide && typeof window.FloweeJoinGuide.onError === 'function') {
      window.FloweeJoinGuide.onError(msg, meta || {});
    }
  }

  function showError(msg, meta) {
    if (!msg) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
      return;
    }
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    floweeError(msg, meta);
  }

  function getSection(n) {
    return document.querySelector(`[data-section="${n}"]`);
  }

  function jamYes() {
    const el = form.querySelector('input[name="jamInterested"]:checked');
    return el && el.value === 'yes';
  }

  function selectedDisciplines() {
    return Array.from(form.querySelectorAll('input[name="disciplines"]:checked')).map((el) => el.value);
  }

  function isNonMusicCreator() {
    const discs = selectedDisciplines();
    const style = form.querySelector('input[name="jamPerformStyle"]:checked')?.value;
    if (style === 'art_showcase') return true;
    return discs.some((d) =>
      /visual|fashion|designer|other|photo/i.test(d)
    );
  }

  function updateProgress(step) {
    document.querySelectorAll('.progress-dot').forEach((dot) => {
      const s = Number(dot.dataset.step);
      dot.classList.toggle('active', s === step);
      dot.classList.toggle('done', s < step);
    });
  }

  function goTo(step) {
    if (step === 4 && !jamYes()) {
      return;
    }
    document.querySelectorAll('[data-section]').forEach((sec) => {
      sec.hidden = Number(sec.dataset.section) !== step;
    });
    currentStep = step;
    updateProgress(step);
    showError('');
    if (window.FloweeJoinGuide) {
      window.FloweeJoinGuide.onSection(step, {
        jam: jamYes(),
        nonMusic: isNonMusicCreator(),
      });
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
      if (!fullName) return { msg: 'Full name is required.', field: 'fullName' };
      if (!stageName) return { msg: 'Preferred / stage name is required.', field: 'stageName' };
      if (!phone) return { msg: 'WhatsApp / phone is required.', field: 'phone' };
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { msg: 'A valid email is required.', field: 'email' };
      }
      if (!instagram) return { msg: 'Instagram handle is required (e.g. @username).', field: 'instagram' };
      return null;
    }
    if (step === 2) {
      const checked = form.querySelectorAll('input[name="disciplines"]:checked');
      if (!checked.length) {
        return { msg: 'Select at least one artistic discipline.', field: 'disciplines' };
      }
      if (otherCheck.checked && !form.disciplineOther.value.trim()) {
        return {
          msg: 'Please describe your “Other” discipline / art.',
          field: 'disciplineOther',
        };
      }
      return null;
    }
    if (step === 3) {
      if (!form.querySelector('input[name="attendingAug29"]:checked')) {
        return { msg: 'Please choose whether you are attending Aug 29.', field: 'attendingAug29' };
      }
      if (!form.querySelector('input[name="jamInterested"]:checked')) {
        return { msg: 'Please choose whether you are interested in the Jam.', field: 'jamInterested' };
      }
      return null;
    }
    if (step === 4) {
      if (!form.querySelector('input[name="jamPerformStyle"]:checked')) {
        return { msg: 'How will you perform or showcase?', field: 'jamPerformStyle' };
      }
      const art = (form.jamArtDescription?.value || '').trim();
      const style = form.querySelector('input[name="jamPerformStyle"]:checked')?.value;
      if ((style === 'art_showcase' || isNonMusicCreator()) && !art) {
        return {
          msg: 'Describe your art / performance so we know what you bring.',
          field: 'jamArtDescription',
        };
      }
      return null;
    }
    return null;
  }

  function collectPayload() {
    const disciplines = selectedDisciplines();
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
      payload.jamPerformStyle =
        form.querySelector('input[name="jamPerformStyle"]:checked')?.value || null;
      payload.jamInstruments = form.jamInstruments.value.trim() || null;
      payload.jamSongDetails = form.jamSongDetails.value.trim() || null;
      payload.jamArtDescription = form.jamArtDescription?.value.trim() || null;
      const bt = form.querySelector('input[name="jamBackingTrack"]:checked');
      payload.jamBackingTrack = bt ? bt.value === 'yes' : null;
    }
    return payload;
  }

  function friendlyApiError(data, status) {
    const raw = data?.error || data?.details || '';
    const details = data?.details || '';
    if (/Invalid path specified/i.test(raw + details) || data?.code === 'BAD_SUPABASE_URL') {
      return 'Registration is paused — Supabase URL on the server looks wrong. It must be https://YOUR_PROJECT.supabase.co (without /rest/v1).';
    }
    if (/Missing required environment variable/i.test(raw) || /SUPABASE_/i.test(raw)) {
      return 'Registration is paused — the server is missing connection keys. Tell the Circle D Flow crew to set Supabase env vars on Vercel.';
    }
    if (status === 405) return 'This registration path is not accepting that method right now.';
    if (status >= 500) {
      const detail = details && details !== raw ? ` (${details})` : '';
      return raw
        ? `Something went wrong on the server: ${raw}${detail}`
        : 'Something went wrong on the server. Please try again in a moment.';
    }
    return raw || 'Registration failed. Check the highlighted fields and try again.';
  }

  async function submitRegistration() {
    const err4 = jamYes() ? validateStep(4) : null;
    if (err4) {
      showError(err4.msg, { step: 4, field: err4.field });
      return;
    }
    const payload = collectPayload();
    submitBtn && (submitBtn.disabled = true);
    const buttons = form.querySelectorAll('button');
    buttons.forEach((b) => {
      b.disabled = true;
    });
    showError('');

    try {
      const res = await fetch('/api/register-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw Object.assign(new Error(friendlyApiError(data, res.status)), {
          status: res.status,
          data,
        });
      }
      form.hidden = true;
      document.getElementById('progress-track').hidden = true;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.FloweeJoinGuide) window.FloweeJoinGuide.onSuccess(data);
      try {
        localStorage.setItem('cdf_lapa71_registration_id', data.registrationId || '');
        if (data.profileId) localStorage.setItem('cdf_shadow_profile_id', data.profileId);
      } catch (_) {
        /* ignore */
      }
    } catch (e) {
      const msg =
        e.message ||
        'Something went wrong. Please try again — I am still here with you.';
      showError(msg, { step: currentStep, api: true, status: e.status });
      buttons.forEach((b) => {
        b.disabled = false;
      });
    }
  }

  form.addEventListener('click', (ev) => {
    const next = ev.target.closest('[data-next]');
    const prev = ev.target.closest('[data-prev]');
    if (next) {
      const target = Number(next.dataset.next);
      const err = validateStep(currentStep);
      if (err) {
        showError(err.msg, { step: currentStep, field: err.field });
        return;
      }
      if (currentStep === 3 && target === 4) {
        if (!jamYes()) {
          submitRegistration();
          return;
        }
        goTo(4);
        return;
      }
      goTo(target);
    }
    if (prev) goTo(Number(prev.dataset.prev));
  });

  form.addEventListener('change', (ev) => {
    if (ev.target.name === 'jamInterested' || ev.target.name === 'attendingAug29') {
      const nextBtn = getSection(3)?.querySelector('[data-next="4"]');
      if (nextBtn) {
        nextBtn.textContent = jamYes() ? 'Continue' : 'Submit Registration';
      }
    }
    if (ev.target === otherCheck || ev.target.id === 'disc-other-check') {
      otherWrap.hidden = !otherCheck.checked;
      if (otherCheck.checked && window.FloweeJoinGuide) {
        window.FloweeJoinGuide.onFieldFocus('other', currentStep);
      }
    }
    if (ev.target.name === 'jamPerformStyle' && ev.target.value === 'art_showcase') {
      if (window.FloweeJoinGuide) window.FloweeJoinGuide.onFieldFocus('art', 4);
      form.jamArtDescription?.focus();
    }
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const err = validateStep(4);
    if (err) {
      showError(err.msg, { step: 4, field: err.field });
      return;
    }
    submitRegistration();
  });

  form.addEventListener('focusin', (ev) => {
    const hint = ev.target.getAttribute('data-flowee-hint');
    if (hint && window.FloweeJoinGuide) {
      window.FloweeJoinGuide.onFieldFocus(hint, currentStep);
    }
  });

  goTo(1);
  if (window.FloweeJoinGuide) window.FloweeJoinGuide.boot();
})();
