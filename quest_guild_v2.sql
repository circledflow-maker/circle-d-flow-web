-- Quest Guild V2: Enhanced Schema Setup
-- Run this in your Supabase SQL Editor to enable Karma, Comms, and Brotherhood logic.

-- 1. Enable Realtime triggers for user_quests and comms_messages
-- (Ensure 'supabase_realtime' publication exists and includes these tables)
begin;
  -- If not already enabled, add tables to publication
  alter publication supabase_realtime add table user_quests;
  alter publication supabase_realtime add table comms_messages;
commit;

-- 2. Enhance 'user_quests' table
ALTER TABLE public.user_quests 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'community', -- 'story' or 'community'
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;       -- Karma count

-- 3. Enhance 'profiles' table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_quests TEXT[] DEFAULT '{}'; -- Array of Quest IDs

-- 4. Create 'brotherhood_links' table (Friendships)
CREATE TABLE IF NOT EXISTS public.brotherhood_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create 'comms_messages' table (Chat)
CREATE TABLE IF NOT EXISTS public.comms_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.brotherhood_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comms_messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Brotherhood Links: Users can see links they are involved in
CREATE POLICY "Links visible to participants" ON public.brotherhood_links 
    FOR ALL USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Comms Messages: Users can see messages they sent or received
CREATE POLICY "Messages visible to participants" ON public.comms_messages 
    FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Finish
