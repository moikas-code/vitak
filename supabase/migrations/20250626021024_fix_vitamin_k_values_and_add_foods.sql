-- Supabase Migration: Update Vitamin K values and add missing foods
-- Compatible with existing schema using UUID and food_category enum

-- First, add missing categories to the enum type
-- This requires creating a new enum and swapping it
ALTER TYPE food_category RENAME TO food_category_old;

CREATE TYPE food_category AS ENUM (
  'vegetables',
  'fruits', 
  'proteins',
  'grains',
  'dairy',
  'fats_oils',
  'beverages',
  'nuts_seeds',
  'herbs_spices',
  'prepared_foods',
  'other'
);

-- Update the column to use the new enum
ALTER TABLE foods 
  ALTER COLUMN category TYPE food_category 
  USING category::text::food_category;

-- Drop the old enum
DROP TYPE food_category_old;

-- Update incorrect vitamin K values in existing records
UPDATE foods 
SET vitamin_k_mcg_per_100g = CASE
    -- Kale cooked: NIH shows raw kale has ~113 mcg, cooked concentrates to ~550
    WHEN name = 'Kale (cooked)' THEN 550
    
    -- Collard greens: NIH shows 530 mcg per 95g (1/2 cup), = 558 mcg/100g
    WHEN name = 'Collard greens (cooked)' THEN 558
    
    -- Swiss chard: Estimated based on similar leafy greens cooking patterns
    WHEN name = 'Swiss chard (cooked)' THEN 550
    
    -- Tomatoes: USDA shows 2.7 mcg/100g
    WHEN name = 'Tomatoes (raw)' THEN 2.7
    
    -- Broccoli cooked: USDA shows 141 mcg/100g
    WHEN name = 'Broccoli (cooked)' THEN 141
    
    -- Mustard greens: USDA data shows lower value
    WHEN name = 'Mustard greens (cooked)' THEN 419
    
    ELSE vitamin_k_mcg_per_100g
END,
updated_at = NOW()
WHERE name IN (
    'Kale (cooked)', 
    'Collard greens (cooked)', 
    'Swiss chard (cooked)', 
    'Tomatoes (raw)',
    'Broccoli (cooked)',
    'Mustard greens (cooked)'
);

-- Add missing high vitamin K vegetables
INSERT INTO foods (name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name) VALUES
-- Very high vitamin K vegetables
('Turnip greens (cooked)', 518, 'vegetables', 144, '1 cup'),
('Kale (raw)', 113, 'vegetables', 16, '1 cup'),
('Spinach (raw)', 145, 'vegetables', 30, '1 cup'),
('Mustard greens (raw)', 257, 'vegetables', 56, '1 cup'),
('Parsley (fresh)', 1640, 'herbs_spices', 4, '1 tbsp'),
('Beet greens (cooked)', 484, 'vegetables', 144, '1 cup'),
('Dandelion greens (raw)', 778, 'vegetables', 55, '1 cup'),
('Endive (raw)', 231, 'vegetables', 50, '1 cup'),
('Spring onions/Scallions (raw)', 207, 'vegetables', 100, '1 cup'),
('Romaine lettuce', 103, 'vegetables', 47, '1 cup'),
('Green leaf lettuce', 126, 'vegetables', 36, '1 cup'),
('Butterhead lettuce', 102, 'vegetables', 55, '1 cup'),
('Iceberg lettuce', 24, 'vegetables', 72, '1 cup'),

