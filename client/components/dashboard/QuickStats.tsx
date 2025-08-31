import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";

export function QuickStats() {
  const stats = [
    { label: "Income", value: 8200, change: "+12.5%", icon: ArrowUpRight, color: "text-success" },
    { label: "Expenses", value: 5400, change: "-3.1%", icon: ArrowDownRight, color: "text-destructive" },
    { label: "Savings", value: 2800, change: "+6.2%", icon: PiggyBank, color: "text-primary" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="rounded-2xl border-0 bg-white/60 p-5 shadow-md backdrop-blur dark:bg-black/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(s.value)}</div>
            </div>
            <s.icon className={`size-6 ${s.color}`} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{s.change} this month</div>
        </Card>
      ))}
    </div>
  );
}
