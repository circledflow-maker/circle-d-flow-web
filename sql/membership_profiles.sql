-- Membership + member card fields on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'registered';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_card_public_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_card_claimed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_display_name TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_member_card_public_id_uidx
  ON public.profiles (member_card_public_id)
  WHERE member_card_public_id IS NOT NULL;

-- Users can update their own card / exp / display name
DROP POLICY IF EXISTS "profiles_update_own_membership_card" ON public.profiles;
CREATE POLICY "profiles_update_own_membership_card"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON COLUMN public.profiles.membership_tier IS 'registered | flow_supporter | flow_crew';
COMMENT ON COLUMN public.profiles.membership_status IS 'none | active | past_due | canceled';
