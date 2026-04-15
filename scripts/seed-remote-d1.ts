/**
 * Seed script to push local food database to remote D1.
 * Reads from .local/dev.db and pushes to Cloudflare D1 via REST API.
 *
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=xxx bun run scripts/seed-remote-d1.ts
 *   bun run scripts/seed-remote-d1.ts --batch-size=50
 *
 * Environment:
 *   CLOUDFLARE_ACCOUNT_ID — From wrangler.toml or Cloudflare dashboard
 *   CLOUDFLARE_API_TOKEN  — Created at https://dash.cloudflare.com/profile/api-tokens
 */

const D1_DATABASE_ID = "3e802905-68c6-44ff-9fec-20e452279598";
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith("--batch-size="))?.split("=")[1] || "10");

async function pushToD1() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    console.error("❌ Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables");
    console.error("   Get account ID from: wrangler whoami");
    console.error("   Create API token at: https://dash.cloudflare.com/profile/api-tokens");
    process.exit(1);
  }

  console.log(`\n🐉 Seed Remote D1 — Food Catalog`);
  console.log(`   Database: ${D1_DATABASE_ID}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Account: ${accountId}\n`);

  // Read from local SQLite
  // @ts-ignore bun:sqlite is a Bun runtime module
const Database = (await import("bun:sqlite")).default;
  const db = new Database(".local/dev.db");

  const totalFoods = db.prepare("SELECT COUNT(*) as cnt FROM foods").get() as { cnt: number };
  const usdaFoods = db.prepare("SELECT COUNT(*) as cnt FROM foods WHERE fdc_id IS NOT NULL").get() as { cnt: number };
  console.log(`   Local DB: ${totalFoods.cnt} total foods, ${usdaFoods.cnt} with fdc_id`);

  // Check what's already in remote D1
  const existingRemote = await queryD1(accountId, apiToken, "SELECT COUNT(*) as cnt FROM foods WHERE fdc_id IS NOT NULL");
  const remoteCount = existingRemote?.[0]?.cnt ?? 0;
  console.log(`   Remote D1: ${remoteCount} foods with fdc_id already\n`);

  // Get foods that need syncing (not in remote DB)
  const foods = db.prepare(`
    SELECT name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name,
      data_source, fdc_id, usda_description, usda_category, usda_derivation_code, usda_data_hash,
      calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
    FROM foods
    WHERE fdc_id IS NOT NULL
    ORDER BY fdc_id ASC
  `).all() as Array<{
    name: string;
    vitamin_k_mcg_per_100g: number;
    category: string;
    common_portion_size_g: number;
    common_portion_name: string;
    data_source: string;
    fdc_id: number;
    usda_description: string;
    usda_category: string;
    usda_derivation_code: string;
    usda_data_hash: string;
    calories_per_100g: number | null;
    protein_per_100g: number | null;
    carbs_per_100g: number | null;
    fat_per_100g: number | null;
  }>;

  console.log(`   Syncing ${foods.length} foods in batches of ${BATCH_SIZE}...\n`);

  let synced = 0;
  let errors = 0;

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE);
    const sql = batch.map(f => {
      const esc = (s: string) => s.replace(/'/g, "''");
      const n = (v: number | null) => v != null ? String(v) : "NULL";
      return `INSERT INTO foods (id, name, vitamin_k_mcg_per_100g, category, common_portion_size_g, common_portion_name, data_source, fdc_id, usda_description, usda_category, usda_derivation_code, usda_data_hash, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES (lower(hex(randomblob(16))), '${esc(f.name)}', ${f.vitamin_k_mcg_per_100g}, '${f.category}', ${f.common_portion_size_g}, '${esc(f.common_portion_name)}', '${f.data_source}', ${f.fdc_id}, '${esc(f.usda_description || '')}', '${esc(f.usda_category || '')}', '${esc(f.usda_derivation_code || '')}', '${esc(f.usda_data_hash || '')}', ${n(f.calories_per_100g)}, ${n(f.protein_per_100g)}, ${n(f.carbs_per_100g)}, ${n(f.fat_per_100g)}) ON CONFLICT(fdc_id) DO UPDATE SET vitamin_k_mcg_per_100g=excluded.vitamin_k_mcg_per_100g, category=excluded.category, common_portion_size_g=excluded.common_portion_size_g, common_portion_name=excluded.common_portion_name, usda_data_hash=excluded.usda_data_hash, calories_per_100g=excluded.calories_per_100g, protein_per_100g=excluded.protein_per_100g, carbs_per_100g=excluded.carbs_per_100g, fat_per_100g=excluded.fat_per_100g, last_usda_sync=datetime('now'), updated_at=datetime('now');`;
    }).join("\n");

    try {
      const result = await executeD1(accountId, apiToken, sql);
      synced += batch.length;
      process.stdout.write(`\r   ✅ Synced ${synced}/${foods.length} foods`);
    } catch (err: any) {
      errors++;
      console.error(`\n   ❌ Error at batch ${i}: ${err.message?.substring(0, 100)}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n\n   ══════════════════════════════════════`);
  console.log(`   🐉 Sync Complete`);
  console.log(`   ══════════════════════════════════════`);
  console.log(`   Synced: ${synced}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   ══════════════════════════════════════\n`);

  db.close();
}

async function queryD1(accountId: string, apiToken: string, sql: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  const data = await res.json() as any;
  if (!data.success) throw new Error(`D1 query error: ${JSON.stringify(data.errors)}`);
  return data.result?.[0]?.results;
}

async function executeD1(accountId: string, apiToken: string, sql: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  const data = await res.json() as any;
  if (!data.success) throw new Error(`D1 execute error: ${JSON.stringify(data.errors?.[0]?.message || data.errors)}`);
  return data.result;
}

pushToD1().catch(console.error);