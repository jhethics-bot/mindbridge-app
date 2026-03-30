-- Medication schedules (set by caregiver)
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  caregiver_id UUID NOT NULL REFERENCES profiles(id),
  medication_name TEXT NOT NULL,
  dosage TEXT,
  schedule_times JSONB NOT NULL DEFAULT '[]',
  days_of_week JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]',
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medication_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES medication_schedules(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  scheduled_time TIME NOT NULL,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'missed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own medications" ON medication_schedules
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Caregivers manage medications" ON medication_schedules
  FOR ALL USING (caregiver_id = auth.uid());
CREATE POLICY "Patients view own confirmations" ON medication_confirmations
  FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Patients confirm own medications" ON medication_confirmations
  FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Caregivers manage confirmations" ON medication_confirmations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM medication_schedules ms WHERE ms.id = schedule_id AND ms.caregiver_id = auth.uid())
  );

CREATE INDEX idx_med_schedules_patient ON medication_schedules(patient_id);
CREATE INDEX idx_med_confirmations_schedule ON medication_confirmations(schedule_id);
CREATE INDEX idx_med_confirmations_status ON medication_confirmations(status, created_at);
