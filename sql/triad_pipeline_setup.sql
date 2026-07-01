-- =============================================================================
-- Circle D Flow — Triad Pipeline (run once in Supabase SQL Editor)
-- Order: triad_pipeline_setup.sql → daily_activity_setup.sql (if not yet run)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. GUILDS & BROTHERHOOD
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guilds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL UNIQUE,
    description TEXT,
    leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    flow_treasury INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guilds_select_public" ON public.guilds;
CREATE POLICY "guilds_select_public" ON public.guilds FOR SELECT USING (true);

DROP POLICY IF EXISTS "guilds_insert_leader" ON public.guilds;
CREATE POLICY "guilds_insert_leader" ON public.guilds FOR INSERT
WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "guilds_update_leader" ON public.guilds;
CREATE POLICY "guilds_update_leader" ON public.guilds FOR UPDATE
USING (auth.uid() = leader_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guild_id UUID REFERENCES public.guilds(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.guild_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id UUID REFERENCES public.guilds(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invitee_username TEXT NOT NULL,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guild_invites_select" ON public.guild_invites;
CREATE POLICY "guild_invites_select" ON public.guild_invites FOR SELECT USING (true);

DROP POLICY IF EXISTS "guild_invites_insert" ON public.guild_invites;
CREATE POLICY "guild_invites_insert" ON public.guild_invites FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "guild_invites_update" ON public.guild_invites;
CREATE POLICY "guild_invites_update" ON public.guild_invites FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 2. FLOW AREAS (Atlas anchors / QR zones)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    lat NUMERIC,
    lng NUMERIC,
    image_url TEXT,
    qr_code_data TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_name TEXT,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.flow_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flow_areas_select" ON public.flow_areas;
CREATE POLICY "flow_areas_select" ON public.flow_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "flow_areas_insert" ON public.flow_areas;
CREATE POLICY "flow_areas_insert" ON public.flow_areas FOR INSERT
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "flow_areas_update_owner" ON public.flow_areas;
CREATE POLICY "flow_areas_update_owner" ON public.flow_areas FOR UPDATE
USING (auth.uid() = creator_id OR auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 3. USER QUESTS (Codex forge — community beacons)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    reward_exp INTEGER DEFAULT 50,
    type TEXT DEFAULT 'beacon',
    area_id UUID REFERENCES public.flow_areas(id) ON DELETE SET NULL,
    guild_category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_quests_select" ON public.user_quests;
CREATE POLICY "user_quests_select" ON public.user_quests FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_quests_insert" ON public.user_quests;
CREATE POLICY "user_quests_insert" ON public.user_quests FOR INSERT
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "user_quests_delete" ON public.user_quests;
CREATE POLICY "user_quests_delete" ON public.user_quests FOR DELETE
USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_user_quests_geo ON public.user_quests (latitude, longitude);

-- -----------------------------------------------------------------------------
-- 4. ADINKRA SYMBOL REGISTRY (reference — @see adinkra.org)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.adinkra_symbols (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    meaning TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    glyph_char TEXT
);

ALTER TABLE public.adinkra_symbols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adinkra_symbols_read" ON public.adinkra_symbols;
CREATE POLICY "adinkra_symbols_read" ON public.adinkra_symbols FOR SELECT USING (true);

INSERT INTO public.adinkra_symbols (id, name, meaning, category, glyph_char) VALUES
('adinkrahene', 'Adinkrahene', 'Charisma, leadership, greatness', 'wisdom', '◎'),
('gye_nyame', 'Gye Nyame', 'Except God — supremacy of the divine', 'spirit', '✦'),
('sankofa', 'Sankofa', 'Return and get it — learn from the past', 'wisdom', '↻'),
('akoma', 'Akoma', 'Heart — patience, tolerance, love', 'virtue', '♥'),
('akoben', 'Akoben', 'War horn — vigilance, readiness', 'alert', '⚑'),
('asase_ye_duru', 'Asase Ye Duru', 'The earth has weight — divinity of Earth', 'earth', '⊕'),
('boa_me', 'Boa Me Na Me Mmoa Wo', 'Help me and let me help you — cooperation', 'unity', '⇄'),
('bese_saka', 'Bese Saka', 'Sack of cola nuts — abundance, wealth', 'commerce', '◉'),
('duafe', 'Duafe', 'Wooden comb — beauty, cleanliness', 'beauty', '⌇'),
('eban', 'Eban', 'Fence — security, safety of home', 'protection', '▣'),
('fihankra', 'Fihankra', 'House/compound — safe haven', 'protection', '⌂'),
('funtunfunefu', 'Funtunfunefu Denkyemfunefu', 'Siamese crocodiles — unity in diversity', 'unity', '⋈'),
('hwe_mu_dua', 'Hwe Mu Dua', 'Measuring stick — excellence, quality', 'craft', '│'),
('kintinkantan', 'Kintinkantan', 'Bent and twisted — arrogance (avoid)', 'warning', '∿'),
('mmusuyidee', 'Mmusuyidee', 'Sack of talismans — good fortune', 'luck', '✧'),
('mpatapo', 'Mpatapo', 'Knot of reconciliation — peacemaking', 'peace', '∞'),
('nea_onnim', 'Nea Onnim', 'He who does not know — lifelong learning', 'wisdom', '?'),
('nkonsonnkonson', 'Nkonsonnkonson', 'Chain links — unity, community', 'unity', '⛓'),
('nkyinkyim', 'Nkyinkyim', 'Twisting — initiative, dynamism', 'motion', '∿'),
('nsaa', 'Nsaa', 'Woven cloth — authenticity, excellence', 'craft', '▦'),
('nyansapo', 'Nyansapo', 'Wisdom knot — intelligence, wisdom', 'wisdom', '✿'),
('osram', 'Osram Ne Nsoromma', 'Moon and star — love, faithfulness', 'love', '☽'),
('sesa_wo_suban', 'Sesa Wo Suban', 'Change your character — transformation', 'growth', '↺'),
('wawa_aba', 'Wawa Aba', 'Seed of the wawa tree — perseverance', 'strength', '❧'),
('aya', 'Aya', 'Fern — endurance, resourcefulness', 'strength', '⌘'),
('ananse', 'Ananse Ntontan', 'Spider web — wisdom, creativity', 'wisdom', '⊛'),
('akofena', 'Akofena', 'Sword of war — courage, valor', 'battle', '⚔'),
('dame_dame', 'Dame-Dame', 'Chequered board — intelligence, ingenuity', 'strategy', '▤'),
('bi_nka_bi', 'Bi Nka Bi', 'No one should bite another — peace, harmony', 'peace', '☮'),
('akoma_ntoso', 'Akoma Ntoso', 'Linked hearts — understanding, agreement', 'love', '♡'),
('ese_ne_tekrema', 'Ese Ne Tekrema', 'Teeth and tongue — friendship, interdependence', 'friendship', '☺')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    meaning = EXCLUDED.meaning,
    category = EXCLUDED.category,
    glyph_char = EXCLUDED.glyph_char;

-- -----------------------------------------------------------------------------
-- 5. USER RUNES (synced from Atlas GPS collection)
--    Safe if daily_activity_setup.sql already created user_runes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_runes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rune_id TEXT NOT NULL,
    sphere TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_runes ADD COLUMN IF NOT EXISTS venue_id TEXT;
ALTER TABLE public.user_runes ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze';
ALTER TABLE public.user_runes ADD COLUMN IF NOT EXISTS rune_name TEXT;

UPDATE public.user_runes SET venue_id = rune_id WHERE venue_id IS NULL;
UPDATE public.user_runes SET tier = 'bronze' WHERE tier IS NULL;

ALTER TABLE public.user_runes DROP CONSTRAINT IF EXISTS user_runes_user_id_rune_id_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_runes_user_venue_tier_key'
    ) THEN
        ALTER TABLE public.user_runes
        ADD CONSTRAINT user_runes_user_venue_tier_key UNIQUE (user_id, venue_id, tier);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'user_runes unique constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_runes_rune_id_fkey'
    ) THEN
        ALTER TABLE public.user_runes
        ADD CONSTRAINT user_runes_rune_id_fkey
        FOREIGN KEY (rune_id) REFERENCES public.adinkra_symbols(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'user_runes FK skipped (orphan rune_id rows): %', SQLERRM;
END $$;

ALTER TABLE public.user_runes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_runes_select" ON public.user_runes;
CREATE POLICY "user_runes_select" ON public.user_runes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_runes_insert" ON public.user_runes;
CREATE POLICY "user_runes_insert" ON public.user_runes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_runes_update" ON public.user_runes;
CREATE POLICY "user_runes_update" ON public.user_runes FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. SANCTUARY ONBOARDING (artist_sanctuary Flowee guide state)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sanctuary_onboarding (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_completed BOOLEAN DEFAULT false,
    deep_flow_completed BOOLEAN DEFAULT false,
    last_news_at TIMESTAMPTZ,
    payload JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sanctuary_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sanctuary_onboarding_own" ON public.sanctuary_onboarding;
CREATE POLICY "sanctuary_onboarding_own" ON public.sanctuary_onboarding FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 7. BATTLEFIELD (optional — guild tag on nodes)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'battlefield_nodes') THEN
        ALTER TABLE public.battlefield_nodes ADD COLUMN IF NOT EXISTS controller_guild TEXT;
    END IF;
END $$;
