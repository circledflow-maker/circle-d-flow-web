/**
 * Kiss Your Heart — deterministic recommendation engine (V1)
 */
(function () {
  function svc(id) {
    return window.KYHServices?.getById(id) || { id, title: id, description: '', ctaLabel: 'Book a Session' };
  }

  function withBook(rec, id) {
    const s = svc(id);
    return {
      ...s,
      ...rec,
      bookHref: window.KYHServices?.bookHref(id) || '/pages/booking?source=kyh',
    };
  }

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
      return withBook({ stage, reason: 'You asked for full project management.' }, 'FULL_JOURNEY');
    }
    if (needs.includes('SPONSORS') || needs.includes('FUNDING')) {
      return withBook({ stage, reason: 'Funding and sponsors are part of your path.' }, 'SPONSOR_STRATEGY');
    }
    if (stage === 'FEEL') {
      return withBook({ stage, reason: 'Your project is at the feeling stage — clarity comes first.' }, 'VISION_SESSION');
    }
    if (stage === 'SHAPE') {
      return withBook({ stage, reason: 'Your idea is ready to become a structured project.' }, 'PROJECT_DEVELOPMENT');
    }
    if (stage === 'CONNECT') {
      return withBook({ stage, reason: 'Connections are the next step — people, spaces, resources.' }, 'CONNECTION_SUPPORT');
    }
    if (stage === 'BUILD' || stage === 'EXPERIENCE') {
      return withBook({ stage, reason: 'Production and execution need a clear plan.' }, 'PRODUCTION');
    }
    return withBook({ stage, reason: 'A development session helps define your next move.' }, 'PROJECT_DEVELOPMENT');
  }

  function stageIndex(name) {
    const stages = window.KYH_CONFIG?.stages || [];
    return Math.max(0, stages.indexOf(name));
  }

  window.KYHRecommendations = {
    computeStage,
    recommend,
    stageIndex,
    get SERVICES() {
      return window.KYHServices?.CATALOG || [];
    },
  };
})();
