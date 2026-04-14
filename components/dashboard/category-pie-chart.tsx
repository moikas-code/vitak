"use client";

import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MealLogWithFood, FoodCategory } from "@/lib/types";

interface CategoryPieChartProps {
  meals: MealLogWithFood[];
}

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  proteins: "Proteins",
  grains: "Grains",
  dairy: "Dairy",
  fats_oils: "Fats & Oils",
  beverages: "Beverages",
  other: "Other",
};

const chartConfig = {
  vegetables: { label: "Vegetables", color: "hsl(142, 71%, 45%)" },
  fruits: { label: "Fruits", color: "hsl(38, 92%, 50%)" },
  proteins: { label: "Proteins", color: "hsl(0, 84.2%, 60.2%)" },
  grains: { label: "Grains", color: "hsl(45, 93%, 47%)" },
  dairy: { label: "Dairy", color: "hsl(210, 80%, 60%)" },
  fats_oils: { label: "Fats & Oils", color: "hsl(280, 65%, 55%)" },
  beverages: { label: "Beverages", color: "hsl(190, 80%, 45%)" },
  other: { label: "Other", color: "hsl(240, 5%, 55%)" },
} satisfies ChartConfig;

export function CategoryPieChart({ meals }: CategoryPieChartProps) {
  const categoryTotals = meals.reduce<
    Record<string, number>
  >((acc, meal) => {
    const category = (meal.food?.category ?? "other") as FoodCategory;
    acc[category] = (acc[category] ?? 0) + (meal.vitamin_k_consumed_mcg ?? 0);
    return acc;
  }, {});

  const chartData = (Object.entries(categoryTotals) as [FoodCategory, number][])
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([category, value]) => ({
      category,
      value: Math.round(value),
      fill: `var(--color-${category})`,
      label: CATEGORY_LABELS[category] ?? category,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>By Category</CardTitle>
          <CardDescription>Vitamin K breakdown by food category</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No meals to categorize.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>By Category</CardTitle>
        <CardDescription>Vitamin K breakdown by food category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="category"
                  formatter={(value, name) => {
                    const cat = name as FoodCategory;
                    return `${Number(value).toLocaleString()} mcg (${CATEGORY_LABELS[cat] ?? cat})`;
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="category" />}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}