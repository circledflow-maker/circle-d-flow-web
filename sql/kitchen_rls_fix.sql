-- =============================================================================
-- FIX: Supabase 500 on kitchen_menu_items / kitchen_messages
-- Cause: infinite recursion in kitchen_staff RLS policy (self-reference)
-- Run this in Supabase SQL Editor AFTER kitchen_full_setup.sql
-- =============================================================================

-- 1. kitchen_staff — NO self-reference (was causing infinite recursion → HTTP 500)
DROP POLICY IF EXISTS "kitchen_staff_read" ON public.kitchen_staff;
CREATE POLICY "kitchen_staff_read" ON public.kitchen_staff FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.kitchens k
    WHERE k.id = kitchen_staff.kitchen_id AND k.owner_user_id = auth.uid()
  )
);

-- 2. kitchen_menu_items — public read; staff write only (not FOR ALL on SELECT)
DROP POLICY IF EXISTS "kitchen_menu_staff" ON public.kitchen_menu_items;
DROP POLICY IF EXISTS "kitchen_menu_owner" ON public.kitchen_menu_items;

CREATE POLICY "kitchen_menu_owner_insert" ON public.kitchen_menu_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

CREATE POLICY "kitchen_menu_owner_update" ON public.kitchen_menu_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

CREATE POLICY "kitchen_menu_owner_delete" ON public.kitchen_menu_items FOR DELETE
USING (EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()));

CREATE POLICY "kitchen_menu_staff_insert" ON public.kitchen_menu_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.kitchen_staff s
  WHERE s.kitchen_id = kitchen_menu_items.kitchen_id AND s.user_id = auth.uid() AND s.is_active
));

CREATE POLICY "kitchen_menu_staff_update" ON public.kitchen_menu_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.kitchen_staff s
  WHERE s.kitchen_id = kitchen_menu_items.kitchen_id AND s.user_id = auth.uid() AND s.is_active
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.kitchen_staff s
  WHERE s.kitchen_id = kitchen_menu_items.kitchen_id AND s.user_id = auth.uid() AND s.is_active
));

CREATE POLICY "kitchen_menu_staff_delete" ON public.kitchen_menu_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.kitchen_staff s
  WHERE s.kitchen_id = kitchen_menu_items.kitchen_id AND s.user_id = auth.uid() AND s.is_active
));

-- kitchen_menu_read (SELECT true) must exist — recreate if missing
DROP POLICY IF EXISTS "kitchen_menu_read" ON public.kitchen_menu_items;
CREATE POLICY "kitchen_menu_read" ON public.kitchen_menu_items FOR SELECT USING (true);

-- 3. kitchen_messages — re-apply read/insert (safe after staff fix)
DROP POLICY IF EXISTS "kitchen_messages_read" ON public.kitchen_messages;
CREATE POLICY "kitchen_messages_read" ON public.kitchen_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.kitchen_staff s
    WHERE s.kitchen_id = kitchen_messages.kitchen_id AND s.user_id = auth.uid() AND s.is_active
  )
);

DROP POLICY IF EXISTS "kitchen_messages_insert" ON public.kitchen_messages;
CREATE POLICY "kitchen_messages_insert" ON public.kitchen_messages FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.kitchen_staff s
    WHERE s.kitchen_id = kitchen_messages.kitchen_id AND s.user_id = auth.uid() AND s.is_active
  )
);

-- 4. Grant anon/authenticated access to tables (PostgREST)
GRANT SELECT ON public.kitchen_menu_items TO anon, authenticated;
GRANT SELECT ON public.kitchens TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kitchen_menu_items TO authenticated;
GRANT SELECT, INSERT ON public.kitchen_messages TO authenticated;
GRANT SELECT ON public.kitchen_messages TO authenticated;
