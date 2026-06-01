-- Run this in your Supabase SQL Editor to create the flow_comments table
CREATE TABLE IF NOT EXISTS public.flow_comments (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    area_id UUID NOT NULL, -- References the flow area this comment belongs to
    user_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.flow_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments
CREATE POLICY "Enable read access for all users" ON public.flow_comments
    FOR SELECT USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Enable insert for authenticated users only" ON public.flow_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
