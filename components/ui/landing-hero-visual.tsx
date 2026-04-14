"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { day: "Mon", vitamin_k: 72, fill: "var(--color-vitamin_k)" },
  { day: "Tue", vitamin_k: 95, fill: "var(--color-vitamin_k)" },
  { day: "Wed", vitamin_k: 64, fill: "var(--color-vitamin_k)" },
  { day: "Thu", vitamin_k: 110, fill: "var(--color-over_limit)" },
  { day: "Fri", vitamin_k: 88, fill: "var(--color-vitamin_k)" },
  { day: "Sat", vitamin_k: 76, fill: "var(--color-vitamin_k)" },
  { day: "Sun", vitamin_k: 91, fill: "var(--color-vitamin_k)" },
];

const chartConfig = {
  vitamin_k: {
    label: "Vitamin K",
    color: "hsl(142, 71%, 45%)",
  },
  over_limit: {
    label: "Over Limit",
    color: "hsl(0, 84.2%, 60.2%)",
  },
} satisfies ChartConfig;

export function LandingHeroVisual() {
  return (
    <div className="space-y-4 transform md:rotate-1 transition-shadow duration-500 hover:shadow-2xl">
      {/* Mini dashboard cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Daily</p>
            <p className="text-lg font-bold text-green-600">72 mcg</p>
            <Progress value={72} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Weekly</p>
            <p className="text-lg font-bold text-amber-600">486 mcg</p>
            <Progress value={69} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-lg font-bold text-blue-600">2.1K mcg</p>
            <Progress value={70} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Weekly bar chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weekly Intake
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ChartContainer config={chartConfig} className="min-h-[140px] w-full">
            <BarChart accessibilityLayer data={chartData} barSize={24}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={4} />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => `${Number(v)} mcg`} />}
              />
              <ReferenceLine y={100} stroke="hsl(0, 84.2%, 60.2%)" strokeDasharray="4 3" strokeWidth={1} />
              <Bar dataKey="vitamin_k" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}