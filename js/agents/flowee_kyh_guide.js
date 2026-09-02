/**
 * Flowee KYH Guide — interactive tutorial + scene coaching
 */
(function () {
  const STORAGE_TOUR = 'kyh_home_tour_done';

  const HOME_TOUR = [
    { scene: 0, text: 'Welcome to <strong>Kiss Your Heart</strong>. I am Flowee — your guide from first idea to shared experience.', target: null },
    { scene: 0, text: 'When you are ready, tap <strong>Start Your Project</strong>. We build the path together.', target: '[data-kyh-tour="start-project"]' },
    { scene: 1, text: 'What is in your heart? Pick a direction — exhibition, concert, community, or something entirely your own.', target: '[data-kyh-tour="types"]' },
    { scene: 2, text: 'We connect the dots: people, ideas, spaces, resources — until they become experiences.', target: '[data-kyh-tour="connect"]' },
    { scene: 3, text: 'Every project walks six stages: Feel → Shape → Connect → Build → Experience → Share.', target: '[data-kyh-tour="journey"]' },
    { scene: 4, text: 'Real stories from Lisbon — not a portfolio, but proof of how ideas become experiences.', target: '[data-kyh-tour="experiences"]' },
    { scene: 5, text: 'Bring the idea. I will walk with you through the Project Builder — one meaningful question at a time.', target: '[data-kyh-tour="final-cta"]' },
  ];

  const BUILDER_HINTS = {
    types: 'Choose what you are creating — you can select more than one.',
    heart: 'Write freely. This is the feeling and intention behind your project.',
    have: 'What is already in place? Even an idea alone counts.',
    need: 'What would help most? We will recommend your next step.',
  };

  let tourIndex = 0;
  let tourActive = false;
  let tourBtn = null;

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function speak(text, type) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, text, type || 'guide');
      return;
    }
    console.log('[FloweeKyh]', text.replace(/<[^>]+>/g, ''));
  }

  function clearSpotlight() {
    document.querySelectorAll('.kyh-spotlight').forEach((el) => el.classList.remove('kyh-spotlight'));
  }

  function spotlight(selector) {
    clearSpotlight();
    if (!selector) return;
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('kyh-spotlight');
      if (!document.body.classList.contains('kyh-scenes-mode')) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function ensureTourButton() {
    if (tourBtn) return tourBtn;
    tourBtn = document.createElement('button');
    tourBtn.type = 'button';
    tourBtn.className = 'kyh-tour-next';
    tourBtn.textContent = 'Next with Flowee →';
    tourBtn.hidden = true;
    tourBtn.addEventListener('click', () => FloweeKyhGuide.tourNext());
    document.body.appendChild(tourBtn);
    return tourBtn;
  }

  function showTourButton(show) {
    const btn = ensureTourButton();
    btn.hidden = !show;
  }

  function applyTourStep(step) {
    if (window.KYHScenes && typeof step.scene === 'number') {
      KYHScenes.goTo(step.scene);
    }
    speak(step.text, 'guide');
    spotlight(step.target);
  }

  function detectContext() {
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('project-builder')) return 'builder';
    if (path.includes('project-map')) return 'map';
    if (path.includes('experiences')) return 'experiences';
    if (path.includes('journey')) return 'journey';
    if (path.includes('/kyh') || path.endsWith('kyh')) return 'home';
    return 'shell';
  }

  window.FloweeKyhGuide = {
    boot(delayMs) {
      const ctx = detectContext();
      setTimeout(() => {
        if (ctx === 'home' && !localStorage.getItem(STORAGE_TOUR)) {
          this.startHomeTour();
        } else if (ctx === 'builder') {
          speak('No bureaucracy — one meaningful question at a time. I will coach each step.', 'guide');
        } else if (ctx === 'map') {
          speak('Your Project Map — where you are, what you have, and the recommended next step.', 'guide');
        } else if (ctx === 'journey') {
          speak('Six stages from first feeling to shared echo. Every real project walks this path.', 'guide');
        } else {
          speak('Welcome to <strong>Kiss Your Heart</strong>. Tap me anytime — I am Flowee, your guide.', 'guide');
        }
      }, delayMs || 900);
    },

    startHomeTour() {
      tourActive = true;
      tourIndex = 0;
      showTourButton(true);
      applyTourStep(HOME_TOUR[0]);
    },

    tourNext() {
      if (!tourActive) return;
      tourIndex += 1;
      if (tourIndex >= HOME_TOUR.length) {
        tourActive = false;
        showTourButton(false);
        clearSpotlight();
        localStorage.setItem(STORAGE_TOUR, '1');
        speak('You know the way. When you are ready — <strong>Start Your Project</strong>.', 'success');
        return;
      }
      applyTourStep(HOME_TOUR[tourIndex]);
    },

    restartTour() {
      localStorage.removeItem(STORAGE_TOUR);
      tourIndex = 0;
      this.startHomeTour();
    },

    onSceneChange(index) {
      if (!tourActive) return;
      const step = HOME_TOUR[tourIndex];
      if (step && step.scene === index) spotlight(step.target);
    },

    hint(stage) {
      const hints = {
        FEEL: 'Start with what moves you — the idea, the intention, the impact you imagine.',
        SHAPE: 'Define what your idea needs: type, scale, timeline, resources.',
        CONNECT: 'Who belongs in this story? Artists, venues, partners, community.',
        BUILD: 'Structure turns vision into plan — tasks, timeline, production.',
        EXPERIENCE: 'What should people feel, see, hear when it happens?',
        SHARE: 'The experience continues — documentation, visibility, community echo.',
      };
      speak(hints[String(stage || '').toUpperCase()] || hints.FEEL, 'hint');
    },

    onBuilderStep(stepId) {
      if (BUILDER_HINTS[stepId]) speak(BUILDER_HINTS[stepId], 'hint');
    },

    onCta(label) {
      speak(`Good choice — <strong>${label}</strong> is a clear next step.`, 'guide');
    },

    spotlight,
    clearSpotlight,
  };

  window.addEventListener('kyh:scene-change', (e) => {
    if (window.FloweeKyhGuide?.onSceneChange) {
      FloweeKyhGuide.onSceneChange(e.detail?.index);
    }
  });
})();
