"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";
import { Trash2, Plus, Loader2, Bookmark, WifiOff } from "lucide-react";
import { useOfflineMealPresets, useConnectionStatus } from "@/lib/offline/hooks";
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

export function MealPresets() {
  const { toast } = useToast();
  const [delete_preset_id, setDeletePresetId] = useState<string | null>(null);
  const [adding_preset_id, setAddingPresetId] = useState<string | null>(null);
  
  const { meal_presets: presets, is_loading: isLoading, deleteMealPreset, logFromPreset } = useOfflineMealPresets();
  const { is_online } = useConnectionStatus();
  
  const handle_delete_preset = async (preset_id: string) => {
    try {
      await deleteMealPreset(preset_id);
      toast({
        title: "Preset deleted",
        description: "The preset has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete preset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handle_log_preset = async (preset_id: string) => {
    setAddingPresetId(preset_id);
    try {
      await logFromPreset(preset_id);
      const preset = presets?.find(p => p.id === preset_id);
      if (preset) {
        track_meal_event('saved', {
          food_category: preset.food?.category,
          vitamin_k_amount: getVitaminKLevel(preset.vitamin_k_mcg)
        });
      }
      toast({
        title: "Meal logged",
        description: "Your meal has been added from the preset.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to log meal from preset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingPresetId(null);
    }
  };


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
        {!is_online && (
          <div className="flex items-center justify-center gap-2 mt-2 text-amber-600">
            <WifiOff className="h-4 w-4" />
            <span className="text-xs">Offline mode</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((preset) => (
          <Card key={preset.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{sanitizeText(preset.name)}</h4>
                <p className="text-sm text-muted-foreground truncate">
                  {sanitizeText(preset.food?.name) || "Unknown Food"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">{preset.portion_size_g}g</span>
                  <span className="text-sm">•</span>
                  <span className={`text-sm font-medium ${getVitaminKColor(preset.vitamin_k_mcg)}`}>
                    {preset.vitamin_k_mcg.toFixed(1)} mcg
                  </span>
                </div>
                {preset.usage_count > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Used {preset.usage_count} time{preset.usage_count !== 1 ? 's' : ''}
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
              onClick={() => handle_log_preset(preset.id)}
              disabled={adding_preset_id === preset.id}
            >
              {adding_preset_id === preset.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Quick Add
            </Button>
          </Card>
        ))}
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
                  await handle_delete_preset(delete_preset_id);
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