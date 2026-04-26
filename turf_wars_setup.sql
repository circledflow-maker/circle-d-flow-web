-- ==========================================
-- 1. PROFILE UPGRADE: THE 5 PILLARS & CLASSES
-- ==========================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS flow_class TEXT DEFAULT 'UNASSIGNED', -- Speaker, Weaver, Runner, Tagger, Oracle
ADD COLUMN IF NOT EXISTS pillar_signal INTEGER DEFAULT 5,    -- MCing / Charisma
ADD COLUMN IF NOT EXISTS pillar_frequency INTEGER DEFAULT 5, -- DJing / Tech
ADD COLUMN IF NOT EXISTS pillar_kinetic INTEGER DEFAULT 5,   -- B-Boying / Speed
ADD COLUMN IF NOT EXISTS pillar_visual INTEGER DEFAULT 5,    -- Graffiti / Defense
ADD COLUMN IF NOT EXISTS pillar_gnosis INTEGER DEFAULT 5,    -- Knowledge / Hacking Power
ADD COLUMN IF NOT EXISTS available_stat_points INTEGER DEFAULT 0; -- Points to distribute

-- ==========================================
-- 2. THE BATTLEFIELD: CONTROL NODES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.battlefield_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,                  -- e.g., "Praça do Comércio Mainframe"
    description TEXT,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    controller_id UUID REFERENCES auth.users(id), -- Who owns it? (NULL = System)
    controller_guild TEXT DEFAULT 'SYSTEM',       -- Which guild controls it?
    
    -- Defense Stats (The Firewall)
    base_firewall_hp INTEGER DEFAULT 1000,        -- Damage required to breach
    required_gnosis INTEGER DEFAULT 10,           -- Min Gnosis to attempt hack
    
    is_under_attack BOOLEAN DEFAULT false,
    last_hacked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.battlefield_nodes ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can SEE nodes
DROP POLICY IF EXISTS "Nodes are public visible" ON public.battlefield_nodes;
CREATE POLICY "Nodes are public visible" ON public.battlefield_nodes 
    FOR SELECT USING (true);

-- Policy: Authenticated Agents can UPDATE nodes (Hack)
DROP POLICY IF EXISTS "Agents can hack nodes" ON public.battlefield_nodes;
CREATE POLICY "Agents can hack nodes" ON public.battlefield_nodes 
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ==========================================
-- 3. INITIAL NODE INJECTION (LISBON)
-- ==========================================
INSERT INTO public.battlefield_nodes (title, description, latitude, longitude, base_firewall_hp, required_gnosis, controller_guild)
VALUES 
(
    'SECRET GARDEN LX', 
    'Hidden Oasis of Gnosis. A strongly encrypted nature-network in the heart of Lisbon. High hacking skills required.', 
    38.7160, -9.1430, 
    1500, 12, 'SYSTEM'
),
(
    'HEMPYROOTS (ROMA-AREEIRO)', 
    'Healing and Botany Nexus. Frequencies are extremely stable here. Good node for beginner hacks.', 
    38.7424, -9.1335, 
    800, 5, 'SYSTEM'
),
(
    'FAVELA LX (STA. APOLÓNIA)', 
    'Underground Cypher Node near the Docks. Raw kinetic energy, massive firewalls. Not for the faint of heart.', 
    38.7145, -9.1226, 
    2500, 18, 'SYSTEM'
);
