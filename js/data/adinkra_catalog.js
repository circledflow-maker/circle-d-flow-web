/**
 * Adinkra Catalog — Circle D Flow edition
 * Based on http://www.adinkra.org/htmls/adinkra_index.htm
 */
window.ADINKRA_CATALOG = {
  adinkrahene: { name: 'Adinkrahene', meaning: 'Charisma, leadership, greatness', category: 'wisdom', glyph: '◎' },
  gye_nyame: { name: 'Gye Nyame', meaning: 'Except God — supremacy of the divine', category: 'spirit', glyph: '✦' },
  sankofa: { name: 'Sankofa', meaning: 'Return and get it — learn from the past', category: 'wisdom', glyph: '↻' },
  akoma: { name: 'Akoma', meaning: 'Heart — patience, tolerance, love', category: 'virtue', glyph: '♥' },
  akoben: { name: 'Akoben', meaning: 'War horn — vigilance, readiness', category: 'alert', glyph: '⚑' },
  asase_ye_duru: { name: 'Asase Ye Duru', meaning: 'The earth has weight — divinity of Earth', category: 'earth', glyph: '⊕' },
  boa_me: { name: 'Boa Me Na Me Mmoa Wo', meaning: 'Help me and let me help you — cooperation', category: 'unity', glyph: '⇄' },
  bese_saka: { name: 'Bese Saka', meaning: 'Sack of cola nuts — abundance, wealth', category: 'commerce', glyph: '◉' },
  duafe: { name: 'Duafe', meaning: 'Wooden comb — beauty, cleanliness', category: 'beauty', glyph: '⌇' },
  eban: { name: 'Eban', meaning: 'Fence — security, safety of home', category: 'protection', glyph: '▣' },
  fihankra: { name: 'Fihankra', meaning: 'House/compound — safe haven', category: 'protection', glyph: '⌂' },
  funtunfunefu: { name: 'Funtunfunefu Denkyemfunefu', meaning: 'Siamese crocodiles — unity in diversity', category: 'unity', glyph: '⋈' },
  hwe_mu_dua: { name: 'Hwe Mu Dua', meaning: 'Measuring stick — excellence, quality', category: 'craft', glyph: '│' },
  kintinkantan: { name: 'Kintinkantan', meaning: 'Bent and twisted — arrogance (avoid)', category: 'warning', glyph: '∿' },
  mmusuyidee: { name: 'Mmusuyidee', meaning: 'Sack of talismans — good fortune', category: 'luck', glyph: '✧' },
  mpatapo: { name: 'Mpatapo', meaning: 'Knot of reconciliation — peacemaking', category: 'peace', glyph: '∞' },
  nea_onnim: { name: 'Nea Onnim', meaning: 'He who does not know — lifelong learning', category: 'wisdom', glyph: '?' },
  nkonsonnkonson: { name: 'Nkonsonnkonson', meaning: 'Chain links — unity, community', category: 'unity', glyph: '⛓' },
  nkyinkyim: { name: 'Nkyinkyim', meaning: 'Twisting — initiative, dynamism', category: 'motion', glyph: '∿' },
  nsaa: { name: 'Nsaa', meaning: 'Woven cloth — authenticity, excellence', category: 'craft', glyph: '▦' },
  nyansapo: { name: 'Nyansapo', meaning: 'Wisdom knot — intelligence, wisdom', category: 'wisdom', glyph: '✿' },
  osram: { name: 'Osram Ne Nsoromma', meaning: 'Moon and star — love, faithfulness', category: 'love', glyph: '☽' },
  sesa_wo_suban: { name: 'Sesa Wo Suban', meaning: 'Change your character — transformation', category: 'growth', glyph: '↺' },
  wawa_aba: { name: 'Wawa Aba', meaning: 'Seed of the wawa tree — perseverance', category: 'strength', glyph: '❧' },
  aya: { name: 'Aya', meaning: 'Fern — endurance, resourcefulness', category: 'strength', glyph: '⌘' },
  ananse: { name: 'Ananse Ntontan', meaning: 'Spider web — wisdom, creativity', category: 'wisdom', glyph: '⊛' },
  akofena: { name: 'Akofena', meaning: 'Sword of war — courage, valor', category: 'battle', glyph: '⚔' },
  dame_dame: { name: 'Dame-Dame', meaning: 'Chequered board — intelligence, ingenuity', category: 'strategy', glyph: '▤' },
  bi_nka_bi: { name: 'Bi Nka Bi', meaning: 'No one should bite another — peace, harmony', category: 'peace', glyph: '☮' },
  akoma_ntoso: { name: 'Akoma Ntoso', meaning: 'Linked hearts — understanding, agreement', category: 'love', glyph: '♡' },
  ese_ne_tekrema: { name: 'Ese Ne Tekrema', meaning: 'Teeth and tongue — friendship, interdependence', category: 'friendship', glyph: '☺' },
  akokonan: { name: 'Akokonan', meaning: 'Legs of a hen — nurturing, protection', category: 'care', glyph: '⌒' },
  denkyem: { name: 'Denkyem', meaning: 'Crocodile — adaptability, versatility', category: 'strength', glyph: '∪' },
  aban: { name: 'Aban', meaning: 'Fortress — strength, power, authority', category: 'protection', glyph: '▲' },
  mate_masie: { name: 'Mate Masie', meaning: 'I understand — knowledge, wisdom, prudence', category: 'wisdom', glyph: '◈' },
};

const ADINKRA_ALIASES = {
  nkonsonnkonson: 'nkonsonkonson',
  ananse: 'ananse_ntentan',
  hwe_mu_dua: 'hwehwemudua',
};

window.getAdinkraMeta = function (runeId) {
  const key = ADINKRA_ALIASES[runeId] || runeId;
  const m = window.ADINKRA_CATALOG[key] || window.ADINKRA_CATALOG[runeId];
  if (m) return m;
  const glossar = (window.ADINKRA_GLOSSAR_100 || []).find((g) => g.id === key || g.id === runeId);
  if (glossar) {
    return { name: glossar.name, meaning: glossar.meaning, category: glossar.cat, glossar: glossar.n, glyph: '◈' };
  }
  return { name: runeId, meaning: 'Adinkra symbol', category: 'general', glyph: '◈' };
};

if (typeof window.mergeAdinkraGlossar === 'function') window.mergeAdinkraGlossar();

/** Mark Nature Cycle symbols in catalog */
(window.ADINKRA_NATURE_CYCLE || []).forEach((sym) => {
  if (window.ADINKRA_CATALOG[sym.id]) {
    window.ADINKRA_CATALOG[sym.id].natureCycle = true;
    window.ADINKRA_CATALOG[sym.id].cycleDay = sym.day;
    window.ADINKRA_CATALOG[sym.id].glossar = sym.glossar;
  }
});
