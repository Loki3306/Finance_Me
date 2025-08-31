import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { QuickStatsHeader } from "./QuickStatsHeader";
import { AdvancedFilterBar } from "./AdvancedFilterBar";
import { TransactionCard } from "./TransactionCard";
import { BulkActionBar } from "./BulkActionBar";
import { Grid, List, RefreshCw, ArrowUp, Loader2, Package } from "lucide-react";
import { EnhancedEditModal } from "./EnhancedEditModal";

interface FilterState {
  search: string;
  dateRange: {
    from: string;
    to: string;
    preset: string;
  };
  accounts: string[];
  categories: string[];
  types: string[];
  amountRange: [number, number];
  sortBy: string;
}

const defaultFilters: FilterState = {
  search: "",
  dateRange: { from: "", to: "", preset: "" },
  accounts: [],
  categories: [],
  types: [],
  amountRange: [0, 100000],
  sortBy: "date_desc",
};

export function EnhancedTransactionList() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState("today");
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const limit = 20;

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.dateRange.from) params.set("startDate", filters.dateRange.from);
    if (filters.dateRange.to) params.set("endDate", filters.dateRange.to);
    if (filters.accounts.length)
      params.set("accounts", filters.accounts.join(","));
    if (filters.categories.length)
      params.set("categories", filters.categories.join(","));
    if (filters.types.length) params.set("type", filters.types.join(","));
    if (filters.amountRange[0] > 0)
      params.set("minAmount", filters.amountRange[0].toString());
    if (filters.amountRange[1] < 100000)
      params.set("maxAmount", filters.amountRange[1].toString());

    params.set("page", page.toString());
    params.set("limit", limit.toString());
    params.set("sort", filters.sortBy);

    return params.toString();
  }, [filters, page]);

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["tx", queryParams],
    queryFn: async () => {
      const res = await apiFetch(`/api/transactions?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tx"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setSelectedIds((prev) => prev.filter((id) => !prev.includes(id)));
    },
  });

  // Handle scroll for showing scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds([]);
  }, [queryParams]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleSelectTransaction = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((selectedId) => selectedId !== id),
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(transactions.map((t: any) => t._id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDuplicateTransaction = async (transaction: any) => {
    try {
      // Create a new transaction based on the existing one
      const duplicatePayload = {
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
        category: transaction.category,
        subCategory: transaction.subCategory,
        description: transaction.description ? `${transaction.description} (Copy)` : "(Copy)",
        date: new Date().toISOString(), // Set to current date
        paymentMethod: transaction.paymentMethod,
      };

      const res = await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify(duplicatePayload),
      });

      if (!res.ok) {
        throw new Error("Failed to duplicate transaction");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["tx"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    } catch (err) {
      console.error("Error duplicating transaction:", err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl border p-4 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
            <div className="text-right">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mb-4">
        <Package size={48} className="mx-auto text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No transactions found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {Object.values(filters).some(
          (v) => v && (Array.isArray(v) ? v.length > 0 : v),
        )
          ? "Try adjusting your filters to find transactions."
          : "Get started by adding your first transaction."}
      </p>
      <Button
        onClick={() => window.dispatchEvent(new CustomEvent("ff:openQuickAdd"))}
        className="bg-primary text-primary-foreground"
      >
        Add Your First Transaction
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Quick Stats Header */}
      <QuickStatsHeader
        selectedPeriod={statsPeriod}
        onPeriodChange={setStatsPeriod}
      />

      {/* Advanced Filter Bar */}
      <AdvancedFilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            Transactions
            {!isLoading && transactions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {transactions.length} {page > 1 && `of page ${page}`}
              </Badge>
            )}
          </h2>

          {isFetching && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Updating...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="border rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-2 rounded transition-all",
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 rounded transition-all",
                viewMode === "table"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              <List size={16} />
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["tx"] })}
            disabled={isFetching}
          >
            <RefreshCw size={16} className={cn(isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Failed to load transactions. Please try again.
        </div>
      )}

      {/* Transaction List */}
      <div className="relative">
        {isLoading ? (
          <LoadingSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className={cn("space-y-3", "animate-in fade-in-50 duration-500")}
          >
            {transactions.map((transaction: any, index: number) => (
              <div
                key={transaction._id}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
                className="animate-in slide-in-from-bottom-4 duration-300"
              >
                <TransactionCard
                  transaction={transaction}
                  onEdit={handleEditTransaction}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onDuplicate={handleDuplicateTransaction}
                  isSelected={selectedIds.includes(transaction._id)}
                  onSelect={handleSelectTransaction}
                  showCheckbox={selectedIds.length > 0}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More / Pagination */}
        {!isLoading &&
          transactions.length > 0 &&
          transactions.length === limit && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={isFetching}
                className="animate-in fade-in-50 duration-300"
              >
                {isFetching ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-24 right-6 z-40",
            "w-12 h-12 bg-primary text-primary-foreground rounded-full",
            "shadow-lg hover:shadow-xl transform hover:scale-110",
            "transition-all duration-200 ease-out",
            "animate-in slide-in-from-bottom-6",
          )}
        >
          <ArrowUp size={20} className="mx-auto" />
        </button>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        totalCount={transactions.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        transactions={transactions}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EnhancedEditModal
          transaction={editingTransaction}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}
