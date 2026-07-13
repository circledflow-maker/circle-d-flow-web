-- Kitchen daily close reports (Tagesabschluss)
CREATE TABLE IF NOT EXISTS kitchen_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (kitchen_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_kitchen_daily_reports_kitchen_date
  ON kitchen_daily_reports (kitchen_id, report_date DESC);

ALTER TABLE kitchen_daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kitchen_daily_reports_select ON kitchen_daily_reports;
CREATE POLICY kitchen_daily_reports_select ON kitchen_daily_reports
  FOR SELECT USING (true);

DROP POLICY IF EXISTS kitchen_daily_reports_insert ON kitchen_daily_reports;
CREATE POLICY kitchen_daily_reports_insert ON kitchen_daily_reports
  FOR INSERT WITH CHECK (true);