-- Moderate vitamin K vegetables
('Cabbage (raw)', 76, 'vegetables', 89, '1 cup'),
('Cabbage (cooked)', 163, 'vegetables', 150, '1 cup'),
('Okra (cooked)', 40, 'vegetables', 160, '1 cup'),
('Green beans (cooked)', 43, 'vegetables', 125, '1 cup'),
('Peas (green, cooked)', 24, 'vegetables', 160, '1 cup'),
('Artichokes (cooked)', 15, 'vegetables', 120, '1 medium'),
('Leeks (cooked)', 51, 'vegetables', 89, '1/2 cup'),
('Celery (raw)', 29, 'vegetables', 101, '1 cup'),
('Cucumber with peel (raw)', 16, 'vegetables', 104, '1 cup'),
('Cucumber without peel (raw)', 3, 'vegetables', 104, '1 cup'),
('Zucchini (cooked)', 4, 'vegetables', 180, '1 cup'),
('Eggplant (cooked)', 3, 'vegetables', 99, '1 cup'),
('Mushrooms (cooked)', 0, 'vegetables', 156, '1 cup'),
('Onions (raw)', 0.4, 'vegetables', 160, '1 cup'),

-- Add missing proteins with vitamin K
('Chicken liver (cooked)', 13, 'proteins', 85, '3 oz'),
('Beef liver (cooked)', 3, 'proteins', 85, '3 oz'),
('Ground turkey (cooked)', 0.2, 'proteins', 85, '3 oz'),
('Tuna (canned in oil)', 2, 'proteins', 85, '3 oz'),
('Turkey breast (roasted)', 0, 'proteins', 85, '3 oz'),
('Shrimp (cooked)', 0.3, 'proteins', 85, '3 oz'),
('Cod (cooked)', 0.1, 'proteins', 85, '3 oz'),

-- Add natto (extremely high in vitamin K2)
('Natto (fermented soybeans)', 1000, 'proteins', 85, '3 oz'),

-- Add missing dairy products
('Mozzarella cheese', 2.3, 'dairy', 43, '1.5 oz'),
('Swiss cheese', 2.6, 'dairy', 43, '1.5 oz'),
('Cream cheese', 3.4, 'dairy', 30, '2 tbsp'),
('Sour cream', 0.9, 'dairy', 30, '2 tbsp'),
('Butter (salted)', 7.0, 'dairy', 14, '1 tbsp'),
('Greek yogurt', 0.2, 'dairy', 200, '1 cup'),
('Ice cream (vanilla)', 0.3, 'dairy', 66, '1/2 cup'),

-- Add nuts and seeds
('Pine nuts (dried)', 54, 'nuts_seeds', 28, '1 oz'),
('Cashews (dry roasted)', 34, 'nuts_seeds', 28, '1 oz'),
('Pistachios (dry roasted)', 13, 'nuts_seeds', 28, '1 oz'),
('Pumpkin seeds (roasted)', 7, 'nuts_seeds', 28, '1 oz'),
('Almonds', 0, 'nuts_seeds', 28, '1 oz'),
('Walnuts', 2.7, 'nuts_seeds', 28, '1 oz'),
('Sunflower seeds', 0, 'nuts_seeds', 28, '1 oz'),
('Peanut butter', 0.3, 'nuts_seeds', 32, '2 tbsp'),

-- Add missing oils and dressings
('Soybean oil', 184, 'fats_oils', 14, '1 tbsp'),
('Margarine', 13, 'fats_oils', 14, '1 tbsp'),
('Salad dressing (ranch)', 20, 'prepared_foods', 30, '2 tbsp'),
('Salad dressing (caesar)', 28, 'prepared_foods', 30, '2 tbsp'),
('Salad dressing (italian)', 4, 'prepared_foods', 30, '2 tbsp'),
('Salad dressing (balsamic vinaigrette)', 0, 'prepared_foods', 30, '2 tbsp'),

-- Add missing fruits
('Kiwifruit', 40, 'fruits', 69, '1 medium'),
('Blueberries', 19, 'fruits', 148, '1 cup'),
('Figs (dried)', 16, 'fruits', 40, '1/4 cup'),
('Prunes (dried)', 60, 'fruits', 85, '5 prunes'),
('Pomegranate juice', 19, 'beverages', 248, '1 cup'),
('Avocado', 21, 'fruits', 150, '1 medium'),
('Blackberries', 20, 'fruits', 144, '1 cup'),
('Raspberries', 8, 'fruits', 123, '1 cup'),
('Cantaloupe', 3, 'fruits', 160, '1 cup'),
('Watermelon', 0.1, 'fruits', 152, '1 cup'),
('Peaches', 2.6, 'fruits', 150, '1 medium'),
('Pears', 4.5, 'fruits', 178, '1 medium'),
('Pineapple', 0.7, 'fruits', 165, '1 cup'),
('Mango', 4.2, 'fruits', 165, '1 cup'),

