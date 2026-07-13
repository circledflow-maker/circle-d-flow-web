-- Kitchen order crew flow: status_log + in_progress + guest notify support
-- Run in Supabase SQL Editor after kitchen_full_setup.sql

ALTER TABLE public.kitchen_orders
  ADD COLUMN IF NOT EXISTS status_log JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.kitchen_orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.kitchen_orders DROP CONSTRAINT IF EXISTS kitchen_orders_status_check;
ALTER TABLE public.kitchen_orders ADD CONSTRAINT kitchen_orders_status_check
  CHECK (status IN ('pending','confirmed','in_progress','ready','picked_up','cancelled'));

CREATE OR REPLACE FUNCTION public.kitchen_orders_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kitchen_orders_updated_at ON public.kitchen_orders;
CREATE TRIGGER kitchen_orders_updated_at
  BEFORE UPDATE ON public.kitchen_orders
  FOR EACH ROW EXECUTE FUNCTION public.kitchen_orders_touch_updated_at();

-- Guest can read own orders (for live pickup tracker)
DROP POLICY IF EXISTS "kitchen_orders_customer" ON public.kitchen_orders;
CREATE POLICY "kitchen_orders_customer" ON public.kitchen_orders FOR SELECT
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.kitchens k
    WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()
  )
);

-- Allow guest insert (anonymous pickup orders)
DROP POLICY IF EXISTS "kitchen_orders_insert" ON public.kitchen_orders;
CREATE POLICY "kitchen_orders_insert" ON public.kitchen_orders FOR INSERT
WITH CHECK (customer_id IS NULL OR auth.uid() = customer_id);

-- Owner updates status + log
DROP POLICY IF EXISTS "kitchen_orders_owner_update" ON public.kitchen_orders;
CREATE POLICY "kitchen_orders_owner_update" ON public.kitchen_orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.kitchens k
    WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()
  )
);

-- Realtime (safe if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kitchen_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_orders;
  END IF;
END $$;
