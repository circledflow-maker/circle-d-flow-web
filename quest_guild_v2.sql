-- ==========================================
-- 1. DIE CREW-TABELLE (Guilds)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.guilds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL UNIQUE, -- z.B. C4C, LX99, WU
    description TEXT,
    leader_id UUID REFERENCES auth.users(id),
    flow_treasury INTEGER DEFAULT 0, -- Die gemeinsame Kasse der Crew
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Sicherheit)
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;

-- Jeder darf die Crews sehen
DROP POLICY IF EXISTS "Crews sind öffentlich" ON public.guilds;
CREATE POLICY "Crews sind öffentlich" ON public.guilds FOR SELECT USING (true);

-- Nur eingeloggte User dürfen eine Crew gründen
DROP POLICY IF EXISTS "Agenten dürfen Crews gründen" ON public.guilds;
CREATE POLICY "Agenten dürfen Crews gründen" ON public.guilds FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- ==========================================
-- 2. PROFILE UPGRADE (Crew-Zugehörigkeit)
-- ==========================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS guild_id UUID REFERENCES public.guilds(id);

-- ==========================================
-- 3. GUILD INVITES (Einladungen)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.guild_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES auth.users(id),
    invitee_username TEXT NOT NULL, -- Wir laden über den Namen ein
    status TEXT DEFAULT 'pending',  -- pending, accepted, declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sicherheit
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;

-- Jeder darf Einladungen sehen (damit der Empfänger sie abrufen kann)
DROP POLICY IF EXISTS "Invites öffentlich lesbar" ON public.guild_invites;
CREATE POLICY "Invites öffentlich lesbar" ON public.guild_invites FOR SELECT USING (true);

-- Nur eingeloggte User dürfen einladen
DROP POLICY IF EXISTS "Agenten dürfen einladen" ON public.guild_invites;
CREATE POLICY "Agenten dürfen einladen" ON public.guild_invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Jeder darf den Status seiner Einladungen updaten (Akzeptieren/Ablehnen)
DROP POLICY IF EXISTS "Status Update erlaubt" ON public.guild_invites;
CREATE POLICY "Status Update erlaubt" ON public.guild_invites FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ==========================================
-- 4. BATTLEFIELD UPDATES (Guild Ownership)
-- ==========================================
ALTER TABLE public.battlefield_nodes
ADD COLUMN IF NOT EXISTS controller_guild TEXT; -- Stores the Tag like [C4C]
