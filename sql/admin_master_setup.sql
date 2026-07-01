-- Grant AdminMaster to primary operator (run once in Supabase SQL editor)
-- Access: all sphere worlds. XP / level / karma still earned normally.

UPDATE public.profiles
SET flow_class = 'AdminMaster'
WHERE lower(username) = 'dark'
   OR lower(email) = 'circle.d.flow@gmail.com';

-- Optional: verify
SELECT id, username, email, flow_class, level, exp, karma
FROM public.profiles
WHERE lower(username) = 'dark' OR lower(email) = 'circle.d.flow@gmail.com';
