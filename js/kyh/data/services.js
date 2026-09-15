/**
 * Kiss Your Heart — canonical service catalog (Phase 5)
 */
(function () {
  const CATALOG = [
    {
      id: 'VISION_SESSION',
      slug: 'vision-session',
      title: 'Vision Session',
      description: 'Clarify intention, impact, and the heart of your project.',
      ctaLabel: 'Book a Vision Session',
      duration: '60 min',
      tier: 'from €120',
      bookingType: 'creative',
      bookingNote: 'KYH Vision Session — clarify intention and impact.',
      featured: true,
    },
    {
      id: 'PROJECT_DEVELOPMENT',
      slug: 'project-development',
      title: 'Project Development Session',
      description: 'Turn your idea into a defined project with objectives, timeline, and scale.',
      ctaLabel: 'Book Project Development',
      duration: '90 min',
      tier: 'from €180',
      bookingType: 'creative',
      bookingNote: 'KYH Project Development — structure, timeline, and next steps.',
      featured: true,
    },
    {
      id: 'CREATIVE_CONSULTATION',
      slug: 'creative-consultation',
      title: 'Creative Consultation',
      description: 'Focused advice on format, audience, and creative direction.',
      ctaLabel: 'Book Consultation',
      duration: '45 min',
      tier: 'from €90',
      bookingType: 'creative',
      bookingNote: 'KYH Creative Consultation — format and direction.',
    },
    {
      id: 'CONNECTION_SUPPORT',
      slug: 'connection-support',
      title: 'Connection Support',
      description: 'Identify artists, venues, partners, and sponsors your project needs.',
      ctaLabel: 'Book Connection Support',
      duration: '60 min',
      tier: 'from €150',
      bookingType: 'creative',
      bookingNote: 'KYH Connection Support — people, spaces, and partners.',
    },
    {
      id: 'PRODUCTION',
      slug: 'production-consultation',
      title: 'Production Consultation',
      description: 'Plan production, responsibilities, and execution requirements.',
      ctaLabel: 'Book Production Consultation',
      duration: '90 min',
      tier: 'from €200',
      bookingType: 'creative',
      bookingNote: 'KYH Production Consultation — execution plan.',
    },
    {
      id: 'SPONSOR_STRATEGY',
      slug: 'sponsor-strategy',
      title: 'Sponsor Strategy',
      description: 'Develop funding pathways and sponsor alignment for your project.',
      ctaLabel: 'Book Sponsor Strategy',
      duration: '60 min',
      tier: 'from €160',
      bookingType: 'branding',
      bookingNote: 'KYH Sponsor Strategy — funding and alignment.',
    },
    {
      id: 'FULL_JOURNEY',
      slug: 'full-journey',
      title: 'The Full Journey',
      description: 'From first idea to final experience — Feel through Share, fully supported.',
      ctaLabel: 'Book the Full Journey',
      duration: 'Multi-session',
      tier: 'custom quote',
      bookingType: 'creative',
      bookingNote: 'KYH Full Journey — Feel → Shape → Connect → Build → Experience → Share.',
      featured: true,
      primary: true,
    },
  ];

  function getById(id) {
    return CATALOG.find((s) => s.id === id) || null;
  }

  function getBySlug(slug) {
    const key = String(slug || '').toLowerCase();
    return CATALOG.find((s) => s.slug === key || s.id === key.toUpperCase().replace(/-/g, '_')) || null;
  }

  function bookHref(idOrSlug) {
    const svc = typeof idOrSlug === 'string' ? getBySlug(idOrSlug) || getById(idOrSlug) : null;
    const slug = svc?.slug || String(idOrSlug || '').toLowerCase();
    return `/pages/booking?source=kyh&service=${encodeURIComponent(slug)}`;
  }

  function kyhBookHref(idOrSlug) {
    const svc = typeof idOrSlug === 'string' ? getBySlug(idOrSlug) || getById(idOrSlug) : null;
    const slug = svc?.slug || String(idOrSlug || '').toLowerCase();
    return `/pages/kyh/book?service=${encodeURIComponent(slug)}`;
  }

  window.KYHServices = {
    CATALOG,
    getById,
    getBySlug,
    bookHref,
    kyhBookHref,
    featured: () => CATALOG.filter((s) => s.featured),
  };
})();
