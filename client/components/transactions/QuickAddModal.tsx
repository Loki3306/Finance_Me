import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export function QuickAddModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onOpen = async () => {
      setOpen(true);
      try { const res = await apiFetch('/api/accounts'); if (res.ok) setAccounts(await res.json()); } catch {}
    };
    window.addEventListener("ff:openQuickAdd" as any, onOpen);
    return () => window.removeEventListener("ff:openQuickAdd" as any, onOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(["income","expense","transfer"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className={cn("rounded-lg border p-2 text-sm capitalize transition", type===t?"bg-success/10 border-success text-foreground":"hover:bg-accent")}>{t}</button>
            ))}
          </div>
          <div className="grid gap-3">
            <label className="text-sm">Amount</label>
            <Input type="number" placeholder="0.00" className="h-11 text-lg" value={amount} onChange={(e)=>setAmount(e.target.value)} />
          </div>
          <div className="grid gap-3">
            <label className="text-sm">Account</label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a)=> (
                  <SelectItem key={a._id} value={a._id}>{a.name} • ₹{a.balance}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <label className="text-sm">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {['food','transport','shopping','salary','rent','groceries'].map((c)=> <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={loading || !amount || !account || !category} className="w-full bg-primary text-primary-foreground hover:opacity-90" onClick={async()=>{
            setLoading(true);
            try {
              const payload: any = { amount: Number(amount), type, accountId: account, category, date: new Date().toISOString() };
              const res = await apiFetch('/api/transactions', { method: 'POST', body: JSON.stringify(payload) });
              if (res.ok) setOpen(false);
            } finally { setLoading(false); }
          }}>{loading? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
