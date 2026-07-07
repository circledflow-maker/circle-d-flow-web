/**
 * Coop Bar — roles & core crew (KyheartLx, Naru, C-riz)
 */
window.COOP_ROLES = [
  { id: 'coordinator', label: 'Coordinator / Producer', icon: 'hub', required: true, desc: 'Timeline, budget, crew sync' },
  { id: 'creative_director', label: 'Creative Director', icon: 'palette', required: false, desc: 'Vision, mood, artistic direction' },
  { id: 'host', label: 'Host / MC', icon: 'mic', required: false, desc: 'Runs the room and energy' },
  { id: 'audio_engineer', label: 'Audio Engineer', icon: 'graphic_eq', required: false, desc: 'Tiny Desk sound, levels, recording' },
  { id: 'dop', label: 'DoP / Camera', icon: 'videocam', required: false, desc: 'Cinematic capture, framing' },
  { id: 'photographer', label: 'Photographer', icon: 'photo_camera', required: false, desc: 'Still images, BTS stills' },
  { id: 'streamer', label: 'Streamer / Live Ops', icon: 'live_tv', required: false, desc: 'Stream setup, OBS, live routing' },
  { id: 'guest_relations', label: 'Guest Relations', icon: 'groups', required: false, desc: 'Guestlist, invites, arrivals' },
  { id: 'location_scout', label: 'Location Scout', icon: 'location_on', required: false, desc: 'Venue checks, permits, Plan B' },
  { id: 'social_bts', label: 'Social Media BTS', icon: 'share', required: false, desc: 'Reels, stories, posting rhythm' },
  { id: 'graphic_design', label: 'Graphic Design', icon: 'brush', required: false, desc: 'Flyers, overlays, branding' },
  { id: 'fashion_stylist', label: 'Fashion / Styling', icon: 'checkroom', required: false, desc: 'Looks, wardrobe, set dress' },
  { id: 'philosopher', label: 'Philosopher / Narrative', icon: 'menu_book', required: false, desc: 'Themes, captions, spoken word arc' },
  { id: 'cleanup', label: 'Cleanup Crew', icon: 'cleaning_services', required: false, desc: 'Strike, trash, venue restore' },
  { id: 'plan_b_lead', label: 'Plan B Lead', icon: 'umbrella', required: true, desc: 'Rain backup, alternate location' },
];

window.COOP_CORE_CREW = [
  {
    id: 'kyheart',
    name: 'KyheartLx',
    avatar: '../Assets/images/logo.png',
    tags: ['Coordinator', 'Photographer', 'Host'],
    defaultRoles: ['coordinator', 'photographer', 'host'],
    strengths: 'Event coordination, photography, Lisbon network',
  },
  {
    id: 'naru',
    name: 'Naru',
    avatar: '../Assets/images/logo.png',
    tags: ['Visionary', 'Multi-Artist', 'Rapper', 'Streamer', 'Fashion'],
    defaultRoles: ['creative_director', 'streamer', 'fashion_stylist', 'host'],
    strengths: 'Vision, performance, stream, fashion design',
  },
  {
    id: 'criz',
    name: 'C-riz',
    avatar: '../Assets/images/logo.png',
    tags: ['Rapper', 'Philosopher'],
    defaultRoles: ['host', 'philosopher', 'audio_engineer'],
    strengths: 'Lyrics, philosophy, mic presence',
  },
];

window.getCoopRole = function (id) {
  return (window.COOP_ROLES || []).find((r) => r.id === id) || null;
};
