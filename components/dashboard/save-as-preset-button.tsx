"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { Bookmark, Loader2 } from "lucide-react";
import type { Food } from "@/lib/types";
import { useOfflineMealPresets } from "@/lib/offline/hooks";

interface SaveAsPresetButtonProps {
  food: Food;
  portion_size_g: number;
  onSuccess?: () => void;
}

export function SaveAsPresetButton({ food, portion_size_g, onSuccess }: SaveAsPresetButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [preset_name, setPresetName] = useState("");
  const [is_saving, setIsSaving] = useState(false);
  
  const { addMealPreset } = useOfflineMealPresets();

  const handle_save = async () => {
    if (!preset_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your preset.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const vitamin_k_mcg = (portion_size_g / 100) * food.vitamin_k_mcg_per_100g;
      
      await addMealPreset({
        name: preset_name.trim(),
        food_id: food.id,
        portion_size_g,
        vitamin_k_mcg,
      });
      
      toast({
        title: "Preset saved",
        description: "Your meal preset has been saved successfully.",
      });
      setOpen(false);
      setPresetName("");
      onSuccess?.();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save preset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const vitamin_k_amount = (portion_size_g / 100) * food.vitamin_k_mcg_per_100g;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bookmark className="mr-2 h-4 w-4" />
          Save as Preset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Meal as Preset</DialogTitle>
          <DialogDescription>
            Save this meal combination for quick access in the future.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg border bg-accent/50">
            <div className="font-medium">{food.name}</div>
            <div className="text-sm text-muted-foreground">
              {portion_size_g}g • {vitamin_k_amount.toFixed(1)} mcg Vitamin K
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              value={preset_name}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g., Morning Spinach Salad"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {preset_name.length}/50 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={is_saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handle_save}
            disabled={is_saving || !preset_name.trim()}
          >
            {is_saving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}