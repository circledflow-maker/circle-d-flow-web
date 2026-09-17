/**
 * Membership benefit grants — monthly QR / codes for admin scan
 * Local-first with optional Supabase sync later.
 */
(function () {
  const STORE = 'cdf_benefit_grants_v1';

  function monthKey(d) {
    const x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || '{}');
    } catch (_) {
      return {};
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORE, JSON.stringify(data));
    } catch (_) { /* ignore */ }
  }

  function randCode(prefix) {
    const a = Math.random().toString(36).slice(2, 6).toUpperCase();
    const b = Math.random().toString(36).slice(2, 6).toUpperCase();
    return (prefix || 'WK') + '-' + a + '-' + b;
  }

  function memberKey() {
    try {
      const card = JSON.parse(localStorage.getItem('cdf_wako_member_card') || '{}');
      return card.memberNumber || card.publicId || 'guest';
    } catch (_) {
      return 'guest';
    }
  }

  /** Redeemable benefits for Silver+ (and Gold extras) */
  const CATALOG = [
    { id: 'wako_event', label: 'Free Wako Kungo event access', min: 'silver', refill: 'month' },
    { id: 'guest_plus1', label: '+1 guest pass', min: 'silver', refill: 'month' },
    { id: 'drink_1', label: '1 free drink (1 event)', min: 'silver', refill: 'month' },
    { id: 'drink_3', label: 'Free drink · event slot', min: 'gold', refill: 'month', slots: 3 },
    { id: 'shoot_1h', label: '1h shoot booking', min: 'gold', refill: 'month' },
  ];

  function tierRank(t) {
    if (t === 'flow_crew' || t === 'gold') return 3;
    if (t === 'flow_supporter' || t === 'silver') return 2;
    return 1;
  }

  function ensureGrants(tier) {
    const mk = monthKey();
    const mkStore = load();
    if (!mkStore[mk]) mkStore[mk] = {};
    const uid = memberKey();
    if (!mkStore[mk][uid]) mkStore[mk][uid] = {};
    const bag = mkStore[mk][uid];
    const rank = tierRank(tier);
    CATALOG.forEach((b) => {
      const need = b.min === 'gold' ? 3 : 2;
      if (rank < need) return;
      const slots = b.slots || 1;
      if (!bag[b.id]) bag[b.id] = [];
      while (bag[b.id].length < slots) {
        bag[b.id].push({
          code: randCode(b.id.slice(0, 3).toUpperCase()),
          benefitId: b.id,
          label: b.label,
          used: false,
          usedAt: null,
          month: mk,
        });
      }
    });
    save(mkStore);
    return bag;
  }

  function listForTier(tier) {
    const bag = ensureGrants(tier);
    const out = [];
    CATALOG.forEach((b) => {
      const need = b.min === 'gold' ? 3 : 2;
      if (tierRank(tier) < need) return;
      (bag[b.id] || []).forEach((g, i) => {
        out.push({ ...g, slot: i + 1, catalogLabel: b.label });
      });
    });
    return out;
  }

  function redeem(code, operator) {
    const mk = monthKey();
    const all = load();
    const month = all[mk] || {};
    let found = null;
    Object.keys(month).forEach((uid) => {
      Object.keys(month[uid] || {}).forEach((bid) => {
        (month[uid][bid] || []).forEach((g) => {
          if (String(g.code).toUpperCase() === String(code).toUpperCase()) found = g;
        });
      });
    });
    if (!found) return { ok: false, error: 'Code not found this month' };
    if (found.used) return { ok: false, error: 'Already used — refills next month', grant: found };
    found.used = true;
    found.usedAt = new Date().toISOString();
    found.redeemedBy = operator || 'admin';
    save(all);
    return { ok: true, grant: found };
  }

  function qrUrl(code) {
    const text = encodeURIComponent('CDF-BENEFIT:' + code);
    return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + text;
  }

  window.CdfBenefitGrants = {
    monthKey,
    catalog: CATALOG,
    listForTier,
    ensureGrants,
    redeem,
    qrUrl,
  };
})();
