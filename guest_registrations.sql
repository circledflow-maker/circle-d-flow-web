-- Table: guest_registrations
CREATE TABLE IF NOT EXISTS guest_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES quests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE guest_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration)
CREATE POLICY "Allow public insert to guest_registrations"
    ON guest_registrations
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to read (for the analytics modal to fetch the list)
CREATE POLICY "Allow public read from guest_registrations"
    ON guest_registrations
    FOR SELECT
    USING (true);
