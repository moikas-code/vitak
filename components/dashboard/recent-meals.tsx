"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc/provider";
import { useToast } from "@/lib/hooks/use-toast";
import { Trash2 } from "lucide-react";
import type { MealLogWithFood } from "@/lib/types";

interface RecentMealsProps {
  meals: MealLogWithFood[];
}

export function RecentMeals({ meals }: RecentMealsProps) {
  const { toast } = useToast();
  const utils = api.useUtils();
  
  const deleteMeal = api.mealLog.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Meal removed",
        description: "The meal has been removed from your log.",
      });
      utils.mealLog.getToday.invalidate();
      utils.credit.getAllBalances.invalidate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove meal. Please try again.",
        variant: "destructive",
      });
    },
  });

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
              {meal.portion_size_g}g • {meal.vitamin_k_consumed_mcg.toFixed(1)} mcg
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMeal.mutate(meal.id)}
            disabled={deleteMeal.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}