-- 1. PROFILES: Allow users to update their own profiles (needed for avatar & name changes)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. MARKET_ITEMS: Allow users to insert and update their own items
DROP POLICY IF EXISTS "Users can insert own items" ON public.market_items;
CREATE POLICY "Users can insert own items" 
ON public.market_items FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update own items" ON public.market_items;
CREATE POLICY "Users can update own items" 
ON public.market_items FOR UPDATE 
USING (auth.uid() = creator_id);

-- 3. STORAGE: Create the bucket if missing, and allow public reads & authenticated uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artifact-visuals', 'artifact-visuals', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public View Artifact Visuals" ON storage.objects;
CREATE POLICY "Public View Artifact Visuals"
ON storage.objects FOR SELECT
USING ( bucket_id = 'artifact-visuals' );

DROP POLICY IF EXISTS "Users can upload Artifact Visuals" ON storage.objects;
CREATE POLICY "Users can upload Artifact Visuals"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'artifact-visuals' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update Artifact Visuals" ON storage.objects;
CREATE POLICY "Users can update Artifact Visuals"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'artifact-visuals' AND auth.role() = 'authenticated' );
