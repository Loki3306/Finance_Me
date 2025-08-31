import { TransactionList } from "@/components/transactions/TransactionList";
import { Button } from "@/components/ui/button";

export default function Transactions() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button className="bg-primary text-primary-foreground" onClick={() => window.dispatchEvent(new CustomEvent("ff:openQuickAdd" as any))}>Add Transaction</Button>
      </div>
      <TransactionList />
    </div>
  );
}
