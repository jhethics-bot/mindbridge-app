CREATE TABLE IF NOT EXISTS care_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  caregiver_id UUID NOT NULL REFERENCES profiles(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('hydration_critical', 'hydration_low', 'medication_missed', 'inactivity', 'mood_decline')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE care_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers view own alerts" ON care_alerts
  FOR SELECT USING (caregiver_id = auth.uid());
CREATE POLICY "System creates alerts" ON care_alerts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Caregivers dismiss alerts" ON care_alerts
  FOR UPDATE USING (caregiver_id = auth.uid());

CREATE INDEX idx_care_alerts_caregiver ON care_alerts(caregiver_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  caregiver_id UUID NOT NULL REFERENCES profiles(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  narrative TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregivers view own reports" ON weekly_reports
  FOR SELECT USING (caregiver_id = auth.uid());
CREATE INDEX idx_weekly_reports_caregiver ON weekly_reports(caregiver_id, week_start DESC);
