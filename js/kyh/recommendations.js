/**
 * Kiss Your Heart — deterministic recommendation engine (V1)
 */
(function () {
  const SERVICES = {
    VISION_SESSION: {
      id: 'VISION_SESSION',
      title: 'Vision Session',
      description: 'Clarify intention, impact, and the heart of your project.',
      ctaLabel: 'Book a Vision Session',
    },
    PROJECT_DEVELOPMENT: {
      id: 'PROJECT_DEVELOPMENT',
      title: 'Project Development Session',
      description: 'Turn your idea into a defined project with objectives, timeline, and scale.',
      ctaLabel: 'Book Project Development',
    },
    CONNECTION_SUPPORT: {
      id: 'CONNECTION_SUPPORT',
      title: 'Connection Support',
      description: 'Identify artists, venues, partners, and sponsors your project needs.',
      ctaLabel: 'Book Connection Support',
    },
    PRODUCTION: {
      id: 'PRODUCTION',
      title: 'Production Consultation',
      description: 'Plan production, responsibilities, and execution requirements.',
      ctaLabel: 'Book Production Consultation',
    },
    SPONSOR_STRATEGY: {
      id: 'SPONSOR_STRATEGY',
      title: 'Sponsor Strategy',
      description: 'Develop funding pathways and sponsor alignment for your project.',
      ctaLabel: 'Book Sponsor Strategy',
    },
    FULL_JOURNEY: {
      id: 'FULL_JOURNEY',
      title: 'The Full Journey',
      description: 'From first idea to final experience — Feel through Share.',
      ctaLabel: 'Book the Full Journey',
    },
  };

  function computeStage(project) {
    const maturity = project.maturity || 'IDEA';
    const has = project.resources || [];
    const needs = project.needs || [];

    if (maturity === 'IDEA' || maturity === 'EARLY') return 'FEEL';
    if (maturity === 'CONCEPT_READY' || needs.includes('PROJECT_STRUCTURE')) return 'SHAPE';
    if (needs.some((n) => ['ARTISTS', 'VENUE', 'SPONSORS', 'PARTNERS'].includes(n))) return 'CONNECT';
    if (needs.some((n) => ['PRODUCTION', 'PROJECT_MANAGEMENT'].includes(n))) return 'BUILD';
    if (maturity === 'PRODUCTION' || maturity === 'ALMOST') return 'EXPERIENCE';
    if (has.includes('DOCUMENTATION') || needs.includes('DOCUMENTATION')) return 'SHARE';
    if (!has.includes('VENUE') && needs.includes('VENUE')) return 'CONNECT';
    return 'SHAPE';
  }

  function recommend(project) {
    const stage = computeStage(project);
    const needs = project.needs || [];

    if (needs.includes('FULL_PROJECT_MANAGEMENT')) {
      return { ...SERVICES.FULL_JOURNEY, stage, reason: 'You asked for full project management.' };
    }
    if (needs.includes('SPONSORS') || needs.includes('FUNDING')) {
      return { ...SERVICES.SPONSOR_STRATEGY, stage, reason: 'Funding and sponsors are part of your path.' };
    }
    if (stage === 'FEEL') {
      return { ...SERVICES.VISION_SESSION, stage, reason: 'Your project is at the feeling stage — clarity comes first.' };
    }
    if (stage === 'SHAPE') {
      return { ...SERVICES.PROJECT_DEVELOPMENT, stage, reason: 'Your idea is ready to become a structured project.' };
    }
    if (stage === 'CONNECT') {
      return { ...SERVICES.CONNECTION_SUPPORT, stage, reason: 'Connections are the next step — people, spaces, resources.' };
    }
    if (stage === 'BUILD' || stage === 'EXPERIENCE') {
      return { ...SERVICES.PRODUCTION, stage, reason: 'Production and execution need a clear plan.' };
    }
    return { ...SERVICES.PROJECT_DEVELOPMENT, stage, reason: 'A development session helps define your next move.' };
  }

  function stageIndex(name) {
    const stages = window.KYH_CONFIG?.stages || [];
    return Math.max(0, stages.indexOf(name));
  }

  window.KYHRecommendations = {
    computeStage,
    recommend,
    stageIndex,
    SERVICES,
  };
})();
