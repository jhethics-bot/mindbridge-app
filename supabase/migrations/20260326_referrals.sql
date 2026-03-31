CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referred_id UUID NOT NULL REFERENCES profiles(id),
  reward_type TEXT DEFAULT 'free_month',
  referrer_rewarded BOOLEAN DEFAULT false,
  referred_rewarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own codes" ON referral_codes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users view own redemptions" ON referral_redemptions FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);

-- Push notification columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '07:00';
