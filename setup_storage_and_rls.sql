-- Set up storage bucket for artifact visuals
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artifact-visuals', 'artifact-visuals', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for artifact-visuals
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'artifact-visuals');

CREATE POLICY "Authenticated users can upload visuals" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'artifact-visuals' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own visuals" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id = 'artifact-visuals' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own visuals" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'artifact-visuals' AND auth.uid() = owner);

-- Ensure RLS is enabled on market_items
ALTER TABLE public.market_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read market items
CREATE POLICY "Anyone can read market items"
ON public.market_items FOR SELECT
USING (true);

-- Allow authenticated users to insert market items
CREATE POLICY "Users can insert market items"
ON public.market_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);

-- Allow users to update their own market items
CREATE POLICY "Users can update own market items"
ON public.market_items FOR UPDATE
USING (auth.uid() = creator_id);

-- Allow users to delete their own market items
CREATE POLICY "Users can delete own market items"
ON public.market_items FOR DELETE
USING (auth.uid() = creator_id);
