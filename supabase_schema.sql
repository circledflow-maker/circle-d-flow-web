-- Supabase Schema for Circle D Flow (Heart World & Global Data)
-- Run this in the Supabase SQL Editor

-- 1. Profiles Table (Extended User Data)
-- Connects to Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  guild text,
  role_calling text,
  exp integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 2. Events Table (For Jam Sessions, Meetups, etc.)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date timestamp with time zone,
  location text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone."
  ON public.events FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can create events."
  ON public.events FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- 3. Projects Table (For collaborative community documentations)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text default 'planning',
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by everyone."
  ON public.projects FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can create projects."
  ON public.projects FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- 4. Event Participants Table (Linking users and roles to events)
CREATE TABLE IF NOT EXISTS public.event_participants (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id),
  event_role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event participants are viewable by everyone."
  ON public.event_participants FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can join events."
  ON public.event_participants FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- 5. Project Members Table (Linking users and roles to projects)
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id),
  project_role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members are viewable by everyone."
  ON public.project_members FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can join projects."
  ON public.project_members FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- Trigger to automatically create a profile when a new user signs up via auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, guild, role_calling)
  values (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'guild',
    new.raw_user_meta_data->>'role_calling'
  );
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
