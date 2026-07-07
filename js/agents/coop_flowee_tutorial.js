/**
 * Flowee Coop Tutorial — interactive walkthrough for team planning
 */
(function () {
  const STORAGE_KEY = 'cdf_coop_tutorial_done';

  const STEPS = [
    {
      title: 'Welcome to the Resonance Bar',
      text: 'I am Flowee, your barkeeper. Here KyheartLx, Naru, and C-riz plan events together — organic jams or social media shoots. Swipe panels on mobile.',
      action: () => window.CoopMobile?.goPanel?.(0),
      cta: 'Next',
    },
    {
      title: 'Resonance HUD',
      text: 'EXP, Trust (Karma), and Flow Credits grow when you seal phases and complete ledger tasks. Everyone on the team sees the same plan when synced.',
      action: () => {},
      cta: 'Next',
    },
    {
      title: 'Phase 1 — Vibe Check',
      text: 'Name your session, pick Organic vs Social Media, and choose scale. This sets the Adinkra soul for your project.',
      action: () => {
        window.CoopBarkeeper && (window.CoopBarkeeper.project.phase = 1);
        window.CoopBarkeeper?.save({});
        window.CoopBarkeeper?.renderPhaseForm();
        window.CoopMobile?.goPanel?.(1);
      },
      cta: 'Open Phase 1',
    },
    {
      title: 'Invite Your Crew',
      text: 'Naru and C-riz already have accounts. Search their username and send a coop invite — they get a notification and join the same project.',
      action: () => {
        document.getElementById('coop-invite-input')?.focus();
        window.CoopMobile?.goPanel?.(0);
      },
      cta: 'Invite team',
    },
    {
      title: 'Phase 2 — Roles',
      text: 'Swipe crew cards: assign Coordinator, Vision, MC, Audio. Required: Coordinator + Plan B Lead. Your picks sync to Supabase.',
      action: () => {
        window.CoopBarkeeper && (window.CoopBarkeeper.project.phase = 2);
        window.CoopBarkeeper?.save({});
        window.CoopBarkeeper?.renderPhaseForm();
        window.CoopMobile?.goPanel?.(1);
      },
      cta: 'Assign roles',
    },
    {
      title: 'Location, Gear & Calendar',
      text: 'Phases 3–4: Lisbon spot, guestlist, equipment pack, event date, Plan B, and post-production follow-up. I remind you before the event.',
      action: () => {
        window.CoopBarkeeper && (window.CoopBarkeeper.project.phase = 3);
        window.CoopBarkeeper?.save({});
        window.CoopBarkeeper?.renderPhaseForm();
      },
      cta: 'Next',
    },
    {
      title: 'Seal The Bon',
      text: 'Phase 5 generates the briefing. Enter Sanctuary chat — tag @Flowee anytime. You are ready to work as one team.',
      action: () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        if (window.Flowee) window.Flowee.talk(true, 'Tutorial complete. Let us mix something legendary, Navigator.', 'celebrate');
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
      if (btn) {
        btn.textContent = step.cta;
        btn.onclick = () => {
          step.action?.();
          if (fromFlowee && window.Flowee) window.Flowee.talk(false, step.text, 'guide');
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
      if (window.Pusher) window.Pusher.showToast('Coop tutorial complete · +25 EXP', 'success');
      const exp = parseInt(localStorage.getItem('cdf_xp') || '0', 10) + 25;
      localStorage.setItem('cdf_xp', String(exp));
      if (window.CoopBarkeeper) window.CoopBarkeeper.renderResonanceBar();
    },

    offer() {
      if (this.isDone()) return;
      setTimeout(() => {
        if (window.Flowee) {
          window.Flowee.talk(true, 'New to the Resonance Bar? I can walk you and the team through planning in 2 minutes. Tap Start Tutorial on the guide card.', 'guide');
        }
        this.showStep(true);
      }, 2000);
    },
  };
})();
