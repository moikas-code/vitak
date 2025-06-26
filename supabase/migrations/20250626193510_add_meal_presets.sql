-- Create meal_presets table for saving frequently used meals
CREATE TABLE meal_presets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  portion_size_g NUMERIC NOT NULL CHECK (portion_size_g > 0),
  vitamin_k_mcg NUMERIC NOT NULL CHECK (vitamin_k_mcg >= 0),
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for meal presets
CREATE INDEX idx_meal_presets_user_id ON meal_presets(user_id);
CREATE INDEX idx_meal_presets_user_usage ON meal_presets(user_id, usage_count DESC);

-- Add unique constraint to prevent duplicate preset names per user
CREATE UNIQUE INDEX idx_meal_presets_user_name ON meal_presets(user_id, name);

-- Enable RLS
ALTER TABLE meal_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_presets
CREATE POLICY "Users can view own presets" ON meal_presets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own presets" ON meal_presets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own presets" ON meal_presets
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own presets" ON meal_presets
  FOR DELETE USING (auth.uid()::text = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_meal_presets_updated_at BEFORE UPDATE
  ON meal_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vitamin_k_mcg when food data changes
CREATE OR REPLACE FUNCTION update_preset_vitamin_k()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all presets that reference this food
  UPDATE meal_presets
  SET vitamin_k_mcg = (portion_size_g / 100) * NEW.vitamin_k_mcg_per_100g
  WHERE food_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update preset vitamin K values when food data changes
CREATE TRIGGER update_preset_vitamin_k_on_food_change
  AFTER UPDATE OF vitamin_k_mcg_per_100g ON foods
  FOR EACH ROW EXECUTE FUNCTION update_preset_vitamin_k();