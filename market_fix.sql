-- 1. BASIS: PROFIL-TABELLE ERSTELLEN
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  xp BIGINT DEFAULT 0,
  credits BIGINT DEFAULT 0,
  class TEXT DEFAULT 'Explorer',
  current_quest_id TEXT DEFAULT 'q1_intro',
  tut_market_forge BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AUTOMATIK: PROFILE BEI SIGNUP ERSTELLEN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. MARKTPLATZ: TABELLEN & VIEWS
CREATE TABLE IF NOT EXISTS public.market_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    price_fiat DECIMAL(10,2),
    price_credits INTEGER,
    image_url TEXT,
    guild_category TEXT DEFAULT 'products', 
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.market_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public View" ON public.market_items;
CREATE POLICY "Public View" ON public.market_items FOR SELECT USING (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.market_items_with_vendor AS
SELECT m.id, m.title, m.description, m.price_fiat, m.price_credits as price_flow, m.image_url, m.guild_category as category, m.is_active, m.created_at, p.full_name as vendor_name, p.xp as vendor_karma, p.id as vendor_id
FROM public.market_items m
JOIN public.profiles p ON m.creator_id = p.id;

-- 4. LOGIK: WALLET-FUNKTION
CREATE OR REPLACE FUNCTION increment_wallet_fc(u_id UUID, amount BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET credits = credits + amount WHERE id = u_id;
END;
$$;
