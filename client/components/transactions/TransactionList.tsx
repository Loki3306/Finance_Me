import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/inr";

export function TransactionList() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);

  const { data = [], refetch, isFetching } = useQuery({ queryKey: ["tx", debounced], queryFn: async () => {
    const res = await fetch(`/api/transactions${debounced?`?q=${encodeURIComponent(debounced)}`:""}`);
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search transactions (/, amount, merchant, category)" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => window.dispatchEvent(new CustomEvent("ff:openQuickAdd" as any))}>Add</Button>
      </div>
      <ul className="divide-y rounded-xl border bg-white/50 backdrop-blur dark:bg-black/20">
        {data.map((t: any) => (
          <li key={t._id} className="flex items-center gap-3 p-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary font-semibold">
              {t.category?.[0] || "T"}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{t.description || t.category}</span>
                <span className={t.type === 'income' ? 'text-success' : ''}>{t.type === 'income' ? '+' : '-'}{formatINR(Math.abs(t.amount))}</span>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('en-IN')} • {t.category}</div>
            </div>
          </li>
        ))}
        {!data.length && <li className="p-6 text-center text-sm text-muted-foreground">No transactions</li>}
      </ul>
    </div>
  );
}
