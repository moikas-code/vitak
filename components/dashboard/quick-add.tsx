"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc/provider";
import { useToast } from "@/lib/hooks/use-toast";
import { Search, Plus, X, Sparkles } from "lucide-react";
import type { FoodRow } from "@/lib/db/mappers";
import { track_meal_event, track_search_event } from "@/lib/analytics";
import { SaveAsPresetButton } from "./save-as-preset-button";
import { sanitizeText } from "@/lib/security/sanitize-html";
import { sanitizeSearchQuery } from "@/lib/security/input-validation";
import { useDebounce } from "@/lib/hooks/use-debounce";

const add_meal_schema = z.object({
  food_id: z.string().min(1, "Please select a food"),
  portion_size_g: z.number().positive("Portion size must be positive"),
});

type AddMealForm = z.infer<typeof add_meal_schema>;

const custom_food_schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  vitamin_k_mcg_per_100g: z.number().min(0, "Must be 0 or greater"),
  category: z.enum([
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
  ]),
  common_portion_size_g: z.number().min(0.1, "Portion size must be at least 0.1 g"),
  common_portion_name: z.string().min(1, "Portion name is required").max(100),
});

type CustomFoodForm = z.infer<typeof custom_food_schema>;

export function QuickAdd() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedFoodRow, setSelectedFoodRow] = useState<FoodRow | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const utils = api.useUtils();

  const { data: foods, isLoading: is_loading } = api.food.search.useQuery(
    { query: sanitizeSearchQuery(debouncedSearch) },
    { enabled: debouncedSearch.length > 0, retry: false, staleTime: 0 }
  );

  const createMeal = api.mealLog.add.useMutation({
    onSuccess: (newMeal) => {
      utils.mealLog.getToday.setData({} as any, (old: any) => {
        if (!old) return [newMeal];
        return [newMeal, ...old];
      });
      utils.credit.getAllBalances.invalidate();

      toast({
        title: "Meal logged",
        description: `${newMeal.food?.name ?? 'Meal'} — ${(newMeal.vitamin_k_consumed_mcg ?? 0).toFixed(1)} mcg vitamin K`,
      });

      setSelectedFoodRow(null);
      setSearch("");
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCustomFood = api.food.create_custom.useMutation({
    onSuccess: (newFood) => {
      toast({
        title: "Custom food created",
        description: `${sanitizeText(newFood.name)} has been added to the database and selected for logging.`,
      });
      utils.food.search.invalidate();
      setShowCustomForm(false);
      selectFoodRow(newFood);
      customReset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create custom food.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMealForm>({
    resolver: zodResolver(add_meal_schema),
  });

  const {
    register: customRegister,
    handleSubmit: customHandleSubmit,
    reset: customReset,
    setValue: customSetValue,
    watch: customWatch,
    formState: { errors: customErrors },
  } = useForm<CustomFoodForm>({
    resolver: zodResolver(custom_food_schema),
    defaultValues: {
      category: "other",
      common_portion_size_g: 100,
      common_portion_name: "serving",
    },
  });

  const onSubmit = (data: AddMealForm) => {
    if (!selectedFoodRow) return;
    track_meal_event('saved', {
      food_category: selectedFoodRow.category,
      vitamin_k_amount: selectedFoodRow.vitamin_k_mcg_per_100g > 50 ? 'high' : selectedFoodRow.vitamin_k_mcg_per_100g > 20 ? 'medium' : 'low'
    });
    createMeal.mutate({ food_id: data.food_id, portion_size_g: data.portion_size_g });
  };

  const selectFoodRow = (food: FoodRow) => {
    track_meal_event('food_selected', {
      food_category: food.category,
      vitamin_k_amount: food.vitamin_k_mcg_per_100g > 50 ? 'high' : food.vitamin_k_mcg_per_100g > 20 ? 'medium' : 'low'
    });
    setSelectedFoodRow(food);
    setValue("food_id", food.id);
    setValue("portion_size_g", food.common_portion_size_g);
  };

  const onCustomSubmit = (data: CustomFoodForm) => {
    createCustomFood.mutate(data);
  };

  return (
    <div className="space-y-4">
      {!showCustomForm && (
        <div className="space-y-2">
          <Label htmlFor="search">Search for food</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Type to search..."
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (value.length > 2) {
                  track_search_event('food_search', { query_length: value.length });
                }
              }}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {is_loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {foods && foods.length > 0 && !selectedFoodRow && !showCustomForm && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {foods.map((food) => {
            const portion_k_mcg = (food.vitamin_k_mcg_per_100g * food.common_portion_size_g) / 100;
            const is_low_k = portion_k_mcg < 5;
            return (
            <button
              key={food.id}
              onClick={() => selectFoodRow(food)}
              className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium flex items-center gap-2">
                {sanitizeText(food.name)}
                {is_low_k && (
                  <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Low K</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <div>{food.vitamin_k_mcg_per_100g} mcg per 100g</div>
                <div className="text-xs">
                  {sanitizeText(food.common_portion_name)} ({food.common_portion_size_g}g): {portion_k_mcg.toFixed(1)} mcg
                </div>
              </div>
            </button>
            );
          })}
        </div>
      )}

      {foods && foods.length === 0 && !is_loading && debouncedSearch.length > 0 && !showCustomForm && !selectedFoodRow && (
        <div className="p-3 rounded-lg border border-dashed text-center space-y-2">
          <p className="text-sm text-muted-foreground">No foods found for &ldquo;{sanitizeText(debouncedSearch)}&rdquo;</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCustomForm(true);
              customSetValue("name", debouncedSearch);
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Add as custom food
          </Button>
        </div>
      )}

      {!showCustomForm && !selectedFoodRow && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomForm(true)}
            className="text-xs text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Can&apos;t find it? Add a custom food
          </Button>
        </div>
      )}

      {showCustomForm && (
        <form onSubmit={customHandleSubmit(onCustomSubmit)} className="space-y-4 border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Add Custom Food</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowCustomForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-name">Food Name</Label>
            <Input
              id="custom-name"
              {...customRegister("name")}
              placeholder="e.g. Grandma's stew"
            />
            {customErrors.name && (
              <p className="text-xs text-destructive">{customErrors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-category">Category</Label>
            <Select
              value={customWatch("category")}
              onValueChange={(v) => customSetValue("category", v as CustomFoodForm["category"])}
            >
              <SelectTrigger id="custom-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="fruits">Fruits</SelectItem>
                <SelectItem value="proteins">Proteins</SelectItem>
                <SelectItem value="grains">Grains</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
                <SelectItem value="fats_oils">Fats & Oils</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
                <SelectItem value="nuts_seeds">Nuts & Seeds</SelectItem>
                <SelectItem value="herbs_spices">Herbs & Spices</SelectItem>
                <SelectItem value="prepared_foods">Prepared Foods</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-vk">Vitamin K (mcg per 100g)</Label>
            <Input
              id="custom-vk"
              type="number"
              step="0.1"
              {...customRegister("vitamin_k_mcg_per_100g", { valueAsNumber: true })}
              placeholder="e.g. 12.5"
            />
            {customErrors.vitamin_k_mcg_per_100g && (
              <p className="text-xs text-destructive">{customErrors.vitamin_k_mcg_per_100g.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="custom-portion-size">Portion size (g)</Label>
              <Input
                id="custom-portion-size"
                type="number"
                step="0.1"
                {...customRegister("common_portion_size_g", { valueAsNumber: true })}
              />
              {customErrors.common_portion_size_g && (
                <p className="text-xs text-destructive">{customErrors.common_portion_size_g.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-portion-name">Portion name</Label>
              <Input
                id="custom-portion-name"
                {...customRegister("common_portion_name")}
                placeholder="e.g. cup, slice"
              />
              {customErrors.common_portion_name && (
                <p className="text-xs text-destructive">{customErrors.common_portion_name.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createCustomFood.isPending} size="sm">
              {createCustomFood.isPending ? "Saving..." : "Save & Select Food"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {selectedFoodRow && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 rounded-lg border bg-accent/50">
            <div className="font-medium flex items-center gap-2">
              {sanitizeText(selectedFoodRow.name)}
              {(selectedFoodRow.vitamin_k_mcg_per_100g * selectedFoodRow.common_portion_size_g / 100) < 5 && (
                <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Low K</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <div>{selectedFoodRow.vitamin_k_mcg_per_100g} mcg per 100g</div>
              <div className="text-xs">
                Common portion: {sanitizeText(selectedFoodRow.common_portion_name)} ({selectedFoodRow.common_portion_size_g}g)
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="portion">Portion size (g)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("portion_size_g", selectedFoodRow.common_portion_size_g)}
                className="text-xs"
              >
                Use {sanitizeText(selectedFoodRow.common_portion_name)}
              </Button>
            </div>
            <Input
              id="portion"
              type="number"
              step="0.1"
              {...register("portion_size_g", { valueAsNumber: true })}
              placeholder={`e.g., ${selectedFoodRow.common_portion_size_g}`}
            />
            {errors.portion_size_g && (
              <p className="text-sm text-destructive">
                {errors.portion_size_g.message}
              </p>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {sanitizeText(selectedFoodRow.common_portion_name)} = {selectedFoodRow.common_portion_size_g}g
              </p>
              {watch("portion_size_g") && (
                <p className="text-sm font-medium text-primary">
                  Vitamin K: {((selectedFoodRow.vitamin_k_mcg_per_100g * (watch("portion_size_g") || 0)) / 100 || 0).toFixed(1)} mcg
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button type="submit" disabled={createMeal.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {createMeal.isPending ? "Adding..." : "Add Meal"}
            </Button>
            <SaveAsPresetButton
              food={selectedFoodRow}
              portion_size_g={watch("portion_size_g") || selectedFoodRow.common_portion_size_g}
              onSuccess={() => {
                setSelectedFoodRow(null);
                reset();
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFoodRow(null);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
