-- =============================================================================
-- Circle D Flow — Supabase Gap Check (run in SQL Editor)
-- Shows which tables exist and what you still need to run.
-- IMPORTANT: Paste the FULL .sql files below — NOT comment-only snippets!
-- =============================================================================

-- Expected tables for current app features
WITH expected AS (
  SELECT unnest(ARRAY[
    'profiles',
    'bookings',
    'kitchens',
    'kitchen_menu_items',
    'kitchen_orders',
    'kitchen_staff',
    'kitchen_messages',
    'kitchen_vouchers',
    'kitchen_gamification_rules',
    'coop_projects',
    'coop_invites',
    'coop_project_members',
    'theater_media',
    'sanctuary_media',
    'system_settings'
  ]) AS table_name
),
existing AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
)
SELECT
  e.table_name,
  CASE WHEN x.table_name IS NOT NULL THEN 'OK' ELSE 'MISSING — run migration below' END AS status
FROM expected e
LEFT JOIN existing x ON x.table_name = e.table_name
ORDER BY status DESC, e.table_name;

-- -----------------------------------------------------------------------------
-- RUN ORDER (copy each ENTIRE file from repo into a new query tab):
-- -----------------------------------------------------------------------------
-- 1. sql/triad_pipeline_setup.sql          (guilds, profiles columns — base)
-- 2. sql/coop_collaboration.sql            (Resonance Bar team sync)
-- 3. sql/bookings_setup.sql                (photo session bookings)
-- 4. sql/kitchen_pipeline_setup.sql        (Akwaba kitchen ops)
-- 5. sql/supabase_profile_aliases_wakungo.sql (Naru + C-riz profiles)
-- 6. sql/theater_cinema.sql                (Vision Studio uploads — optional)
-- 7. sql/deployment_hotfix.sql             (if system_settings 406 errors)
--
-- After kitchen owner signs up:
-- UPDATE public.kitchens SET owner_user_id = '<uuid>' WHERE slug = 'akwabalx';
--
-- Realtime — run sql/kitchen_live_sync.sql (menu + orders + messages)
-- Or Dashboard → Database → Replication → add kitchen_menu_items, kitchen_orders
