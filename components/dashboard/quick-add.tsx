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
import { Search, Plus, Wifi, WifiOff } from "lucide-react";
import type { Food } from "@/lib/types";
import { track_meal_event, track_search_event } from "@/lib/analytics";
import { SaveAsPresetButton } from "./save-as-preset-button";
import { useOfflineMealLogs, useOfflineFoodSearch, useConnectionStatus } from "@/lib/offline/hooks";

const add_meal_schema = z.object({
  food_id: z.string().min(1, "Please select a food"),
  portion_size_g: z.number().positive("Portion size must be positive"),
});

type AddMealForm = z.infer<typeof add_meal_schema>;

export function QuickAdd() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use offline-capable hooks
  const { foods, is_loading } = useOfflineFoodSearch(search);
  const { addMealLog } = useOfflineMealLogs();
  const { is_online, unsynced_count } = useConnectionStatus();
  
  // Keep utils for invalidation when online
  const utils = api.useUtils();

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

  const onSubmit = async (data: AddMealForm) => {
    if (!selectedFood) return;
    
    setIsSubmitting(true);
    
    try {
      await addMealLog(data.food_id, data.portion_size_g);
      
      track_meal_event('saved', {
        food_category: selectedFood.category,
        vitamin_k_amount: selectedFood.vitamin_k_mcg_per_100g > 50 ? 'high' : selectedFood.vitamin_k_mcg_per_100g > 20 ? 'medium' : 'low'
      });
      
      toast({
        title: "Meal logged",
        description: is_online 
          ? "Your meal has been added successfully." 
          : "Meal saved offline. Will sync when connection is restored.",
      });
      
      setSelectedFood(null);
      setSearch("");
      reset();
      
      // Invalidate queries if online
      if (is_online) {
        utils.mealLog.getToday.invalidate();
        utils.credit.getAllBalances.invalidate();
      }
    } catch (error) {
      console.error('Failed to add meal:', error);
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

      {is_loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}
      
      {/* Connection status indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {is_online ? (
          <><Wifi className="h-3 w-3" /> Online</>
        ) : (
          <><WifiOff className="h-3 w-3" /> Offline</>
        )}
        {unsynced_count > 0 && (
          <span className="text-amber-600">({unsynced_count} pending sync)</span>
        )}
      </div>

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
                <div>{food.vitamin_k_mcg_per_100g} mcg per 100g</div>
                <div className="text-xs">
                  {food.common_portion_name} ({food.common_portion_size_g}g): {((food.vitamin_k_mcg_per_100g * food.common_portion_size_g) / 100).toFixed(1)} mcg
                </div>
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
              <div>{selectedFood.vitamin_k_mcg_per_100g} mcg per 100g</div>
              <div className="text-xs">
                Common portion: {selectedFood.common_portion_name} ({selectedFood.common_portion_size_g}g)
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
                onClick={() => setValue("portion_size_g", selectedFood.common_portion_size_g)}
                className="text-xs"
              >
                Use {selectedFood.common_portion_name}
              </Button>
            </div>
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
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {selectedFood.common_portion_name} = {selectedFood.common_portion_size_g}g
              </p>
              {watch("portion_size_g") && (
                <p className="text-sm font-medium text-primary">
                  Vitamin K: {((selectedFood.vitamin_k_mcg_per_100g * (watch("portion_size_g") || 0)) / 100).toFixed(1)} mcg
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              {isSubmitting ? "Adding..." : "Add Meal"}
            </Button>
            <SaveAsPresetButton
              food={selectedFood}
              portion_size_g={watch("portion_size_g") || selectedFood.common_portion_size_g}
              onSuccess={() => {
                setSelectedFood(null);
                reset();
              }}
            />
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