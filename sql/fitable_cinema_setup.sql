-- Fitable gamification + Vision Cinema Stages (run in Supabase SQL editor)
-- Safe to re-run: uses IF NOT EXISTS

-- Legacy fitable table (optional — profiles.exp is primary)
CREATE TABLE IF NOT EXISTS public.fitable (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp integer DEFAULT 0,
    fp integer DEFAULT 0,
    wins integer DEFAULT 0,
    streak integer DEFAULT 0,
    last_battle_at timestamptz,
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.fitable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fitable_select_own" ON public.fitable;
CREATE POLICY "fitable_select_own" ON public.fitable FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "fitable_upsert_own" ON public.fitable;
CREATE POLICY "fitable_upsert_own" ON public.fitable FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Cinema Stage — GPS-tagged vision pin (50m radius)
CREATE TABLE IF NOT EXISTS public.cinema_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_name text,
    title text NOT NULL DEFAULT 'Cinema Stage',
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    cover_url text,
    media_type text DEFAULT 'image',
    comment_count integer DEFAULT 0,
    visit_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cinema_stages_geo_idx ON public.cinema_stages (lat, lng);

ALTER TABLE public.cinema_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cinema_stages_read_all" ON public.cinema_stages;
CREATE POLICY "cinema_stages_read_all" ON public.cinema_stages FOR SELECT USING (true);

DROP POLICY IF EXISTS "cinema_stages_insert_auth" ON public.cinema_stages;
CREATE POLICY "cinema_stages_insert_auth" ON public.cinema_stages FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "cinema_stages_update_own" ON public.cinema_stages;
CREATE POLICY "cinema_stages_update_own" ON public.cinema_stages FOR UPDATE USING (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS public.cinema_stage_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id uuid REFERENCES public.cinema_stages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    media_url text NOT NULL,
    media_type text DEFAULT 'image',
    caption text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cinema_stage_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cinema_uploads_read" ON public.cinema_stage_uploads;
CREATE POLICY "cinema_uploads_read" ON public.cinema_stage_uploads FOR SELECT USING (true);
DROP POLICY IF EXISTS "cinema_uploads_insert" ON public.cinema_stage_uploads;
CREATE POLICY "cinema_uploads_insert" ON public.cinema_stage_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cinema_stage_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id uuid REFERENCES public.cinema_stages(id) ON DELETE CASCADE,
    visitor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    visited_at timestamptz DEFAULT now()
);

ALTER TABLE public.cinema_stage_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cinema_visits_own" ON public.cinema_stage_visits;
CREATE POLICY "cinema_visits_own" ON public.cinema_stage_visits FOR ALL USING (auth.uid() = visitor_id) WITH CHECK (auth.uid() = visitor_id);

CREATE TABLE IF NOT EXISTS public.cinema_stage_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id uuid REFERENCES public.cinema_stages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    body text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cinema_stage_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cinema_comments_read" ON public.cinema_stage_comments;
CREATE POLICY "cinema_comments_read" ON public.cinema_stage_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "cinema_comments_insert" ON public.cinema_stage_comments;
CREATE POLICY "cinema_comments_insert" ON public.cinema_stage_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
