/**
 * Adinkra Challenges — community tasks that unlock glossar symbols
 */
window.ADINKRA_CHALLENGES = [
  {
    id: 'flow_moment',
    title: 'Flow Moment',
    desc: 'Post or log a moment of complete calm — inner peace in Lisbon.',
    reward: { symbol: 'adwo', karma: 5, flow: 5 },
    guild: 'flow',
  },
  {
    id: 'street_art_hunt',
    title: 'Hidden Street Art',
    desc: 'Find a hidden piece of street art in Lisbon and mark it on the Atlas.',
    reward: { symbol: 'ananse_ntentan', karma: 8, flow: 10 },
    guild: 'creator',
  },
  {
    id: 'community_help',
    title: 'Mutual Aid',
    desc: 'Help a fellow Navigator or local business — cooperation in action.',
    reward: { symbol: 'boa_me', karma: 12, flow: 5 },
    guild: 'heart',
  },
  {
    id: 'tiny_desk_craft',
    title: 'Tiny Desk Standard',
    desc: 'Share a clip of hand-crafted quality — precision in your art.',
    reward: { symbol: 'nkyemu', karma: 6, flow: 12 },
    guild: 'creator',
  },
  {
    id: 'learn_portuguese',
    title: 'Nea Onnim Path',
    desc: 'Log a Portuguese learning session — lifelong growth.',
    reward: { symbol: 'nea_onnim', karma: 10, flow: 8 },
    guild: 'scholar',
  },
  {
    id: 'earth_walk',
    title: 'Asase Ye Duru Walk',
    desc: 'Walk a miradouro or park zone — honour Mother Earth in Lisbon.',
    reward: { symbol: 'asase_ye_duru', karma: 7, flow: 6 },
    guild: 'flow',
  },
];

window.getAdinkraChallenge = function (id) {
  return (window.ADINKRA_CHALLENGES || []).find((c) => c.id === id) || null;
};
