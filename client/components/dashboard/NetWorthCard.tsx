import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

const data = Array.from({ length: 30 }, (_, i) => ({ d: i + 1, v: 12000 + Math.sin(i / 3) * 800 + i * 30 }));

export function NetWorthCard() {
  const start = data[0].v;
  const end = data[data.length - 1].v;
  const diff = end - start;
  const pct = (diff / start) * 100;
  const up = diff >= 0;

  return (
    <Card className="relative overflow-hidden rounded-2xl border-0 bg-white/60 p-6 shadow-md backdrop-blur dark:bg-black/30">
      <div className="grid gap-4 md:grid-cols-2 md:items-center">
        <div className="space-y-3">
          <div className="text-sm text-secondary-foreground/70">Total Net Worth</div>
          <div className="text-4xl font-extrabold tracking-tight md:text-5xl">
            ${end.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {up ? (
              <span className="inline-flex items-center gap-1 text-success"><TrendingUp className="size-4" />{pct.toFixed(1)}%</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-destructive"><TrendingDown className="size-4" />{pct.toFixed(1)}%</span>
            )}
            <span className="text-muted-foreground">last 30 days</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="bg-primary text-primary-foreground hover:opacity-90">Add Transaction</Button>
            <Button variant="outline">Transfer</Button>
          </div>
        </div>
        <div className="h-28 md:h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, bottom: 0, left: 0, right: 0 }}>
              <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
    </Card>
  );
}
