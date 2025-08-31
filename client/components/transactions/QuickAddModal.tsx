import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function QuickAddModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");

  useEffect(() => {
    const onOpen = () => setOpen(true);
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
            <Input type="number" placeholder="0.00" className="h-11 text-lg" />
          </div>
          <div className="grid gap-3">
            <label className="text-sm">Account</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Checking • $3,240.00</SelectItem>
                <SelectItem value="2">Savings • $12,800.00</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <label className="text-sm">Category</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-primary text-primary-foreground hover:opacity-90">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
