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
import { api } from "@/lib/trpc/provider";
import { useToast } from "@/lib/hooks/use-toast";
import { Bookmark, Loader2 } from "lucide-react";
import type { Food } from "@/lib/types";

interface SaveAsPresetButtonProps {
  food: Food;
  portion_size_g: number;
  onSuccess?: () => void;
}

export function SaveAsPresetButton({ food, portion_size_g, onSuccess }: SaveAsPresetButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [preset_name, setPresetName] = useState("");
  
  const utils = api.useUtils();
  const createPreset = api.mealPreset.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Preset saved",
        description: "Your meal preset has been saved successfully.",
      });
      setOpen(false);
      setPresetName("");
      utils.mealPreset.getAll.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handle_save = () => {
    if (!preset_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your preset.",
        variant: "destructive",
      });
      return;
    }

    createPreset.mutate({
      name: preset_name.trim(),
      food_id: food.id,
      portion_size_g,
    });
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
            disabled={createPreset.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handle_save}
            disabled={createPreset.isPending || !preset_name.trim()}
          >
            {createPreset.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}