-- Migration: Companion Pets Phase 1
-- Tables: companion_pets, pet_interactions
-- RLS policies + feature toggle column
-- Generated: 2026-03-21

-- ============================================
-- TABLE 1: companion_pets
-- ============================================
CREATE TABLE IF NOT EXISTS companion_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_relationship_id UUID NOT NULL REFERENCES care_relationships(id) ON DELETE CASCADE,
  pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat', 'bird', 'bunny')),
  pet_name TEXT NOT NULL,
  color_primary TEXT NOT NULL DEFAULT 'golden',
  color_secondary TEXT,
  caregiver_voice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companion_pets_care_relationship
  ON companion_pets(care_relationship_id);

-- ============================================
-- TABLE 2: pet_interactions
-- ============================================
CREATE TABLE IF NOT EXISTS pet_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES companion_pets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN ('pet', 'feed', 'play', 'greet', 'goodnight')
  ),
  mood_at_interaction INT CHECK (mood_at_interaction BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_interactions_pet_id
  ON pet_interactions(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_interactions_patient_date
  ON pet_interactions(patient_id, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE companion_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_interactions ENABLE ROW LEVEL SECURITY;

-- companion_pets: patients can view their own pet
CREATE POLICY "patient_view_own_pet"
  ON companion_pets FOR SELECT
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE patient_id = auth.uid()
    )
  );

-- companion_pets: caregivers can manage pets for their patients
CREATE POLICY "caregiver_manage_pet"
  ON companion_pets FOR ALL
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- pet_interactions: patients can insert and view their own interactions
CREATE POLICY "patient_manage_interactions"
  ON pet_interactions FOR ALL
  USING (patient_id = auth.uid());

-- pet_interactions: caregivers can view interactions for their patients
CREATE POLICY "caregiver_view_interactions"
  ON pet_interactions FOR SELECT
  USING (
    pet_id IN (
      SELECT cp.id FROM companion_pets cp
      JOIN care_relationships cr ON cr.id = cp.care_relationship_id
      WHERE cr.caregiver_id = auth.uid()
    )
  );

-- ============================================
-- FEATURE TOGGLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_toggles'
    AND column_name = 'companion_pet_enabled'
  ) THEN
    ALTER TABLE feature_toggles ADD COLUMN companion_pet_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- ============================================
-- SEED TEST DATA
-- ============================================
DO $$
DECLARE
  v_care_rel_id UUID;
  v_patient_id UUID;
BEGIN
  SELECT id INTO v_patient_id
  FROM profiles
  WHERE email = 'testpatient@mindbridge.app'
  LIMIT 1;

  IF v_patient_id IS NOT NULL THEN
    SELECT id INTO v_care_rel_id
    FROM care_relationships
    WHERE patient_id = v_patient_id
    LIMIT 1;

    IF v_care_rel_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM companion_pets WHERE care_relationship_id = v_care_rel_id
    ) THEN
      INSERT INTO companion_pets (care_relationship_id, pet_type, pet_name, color_primary)
      VALUES (v_care_rel_id, 'dog', 'Biscuit', 'golden');

      RAISE NOTICE 'Seeded companion pet for test care relationship %', v_care_rel_id;
    END IF;
  END IF;
END $$;

-- ============================================
-- VERIFY
-- ============================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('companion_pets', 'pet_interactions');
