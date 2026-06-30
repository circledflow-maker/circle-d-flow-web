-- Ensure creators can hard-delete their own market items (run once in Supabase SQL editor)
DROP POLICY IF EXISTS "Users can delete own market items" ON public.market_items;
CREATE POLICY "Users can delete own market items"
ON public.market_items FOR DELETE
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete own items" ON public.market_items;
CREATE POLICY "Users can delete own items"
ON public.market_items FOR DELETE
USING (auth.uid() = creator_id);
