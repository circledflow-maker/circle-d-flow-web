-- Create theater_media table
CREATE TABLE IF NOT EXISTS public.theater_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id TEXT,
    uploader_name TEXT,
    title TEXT,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'video', -- 'video' or 'image'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create theater_comments table
CREATE TABLE IF NOT EXISTS public.theater_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID REFERENCES public.theater_media(id) ON DELETE CASCADE,
    commenter_id TEXT,
    commenter_name TEXT,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and add public access policies
ALTER TABLE public.theater_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read theater_media" ON public.theater_media FOR SELECT USING (true);
CREATE POLICY "Allow public insert theater_media" ON public.theater_media FOR INSERT WITH CHECK (true);

ALTER TABLE public.theater_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read theater_comments" ON public.theater_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert theater_comments" ON public.theater_comments FOR INSERT WITH CHECK (true);
