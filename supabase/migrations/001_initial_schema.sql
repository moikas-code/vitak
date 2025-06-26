-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Settings table
CREATE TABLE user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- Clerk user ID
  daily_limit NUMERIC NOT NULL DEFAULT 100,
  weekly_limit NUMERIC NOT NULL DEFAULT 700,
  monthly_limit NUMERIC NOT NULL DEFAULT 3000,
  tracking_period TEXT NOT NULL DEFAULT 'daily' CHECK (tracking_period IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Categories enum
CREATE TYPE food_category AS ENUM (
  'vegetables',
  'fruits', 
  'proteins',
  'grains',
  'dairy',
  'fats_oils',
  'beverages',
  'other'
);

-- Foods table
CREATE TABLE foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  vitamin_k_mcg_per_100g NUMERIC NOT NULL CHECK (vitamin_k_mcg_per_100g >= 0),
  category food_category NOT NULL,
  common_portion_size_g NUMERIC NOT NULL CHECK (common_portion_size_g > 0),
  common_portion_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for food search
CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));

-- Meal Logs table
CREATE TABLE meal_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  portion_size_g NUMERIC NOT NULL CHECK (portion_size_g > 0),
  vitamin_k_consumed_mcg NUMERIC NOT NULL CHECK (vitamin_k_consumed_mcg >= 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for meal logs
CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_meal_logs_logged_at ON meal_logs(logged_at);
CREATE INDEX idx_meal_logs_user_logged ON meal_logs(user_id, logged_at);

-- RLS (Row Level Security) Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Meal logs policies
CREATE POLICY "Users can view own meal logs" ON meal_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own meal logs" ON meal_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own meal logs" ON meal_logs
  FOR DELETE USING (auth.uid()::text = user_id);

-- Foods table is public read
CREATE POLICY "Anyone can view foods" ON foods
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE
  ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE
  ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample food data
INSERT INTO foods (name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name) VALUES
-- High Vitamin K vegetables
('Kale (cooked)', 817, 'vegetables', 130, '1 cup'),
('Spinach (cooked)', 494, 'vegetables', 180, '1 cup'),
('Collard greens (cooked)', 770, 'vegetables', 190, '1 cup'),
('Swiss chard (cooked)', 830, 'vegetables', 175, '1 cup'),
('Mustard greens (cooked)', 592, 'vegetables', 140, '1 cup'),
('Broccoli (cooked)', 110, 'vegetables', 156, '1 cup'),
('Brussels sprouts (cooked)', 140, 'vegetables', 156, '1 cup'),
('Asparagus (cooked)', 57, 'vegetables', 180, '1 cup'),

-- Low Vitamin K vegetables
('Carrots (raw)', 13.2, 'vegetables', 128, '1 cup'),
('Tomatoes (raw)', 7.9, 'vegetables', 180, '1 cup'),
('Bell peppers (raw)', 7.4, 'vegetables', 149, '1 cup'),
('Cauliflower (cooked)', 17.1, 'vegetables', 124, '1 cup'),
('Corn (cooked)', 0.5, 'vegetables', 164, '1 cup'),
('Potatoes (baked)', 2.2, 'vegetables', 173, '1 medium'),

-- Proteins
('Chicken breast (cooked)', 0.3, 'proteins', 140, '5 oz'),
('Beef (ground, cooked)', 1.2, 'proteins', 113, '4 oz'),
('Pork chop (cooked)', 0.1, 'proteins', 131, '1 chop'),
('Salmon (cooked)', 0.1, 'proteins', 124, '4 oz'),
('Eggs (whole)', 0.3, 'proteins', 50, '1 large'),
('Tofu', 2.0, 'proteins', 126, '1/2 cup'),

-- Dairy
('Milk (2%)', 0.2, 'dairy', 244, '1 cup'),
('Cheddar cheese', 2.8, 'dairy', 28, '1 oz'),
('Yogurt (plain)', 0.2, 'dairy', 245, '1 cup'),
('Cottage cheese', 0.1, 'dairy', 226, '1 cup'),

-- Grains
('White rice (cooked)', 0.0, 'grains', 158, '1 cup'),
('Brown rice (cooked)', 1.9, 'grains', 195, '1 cup'),
('Bread (white)', 0.8, 'grains', 28, '1 slice'),
('Pasta (cooked)', 0.1, 'grains', 140, '1 cup'),
('Oatmeal (cooked)', 0.2, 'grains', 234, '1 cup'),

-- Fruits
('Apple', 2.2, 'fruits', 182, '1 medium'),
('Banana', 0.5, 'fruits', 118, '1 medium'),
('Orange', 0.0, 'fruits', 131, '1 medium'),
('Grapes', 14.6, 'fruits', 151, '1 cup'),
('Strawberries', 2.2, 'fruits', 152, '1 cup'),

-- Fats and oils
('Olive oil', 60.2, 'fats_oils', 14, '1 tbsp'),
('Canola oil', 10.0, 'fats_oils', 14, '1 tbsp'),
('Butter', 7.0, 'fats_oils', 14, '1 tbsp'),
('Mayonnaise', 5.8, 'fats_oils', 15, '1 tbsp'),

-- Beverages
('Coffee (brewed)', 0.2, 'beverages', 237, '1 cup'),
('Tea (green)', 1.4, 'beverages', 237, '1 cup'),
('Orange juice', 0.1, 'beverages', 248, '1 cup'),
('Cranberry juice', 5.1, 'beverages', 253, '1 cup');