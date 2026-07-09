-- Circle D Flow — Photo Session Bookings
-- Run in Supabase SQL Editor after profiles exist

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_type TEXT NOT NULL DEFAULT 'portrait',
    duration_hours NUMERIC(4,1) DEFAULT 2,
    total_price NUMERIC(10,2) DEFAULT 0,
    vision_notes TEXT,
    location TEXT DEFAULT 'Lisbon',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','scheduled','completed','cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','deposit','paid','refunded')),
    calendar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(lower(email));
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status, created_at DESC);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
CREATE POLICY "bookings_insert_public" ON public.bookings FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
CREATE POLICY "bookings_select_own" ON public.bookings FOR SELECT
USING (
    auth.uid() = customer_id
    OR lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role_calling ILIKE '%admin%')
);

DROP POLICY IF EXISTS "bookings_admin_update" ON public.bookings;
CREATE POLICY "bookings_admin_update" ON public.bookings FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.role_calling ILIKE '%admin%' OR p.username ILIKE '%kyheart%')));

-- Gamification on confirmed booking (optional RPC)
CREATE OR REPLACE FUNCTION public.booking_grant_xp(p_user_id UUID, p_xp INTEGER DEFAULT 50)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF p_user_id IS NULL THEN RETURN; END IF;
    UPDATE public.profiles
    SET exp = COALESCE(exp, 0) + p_xp,
        level = GREATEST(COALESCE(level, 1), FLOOR((COALESCE(exp, 0) + p_xp) / 200.0)::int + 1)
    WHERE id = p_user_id;
END;
$$;
