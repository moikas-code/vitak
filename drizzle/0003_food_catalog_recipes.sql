-- Migration 0003: Full food catalog with nutrient profiles and recipe system
--
-- Expands VitaK from VK-only tracker to full food catalog + recipe system.
-- Changes:
--   1. Add nutrient_json, portions_json columns to foods (full USDA nutrient data)
--   2. Add macro columns for fast filtering (denormalized from nutrient_json)
--   3. Create nutrients reference table
--   4. Create recipes, recipe_ingredients, recipe_shares, saved_recipes tables

-- ─── Foods table expansion ──────────────────────────────────────

ALTER TABLE foods ADD COLUMN nutrient_json TEXT;
ALTER TABLE foods ADD COLUMN portions_json TEXT;
ALTER TABLE foods ADD COLUMN calories_per_100g REAL;
ALTER TABLE foods ADD COLUMN protein_per_100g REAL;
ALTER TABLE foods ADD COLUMN carbs_per_100g REAL;
ALTER TABLE foods ADD COLUMN fat_per_100g REAL;

-- ─── Nutrient reference table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS nutrients (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  is_key_nutrient INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Key nutrients for VK patients and general nutrition
INSERT OR IGNORE INTO nutrients (id, number, name, unit_name, is_key_nutrient, display_order) VALUES
  (1185, '430', 'Vitamin K (phylloquinone)', 'µg', 1, 1),
  (318, '318', 'Vitamin A, IU', 'IU', 1, 10),
  (320, '320', 'Vitamin A, RAE', 'µg', 1, 11),
  (401, '401', 'Vitamin C, total ascorbic acid', 'mg', 1, 12),
  (328, '328', 'Vitamin D (D2 + D3)', 'µg', 1, 13),
  (323, '323', 'Vitamin E (alpha-tocopherol)', 'mg', 1, 14),
  (418, '418', 'Vitamin B-12', 'µg', 1, 15),
  (431, '431', 'Folate, total', 'µg', 1, 16),
  (203, '203', 'Protein', 'g', 1, 20),
  (204, '204', 'Total lipid (fat)', 'g', 1, 21),
  (205, '205', 'Carbohydrate, by difference', 'g', 1, 22),
  (208, '208', 'Energy', 'kcal', 1, 23),
  (291, '291', 'Fiber, total dietary', 'g', 1, 24),
  (269, '269', 'Total Sugars', 'g', 1, 25),
  (301, '301', 'Calcium, Ca', 'mg', 1, 30),
  (303, '303', 'Iron, Fe', 'mg', 1, 31),
  (306, '306', 'Potassium, K', 'mg', 1, 32),
  (307, '307', 'Sodium, Na', 'mg', 1, 33),
  (304, '304', 'Magnesium, Mg', 'mg', 1, 34),
  (305, '305', 'Phosphorus, P', 'mg', 1, 35);

CREATE INDEX IF NOT EXISTS idx_nutrients_number ON nutrients(number);
CREATE INDEX IF NOT EXISTS idx_nutrients_key ON nutrients(is_key_nutrient);

-- ─── Recipes ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  total_vitamin_k_mcg REAL NOT NULL DEFAULT 0,
  total_calories REAL NOT NULL DEFAULT 0,
  total_protein_g REAL NOT NULL DEFAULT 0,
  total_carbs_g REAL NOT NULL DEFAULT 0,
  total_fat_g REAL NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 0,
  slug TEXT,
  image_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_public ON recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created_at);

-- ─── Recipe Ingredients ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  recipe_id TEXT NOT NULL,
  food_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'g',
  vitamin_k_mcg REAL NOT NULL DEFAULT 0,
  calories REAL NOT NULL DEFAULT 0,
  protein_g REAL NOT NULL DEFAULT 0,
  carbs_g REAL NOT NULL DEFAULT 0,
  fat_g REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_food ON recipe_ingredients(food_id);

-- ─── Recipe Shares (Social) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_shares (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  recipe_id TEXT NOT NULL,
  shared_by TEXT NOT NULL,
  shared_with TEXT,
  share_type TEXT NOT NULL DEFAULT 'public',
  share_code TEXT UNIQUE,
  views INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_shares_recipe ON recipe_shares(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_code ON recipe_shares(share_code);
CREATE INDEX IF NOT EXISTS idx_recipe_shares_type ON recipe_shares(share_type);

-- ─── User Saved Recipes ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_recipes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(clerk_user_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_recipes_user ON saved_recipes(user_id);