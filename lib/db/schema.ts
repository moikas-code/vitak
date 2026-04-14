import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ──────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email"),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── User Settings ──────────────────────────────────────────────
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull().unique(),
  userUuid: text("user_uuid"),
  dailyLimit: integer("daily_limit").notNull().default(100),
  weeklyLimit: integer("weekly_limit").notNull().default(700),
  monthlyLimit: integer("monthly_limit").notNull().default(3000),
  trackingPeriod: text("tracking_period", {
    enum: ["daily", "weekly", "monthly"],
  }).notNull().default("daily"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Food Categories (text check constraint, not enum) ─────────
export const FOOD_CATEGORIES = [
  "vegetables",
  "fruits",
  "proteins",
  "grains",
  "dairy",
  "fats_oils",
  "beverages",
  "nuts_seeds",
  "herbs_spices",
  "prepared_foods",
  "other",
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

// ─── Foods ──────────────────────────────────────────────────────
export const foods = sqliteTable("foods", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  vitaminKMcgPer100g: real("vitamin_k_mcg_per_100g").notNull(),
  category: text("category", { enum: FOOD_CATEGORIES }).notNull(),
  commonPortionSizeG: real("common_portion_size_g").notNull(),
  commonPortionName: text("common_portion_name").notNull(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  dataSource: text("data_source").default("usda_fdc_sr_legacy"),
  fdcId: integer("fdc_id"),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Meal Logs ──────────────────────────────────────────────────
export const mealLogs = sqliteTable("meal_logs", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  foodId: text("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
  portionSizeG: integer("portion_size_g").notNull(),
  vitaminKConsumedMcg: integer("vitamin_k_consumed_mcg").notNull(),
  loggedAt: text("logged_at").notNull().default(sql`(datetime('now'))`),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_meal_logs_user_id").on(table.userId),
  index("idx_meal_logs_logged_at").on(table.loggedAt),
  index("idx_meal_logs_user_logged").on(table.userId, table.loggedAt),
]);

// ─── Meal Presets ───────────────────────────────────────────────
export const mealPresets = sqliteTable("meal_presets", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  foodId: text("food_id").notNull().references(() => foods.id),
  portionSizeG: integer("portion_size_g").notNull(),
  vitaminKMcg: integer("vitamin_k_mcg").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_meal_presets_user_id").on(table.userId),
]);

// ─── Food Audit Log ─────────────────────────────────────────────
export const foodAuditLog = sqliteTable("food_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  foodId: text("food_id").notNull(),
  action: text("action", { enum: ["create", "update", "delete"] }).notNull(),
  changedBy: text("changed_by").notNull(),
  changedAt: text("changed_at").notNull().default(sql`(datetime('now'))`),
  oldValues: text("old_values"), // JSON stored as text
  newValues: text("new_values"), // JSON stored as text
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => [
  index("idx_audit_log_food_id").on(table.foodId),
  index("idx_audit_log_changed_by").on(table.changedBy),
]);

// ─── Type helpers ──────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;
export type MealLog = typeof mealLogs.$inferSelect;
export type NewMealLog = typeof mealLogs.$inferInsert;
export type MealPreset = typeof mealPresets.$inferSelect;
export type NewMealPreset = typeof mealPresets.$inferInsert;
export type FoodAuditLogEntry = typeof foodAuditLog.$inferSelect;