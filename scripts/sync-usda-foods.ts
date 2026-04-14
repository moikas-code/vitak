/**
 * USDA FDC Food Sync Script for VitaK Tracker
 *
 * Imports ALL SR Legacy foods with full nutrient profiles into D1.
 * Detects changes via data hashes and updates only what changed.
 *
 * Usage:
 *   USDA_FDC_API_KEY=xxx bun run scripts/sync-usda-foods.ts              # Full sync
 *   USDA_FDC_API_KEY=xxx bun run scripts/sync-usda-foods.ts --dry-run     # Show changes only
 *   USDA_FDC_API_KEY=xxx bun run scripts/sync-usda-foods.ts --verbose      # Log every food
 *
 * For remote D1 (generates SQL):
 *   DATABASE_MODE=remote bun run scripts/sync-usda-foods.ts --dry-run > sync.sql
 */

import { createHash } from "crypto";
import { mapUsdaCategory } from "../lib/db/usda-category-map";
import type { FoodCategory } from "../lib/db/schema";
// @ts-ignore bun:sqlite is a Bun runtime module
import Database from "bun:sqlite";

// ─── Config ─────────────────────────────────────────────────────

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";
const PAGE_SIZE = 200;
const VK_NUTRIENT_NUMBER = "430";
const BATCH_SIZE = 50;

// Key nutrient numbers for macro extraction (denormalized columns)
const CALORIES_NUMBER = "208";
const PROTEIN_NUMBER = "203";
const CARBS_NUMBER = "205";
const FAT_NUMBER = "204";

// ─── Types ──────────────────────────────────────────────────────

interface FDCFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: FDCNutrient[];
  foodPortions?: FDCPortion[];
  foodCategory?: string;
  category?: { description: string };
  publicationDate?: string;
}

interface FDCNutrient {
  number: string;
  name: string;
  amount: number;
  unitName: string;
  derivationCode?: string;
}

interface FDCPortion {
  gramWeight: number;
  amount: number;
  description?: string;
  portionDescription?: string;
  modifier?: string;
  measureUnit?: { name: string; abbreviation?: string };
}

interface SyncStats {
  totalFdcFoods: number;
  withVitaminK: number;
  newFoods: number;
  updatedFoods: number;
  unchangedFoods: number;
  skippedZeroNutrients: number;
  errors: number;
  startTime: number;
}

interface ExistingFood {
  id: string;
  fdc_id: number | null;
  usda_data_hash: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.USDA_FDC_API_KEY;
  if (!key) {
    console.error("❌ USDA_FDC_API_KEY not found in environment");
    console.error("   Usage: USDA_FDC_API_KEY=xxx bun run scripts/sync-usda-foods.ts");
    process.exit(1);
  }
  return key;
}

function computeDataHash(fdcId: number, description: string, vkValue: number, nutrientJson: string): string {
  return createHash("sha256")
    .update(`${fdcId}:${description}:${vkValue}:${nutrientJson}`)
    .digest("hex")
    .substring(0, 16);
}

function getCommonPortion(food: FDCFood): { grams: number; name: string } {
  if (food.foodPortions && food.foodPortions.length > 0) {
    // Prefer portions with a description that sounds like a normal serving
    const preferenceOrder = ["cup", "tablespoon", "teaspoon", "serving", "oz", "tbsp", "tsp"];
    const preferred = food.foodPortions.find((p) => {
      const desc = (p.description || p.portionDescription || p.modifier || "").toLowerCase();
      return preferenceOrder.some((kw) => desc.includes(kw)) && p.gramWeight > 0;
    });
    const portion = preferred || food.foodPortions.find((p) => p.gramWeight > 0) || food.foodPortions[0];
    const grams = portion.gramWeight || 100;
    const desc = portion.description || portion.portionDescription || portion.modifier || "";
    const measureUnit = portion.measureUnit?.name || "";
    const name = desc || `${portion.amount} ${measureUnit || "serving"}`.trim();
    return { grams, name };
  }
  return { grams: 100, name: "1 serving" };
}

function extractNutrient(nutrients: FDCNutrient[], number: string): number | null {
  const n = nutrients.find((n) => n.number === number);
  return n ? n.amount : null;
}

