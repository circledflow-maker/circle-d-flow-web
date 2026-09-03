/**
 * Kiss Your Heart — runtime config (Vercel-safe root paths)
 */
(function () {
  const BASE = '/pages/kyh';

  function url(path) {
    if (!path || path === '/') return BASE;
    const clean = String(path).replace(/^\//, '').replace(/\.html$/, '');
    return `${BASE}/${clean}`.replace(/\/+/g, '/');
  }

  function asset(path) {
    return `/Assets/${String(path || '').replace(/^\//, '')}`;
  }

  window.KYH = { base: BASE, url, asset };

  window.KYH_CONFIG = {
    basePath: BASE,
    url,
    asset,
    brand: {
      name: 'Kiss Your Heart',
      descriptor: 'Creative Project Management',
      tagline: 'Ideas deserve to become experiences.',
      secondaryTagline: 'Bring the idea. We build the path together.',
      motto: 'when you intrinsically make the effort.',
      lxSignature: 'Kiss Your Heart LX',
    },
    storageRoot: 'D:/KissYourHeart',
    paths: {
      brand: 'D:/KissYourHeart/public/brand',
      artists: 'D:/KissYourHeart/public/artists',
      locations: 'D:/KissYourHeart/public/locations',
      projects: 'D:/KissYourHeart/public/projects',
      experiences: 'D:/KissYourHeart/public/experiences',
      data: 'D:/KissYourHeart/data',
    },
    brandLogo: asset('kyh/brand/kiss-your-heart-logo.png'),
    floweeAvatar: asset('images/flowee.svg'),
    floweeEnabled: true,
    nav: [
      { label: 'Create', href: url('create'), slug: 'create' },
      { label: 'Experiences', href: url('experiences'), slug: 'experiences' },
      { label: 'Journey', href: url('journey'), slug: 'journey' },
      { label: 'Support', href: url('support'), slug: 'support' },
      { label: 'About', href: url('about'), slug: 'about' },
    ],
    cta: {
      primary: { label: 'Start Your Project', href: url('create/project-builder') },
      secondary: { label: 'Book a Session', href: url('book') },
    },
    routes: {
      dashboard: url('dashboard'),
      feedback: url('feedback'),
      briefing: url('create/project-map'),
    },
    stages: ['FEEL', 'SHAPE', 'CONNECT', 'BUILD', 'EXPERIENCE', 'SHARE'],
    stageQuestions: {
      FEEL: 'What is in your heart?',
      SHAPE: 'What does your idea need?',
      CONNECT: 'Who needs to be involved?',
      BUILD: 'How do we make it happen?',
      EXPERIENCE: 'What should people experience?',
      SHARE: 'What remains after the experience?',
    },
    projectTypes: [
      { id: 'EXHIBITION', label: 'Exhibition' },
      { id: 'WORKSHOP', label: 'Workshop' },
      { id: 'CONCERT', label: 'Concert' },
      { id: 'PERFORMANCE', label: 'Live Performance' },
      { id: 'COMMUNITY_EVENT', label: 'Community Event' },
      { id: 'FESTIVAL', label: 'Festival' },
      { id: 'POP_UP', label: 'Pop-up' },
      { id: 'MARKET', label: 'Market' },
      { id: 'RESIDENCY', label: 'Residency' },
      { id: 'CULTURAL_PROGRAM', label: 'Cultural Program' },
      { id: 'CREATIVE_COLLABORATION', label: 'Creative Collaboration' },
      { id: 'OTHER', label: 'Other' },
    ],
    resources: [
      { id: 'IDEA', label: 'Idea' },
      { id: 'CONCEPT', label: 'Concept' },
      { id: 'ARTISTS', label: 'Artists' },
      { id: 'VENUE', label: 'Venue' },
      { id: 'TEAM', label: 'Team' },
      { id: 'AUDIENCE', label: 'Audience' },
      { id: 'BUDGET', label: 'Budget' },
      { id: 'SPONSOR', label: 'Sponsor' },
      { id: 'PARTNER', label: 'Partner' },
      { id: 'EQUIPMENT', label: 'Equipment' },
      { id: 'FUNDING', label: 'Funding' },
      { id: 'MARKETING', label: 'Marketing' },
      { id: 'DOCUMENTATION', label: 'Documentation' },
    ],
    needs: [
      { id: 'VISION', label: 'Vision' },
      { id: 'CONCEPT', label: 'Concept' },
      { id: 'PROJECT_STRUCTURE', label: 'Project Structure' },
      { id: 'PROJECT_MANAGEMENT', label: 'Project Management' },
      { id: 'ARTISTS', label: 'Artists' },
      { id: 'VENUE', label: 'Venue' },
      { id: 'SPONSORS', label: 'Sponsors' },
      { id: 'FUNDING', label: 'Funding' },
      { id: 'PARTNERS', label: 'Partners' },
      { id: 'PRODUCTION', label: 'Production' },
      { id: 'MARKETING', label: 'Marketing' },
      { id: 'DOCUMENTATION', label: 'Documentation' },
      { id: 'COMMUNITY', label: 'Community' },
      { id: 'FULL_PROJECT_MANAGEMENT', label: 'Full Project Management' },
    ],
    locations: [
      { id: 'LISBON', label: 'Lisbon' },
      { id: 'PORTUGAL', label: 'Portugal' },
      { id: 'EUROPE', label: 'Europe' },
      { id: 'INTERNATIONAL', label: 'International' },
      { id: 'REMOTE', label: 'Remote / Hybrid' },
      { id: 'OTHER', label: 'Other' },
    ],
    maturity: [
      { id: 'IDEA', label: 'Just an idea' },
      { id: 'EARLY', label: 'Early concept' },
      { id: 'CONCEPT_READY', label: 'Concept ready' },
      { id: 'TEAM', label: 'Team forming' },
      { id: 'VENUE', label: 'Venue confirmed' },
      { id: 'ARTISTS', label: 'Artists confirmed' },
      { id: 'PRODUCTION', label: 'Production underway' },
      { id: 'ALMOST', label: 'Almost ready' },
    ],
    css: '/css/kyh-design-system.css',
    draftKey: 'kyh_project_draft',
  };
})();
