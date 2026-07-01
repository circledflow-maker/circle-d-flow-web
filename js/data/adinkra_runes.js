/**
 * Adinkra Rune Registry — collectible skills per Orbit sphere
 * @see http://www.adinkra.org/htmls/adinkra_index.htm
 */
window.ADINKRA_RUNES = {
  nexus: [
    { id: 'adinkrahene', name: 'Adinkrahene', sphere: 'SoulPass', skill: 'Leadership', unlock: 'profile_created' },
    { id: 'sesa_wo_suban', name: 'Sesa Wo Suban', sphere: 'SoulPass', skill: 'Transformation', unlock: 'avatar_update' },
    { id: 'nyansapo', name: 'Nyansapo', sphere: 'SoulPass', skill: 'Wisdom Knot', unlock: 'flow_level_5' },
    { id: 'gye_nyame', name: 'Gye Nyame', sphere: 'SoulPass', skill: 'Balance', unlock: 'flow_level_10' },
  ],
  battle: [
    { id: 'akofena', name: 'Akofena', sphere: 'Battleground', skill: 'Courage EXP boost', unlock: 'enter_colosseum' },
    { id: 'kwatakye_atiko', name: 'Kwatakye Atiko', sphere: 'Battleground', skill: 'First battle', unlock: 'battle_first' },
    { id: 'funtunfunefu', name: 'Funtunfunefu Denkyemfunefu', sphere: 'Battleground', skill: 'Unity collab', unlock: 'battle_collab' },
    { id: 'dame_dame', name: 'Dame-Dame', sphere: 'Battleground', skill: 'Tactical ingenuity', unlock: 'battle_win_3' },
  ],
  palast: [
    { id: 'hwe_mu_dua', name: 'Hwe Mu Dua', sphere: 'High Palast', skill: 'Tiny Desk cut unlock', unlock: 'museum_upload_5' },
    { id: 'nsaa', name: 'Nsaa', sphere: 'High Palast', skill: 'Authenticity', unlock: 'exhibit_featured' },
    { id: 'kintinkantan', name: 'Kintinkantan', sphere: 'High Palast', skill: 'Exhibition mastery', unlock: 'palast_level_3' },
    { id: 'nea_onnim', name: 'Nea Onnim', sphere: 'High Palast', skill: 'Lifelong learning', unlock: 'tutorial_shared' },
  ],
  bazaar: [
    { id: 'bese_saka', name: 'Bese Saka', sphere: 'Bazaar', skill: 'Abundance', unlock: 'first_sale' },
    { id: 'eban', name: 'Eban', sphere: 'Bazaar', skill: 'Secure trade', unlock: 'verified_stall' },
    { id: 'mpatapo', name: 'Mpatapo', sphere: 'Bazaar', skill: 'Reconciliation', unlock: 'dispute_resolved' },
    { id: 'bi_nka_bi', name: 'Bi Nka Bi', sphere: 'Bazaar', skill: 'Fair trade', unlock: 'community_market' },
  ],
  connect: [
    { id: 'boa_me', name: 'Boa Me Na Me Mmoa Wo', sphere: 'Connect', skill: 'Cooperation', unlock: 'c4c_invite' },
    { id: 'nkonsonnkonson', name: 'Nkonsonnkonson', sphere: 'Connect', skill: 'Chain links', unlock: 'referral_3' },
    { id: 'ese_ne_tekrema', name: 'Ese Ne Tekrema', sphere: 'Connect', skill: 'Friendship', unlock: 'collab_year' },
    { id: 'akoma_ntoso', name: 'Akoma Ntoso', sphere: 'Connect', skill: 'Linked hearts', unlock: 'team_dashboard' },
  ],
  map: [
    { id: 'asase_ye_duru', name: 'Asase Ye Duru', sphere: 'Map', skill: 'Earth divinity', unlock: 'scan_miradouro' },
    { id: 'sankofa', name: 'Sankofa', sphere: 'Map', skill: 'Archive throwback', unlock: 'scan_historic' },
    { id: 'nkyinkyim', name: 'Nkyinkyim', sphere: 'Map', skill: 'Alley explorer', unlock: 'scan_alfama' },
    { id: 'fihankra', name: 'Fihankra', sphere: 'Map', skill: 'Safe space', unlock: 'scan_community' },
  ],
  kitchen: [
    { id: 'akoma', name: 'Akoma', sphere: 'Kitchen', skill: 'Patience / Heart', unlock: 'akwaba_meal' },
    { id: 'duafe', name: 'Duafe', sphere: 'Kitchen', skill: 'Beauty', unlock: 'food_photo' },
    { id: 'wawa_aba', name: 'Wawa Aba', sphere: 'Kitchen', skill: 'Perseverance', unlock: 'complex_dish' },
  ],
  sound: [
    { id: 'akoben', name: 'Akoben', sphere: 'Sound', skill: 'Alert / new beat', unlock: 'sound_profile' },
    { id: 'akokonan', name: 'Akokonan', sphere: 'Sound', skill: 'Nurturing ambient', unlock: 'ambient_listen' },
    { id: 'mmusuyidee', name: 'Mmusuyidee', sphere: 'Sound', skill: 'Lucky sample drop', unlock: 'map_audio_find' },
  ],
  vision: [
    { id: 'aya', name: 'Aya', sphere: 'Vision', skill: 'Endurance', unlock: 'place_cinema_upload' },
    { id: 'osram', name: 'Osram Ne Nsoromma', sphere: 'Vision', skill: 'Light balance', unlock: 'golden_hour_photo' },
    { id: 'ananse', name: 'Ananse Ntontan', sphere: 'Vision', skill: 'Automation web', unlock: 'agent_pipeline' },
  ],
};

window.getAdinkraForSphere = function (sphereKey) {
  return window.ADINKRA_RUNES[sphereKey] || [];
};
