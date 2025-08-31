import { Card } from "@/components/ui/card";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useState } from "react";

const COLORS = [
  "#1e293b",
  "#64748b",
  "#94a3b8",
  "#10b981",
  "#f59e0b",
];

const initialData = [
  { name: "Housing", value: 1200 },
  { name: "Food", value: 650 },
  { name: "Transport", value: 320 },
  { name: "Shopping", value: 480 },
  { name: "Other", value: 220 },
];

export function SpendingChart() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <Card className="rounded-2xl border-0 bg-white/60 p-6 shadow-md backdrop-blur dark:bg-black/30">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Spending by Category</div>
          <div className="text-xl font-semibold">This Month</div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={initialData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              dataKey="value"
              onClick={(d) => setActive(d.name as string)}
            >
              {initialData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={active && active !== entry.name ? 0.4 : 1} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {initialData.map((d, i) => (
          <button
            key={d.name}
            className="flex items-center gap-2 rounded-lg border bg-background/50 p-2 text-left transition hover:bg-background"
            onClick={() => setActive(d.name)}
          >
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-sm">{d.name}</span>
            <span className="ml-auto text-sm font-medium">${d.value}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
