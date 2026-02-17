-- Migration: Add reminder settings and milestones support
-- Date: 2026-02-17

-- 1. Extend user_settings table with reminder columns
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '19:00';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reminder_type TEXT DEFAULT 'push' CHECK (reminder_type IN ('push', 'email', 'both'));
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reminder_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Create index for reminder settings queries
CREATE INDEX IF NOT EXISTS idx_user_settings_reminder ON user_settings(user_id, reminder_enabled);

-- 2. Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  achieved_at TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user_id, milestone_type),
  CHECK (milestone_type IN (
    'streak_7', 'streak_14', 'streak_30', 'streak_100',
    'hours_100', 'hours_200', 'hours_300', 'hours_500'
  ))
);

-- Create indexes for milestones queries
CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_achieved ON milestones(user_id, achieved_at DESC);

-- 3. Enable RLS for milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for milestones

-- Allow users to read their own milestones
DROP POLICY IF EXISTS "Users can read own milestones" ON milestones;
CREATE POLICY "Users can read own milestones"
  ON milestones FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to insert milestones (API route will validate)
DROP POLICY IF EXISTS "Service role can insert milestones" ON milestones;
CREATE POLICY "Service role can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (true);

-- 5. Enable RLS for user_settings (if not already enabled)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings reminder columns

-- Users can read own settings
DROP POLICY IF EXISTS "Users can read own reminder settings" ON user_settings;
CREATE POLICY "Users can read own reminder settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own settings
DROP POLICY IF EXISTS "Users can update own reminder settings" ON user_settings;
CREATE POLICY "Users can update own reminder settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can update for admin purposes
DROP POLICY IF EXISTS "Service role can manage settings" ON user_settings;
CREATE POLICY "Service role can manage settings"
  ON user_settings FOR ALL
  USING (true);

-- 6. Create function to get user's current streak
-- This will be called by the API to calculate current streak
CREATE OR REPLACE FUNCTION get_user_current_streak(p_user_id UUID)
RETURNS TABLE(current_streak INT, max_streak INT, total_hours NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((
      SELECT COUNT(*)::INT
      FROM study_logs
      WHERE user_id = p_user_id
        AND DATE(created_at) >= CURRENT_DATE - INTERVAL '1 day'
        AND DATE(created_at) <= CURRENT_DATE
    ), 0) as current_streak,
    COALESCE((
      SELECT MAX(streak_count)::INT
      FROM study_logs
      WHERE user_id = p_user_id
    ), 0) as max_streak,
    COALESCE((
      SELECT ROUND(SUM(EXTRACT(EPOCH FROM duration) / 3600)::NUMERIC, 2)
      FROM study_logs
      WHERE user_id = p_user_id
    ), 0) as total_hours;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Create function to check and unlock milestones
-- This will be called after study log creation
CREATE OR REPLACE FUNCTION check_new_milestones(
  p_user_id UUID,
  p_current_streak INT,
  p_total_hours NUMERIC
)
RETURNS TABLE(milestone_type TEXT, is_new BOOLEAN) AS $$
DECLARE
  v_already_achieved TEXT[];
BEGIN
  -- Get list of already achieved milestones
  SELECT ARRAY_AGG(milestone_type)
  INTO v_already_achieved
  FROM milestones
  WHERE user_id = p_user_id;

  -- Return streak milestones
  RETURN QUERY
  SELECT 
    'streak_7'::TEXT,
    (p_current_streak >= 7 AND ('streak_7' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN
  UNION ALL
  SELECT 
    'streak_14'::TEXT,
    (p_current_streak >= 14 AND ('streak_14' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN
  UNION ALL
  SELECT 
    'streak_30'::TEXT,
    (p_current_streak >= 30 AND ('streak_30' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN
  UNION ALL
  SELECT 
    'streak_100'::TEXT,
    (p_current_streak >= 100 AND ('streak_100' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN
  UNION ALL
  SELECT 
    'hours_100'::TEXT,
    (p_total_hours >= 100 AND ('hours_100' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN
  UNION ALL
  SELECT 
    'hours_200'::TEXT,
    (p_total_hours >= 200 AND ('hours_200' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN
  UNION ALL
  SELECT 
    'hours_300'::TEXT,
    (p_total_hours >= 300 AND ('hours_300' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN
  UNION ALL
  SELECT 
    'hours_500'::TEXT,
    (p_total_hours >= 500 AND ('hours_500' = ANY(v_already_achieved) IS NOT TRUE))::BOOLEAN;
END;
$$ LANGUAGE plpgsql STABLE;
