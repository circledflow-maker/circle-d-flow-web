/**
 * Coop Bar — 5-phase project pipeline
 */
window.COOP_PHASES = [
  {
    id: 1,
    key: 'vibe',
    title: 'Vibe Check',
    icon: 'local_bar',
    floweePrompt: 'What are we mixing tonight? Organic jam or social media capture?',
    reward: { exp: 25, trust: 5, flow: 5 },
  },
  {
    id: 2,
    key: 'crew',
    title: 'Crew & Roles',
    icon: 'groups',
    floweePrompt: 'Who holds which role? I will flag gaps in the crew.',
    reward: { exp: 35, trust: 8, flow: 5 },
  },
  {
    id: 3,
    key: 'logistics',
    title: 'Location · Guests · Gear',
    icon: 'inventory_2',
    floweePrompt: 'Pick the Lisbon spot, guestlist, and equipment pack.',
    reward: { exp: 40, trust: 10, flow: 10 },
  },
  {
    id: 4,
    key: 'calendar',
    title: 'Calendar & Plan B',
    icon: 'calendar_month',
    floweePrompt: 'Lock the date, backup location, and post-production follow-up.',
    reward: { exp: 30, trust: 8, flow: 8 },
  },
  {
    id: 5,
    key: 'brief',
    title: 'The Bon — Summary',
    icon: 'receipt_long',
    floweePrompt: 'I will seal the briefing. Everyone gets their tasks.',
    reward: { exp: 50, trust: 15, flow: 15 },
  },
];

window.COOP_PROJECT_TYPES = [
  { id: 'organic', label: 'Organic IRL', desc: 'Jam, garden session, live circle — presence first' },
  { id: 'social_media', label: 'Social Media', desc: 'Cypher, Tiny Desk, reels — capture first' },
];

window.COOP_SCALES = [
  { id: 'get_together', label: 'Get Together', desc: 'Intimate — core crew + close circle' },
  { id: 'bigger_event', label: 'Bigger Event', desc: 'Guests, sponsors, full production stack' },
];

window.COOP_ADINKRA_BY_VIBE = {
  organic: 'adwo',
  social_media: 'nkyemu',
  get_together: 'akoma',
  bigger_event: 'kokuromotie',
  default: 'boa_me',
};
