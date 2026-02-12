-- 1. Table for Friendships (Connections)
create table if not exists connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  friend_id uuid references auth.users not null,
  status text default 'pending', -- pending, accepted
  created_at timestamp with time zone default now()
);

-- 2. Table for the Library (User Library)
create table if not exists library (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  item_id text not null, -- ID of the song/text
  type text default 'lore',
  added_at timestamp with time zone default now()
);

-- 3. Table for User-Created Quests
create table if not exists user_quests (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users not null,
  title text not null,
  description text,
  reward_exp int default 50,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 4. Ensure profiles have quest tracking and Genesis data.
alter table profiles add column if not exists current_quest_id text default 'q1_intro';
alter table profiles add column if not exists class text default 'Explorer';
alter table profiles add column if not exists xp bigint default 0;
alter table profiles add column if not exists credits bigint default 0;
alter table profiles add column if not exists metadata jsonb default '{}'::jsonb;
alter table profiles add column if not exists updated_at timestamp with time zone default now();
