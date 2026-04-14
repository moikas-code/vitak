/**
 * Database access layer for VitaK.
 *
 * - Cloudflare Workers: uses D1 via @opennextjs/cloudflare context
 * - Local dev: uses better-sqlite3 via .local/dev.db
 */

import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppDb = ReturnType<typeof createDb>;

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// ─── Local dev SQLite ────────────────────────────────────────────
let _drizzleLocal: ReturnType<typeof import("drizzle-orm/better-sqlite3").drizzle> | null = null;

async function getLocalDb() {
  if (!_drizzleLocal) {
    const Database = (await import("better-sqlite3")).default;
    const { drizzle: drizzleLocal } = await import("drizzle-orm/better-sqlite3");
    const path = await import("path");
    const fs = await import("fs");
    const dbDir = path.join(process.cwd(), ".local");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, "dev.db");
    const sqlite = new Database(dbPath);
    _drizzleLocal = drizzleLocal(sqlite, { schema });
  }
  return _drizzleLocal;
}

/**
 * Get the database instance.
 * - In CF Workers: uses D1 binding from getCloudflareContext
 * - In local dev: uses better-sqlite3 fallback
 */
export async function getDb(): Promise<AppDb> {
  // Try Cloudflare context first
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    if (ctx.env?.DB) {
      return createDb(ctx.env.DB);
    }
  } catch {
    // Not in CF context
  }

  // Fallback to local SQLite
  const local = await getLocalDb();
  return local as unknown as AppDb;
}

/**
 * Service-role DB — same as regular DB on D1 (no RLS).
 * Kept for code clarity.
 */
export async function getServiceDb(): Promise<AppDb> {
  return getDb();
}