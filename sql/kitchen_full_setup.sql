-- =============================================================================
-- Circle D Flow â€” Kitchen / Taste Pipeline
-- Run AFTER sql/triad_pipeline_setup.sql
--
-- IMPORTANT (Supabase SQL Editor):
-- Paste and RUN the FULL contents of this file â€” not just the comment lines.
-- First run: sql/triad_pipeline_setup.sql (entire file)
-- Then run:  this file (entire file)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. KITCHENS (vendor profiles â€” first live: AkwabaLX @ Secret Garden LX)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT,
    location_name TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    artist_id TEXT,
    logo_url TEXT,
    cover_url TEXT,
    reel_url TEXT,
    menu_board_url TEXT,
    whatsapp TEXT,
    qr_code_data TEXT,
    pickup_enabled BOOLEAN DEFAULT true,
    discount_note TEXT,
    is_live BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kitchens_public_read" ON public.kitchens;
CREATE POLICY "kitchens_public_read" ON public.kitchens FOR SELECT USING (is_live = true OR auth.uid() = owner_user_id);
DROP POLICY IF EXISTS "kitchens_owner_write" ON public.kitchens;
CREATE POLICY "kitchens_owner_write" ON public.kitchens FOR ALL
USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

-- -----------------------------------------------------------------------------
-- 2. MENU ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchen_menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'main',
    price_eur NUMERIC(8,2) DEFAULT 0,
    price_flow INTEGER DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kitchen_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kitchen_menu_read" ON public.kitchen_menu_items;
CREATE POLICY "kitchen_menu_read" ON public.kitchen_menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "kitchen_menu_owner" ON public.kitchen_menu_items;
CREATE POLICY "kitchen_menu_owner" ON public.kitchen_menu_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 3. ORDERS (pickup + payment status â€” Stripe later)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchen_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total_eur NUMERIC(8,2) DEFAULT 0,
    total_flow INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','ready','picked_up','cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded')),
    pickup_note TEXT,
    discount_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kitchen_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kitchen_orders_customer" ON public.kitchen_orders;
CREATE POLICY "kitchen_orders_customer" ON public.kitchen_orders FOR SELECT
USING (auth.uid() = customer_id OR EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));
DROP POLICY IF EXISTS "kitchen_orders_insert" ON public.kitchen_orders;
CREATE POLICY "kitchen_orders_insert" ON public.kitchen_orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "kitchen_orders_owner_update" ON public.kitchen_orders;
CREATE POLICY "kitchen_orders_owner_update" ON public.kitchen_orders FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 4. SEED â€” AkwabaLX @ Secret Garden LX
-- Link owner_user_id after Akwaba creates account (UPDATE kitchens SET owner_user_id = ...)
-- -----------------------------------------------------------------------------
INSERT INTO public.kitchens (
    id, slug, name, tagline, location_name, address, lat, lng,
    logo_url, cover_url, reel_url, menu_board_url, qr_code_data, whatsapp, discount_note, is_live
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'akwabalx',
    'AkwabaLX',
    'Taste the flow â€” African soul food at Secret Garden',
    'Secret Garden LX',
    'Lisbon, Portugal',
    38.7200, -9.1450,
    '/Assets/kitchens/akwabalx/logo.webp',
    '/Assets/kitchens/akwabalx/hero-1.webp',
    '/Assets/kitchens/akwabalx/reel-hero.mp4',
    '/Assets/kitchens/akwabalx/menu-board.webp',
    'https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen',
    NULL,
    'Navigator discounts coming soon â€” collect Akoma rune for early access.',
    true
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    location_name = EXCLUDED.location_name,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    logo_url = EXCLUDED.logo_url,
    cover_url = EXCLUDED.cover_url,
    reel_url = EXCLUDED.reel_url,
    menu_board_url = EXCLUDED.menu_board_url,
    qr_code_data = EXCLUDED.qr_code_data,
    discount_note = EXCLUDED.discount_note,
    updated_at = NOW();

DELETE FROM public.kitchen_menu_items WHERE kitchen_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

INSERT INTO public.kitchen_menu_items (kitchen_id, name, description, category, price_eur, image_url, sort_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jollof Rice Bowl', 'Smoky tomato jollof with plantain & salad', 'main', 12.00, '/Assets/kitchens/akwabalx/dish-table.webp', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'KitKat Special', 'Chef signature â€” sweet heat fusion plate', 'main', 14.00, '/Assets/kitchens/akwabalx/dish-kitkat.webp', 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Garden Vegan Plate', 'Seasonal greens from Secret Garden', 'vegan', 11.00, '/Assets/kitchens/akwabalx/hero-3.webp', 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Akwaba Combo', 'Rice + stew + drink â€” best value', 'combo', 16.00, '/Assets/kitchens/akwabalx/menu-board.webp', 4),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fresh Juice', 'Daily rotation â€” ask at the bar', 'drink', 4.00, '/Assets/kitchens/akwabalx/hero-5.webp', 5);

-- Optional: link to master_artists when row exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'master_artists') THEN
        INSERT INTO public.master_artists (id, name, email, artist_type, permanent_qr_code, exp, flow_credits)
        VALUES (
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'AkwabaLX',
            'akwabalx@secretgardenlx.pt',
            'vendor',
            'https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen',
            0, 0
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            permanent_qr_code = EXCLUDED.permanent_qr_code;
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'master_artists seed skipped: %', SQLERRM;
END $$;

-- After Akwaba signs up, run:
-- UPDATE public.kitchens SET owner_user_id = '<their-auth-uuid>' WHERE slug = 'akwabalx';

-- -----------------------------------------------------------------------------
-- 5. KITCHEN STAFF & INVITE CODES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchen_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'crew' CHECK (role IN ('owner','chef','pass','bar','service','crew')),
    invite_code TEXT,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (kitchen_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.kitchen_invite_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'crew',
    uses_left INTEGER DEFAULT 10,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kitchen_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kitchen_staff_read" ON public.kitchen_staff;
CREATE POLICY "kitchen_staff_read" ON public.kitchen_staff FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "kitchen_staff_owner_write" ON public.kitchen_staff;
CREATE POLICY "kitchen_staff_owner_write" ON public.kitchen_staff FOR ALL
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "kitchen_invites_owner" ON public.kitchen_invite_codes;
CREATE POLICY "kitchen_invites_owner" ON public.kitchen_invite_codes FOR ALL
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 6. VOUCHERS & GAMIFICATION RULES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchen_vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed_eur','flow_credits')),
    discount_value NUMERIC(8,2) NOT NULL DEFAULT 10,
    min_order_eur NUMERIC(8,2) DEFAULT 0,
    uses_left INTEGER DEFAULT 50,
    expires_at TIMESTAMPTZ,
    xp_bonus INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (kitchen_id, code)
);

CREATE TABLE IF NOT EXISTS public.kitchen_gamification_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    rule_key TEXT NOT NULL,
    label TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    flow_reward INTEGER DEFAULT 0,
    karma_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    UNIQUE (kitchen_id, rule_key)
);

