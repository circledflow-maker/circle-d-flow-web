-- 1. Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_xp INTEGER DEFAULT 10,
    reward_points INTEGER DEFAULT 5,
    creator_id UUID REFERENCES auth.users(id),
    creator_name TEXT,
    qr_code_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create flow_areas table
CREATE TABLE IF NOT EXISTS public.flow_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    lat NUMERIC,
    lng NUMERIC,
    image_url TEXT,
    qr_code_data TEXT,
    creator_id UUID REFERENCES auth.users(id),
    creator_name TEXT,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS and create basic policies
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_areas ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Public profiles are viewable by everyone."
ON public.quests FOR SELECT
USING ( true );

CREATE POLICY "Flow areas are viewable by everyone."
ON public.flow_areas FOR SELECT
USING ( true );

-- Allow authenticated users to insert
CREATE POLICY "Users can insert their own quests."
ON public.quests FOR INSERT
WITH CHECK ( auth.uid() = creator_id );

CREATE POLICY "Users can insert their own flow areas."
ON public.flow_areas FOR INSERT
WITH CHECK ( auth.uid() = creator_id );

-- Allow updates (like incrementing scan_count for flow areas, or updating quests)
CREATE POLICY "Users can update flow areas."
ON public.flow_areas FOR UPDATE
USING ( true ); -- We allow public updates for scan counts, normally should be restricted to a server function.

CREATE POLICY "Users can update quests."
ON public.quests FOR UPDATE
USING ( true );
