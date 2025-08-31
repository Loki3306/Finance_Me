import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const recent = [
  { id: 1, name: "Grocery Store", amount: -64.2, category: "Food", date: "Today" },
  { id: 2, name: "Paycheck", amount: 2400, category: "Income", date: "Yesterday" },
  { id: 3, name: "Uber", amount: -18.5, category: "Transport", date: "2d ago" },
  { id: 4, name: "Coffee Shop", amount: -5.25, category: "Food", date: "2d ago" },
];

export function RecentActivity() {
  return (
    <Card className="rounded-2xl border-0 bg-white/60 p-4 shadow-md backdrop-blur dark:bg-black/30">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">Recent Activity</div>
      </div>
      <ul className="divide-y">
        {recent.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary font-semibold">
              {t.category[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{t.name}</span>
                <span className={cn("font-semibold", t.amount >= 0 ? "text-success" : "text-foreground")}>{t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{t.category} • {t.date}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
