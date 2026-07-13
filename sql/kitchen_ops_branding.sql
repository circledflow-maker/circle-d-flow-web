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
