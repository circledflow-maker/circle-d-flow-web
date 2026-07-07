/**
 * Adinkra Glyph Engine — stylized SVG paths for Nature Cycle + fallbacks
 */
(function () {
  const TIER_COLORS = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#d4af37' };

  /** Simplified Adinkra-inspired paths (viewBox 0 0 100 100) */
  const PATHS = {
    akoma: 'M50,88 C18,58 18,32 50,18 C82,32 82,58 50,88 Z M50,72 C62,58 62,42 50,34 C38,42 38,58 50,72 Z',
    sankofa: 'M28,72 C12,52 18,22 42,28 L52,42 M72,28 C88,48 82,78 58,72 M42,28 C48,18 58,14 68,18',
    abusua_pa: 'M50,20 L72,38 L64,72 L36,72 L28,38 Z M50,38 L50,62 M36,52 L64,52',
    fihankra: 'M22,68 L22,42 L50,22 L78,42 L78,68 Z M32,68 L32,48 L50,34 L68,48 L68,68',
    boa_me: 'M20,50 L40,30 L60,50 L80,30 M20,70 L40,50 L60,70 L80,50',
    funtunfunefu: 'M30,70 C20,50 25,30 40,35 C45,55 35,65 30,70 M70,70 C80,50 75,30 60,35 C55,55 65,65 70,70 M40,35 L60,35',
    nkonsonkonson: 'M18,50 A12,12 0 1,1 42,50 A12,12 0 1,1 66,50 A12,12 0 1,1 90,50',
    kokuromotie: 'M50,25 L58,45 L78,45 L62,58 L68,78 L50,65 L32,78 L38,58 L22,45 L42,45 Z',
    kuronti_ne_akwamu: 'M25,75 L25,35 L50,20 L75,35 L75,75 M35,55 L65,55 M35,65 L65,65',
    nnamfo_pa_baanu: 'M28,70 C28,45 38,30 50,30 C62,30 72,45 72,70 M38,55 L62,55',
    nteasee: 'M30,50 C30,30 42,22 50,30 C58,22 70,30 70,50 C70,70 58,78 50,70 C42,78 30,70 30,50 Z',
    bi_nka_bi: 'M20,50 L80,50 M50,20 L50,80 M32,32 L68,68 M68,32 L32,68',
    wo_nsa_da_mu_a: 'M35,65 L35,45 L50,35 L65,45 L65,65 M42,55 L58,55 M42,62 L58,62',
    adwo: 'M50,25 A25,25 0 1,1 49.9,25 M50,40 A10,10 0 1,1 49.9,40',
    asase_ye_duru: 'M50,85 L50,35 M35,50 L65,50 M50,35 C35,35 25,45 25,55 C25,70 40,80 50,85 C60,80 75,70 75,55 C75,45 65,35 50,35 Z',
    fafanto: 'M50,25 C65,35 70,50 60,65 C55,75 45,75 40,65 C30,50 35,35 50,25 M50,25 L50,15 M42,30 L35,22 M58,30 L65,22',
    ananse_ntentan: 'M50,50 L20,30 L30,70 L70,70 L80,30 Z M50,50 L50,20 M50,50 L15,50 M50,50 L85,50',
    nkyemu: 'M20,20 L80,80 M80,20 L20,80 M50,15 L50,85 M15,50 L85,50',
    odo_nnyew_fie_kwan: 'M50,80 C25,55 25,35 50,25 C75,35 75,55 50,80 M35,45 L65,45 M40,58 L60,58',
    nea_onnim: 'M50,25 L65,75 L35,75 Z M50,45 L50,58',
    dame_dame: 'M25,25 H75 V75 H25 Z M25,50 H75 M50,25 V75 M37,37 H63 V63 H37 Z',
    aya: 'M50,85 L35,25 L50,45 L65,25 Z M42,55 L58,55',
    ani_bere_a_enso_gya: 'M35,55 C35,40 42,32 50,38 C58,32 65,40 65,55 M40,62 L60,62',
    mframadan: 'M22,68 L22,38 L50,22 L78,38 L78,68 Z M32,68 L32,48 L50,36 L68,48 L68,68 M42,58 L58,58',
    tabono: 'M25,70 L25,30 L45,30 L45,55 L75,25 L75,45 L50,55 L50,70 Z',
    sunsum: 'M50,18 L62,42 L88,42 L68,58 L76,82 L50,68 L24,82 L32,58 L12,42 L38,42 Z',
    mate_masie: 'M30,35 C30,25 40,20 50,28 C60,20 70,25 70,35 C70,50 50,65 50,65 C50,65 30,50 30,35 Z M50,65 L50,82',
    nyansapo: 'M35,50 C35,35 50,25 65,35 C75,42 75,58 65,65 C50,75 35,65 35,50 Z M50,40 L58,58 L42,58 Z',
    gye_nyame: 'M50,15 L85,35 L75,75 L25,75 L15,35 Z M50,35 L50,65 M35,50 L65,50',
  };

  const GLYPH_UNICODE = {
    akoma: '♥', sankofa: '↻', abusua_pa: '⌂', fihankra: '▣', boa_me: '⇄',
    funtunfunefu: '⋈', nkonsonkonson: '⛓', kokuromotie: '☝', kuronti_ne_akwamu: '⚖',
    nnamfo_pa_baanu: '☺', nteasee: '◎', bi_nka_bi: '☮', wo_nsa_da_mu_a: '✋',
    adwo: '☯', asase_ye_duru: '⊕', fafanto: '❋', ananse_ntentan: '⊛', nkyemu: '✛',
    odo_nnyew_fie_kwan: '♡', nea_onnim: '?', dame_dame: '▤', aya: '⌘', ani_bere_a_enso_gya: '◉',
    mframadan: '⌂', tabono: '↦', sunsum: '✦', mate_masie: '◈', nyansapo: '✿',
  };

  function resolveId(runeId) {
    const meta = window.getAdinkraMeta?.(runeId);
    return meta?.aliasOf || runeId;
  }

  function tierColor(tier) {
    return TIER_COLORS[tier] || TIER_COLORS.gold;
  }

  window.AdinkraGlyph = {
    hasPath(runeId) {
      return !!PATHS[resolveId(runeId)];
    },

    renderSVG(runeId, tier, size) {
      const id = resolveId(runeId);
      const path = PATHS[id];
      const px = size || 48;
      const color = tierColor(tier);
      if (!path) {
        const m = window.getAdinkraMeta?.(runeId);
        const g = GLYPH_UNICODE[id] || m?.glyph || '◈';
        return `<span class="adinkra-glyph-fallback" style="font-size:${px * 0.7}px;color:${color};line-height:1" title="${m?.meaning || ''}">${g}</span>`;
      }
      return `<svg class="adinkra-glyph-svg" width="${px}" height="${px}" viewBox="0 0 100 100" aria-hidden="true" style="color:${color}">
        <path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="${path}"/>
      </svg>`;
    },

    paintElement(el, runeId, tier, size) {
      if (!el) return;
      const m = window.getAdinkraMeta?.(runeId);
      el.innerHTML = this.renderSVG(runeId, tier, size || 48);
      el.title = m?.meaning || '';
      el.classList.add('adinkra-glyph-host');
    },
  };

  window.renderAdinkraGlyph = function (runeId, tier) {
    if (window.AdinkraGlyph) return window.AdinkraGlyph.renderSVG(runeId, tier, 40);
    const m = window.getAdinkraMeta(runeId);
    const c = tierColor(tier);
    return `<span style="font-size:1.4em;color:${c};line-height:1" title="${m.meaning}">${m.glyph}</span>`;
  };

  window.paintAdinkraElement = function (el, runeId, tier) {
    if (window.AdinkraGlyph) {
      window.AdinkraGlyph.paintElement(el, runeId, tier, 40);
      return;
    }
    if (!el) return;
    const m = window.getAdinkraMeta(runeId);
    el.textContent = m.glyph || '◈';
    el.title = m.meaning || '';
    el.style.fontSize = '1.4em';
    el.style.color = tierColor(tier);
  };
})();
