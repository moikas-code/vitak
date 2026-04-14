"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/provider";
import { useToast } from "@/lib/hooks/use-toast";
import { Search, Plus } from "lucide-react";
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

export function QuickAdd() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedFoodRow, setSelectedFoodRow] = useState<FoodRow | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const utils = api.useUtils();

  // Direct tRPC queries — no offline layer
  const { data: foods, isLoading: is_loading } = api.food.search.useQuery(
    { query: sanitizeSearchQuery(debouncedSearch) },
    { enabled: debouncedSearch.length > 0, retry: false, staleTime: 0 }
  );

  const createMeal = api.mealLog.add.useMutation({
    onSuccess: (newMeal) => {
      // Optimistically update the cache — don't wait for refetch
      utils.mealLog.getToday.setData(undefined as any, (old: any) => {
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

  return (
    <div className="space-y-4">
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

      {is_loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {foods && foods.length > 0 && !selectedFoodRow && (
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