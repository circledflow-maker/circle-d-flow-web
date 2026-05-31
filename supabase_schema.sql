-- Supabase Database Schema for Circle D Flow

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role_calling TEXT, -- e.g., 'Visionary', 'Griot', etc.
    guild TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events." ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update events." ON public.events FOR UPDATE USING (auth.uid() = created_by);

-- 3. Event Participants
CREATE TABLE IF NOT EXISTS public.event_participants (
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_role TEXT, -- e.g., 'Host', 'Attendee'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (event_id, user_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event participants viewable by everyone." ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Users can join events." ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave events." ON public.event_participants FOR DELETE USING (auth.uid() = user_id);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by everyone." ON public.projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create projects." ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update projects." ON public.projects FOR UPDATE USING (auth.uid() = created_by);

-- 5. Project Members
CREATE TABLE IF NOT EXISTS public.project_members (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members viewable by everyone." ON public.project_members FOR SELECT USING (true);
CREATE POLICY "Users can join projects." ON public.project_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave projects." ON public.project_members FOR DELETE USING (auth.uid() = user_id);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
