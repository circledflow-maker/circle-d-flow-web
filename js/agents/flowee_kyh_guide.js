/**
 * Flowee KYH Guide — warm creative project coaching
 */
(function () {
  const INTROS = {
    shell: 'Welcome to <strong>Kiss Your Heart</strong>. I am Flowee — your guide from first idea to shared experience.',
    journey: 'Six stages: Feel, Shape, Connect, Build, Experience, Share. Every real project walks this path.',
    builder: 'No bureaucracy — just one meaningful question at a time. Tell me what you are creating.',
    experiences: 'These are not portfolios — they are stories of ideas that became experiences.',
  };

  function agent() {
    return window.flowee || window.Flowee || window.floweeAgent || null;
  }

  function speak(text, type) {
    const a = agent();
    if (a && typeof a.talk === 'function') {
      a.talk(true, text, type || 'guide');
    }
  }

  function detectContext() {
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('project-builder')) return 'builder';
    if (path.includes('experiences')) return 'experiences';
    if (path.includes('journey')) return 'journey';
    return 'shell';
  }

  window.FloweeKyhGuide = {
    boot(delayMs) {
      const ctx = detectContext();
      setTimeout(() => speak(INTROS[ctx] || INTROS.shell, 'guide'), delayMs || 900);
    },
    hint(stage) {
      const hints = {
        FEEL: 'Start with what moves you — the idea, the intention, the impact you imagine.',
        SHAPE: 'Let us define what your idea needs: type, scale, timeline, resources.',
        CONNECT: 'Who belongs in this story? Artists, venues, partners, community.',
        BUILD: 'Structure turns vision into plan — tasks, timeline, production.',
        EXPERIENCE: 'What should people feel, see, hear when it happens?',
        SHARE: 'The experience continues — documentation, visibility, community echo.',
      };
      speak(hints[String(stage || '').toUpperCase()] || INTROS.journey, 'hint');
    },
    onCta(label) {
      speak(`Good choice — <strong>${label}</strong> is a clear next step. I am here if you need orientation.`, 'guide');
    },
  };
})();
