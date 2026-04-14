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

// ─── Food Categories ─────────────────────────────────────────────
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
  // USDA sync tracking
  usdaDescription: text("usda_description"),
  usdaCategory: text("usda_category"),
  usdaDerivationCode: text("usda_derivation_code"),
  lastUsdaSync: text("last_usda_sync"),
  usdaDataHash: text("usda_data_hash"),
  // Full nutrient profile (JSON) for recipe calculations
  nutrientJson: text("nutrient_json"),
  portionsJson: text("portions_json"),
  // Denormalized macros for fast filtering
  caloriesPer100g: real("calories_per_100g"),
  proteinPer100g: real("protein_per_100g"),
  carbsPer100g: real("carbs_per_100g"),
  fatPer100g: real("fat_per_100g"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Nutrients Reference ────────────────────────────────────────
export const nutrients = sqliteTable("nutrients", {
  id: integer("id").primaryKey(),
  number: text("number").notNull().unique(),
  name: text("name").notNull(),
  unitName: text("unit_name").notNull(),
  isKeyNutrient: integer("is_key_nutrient").notNull().default(0),
  displayOrder: integer("display_order").notNull().default(0),
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

// ─── Recipes ────────────────────────────────────────────────────
export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  servings: integer("servings").notNull().default(1),
  totalVitaminKMcg: real("total_vitamin_k_mcg").notNull().default(0),
  totalCalories: real("total_calories").notNull().default(0),
  totalProteinG: real("total_protein_g").notNull().default(0),
  totalCarbsG: real("total_carbs_g").notNull().default(0),
  totalFatG: real("total_fat_g").notNull().default(0),
  isPublic: integer("is_public").notNull().default(0),
  slug: text("slug"),
  imageUrl: text("image_url"),
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_recipes_user_id").on(table.userId),
  index("idx_recipes_slug").on(table.slug),
  index("idx_recipes_public").on(table.isPublic),
  index("idx_recipes_created").on(table.createdAt),
]);

// ─── Recipe Ingredients ────────────────────────────────────────
export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  foodId: text("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull().default("g"),
  vitaminKMcg: real("vitamin_k_mcg").notNull().default(0),
  calories: real("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_recipe_ingredients_recipe").on(table.recipeId),
  index("idx_recipe_ingredients_food").on(table.foodId),
]);

// ─── Recipe Shares ──────────────────────────────────────────────
export const recipeShares = sqliteTable("recipe_shares", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  sharedBy: text("shared_by").notNull(),
  sharedWith: text("shared_with"),
  shareType: text("share_type").notNull().default("public"),
  shareCode: text("share_code").unique(),
  views: integer("views").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_recipe_shares_recipe").on(table.recipeId),
  index("idx_recipe_shares_code").on(table.shareCode),
  index("idx_recipe_shares_type").on(table.shareType),
]);

// ─── Saved Recipes ──────────────────────────────────────────────
export const savedRecipes = sqliteTable("saved_recipes", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_saved_recipes_user").on(table.userId),
]);

// ─── Food Audit Log ─────────────────────────────────────────────
export const foodAuditLog = sqliteTable("food_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  foodId: text("food_id").notNull(),
  action: text("action", { enum: ["create", "update", "delete"] }).notNull(),
  changedBy: text("changed_by").notNull(),
  changedAt: text("changed_at").notNull().default(sql`(datetime('now'))`),
  oldValues: text("old_values"),
  newValues: text("new_values"),
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
export type Nutrient = typeof nutrients.$inferSelect;
export type MealLog = typeof mealLogs.$inferSelect;
export type NewMealLog = typeof mealLogs.$inferInsert;
export type MealPreset = typeof mealPresets.$inferSelect;
export type NewMealPreset = typeof mealPresets.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;
export type RecipeShare = typeof recipeShares.$inferSelect;
export type NewRecipeShare = typeof recipeShares.$inferInsert;
export type SavedRecipe = typeof savedRecipes.$inferSelect;
export type NewSavedRecipe = typeof savedRecipes.$inferInsert;
export type FoodAuditLogEntry = typeof foodAuditLog.$inferSelect;