/**
 * KissYourHeartLx — 28 Nature Cycle (13 Moon + 15 Flow)
 * Maps to glossar numbers from adinkra.org index
 */
window.ADINKRA_NATURE_CYCLE = [
  { day: 1, id: 'akoma', glossar: 22, track: 'moon', guild: 'heart', label: 'Akoma', essence: 'Heart — love, patience, connection' },
  { day: 2, id: 'sankofa', glossar: 2, track: 'moon', guild: 'heart', label: 'Sankofa', essence: 'Learn from the past to build the future' },
  { day: 3, id: 'abusua_pa', glossar: 15, track: 'moon', guild: 'heart', label: 'Abusua Pa', essence: 'Good family — community support and unity' },
  { day: 4, id: 'fihankra', glossar: 46, track: 'moon', guild: 'heart', label: 'Fihankra', essence: 'Safe home — brotherhood and security' },
  { day: 5, id: 'boa_me', glossar: 33, track: 'moon', guild: 'heart', label: 'Boa Me Na Me Mmoa Wo', essence: 'Cooperation and mutual aid' },
  { day: 6, id: 'funtunfunefu', glossar: 6, track: 'moon', guild: 'heart', label: 'Funtumfunefu Denkyemfunefu', essence: 'Unity in diversity — shared destiny' },
  { day: 7, id: 'nkonsonkonson', glossar: 70, track: 'moon', guild: 'heart', label: 'Nkonsonkonson', essence: 'Chain of community solidarity' },
  { day: 8, id: 'kokuromotie', glossar: 52, track: 'moon', guild: 'heart', label: 'Kokuromotie', essence: 'Teamwork — every voice essential' },
  { day: 9, id: 'kuronti_ne_akwamu', glossar: 55, track: 'moon', guild: 'heart', label: 'Kuronti ne Akwamu', essence: 'Democracy, counsel, idea exchange' },
  { day: 10, id: 'nnamfo_pa_baanu', glossar: 74, track: 'moon', guild: 'heart', label: 'Nnamfo Pa Baanu', essence: 'True friendship and fellowship' },
  { day: 11, id: 'nteasee', glossar: 77, track: 'moon', guild: 'heart', label: 'Nteasee', essence: 'Deep mutual understanding' },
  { day: 12, id: 'bi_nka_bi', glossar: 32, track: 'moon', guild: 'heart', label: 'Bi Nka Bi', essence: 'Justice, peace, harmony, forgiveness' },
  { day: 13, id: 'wo_nsa_da_mu_a', glossar: 100, track: 'moon', guild: 'heart', label: 'Wo Nsa Da Mu A', essence: 'Participation and co-creation' },
  { day: 14, id: 'adwo', glossar: 16, track: 'flow', guild: 'flow', label: 'Adwo', essence: 'Calm — inner peace and Flow state' },
  { day: 15, id: 'asase_ye_duru', glossar: 28, track: 'flow', guild: 'flow', label: 'Asase Ye Duru', essence: 'Mother Earth — honour Lisbon locality' },
  { day: 16, id: 'fafanto', glossar: 44, track: 'flow', guild: 'creator', label: 'Fafanto', essence: 'Butterfly — tenderness and honesty of art' },
  { day: 17, id: 'ananse_ntentan', glossar: 23, track: 'flow', guild: 'creator', label: 'Ananse Ntentan', essence: 'Spider web — creativity and the weave of life' },
  { day: 18, id: 'nkyemu', glossar: 73, track: 'flow', guild: 'creator', label: 'Nkyemu', essence: 'Precision — Tiny Desk craft standard' },
  { day: 19, id: 'odo_nnyew_fie_kwan', glossar: 8, track: 'flow', guild: 'creator', label: 'Odo Nnyew Fie Kwan', essence: 'Love always finds its way home' },
  { day: 20, id: 'nea_onnim', glossar: 10, track: 'flow', guild: 'scholar', label: 'Nea Onnim', essence: 'Lifelong learning — your growing path' },
  { day: 21, id: 'dame_dame', glossar: 35, track: 'flow', guild: 'creator', label: 'Dame Dame', essence: 'Strategy and intelligence in craft' },
  { day: 22, id: 'aya', glossar: 30, track: 'flow', guild: 'flow', label: 'Aya', essence: 'Fern — endurance and independence' },
  { day: 23, id: 'ani_bere_a_enso_gya', glossar: 24, track: 'flow', guild: 'flow', label: 'Ani Bere A Enso Gya', essence: 'Patience and self-mastery' },
  { day: 24, id: 'mframadan', glossar: 62, track: 'flow', guild: 'creator', label: 'Mframadan', essence: 'Resilience in the creative process' },
  { day: 25, id: 'tabono', glossar: 96, track: 'flow', guild: 'flow', label: 'Tabono', essence: 'Oar — strength, trust, persistence' },
  { day: 26, id: 'sunsum', glossar: 95, track: 'flow', guild: 'spirit', label: 'Sunsum', essence: 'Spiritual purity of soul in art' },
  { day: 27, id: 'mate_masie', glossar: 59, track: 'flow', guild: 'scholar', label: 'Mate Masie', essence: 'Wisdom — listen and preserve what matters' },
  { day: 28, id: 'nyansapo', glossar: 83, track: 'flow', guild: 'scholar', label: 'Nyansapo', essence: 'Wisdom knot — genius in simplicity' },
];

window.getNatureCycleSymbol = function (dayIndex) {
  const d = Math.max(1, Math.min(28, dayIndex));
  return window.ADINKRA_NATURE_CYCLE.find((s) => s.day === d) || null;
};

window.getNatureCycleByLevel = function (level) {
  const lv = Math.max(2, parseInt(level, 10) || 2);
  const day = ((lv - 2) % 28) + 1;
  return window.getNatureCycleSymbol(day);
};

window.getLevelForCycleDay = function (day) {
  return Math.max(2, parseInt(day, 10) || 1) + 1;
};
