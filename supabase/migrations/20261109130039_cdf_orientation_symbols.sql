-- Private extension of the existing CDF identity; no EXP/FLOW or role changes.
begin;
create table public.cdf_member_orientation (
 member_id uuid primary key references public.profiles(id) on delete cascade,
 interests text[] not null default '{}' check(cardinality(interests)<=3 and interests <@ array['music','visual','video','creator','support','wisdom','dance','sport','merchant','food']::text[]),
 participation text not null check(participation in ('discover','contribute','collaborate')),
 beta_interest boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.cdf_member_symbols (
 member_id uuid not null references public.profiles(id) on delete cascade,
 symbol_id text not null,
 earned_at timestamptz not null default now(),
 source text not null,
 primary key(member_id,symbol_id),
 check(symbol_id='orientation-first-step-v1' and source='flowee-orientation-v1')
);
alter table public.cdf_member_orientation enable row level security;
alter table public.cdf_member_symbols enable row level security;
revoke all on public.cdf_member_orientation,public.cdf_member_symbols from public,anon,authenticated;
grant select,insert,update,delete on public.cdf_member_orientation,public.cdf_member_symbols to service_role;

-- Only the verified server handler can invoke this. A single transaction saves
-- answers and inserts the fixed collectible once, including concurrent retries.
create function public.cdf_complete_orientation(p_member uuid,p_interests text[],p_mode text,p_beta_interest boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare card text; granted integer; answer public.cdf_member_orientation%rowtype;
begin
 select member_card_public_id into card from public.profiles
 where id=p_member and member_card_claimed_at is not null and member_card_public_id is not null for update;
 if not found then raise exception 'Confirmed member card required' using errcode='P0002'; end if;
 if p_interests is null or p_mode is null or p_beta_interest is null or array_position(p_interests,null) is not null then
  raise exception 'Invalid orientation' using errcode='22023';
 end if;
 insert into public.cdf_member_orientation(member_id,interests,participation,beta_interest)
 values(p_member,p_interests,p_mode,p_beta_interest)
 on conflict(member_id) do update set interests=excluded.interests,participation=excluded.participation,beta_interest=excluded.beta_interest,updated_at=now()
 returning * into answer;
 insert into public.cdf_member_symbols(member_id,symbol_id,source)
 values(p_member,'orientation-first-step-v1','flowee-orientation-v1') on conflict(member_id,symbol_id) do nothing;
 get diagnostics granted=row_count;
 return jsonb_build_object('memberId',p_member,'cardPublicId',card,
 'orientation',jsonb_build_object('interests',answer.interests,'mode',answer.participation,'betaInterest',answer.beta_interest),
 'symbols',(select coalesce(jsonb_agg(jsonb_build_object('id',s.symbol_id,'earnedAt',s.earned_at) order by s.earned_at),'[]'::jsonb) from public.cdf_member_symbols s where s.member_id=p_member),
 'newSymbol',granted=1);
end;$$;
revoke all on function public.cdf_complete_orientation(uuid,text[],text,boolean) from public,anon,authenticated;
grant execute on function public.cdf_complete_orientation(uuid,text[],text,boolean) to service_role;
comment on table public.cdf_member_orientation is 'Private voluntary preferences. Beta interest is a wish, not an application or role grant.';
comment on table public.cdf_member_symbols is 'Account-bound cosmetic collectibles. No points, paid membership or access rights.';
commit;
