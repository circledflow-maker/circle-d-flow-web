-- Deployment hotfix: run once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.theater_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id TEXT,
    uploader_name TEXT,
    title TEXT,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.theater_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "theater_media_read" ON public.theater_media;
CREATE POLICY "theater_media_read" ON public.theater_media FOR SELECT USING (true);
DROP POLICY IF EXISTS "theater_media_insert_auth" ON public.theater_media;
CREATE POLICY "theater_media_insert_auth" ON public.theater_media FOR INSERT WITH CHECK (true);

ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS flow_credits INTEGER DEFAULT 0;
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS community_cut_percentage INTEGER;
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS contact_details JSONB;

CREATE TABLE IF NOT EXISTS public.daily_activity (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    steps INTEGER DEFAULT 0,
    distance_m INTEGER DEFAULT 0,
    quests_touched INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id, activity_date)
);

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_activity_own" ON public.daily_activity;
CREATE POLICY "daily_activity_own" ON public.daily_activity FOR ALL
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
