-- Membership partners + shared coupon codes + grant analytics
CREATE TABLE IF NOT EXISTS public.membership_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.membership_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.membership_partners(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  benefit_text TEXT NOT NULL,
  discount_percent INT,
  min_tier TEXT NOT NULL DEFAULT 'registered', -- registered | flow_supporter | flow_crew
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, code)
);

CREATE TABLE IF NOT EXISTS public.membership_coupon_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  coupon_id UUID NOT NULL REFERENCES public.membership_coupons(id) ON DELETE CASCADE,
  member_number TEXT,
  public_id TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  copied_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  UNIQUE (user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS membership_coupons_partner_idx ON public.membership_coupons(partner_id);
CREATE INDEX IF NOT EXISTS membership_coupons_active_idx ON public.membership_coupons(active);
CREATE INDEX IF NOT EXISTS membership_grants_user_idx ON public.membership_coupon_grants(user_id);
CREATE INDEX IF NOT EXISTS membership_grants_coupon_idx ON public.membership_coupon_grants(coupon_id);
CREATE INDEX IF NOT EXISTS profiles_member_claimed_idx ON public.profiles(member_card_claimed_at)
  WHERE member_card_claimed_at IS NOT NULL;

ALTER TABLE public.membership_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_coupon_grants ENABLE ROW LEVEL SECURITY;

-- Public read of active partners/coupons is via service-role API only (no anon policies)
DROP POLICY IF EXISTS "membership_partners_no_anon" ON public.membership_partners;
DROP POLICY IF EXISTS "membership_coupons_no_anon" ON public.membership_coupons;
DROP POLICY IF EXISTS "membership_grants_own_select" ON public.membership_coupon_grants;

CREATE POLICY "membership_grants_own_select"
  ON public.membership_coupon_grants FOR SELECT
  USING (auth.uid() = user_id);

-- Seed default partners
INSERT INTO public.membership_partners (slug, name, url, description, sort_order)
VALUES
  ('wako', 'Wako Kungo', 'https://www.instagram.com/wako.kungo/', 'Music, sessions, community hub.', 10),
  ('humble', 'Humble.project', 'https://humble-project.com/', 'Shop & creative goods.', 20),
  ('kreativlon', 'Kreativlon.art', 'https://www.kreativlon.shop', 'Art & shop partner lane.', 30)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Seed shared coupon codes (admin can edit codes later)
INSERT INTO public.membership_coupons (partner_id, code, title, benefit_text, discount_percent, min_tier)
SELECT p.id, v.code, v.title, v.benefit_text, v.discount_percent, v.min_tier
FROM public.membership_partners p
JOIN (
  VALUES
    ('wako', 'WK-PLUS1-ENTRY', 'Guest +1 free entry', 'Freier Eintritt für dich +1 bei Wako Kungo und Partner-Events.', NULL, 'registered'),
    ('wako', 'WK-FREE-DRINK', 'Wako free drink', 'Ein Free Drink bei Wako Kungo (Mitgliedskarte zeigen).', NULL, 'registered'),
    ('humble', 'WK-HUMBLE-15', 'Humble 15% off', '15% Rabatt bei Humble.project mit Mitgliedscode.', 15, 'registered'),
    ('kreativlon', 'WK-KREATIV-20', 'Kreativlon 20% off', '20% Rabatt bei Kreativlon.art mit Mitgliedscode.', 20, 'registered'),
    ('humble', 'WK-HUMBLE-20-CREW', 'Humble 20% Crew', '20% Rabatt bei Humble.project (Flow Crew / Supporter).', 20, 'flow_supporter')
) AS v(slug, code, title, benefit_text, discount_percent, min_tier)
  ON p.slug = v.slug
ON CONFLICT (partner_id, code) DO UPDATE SET
  title = EXCLUDED.title,
  benefit_text = EXCLUDED.benefit_text,
  discount_percent = EXCLUDED.discount_percent,
  min_tier = EXCLUDED.min_tier,
  active = true,
  updated_at = now();

COMMENT ON TABLE public.membership_partners IS 'Circle partner brands for membership perks';
COMMENT ON TABLE public.membership_coupons IS 'Shared coupon codes per partner; min_tier gates visibility';
COMMENT ON TABLE public.membership_coupon_grants IS 'Analytics: which members received which shared codes';
