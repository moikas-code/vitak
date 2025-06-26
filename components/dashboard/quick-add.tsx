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
import type { Food } from "@/lib/types";
import { track_meal_event, track_search_event } from "@/lib/analytics";

const add_meal_schema = z.object({
  food_id: z.string().min(1, "Please select a food"),
  portion_size_g: z.number().positive("Portion size must be positive"),
});

type AddMealForm = z.infer<typeof add_meal_schema>;

export function QuickAdd() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  
  const { data: foods, isLoading } = api.food.search.useQuery(
    { query: search },
    { enabled: search.length > 0 }
  );

  const utils = api.useUtils();
  const addMeal = api.mealLog.add.useMutation({
    onSuccess: () => {
      track_meal_event('saved', {
        food_category: selectedFood?.category,
        vitamin_k_amount: selectedFood && selectedFood.vitamin_k_mcg_per_100g > 50 ? 'high' : selectedFood && selectedFood.vitamin_k_mcg_per_100g > 20 ? 'medium' : 'low'
      });
      toast({
        title: "Meal logged",
        description: "Your meal has been added successfully.",
      });
      setSelectedFood(null);
      setSearch("");
      reset();
      utils.mealLog.getToday.invalidate();
      utils.credit.getAllBalances.invalidate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddMealForm>({
    resolver: zodResolver(add_meal_schema),
  });

  const onSubmit = (data: AddMealForm) => {
    addMeal.mutate(data);
  };

  const selectFood = (food: Food) => {
    track_meal_event('food_selected', {
      food_category: food.category,
      vitamin_k_amount: food.vitamin_k_mcg_per_100g > 50 ? 'high' : food.vitamin_k_mcg_per_100g > 20 ? 'medium' : 'low'
    });
    setSelectedFood(food);
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
                track_search_event('food_search', {
                  query_length: value.length
                });
              }
            }}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {foods && foods.length > 0 && !selectedFood && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {foods.map((food) => (
            <button
              key={food.id}
              onClick={() => selectFood(food)}
              className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="font-medium">{food.name}</div>
              <div className="text-sm text-muted-foreground">
                {food.vitamin_k_mcg_per_100g} mcg per 100g
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedFood && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 rounded-lg border bg-accent/50">
            <div className="font-medium">{selectedFood.name}</div>
            <div className="text-sm text-muted-foreground">
              {selectedFood.vitamin_k_mcg_per_100g} mcg per 100g
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portion">Portion size (g)</Label>
            <Input
              id="portion"
              type="number"
              step="0.1"
              {...register("portion_size_g", { valueAsNumber: true })}
              placeholder={`e.g., ${selectedFood.common_portion_size_g}`}
            />
            {errors.portion_size_g && (
              <p className="text-sm text-destructive">
                {errors.portion_size_g.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedFood.common_portion_name} = {selectedFood.common_portion_size_g}g
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={addMeal.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Add Meal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFood(null);
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