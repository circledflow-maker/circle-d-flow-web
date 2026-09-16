/**
 * Shared membership coupon helpers (service-role client)
 */
const TIER_RANK = {
  registered: 1,
  flow_supporter: 2,
  flow_crew: 3,
};

function tierRank(tier) {
  return TIER_RANK[String(tier || 'registered')] || 1;
}

function tierAllowed(memberTier, minTier) {
  return tierRank(memberTier) >= tierRank(minTier || 'registered');
}

/**
 * Load active shared coupons for a membership tier (with partner join).
 */
async function listCouponsForTier(db, memberTier) {
  const { data, error } = await db
    .from('membership_coupons')
    .select(
      'id, code, title, benefit_text, discount_percent, min_tier, active, partner:membership_partners(id, slug, name, url, active, sort_order)'
    )
    .eq('active', true);
  if (error) throw error;

  return (data || [])
    .filter((c) => c.partner && c.partner.active !== false && tierAllowed(memberTier, c.min_tier))
    .sort((a, b) => (a.partner.sort_order || 100) - (b.partner.sort_order || 100))
    .reduce((acc, c) => {
      // Prefer higher discount / higher min_tier perk per partner title family
      const key = c.partner.slug + '::' + (c.discount_percent != null ? 'pct' : c.code);
      if (c.discount_percent != null) {
        const existing = acc.find(
          (x) => x.partner.slug === c.partner.slug && x.discountPercent != null
        );
        if (existing) {
          if ((c.discount_percent || 0) > (existing.discountPercent || 0)) {
            Object.assign(existing, {
              id: c.id,
              code: c.code,
              title: c.title,
              benefitText: c.benefit_text,
              discountPercent: c.discount_percent,
              minTier: c.min_tier,
            });
          }
          return acc;
        }
      }
      acc.push({
        id: c.id,
        code: c.code,
        title: c.title,
        benefitText: c.benefit_text,
        discountPercent: c.discount_percent,
        minTier: c.min_tier,
        partner: {
          id: c.partner.id,
          slug: c.partner.slug,
          name: c.partner.name,
          url: c.partner.url,
        },
      });
      return acc;
    }, []);
}

/**
 * Record grants for analytics (shared codes — upsert per user+coupon).
 */
async function grantCouponsToMember(db, { userId, coupons, memberNumber, publicId }) {
  if (!userId || !coupons?.length) return [];
  const rows = coupons.map((c) => ({
    user_id: userId,
    coupon_id: c.id,
    member_number: memberNumber || null,
    public_id: publicId || null,
  }));
  const { data, error } = await db
    .from('membership_coupon_grants')
    .upsert(rows, { onConflict: 'user_id,coupon_id', ignoreDuplicates: true })
    .select('id, coupon_id, granted_at');
  if (error) throw error;
  return data || [];
}

module.exports = {
  tierRank,
  tierAllowed,
  listCouponsForTier,
  grantCouponsToMember,
};
