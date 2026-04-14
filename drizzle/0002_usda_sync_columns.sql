-- Migration 0002: Add USDA sync tracking columns to foods table
-- These nullable columns track USDA FoodData Central sync state for automatic updates

ALTER TABLE foods ADD COLUMN usda_description TEXT;
ALTER TABLE foods ADD COLUMN usda_category TEXT;
ALTER TABLE foods ADD COLUMN usda_derivation_code TEXT;
ALTER TABLE foods ADD COLUMN last_usda_sync TEXT;
ALTER TABLE foods ADD COLUMN usda_data_hash TEXT;

-- Index for fast USDA lookup by fdcId (already exists from 0001 but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_foods_fdc_id ON foods(fdc_id);

-- Index for finding foods that need sync (have fdcId but stale or missing hash)
CREATE INDEX IF NOT EXISTS idx_foods_usda_sync ON foods(last_usda_sync);
CREATE INDEX IF NOT EXISTS idx_foods_data_source ON foods(data_source);