-- Add grain products
('Quinoa (cooked)', 0, 'grains', 185, '1 cup'),
('Whole wheat bread', 2, 'grains', 28, '1 slice'),
('Egg noodles (cooked)', 0.1, 'grains', 160, '1 cup'),
('Couscous (cooked)', 0.1, 'grains', 157, '1 cup'),
('Barley (cooked)', 0.8, 'grains', 157, '1 cup'),
('Buckwheat (cooked)', 7, 'grains', 168, '1 cup'),
('Cornbread', 3, 'grains', 60, '1 piece'),
('Bagel (plain)', 0.3, 'grains', 95, '1 medium'),
('English muffin', 0.5, 'grains', 57, '1 muffin'),
('Crackers (saltine)', 0.4, 'grains', 16, '5 crackers'),

-- Add mixed dishes and prepared foods
('Coleslaw with dressing', 79, 'prepared_foods', 150, '1 cup'),
('Pizza with vegetables', 12, 'prepared_foods', 107, '1 slice'),
('Pesto sauce', 82, 'prepared_foods', 16, '1 tbsp'),
('Hummus', 4, 'prepared_foods', 30, '2 tbsp'),
('Guacamole', 8, 'prepared_foods', 30, '2 tbsp'),

-- Add more beverages
('Carrot juice', 37, 'beverages', 236, '1 cup'),
('Vegetable juice cocktail', 13, 'beverages', 242, '1 cup'),
('Prune juice', 9, 'beverages', 256, '1 cup'),
('Apple juice', 0, 'beverages', 248, '1 cup'),
('Grape juice', 0.4, 'beverages', 253, '1 cup'),
('Beer', 0, 'beverages', 356, '12 oz'),
('Wine (red)', 0.4, 'beverages', 147, '5 oz'),
('Wine (white)', 0.1, 'beverages', 147, '5 oz'),

-- Add seasonings and herbs (concentrated sources)
('Basil (dried)', 1714, 'herbs_spices', 1, '1 tsp'),
('Oregano (dried)', 622, 'herbs_spices', 1, '1 tsp'),
('Sage (dried)', 1714, 'herbs_spices', 1, '1 tsp'),
('Thyme (dried)', 1714, 'herbs_spices', 1, '1 tsp'),
('Cilantro/Coriander (fresh)', 310, 'herbs_spices', 4, '1 tbsp'),
('Basil (fresh)', 415, 'herbs_spices', 4, '1 tbsp'),
('Chives (fresh)', 212, 'herbs_spices', 3, '1 tbsp'),
('Dill (fresh)', 55, 'herbs_spices', 1, '1 sprig'),
('Rosemary (fresh)', 0, 'herbs_spices', 2, '1 tbsp'),
('Garlic', 1.7, 'herbs_spices', 3, '1 clove'),

-- Add soybeans and soy products
('Soybeans (cooked)', 33, 'proteins', 172, '1 cup'),
('Edamame (cooked)', 27, 'proteins', 155, '1 cup'),
('Soy milk', 3, 'dairy', 243, '1 cup'),
('Tempeh', 5, 'proteins', 83, '3 oz');

-- Create composite index for better search performance
CREATE INDEX IF NOT EXISTS idx_foods_vitamin_k_category ON foods(vitamin_k_mcg_per_100g DESC, category);

-- Create helpful views for the app

-- View for high vitamin K foods (>100 mcg per 100g)
CREATE OR REPLACE VIEW high_vitamin_k_foods AS
SELECT 
  id,
  name, 
  vitamin_k_mcg_per_100g, 
  category, 
  common_portion_size_g, 
  common_portion_name,
  ROUND((vitamin_k_mcg_per_100g * common_portion_size_g / 100)::numeric, 1) as mcg_per_portion
