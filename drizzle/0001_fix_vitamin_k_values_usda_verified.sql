-- Migration: Fix Vitamin K values verified against USDA FoodData Central API
-- Source: USDA FDC SR Legacy data, nutrient ID 1185 (Vitamin K, phylloquinone)
-- All values are mcg per 100g, verified via API on 2026-04-14
--
-- CRITICAL: The original seed data mixed per-cup values into a per-100g column.
-- This is a SAFETY issue for warfarin patients who depend on accurate VK data.
--
-- Strategy: Since D1 doesn't honor PRAGMA foreign_keys in migrations,
-- we must recreate child tables without FK constraints, then foods, then
-- recreate child tables with FK constraints.

-- ============================================================
-- Step 1: Recreate meal_logs WITHOUT FK constraint (temp)
-- ============================================================
CREATE TABLE meal_logs_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  food_id TEXT NOT NULL,
  portion_size_g INTEGER NOT NULL CHECK (portion_size_g > 0),
  vitamin_k_consumed_mcg INTEGER NOT NULL CHECK (vitamin_k_consumed_mcg >= 0),
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO meal_logs_new SELECT * FROM meal_logs;
DROP TABLE meal_logs;
ALTER TABLE meal_logs_new RENAME TO meal_logs;

CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_meal_logs_logged_at ON meal_logs(logged_at);
CREATE INDEX idx_meal_logs_user_logged ON meal_logs(user_id, logged_at);

-- ============================================================
-- Step 2: Recreate meal_presets WITHOUT FK constraint (temp)
-- ============================================================
CREATE TABLE meal_presets_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) <= 50),
  food_id TEXT NOT NULL,
  portion_size_g INTEGER NOT NULL CHECK (portion_size_g > 0),
  vitamin_k_mcg INTEGER NOT NULL CHECK (vitamin_k_mcg >= 0),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO meal_presets_new SELECT * FROM meal_presets;
DROP TABLE meal_presets;
ALTER TABLE meal_presets_new RENAME TO meal_presets;

CREATE INDEX idx_meal_presets_user_id ON meal_presets(user_id);
CREATE UNIQUE INDEX idx_meal_presets_user_name ON meal_presets(user_id, name);

-- ============================================================
-- Step 3: Recreate foods table with expanded schema
-- ============================================================
CREATE TABLE foods_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vitamin_k_mcg_per_100g REAL NOT NULL CHECK (vitamin_k_mcg_per_100g >= 0),
  category TEXT NOT NULL CHECK (category IN (
    'vegetables', 'fruits', 'proteins', 'grains', 'dairy',
    'fats_oils', 'beverages', 'nuts_seeds', 'herbs_spices',
    'prepared_foods', 'other'
  )),
  common_portion_size_g REAL NOT NULL CHECK (common_portion_size_g > 0),
  common_portion_name TEXT NOT NULL,
  data_source TEXT DEFAULT 'usda_fdc_sr_legacy',
  fdc_id INTEGER,
  verified_at TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy existing data
INSERT INTO foods_new (id, name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name, created_by, updated_by, created_at, updated_at)
SELECT id, name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name, created_by, updated_by, created_at, updated_at
FROM foods;

-- ============================================================
-- Step 4: Fix critical Vitamin K value errors
-- ============================================================

-- Spinach (raw): 145 → 483 (was per-cup value in per-100g column)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 483, fdc_id = 168462, verified_at = datetime('now')
WHERE name = 'Spinach (raw)';

-- Kale (raw): 113 → 390 (was severely understated)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 390, fdc_id = 168421, verified_at = datetime('now')
WHERE name = 'Kale (raw)';

-- Kale (cooked): 817 → 418 (was 2x overstated)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 418, fdc_id = 168421, verified_at = datetime('now')
WHERE name = 'Kale (cooked)';

-- Swiss chard (cooked): 830 → 327 (was RAW value, not cooked)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 327, fdc_id = 170401, verified_at = datetime('now')
WHERE name = 'Swiss chard (cooked)';

-- Collard greens (cooked): 770 → 407 (was per-cup value)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 407, fdc_id = 170407, verified_at = datetime('now')
WHERE name = 'Collard greens (cooked)';

-- Tomatoes (raw): 8 → 7.9 (exact USDA value)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 7.9, fdc_id = 170457, verified_at = datetime('now')
WHERE name = 'Tomatoes (raw)';

