import { Food } from "@/lib/types";

export function FoodNutritionLD({ food }: { food: Food }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NutritionInformation",
    "name": `${food.name} Nutrition Information`,
    "servingSize": `${food.common_portion_size_g}g (${food.common_portion_name})`,
    "nutrition": {
      "@type": "NutritionInformation",
      "servingSize": "100g",
      "vitaminK": {
        "@type": "NutritionInformation", 
        "value": food.vitamin_k_mcg_per_100g,
        "unitText": "mcg"
      }
    },
    "description": `Vitamin K content for ${food.name}: ${food.vitamin_k_mcg_per_100g} mcg per 100g, ${((food.vitamin_k_mcg_per_100g * food.common_portion_size_g) / 100).toFixed(1)} mcg per ${food.common_portion_name}.`
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function RecipeLD({ 
  name, 
  description, 
  ingredients, 
  totalVitaminK 
}: { 
  name: string;
  description: string;
  ingredients: Array<{ name: string; amount: string }>;
  totalVitaminK: number;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": name,
    "description": description,
    "recipeIngredient": ingredients.map(ing => `${ing.amount} ${ing.name}`),
    "nutrition": {
      "@type": "NutritionInformation",
      "vitaminK": {
        "@type": "NutritionInformation",
        "value": totalVitaminK.toFixed(1),
        "unitText": "mcg"
      }
    },
    "recipeCategory": "Warfarin-friendly",
    "recipeCuisine": "Health-conscious",
    "keywords": "low vitamin k, warfarin diet, blood thinner friendly",
    "author": {
      "@type": "Organization",
      "name": "VitaK Tracker"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}