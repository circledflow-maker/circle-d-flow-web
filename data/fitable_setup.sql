-- Fitable Point System Table
-- This table persists the "5 Pillars" stats, XP, and battle records.

CREATE TABLE IF NOT EXISTS public.fitable (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_battle_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 5 Pillars (Base stats from Referee/Master Dashboard)
    stat_arcane INTEGER DEFAULT 0,
    stat_harmonizer INTEGER DEFAULT 0,
    stat_kinetic INTEGER DEFAULT 0,
    stat_visionary INTEGER DEFAULT 0,
    stat_alchemist INTEGER DEFAULT 0,
    
    -- Flow Points (Currency)
    fp INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.fitable ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see/edit their own data
CREATE POLICY "Users can view their own fitable stats." 
ON public.fitable FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own fitable stats." 
ON public.fitable FOR UPDATE 
USING (auth.uid() = id);

-- Function to handle new user creation (auto-insert into fitable)
CREATE OR REPLACE FUNCTION public.handle_new_user_fitable() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.fitable (id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created_fitable
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_fitable();
