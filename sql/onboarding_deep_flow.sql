-- Update profiles and master_artists with EXP and Flow Credits
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flow_credits INTEGER DEFAULT 0;

ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS flow_credits INTEGER DEFAULT 0;
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS community_cut_percentage INTEGER;

-- Update performance_details with deep flow questions
ALTER TABLE public.performance_details ADD COLUMN IF NOT EXISTS artifact_of_power TEXT;
ALTER TABLE public.performance_details ADD COLUMN IF NOT EXISTS inspiration TEXT;

-- Update service_inventories with category if needed, but for now we'll just use the existing columns or add category
ALTER TABLE public.service_inventories ADD COLUMN IF NOT EXISTS category TEXT;
