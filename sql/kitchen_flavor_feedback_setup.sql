-- =============================================================================
-- Circle D Flow — Flavor Quests + Kitchen Feedback (append to kitchen_full_setup)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 10. FLAVOR QUEST DEFINITIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flavor_quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    quest_type TEXT NOT NULL CHECK (quest_type IN ('order','feedback','scan','share','streak','visit')),
    xp_reward INTEGER DEFAULT 100,
    flow_reward INTEGER DEFAULT 0,
    karma_reward INTEGER DEFAULT 0,
    kitchen_slug TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flavor_quest_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL REFERENCES public.flavor_quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','claimable','completed')),
    progress JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, quest_id)
);

-- -----------------------------------------------------------------------------
-- 11. KITCHEN FEEDBACK SESSIONS (Flavor Log + photo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kitchen_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kitchen_id UUID REFERENCES public.kitchens(id) ON DELETE SET NULL,
    kitchen_slug TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    photo_url TEXT,
    quest_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kitchen_feedback_kitchen ON public.kitchen_feedback(kitchen_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flavor_progress_user ON public.flavor_quest_progress(user_id, quest_id);

ALTER TABLE public.flavor_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavor_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flavor_quests_read" ON public.flavor_quests;
CREATE POLICY "flavor_quests_read" ON public.flavor_quests FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "flavor_progress_own" ON public.flavor_quest_progress;
CREATE POLICY "flavor_progress_own" ON public.flavor_quest_progress FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kitchen_feedback_insert" ON public.kitchen_feedback;
CREATE POLICY "kitchen_feedback_insert" ON public.kitchen_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "kitchen_feedback_read_own" ON public.kitchen_feedback;
CREATE POLICY "kitchen_feedback_read_own" ON public.kitchen_feedback FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.kitchens k WHERE k.id = kitchen_id AND k.owner_user_id = auth.uid()
));

-- -----------------------------------------------------------------------------
-- 12. SEED — Flavor Quests (linked to kitchen actions)
-- -----------------------------------------------------------------------------
INSERT INTO public.flavor_quests (id, title, description, quest_type, xp_reward, flow_reward, kitchen_slug, config, sort_order) VALUES
('LQ-FQ01', 'The First Bite', 'Order any main dish from a Taste World kitchen.', 'order', 100, 15, 'akwabalx', '{"min_items":1,"category":"main"}', 1),
('LQ-FQ02', 'Flavor Log', 'Leave feedback with photo in the Flavor Log.', 'feedback', 150, 20, 'akwabalx', '{"requires_photo":true}', 2),
('LQ-FQ03', 'Kitchen QR Pulse', 'Download kitchen QR or share via WhatsApp.', 'share', 80, 10, 'akwabalx', '{}', 3),
('LQ-FQ04', 'Soul Ticket Scan', 'Complete pickup — Soul Ticket scanned at bar.', 'scan', 120, 15, 'akwabalx', '{}', 4),
('LQ-FQ05', 'The Regular', 'Order 3 times within 7 days.', 'streak', 500, 50, NULL, '{"orders_required":3,"days":7}', 5),
('LQ-FQ06', 'Taste Radar Discovery', 'Open Taste Radar and enter a kitchen from the swipe deck.', 'visit', 60, 10, NULL, '{"page":"taste_radar"}', 6)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    quest_type = EXCLUDED.quest_type,
    xp_reward = EXCLUDED.xp_reward,
    flow_reward = EXCLUDED.flow_reward,
    config = EXCLUDED.config;

-- -----------------------------------------------------------------------------
-- 13. QUEST FULFILL HELPER (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flavor_fulfill_quest(
    p_user_id UUID,
    p_quest_id TEXT,
    p_progress JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quest public.flavor_quests%ROWTYPE;
    v_existing public.flavor_quest_progress%ROWTYPE;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'no user');
    END IF;

    SELECT * INTO v_quest FROM public.flavor_quests WHERE id = p_quest_id AND is_active LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'quest not found');
    END IF;

    SELECT * INTO v_existing FROM public.flavor_quest_progress
    WHERE user_id = p_user_id AND quest_id = p_quest_id LIMIT 1;

    IF FOUND AND v_existing.status = 'completed' THEN
        RETURN jsonb_build_object('ok', false, 'msg', 'already completed');
    END IF;

    INSERT INTO public.flavor_quest_progress (user_id, quest_id, status, progress, completed_at)
    VALUES (p_user_id, p_quest_id, 'completed', p_progress, NOW())
    ON CONFLICT (user_id, quest_id) DO UPDATE SET
        status = 'completed',
        progress = EXCLUDED.progress,
        completed_at = NOW();

    UPDATE public.profiles SET
        exp = COALESCE(exp, 0) + v_quest.xp_reward,
        karma = COALESCE(karma, 0) + v_quest.karma_reward,
        flow_credits = COALESCE(flow_credits, 0) + v_quest.flow_reward,
        level = GREATEST(COALESCE(level, 1), FLOOR((COALESCE(exp, 0) + v_quest.xp_reward) / 200.0)::int + 1)
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'ok', true,
        'quest_id', p_quest_id,
        'xp', v_quest.xp_reward,
        'flow', v_quest.flow_reward,
        'karma', v_quest.karma_reward
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 14. TASTE RADAR — show_on_radar flag
-- -----------------------------------------------------------------------------
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS show_on_radar BOOLEAN DEFAULT true;

UPDATE public.kitchens SET show_on_radar = true WHERE slug = 'akwabalx';

-- Realtime (optional):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_feedback;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.flavor_quest_progress;
