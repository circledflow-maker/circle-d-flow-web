-- =============================================================================
-- Circle D Flow — Kitchen / Taste Pipeline
-- Run AFTER sql/triad_pipeline_setup.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. KITCHENS (vendor profiles — first live: AkwabaLX @ Secret Garden LX)
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
-- 3. ORDERS (pickup + payment status — Stripe later)
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
-- 4. SEED — AkwabaLX @ Secret Garden LX
-- Link owner_user_id after Akwaba creates account (UPDATE kitchens SET owner_user_id = ...)
-- -----------------------------------------------------------------------------
INSERT INTO public.kitchens (
    id, slug, name, tagline, location_name, address, lat, lng,
    logo_url, cover_url, reel_url, qr_code_data, whatsapp, discount_note, is_live
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'akwabalx',
    'AkwabaLX',
    'Taste the flow — African soul food at Secret Garden',
    'Secret Garden LX',
    'Lisbon, Portugal',
    38.7200, -9.1450,
    '/Assets/kitchens/akwabalx/logo.png',
    '/Assets/kitchens/akwabalx/hero-1.jpg',
    '/Assets/kitchens/akwabalx/reel-hero.mp4',
    'https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen',
    NULL,
    'Navigator discounts coming soon — collect Akoma rune for early access.',
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
    qr_code_data = EXCLUDED.qr_code_data,
    discount_note = EXCLUDED.discount_note,
    updated_at = NOW();

DELETE FROM public.kitchen_menu_items WHERE kitchen_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

INSERT INTO public.kitchen_menu_items (kitchen_id, name, description, category, price_eur, image_url, sort_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jollof Rice Bowl', 'Smoky tomato jollof with plantain & salad', 'main', 12.00, '/Assets/kitchens/akwabalx/dish-table.jpg', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'KitKat Special', 'Chef signature — sweet heat fusion plate', 'main', 14.00, '/Assets/kitchens/akwabalx/dish-kitkat.jpg', 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Garden Vegan Plate', 'Seasonal greens from Secret Garden', 'vegan', 11.00, '/Assets/kitchens/akwabalx/hero-3.jpg', 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Akwaba Combo', 'Rice + stew + drink — best value', 'combo', 16.00, '/Assets/kitchens/akwabalx/menu-board.png', 4),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fresh Juice', 'Daily rotation — ask at the bar', 'drink', 4.00, '/Assets/kitchens/akwabalx/hero-5.jpg', 5);

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
