-- =============================================================================
-- Kitchen Live Sync — run AFTER kitchen_full_setup.sql + kitchen_rls_fix.sql
-- Enables cross-device menu updates via Supabase Realtime + cloud timestamps
-- =============================================================================

-- 1. Realtime publication (guest page listens on kitchen_menu_items)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kitchen_menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_menu_items;
  END IF;
END $$;

-- Optional: live branding on guest cards (logo/cover/reel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kitchens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchens;
  END IF;
END $$;

-- 2. updated_at for merge priority (local + cloud)
ALTER TABLE public.kitchen_menu_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.kitchen_menu_items_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kitchen_menu_items_updated_at ON public.kitchen_menu_items;
CREATE TRIGGER kitchen_menu_items_updated_at
  BEFORE UPDATE ON public.kitchen_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.kitchen_menu_items_set_updated_at();

-- 3. Ensure kitchen is visible to guests
UPDATE public.kitchens SET is_live = true WHERE slug = 'akwabalx';

-- 4. AFTER owner signs up — replace <your-auth-uuid> and run:
-- UPDATE public.kitchens SET owner_user_id = '<your-auth-uuid>' WHERE slug = 'akwabalx';
--
-- INSERT INTO public.kitchen_staff (kitchen_id, user_id, role, display_name, is_active)
-- SELECT id, owner_user_id, 'owner', 'Owner', true
-- FROM public.kitchens
-- WHERE slug = 'akwabalx' AND owner_user_id IS NOT NULL
-- ON CONFLICT (kitchen_id, user_id) DO UPDATE SET role = 'owner', is_active = true;

-- 5. Realtime for KDS orders + crew chat (optional but recommended)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kitchen_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_orders;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kitchen_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_messages;
  END IF;
END $$;
