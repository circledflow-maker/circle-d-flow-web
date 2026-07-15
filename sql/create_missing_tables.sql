-- Create performance_details table
CREATE TABLE IF NOT EXISTS public.performance_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id TEXT REFERENCES public.master_artists(id) ON DELETE CASCADE,
    event_id UUID,
    performance_category TEXT,
    technical_needs TEXT,
    artifact_of_power TEXT,
    inspiration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create service_inventories table
CREATE TABLE IF NOT EXISTS public.service_inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id TEXT REFERENCES public.master_artists(id) ON DELETE CASCADE,
    event_id UUID,
    product_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    price NUMERIC DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure master_artists has the new columns
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS flow_credits INTEGER DEFAULT 0;
ALTER TABLE public.master_artists ADD COLUMN IF NOT EXISTS community_cut_percentage INTEGER;

-- Enable RLS and add policies if needed (allowing public access for the event context)
ALTER TABLE public.performance_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read performance_details" ON public.performance_details FOR SELECT USING (true);
CREATE POLICY "Allow public insert performance_details" ON public.performance_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update performance_details" ON public.performance_details FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.service_inventories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read service_inventories" ON public.service_inventories FOR SELECT USING (true);
CREATE POLICY "Allow public insert service_inventories" ON public.service_inventories FOR INSERT WITH CHECK (true);