-- Broccoli (cooked): 110 → 141 (USDA verified)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 141, fdc_id = 170379, verified_at = datetime('now')
WHERE name = 'Broccoli (cooked)';

-- Mustard greens (cooked): 592 → 593 (minor rounding)
UPDATE foods_new SET vitamin_k_mcg_per_100g = 593, fdc_id = 169256, verified_at = datetime('now')
WHERE name = 'Mustard greens (cooked)';

-- Mark already-correct USDA values
UPDATE foods_new SET verified_at = datetime('now') WHERE name = 'Spinach (cooked)';
UPDATE foods_new SET fdc_id = 170383, verified_at = datetime('now') WHERE name = 'Brussels sprouts (raw)';
UPDATE foods_new SET verified_at = datetime('now') WHERE name = 'Brussels sprouts (cooked)';

-- ============================================================
-- Step 5: Add USDA-verified foods that were missing
-- ============================================================

INSERT INTO foods_new (id, name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name, data_source, fdc_id, verified_at) VALUES
(lower(hex(randomblob(16))), 'Parsley (fresh)', 1640, 'herbs_spices', 4, '1 tbsp', 'usda_fdc_sr_legacy', 170416, datetime('now')),
(lower(hex(randomblob(16))), 'Spinach (raw)', 483, 'vegetables', 30, '1 cup', 'usda_fdc_sr_legacy', 168462, datetime('now')),
(lower(hex(randomblob(16))), 'Kale (raw)', 390, 'vegetables', 16, '1 cup', 'usda_fdc_sr_legacy', 168421, datetime('now')),
(lower(hex(randomblob(16))), 'Swiss chard (raw)', 830, 'vegetables', 36, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Collards (raw)', 437, 'vegetables', 190, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Mustard greens (raw)', 258, 'vegetables', 56, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Beet greens (cooked)', 484, 'vegetables', 144, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Turnip greens (cooked)', 368, 'vegetables', 164, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Dandelion greens (raw)', 778, 'vegetables', 55, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Endive (raw)', 231, 'vegetables', 50, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Broccoli (raw)', 102, 'vegetables', 91, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Romaine lettuce (raw)', 102, 'vegetables', 47, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Iceberg lettuce (raw)', 24, 'vegetables', 72, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Cabbage (raw)', 76, 'vegetables', 89, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Cabbage (cooked)', 109, 'vegetables', 150, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Green beans (cooked)', 48, 'vegetables', 125, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Celery (raw)', 29, 'vegetables', 101, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Asparagus (raw)', 42, 'vegetables', 134, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Leeks (cooked)', 25, 'vegetables', 89, '1/2 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Green peas (raw)', 25, 'vegetables', 145, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Okra (cooked)', 40, 'vegetables', 160, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Kiwifruit', 40, 'fruits', 69, '1 medium', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Avocado (raw)', 21, 'fruits', 150, '1 medium', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Blueberries', 19, 'fruits', 148, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Soybean oil', 184, 'fats_oils', 14, '1 tbsp', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Soybeans (cooked)', 33, 'proteins', 172, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Edamame (cooked)', 27, 'proteins', 155, '1 cup', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Basil (fresh)', 415, 'herbs_spices', 4, '1 tbsp', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Cilantro (fresh)', 310, 'herbs_spices', 4, '1 tbsp', 'usda_fdc_sr_legacy', NULL, datetime('now')),
(lower(hex(randomblob(16))), 'Chives (fresh)', 212, 'herbs_spices', 3, '1 tbsp', 'usda_fdc_sr_legacy', NULL, datetime('now'));

-- ============================================================
-- Step 6: Add prepared food estimates
-- ============================================================

