-- Migration: Nutrition & Hydration Module
-- Tables: meal_logs, meal_items, hydration_logs, hydration_settings, mind_scores,
--         meal_plans, grocery_lists, weight_logs
-- RLS policies, indexes, feature toggles, seed data
-- Generated: 2026-03-25

-- ============================================
-- DROP EXISTING (idempotent re-runs)
-- ============================================
DROP TABLE IF EXISTS weight_logs CASCADE;
DROP TABLE IF EXISTS grocery_lists CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS mind_scores CASCADE;
DROP TABLE IF EXISTS hydration_settings CASCADE;
DROP TABLE IF EXISTS hydration_logs CASCADE;
DROP TABLE IF EXISTS meal_items CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;

-- ============================================
-- TABLE 1: meal_logs
-- ============================================
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logged_by UUID REFERENCES profiles(id),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')) NOT NULL,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  food_categories TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_patient_id ON meal_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_meal_date ON meal_logs(meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_logs_patient_date ON meal_logs(patient_id, meal_date);

-- ============================================
-- TABLE 2: meal_items
-- ============================================
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id UUID REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_category TEXT NOT NULL,
  mind_category TEXT CHECK (mind_category IN ('brain_healthy', 'limit', 'neutral')),
  servings NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_log_id ON meal_items(meal_log_id);

-- ============================================
-- TABLE 3: hydration_logs
-- ============================================
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logged_by UUID REFERENCES profiles(id),
  drink_type TEXT DEFAULT 'water' CHECK (drink_type IN ('water', 'juice', 'tea', 'milk', 'broth', 'other')),
  amount_oz NUMERIC DEFAULT 8,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_patient_id ON hydration_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_hydration_logs_log_date ON hydration_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_hydration_logs_patient_date ON hydration_logs(patient_id, log_date);

-- ============================================
-- TABLE 4: hydration_settings
-- ============================================
CREATE TABLE IF NOT EXISTS hydration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_relationship_id UUID REFERENCES care_relationships(id) ON DELETE CASCADE,
  daily_target_oz NUMERIC DEFAULT 64,
  reminder_frequency_hours NUMERIC DEFAULT 2,
  quiet_hours_start TIME DEFAULT '21:00',
  quiet_hours_end TIME DEFAULT '07:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(care_relationship_id)
);

CREATE INDEX IF NOT EXISTS idx_hydration_settings_care_rel ON hydration_settings(care_relationship_id);

-- ============================================
-- TABLE 5: mind_scores
-- ============================================
CREATE TABLE IF NOT EXISTS mind_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 15),
  category_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_mind_scores_patient_id ON mind_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_mind_scores_week ON mind_scores(patient_id, week_start);

