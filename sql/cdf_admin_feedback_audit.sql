-- Admin audit + feedback + monthly benefit redemptions (Circle D Flow)
create table if not exists public.cdf_admin_audit (
  id bigserial primary key,
  admin_user text not null,
  action text not null,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cdf_admin_audit_created_idx on public.cdf_admin_audit (created_at desc);
create index if not exists cdf_admin_audit_user_idx on public.cdf_admin_audit (admin_user);

create table if not exists public.cdf_admin_feedback (
  id bigserial primary key,
  admin_user text,
  kind text not null default 'feedback', -- feedback | error
  message text not null,
  page text,
  status text not null default 'open', -- open | reviewing | resolved | wontfix
  suggestion text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create index if not exists cdf_admin_feedback_status_idx on public.cdf_admin_feedback (status, created_at desc);

create table if not exists public.cdf_benefit_redemptions (
  id bigserial primary key,
  code text not null,
  benefit_id text not null,
  member_number text,
  user_id uuid,
  month_key text not null,
  used_at timestamptz not null default now(),
  redeemed_by text,
  unique (code, month_key)
);

create index if not exists cdf_benefit_redemptions_month_idx
  on public.cdf_benefit_redemptions (month_key, benefit_id);

alter table public.cdf_admin_audit enable row level security;
alter table public.cdf_admin_feedback enable row level security;
alter table public.cdf_benefit_redemptions enable row level security;
