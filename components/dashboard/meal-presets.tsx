"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { Trash2, Plus, Loader2, Bookmark } from "lucide-react";
import { api } from "@/lib/trpc/provider";
import { sanitizeText } from "@/lib/security/sanitize-html";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { track_meal_event } from "@/lib/analytics";
import { getVitaminKColor, getVitaminKLevel } from "@/lib/config/constants";


type PresetItem = {
  id: string;
  name: string;
  portionSizeG: number;
  vitaminKMcg: number;
  usageCount: number;
  food?: { name?: string | null; category?: string | null } | null;
  [key: string]: unknown;
};

export function MealPresets() {
  const { toast } = useToast();
  const [delete_preset_id, setDeletePresetId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: presets, isLoading } = api.mealPreset.getAll.useQuery(undefined, {
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const delete_mutation = api.mealPreset.delete.useMutation({
    onSuccess: () => {
      utils.mealPreset.getAll.invalidate();
      toast({ title: "Preset deleted", description: "The preset has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete preset.", variant: "destructive" });
    },
  });

  const log_mutation = api.mealPreset.logFromPreset.useMutation({
    onSuccess: (newMeal, preset_id) => {
      // Optimistically add the meal to the cache
      if (newMeal) {
        utils.mealLog.getToday.setData({} as any, (old: any) => {
          if (!old) return [newMeal];
          return [newMeal, ...old];
        });
      }
      utils.mealPreset.getAll.invalidate();
      utils.credit.getAllBalances.invalidate();

      const preset = presets?.find(p => p.id === preset_id);
      if (preset) {
        track_meal_event('saved', {
          food_category: preset.food?.category,
          vitamin_k_amount: getVitaminKLevel(preset.vitaminKMcg),
        });
      }
      toast({ title: "Meal logged", description: `${preset?.food?.name ?? 'Meal'} added from preset.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log meal from preset.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!presets || presets.length === 0) {
    return (
      <div className="text-center py-8">
        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No meal presets yet. Save your favorite meal combinations for quick access!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((preset) => {
          const p = preset as PresetItem;
          const vitaminK = p.vitaminKMcg ?? (p.vitamin_k_mcg as number) ?? 0;
          const portionG = p.portionSizeG ?? (p.portion_size_g as number) ?? 0;
          const usage = p.usageCount ?? (p.usage_count as number) ?? 0;

          return (
            <Card key={preset.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{sanitizeText(preset.name)}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {sanitizeText(preset.food?.name) || "Unknown Food"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">{portionG}g</span>
                    <span className="text-sm">•</span>
                    <span className={`text-sm font-medium ${getVitaminKColor(vitaminK)}`}>
                      {vitaminK.toFixed(1)} mcg
                    </span>
                  </div>
                  {usage > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Used {usage} time{usage !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletePresetId(preset.id)}
                  className="ml-2 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => log_mutation.mutate(preset.id)}
                disabled={log_mutation.isPending && log_mutation.variables === preset.id}
              >
                {log_mutation.isPending && log_mutation.variables === preset.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Quick Add
              </Button>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!delete_preset_id} onOpenChange={() => setDeletePresetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meal preset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (delete_preset_id) {
                  delete_mutation.mutate(delete_preset_id);
                  setDeletePresetId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}