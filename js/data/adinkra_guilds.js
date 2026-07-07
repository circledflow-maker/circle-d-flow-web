/**
 * Adinkra Guilds — determined by collected symbol affinities
 */
window.ADINKRA_GUILDS = {
  heart: {
    id: 'heart',
    name: 'Gilde des Herzens',
    nameEn: 'Guild of the Heart',
    motto: 'Community pillars — love, unity, cooperation',
    symbols: ['akoma', 'sankofa', 'abusua_pa', 'fihankra', 'boa_me', 'funtunfunefu', 'nkonsonkonson', 'kokuromotie', 'kuronti_ne_akwamu', 'nnamfo_pa_baanu', 'nteasee', 'bi_nka_bi', 'wo_nsa_da_mu_a'],
    minSymbols: 3,
    reward: { karma: 25, flow: 10 },
  },
  creator: {
    id: 'creator',
    name: 'Gilde der Schöpfer',
    nameEn: 'Guild of Creators',
    motto: 'Craft, web, precision — the art of making',
    symbols: ['fafanto', 'ananse_ntentan', 'nkyemu', 'dame_dame', 'mframadan', 'nsaa', 'hwe_mu_dua'],
    minSymbols: 3,
    reward: { karma: 15, flow: 20 },
  },
  flow: {
    id: 'flow',
    name: 'Gilde des Flows',
    nameEn: 'Guild of Flow',
    motto: 'Earth, patience, persistence — the natural rhythm',
    symbols: ['adwo', 'asase_ye_duru', 'aya', 'ani_bere_a_enso_gya', 'tabono'],
    minSymbols: 2,
    reward: { karma: 10, flow: 15 },
  },
  scholar: {
    id: 'scholar',
    name: 'Gilde der Weisheit',
    nameEn: 'Guild of Wisdom',
    motto: 'Learning, listening, knots of insight',
    symbols: ['nea_onnim', 'mate_masie', 'nyansapo', 'nyame_biri_biri', 'gye_nyame'],
    minSymbols: 2,
    reward: { karma: 20, flow: 10 },
  },
  spirit: {
    id: 'spirit',
    name: 'Gilde der Seele',
    nameEn: 'Guild of the Soul',
    motto: 'Spiritual purity and cosmic faith',
    symbols: ['sunsum', 'gye_nyame', 'nyame_dua', 'som_onyankopon'],
    minSymbols: 2,
    reward: { karma: 30, flow: 5 },
  },
};

window.computeAdinkraGuild = function (collection) {
  const owned = Object.keys(collection || {});
  let best = null;
  let bestScore = 0;
  Object.values(window.ADINKRA_GUILDS || {}).forEach((g) => {
    const score = g.symbols.filter((id) => owned.includes(id)).length;
    if (score >= g.minSymbols && score > bestScore) {
      best = g;
      bestScore = score;
    }
  });
  return best;
};
