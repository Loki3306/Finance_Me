import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/inr";
import { apiFetch } from "@/lib/api";

export function TransactionList() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (debounced) params.set("search", debounced);
    if (type !== "all") params.set("type", type);
    params.set("page", String(page));
    params.set("limit", "50");
    params.set("sort", "date_desc");
    return params.toString();
  }, [debounced, type, page]);

  const { data = [], isFetching } = useQuery({ queryKey: ["tx", qs], queryFn: async () => {
    const res = await apiFetch(`/api/transactions${qs?`?${qs}`:""}`);
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search transactions (description, category)" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <div className="inline-flex rounded-md border p-1">
          {["all","income","expense","transfer"].map((t) => (
            <button key={t} onClick={() => { setType(t); setPage(1); }} className={`px-3 py-1 text-sm capitalize rounded ${type===t?"bg-primary text-primary-foreground":"hover:bg-accent"}`}>{t}</button>
          ))}
        </div>
        <Button onClick={() => window.dispatchEvent(new CustomEvent("ff:openQuickAdd" as any))}>Add</Button>
        <Button variant="outline" onClick={() => window.open(`/api/transactions/export`, "_blank")}>Export CSV</Button>
      </div>
      <ul className="divide-y rounded-xl border bg-white/50 backdrop-blur dark:bg-black/20">
        {data.map((t: any) => (
          <li key={t._id} className={`flex items-center gap-3 p-3 border-l-4 ${t.type==='income'?'border-green-500':t.type==='expense'?'border-red-500':'border-blue-500'}`}>
            <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary font-semibold">
              {t.category?.[0] || "T"}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{t.description || t.category}</span>
                <span className={t.type === 'income' ? 'text-success' : 'text-red-600'}>
                  {t.type === 'income' ? '+' : t.type==='expense' ? '-' : ''}{formatINR(Math.abs(t.amount))}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('en-IN')} • {t.category}</div>
            </div>
            <div>
              <Button variant="ghost" size="sm" onClick={async () => { await apiFetch(`/api/transactions/${t._id}`, { method: 'DELETE' }); location.reload(); }}>Delete</Button>
            </div>
          </li>
        ))}
        {!data.length && <li className="p-6 text-center text-sm text-muted-foreground">No transactions</li>}
      </ul>
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page<=1} onClick={() => setPage((p)=>p-1)}>Previous</Button>
        <div className="text-sm text-muted-foreground">Page {page}</div>
        <Button variant="outline" disabled={data.length<50} onClick={() => setPage((p)=>p+1)}>{isFetching?"Loading...":"Next"}</Button>
      </div>
    </div>
  );
}
