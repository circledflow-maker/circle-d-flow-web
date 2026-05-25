-- Supabase Setup Script for Persistent Dice Rolls
-- Run this in your Supabase SQL Editor

-- Create the table to store the roll results
CREATE TABLE IF NOT EXISTS user_rolls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    event_id TEXT NOT NULL,
    rolled_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure a user can only have ONE roll per event
ALTER TABLE user_rolls ADD CONSTRAINT unique_user_event_roll UNIQUE (email, event_id);

-- Enable Row Level Security (RLS) but allow the Netlify backend to bypass it
ALTER TABLE user_rolls ENABLE ROW LEVEL SECURITY;

-- Allow read/write access from the backend (which uses the anon/service key)
CREATE POLICY "Allow anon insert" ON user_rolls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select" ON user_rolls FOR SELECT USING (true);
