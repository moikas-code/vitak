"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import type { VitaminKPeriod } from "@/lib/types";

interface CreditDisplayProps {
  title: string;
  current: number;
  limit: number;
  period: VitaminKPeriod;
}

export function CreditDisplay({ title, current = 0, limit = 100, period: _period }: CreditDisplayProps) {
  const safeCurrent = current ?? 0;
  const safeLimit = limit ?? 100;
  const percentage = (safeCurrent / safeLimit) * 100;
  const remaining = safeLimit - safeCurrent;
  
  const getColorClass = () => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-warning";
    return "text-success";
  };

  const getProgressColor = () => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-warning";
    return "bg-success";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className={cn("text-2xl font-bold", getColorClass())}>
            {(safeCurrent).toFixed(0)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {safeLimit} mcg
          </span>
        </div>
        
        <Progress 
          value={percentage} 
          className="h-2"
          indicatorClassName={getProgressColor()}
        />
        
        <p className="text-sm text-muted-foreground">
          {remaining > 0 
            ? `${remaining.toFixed(0)} mcg remaining`
            : `${Math.abs(remaining).toFixed(0)} mcg over limit`
          }
        </p>
      </CardContent>
    </Card>
  );
}