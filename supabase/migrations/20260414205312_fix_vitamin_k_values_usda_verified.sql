-- Migration: Fix Vitamin K values verified against USDA FoodData Central API
-- Source: USDA FDC SR Legacy data, nutrient ID 1185 (Vitamin K, phylloquinone)
-- All values are mcg per 100g, verified via API on 2026-04-14
--
-- CRITICAL: The original seed data mixed per-cup values into a per-100g column.
-- - Spinach (raw) was 145 = USDA 483 * 0.30 (per cup, not per 100g)
-- - Collard greens (cooked) was 770 ≈ 407 * 1.90 (per cup, not per 100g)
-- - Swiss chard (cooked) was 830 = RAW value, not cooked value (327)
-- - Kale (raw) was 113, USDA shows 390 (source unknown)
-- - Kale (cooked) was 817, USDA shows 418 (nearly 2x overstated)
--
-- This is a SAFETY issue for warfarin patients who depend on accurate VK data.
-- Applied to Cloudflare D1 via drizzle/0001_fix_vitamin_k_values_usda_verified.sql

-- ============================================================
-- Add tracking columns (PostgreSQL version)
-- ============================================================
ALTER TABLE foods ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'usda_fdc_sr_legacy';
ALTER TABLE foods ADD COLUMN IF NOT EXISTS fdc_id INTEGER;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ============================================================
-- Fix critical Vitamin K value errors (per 100g, from USDA FDC SR Legacy)
-- ============================================================

-- Spinach (raw): 145 → 483 (FDC:168462)
UPDATE foods SET vitamin_k_mcg_per_100g = 483, fdc_id = 168462, verified_at = NOW()
WHERE name = 'Spinach (raw)';

-- Kale (raw): 113 → 390 (FDC:168421)
UPDATE foods SET vitamin_k_mcg_per_100g = 390, fdc_id = 168421, verified_at = NOW()
WHERE name = 'Kale (raw)';

-- Kale (cooked): 817 → 418 (FDC:168421 cooked variant)
UPDATE foods SET vitamin_k_mcg_per_100g = 418, fdc_id = 168421, verified_at = NOW()
WHERE name = 'Kale (cooked)';

-- Swiss chard (cooked): 830 → 327 (FDC:170401)
UPDATE foods SET vitamin_k_mcg_per_100g = 327, fdc_id = 170401, verified_at = NOW()
WHERE name = 'Swiss chard (cooked)';

-- Collard greens (cooked): 770 → 407 (FDC:170407)
UPDATE foods SET vitamin_k_mcg_per_100g = 407, fdc_id = 170407, verified_at = NOW()
WHERE name = 'Collard greens (cooked)';

-- Tomatoes (raw): 8 → 7.9 (FDC:170457)
UPDATE foods SET vitamin_k_mcg_per_100g = 7.9, fdc_id = 170457, verified_at = NOW()
WHERE name = 'Tomatoes (raw)';

-- Broccoli (cooked): 110 → 141 (FDC:170379)
UPDATE foods SET vitamin_k_mcg_per_100g = 141, fdc_id = 170379, verified_at = NOW()
WHERE name = 'Broccoli (cooked)';

-- Mustard greens (cooked): 592 → 593 (FDC:169256)
UPDATE foods SET vitamin_k_mcg_per_100g = 593, fdc_id = 169256, verified_at = NOW()
WHERE name = 'Mustard greens (cooked)';

-- Mark already-correct USDA values
UPDATE foods SET verified_at = NOW() WHERE name = 'Spinach (cooked)';
UPDATE foods SET fdc_id = 170383, verified_at = NOW() WHERE name = 'Brussels sprouts (raw)';
UPDATE foods SET verified_at = NOW() WHERE name = 'Brussels sprouts (cooked)';

-- Mark low-VK foods as estimates (values are correct but not individually FDC-verified)
UPDATE foods SET data_source = 'estimate'
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
    'Coffee (brewed)', 'Tea (green)', 'Orange juice', 'Cranberry juice'
);

CREATE INDEX IF NOT EXISTS idx_foods_data_source ON foods(data_source);
CREATE INDEX IF NOT EXISTS idx_foods_fdc_id ON foods(fdc_id);