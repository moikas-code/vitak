"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MealLogWithFood } from "@/lib/types";

interface VitaminKDailyChartProps {
  meals: MealLogWithFood[];
  dailyLimit: number;
}

const chartConfig = {
  vitamin_k: {
    label: "Vitamin K (mcg)",
    color: "hsl(142, 71%, 45%)",
  },
  over_limit: {
    label: "Over Limit",
    color: "hsl(0, 84.2%, 60.2%)",
  },
} satisfies ChartConfig;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function VitaminKDailyChart({ meals, dailyLimit }: VitaminKDailyChartProps) {
  const chartData = meals
    .slice()
    .reverse() // chronological order (meals come in desc)
    .map((meal) => ({
      time: formatTime(new Date(meal.logged_at)),
      food_name: meal.food?.name ?? "Unknown",
      vitamin_k: meal.vitamin_k_consumed_mcg ?? 0,
      fill: (meal.vitamin_k_consumed_mcg ?? 0) > dailyLimit * 0.5
        ? "var(--color-over_limit)"
        : "var(--color-vitamin_k)",
    }));

  const totalConsumed = meals.reduce(
    (sum, m) => sum + (m.vitamin_k_consumed_mcg ?? 0),
    0
  );

  if (meals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Intake</CardTitle>
          <CardDescription>Vitamin K consumption per meal</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No meals logged yet. Add a meal to see your chart!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Intake</CardTitle>
        <CardDescription>
          {totalConsumed.toFixed(0)} mcg of {dailyLimit} mcg daily limit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="food_name"
                  nameKey="food_name"
                  formatter={(value) => `${Number(value).toFixed(1)} mcg`}
                />
              }
            />
            <ReferenceLine
              y={dailyLimit}
              stroke="hsl(0, 84.2%, 60.2%)"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
            <Bar
              dataKey="vitamin_k"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}