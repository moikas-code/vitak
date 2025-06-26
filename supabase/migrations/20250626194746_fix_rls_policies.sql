-- Fix RLS policies to properly isolate user data
-- This migration replaces the permissive policies with proper user-based access control

-- Drop existing policies from initial schema
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can view own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can insert own meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can delete own meal logs" ON meal_logs;

DROP POLICY IF EXISTS "Anyone can view foods" ON foods;

-- Drop app_controlled policies if they exist
DROP POLICY IF EXISTS "app_controlled_select" ON user_settings;
DROP POLICY IF EXISTS "app_controlled_insert" ON user_settings;
DROP POLICY IF EXISTS "app_controlled_update" ON user_settings;
DROP POLICY IF EXISTS "app_controlled_delete" ON user_settings;

DROP POLICY IF EXISTS "app_controlled_select" ON meal_logs;
DROP POLICY IF EXISTS "app_controlled_insert" ON meal_logs;
DROP POLICY IF EXISTS "app_controlled_update" ON meal_logs;
DROP POLICY IF EXISTS "app_controlled_delete" ON meal_logs;

DROP POLICY IF EXISTS "app_controlled_select" ON meal_presets;
DROP POLICY IF EXISTS "app_controlled_insert" ON meal_presets;
DROP POLICY IF EXISTS "app_controlled_update" ON meal_presets;
DROP POLICY IF EXISTS "app_controlled_delete" ON meal_presets;

-- Create proper RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create proper RLS policies for meal_logs
CREATE POLICY "Users can view own meal logs" ON meal_logs
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own meal logs" ON meal_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own meal logs" ON meal_logs
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own meal logs" ON meal_logs
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Enable RLS on meal_presets if not already enabled
ALTER TABLE meal_presets ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for meal_presets
CREATE POLICY "Users can view own meal presets" ON meal_presets
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own meal presets" ON meal_presets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own meal presets" ON meal_presets
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own meal presets" ON meal_presets
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Enable RLS on foods if not already enabled
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- Foods table is public read
CREATE POLICY "Anyone can view foods" ON foods
    FOR SELECT USING (true);

-- Add check constraint to ensure portion sizes are positive
ALTER TABLE meal_logs ADD CONSTRAINT positive_portion_size CHECK (portion_size_g > 0);

-- Add check constraint to ensure vitamin K consumed is non-negative
ALTER TABLE meal_logs ADD CONSTRAINT non_negative_vitamin_k CHECK (vitamin_k_consumed_mcg >= 0);

-- Add index on user_id columns for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_presets_user_id ON meal_presets(user_id);

-- Add comment explaining the RLS strategy
COMMENT ON POLICY "Users can view own settings" ON user_settings IS 'RLS policy using Clerk JWT claims or Supabase auth to isolate user data';