import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit,
  Download,
  Tag,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface BulkActionBarProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSelectionChange?: (ids: string[]) => void;
  transactions: any[];
}

const BULK_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Utilities & Bills",
  "Healthcare",
  "Entertainment",
  "Travel",
  "Financial",
  "Education",
  "Family & Personal",
  "Salary",
  "Freelance Work",
  "Business Income",
];

export function BulkActionBar({
  selectedIds,
  totalCount,
  onSelectAll,
  onClearSelection,
  onSelectionChange,
  transactions,
}: BulkActionBarProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const queryClient = useQueryClient();

  if (selectedIds.length === 0) return null;

  const isAllSelected = selectedIds.length === totalCount && totalCount > 0;

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/transactions/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete transactions");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["tx"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });

      onClearSelection();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (!bulkCategory) return;

    setLoading(true);
    try {
      // Update each transaction's category
      await Promise.all(
        selectedIds.map((id) =>
          apiFetch(`/api/transactions/${id}`, {
            method: "PUT",
            body: JSON.stringify({ category: bulkCategory }),
          }),
        ),
      );

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["tx"] });

      onClearSelection();
      setBulkCategory("");
    } catch (error) {
      console.error("Bulk category update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = () => {
    // Create CSV content for selected transactions
    const selectedTransactions = transactions.filter((t) =>
      selectedIds.includes(t._id),
    );

    const csvContent = [
      "Date,Type,Category,Amount,Account,Description",
      ...selectedTransactions.map(
        (t) =>
          `${new Date(t.date).toLocaleDateString()},${t.type},${t.category || ""},${t.amount},${t.accountId || ""},${(t.description || "").replace(/,/g, " ")}`,
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300",
          "bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700",
          "shadow-2xl backdrop-blur-sm",
          selectedIds.length > 0 ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Selection Info */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </Button>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {selectedIds.length} selected
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isAllSelected ? onClearSelection : onSelectAll}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare size={16} className="mr-1" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square size={16} className="mr-1" />
                      Select All ({totalCount})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              {/* Bulk Category Update */}
              <div className="flex items-center gap-2">
                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BULK_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCategoryUpdate}
                  disabled={!bulkCategory || loading}
                >
                  <Tag size={16} className="mr-1" />
                  Update
                </Button>
              </div>

              {/* Export Selected */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={loading}
              >
                <Download size={16} className="mr-1" />
                Export
              </Button>

              {/* Bulk Delete */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
              >
                <Trash2 size={16} className="mr-1" />
                Delete
              </Button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedIds.length} of {totalCount} selected
              </span>
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download size={14} className="mr-1" />
                Export
              </Button>

              <Button variant="outline" size="sm">
                <Edit size={14} className="mr-1" />
                Edit
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transactions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} transaction
              {selectedIds.length !== 1 ? "s" : ""}? This action cannot be
              undone and will affect your account balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
