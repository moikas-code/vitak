-- VitaK D1 Seed Migration
-- This is the initial SQLite schema for Cloudflare D1

-- ─── Users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);

-- ─── User Settings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE,
  user_uuid TEXT,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  weekly_limit INTEGER NOT NULL DEFAULT 700,
  monthly_limit INTEGER NOT NULL DEFAULT 3000,
  tracking_period TEXT NOT NULL DEFAULT 'daily' CHECK (tracking_period IN ('daily', 'weekly', 'monthly')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_role ON user_settings(role);

-- ─── Foods ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  vitamin_k_mcg_per_100g INTEGER NOT NULL CHECK (vitamin_k_mcg_per_100g >= 0),
  category TEXT NOT NULL CHECK (category IN ('vegetables', 'fruits', 'proteins', 'grains', 'dairy', 'fats_oils', 'beverages', 'other')),
  common_portion_size_g INTEGER NOT NULL CHECK (common_portion_size_g > 0),
  common_portion_name TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);

-- ─── Meal Logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  food_id TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  portion_size_g INTEGER NOT NULL CHECK (portion_size_g > 0),
  vitamin_k_consumed_mcg INTEGER NOT NULL CHECK (vitamin_k_consumed_mcg >= 0),
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_logged_at ON meal_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_logged ON meal_logs(user_id, logged_at);

-- ─── Meal Presets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_presets (
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
CREATE INDEX IF NOT EXISTS idx_meal_presets_user_id ON meal_presets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_presets_user_name ON meal_presets(user_id, name);

-- ─── Food Audit Log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  food_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_log_food_id ON food_audit_log(food_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON food_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON food_audit_log(changed_at DESC);

-- ─── Trigger: auto-update updated_at ──────────────────────────────
CREATE TRIGGER IF NOT EXISTS update_user_settings_updated_at
AFTER UPDATE ON user_settings
BEGIN
  UPDATE user_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_foods_updated_at
AFTER UPDATE ON foods
BEGIN
  UPDATE foods SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_meal_presets_updated_at
AFTER UPDATE ON meal_presets
BEGIN
  UPDATE meal_presets SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ─── Seed Food Data ───────────────────────────────────────────────
INSERT OR IGNORE INTO foods (name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name) VALUES
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
('Carrots (raw)', 13, 'vegetables', 128, '1 cup'),
('Tomatoes (raw)', 8, 'vegetables', 180, '1 cup'),
('Bell peppers (raw)', 7, 'vegetables', 149, '1 cup'),
('Cauliflower (cooked)', 17, 'vegetables', 124, '1 cup'),
('Corn (cooked)', 1, 'vegetables', 164, '1 cup'),
('Potatoes (baked)', 2, 'vegetables', 173, '1 medium'),
-- Proteins
('Chicken breast (cooked)', 0, 'proteins', 140, '5 oz'),
('Beef (ground, cooked)', 1, 'proteins', 113, '4 oz'),
('Pork chop (cooked)', 0, 'proteins', 131, '1 chop'),
('Salmon (cooked)', 0, 'proteins', 124, '4 oz'),
('Eggs (whole)', 0, 'proteins', 50, '1 large'),
('Tofu', 2, 'proteins', 126, '1/2 cup'),
-- Dairy
('Milk (2%)', 0, 'dairy', 244, '1 cup'),
('Cheddar cheese', 3, 'dairy', 28, '1 oz'),
('Yogurt (plain)', 0, 'dairy', 245, '1 cup'),
('Cottage cheese', 0, 'dairy', 226, '1 cup'),
-- Grains
('White rice (cooked)', 0, 'grains', 158, '1 cup'),
('Brown rice (cooked)', 2, 'grains', 195, '1 cup'),
('Bread (white)', 1, 'grains', 28, '1 slice'),
('Pasta (cooked)', 0, 'grains', 140, '1 cup'),
('Oatmeal (cooked)', 0, 'grains', 234, '1 cup'),
-- Fruits
('Apple', 2, 'fruits', 182, '1 medium'),
('Banana', 1, 'fruits', 118, '1 medium'),
('Orange', 0, 'fruits', 131, '1 medium'),
('Grapes', 15, 'fruits', 151, '1 cup'),
('Strawberries', 2, 'fruits', 152, '1 cup'),
-- Fats and oils
('Olive oil', 60, 'fats_oils', 14, '1 tbsp'),
('Canola oil', 10, 'fats_oils', 14, '1 tbsp'),
('Butter', 7, 'fats_oils', 14, '1 tbsp'),
('Mayonnaise', 6, 'fats_oils', 15, '1 tbsp'),
-- Beverages
('Coffee (brewed)', 0, 'beverages', 237, '1 cup'),
('Tea (green)', 1, 'beverages', 237, '1 cup'),
('Orange juice', 0, 'beverages', 248, '1 cup'),
('Cranberry juice', 5, 'beverages', 253, '1 cup');