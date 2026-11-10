-- Review/setup candidate only. NOT applied to a hosted project.
-- Convert through the project's migration workflow before release.
begin;
create table public.cdf_private_journal (
 member_id uuid not null references auth.users(id) on delete cascade,
 id uuid not null,
 kind text not null check (kind in ('sanctuary','encounter','reflection')),
 title text not null check (char_length(btrim(title)) between 1 and 80),
 note text not null default '' check (char_length(note)<=1000),
 occurred_at timestamptz,
 created_at timestamptz not null default now(),
 source text generated always as ('self_reported'::text) stored,
 primary key (member_id,id)
);
create index cdf_private_journal_owner_time on public.cdf_private_journal(member_id,created_at desc,id);
alter table public.cdf_private_journal enable row level security;
revoke all on public.cdf_private_journal from public,anon,authenticated;
grant select,delete on public.cdf_private_journal to authenticated;
grant insert(member_id,id,kind,title,note,occurred_at) on public.cdf_private_journal to authenticated;
grant update(kind,title,note,occurred_at) on public.cdf_private_journal to authenticated;
create policy journal78_owner_select on public.cdf_private_journal for select to authenticated
 using ((select auth.uid())=member_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy journal78_owner_insert on public.cdf_private_journal for insert to authenticated
 with check ((select auth.uid())=member_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy journal78_owner_update on public.cdf_private_journal for update to authenticated
 using ((select auth.uid())=member_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false')
 with check ((select auth.uid())=member_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy journal78_owner_delete on public.cdf_private_journal for delete to authenticated
 using ((select auth.uid())=member_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
comment on table public.cdf_private_journal is 'Private self-reported memories. Not verified attendance, encounters, XP or rewards.';
commit;
