-- Wakungo login/profile mapping for known emails
-- Run in Supabase SQL Editor as project owner/admin.

begin;

-- Ensure both auth users have a profile row
insert into public.profiles (id, username, exp, karma, flow_credits, level)
select au.id,
       case
         when lower(au.email) = 'flashskaterboy@hotmail.com' then 'Narutoken'
         when lower(au.email) = 'rizzie.entertainment@gmail.com' then 'C-riz'
         else split_part(au.email, '@', 1)
       end as username,
       350, 120, 50, 2
from auth.users au
where lower(au.email) in ('flashskaterboy@hotmail.com', 'rizzie.entertainment@gmail.com')
on conflict (id) do nothing;

-- Update existing profiles for those emails
update public.profiles p
set username = case
      when lower(au.email) = 'flashskaterboy@hotmail.com' then 'Narutoken'
      when lower(au.email) = 'rizzie.entertainment@gmail.com' then 'C-riz'
      else p.username
    end,
    exp = greatest(coalesce(p.exp, 0), 350),
    karma = greatest(coalesce(p.karma, 0), 120),
    flow_credits = greatest(coalesce(p.flow_credits, 0), 50),
    level = greatest(coalesce(p.level, 1), 2),
    contact_details = coalesce(p.contact_details, '{}'::jsonb) || jsonb_build_object(
      'primary_email', au.email,
      'login_alias', case
        when lower(au.email) = 'flashskaterboy@hotmail.com' then 'Narutoken'
        when lower(au.email) = 'rizzie.entertainment@gmail.com' then 'C-riz'
        else p.username
      end
    )
from auth.users au
where p.id = au.id
  and lower(au.email) in ('flashskaterboy@hotmail.com', 'rizzie.entertainment@gmail.com');

commit;

-- Verify
select p.id, p.username, p.exp, p.karma, p.flow_credits, p.level, p.contact_details, au.email
from public.profiles p
join auth.users au on au.id = p.id
where lower(au.email) in ('flashskaterboy@hotmail.com', 'rizzie.entertainment@gmail.com')
order by au.email;
