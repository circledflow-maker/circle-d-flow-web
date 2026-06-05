-- ==========================================
-- HOTFIX: Correct Foreign Keys to 'flow_areas'
-- ==========================================

-- 1. Drop existing incorrect tables
DROP TABLE IF EXISTS public.manga_archives;
DROP TABLE IF EXISTS public.chronicles;

-- 2. Recreate Chronicles Table
CREATE TABLE public.chronicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID NOT NULL REFERENCES public.flow_areas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    content TEXT NOT NULL,
    media_url TEXT, -- Added for media upload support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Chronicles
ALTER TABLE public.chronicles ENABLE ROW LEVEL SECURITY;

-- Chronicles Policies
CREATE POLICY "Anyone can read chronicles" ON public.chronicles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert chronicles" ON public.chronicles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own chronicles" ON public.chronicles FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime for Chronicles (optional if already on)
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chronicles;
COMMIT;

-- 3. Recreate Manga Archives Table
CREATE TABLE public.manga_archives (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID NOT NULL REFERENCES public.flow_areas(id) ON DELETE CASCADE,
    archive_month DATE NOT NULL,
    content_dump TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Correct RLS Delete Policy for flow_areas (Creators can vanish their areas)
DROP POLICY IF EXISTS "Creators can delete their own areas" ON public.flow_areas;

CREATE POLICY "Creators can delete their own areas"
    ON public.flow_areas FOR DELETE
    USING (auth.uid() = creator_id);
