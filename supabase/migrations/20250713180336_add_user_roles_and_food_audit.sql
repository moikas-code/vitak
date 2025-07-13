-- Create user role enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role to user_settings table
ALTER TABLE user_settings 
ADD COLUMN role user_role DEFAULT 'user' NOT NULL;

-- Create index for role queries
CREATE INDEX idx_user_settings_role ON user_settings(role);

-- Add audit fields to foods table (created_at and updated_at already exist)
ALTER TABLE foods 
ADD COLUMN created_by TEXT,
ADD COLUMN updated_by TEXT;

-- Create food audit log table
CREATE TABLE food_audit_log (
  id BIGSERIAL PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT
);

-- Create index for audit log queries
CREATE INDEX idx_food_audit_log_food_id ON food_audit_log(food_id);
CREATE INDEX idx_food_audit_log_changed_by ON food_audit_log(changed_by);
CREATE INDEX idx_food_audit_log_changed_at ON food_audit_log(changed_at DESC);

-- Note: update_updated_at_column() function and trigger already exist from initial schema

-- RLS policies for food_audit_log (admin only)
ALTER TABLE food_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON food_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_settings 
      WHERE user_id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON food_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Grant first user admin role (you can change this user_id)
-- UPDATE user_settings SET role = 'admin' WHERE user_id = 'YOUR_CLERK_USER_ID' LIMIT 1;

-- Add comment for migration
COMMENT ON COLUMN user_settings.role IS 'User role for access control';
COMMENT ON TABLE food_audit_log IS 'Audit log for tracking all changes to foods table';