-- ============================================
-- TABLE 6: meal_plans
-- ============================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_relationship_id UUID REFERENCES care_relationships(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')) NOT NULL,
  meal_name TEXT,
  food_categories TEXT[] DEFAULT '{}',
  recipe_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(care_relationship_id, plan_date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_care_rel ON meal_plans(care_relationship_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(plan_date);

-- ============================================
-- TABLE 7: grocery_lists
-- ============================================
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_relationship_id UUID REFERENCES care_relationships(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(care_relationship_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_grocery_lists_care_rel ON grocery_lists(care_relationship_id);

-- ============================================
-- TABLE 8: weight_logs
-- ============================================
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logged_by UUID REFERENCES profiles(id),
  weight_lbs NUMERIC NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_patient_id ON weight_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON weight_logs(patient_id, log_date);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- meal_logs: patients read/insert own rows
CREATE POLICY "patient_read_own_meals" ON meal_logs FOR SELECT
  USING (patient_id = auth.uid());
CREATE POLICY "patient_insert_own_meals" ON meal_logs FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- meal_logs: caregivers read/insert/update for their patients
CREATE POLICY "caregiver_manage_meals" ON meal_logs FOR ALL
  USING (
    patient_id IN (
      SELECT patient_id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- meal_items: patients read own items via meal_log
CREATE POLICY "patient_read_own_meal_items" ON meal_items FOR SELECT
  USING (
    meal_log_id IN (SELECT id FROM meal_logs WHERE patient_id = auth.uid())
  );
CREATE POLICY "patient_insert_own_meal_items" ON meal_items FOR INSERT
  WITH CHECK (
    meal_log_id IN (SELECT id FROM meal_logs WHERE patient_id = auth.uid())
  );

-- meal_items: caregivers manage items for their patients' meals
CREATE POLICY "caregiver_manage_meal_items" ON meal_items FOR ALL
  USING (
    meal_log_id IN (
      SELECT id FROM meal_logs WHERE patient_id IN (
        SELECT patient_id FROM care_relationships WHERE caregiver_id = auth.uid()
      )
    )
  );

-- hydration_logs: patients read/insert own rows
CREATE POLICY "patient_read_own_hydration" ON hydration_logs FOR SELECT
  USING (patient_id = auth.uid());
CREATE POLICY "patient_insert_own_hydration" ON hydration_logs FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- hydration_logs: caregivers manage for their patients
CREATE POLICY "caregiver_manage_hydration" ON hydration_logs FOR ALL
  USING (
    patient_id IN (
      SELECT patient_id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- hydration_settings: caregivers manage via care_relationship
CREATE POLICY "caregiver_manage_hydration_settings" ON hydration_settings FOR ALL
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- hydration_settings: patients can read their own
CREATE POLICY "patient_read_own_hydration_settings" ON hydration_settings FOR SELECT
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE patient_id = auth.uid()
    )
  );

-- mind_scores: patients read own
CREATE POLICY "patient_read_own_mind_scores" ON mind_scores FOR SELECT
  USING (patient_id = auth.uid());
CREATE POLICY "patient_insert_own_mind_scores" ON mind_scores FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- mind_scores: caregivers manage for their patients
CREATE POLICY "caregiver_manage_mind_scores" ON mind_scores FOR ALL
  USING (
    patient_id IN (
      SELECT patient_id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- meal_plans: caregivers manage via care_relationship
CREATE POLICY "caregiver_manage_meal_plans" ON meal_plans FOR ALL
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- meal_plans: patients can read their plans
CREATE POLICY "patient_read_own_meal_plans" ON meal_plans FOR SELECT
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE patient_id = auth.uid()
    )
  );

-- grocery_lists: caregivers manage via care_relationship
CREATE POLICY "caregiver_manage_grocery_lists" ON grocery_lists FOR ALL
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- grocery_lists: patients can read
CREATE POLICY "patient_read_own_grocery_lists" ON grocery_lists FOR SELECT
  USING (
    care_relationship_id IN (
      SELECT id FROM care_relationships WHERE patient_id = auth.uid()
    )
  );

-- weight_logs: patients read/insert own
CREATE POLICY "patient_read_own_weight" ON weight_logs FOR SELECT
  USING (patient_id = auth.uid());
CREATE POLICY "patient_insert_own_weight" ON weight_logs FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- weight_logs: caregivers manage for their patients
CREATE POLICY "caregiver_manage_weight" ON weight_logs FOR ALL
  USING (
    patient_id IN (
      SELECT patient_id FROM care_relationships WHERE caregiver_id = auth.uid()
    )
  );

-- ============================================
-- FEATURE TOGGLES
-- feature_toggles table uses (patient_id, feature_key, is_enabled) pattern
-- ============================================
-- No schema changes needed; toggles are inserted per-patient via upsert.
-- The app will use feature_key values:
--   'nutrition_enabled' (default true)
--   'hydration_tracking_enabled' (default true)
--   'mind_diet_scoring_enabled' (default true)

-- ============================================
-- SEED TEST DATA
-- ============================================
DO $$
DECLARE
  v_patient_id UUID;
  v_caregiver_id UUID;
  v_care_rel_id UUID;
  v_meal_id UUID;
  v_day DATE;
  i INT;
BEGIN
  -- Get test patient
  SELECT id INTO v_patient_id
  FROM profiles
  WHERE email = 'testpatient@mindbridge.app'
  LIMIT 1;

  IF v_patient_id IS NULL THEN
    RAISE NOTICE 'Test patient not found, skipping seed data';
    RETURN;
  END IF;

  -- Get care relationship
  SELECT id, caregiver_id INTO v_care_rel_id, v_caregiver_id
  FROM care_relationships
  WHERE patient_id = v_patient_id
  LIMIT 1;

  IF v_care_rel_id IS NULL THEN
    RAISE NOTICE 'No care relationship found, skipping seed data';
    RETURN;
  END IF;

  -- Seed 7 days of meal_logs
  FOR i IN 0..6 LOOP
    v_day := CURRENT_DATE - i;

    -- Breakfast
    INSERT INTO meal_logs (patient_id, logged_by, meal_type, meal_date, food_categories)
    VALUES (v_patient_id, v_patient_id, 'breakfast', v_day,
      ARRAY['whole_grains', 'berries', 'olive_oil']);

    -- Lunch
    INSERT INTO meal_logs (patient_id, logged_by, meal_type, meal_date, food_categories)
    VALUES (v_patient_id, v_patient_id, 'lunch', v_day,
      ARRAY['leafy_greens', 'poultry', 'other_vegetables', 'nuts']);

    -- Dinner (skip some days for variety)
    IF i < 5 THEN
      INSERT INTO meal_logs (patient_id, logged_by, meal_type, meal_date, food_categories)
      VALUES (v_patient_id, v_patient_id, 'dinner', v_day,
        ARRAY['fish', 'whole_grains', 'other_vegetables', 'beans']);
    END IF;
  END LOOP;

  -- Seed 7 days of hydration_logs (4-8 drinks per day)
  FOR i IN 0..6 LOOP
    v_day := CURRENT_DATE - i;

    INSERT INTO hydration_logs (patient_id, logged_by, drink_type, amount_oz, log_date)
    VALUES
      (v_patient_id, v_patient_id, 'water', 8, v_day),
      (v_patient_id, v_patient_id, 'water', 8, v_day),
      (v_patient_id, v_patient_id, 'tea', 8, v_day),
      (v_patient_id, v_patient_id, 'water', 8, v_day);

    -- Extra drinks some days
    IF i < 4 THEN
      INSERT INTO hydration_logs (patient_id, logged_by, drink_type, amount_oz, log_date)
      VALUES
        (v_patient_id, v_patient_id, 'juice', 8, v_day),
        (v_patient_id, v_patient_id, 'water', 8, v_day);
    END IF;
  END LOOP;

  -- Seed hydration_settings
  INSERT INTO hydration_settings (care_relationship_id, daily_target_oz, reminder_frequency_hours)
  VALUES (v_care_rel_id, 64, 2)
  ON CONFLICT (care_relationship_id) DO NOTHING;

  -- Seed mind_scores for current week
  INSERT INTO mind_scores (patient_id, week_start, week_end, score, category_scores)
  VALUES (
    v_patient_id,
    date_trunc('week', CURRENT_DATE)::DATE,
    (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    9,
    '{"leafy_greens": 1, "other_vegetables": 1, "berries": 1, "nuts": 1, "beans": 0.5, "whole_grains": 1, "fish": 1, "poultry": 1, "olive_oil": 1, "wine": 0, "red_meat": 0.5, "butter": 0, "cheese": 0, "sweets": 0, "fried_fast": 0}'::JSONB
  )
  ON CONFLICT (patient_id, week_start) DO NOTHING;

  -- Seed 3 days of meal_plans
  FOR i IN 0..2 LOOP
    v_day := CURRENT_DATE + i;

    INSERT INTO meal_plans (care_relationship_id, plan_date, meal_type, meal_name, food_categories)
    VALUES
      (v_care_rel_id, v_day, 'breakfast', 'Oatmeal with Blueberries', ARRAY['whole_grains', 'berries']),
      (v_care_rel_id, v_day, 'lunch', 'Grilled Chicken Salad', ARRAY['poultry', 'leafy_greens', 'nuts', 'olive_oil']),
      (v_care_rel_id, v_day, 'dinner', 'Baked Salmon with Veggies', ARRAY['fish', 'other_vegetables', 'whole_grains'])
    ON CONFLICT (care_relationship_id, plan_date, meal_type) DO NOTHING;
  END LOOP;

  -- Seed grocery_lists
  INSERT INTO grocery_lists (care_relationship_id, week_start, items)
  VALUES (
    v_care_rel_id,
    date_trunc('week', CURRENT_DATE)::DATE,
    '[
      {"name": "Blueberries", "section": "Produce", "checked": false, "mind_item": true},
      {"name": "Spinach", "section": "Produce", "checked": false, "mind_item": true},
      {"name": "Broccoli", "section": "Produce", "checked": false, "mind_item": true},
      {"name": "Salmon fillets", "section": "Proteins", "checked": false, "mind_item": true},
      {"name": "Chicken breast", "section": "Proteins", "checked": false, "mind_item": true},
      {"name": "Walnuts", "section": "Pantry", "checked": false, "mind_item": true},
      {"name": "Oatmeal", "section": "Grains", "checked": false, "mind_item": true},
      {"name": "Brown rice", "section": "Grains", "checked": false, "mind_item": true},
      {"name": "Extra virgin olive oil", "section": "Pantry", "checked": false, "mind_item": true},
      {"name": "Black beans", "section": "Pantry", "checked": false, "mind_item": true}
    ]'::JSONB
  );

  RAISE NOTICE 'Seeded nutrition & hydration data for patient %', v_patient_id;
END $$;

-- ============================================
-- VERIFY
-- ============================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'meal_logs', 'meal_items', 'hydration_logs', 'hydration_settings',
  'mind_scores', 'meal_plans', 'grocery_lists', 'weight_logs'
);
