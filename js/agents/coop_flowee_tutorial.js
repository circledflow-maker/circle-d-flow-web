/**
 * Flowee Coop Tutorial — interactive walkthrough for team planning
 */
(function () {
  const STORAGE_KEY = 'cdf_coop_tutorial_done';

  function highlight(target) {
    if (window.coopFloweeSpotlight) window.coopFloweeSpotlight(target);
  }

  const STEPS = [
    {
      title: 'Welcome to the Resonance Bar',
      text: 'I am Flowee, your barkeeper. KyheartLx, Naru, and C-riz plan events here — organic jams or social media shoots. Swipe panels on mobile.',
      target: '#flowee-guide-card',
      action: () => window.CoopMobile?.goPanel?.(1),
      cta: 'Next',
    },
    {
      title: 'Team · Invite to Project',
      text: 'Link Naru & C-riz via Supabase. Green = connected. Tap + Naru or + C-riz — invites sync the whole plan.',
      target: '#coop-team-status',
      action: () => {
        document.getElementById('coop-invite-input')?.focus();
        window.CoopMobile?.goPanel?.(0);
      },
      cta: 'Invite crew',
    },
    {
      title: 'Phase 1 — Vibe & Adinkra Soul',
      text: 'Name your session, pick Organic vs Social Media, scale, then one of six Adinkra souls (Adwo, Nkyemu, Akoma…).',
      target: '#coop-phase-form, #coop-phase-form-m',
      action: () => {
        if (window.CoopBarkeeper) {
          window.CoopBarkeeper.project.phase = 1;
          window.CoopBarkeeper.save({});
          window.CoopBarkeeper.renderPhaseForm();
        }
        window.CoopMobile?.goPanel?.(1);
      },
      cta: 'Open Phase 1',
    },
    {
      title: 'Phase 2 — Crew Roles',
      text: 'Assign Coordinator, Vision, MC, Audio. Required: Coordinator + Plan B Lead. Your picks sync for everyone.',
      target: '#coop-crew-grid, #coop-crew-viewport',
      action: () => {
        if (window.CoopBarkeeper) {
          window.CoopBarkeeper.project.phase = 2;
          window.CoopBarkeeper.save({});
          window.CoopBarkeeper.renderPhaseForm();
        }
        window.CoopMobile?.goPanel?.(1);
      },
      cta: 'Assign roles',
    },
    {
      title: 'Location, Gear & Calendar',
      text: 'Phases 3–4: Lisbon spot, guestlist, equipment, event date, Plan B, post-production. I remind you before the event.',
      target: '#coop-location, #coop-event-date',
      action: () => {
        if (window.CoopBarkeeper) {
          window.CoopBarkeeper.project.phase = 3;
          window.CoopBarkeeper.save({});
          window.CoopBarkeeper.renderPhaseForm();
        }
      },
      cta: 'Next',
    },
    {
      title: 'Chat with Flowee',
      text: 'Tag @Flowee anytime — ask about coop, tutorial, roles, gear, Adinkra, or "summary". I answer in the bar chat.',
      target: '#coop-bar-chat, #coop-chat-input',
      action: () => {
        document.getElementById('coop-chat-input')?.focus();
        document.getElementById('coop-chat-input-m')?.focus();
      },
      cta: 'Try @Flowee',
    },
    {
      title: 'Seal The Bon',
      text: 'Phase 5 generates the briefing. Download it and open Sanctuary with the crew. You are ready to work as one team.',
      target: '[data-seal="5"], #coop-brief-preview',
      action: () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        if (window.Flowee) window.Flowee.talk(true, 'Tutorial complete. Let us mix something legendary, Navigator.', 'celebrate');
        if (window.CoopBarkeeper) window.CoopBarkeeper.pushChat('flowee', 'Tutorial sealed. Seal your phases for EXP + Trust + Flow.');
      },
      cta: 'Start planning',
    },
  ];

  window.CoopFloweeTutorial = {
    index: 0,

    isDone() {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    },

    start(fromFlowee) {
      this.index = 0;
      this.showStep(fromFlowee);
    },

    showStep(fromFlowee) {
      const step = STEPS[this.index];
      if (!step) return;
      const card = document.getElementById('flowee-tutorial-card');
      const title = document.getElementById('flowee-tutorial-title');
      const body = document.getElementById('flowee-tutorial-body');
      const btn = document.getElementById('flowee-tutorial-next');
      const prog = document.getElementById('flowee-tutorial-progress');
      if (card) card.classList.remove('hidden');
      if (title) title.textContent = step.title;
      if (body) body.textContent = step.text;
      if (prog) prog.textContent = `Step ${this.index + 1} / ${STEPS.length}`;
      highlight(step.target);
      if (fromFlowee && window.Flowee) window.Flowee.talk(true, step.text, 'guide');
      if (window.CoopBarkeeper) window.CoopBarkeeper.pushChat('flowee', `📍 ${step.title}: ${step.text}`);
      if (btn) {
        btn.textContent = step.cta;
        btn.onclick = () => {
          step.action?.();
          this.index += 1;
          if (this.index >= STEPS.length) {
            this.finish();
          } else {
            this.showStep(false);
          }
        };
      }
    },

    finish() {
      localStorage.setItem(STORAGE_KEY, 'true');
      document.getElementById('flowee-tutorial-card')?.classList.add('hidden');
      document.querySelectorAll('.coop-flowee-spotlight').forEach((el) => el.classList.remove('coop-flowee-spotlight'));
      if (window.Pusher) window.Pusher.showToast('Coop tutorial complete · +25 EXP', 'success');
      const exp = parseInt(localStorage.getItem('cdf_xp') || '0', 10) + 25;
      localStorage.setItem('cdf_xp', String(exp));
      if (window.CoopBarkeeper) window.CoopBarkeeper.renderResonanceBar();
    },

    offer() {
      if (this.isDone()) return;
      setTimeout(() => {
        const card = document.getElementById('flowee-tutorial-card');
        if (card) card.classList.remove('hidden');
        const title = document.getElementById('flowee-tutorial-title');
        const body = document.getElementById('flowee-tutorial-body');
        const prog = document.getElementById('flowee-tutorial-progress');
        const btn = document.getElementById('flowee-tutorial-next');
        if (title) title.textContent = 'Coop Tutorial Ready';
        if (body) body.textContent = 'Tap Start Tutorial to begin interactive guidance. Flowee continues step-by-step only after your input.';
        if (prog) prog.textContent = `Step 0 / ${STEPS.length}`;
        if (btn) btn.onclick = () => this.start(true);
      }, 1500);
    },
  };
})();
