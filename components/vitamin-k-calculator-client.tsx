"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Plus, Trash2 } from "lucide-react";

interface CommonFood {
  id: string;
  name: string;
  vitamin_k_mcg_per_100g: number;
}

interface CalculatorItem {
  id: string;
  foodName: string;
  vitaminKPer100g: number;
  portionSize: number;
  vitaminKTotal: number;
}

interface VitaminKCalculatorClientProps {
  commonFoods: CommonFood[];
}

export function VitaminKCalculatorClient({ commonFoods }: VitaminKCalculatorClientProps) {
  const [items, setItems] = useState<CalculatorItem[]>([]);
  const [customFood, setCustomFood] = useState("");
  const [customVitaminK, setCustomVitaminK] = useState("");
  const [customPortion, setCustomPortion] = useState("");

  const addItem = (foodName: string, vitaminKPer100g: number, portionSize: number = 100) => {
    const newItem: CalculatorItem = {
      id: Date.now().toString(),
      foodName,
      vitaminKPer100g,
      portionSize,
      vitaminKTotal: (vitaminKPer100g * portionSize) / 100,
    };
    setItems([...items, newItem]);
  };

  const updatePortion = (id: string, newPortion: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          portionSize: newPortion,
          vitaminKTotal: (item.vitaminKPer100g * newPortion) / 100,
        };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalVitaminK = items.reduce((sum, item) => sum + item.vitaminKTotal, 0);

  const addCustomFood = () => {
    if (customFood && customVitaminK && customPortion) {
      addItem(customFood, parseFloat(customVitaminK), parseFloat(customPortion));
      setCustomFood("");
      setCustomVitaminK("");
      setCustomPortion("");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Calculator className="h-10 w-10 text-primary" />
            Vitamin K Calculator
          </h1>
          <p className="text-xl text-gray-600">
            Calculate total vitamin K content for your meals and compare foods
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Add Common Foods</CardTitle>
              <CardDescription>
                Click to add foods to your calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {commonFoods.map((food) => (
                  <Button
                    key={food.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(food.name, food.vitamin_k_mcg_per_100g)}
                    className="justify-between"
                  >
                    <span>{food.name}</span>
                    <span className="text-muted-foreground">
                      {food.vitamin_k_mcg_per_100g} mcg/100g
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Custom Food</CardTitle>
              <CardDescription>
                Enter vitamin K content for any food
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="food-name">Food Name</Label>
                <Input
                  id="food-name"
                  value={customFood}
                  onChange={(e) => setCustomFood(e.target.value)}
                  placeholder="e.g., Asparagus"
                />
              </div>
              <div>
                <Label htmlFor="vitamin-k">Vitamin K (mcg per 100g)</Label>
                <Input
                  id="vitamin-k"
                  type="number"
                  value={customVitaminK}
                  onChange={(e) => setCustomVitaminK(e.target.value)}
                  placeholder="e.g., 57"
                />
              </div>
              <div>
                <Label htmlFor="portion">Portion Size (g)</Label>
                <Input
                  id="portion"
                  type="number"
                  value={customPortion}
                  onChange={(e) => setCustomPortion(e.target.value)}
                  placeholder="e.g., 150"
                />
              </div>
              <Button onClick={addCustomFood} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add to Calculator
              </Button>
            </CardContent>
          </Card>
        </div>

        {items.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Calculation</CardTitle>
              <CardDescription>
                Adjust portion sizes to see vitamin K changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.foodName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.vitaminKPer100g} mcg per 100g
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.portionSize}
                        onChange={(e) => updatePortion(item.id, parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm">g</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        {item.vitaminKTotal.toFixed(1)} mcg
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Vitamin K:</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalVitaminK.toFixed(1)} mcg
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Typical Daily Limit (Low):</span>
                    <span className={totalVitaminK > 75 ? "text-destructive" : "text-green-600"}>
                      75 mcg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Typical Daily Limit (Moderate):</span>
                    <span className={totalVitaminK > 100 ? "text-destructive" : "text-green-600"}>
                      100 mcg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Typical Daily Limit (High):</span>
                    <span className={totalVitaminK > 150 ? "text-destructive" : "text-green-600"}>
                      150 mcg
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Important Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              This calculator is for educational purposes only. Your individual vitamin K 
              limits should be determined by your healthcare provider based on your 
              warfarin dosage and INR stability. Always consult with your doctor before 
              making significant dietary changes.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Want to track your daily vitamin K intake automatically?
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg">
              Sign Up for Free Tracking
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}