ALTER TABLE public.kitchen_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_gamification_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kitchen_vouchers_read" ON public.kitchen_vouchers;
CREATE POLICY "kitchen_vouchers_read" ON public.kitchen_vouchers FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "kitchen_vouchers_owner" ON public.kitchen_vouchers;
CREATE POLICY "kitchen_vouchers_owner" ON public.kitchen_vouchers FOR ALL
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "kitchen_rules_read" ON public.kitchen_gamification_rules;
CREATE POLICY "kitchen_rules_read" ON public.kitchen_gamification_rules FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "kitchen_rules_owner" ON public.kitchen_gamification_rules;
CREATE POLICY "kitchen_rules_owner" ON public.kitchen_gamification_rules FOR ALL
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 7. KITCHEN COMMUNICATION (crew â†” Flowee briefing channel)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchen_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL DEFAULT 'Crew',
    body TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'ops' CHECK (channel IN ('ops','guest','system')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kitchen_messages_kitchen ON public.kitchen_messages(kitchen_id, created_at DESC);

ALTER TABLE public.kitchen_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kitchen_messages_read" ON public.kitchen_messages;
CREATE POLICY "kitchen_messages_read" ON public.kitchen_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND (
        k.owner_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.kitchen_staff s WHERE s.kitchen_id = kitchen_messages.kitchen_id AND s.user_id = auth.uid() AND s.is_active)
    ))
);
DROP POLICY IF EXISTS "kitchen_messages_insert" ON public.kitchen_messages;
CREATE POLICY "kitchen_messages_insert" ON public.kitchen_messages FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND (
        k.owner_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.kitchen_staff s WHERE s.kitchen_id = kitchen_messages.kitchen_id AND s.user_id = auth.uid() AND s.is_active)
    ))
);

-- Expand order statuses (safe re-check)
ALTER TABLE public.kitchen_orders DROP CONSTRAINT IF EXISTS kitchen_orders_status_check;
ALTER TABLE public.kitchen_orders ADD CONSTRAINT kitchen_orders_status_check
CHECK (status IN ('pending','confirmed','in_progress','ready','picked_up','cancelled'));

