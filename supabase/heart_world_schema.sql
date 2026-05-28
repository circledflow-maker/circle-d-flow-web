-- Supabase Schema for The Heart World

-- 1. Users & Guilds
CREATE TABLE IF NOT EXISTS heart_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE NOT NULL,
    guild_role TEXT NOT NULL, -- e.g., Rapper, Lyriker, Poet, Creator, Painter, Seller
    points INT DEFAULT 0,
    has_ygdrasil_access BOOLEAN DEFAULT FALSE,
    avatar_url TEXT
);

-- 2. Mission Board
CREATE TABLE IF NOT EXISTS heart_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_id UUID REFERENCES heart_users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    exp_reward INT DEFAULT 20,
    status TEXT DEFAULT 'open', -- open, accepted, completed
    accepted_by UUID REFERENCES heart_users(id)
);

-- 3. Jam Sessions & Events (Bantaba Sync)
CREATE TABLE IF NOT EXISTS heart_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_id UUID REFERENCES heart_users(id),
    title TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    is_public_to_bantaba BOOLEAN DEFAULT FALSE,
    attendees UUID[] -- Array of user IDs
);

-- 4. Bazar (Activity Board / Market)
CREATE TABLE IF NOT EXISTS heart_bazar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_id UUID REFERENCES heart_users(id),
    item_name TEXT NOT NULL,
    description TEXT,
    price_tags TEXT,
    image_url TEXT,
    exp_reward INT DEFAULT 5
);

-- 5. Map Pins & Healing Points (LUVO / QR Codes)
CREATE TABLE IF NOT EXISTS heart_map_pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_id UUID REFERENCES heart_users(id),
    location_name TEXT NOT NULL,
    coordinates TEXT, -- lat,lng
    purpose TEXT, -- Healing Point, Gathering, etc.
    timer_minutes INT DEFAULT 15, -- Wu Wei timer: 5, 15, or 30
    qr_code_data TEXT UNIQUE NOT NULL
);

-- 6. Healing Point Visits (Tracking who chilled where)
CREATE TABLE IF NOT EXISTS heart_healing_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES heart_users(id),
    pin_id UUID REFERENCES heart_map_pins(id),
    timer_completed BOOLEAN DEFAULT FALSE,
    exp_earned INT DEFAULT 0
);

-- 7. Team Builder (LFG)
CREATE TABLE IF NOT EXISTS heart_lfg (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_id UUID REFERENCES heart_users(id),
    project_title TEXT NOT NULL,
    roles_needed TEXT[] NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open'
);

-- 8. Wish & Feedback Board
CREATE TABLE IF NOT EXISTS heart_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creator_id UUID REFERENCES heart_users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    upvotes INT DEFAULT 0
);
