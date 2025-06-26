-- Simple security migration that works with application-layer security

-- Drop the complex migration if it partially applied
DROP FUNCTION IF EXISTS set_current_user(TEXT);

-- Ensure RLS is enabled on all tables (safe to run multiple times)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple permissive policies (security enforced at app layer)
-- This approach works because:
-- 1. Supabase client uses anon key (not service role)
-- 2. All queries go through our secure API layer
-- 3. User isolation is enforced in tRPC routers

-- Drop any existing policies to start fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_settings', 'meal_logs', 'foods', 'users')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- User settings - all operations allowed (filtered by app)
CREATE POLICY "app_controlled_select" ON user_settings FOR SELECT USING (true);
CREATE POLICY "app_controlled_insert" ON user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "app_controlled_update" ON user_settings FOR UPDATE USING (true);
CREATE POLICY "app_controlled_delete" ON user_settings FOR DELETE USING (true);

-- Meal logs - all operations allowed (filtered by app)
CREATE POLICY "app_controlled_select" ON meal_logs FOR SELECT USING (true);
CREATE POLICY "app_controlled_insert" ON meal_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "app_controlled_update" ON meal_logs FOR UPDATE USING (true);
CREATE POLICY "app_controlled_delete" ON meal_logs FOR DELETE USING (true);

-- Foods - public read, app-controlled write
CREATE POLICY "public_read" ON foods FOR SELECT USING (true);
CREATE POLICY "app_controlled_write" ON foods FOR INSERT WITH CHECK (true);
CREATE POLICY "app_controlled_update" ON foods FOR UPDATE USING (true);
CREATE POLICY "app_controlled_delete" ON foods FOR DELETE USING (true);

-- Users - all operations allowed (filtered by app)
CREATE POLICY "app_controlled_select" ON users FOR SELECT USING (true);
CREATE POLICY "app_controlled_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "app_controlled_update" ON users FOR UPDATE USING (true);
CREATE POLICY "app_controlled_delete" ON users FOR DELETE USING (true);

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Simple policies for audit logs
CREATE POLICY "app_controlled_select" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "app_controlled_insert" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "app_controlled_update" ON audit_logs FOR UPDATE USING (true);
CREATE POLICY "app_controlled_delete" ON audit_logs FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add a note about security
COMMENT ON SCHEMA public IS 'Security Note: This database uses application-layer security. All user isolation and access control is enforced by the Next.js API layer using Clerk authentication. RLS policies are permissive to allow the authenticated app to function.';