-- -----------------------------------------------------------------------------
-- 8. SEED â€” gamification rules + demo invite + voucher
-- -----------------------------------------------------------------------------
INSERT INTO public.kitchen_gamification_rules (kitchen_id, rule_key, label, xp_reward, flow_reward, karma_reward, config) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'first_pickup', 'First Taste Pickup', 25, 0, 5, '{"quest":"LQ-T02"}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'order_ready', 'Order marked READY', 10, 0, 2, '{}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'soul_ticket_scan', 'Soul Ticket scan @ bar', 15, 0, 3, '{}'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'five_star_vibe', '5-flame rating', 20, 50, 5, '{}')
ON CONFLICT (kitchen_id, rule_key) DO UPDATE SET
    label = EXCLUDED.label,
    xp_reward = EXCLUDED.xp_reward,
    flow_reward = EXCLUDED.flow_reward,
    karma_reward = EXCLUDED.karma_reward;

INSERT INTO public.kitchen_invite_codes (kitchen_id, code, role, uses_left, expires_at)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'AKWABA-CREW', 'crew', 20, NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.kitchen_vouchers (kitchen_id, code, discount_type, discount_value, xp_bonus, uses_left, expires_at)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'NAVIGATOR10', 'percent', 10, 15, 100, NOW() + INTERVAL '180 days')
ON CONFLICT (kitchen_id, code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. REWARD HELPER â€” call from app when order picked up / rated
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kitchen_grant_reward(p_user_id UUID, p_rule_key TEXT, p_kitchen_slug TEXT DEFAULT 'akwabalx')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rule public.kitchen_gamification_rules%ROWTYPE;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'no user');
    END IF;

    SELECT r.* INTO v_rule
    FROM public.kitchen_gamification_rules r
    JOIN public.kitchens k ON k.id = r.kitchen_id
    WHERE k.slug = p_kitchen_slug AND r.rule_key = p_rule_key AND r.is_active
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'rule not found');
    END IF;

    UPDATE public.profiles
    SET
        exp = COALESCE(exp, 0) + v_rule.xp_reward,
        karma = COALESCE(karma, 0) + v_rule.karma_reward,
        flow_credits = COALESCE(flow_credits, 0) + v_rule.flow_reward,
        level = GREATEST(COALESCE(level, 1), FLOOR((COALESCE(exp, 0) + v_rule.xp_reward) / 200.0)::int + 1)
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'ok', true,
        'xp', v_rule.xp_reward,
        'flow', v_rule.flow_reward,
        'karma', v_rule.karma_reward
    );
END;
$$;

-- Enable Realtime (run in Supabase Dashboard â†’ Database â†’ Replication if needed):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_messages;

-- Kitchen ops: branding column + staff menu write policy
-- Run in Supabase SQL Editor after kitchen_pipeline_setup.sql

ALTER TABLE public.kitchens
  ADD COLUMN IF NOT EXISTS menu_board_url TEXT;

UPDATE public.kitchens
SET menu_board_url = '/Assets/kitchens/akwabalx/menu-board.webp'
WHERE slug = 'akwabalx' AND menu_board_url IS NULL;

UPDATE public.kitchens
SET reel_url = '/Assets/kitchens/akwabalx/reel-hero.mp4'
WHERE slug = 'akwabalx';

-- Allow active kitchen staff to manage menu items (not only owner)
DROP POLICY IF EXISTS "kitchen_menu_staff" ON public.kitchen_menu_items;
CREATE POLICY "kitchen_menu_staff" ON public.kitchen_menu_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.kitchen_staff s
    WHERE s.kitchen_id = kitchen_menu_items.kitchen_id
      AND s.user_id = auth.uid()
      AND s.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kitchen_staff s
    WHERE s.kitchen_id = kitchen_menu_items.kitchen_id
      AND s.user_id = auth.uid()
      AND s.is_active = true
  )
);

-- Staff can update kitchen branding fields
DROP POLICY IF EXISTS "kitchens_staff_brand" ON public.kitchens;
CREATE POLICY "kitchens_staff_brand" ON public.kitchens FOR UPDATE
USING (
  auth.uid() = owner_user_id
  OR EXISTS (
    SELECT 1 FROM public.kitchen_staff s
    WHERE s.kitchen_id = kitchens.id AND s.user_id = auth.uid() AND s.is_active
  )
)
WITH CHECK (
  auth.uid() = owner_user_id
  OR EXISTS (
    SELECT 1 FROM public.kitchen_staff s
    WHERE s.kitchen_id = kitchens.id AND s.user_id = auth.uid() AND s.is_active
  )
);
-- =============================================================================
-- Circle D Flow â€” Flavor Quests + Kitchen Feedback (append to kitchen_full_setup)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 10. FLAVOR QUEST DEFINITIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flavor_quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    quest_type TEXT NOT NULL CHECK (quest_type IN ('order','feedback','scan','share','streak','visit')),
    xp_reward INTEGER DEFAULT 100,
    flow_reward INTEGER DEFAULT 0,
    karma_reward INTEGER DEFAULT 0,
    kitchen_slug TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flavor_quest_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL REFERENCES public.flavor_quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','claimable','completed')),
    progress JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, quest_id)
);

