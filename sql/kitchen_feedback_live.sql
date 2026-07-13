-- =============================================================================
-- Kitchen Feedback Live — run AFTER kitchen_full_setup.sql + kitchen_rls_fix.sql
-- Enables guest Flavor Log with photo/video + live feed on visitor page
-- =============================================================================

ALTER TABLE public.kitchen_feedback
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text'
    CHECK (media_type IN ('text','image','video','mixed'));

-- Public read for live guest feed (insert still requires auth or anonymous guest)
DROP POLICY IF EXISTS "kitchen_feedback_public_read" ON public.kitchen_feedback;
CREATE POLICY "kitchen_feedback_public_read" ON public.kitchen_feedback
  FOR SELECT USING (true);

GRANT SELECT, INSERT ON public.kitchen_feedback TO anon, authenticated;

-- Realtime — new feedback appears live on guest page
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kitchen_feedback'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_feedback;
  END IF;
END $$;
