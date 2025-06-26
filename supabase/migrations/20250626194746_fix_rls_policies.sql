-- Fix RLS policies to properly isolate user data
-- This migration replaces the permissive policies with proper user-based access control

-- Drop existing permissive policies
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

DROP POLICY IF EXISTS "app_controlled_select" ON users;
DROP POLICY IF EXISTS "app_controlled_insert" ON users;
DROP POLICY IF EXISTS "app_controlled_update" ON users;
DROP POLICY IF EXISTS "app_controlled_delete" ON users;

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

-- Create proper RLS policies for meal_presets
CREATE POLICY "Users can view own meal presets" ON meal_presets
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own meal presets" ON meal_presets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own meal presets" ON meal_presets
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own meal presets" ON meal_presets
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create proper RLS policies for users table
CREATE POLICY "Users can view own user record" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id OR clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own user record" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id OR clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own user record" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_user_id OR clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users should not be able to delete their user record
-- No delete policy for users table

-- Add check constraint to ensure portion sizes are positive
ALTER TABLE meal_logs ADD CONSTRAINT positive_portion_size CHECK (portion_size_g > 0);

-- Add check constraint to ensure vitamin K consumed is non-negative
ALTER TABLE meal_logs ADD CONSTRAINT non_negative_vitamin_k CHECK (vitamin_k_consumed >= 0);

-- Add index on user_id columns for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_presets_user_id ON meal_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Add comment explaining the RLS strategy
COMMENT ON POLICY "Users can view own settings" ON user_settings IS 'RLS policy using Clerk JWT claims or Supabase auth to isolate user data';