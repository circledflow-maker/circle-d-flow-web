-- Flow Orbit: locations, events, saves (shared Member Feed + Admin Flow Control)
-- Apply in Supabase SQL editor if not yet migrated.

CREATE TABLE IF NOT EXISTS public.flow_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  city TEXT DEFAULT 'Lisbon',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cover_image TEXT,
  instagram_url TEXT,
  website_url TEXT,
  map_url TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | coming_soon | archived
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.flow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location_id UUID REFERENCES public.flow_locations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'community', -- jam | concert | workshop | exhibition | community
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming | starting_soon | live | sold_out | completed | recap
  visibility TEXT NOT NULL DEFAULT 'members', -- public | members
  min_membership_tier TEXT NOT NULL DEFAULT 'registered',
  member_benefit TEXT,
  cta_label TEXT DEFAULT 'Save event',
  cta_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  show_in_feed BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.flow_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- event | benefit | location | partner
  item_id TEXT NOT NULL,   -- uuid or slug/code
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS flow_events_date_idx ON public.flow_events(event_date DESC);
CREATE INDEX IF NOT EXISTS flow_events_feed_idx ON public.flow_events(show_in_feed, is_active, is_featured);
CREATE INDEX IF NOT EXISTS flow_events_status_idx ON public.flow_events(status);
CREATE INDEX IF NOT EXISTS flow_locations_slug_idx ON public.flow_locations(slug);
CREATE INDEX IF NOT EXISTS flow_saves_user_idx ON public.flow_saves(user_id);

ALTER TABLE public.flow_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flow_saves_own_select" ON public.flow_saves;
DROP POLICY IF EXISTS "flow_saves_own_insert" ON public.flow_saves;
DROP POLICY IF EXISTS "flow_saves_own_delete" ON public.flow_saves;

CREATE POLICY "flow_saves_own_select"
  ON public.flow_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "flow_saves_own_insert"
  ON public.flow_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "flow_saves_own_delete"
  ON public.flow_saves FOR DELETE USING (auth.uid() = user_id);

-- Seed Lapa71 + sample Wako event
INSERT INTO public.flow_locations (name, slug, description, address, city, latitude, longitude, instagram_url, map_url, is_featured, sort_order)
VALUES (
  'Lapa71',
  'lapa71',
  'Community space · music · movement · connection in Lisbon.',
  'Lapa, Lisbon',
  'Lisbon',
  38.7139,
  -9.1603,
  'https://www.instagram.com/wako.kungo/',
  'https://maps.google.com/?q=Lapa+Lisbon',
  true,
  10
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO public.flow_events (
  title, slug, description, event_date, start_time, location_id,
  event_type, status, visibility, min_membership_tier, member_benefit,
  cta_label, is_featured, show_in_feed, sort_order
)
SELECT
  'Wako Kungo Live · Tagus Drop',
  'wako-kungo-live-lapa71',
  'A night of music, movement and connection. Artists. Community. Flow.',
  DATE '2026-09-27',
  TIME '20:00',
  l.id,
  'concert',
  'upcoming',
  'members',
  'registered',
  'Early entry · Community benefit',
  'Save event',
  true,
  true,
  10
FROM public.flow_locations l
WHERE l.slug = 'lapa71'
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  event_date = EXCLUDED.event_date,
  start_time = EXCLUDED.start_time,
  status = EXCLUDED.status,
  show_in_feed = true,
  is_featured = true,
  updated_at = now();

COMMENT ON TABLE public.flow_events IS 'Flow Orbit event cards — same data for Member Feed + Admin Flow Control';
COMMENT ON TABLE public.flow_locations IS 'Venues / Flow Points / community spaces';
COMMENT ON TABLE public.flow_saves IS 'My Flow — saved events, benefits, locations, partners';
