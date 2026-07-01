-- Daily activity tracking (steps / distance) per navigator
CREATE TABLE IF NOT EXISTS public.daily_activity (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    steps INTEGER DEFAULT 0,
    distance_m NUMERIC(10,2) DEFAULT 0,
    quests_touched INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, activity_date)
);

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own daily activity"
ON public.daily_activity FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users upsert own daily activity"
ON public.daily_activity FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own daily activity"
ON public.daily_activity FOR UPDATE
USING (auth.uid() = id);

-- Collected Adinkra runes (collectible / skill unlocks)
CREATE TABLE IF NOT EXISTS public.user_runes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rune_id TEXT NOT NULL,
    sphere TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, rune_id)
);

ALTER TABLE public.user_runes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own runes"
ON public.user_runes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own runes"
ON public.user_runes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System health + user error reports
CREATE TABLE IF NOT EXISTS public.system_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

ALTER TABLE public.system_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit reports"
ON public.system_reports FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read own feedback reports"
ON public.system_reports FOR SELECT
TO authenticated
USING (
    report_type = 'health_scan'
    OR (payload->>'user_id')::uuid = auth.uid()
);
