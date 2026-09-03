-- Lapa 71 x Tagus Drop Rhythm — Member & Jam Registration
-- Event constant: lapa71-tagus-drop-20260829
-- Apply in Supabase SQL editor or via migration.

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null default 'lapa71-tagus-drop-20260829',
  source text not null default 'social_join',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'waitlist', 'cancelled')),

  -- Section 1
  full_name text not null,
  stage_name text,
  phone text not null,
  email text not null,
  instagram_handle text,

  -- Section 2
  disciplines text[] not null default '{}',
  discipline_other text,

  -- Section 3
  attending_aug29 boolean,
  jam_interested boolean,

  -- Section 4 (conditional jam)
  jam_perform_style text
    check (jam_perform_style is null or jam_perform_style in ('solo', 'jam_with_musicians', 'freestyle')),
  jam_instruments text,
  jam_song_details text,
  jam_backing_track boolean,

  admin_notes text,
  profile_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists event_registrations_event_id_idx
  on public.event_registrations (event_id);

create index if not exists event_registrations_email_idx
  on public.event_registrations (lower(email));

create index if not exists event_registrations_status_idx
  on public.event_registrations (status);

create index if not exists event_registrations_created_at_idx
  on public.event_registrations (created_at desc);

create or replace function public.set_event_registrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_event_registrations_updated_at on public.event_registrations;
create trigger trg_event_registrations_updated_at
  before update on public.event_registrations
  for each row
  execute function public.set_event_registrations_updated_at();

alter table public.event_registrations enable row level security;

-- Public / social form: anyone can insert a registration
drop policy if exists "anon_insert_event_registrations" on public.event_registrations;
create policy "anon_insert_event_registrations"
  on public.event_registrations
  for insert
  to anon, authenticated
  with check (true);

-- Optional: authenticated admins can select later (role claim or email allow-list)
drop policy if exists "authenticated_select_event_registrations" on public.event_registrations;
create policy "authenticated_select_event_registrations"
  on public.event_registrations
  for select
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Service role bypasses RLS (used by /api/register-event and /api/admin-registrations).
-- Full auth claim / shadow profile linking happens at login; event_registrations is source of truth.

comment on table public.event_registrations is
  'Lapa71 / social join registrations. Source of truth before auth claim. profile_id optional until login or auth.admin.createUser.';