INSERT INTO foods_new (id, name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name, data_source) VALUES
(lower(hex(randomblob(16))), 'French fries', 16, 'prepared_foods', 117, 'medium serving', 'estimate'),
(lower(hex(randomblob(16))), 'Hamburger (with bun)', 3, 'prepared_foods', 120, '1 burger', 'estimate'),
(lower(hex(randomblob(16))), 'Caesar salad (with dressing)', 20, 'prepared_foods', 200, '1 bowl', 'estimate'),
(lower(hex(randomblob(16))), 'Pizza (cheese)', 6, 'prepared_foods', 107, '1 slice', 'estimate'),
(lower(hex(randomblob(16))), 'Pizza with vegetables', 12, 'prepared_foods', 107, '1 slice', 'estimate'),
(lower(hex(randomblob(16))), 'Fried rice', 15, 'prepared_foods', 200, '1 cup', 'estimate'),
(lower(hex(randomblob(16))), 'Bok choy (cooked)', 34, 'vegetables', 170, '1 cup', 'estimate'),
(lower(hex(randomblob(16))), 'Kimchi', 42, 'prepared_foods', 100, '1/2 cup', 'estimate'),
(lower(hex(randomblob(16))), 'Seaweed (nori)', 65, 'vegetables', 3, '1 sheet', 'estimate'),
(lower(hex(randomblob(16))), 'Chicken noodle soup', 2, 'prepared_foods', 240, '1 cup', 'estimate'),
(lower(hex(randomblob(16))), 'Vegetable soup', 6, 'prepared_foods', 240, '1 cup', 'estimate'),
(lower(hex(randomblob(16))), 'Tomato soup', 4, 'prepared_foods', 240, '1 cup', 'estimate'),
(lower(hex(randomblob(16))), 'French toast', 20, 'prepared_foods', 100, '2 slices', 'estimate'),
(lower(hex(randomblob(16))), 'Hash browns', 12, 'prepared_foods', 100, '1 patty', 'estimate'),
(lower(hex(randomblob(16))), 'Ranch dressing', 20, 'prepared_foods', 30, '2 tbsp', 'estimate'),
(lower(hex(randomblob(16))), 'Pesto sauce', 82, 'prepared_foods', 16, '1 tbsp', 'estimate'),
(lower(hex(randomblob(16))), 'Hummus', 4, 'prepared_foods', 30, '2 tbsp', 'estimate');

-- ============================================================
-- Step 7: Mark non-verified existing foods as estimates
-- ============================================================

UPDATE foods_new SET data_source = 'estimate'
WHERE name IN (
    'Carrots (raw)', 'Bell peppers (raw)', 'Cauliflower (cooked)',
    'Corn (cooked)', 'Potatoes (baked)',
    'Chicken breast (cooked)', 'Beef (ground, cooked)', 'Pork chop (cooked)',
    'Salmon (cooked)', 'Eggs (whole)', 'Tofu',
    'Milk (2%)', 'Cheddar cheese', 'Yogurt (plain)', 'Cottage cheese',
    'White rice (cooked)', 'Brown rice (cooked)', 'Bread (white)',
    'Pasta (cooked)', 'Oatmeal (cooked)',
    'Apple', 'Banana', 'Orange', 'Grapes', 'Strawberries',
    'Olive oil', 'Canola oil', 'Butter', 'Mayonnaise',
    'Coffee (brewed)', 'Tea (green)', 'Orange juice', 'Cranberry juice',
    'Asparagus (cooked)'
);

-- ============================================================
-- Step 8: Swap foods table
-- ============================================================
DROP TABLE foods;
ALTER TABLE foods_new RENAME TO foods;

CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_data_source ON foods(data_source);
CREATE INDEX idx_foods_fdc_id ON foods(fdc_id);

CREATE TRIGGER update_foods_updated_at
AFTER UPDATE ON foods
BEGIN
  UPDATE foods SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================
-- Step 9: Restore FK constraints on child tables
-- ============================================================

-- Restore meal_logs with FK
CREATE TABLE meal_logs_final (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  food_id TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  portion_size_g INTEGER NOT NULL CHECK (portion_size_g > 0),
  vitamin_k_consumed_mcg INTEGER NOT NULL CHECK (vitamin_k_consumed_mcg >= 0),
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO meal_logs_final SELECT * FROM meal_logs;
DROP TABLE meal_logs;
ALTER TABLE meal_logs_final RENAME TO meal_logs;

CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_meal_logs_logged_at ON meal_logs(logged_at);
CREATE INDEX idx_meal_logs_user_logged ON meal_logs(user_id, logged_at);

-- Restore meal_presets with FK
CREATE TABLE meal_presets_final (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) <= 50),
  food_id TEXT NOT NULL REFERENCES foods(id),
  portion_size_g INTEGER NOT NULL CHECK (portion_size_g > 0),
  vitamin_k_mcg INTEGER NOT NULL CHECK (vitamin_k_mcg >= 0),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO meal_presets_final SELECT * FROM meal_presets;
DROP TABLE meal_presets;
ALTER TABLE meal_presets_final RENAME TO meal_presets;

CREATE INDEX idx_meal_presets_user_id ON meal_presets(user_id);
CREATE UNIQUE INDEX idx_meal_presets_user_name ON meal_presets(user_id, name);