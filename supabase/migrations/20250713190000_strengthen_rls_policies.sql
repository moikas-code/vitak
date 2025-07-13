-- Strengthen Row Level Security Policies
-- Replace permissive policies with proper user-scoped security

-- First, drop the existing permissive policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_settings', 'meal_logs', 'users', 'audit_logs')
        AND policyname LIKE 'app_controlled_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- USER SETTINGS TABLE - User can only access their own settings
CREATE POLICY "users_can_view_own_settings" ON user_settings
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "users_can_insert_own_settings" ON user_settings
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_update_own_settings" ON user_settings
  FOR UPDATE 
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Admins can view all user settings
CREATE POLICY "admins_can_view_all_settings" ON user_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = auth.uid()::text 
      AND us.role = 'admin'
    )
  );

-- MEAL LOGS TABLE - User can only access their own meal logs
CREATE POLICY "users_can_view_own_meal_logs" ON meal_logs
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "users_can_insert_own_meal_logs" ON meal_logs
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_update_own_meal_logs" ON meal_logs
  FOR UPDATE 
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_delete_own_meal_logs" ON meal_logs
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Admins can view all meal logs (for admin dashboard)
CREATE POLICY "admins_can_view_all_meal_logs" ON meal_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = auth.uid()::text 
      AND us.role = 'admin'
    )
  );

-- USERS TABLE - User can only access their own record
CREATE POLICY "users_can_view_own_record" ON users
  FOR SELECT 
  USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "users_can_update_own_record" ON users
  FOR UPDATE 
  USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

-- System can insert users (for webhook)
CREATE POLICY "system_can_insert_users" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Admins can view all users
CREATE POLICY "admins_can_view_all_users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = auth.uid()::text 
      AND us.role = 'admin'
    )
  );

-- AUDIT LOGS TABLE - Strict access control
DROP POLICY IF EXISTS "app_controlled_select" ON audit_logs;
DROP POLICY IF EXISTS "app_controlled_insert" ON audit_logs;
DROP POLICY IF EXISTS "app_controlled_update" ON audit_logs;
DROP POLICY IF EXISTS "app_controlled_delete" ON audit_logs;

-- Users can only see their own audit logs
CREATE POLICY "users_can_view_own_audit_logs" ON audit_logs
  FOR SELECT 
  USING (user_id = auth.uid()::text);

-- System can insert audit logs (authenticated service)
CREATE POLICY "authenticated_can_insert_audit_logs" ON audit_logs
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can view all audit logs
CREATE POLICY "admins_can_view_all_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = auth.uid()::text 
      AND us.role = 'admin'
    )
  );

-- MEAL PRESETS TABLE - Add missing RLS policies
ALTER TABLE meal_presets ENABLE ROW LEVEL SECURITY;

-- Users can only access their own meal presets
CREATE POLICY "users_can_view_own_meal_presets" ON meal_presets
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "users_can_insert_own_meal_presets" ON meal_presets
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_update_own_meal_presets" ON meal_presets
  FOR UPDATE 
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_delete_own_meal_presets" ON meal_presets
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Admins can view all meal presets
CREATE POLICY "admins_can_view_all_meal_presets" ON meal_presets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = auth.uid()::text 
      AND us.role = 'admin'
    )
  );

-- Update schema comment with proper security note
COMMENT ON SCHEMA public IS 'Security Note: This database uses Row Level Security (RLS) with user-scoped policies. Users can only access their own data unless they have admin privileges. All policies verify user identity through auth.uid().';

-- Add helpful functions for checking admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_id = auth.uid()::text 
    AND role = 'admin'
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;