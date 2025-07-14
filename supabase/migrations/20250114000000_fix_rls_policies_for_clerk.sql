-- Fix RLS policies to work with Clerk user IDs instead of Supabase Auth
-- This migration updates all RLS policies to check against the user_id column (Clerk ID)

-- Drop existing policies that rely on auth.uid()
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Admins can read all settings" ON user_settings;
DROP POLICY IF EXISTS "Admins can update all settings" ON user_settings;

DROP POLICY IF EXISTS "Users can read own logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON meal_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON meal_logs;
DROP POLICY IF EXISTS "Admins can read all logs" ON meal_logs;
DROP POLICY IF EXISTS "Admins can manage all logs" ON meal_logs;

DROP POLICY IF EXISTS "Users can read own presets" ON meal_presets;
DROP POLICY IF EXISTS "Users can insert own presets" ON meal_presets;
DROP POLICY IF EXISTS "Users can update own presets" ON meal_presets;
DROP POLICY IF EXISTS "Users can delete own presets" ON meal_presets;

DROP POLICY IF EXISTS "Authenticated users can read foods" ON foods;
DROP POLICY IF EXISTS "Admins can manage foods" ON foods;

DROP POLICY IF EXISTS "Admins can read audit logs" ON food_audit_log;

-- Create function to get current user's Clerk ID from JWT
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
DECLARE
  jwt_payload json;
  clerk_user_id text;
BEGIN
  -- Extract the JWT payload
  jwt_payload := current_setting('request.jwt.claims', true)::json;
  
  -- Get the Clerk user ID from the sub claim
  clerk_user_id := jwt_payload->>'sub';
  
  RETURN clerk_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_settings
  WHERE user_id = get_clerk_user_id();
  
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Settings Policies
CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = get_clerk_user_id());

CREATE POLICY "Admins can read all settings"
  ON user_settings FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all settings"
  ON user_settings FOR UPDATE
  USING (is_admin());

-- Meal Logs Policies
CREATE POLICY "Users can read own logs"
  ON meal_logs FOR SELECT
  USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can insert own logs"
  ON meal_logs FOR INSERT
  WITH CHECK (user_id = get_clerk_user_id());

CREATE POLICY "Users can update own logs"
  ON meal_logs FOR UPDATE
  USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can delete own logs"
  ON meal_logs FOR DELETE
  USING (user_id = get_clerk_user_id());

CREATE POLICY "Admins can read all logs"
  ON meal_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage all logs"
  ON meal_logs FOR ALL
  USING (is_admin());

-- Meal Presets Policies
CREATE POLICY "Users can read own presets"
  ON meal_presets FOR SELECT
  USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can insert own presets"
  ON meal_presets FOR INSERT
  WITH CHECK (user_id = get_clerk_user_id());

CREATE POLICY "Users can update own presets"
  ON meal_presets FOR UPDATE
  USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can delete own presets"
  ON meal_presets FOR DELETE
  USING (user_id = get_clerk_user_id());

-- Foods Policies (all authenticated users can read)
CREATE POLICY "Authenticated users can read foods"
  ON foods FOR SELECT
  USING (get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Admins can manage foods"
  ON foods FOR ALL
  USING (is_admin());

-- Food Audit Log Policies
CREATE POLICY "Admins can read audit logs"
  ON food_audit_log FOR SELECT
  USING (is_admin());

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_clerk_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;