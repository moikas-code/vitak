-- Create users table to sync with Clerk
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups by Clerk ID
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);

-- Update user_settings to reference users table
ALTER TABLE user_settings 
  ADD COLUMN user_uuid UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create function to get or create user
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_clerk_user_id TEXT,
  p_email TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO v_user_id
  FROM users
  WHERE clerk_user_id = p_clerk_user_id;
  
  -- If not found, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (clerk_user_id, email, username, first_name, last_name, image_url)
    VALUES (p_clerk_user_id, p_email, p_username, p_first_name, p_last_name, p_image_url)
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing user_settings records to link to users table
DO $$
DECLARE
  rec RECORD;
  v_user_uuid UUID;
BEGIN
  FOR rec IN SELECT DISTINCT user_id FROM user_settings LOOP
    -- Create user record if it doesn't exist
    v_user_uuid := get_or_create_user(rec.user_id);
    
    -- Update user_settings with the UUID reference
    UPDATE user_settings 
    SET user_uuid = v_user_uuid 
    WHERE user_id = rec.user_id;
  END LOOP;
END $$;

-- Create updated_at trigger for users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

-- Only system can insert/update users (via webhook)
CREATE POLICY "System can manage users" ON users
  FOR ALL USING (auth.uid() IS NULL);

-- Create index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Add check constraint for email format
ALTER TABLE users ADD CONSTRAINT valid_email 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);