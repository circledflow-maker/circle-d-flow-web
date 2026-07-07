/**
 * Lisbon Atlas — venues with Adinkra runes, filters, fog-of-war
 */
window.LISBON_VENUES = {
  community: [
    { id: 'secret_garden_lx', name: 'Secret Garden LX', lat: 38.7200, lng: -9.1450, zone: 'community', filter: ['sound', 'vision', 'sanctuary'], rune: 'boa_me', runeName: 'Boa Me Na Me Mmoa Wo', stepsReveal: 0, vibe: 'Hidden garden courtyard — palms, jam, C4C' },
    { id: 'akwabalx_kitchen', name: 'AkwabaLX Kitchen Bar', lat: 38.72005, lng: -9.14495, zone: 'community', filter: ['kitchen', 'sanctuary'], rune: 'akoma', runeName: 'Akoma', stepsReveal: 0, vibe: 'First live kitchen — pickup at bar', kitchenPage: 'akwaba_kitchen.html' },
    { id: 'sg_calçada_norte', name: 'Calçada do Jardim (N)', lat: 38.72025, lng: -9.14520, zone: 'community', filter: ['vision'], rune: 'aya', runeName: 'Aya', stepsReveal: 200, vibe: 'Cobble lane north of garden' },
    { id: 'sg_calçada_sul', name: 'Calçada do Jardim (S)', lat: 38.71975, lng: -9.14480, zone: 'community', filter: ['vision'], rune: 'aya', runeName: 'Aya', stepsReveal: 200, vibe: 'Cobble lane south — palm alley' },
    { id: 'sg_patio_palms', name: 'Patio das Palmeiras', lat: 38.71990, lng: -9.14530, zone: 'community', filter: ['sanctuary', 'vision'], rune: 'fihankra', runeName: 'Fihankra', stepsReveal: 100, vibe: 'Palm circle & shade' },
    { id: 'hempy_roots', name: 'Hempy Roots Lisboa', lat: 38.7155, lng: -9.1420, zone: 'community', filter: ['sound'], rune: 'akoben', runeName: 'Akoben', stepsReveal: 800, vibe: 'Intimate listening parties' },
    { id: 'village_underground', name: 'Village Underground', lat: 38.7045, lng: -9.1680, zone: 'community', filter: ['sound', 'vision'], rune: 'ananse', runeName: 'Ananse Ntontan', stepsReveal: 1200, vibe: 'Urban art in shipping containers' },
    { id: 'fabrica_braco', name: 'Fábrica Braço de Prata', lat: 38.7440, lng: -9.1060, zone: 'community', filter: ['sound', 'vision'], rune: 'nkyinkyim', runeName: 'Nkyinkyim', stepsReveal: 2000, vibe: 'Labyrinth art centre' },
    { id: 'live_1399', name: '1399 Live Art Room', lat: 38.7080, lng: -9.1550, zone: 'community', filter: ['sound'], rune: 'mmusuyidee', runeName: 'Mmusuyidee', stepsReveal: 1500, vibe: 'Live culture room' },
    { id: 'bota', name: 'Bota', lat: 38.7065, lng: -9.1750, zone: 'community', filter: ['sound'], rune: 'akofena', runeName: 'Akofena', stepsReveal: 1800, vibe: 'Underground live sets' },
  ],
  vibe: [
    { id: 'casa_mocambo', name: 'Casa Mocambo', lat: 38.7140, lng: -9.1380, zone: 'vibe', filter: ['kitchen', 'vision'], rune: 'bese_saka', runeName: 'Bese Saka', stepsReveal: 600, vibe: 'African roots & AkwabaLX connection' },
    { id: 'parque_rooftop', name: 'Parque Rooftop', lat: 38.7070, lng: -9.1450, zone: 'vibe', filter: ['sound'], rune: 'akoben', runeName: 'Akoben', stepsReveal: 1000, vibe: 'DJ sets & skyline' },
    { id: 'botanica', name: 'Botanica', lat: 38.7125, lng: -9.1470, zone: 'vibe', filter: ['vision'], rune: 'osram', runeName: 'Osram Ne Nsoromma', stepsReveal: 900, vibe: 'Visual art aesthetic' },
    { id: 'ribeira_naus', name: 'Ribeira das Naus', lat: 38.7075, lng: -9.1370, zone: 'flow', filter: ['vision'], rune: 'asase_ye_duru', runeName: 'Asase Ye Duru', stepsReveal: 400, vibe: 'Golden shore — Tagus flow zone' },
  ],
  miradouros: [
    { id: 'mir_senhora_monte', name: 'Miradouro da Senhora do Monte', lat: 38.7193, lng: -9.1339, zone: 'high_flow', filter: ['vision'], rune: 'asase_ye_duru', runeName: 'Asase Ye Duru', stepsReveal: 500 },
    { id: 'mir_graca', name: 'Miradouro da Graça', lat: 38.7167, lng: -9.1315, zone: 'high_flow', filter: ['vision'], rune: 'asase_ye_duru', runeName: 'Asase Ye Duru', stepsReveal: 700 },
    { id: 'mir_santa_catarina', name: 'Miradouro Santa Catarina', lat: 38.7120, lng: -9.1465, zone: 'high_flow', filter: ['sound', 'vision'], rune: 'akoma', runeName: 'Akoma', stepsReveal: 600, vibe: 'Street musicians meet here' },
    { id: 'malingua', name: 'Malingua (near Senhora do Monte)', lat: 38.7198, lng: -9.1345, zone: 'high_flow', filter: ['vision', 'sound'], rune: 'aya', runeName: 'Aya', stepsReveal: 550, vibe: 'Sunset sessions' },
  ],
  parks: [
    { id: 'jardim_torel', name: 'Jardim do Torel', lat: 38.7205, lng: -9.1445, zone: 'grounding', filter: ['vision'], rune: 'asase_ye_duru', runeName: 'Asase Ye Duru', stepsReveal: 300 },
    { id: 'jardim_estrela', name: 'Jardim da Estrela', lat: 38.7158, lng: -9.1595, zone: 'grounding', filter: ['vision'], rune: 'fihankra', runeName: 'Fihankra', stepsReveal: 800 },
  ],
  historic: [
    { id: 'carmo', name: 'Convento do Carmo', lat: 38.7121, lng: -9.1405, zone: 'cultural', filter: ['vision'], rune: 'sankofa', runeName: 'Sankofa', stepsReveal: 500 },
    { id: 'lx_factory', name: 'LX Factory', lat: 38.7037, lng: -9.1782, zone: 'creative', filter: ['vision', 'sound'], rune: 'nkyinkyim', runeName: 'Nkyinkyim', stepsReveal: 1000 },
    { id: 'praca_comercio', name: 'Praça do Comércio', lat: 38.7078, lng: -9.1366, zone: 'cultural', filter: ['vision'], rune: 'osram', runeName: 'Osram Ne Nsoromma', stepsReveal: 200 },
  ],
};

window.getAllVenues = function () {
  return Object.values(window.LISBON_VENUES).flat();
};

window.LEVEL_UNLOCKS = {
  2: { feature: 'Museum Symbol I', desc: 'Akoma — your first Adinkra exhibit in the Palast Museum.' },
  5: { feature: 'Place Cinema', desc: 'View community uploads at locations remotely.' },
  10: { feature: 'Battlefield Vote', desc: 'Vote in weekly content contests. Silver museum tier.' },
  14: { feature: 'Flow Companion', desc: 'Adwo — Nature Cycle day 14 unlocked in Museum.' },
  20: { feature: 'Netzwerker Request', desc: 'Request a KissYourHeartLx shooting session. Gold museum tier.' },
  28: { feature: 'Nyansapo Crown', desc: 'Full 28-day Nature Cycle complete in Museum.' },
};