FROM foods
WHERE vitamin_k_mcg_per_100g > 100
ORDER BY vitamin_k_mcg_per_100g DESC;

-- View for medium vitamin K foods (20-100 mcg per 100g)
CREATE OR REPLACE VIEW medium_vitamin_k_foods AS
SELECT 
  id,
  name, 
  vitamin_k_mcg_per_100g, 
  category, 
  common_portion_size_g, 
  common_portion_name,
  ROUND((vitamin_k_mcg_per_100g * common_portion_size_g / 100)::numeric, 1) as mcg_per_portion
FROM foods
WHERE vitamin_k_mcg_per_100g BETWEEN 20 AND 100
ORDER BY vitamin_k_mcg_per_100g DESC;

-- View for low vitamin K foods (<20 mcg per 100g)
CREATE OR REPLACE VIEW low_vitamin_k_foods AS
SELECT 
  id,
  name, 
  vitamin_k_mcg_per_100g, 
  category, 
  common_portion_size_g, 
  common_portion_name,
  ROUND((vitamin_k_mcg_per_100g * common_portion_size_g / 100)::numeric, 1) as mcg_per_portion
FROM foods
WHERE vitamin_k_mcg_per_100g < 20
ORDER BY vitamin_k_mcg_per_100g DESC;

-- View for daily consumption summary
CREATE OR REPLACE VIEW daily_consumption_summary AS
SELECT 
  ml.user_id,
  DATE(ml.logged_at) as log_date,
  SUM(ml.vitamin_k_consumed_mcg) as total_vitamin_k_mcg,
  COUNT(DISTINCT ml.food_id) as unique_foods_count,
  COUNT(*) as total_entries
FROM meal_logs ml
GROUP BY ml.user_id, DATE(ml.logged_at);

-- Function to calculate remaining vitamin K allowance
CREATE OR REPLACE FUNCTION get_remaining_allowance(
  p_user_id TEXT,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  daily_limit NUMERIC,
  daily_consumed NUMERIC,
  daily_remaining NUMERIC,
  weekly_consumed NUMERIC,
  weekly_remaining NUMERIC,
  monthly_consumed NUMERIC,
  monthly_remaining NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_limits AS (
    SELECT 
      us.daily_limit,
      us.weekly_limit,
      us.monthly_limit
    FROM user_settings us
    WHERE us.user_id = p_user_id
  ),
  consumption AS (
    SELECT 
      COALESCE(SUM(CASE WHEN DATE(logged_at) = p_date THEN vitamin_k_consumed_mcg ELSE 0 END), 0) as daily,
      COALESCE(SUM(CASE WHEN DATE(logged_at) >= p_date - INTERVAL '6 days' THEN vitamin_k_consumed_mcg ELSE 0 END), 0) as weekly,
      COALESCE(SUM(CASE WHEN DATE(logged_at) >= DATE_TRUNC('month', p_date) THEN vitamin_k_consumed_mcg ELSE 0 END), 0) as monthly
    FROM meal_logs
    WHERE user_id = p_user_id
      AND logged_at >= DATE_TRUNC('month', p_date)
  )
  SELECT 
    ul.daily_limit,
    c.daily as daily_consumed,
    ul.daily_limit - c.daily as daily_remaining,
    c.weekly as weekly_consumed,
    ul.weekly_limit - c.weekly as weekly_remaining,
    c.monthly as monthly_consumed,
    ul.monthly_limit - c.monthly as monthly_remaining
  FROM user_limits ul, consumption c;
END;
$$ LANGUAGE plpgsql;

-- Add comment to table explaining data sources
COMMENT ON TABLE foods IS 'Vitamin K content data sourced from USDA National Nutrient Database and NIH Office of Dietary Supplements. Values represent phylloquinone (vitamin K1) content unless otherwise noted (e.g., natto contains menaquinone/vitamin K2). Last updated with 2024 USDA data.';