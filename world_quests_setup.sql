-- 1. Create the `user_quests` table for User-Generated Content (Beacons)
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    reward_exp INT DEFAULT 50, // Default for user beacons
    created_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT DEFAULT 'beacon' -- 'beacon', 'story', 'guild'
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read Access (Everyone can see/play quests)
CREATE POLICY "Quests are visible to everyone" 
ON public.user_quests FOR SELECT 
USING (true);

-- 4. Policy: Authenticated Insert Access (Only logged-in users can create)
CREATE POLICY "Only Navigators can drop beacons" 
ON public.user_quests FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

-- 5. Policy: Creator Delete Access (Only the creator can remove their beacon)
CREATE POLICY "Creators can remove their own beacons" 
ON public.user_quests FOR DELETE 
USING (auth.uid() = creator_id);

-- Optional: Add Index for Geospatial queries if needed later
CREATE INDEX MediaType_Latitude_Longitude ON public.user_quests (latitude, longitude);
