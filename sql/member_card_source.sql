-- Track how members claimed their card (web join vs membership login / direct)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_card_source TEXT;

COMMENT ON COLUMN public.profiles.member_card_source IS
  'Claim path tag: botanica | direct | member_card | web-ig | login | …';

CREATE INDEX IF NOT EXISTS profiles_member_card_source_idx
  ON public.profiles (member_card_source)
  WHERE member_card_source IS NOT NULL;
