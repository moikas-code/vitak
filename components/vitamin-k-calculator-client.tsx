"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Plus, Trash2, Search, Leaf, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CommonFood {
  id: string | number;
  name: string;
  vitamin_k_mcg_per_100g: number;
  category: string | null;
  common_portion_name: string | null;
  common_portion_size_g: number | null;
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

function vkLevel(mcg: number) {
  if (mcg > 100) return "high" as const;
  if (mcg >= 20) return "moderate" as const;
  return "low" as const;
}

function vkColor(level: "high" | "moderate" | "low") {
  switch (level) {
    case "high":
      return "text-red-700 bg-red-50 border-red-200 hover:bg-red-100";
    case "moderate":
      return "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100";
    case "low":
      return "text-green-700 bg-green-50 border-green-200 hover:bg-green-100";
  }
}

function vkBadge(level: "high" | "moderate" | "low") {
  switch (level) {
    case "high":
      return <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">HIGH</span>;
    case "moderate":
      return <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">MOD</span>;
    case "low":
      return <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">LOW</span>;
  }
}

export function VitaminKCalculatorClient({ commonFoods }: VitaminKCalculatorClientProps) {
  const [items, setItems] = useState<CalculatorItem[]>([]);
  const [search, setSearch] = useState("");
  const [customFood, setCustomFood] = useState("");
  const [customVitaminK, setCustomVitaminK] = useState("");
  const [customPortion, setCustomPortion] = useState("100");

  const addItem = (food: CommonFood) => {
    const portionG = food.common_portion_size_g ?? 100;
    const newItem: CalculatorItem = {
      id: Date.now().toString() + Math.random(),
      foodName: food.name,
      vitaminKPer100g: food.vitamin_k_mcg_per_100g,
      portionSize: portionG,
      vitaminKTotal: Math.ceil((food.vitamin_k_mcg_per_100g * portionG) / 100),
    };
    setItems([...items, newItem]);
  };

  const addCustomFood = () => {
    const vk = parseFloat(customVitaminK);
    const portion = parseFloat(customPortion) || 100;
    if (customFood && !isNaN(vk)) {
      const newItem: CalculatorItem = {
        id: Date.now().toString() + Math.random(),
        foodName: customFood,
        vitaminKPer100g: vk,
        portionSize: portion,
        vitaminKTotal: Math.ceil((vk * portion) / 100),
      };
      setItems([...items, newItem]);
      setCustomFood("");
      setCustomVitaminK("");
      setCustomPortion("100");
    }
  };

  const updatePortion = (id: string, newPortion: number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            portionSize: newPortion,
            vitaminKTotal: Math.ceil((item.vitaminKPer100g * newPortion) / 100),
          };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const totalVitaminK = items.reduce((sum, item) => sum + item.vitaminKTotal, 0);

  // Group and filter common foods
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return commonFoods
      .filter((f) => f.name.toLowerCase().includes(q) || (f.category && f.category.toLowerCase().includes(q)))
      .sort((a, b) => b.vitamin_k_mcg_per_100g - a.vitamin_k_mcg_per_100g);
  }, [commonFoods, search]);

  const highVk = filtered.filter((f) => vkLevel(f.vitamin_k_mcg_per_100g) === "high");
  const moderateVk = filtered.filter((f) => vkLevel(f.vitamin_k_mcg_per_100g) === "moderate");
  const lowVk = filtered.filter((f) => vkLevel(f.vitamin_k_mcg_per_100g) === "low");

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Calculator className="h-10 w-10 text-primary" />
            Vitamin K Calculator
          </h1>
          <p className="text-lg text-gray-600">
            Calculate total vitamin K content for your meals. Values based on USDA FoodData Central.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Food picker — left side, wider */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Common Foods
                </CardTitle>
                <CardDescription>Click to add. Sorted by vitamin K content.</CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter foods..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* High VK */}
                {highVk.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      High VK (&gt;100 mcg/100g) — {highVk.length} foods
                    </div>
                    <div className="grid gap-1.5">
                      {highVk.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => addItem(food)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${vkColor("high")}`}
                        >
                          <span className="truncate mr-2">{food.name}</span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            {vkBadge("high")}
                            <span className="font-mono text-xs">{food.vitamin_k_mcg_per_100g} mcg</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moderate VK */}
                {moderateVk.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      Moderate (20–100 mcg/100g) — {moderateVk.length} foods
                    </div>
                    <div className="grid gap-1.5">
                      {moderateVk.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => addItem(food)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${vkColor("moderate")}`}
                        >
                          <span className="truncate mr-2">{food.name}</span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            {vkBadge("moderate")}
                            <span className="font-mono text-xs">{food.vitamin_k_mcg_per_100g} mcg</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Low VK */}
                {lowVk.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Low (&lt;20 mcg/100g) — {lowVk.length} foods
                    </div>
                    <div className="grid gap-1.5">
                      {lowVk.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => addItem(food)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${vkColor("low")}`}
                        >
                          <span className="truncate mr-2">{food.name}</span>
                          <span className="flex items-center gap-2 flex-shrink-0">
                            {vkBadge("low")}
                            <span className="font-mono text-xs">{food.vitamin_k_mcg_per_100g} mcg</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom food */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Custom Food</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <Input
                      value={customFood}
                      onChange={(e) => setCustomFood(e.target.value)}
                      placeholder="Food name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">VK (mcg/100g)</Label>
                    <Input
                      type="number"
                      value={customVitaminK}
                      onChange={(e) => setCustomVitaminK(e.target.value)}
                      placeholder="e.g. 57"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Portion (g)</Label>
                    <Input
                      type="number"
                      value={customPortion}
                      onChange={(e) => setCustomPortion(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addCustomFood} size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculator — right side */}
          <div className="lg:col-span-2">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Your Calculation</CardTitle>
                {items.length === 0 && (
                  <CardDescription>Click foods to start calculating</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Add foods from the list to see your total vitamin K</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                            vkLevel(item.vitaminKPer100g) === "high"
                              ? "bg-red-50 border-red-100"
                              : vkLevel(item.vitaminKPer100g) === "moderate"
                                ? "bg-amber-50 border-amber-100"
                                : "bg-green-50 border-green-100"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.foodName}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.vitaminKPer100g} mcg/100g
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              value={item.portionSize}
                              onChange={(e) =>
                                updatePortion(item.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 h-7 text-xs text-center"
                            />
                            <span className="text-xs text-muted-foreground">g</span>
                          </div>
                          <div className="text-right w-16">
                            <div className="font-semibold text-sm">
                              {Math.ceil(item.vitaminKTotal)} mcg
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-semibold">Total VK:</span>
                        <span
                          className={`text-3xl font-bold ${
                            totalVitaminK > 150
                              ? "text-red-600"
                              : totalVitaminK > 100
                                ? "text-amber-600"
                                : "text-green-600"
                          }`}
                        >
                          {Math.ceil(totalVitaminK)} mcg
                        </span>
                      </div>

                      {/* Daily limit context bar */}
                      <div className="space-y-1.5">
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                              totalVitaminK > 150
                                ? "bg-red-500"
                                : totalVitaminK > 100
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min((totalVitaminK / 150) * 100, 100)}%` }}
                          />
                          {/* Markers at 75 and 120 */}
                          <div className="absolute top-0 h-full w-px bg-gray-400" style={{ left: `${(75 / 150) * 100}%` }} />
                          <div className="absolute top-0 h-full w-px bg-gray-400" style={{ left: `${(120 / 150) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>75 mcg</span>
                          <span>120 mcg</span>
                          <span>150 mcg</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        Typical daily target: 70–120 mcg (consult your doctor)
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-muted-foreground"
                      onClick={() => setItems([])}
                    >
                      Clear all
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="mt-8 bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-900 text-base">Important Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800 text-sm">
              This calculator is for educational purposes only. Your individual vitamin K limits
              should be determined by your healthcare provider based on your warfarin dosage and INR
              stability. Always consult with your doctor before making significant dietary changes.
              VK values are ceiling-rounded for safety.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Want to track your daily vitamin K intake automatically?
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg">Sign Up for Free Tracking</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}