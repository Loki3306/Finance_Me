import React from 'react';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Trash2, Pencil, TrendingUp, AlertTriangle } from "lucide-react";
import { formatINR } from "@/lib/inr";

export function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: any;
  onEdit: (b: any) => void;
  onDelete: (id: string) => void;
}) {
  const spent = budget.currentPeriod?.spentAmount || 0;
  const total = budget.amount || 0;
  const progress = total > 0 ? (spent / total) * 100 : 0;
  const remaining = Math.max(0, total - spent);
  
  // Determine status color based on progress
  const getStatusColor = () => {
    if (progress >= 100) return "text-red-600";
    if (progress >= 90) return "text-orange-500";
    if (progress >= 75) return "text-yellow-500";
    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (progress >= 100) return <AlertTriangle className="size-4" />;
    return <TrendingUp className="size-4" />;
  };

  return (
    <Card className="rounded-2xl border-0 bg-white/60 p-5 shadow-md backdrop-blur dark:bg-black/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Target className="size-5" />
          </div>
          <div>
            <div className="font-semibold">{budget.name}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {budget.budgetType} • {budget.period}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => onEdit(budget)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(budget._id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {/* Amount Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{total === 0 ? <span className="text-gray-400">-</span> : formatINR(total)}</div>
            <div className="text-xs text-muted-foreground">Budget Limit</div>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={Math.min(progress, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatINR(spent)} spent</span>
            <span>{formatINR(remaining)} remaining</span>
          </div>
        </div>

        {/* Quick Stats */}
        {budget.currentPeriod?.transactionCount > 0 && (
          <div className="text-xs text-muted-foreground">
            {budget.currentPeriod.transactionCount} transactions this period
          </div>
        )}
      </div>
    </Card>
  );
}
