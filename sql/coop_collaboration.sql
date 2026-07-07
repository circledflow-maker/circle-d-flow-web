-- Coop Collaboration — shared projects, invites, C4C event rewards
-- Run once in Supabase SQL Editor

-- Optional columns (safe if already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flow_credits INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- ---------------------------------------------------------------------------
-- C4C / Last Event attendance — KyheartLx core team (adjust usernames if needed)
-- ---------------------------------------------------------------------------
UPDATE public.profiles
SET
  exp = GREATEST(COALESCE(exp, 0), 350),
  karma = GREATEST(COALESCE(karma, 0), 120),
  flow_credits = GREATEST(COALESCE(flow_credits, 0), 50),
  level = GREATEST(COALESCE(level, 1), FLOOR(GREATEST(COALESCE(exp, 0), 350) / 200.0)::int + 1)
WHERE lower(username) IN (
  'naru', 'naru_the_token', 'naruthetoken', 'naru the token',
  'c-riz', 'criz', 'c_riz', 'c-rizlx',
  'kyheartlx', 'kyheart', 'dark'
)
OR lower(username) LIKE '%naru%'
OR lower(username) LIKE '%criz%'
OR lower(username) LIKE '%c-riz%';

-- ---------------------------------------------------------------------------
-- Shared Coop projects (Resonance Bar)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coop_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Session',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coop_project_members (
  project_id UUID REFERENCES public.coop_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_slot TEXT NOT NULL,
  roles TEXT[] DEFAULT '{}',
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'left')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.coop_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_local_id TEXT NOT NULL,
  project_id UUID REFERENCES public.coop_projects(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitee_username TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coop_invites_invitee ON public.coop_invites(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_coop_invites_username ON public.coop_invites(lower(invitee_username), status);

ALTER TABLE public.coop_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coop_projects_select" ON public.coop_projects;
CREATE POLICY "coop_projects_select" ON public.coop_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "coop_projects_insert" ON public.coop_projects;
CREATE POLICY "coop_projects_insert" ON public.coop_projects FOR INSERT
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "coop_projects_update" ON public.coop_projects;
CREATE POLICY "coop_projects_update" ON public.coop_projects FOR UPDATE
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.coop_project_members m
  WHERE m.project_id = coop_projects.id AND m.user_id = auth.uid() AND m.status = 'active'
));

DROP POLICY IF EXISTS "coop_members_select" ON public.coop_project_members;
CREATE POLICY "coop_members_select" ON public.coop_project_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "coop_members_upsert" ON public.coop_project_members;
CREATE POLICY "coop_members_insert" ON public.coop_project_members FOR INSERT
WITH CHECK (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.coop_projects p WHERE p.id = project_id AND p.created_by = auth.uid()
));

DROP POLICY IF EXISTS "coop_members_update" ON public.coop_project_members;
CREATE POLICY "coop_members_update" ON public.coop_project_members FOR UPDATE
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.coop_projects p WHERE p.id = project_id AND p.created_by = auth.uid()
));

DROP POLICY IF EXISTS "coop_invites_select" ON public.coop_invites;
CREATE POLICY "coop_invites_select" ON public.coop_invites FOR SELECT USING (
  auth.uid() = inviter_id OR auth.uid() = invitee_id OR lower(invitee_username) = lower((SELECT username FROM public.profiles WHERE id = auth.uid() LIMIT 1))
);

DROP POLICY IF EXISTS "coop_invites_insert" ON public.coop_invites;
CREATE POLICY "coop_invites_insert" ON public.coop_invites FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "coop_invites_update" ON public.coop_invites;
CREATE POLICY "coop_invites_update" ON public.coop_invites FOR UPDATE
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

-- Verify team profiles after reward
SELECT id, username, exp, karma, flow_credits, level
FROM public.profiles
WHERE lower(username) LIKE '%naru%'
   OR lower(username) LIKE '%criz%'
   OR lower(username) LIKE '%c-riz%'
   OR lower(username) LIKE '%kyheart%'
ORDER BY username;
