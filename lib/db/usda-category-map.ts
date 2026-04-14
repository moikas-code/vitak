/**
 * Maps USDA FoodData Central food category descriptions to VitaK FOOD_CATEGORIES.
 *
 * USDA categories come from the `foodCategory` field on FDC foods (or the
 * `category.description` on detail endpoints). They're broad descriptors like
 * "Vegetables and Vegetable Products" that need to be mapped to our narrower
 * enum values.
 *
 * The mapping uses exact match first, then falls back to keyword matching.
 */

import { FOOD_CATEGORIES, type FoodCategory } from "./schema";

/** Exact USDA category → VitaK category */
const EXACT_MAP: Record<string, FoodCategory> = {
  "Vegetables and Vegetable Products": "vegetables",
  "Fruits and Fruit Juices": "fruits",
  "Sausages and Luncheon Meats": "proteins",
  "Pork Products": "proteins",
  "Poultry Products": "proteins",
  "Beef Products": "proteins",
  "Lamb, Veal, and Game Products": "proteins",
  "Finfish and Shellfish Products": "proteins",
  "Legumes and Legume Products": "proteins",
  "Nut and Seed Products": "nuts_seeds",
  "Cereal Grains and Pasta": "grains",
  "Breakfast Cereals": "grains",
  "Baked Goods": "grains",
  "Snacks": "grains",
  "Dairy and Egg Products": "dairy",
  "Eggs": "proteins",
  "Fats and Oils": "fats_oils",
  "Soups, Sauces, and Gravies": "prepared_foods",
  "Beverages": "beverages",
  "Spices and Herbs": "herbs_spices",
  "Sweets": "prepared_foods",
  "Baby Foods": "prepared_foods",
  "Fast Foods": "prepared_foods",
  "Meals, Entrees, and Side Dishes": "prepared_foods",
  "American Indian/Alaska Native Foods": "other",
  "Imitation Products": "other",
  "Restaurant Foods": "prepared_foods",
};

/** Keyword fallback rules — checked in order, first match wins */
const KEYWORD_RULES: Array<{ keywords: string[]; category: FoodCategory }> = [
  { keywords: ["vegetable", "spinach", "kale", "broccoli", "carrot", "potato", "tomato", "lettuce", "onion", "pepper", "squash", "corn", "pea", "bean", "cabbage", "celery", "cucumber", "mushroom", "turnip", "radish", "asparagus", "artichoke", "eggplant", "zucchini"], category: "vegetables" },
  { keywords: ["fruit", "apple", "banana", "orange", "berry", "grape", "peach", "pear", "melon", "mango", "pineapple", "cherry", "lemon", "lime", "coconut", "apricot", "plum", "fig", "date", "raisin", "cranberry"], category: "fruits" },
  { keywords: ["beef", "pork", "chicken", "turkey", "lamb", "veal", "fish", "shrimp", "salmon", "tuna", "meat", "sausage", "bacon", "ham", "steak", "duck", "venison", "crab", "lobster", "clam", "oyster", "scallop"], category: "proteins" },
  { keywords: ["egg"], category: "proteins" },
  { keywords: ["milk", "cheese", "yogurt", "cream", "butter", "dairy", "whey", "cottage"], category: "dairy" },
  { keywords: ["oil", "fat", "lard", "margarine", "shortening", "spread"], category: "fats_oils" },
  { keywords: ["bread", "flour", "rice", "pasta", "cereal", "oat", "wheat", "grain", "noodle", "tortilla", "cracker", "pancake", "waffle", "muffin"], category: "grains" },
  { keywords: ["nut", "seed", "almond", "walnut", "peanut", "cashew", "pecan", "pistachio", "hazelnut"], category: "nuts_seeds" },
  { keywords: ["herb", "spice", "pepper ", "cinnamon", "cumin", "basil", "oregano", "thyme", "rosemary", "parsley", "mint", "sage", "dill", "clove", "ginger", "turmeric", "paprika", "cumin", "coriander"], category: "herbs_spices" },
  { keywords: ["beverage", "juice", "coffee", "tea", "water", "soda", "drink", "wine", "beer", "alcohol", "lemonade", "smoothie"], category: "beverages" },
];

/**
 * Map a USDA food category description to a VitaK FoodCategory.
 * Tries exact match first, then keyword matching on the food description.
 * Falls back to "other" if nothing matches.
 */
export function mapUsdaCategory(
  usdaCategory: string | null | undefined,
  foodDescription: string = ""
): FoodCategory {
  // 1. Exact match on category
  if (usdaCategory && EXACT_MAP[usdaCategory]) {
    return EXACT_MAP[usdaCategory];
  }

  // 2. Partial category match (case-insensitive)
  if (usdaCategory) {
    const lower = usdaCategory.toLowerCase();
    for (const [key, val] of Object.entries(EXACT_MAP)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return val;
      }
    }
  }

  // 3. Keyword matching on food description
  const desc = foodDescription.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => desc.includes(kw))) {
      return rule.category;
    }
  }

  // 4. Fallback
  return "other";
}

/**
 * Get all valid FOOD_CATEGORIES for validation.
 */
export function isValidCategory(cat: string): cat is FoodCategory {
  return (FOOD_CATEGORIES as readonly string[]).includes(cat);
}

/**
 * Get the total count of known USDA categories (for reference).
 */
export function getKnownUsdaCategories(): string[] {
  return Object.keys(EXACT_MAP);
}