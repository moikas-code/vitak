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

interface IntakeHistoryChartProps {
  groupedByDate: Record<string, MealLogWithFood[]>;
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

export function IntakeHistoryChart({ groupedByDate, dailyLimit }: IntakeHistoryChartProps) {
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => a.localeCompare(b));

  const chartData = sortedDates.map((date) => {
    const dayTotal = groupedByDate[date].reduce(
      (sum, log) => sum + (log.vitamin_k_consumed_mcg ?? 0),
      0
    );
    return {
      date: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      vitamin_k: Math.round(dayTotal),
      fill: dayTotal > dailyLimit ? "var(--color-over_limit)" : "var(--color-vitamin_k)",
    };
  });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Intake</CardTitle>
          <CardDescription>Vitamin K consumption over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data for the selected range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Intake</CardTitle>
        <CardDescription>
          {dailyLimit} mcg daily limit shown as dashed line
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
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
                  formatter={(value) => `${Number(value).toLocaleString()} mcg`}
                />
              }
            />
            <ReferenceLine
              y={dailyLimit}
              stroke="hsl(0, 84.2%, 60.2%)"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
            <Bar dataKey="vitamin_k" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}