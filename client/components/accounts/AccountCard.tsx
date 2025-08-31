import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Trash2, Pencil } from "lucide-react";
import { formatINR } from "@/lib/inr";

export function AccountCard({ account, onEdit, onDelete }: { account: any; onEdit: (a: any) => void; onDelete: (id: string) => void }) {
  return (
    <Card className="rounded-2xl border-0 bg-white/60 p-5 shadow-md backdrop-blur dark:bg-black/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <div className="font-semibold">{account.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{account.type}{account.subType?` • ${account.subType}`:""}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => onEdit(account)}><Pencil className="size-4"/></Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(account._id)}><Trash2 className="size-4"/></Button>
        </div>
      </div>
      <div className="mt-4 text-2xl font-bold">{formatINR(account.balance)}</div>
    </Card>
  );
}
