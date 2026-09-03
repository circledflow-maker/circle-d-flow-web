/**
 * Kiss Your Heart — Project Intelligence Engine
 * Analyses draft → venues, artists, benefits, risks, pay model, marketing, gaps
 */
(function () {
  const ARTISTS = [
    { id: 'kyheart', name: 'KyheartLx / Hope', roles: ['Coordinator', 'Photographer', 'Host'], fit: ['EXHIBITION', 'COMMUNITY_EVENT', 'WORKSHOP', 'CONCERT', 'PERFORMANCE', 'CULTURAL_PROGRAM'], strength: 'Lisbon network, photography, project coordination, flow culture' },
    { id: 'naru', name: 'Naru', roles: ['Creative Director', 'Performer', 'Streamer'], fit: ['CONCERT', 'PERFORMANCE', 'FESTIVAL', 'POP_UP', 'CREATIVE_COLLABORATION'], strength: 'Vision, performance energy, fashion, live stream' },
    { id: 'criz', name: 'C-riz', roles: ['Host', 'Philosopher', 'Audio'], fit: ['CONCERT', 'PERFORMANCE', 'COMMUNITY_EVENT', 'WORKSHOP'], strength: 'Lyrics, philosophy, mic presence' },
    { id: 'lapa_crew', name: 'Lapa 71 Artists (Tagus Drop)', roles: ['Musicians', 'Live Jam'], fit: ['CONCERT', 'COMMUNITY_EVENT', 'FESTIVAL', 'PERFORMANCE'], strength: 'Live rhythm sessions, multi-artist jam format' },
    { id: 'doc_team', name: 'Circle D Stages Team', roles: ['Video', 'Documentation'], fit: ['CONCERT', 'PERFORMANCE', 'FESTIVAL', 'COMMUNITY_EVENT', 'EXHIBITION'], strength: 'Stages cuts, artist packages, social-ready content' },
  ];

  const PAY_MODELS = [
    { id: 'vision', label: 'Vision Session', range: 'from €120', desc: 'Clarify intention, scope, and first structure.' },
    { id: 'development', label: 'Project Development', range: 'from €350', desc: 'Full shape + connect plan with timeline and roles.' },
    { id: 'production', label: 'Production Day', range: 'from €800', desc: 'On-site coordination, capture, and execution support.' },
    { id: 'full_journey', label: 'Full Journey', range: 'custom', desc: 'Feel → Share — end-to-end Creative Project Management.' },
    { id: 'documentation', label: 'Documentation Package', range: 'from €450', desc: 'Photo + video + Stages edit + social assets.' },
    { id: 'sponsor', label: 'Sponsor Alignment', range: 'partnership', desc: 'Funding pathways and brand-cultural fit.' },
  ];

  const MARKETING_FLOW = [
    { stage: 'FEEL', action: 'Capture the story — vision statement, mood, why now.' },
    { stage: 'SHAPE', action: 'Project one-pager — date, place, artists, audience promise.' },
    { stage: 'CONNECT', action: 'Announce collaborators — artists, venue, partners.' },
    { stage: 'BUILD', action: 'Teaser content — BTS, countdown, save-the-date.' },
    { stage: 'EXPERIENCE', action: 'Live coverage — stories, community energy, real-time posts.' },
    { stage: 'SHARE', action: 'Stages cuts, feedback session, case study, next invitation.' },
  ];

  function venues() {
    if (typeof window.getAllVenues === 'function') return window.getAllVenues();
    return [];
  }

  function venueFilters(types) {
    const t = types || [];
    if (t.includes('CONCERT') || t.includes('PERFORMANCE')) return ['sound', 'sanctuary'];
    if (t.includes('EXHIBITION') || t.includes('WORKSHOP')) return ['vision', 'sanctuary'];
    if (t.includes('COMMUNITY_EVENT') || t.includes('FESTIVAL')) return ['sound', 'vision', 'sanctuary'];
    if (t.includes('MARKET') || t.includes('POP_UP')) return ['kitchen', 'vision'];
    return ['vision', 'sound'];
  }

  function matchVenues(project) {
    const filters = venueFilters(project.projectTypes);
    const loc = project.location || 'LISBON';
    let list = venues().filter((v) => (v.filter || []).some((f) => filters.includes(f)));
    if (loc === 'PORTUGAL' || loc === 'EUROPE') list = list.slice(0, 8);
    else list = list.slice(0, 5);
    return list.map((v) => ({
      id: v.id,
      name: v.name,
      vibe: v.vibe || '',
      fitReason: filters.includes('sound') && (v.filter || []).includes('sound')
        ? 'Strong for live sound and community energy.'
        : 'Visual and cultural atmosphere fits your format.',
    }));
  }

  function matchArtists(project) {
    const types = project.projectTypes || [];
    return ARTISTS.filter((a) => a.fit.some((f) => types.includes(f))).slice(0, 4);
  }

  function projectConcept(project) {
    const types = (project.projectTypes || []).map((id) =>
      (window.KYH_CONFIG?.projectTypes || []).find((t) => t.id === id)?.label || id
    );
    const loc = project.location === 'LISBON' ? 'Lisbon' : project.location || 'Lisbon';
    const when = project.whenDetail || project.whenType || 'flexible timing';
    const title = types.join(' + ') || 'Creative Experience';
    return {
      headline: `${title} in ${loc}`,
      pitch: project.vision
        ? project.vision.slice(0, 280)
        : `A ${title.toLowerCase()} connecting community, culture, and real experience — ${when}.`,
      format: `${title} · ${loc} · ${when}`,
    };
  }

  function benefits(project) {
    const b = [];
    const has = project.resources || [];
    if (project.vision) b.push('Clear emotional intention — the heart of the project is defined.');
    if (has.includes('IDEA') || has.includes('CONCEPT')) b.push('Strong conceptual foundation to build on.');
    if (has.includes('ARTISTS')) b.push('Artists already in the picture — faster to production.');
    if (has.includes('VENUE')) b.push('Space secured — major production risk reduced.');
    if (has.includes('BUDGET') || has.includes('FUNDING')) b.push('Financial pathway started — sponsors or budget in play.');
    if (has.includes('MARKETING')) b.push('Communication momentum already exists.');
    if (locLisbon(project)) b.push('Lisbon ecosystem — Secret Garden, Hempy Roots, underground venues, and Circle D network.');
    if (!b.length) b.push('Fresh start — maximum creative freedom to shape the experience together.');
    return b;
  }

  function locLisbon(p) {
    return !p.location || p.location === 'LISBON' || p.location === 'PORTUGAL';
  }

  function risks(project) {
    const r = [];
    const has = project.resources || [];
    const needs = project.needs || [];
    if (!has.includes('VENUE') && needs.includes('VENUE')) r.push({ level: 'high', text: 'No venue confirmed — date and audience capacity remain open.' });
    if (!has.includes('BUDGET') && (needs.includes('FUNDING') || needs.includes('SPONSORS'))) r.push({ level: 'medium', text: 'Funding not secured — production scale may need phasing.' });
    if (!has.includes('TEAM') && needs.includes('PROJECT_MANAGEMENT')) r.push({ level: 'medium', text: 'No core team yet — coordination load falls on project owner.' });
    if (project.maturity === 'IDEA') r.push({ level: 'low', text: 'Early stage — timeline and scope still flexible (this is also a strength).' });
    if (project.whenType === 'UNDECIDED') r.push({ level: 'low', text: 'Date open — harder to book artists and venues until fixed.' });
    if (!r.length) r.push({ level: 'low', text: 'Main risk is scope creep — keep the core experience focused.' });
    return r;
  }

  function gaps(project) {
    const has = new Set(project.resources || []);
    const needLabels = window.KYH_CONFIG?.needs || [];
    return (project.needs || [])
      .filter((n) => !has.has(n))
      .map((id) => {
        const label = needLabels.find((x) => x.id === id)?.label || id;
        let action = `Book support for ${label.toLowerCase()}.`;
        if (id === 'VENUE') action = 'Connection Support — we match Supported Spaces in Lisbon.';
        if (id === 'DOCUMENTATION') action = 'Documentation Package — Stages cuts + photo for Share phase.';
        if (id === 'FULL_PROJECT_MANAGEMENT') action = 'Full Journey — Feel through Share with Kiss Your Heart.';
        return { id, label, action };
      });
  }

  function suggestPayModel(project) {
    const needs = project.needs || [];
    if (needs.includes('FULL_PROJECT_MANAGEMENT')) return PAY_MODELS.find((p) => p.id === 'full_journey');
    if (needs.includes('PRODUCTION')) return PAY_MODELS.find((p) => p.id === 'production');
    if (needs.includes('DOCUMENTATION')) return PAY_MODELS.find((p) => p.id === 'documentation');
    if (needs.includes('SPONSORS') || needs.includes('FUNDING')) return PAY_MODELS.find((p) => p.id === 'sponsor');
    if (project.maturity === 'IDEA' || project.maturity === 'EARLY') return PAY_MODELS.find((p) => p.id === 'vision');
    return PAY_MODELS.find((p) => p.id === 'development');
  }

  function analyse(project) {
    const stage = window.KYHRecommendations?.computeStage(project) || 'SHAPE';
    const recommendation = window.KYHRecommendations?.recommend(project) || {};
    return {
      stage,
      recommendation,
      concept: projectConcept(project),
      venues: matchVenues(project),
      artists: matchArtists(project),
      benefits: benefits(project),
      risks: risks(project),
      gaps: gaps(project),
      payModel: suggestPayModel(project),
      payOptions: PAY_MODELS,
      marketingFlow: MARKETING_FLOW,
      teamRoles: suggestTeamRoles(project),
    };
  }

  function suggestTeamRoles(project) {
    const types = project.projectTypes || [];
    const roles = ['coordinator'];
    if (types.some((t) => ['CONCERT', 'PERFORMANCE', 'FESTIVAL'].includes(t))) roles.push('audio_engineer', 'dop', 'photographer');
    if (types.includes('EXHIBITION')) roles.push('photographer', 'creative_director');
    if (project.needs?.includes('MARKETING')) roles.push('social_bts', 'graphic_design');
    return (window.COOP_ROLES || []).filter((r) => roles.includes(r.id));
  }

  function saveProject(draft, analysis) {
    const id = draft.id || `kyh-${Date.now().toString(36)}`;
    const record = { ...draft, id, analysis, updatedAt: new Date().toISOString() };
    let list = [];
    try { list = JSON.parse(localStorage.getItem('kyh_projects') || '[]'); } catch { list = []; }
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    localStorage.setItem('kyh_projects', JSON.stringify(list));
    sessionStorage.setItem(window.KYH_CONFIG?.draftKey || 'kyh_project_draft', JSON.stringify({ ...draft, id, analysis }));
    return id;
  }

  window.KYHIntelligence = { analyse, saveProject, PAY_MODELS, MARKETING_FLOW };
})();
