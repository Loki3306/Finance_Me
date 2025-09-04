import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Target, Wallet, CreditCard, Smartphone, Banknote } from "lucide-react";

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

const BUDGET_TYPES = [
  { value: "overall", label: "Overall Budget", icon: Target, desc: "Total spending across all accounts" },
  { value: "account_type", label: "Account Type Budget", icon: Wallet, desc: "Budget for specific payment methods" },
  { value: "category", label: "Category Budget", icon: Target, desc: "Budget for spending categories" },
];

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash Account Budget", icon: Banknote },
  { value: "upi", label: "UPI Account Budget", icon: Smartphone },
  { value: "credit_card", label: "Credit Card Budget", icon: CreditCard },
  { value: "bank", label: "Bank Account Budget", icon: Wallet },
];

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export function BudgetForm({
  open,
  onOpenChange,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: any;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetType, setBudgetType] = useState("overall");
  const [accountType, setAccountType] = useState("");
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setName(initialValues.name || "");
        setAmount(String(initialValues.amount || ""));
        setBudgetType(initialValues.budgetType || "overall");
        setAccountType(initialValues.scope?.accountTypes?.[0] || "");
        setPeriod(initialValues.period || "monthly");
      } else {
        resetForm();
      }
      setError(null);
    }
  }, [open, initialValues]);

  const resetForm = () => {
    setName("");
    setAmount("");
    setBudgetType("overall");
    setAccountType("");
    setPeriod("monthly");
  };

  const handleSubmit = async () => {
    if (!name || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name,
        amount: Number(amount),
        budgetType,
        period,
        scope: {},
      };

      // Set scope based on budget type
      if (budgetType === "account_type" && accountType) {
        payload.scope.accountTypes = [accountType];
      }

      const url = initialValues?.id ? `/api/budgets/${initialValues.id}` : "/api/budgets";
      const method = initialValues?.id ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save budget");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="text-primary" />
            {initialValues ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Budget Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Budget Name</Label>
            <Input
              placeholder="e.g., Monthly Groceries, UPI Spending"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Budget Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-gray-500">
                ₹
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-xl font-semibold h-14"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(String(amt))}
                  className="text-xs"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </Button>
              ))}
            </div>
          </div>

          {/* Budget Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Budget Type</Label>
            <Select value={budgetType} onValueChange={setBudgetType}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget type" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="size-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.desc}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Type (if budget type is account_type) */}
          {budgetType === "account_type" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Account Type</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="size-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Period */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Budget Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? "Saving..." : initialValues ? "Update Budget" : "Create Budget"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
