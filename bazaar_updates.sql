-- 1. Ensure profiles have the necessary columns for the tutorial and tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tut_market_forge BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tut_market_first_upload BOOLEAN DEFAULT false;

-- 2. Create a function to securely increment a user's Flow Credits wallet
CREATE OR REPLACE FUNCTION increment_wallet_fc(u_id UUID, amount BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Allows function to bypass RLS
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = u_id;
END;
$$;

-- Note: Ensure that your users, listings, and trades tables are created and RLS is enabled as per the plan.