function extractVitaminK(food: FDCFood): { value: number; derivationCode: string } | null {
  const vkNutrient = food.foodNutrients.find((n) => n.number === VK_NUTRIENT_NUMBER);
  if (!vkNutrient || vkNutrient.amount <= 0) return null;
  return { value: vkNutrient.amount, derivationCode: vkNutrient.derivationCode || "" };
}

function buildNutrientJson(nutrients: FDCNutrient[]): string {
  // Store compact nutrient data: { "208": { "a": 23, "u": "kcal" }, ... }
  const compact: Record<string, { a: number; u: string; n: string }> = {};
  for (const n of nutrients) {
    // Skip nutrient groups (number >= 900)
    if (parseInt(n.number) >= 900) continue;
    compact[n.number] = { a: n.amount, u: n.unitName, n: n.name };
  }
  return JSON.stringify(compact);
}

function buildPortionsJson(portions: FDCPortion[] | undefined): string {
  if (!portions || portions.length === 0) return "[]";
  return JSON.stringify(
    portions.map((p) => ({
      g: p.gramWeight,
      a: p.amount,
      d: p.description || p.portionDescription || p.modifier || "",
      u: p.measureUnit?.name || "",
    }))
  );
}

async function fetchFdcPage(apiKey: string, pageNumber: number): Promise<FDCFood[]> {
  const url = `${FDC_BASE}/foods/list?dataType=SR%20Legacy&pageSize=${PAGE_SIZE}&pageNumber=${pageNumber}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FDC API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as FDCFood[];
}

// ─── Main Sync Logic ─────────────────────────────────────────────

async function runSync(dryRun: boolean, verbose: boolean) {
  const apiKey = getApiKey();
  const dbPath = process.env.DATABASE_URL || ".local/dev.db";
  const remoteMode = process.env.DATABASE_MODE === "remote";

  console.log(`\n🐉 USDA FDC → VitaK Food Sync (Full Catalog)`);
  console.log(`   Database: ${remoteMode ? "REMOTE D1 (SQL output)" : dbPath}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE"}\n`);

  if (remoteMode) {
    await runRemoteSync(apiKey, dryRun, verbose);
    return;
  }

  const db = new Database(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = OFF");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA cache_size = -64000"); // 64MB cache

  const stats: SyncStats = {
    totalFdcFoods: 0,
    withVitaminK: 0,
    newFoods: 0,
    updatedFoods: 0,
    unchangedFoods: 0,
    skippedZeroNutrients: 0,
    errors: 0,
    startTime: Date.now(),
  };

  // Get existing fdcId → {id, usda_data_hash} mapping
  const existing = db.prepare("SELECT id, fdc_id, usda_data_hash FROM foods WHERE fdc_id IS NOT NULL").all() as ExistingFood[];
  const existingByFdcId = new Map<number, ExistingFood>();
  for (const f of existing) {
    if (f.fdc_id) existingByFdcId.set(f.fdc_id, f);
  }
  console.log(`📋 Found ${existing.length} existing USDA foods in database\n`);

  // Prepare statements
  const insertStmt = db.prepare(`
    INSERT INTO foods (id, name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name,
      data_source, fdc_id, verified_at, usda_description, usda_category, usda_derivation_code,
      last_usda_sync, usda_data_hash, nutrient_json, portions_json,
      calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
    VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?,
      'usda_fdc_sr_legacy', ?, datetime('now'), ?, ?, ?,
      datetime('now'), ?, ?, ?,
      ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE foods SET
      vitamin_k_mcg_per_100g = ?, category = ?, common_portion_size_g = ?, common_portion_name = ?,
      usda_description = ?, usda_category = ?, usda_derivation_code = ?,
      usda_data_hash = ?, last_usda_sync = datetime('now'), updated_at = datetime('now'),
      nutrient_json = ?, portions_json = ?,
      calories_per_100g = ?, protein_per_100g = ?, carbs_per_100g = ?, fat_per_100g = ?
    WHERE id = ?
  `);

  const syncStmt = db.prepare(`UPDATE foods SET last_usda_sync = datetime('now') WHERE id = ?`);

  // Paginate through all SR Legacy foods
  let pageNumber = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`📄 Fetching page ${pageNumber}...`);
    const foods = await fetchFdcPage(apiKey, pageNumber);

    if (foods.length === 0) break;

    stats.totalFdcFoods += foods.length;

    // Batch process within a transaction
    const tx = db.transaction(() => {
      for (const food of foods) {
        try {
          const vk = extractVitaminK(food);
          const nutrientJson = buildNutrientJson(food.foodNutrients);
          const portionsJson = buildPortionsJson(food.foodPortions);
          const usdaCategory = food.category?.description || food.foodCategory || "";
          const category = mapUsdaCategory(usdaCategory, food.description);
          const { grams: portionGrams, name: portionName } = getCommonPortion(food);
          const vkValue = vk ? vk.value : 0;
          const dataHash = computeDataHash(food.fdcId, food.description, vkValue, nutrientJson);

          // Extract macros for denormalized columns
          const calories = extractNutrient(food.foodNutrients, CALORIES_NUMBER);
          const protein = extractNutrient(food.foodNutrients, PROTEIN_NUMBER);
          const carbs = extractNutrient(food.foodNutrients, CARBS_NUMBER);
          const fat = extractNutrient(food.foodNutrients, FAT_NUMBER);

          if (vk) stats.withVitaminK++;

          const existingFood = existingByFdcId.get(food.fdcId);

          if (existingFood) {
            if (existingFood.usda_data_hash === dataHash) {
              stats.unchangedFoods++;
              if (!dryRun) syncStmt.run(existingFood.id);
            } else {
              stats.updatedFoods++;
              if (verbose) console.log(`  🔄 ${food.description} (${vkValue} mcg VK/100g)`);
              if (!dryRun) {
                updateStmt.run(
                  vkValue, category, portionGrams, portionName,
                  food.description, usdaCategory, vk?.derivationCode || "",
                  dataHash, nutrientJson, portionsJson,
                  calories, protein, carbs, fat,
                  existingFood.id
                );
              }
            }
          } else {
            stats.newFoods++;
            if (verbose) console.log(`  ✨ ${food.description} (${vkValue} mcg VK/100g, ${category})`);
            if (!dryRun) {
              insertStmt.run(
                food.description, vkValue, category, portionGrams, portionName,
                food.fdcId, food.description, usdaCategory, vk?.derivationCode || "",
                dataHash, nutrientJson, portionsJson,
                calories, protein, carbs, fat
              );
            }
          }
        } catch (err) {
          stats.errors++;
          console.error(`  ❌ Error processing ${food.description}: ${err}`);
        }
      }
    });

    if (!dryRun) tx();

    pageNumber++;
    if (foods.length < PAGE_SIZE) hasMore = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  printStats(stats);

  if (!dryRun) {
    const total = db.prepare("SELECT COUNT(*) as cnt FROM foods WHERE data_source = 'usda_fdc_sr_legacy'").get() as { cnt: number };
    const allFoods = db.prepare("SELECT COUNT(*) as cnt FROM foods").get() as { cnt: number };
    console.log(`   Total foods in database: ${allFoods.cnt.toLocaleString()}`);
    console.log(`   USDA-verified foods: ${total.cnt.toLocaleString()}`);
  }

  db.close();
}

