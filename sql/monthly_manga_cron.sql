-- ==========================================
-- Circle D Flow: Monthly Manga Archiver
-- ==========================================
-- This script requires the pg_cron extension to be enabled in Supabase.
-- It schedules a job to run at 23:59 on the last day of every month ('L').

-- 1. Enable the pg_cron extension (Required for scheduling)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the Manga Archive Table (if not exists)
CREATE TABLE IF NOT EXISTS public.manga_archives (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID NOT NULL REFERENCES public.user_quests(id) ON DELETE CASCADE,
    archive_month DATE NOT NULL,
    content_dump TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Schedule the Cron Job
SELECT cron.schedule(
  'monthly-manga-archive', 
  '0 0 1 * *', -- 00:00 on the 1st day of every month
  $$
    -- Step A: Aggregate all chronicles for the PREVIOUS month into the archive table
    WITH month_data AS (
        SELECT 
            area_id, 
            string_agg(user_name || ' [' || to_char(created_at, 'DD.MM HH24:MI') || ']: ' || content, E'\n\n') as aggregated_comments 
        FROM public.chronicles 
        WHERE created_at >= date_trunc('month', current_date - interval '1 month')
          AND created_at < date_trunc('month', current_date)
        GROUP BY area_id
    )
    INSERT INTO public.manga_archives (area_id, archive_month, content_dump)
    SELECT area_id, date_trunc('month', current_date - interval '1 month'), aggregated_comments 
    FROM month_data;

    -- Step B: Clear the old chronicles feed
    -- This ensures the live feed is fresh, while the old data is safely stored in manga_archives
    DELETE FROM public.chronicles 
    WHERE created_at < date_trunc('month', current_date);
  $$
);

-- Note: To view active cron jobs, run:
-- SELECT * FROM cron.job;
