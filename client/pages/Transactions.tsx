import { EnhancedTransactionList } from "@/components/transactions/EnhancedTransactionList";
import { EnhancedQuickAddModal } from "@/components/transactions/EnhancedQuickAddModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Transactions() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage all your financial transactions
          </p>
        </div>
        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          onClick={() => window.dispatchEvent(new CustomEvent("ff:openQuickAdd" as any))}
        >
          <Plus size={20} className="mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Enhanced Transaction List */}
      <EnhancedTransactionList />

      {/* Enhanced Quick Add Modal */}
      <EnhancedQuickAddModal />
    </div>
  );
}
