-- Table: gdrive_artists
CREATE TABLE IF NOT EXISTS public.gdrive_artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gdrive_folder_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: gdrive_chapters
CREATE TABLE IF NOT EXISTS public.gdrive_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id TEXT REFERENCES public.gdrive_artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    gdrive_folder_id TEXT,
    chapter_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: gdrive_files
CREATE TABLE IF NOT EXISTS public.gdrive_files (
    id TEXT PRIMARY KEY,
    chapter_id UUID REFERENCES public.gdrive_chapters(id) ON DELETE CASCADE,
    artist_id TEXT REFERENCES public.gdrive_artists(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL, -- 'image' or 'video'
    file_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Policies
ALTER TABLE public.gdrive_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdrive_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdrive_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on gdrive_artists" ON public.gdrive_artists FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on gdrive_chapters" ON public.gdrive_chapters FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access on gdrive_files" ON public.gdrive_files FOR SELECT TO public USING (true);
