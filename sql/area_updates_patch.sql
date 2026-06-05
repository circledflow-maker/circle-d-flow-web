-- 1. Create Chronicles Table
CREATE TABLE IF NOT EXISTS public.chronicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID NOT NULL REFERENCES public.user_quests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on Chronicles
ALTER TABLE public.chronicles ENABLE ROW LEVEL SECURITY;

-- Chronicles Policies
-- Anyone can read chronicles
CREATE POLICY "Anyone can read chronicles"
    ON public.chronicles FOR SELECT
    USING (true);

-- Authenticated users can insert chronicles
CREATE POLICY "Authenticated users can insert chronicles"
    ON public.chronicles FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own chronicles
CREATE POLICY "Users can delete own chronicles"
    ON public.chronicles FOR DELETE
    USING (auth.uid() = user_id);

-- 3. RLS for Flow Areas (user_quests) Delete
-- Assuming user_quests already has RLS enabled. We add a DELETE policy.
CREATE POLICY "Creators can delete their own areas"
    ON public.user_quests FOR DELETE
    USING (auth.uid() = creator_id);

-- 4. Enable Realtime for Chronicles
-- Note: If this fails, you can enable Realtime for 'chronicles' directly in the Supabase Dashboard UI 
-- under Database -> Publications -> supabase_realtime.
BEGIN;
  -- Try adding the table to the publication directly
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chronicles;
COMMIT;