async function runRemoteSync(apiKey: string, dryRun: boolean, verbose: boolean) {
  const stats: SyncStats = {
    totalFdcFoods: 0, withVitaminK: 0, newFoods: 0, updatedFoods: 0,
    unchangedFoods: 0, skippedZeroNutrients: 0, errors: 0, startTime: Date.now(),
  };

  console.log("⚠️  Remote sync generates SQL. Pipe to: wrangler d1 execute vitak-tracker-db --remote --file=sync.sql\n");

  let pageNumber = 1;
  let hasMore = true;
  const sqlLines: string[] = [];

  while (hasMore) {
    console.error(`📄 Fetching page ${pageNumber}...`);
    const foods = await fetchFdcPage(apiKey, pageNumber);
    if (foods.length === 0) break;

    stats.totalFdcFoods += foods.length;

    for (const food of foods) {
      const vk = extractVitaminK(food);
      const nutrientJson = buildNutrientJson(food.foodNutrients).replace(/'/g, "''");
      const portionsJson = buildPortionsJson(food.foodPortions).replace(/'/g, "''");
      const usdaCategory = food.category?.description || food.foodCategory || "";
      const category = mapUsdaCategory(usdaCategory, food.description);
      const { grams: portionGrams, name: portionName } = getCommonPortion(food);
      const vkValue = vk ? vk.value : 0;
      const dataHash = computeDataHash(food.fdcId, food.description, vkValue, nutrientJson);
      const calories = extractNutrient(food.foodNutrients, CALORIES_NUMBER);
      const protein = extractNutrient(food.foodNutrients, PROTEIN_NUMBER);
      const carbs = extractNutrient(food.foodNutrients, CARBS_NUMBER);
      const fat = extractNutrient(food.foodNutrients, FAT_NUMBER);

      const escName = food.description.replace(/'/g, "''");
      const escPortionName = portionName.replace(/'/g, "''");
      const escUsdaCategory = usdaCategory.replace(/'/g, "''");

      sqlLines.push(
        `INSERT INTO foods (id, name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name, ` +
        `data_source, fdc_id, verified_at, usda_description, usda_category, usda_derivation_code, ` +
        `last_usda_sync, usda_data_hash, nutrient_json, portions_json, ` +
        `calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) ` +
        `VALUES (lower(hex(randomblob(16))), '${escName}', ${vkValue}, '${category}', ${portionGrams}, '${escPortionName}', ` +
        `'usda_fdc_sr_legacy', ${food.fdcId}, datetime('now'), '${escName}', '${escUsdaCategory}', '${vk?.derivationCode || ""}', ` +
        `datetime('now'), '${dataHash}', '${nutrientJson}', '${portionsJson}', ` +
        `${calories || "NULL"}, ${protein || "NULL"}, ${carbs || "NULL"}, ${fat || "NULL"}) ` +
        `ON CONFLICT(fdc_id) DO UPDATE SET ` +
        `vitamin_k_mcg_per_100g=${vkValue}, category='${category}', common_portion_size_g=${portionGrams}, ` +
        `common_portion_name='${escPortionName}', usda_data_hash='${dataHash}', ` +
        `nutrient_json='${nutrientJson}', portions_json='${portionsJson}', ` +
        `calories_per_100g=${calories || "NULL"}, protein_per_100g=${protein || "NULL"}, ` +
        `carbs_per_100g=${carbs || "NULL"}, fat_per_100g=${fat || "NULL"}, ` +
        `last_usda_sync=datetime('now'), updated_at=datetime('now');`
      );

      if (vk) stats.withVitaminK++;
      stats.newFoods++;
    }

    pageNumber++;
    if (foods.length < PAGE_SIZE) hasMore = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("-- USDA FDC Sync SQL");
  console.log("-- Generated:", new Date().toISOString());
  console.log("-- Foods with VK:", stats.withVitaminK);
  console.log("BEGIN TRANSACTION;");
  for (const sql of sqlLines) console.log(sql);
  console.log("COMMIT;");

  printStats(stats);
}

function printStats(stats: SyncStats) {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`🐉 USDA FDC Sync Complete`);
  console.log(`${"═".repeat(60)}`);
  console.log(`   SR Legacy foods scanned:        ${stats.totalFdcFoods.toLocaleString()}`);
  console.log(`   Foods with vitamin K data:     ${stats.withVitaminK.toLocaleString()}`);
  console.log(`   ✨ New foods:                   ${stats.newFoods.toLocaleString()}`);
  console.log(`   🔄 Updated foods:               ${stats.updatedFoods.toLocaleString()}`);
  console.log(`   ⏭️  Unchanged foods:             ${stats.unchangedFoods.toLocaleString()}`);
  console.log(`   ❌ Errors:                      ${stats.errors}`);
  console.log(`   ⏱  Elapsed:                    ${elapsed}s`);
  if (stats.withVitaminK > 0) {
    console.log(`   📊 VK coverage:               ${((stats.withVitaminK / stats.totalFdcFoods) * 100).toFixed(1)}%`);
  }
  console.log(`${"═".repeat(60)}\n`);
}

// ─── CLI ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verbose = args.includes("--verbose");

runSync(dryRun, verbose).catch((err: Error) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});