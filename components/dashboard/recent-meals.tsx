"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc/provider";
import { useToast } from "@/lib/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { useOfflineMealLogs, useConnectionStatus } from "@/lib/offline/hooks";
import type { MealLogWithFood } from "@/lib/types";

interface RecentMealsProps {
  meals: MealLogWithFood[];
}

export function RecentMeals({ meals }: RecentMealsProps) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const { deleteMealLog } = useOfflineMealLogs();
  const { is_online } = useConnectionStatus();
  
  const handleDeleteMeal = async (meal_id: string) => {
    try {
      await deleteMealLog(meal_id);
      
      toast({
        title: "Meal removed",
        description: is_online 
          ? "The meal has been removed from your log."
          : "Meal removed locally. Will sync when connection is restored.",
      });
      
      // Invalidate queries if online
      if (is_online) {
        utils.mealLog.getToday.invalidate();
        utils.credit.getAllBalances.invalidate();
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
      toast({
        title: "Error",
        description: "Failed to remove meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (meals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No meals logged today. Start by adding your first meal!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {meals.map((meal) => (
        <div
          key={meal.id}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div>
            <div className="font-medium">{meal.food?.name || "Unknown Food"}</div>
            <div className="text-sm text-muted-foreground">
              {meal.portion_size_g}g
              {meal.food?.common_portion_name && meal.food?.common_portion_size_g && (
                <span className="text-xs">
                  {" "}({(meal.portion_size_g / meal.food.common_portion_size_g).toFixed(1)} × {meal.food.common_portion_name})
                </span>
              )}
              {" "}• {meal.vitamin_k_consumed_mcg.toFixed(1)} mcg
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteMeal(meal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}