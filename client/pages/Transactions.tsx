import { TransactionList } from "@/components/transactions/TransactionList";

export default function Transactions() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <TransactionList />
    </div>
  );
}