-- -----------------------------------------------------------------------------
-- 11. KITCHEN FEEDBACK SESSIONS (Flavor Log + photo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchen_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID REFERENCES public.kitchens(id) ON DELETE SET NULL,
    kitchen_slug TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    photo_url TEXT,
    quest_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kitchen_feedback_kitchen ON public.kitchen_feedback(kitchen_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flavor_progress_user ON public.flavor_quest_progress(user_id, quest_id);

ALTER TABLE public.flavor_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavor_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flavor_quests_read" ON public.flavor_quests;
CREATE POLICY "flavor_quests_read" ON public.flavor_quests FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "flavor_progress_own" ON public.flavor_quest_progress;
CREATE POLICY "flavor_progress_own" ON public.flavor_quest_progress FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kitchen_feedback_insert" ON public.kitchen_feedback;
CREATE POLICY "kitchen_feedback_insert" ON public.kitchen_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "kitchen_feedback_read_own" ON public.kitchen_feedback;
CREATE POLICY "kitchen_feedback_read_own" ON public.kitchen_feedback FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()
));

-- -----------------------------------------------------------------------------
-- 12. SEED â€” Flavor Quests (linked to kitchen actions)
-- -----------------------------------------------------------------------------
INSERT INTO public.flavor_quests (id, title, description, quest_type, xp_reward, flow_reward, kitchen_slug, config, sort_order) VALUES
('LQ-FQ01', 'The First Bite', 'Order any main dish from a Taste World kitchen.', 'order', 100, 15, 'akwabalx', '{"min_items":1,"category":"main"}', 1),
('LQ-FQ02', 'Flavor Log', 'Leave feedback with photo in the Flavor Log.', 'feedback', 150, 20, 'akwabalx', '{"requires_photo":true}', 2),
('LQ-FQ03', 'Kitchen QR Pulse', 'Download kitchen QR or share via WhatsApp.', 'share', 80, 10, 'akwabalx', '{}', 3),
('LQ-FQ04', 'Soul Ticket Scan', 'Complete pickup â€” Soul Ticket scanned at bar.', 'scan', 120, 15, 'akwabalx', '{}', 4),
('LQ-FQ05', 'The Regular', 'Order 3 times within 7 days.', 'streak', 500, 50, NULL, '{"orders_required":3,"days":7}', 5),
('LQ-FQ06', 'Taste Radar Discovery', 'Open Taste Radar and enter a kitchen from the swipe deck.', 'visit', 60, 10, NULL, '{"page":"taste_radar"}', 6)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    quest_type = EXCLUDED.quest_type,
    xp_reward = EXCLUDED.xp_reward,
    flow_reward = EXCLUDED.flow_reward,
    config = EXCLUDED.config;

-- -----------------------------------------------------------------------------
-- 13. QUEST FULFILL HELPER (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flavor_fulfill_quest(
    p_user_id UUID,
    p_quest_id TEXT,
    p_progress JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quest public.flavor_quests%ROWTYPE;
    v_existing public.flavor_quest_progress%ROWTYPE;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'no user');
    END IF;

    SELECT * INTO v_quest FROM public.flavor_quests WHERE id = p_quest_id AND is_active LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'quest not found');
    END IF;

    SELECT * INTO v_existing FROM public.flavor_quest_progress
    WHERE user_id = p_user_id AND quest_id = p_quest_id LIMIT 1;

    IF FOUND AND v_existing.status = 'completed' THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'already completed');
    END IF;

    INSERT INTO public.flavor_quest_progress (user_id, quest_id, status, progress, completed_at)
    VALUES (p_user_id, p_quest_id, 'completed', p_progress, NOW())
    ON CONFLICT (user_id, quest_id) DO UPDATE SET
        status = 'completed',
        progress = EXCLUDED.progress,
        completed_at = NOW();

    UPDATE public.profiles SET
        exp = COALESCE(exp, 0) + v_quest.xp_reward,
        karma = COALESCE(karma, 0) + v_quest.karma_reward,
        flow_credits = COALESCE(flow_credits, 0) + v_quest.flow_reward,
        level = GREATEST(COALESCE(level, 1), FLOOR((COALESCE(exp, 0) + v_quest.xp_reward) / 200.0)::int + 1)
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'ok', true,
        'quest_id', p_quest_id,
        'xp', v_quest.xp_reward,
        'flow', v_quest.flow_reward,
        'karma', v_quest.karma_reward
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 14. TASTE RADAR â€” show_on_radar flag
-- -----------------------------------------------------------------------------
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS show_on_radar BOOLEAN DEFAULT true;

UPDATE public.kitchens SET show_on_radar = true WHERE slug = 'akwabalx';

-- Realtime (optional):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_feedback;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.flavor_quest_progress;

