-- 1. Create Market Items Table
CREATE TABLE IF NOT EXISTS public.market_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    item_type TEXT DEFAULT 'digital', -- event, service, merch, digital
    price_fiat DECIMAL(10,2),
    price_credits INTEGER,
    image_url TEXT,
    guild_category TEXT DEFAULT 'products', -- arts, skills, sounds, healing, services, products
    external_link TEXT,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Market Items
ALTER TABLE public.market_items ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view items
CREATE POLICY "Market public view" ON public.market_items FOR SELECT USING (true);

-- Policy: Only authenticated users can insert (Creator)
CREATE POLICY "Market insert auth" ON public.market_items FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policy: Creators can update their own items
CREATE POLICY "Market update own" ON public.market_items FOR UPDATE USING (auth.uid() = creator_id);


-- 2. Create Market Inquiries Table (Leads)
CREATE TABLE IF NOT EXISTS public.market_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.market_items(id), -- Linked to item
    creator_id UUID REFERENCES auth.users(id), -- Linked to seller
    guest_contact TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending', -- pending, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Inquiries
ALTER TABLE public.market_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can insert (Guests sending leads)
CREATE POLICY "Inquiry insert public" ON public.market_inquiries FOR INSERT WITH CHECK (true);

-- Policy: Creators can view inquiries for them
CREATE POLICY "Inquiry select own" ON public.market_inquiries FOR SELECT USING (auth.uid() = creator_id);

-- Policy: Creators can update status
CREATE POLICY "Inquiry update own" ON public.market_inquiries FOR UPDATE USING (auth.uid() = creator_id);


-- 3. Storage Bucket for Market Artifacts
-- Note: You must create the bucket 'market-artifacts' in the Supabase Dashboard UI first!
-- Check the 'Public' checkbox when creating it.

-- Policy: Anyone can view images (if bucket is public, this might be auto-handled, but good to ensure)
-- (Run this in the Storage Policy Editor if needed, or via SQL if enabled)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'market-artifacts' );

-- Policy: Authenticated users can upload
-- CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'market-artifacts' AND auth.role() = 'authenticated' );

-- 4. View Counter Function (RPC) - Optional but recommended for atomic updates
CREATE OR REPLACE FUNCTION increment_market_views(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE market_items
  SET views = views + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
