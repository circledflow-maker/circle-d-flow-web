-- Adinkra museum collection (optional Supabase sync)
-- Run in Supabase SQL editor when ready for cloud persistence

CREATE TABLE IF NOT EXISTS user_adinkra_symbols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol_id text NOT NULL,
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  source text,
  cycle_day smallint,
  resonance_level int,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol_id)
);

ALTER TABLE user_adinkra_symbols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own adinkra symbols"
  ON user_adinkra_symbols FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own adinkra symbols"
  ON user_adinkra_symbols FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own adinkra symbols"
  ON user_adinkra_symbols FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_adinkra_user ON user_adinkra_symbols(user_id);
