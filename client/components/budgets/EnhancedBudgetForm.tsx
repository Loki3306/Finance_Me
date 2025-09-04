import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  Calendar, 
  AlertTriangle, 
  RefreshCw,
  CreditCard,
  Wallet,
  Building2,
  X,
  Plus
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatINR } from "@/lib/inr";

// Category definitions from EnhancedQuickAddModal
const CATEGORIES = {
  "Food & Dining": ["Restaurants", "Groceries", "Takeout", "Coffee & Tea", "Alcohol & Bars"],
  "Transportation": ["Gas & Fuel", "Parking", "Car Maintenance", "Public Transport", "Taxi & Rideshare"],
  "Shopping": ["Clothing", "Electronics", "Books", "Gifts", "Home & Garden"],
  "Entertainment": ["Movies & Shows", "Music", "Games", "Sports", "Travel"],
  "Bills & Utilities": ["Rent", "Electricity", "Water", "Internet", "Phone", "Insurance"],
  "Healthcare": ["Doctor", "Pharmacy", "Dental", "Vision", "Medical Equipment"],
  "Personal Care": ["Salon & Spa", "Gym & Fitness", "Personal Items"],
  "Business": ["Office Supplies", "Business Travel", "Professional Services"],
  "Education": ["Tuition", "Books & Supplies", "Online Courses"],
  "Income": ["Salary", "Freelance", "Investment", "Business", "Other Income"],
  "Transfer": ["Account Transfer", "Payment", "Withdrawal"],
  "Other": ["Miscellaneous", "Uncategorized"]
};

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "upi", label: "UPI", icon: Wallet },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "bank", label: "Bank Account", icon: Building2 }
];

const budgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  budgetType: z.enum(["category", "account", "overall"]),
  period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  description: z.string().optional(),
  scope: z.object({
    categories: z.array(z.string()).optional(),
    accountTypes: z.array(z.string()).optional(),
    accountIds: z.array(z.string()).optional(),
  }).optional(),
  rollover: z.object({
    enabled: z.boolean().optional(),
    type: z.enum(["remaining", "overspend"]).optional(),
  }).optional(),
  alertThresholds: z.object({
    warning: z.number().min(0).max(100).optional(),
    critical: z.number().min(0).max(100).optional(),
  }).optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface EnhancedBudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: any;
}

export function EnhancedBudgetForm({
  open,
  onOpenChange,
  initialValues,
}: EnhancedBudgetFormProps) {
  const qc = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialValues?.scope?.categories || []
  );
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(
    initialValues?.scope?.accountTypes || []
  );

  // Fetch accounts for account-specific budgets
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await apiFetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to load accounts");
      return res.json();
    },
  });

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: initialValues?.name || "",
      amount: initialValues?.amount || 0,
      budgetType: initialValues?.budgetType || "category",
      period: initialValues?.period || "monthly",
      description: initialValues?.description || "",
      scope: {
        categories: initialValues?.scope?.categories || [],
        accountTypes: initialValues?.scope?.accountTypes || [],
        accountIds: initialValues?.scope?.accountIds || [],
      },
      rollover: {
        enabled: initialValues?.rollover?.enabled || false,
        type: initialValues?.rollover?.type || "remaining",
      },
      alertThresholds: {
        warning: initialValues?.alertThresholds?.warning || 80,
        critical: initialValues?.alertThresholds?.critical || 100,
      },
    },
  });

  const budgetType = form.watch("budgetType");

  const mutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const url = initialValues
        ? `/api/budgets/${initialValues.id}`
        : "/api/budgets";
      const method = initialValues ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-analytics"] });
      onOpenChange(false);
      form.reset();
      setSelectedCategories([]);
      setSelectedAccountTypes([]);
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    // Update scope based on budget type
    if (budgetType === "category") {
      data.scope = { categories: selectedCategories };
    } else if (budgetType === "account") {
      data.scope = { accountTypes: selectedAccountTypes };
    } else {
      data.scope = {};
    }

    mutation.mutate(data);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAccountTypeToggle = (accountType: string) => {
    setSelectedAccountTypes(prev =>
      prev.includes(accountType)
        ? prev.filter(t => t !== accountType)
        : [...prev, accountType]
    );
  };

  const quickAmounts = [1000, 5000, 10000, 25000, 50000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="size-5" />
            {initialValues ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Monthly Groceries"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        Period
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Amount</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                        <div className="flex flex-wrap gap-2">
                          {quickAmounts.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(amount)}
                            >
                              {formatINR(amount)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budgetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="category">Category-based</SelectItem>
                        <SelectItem value="account">Account-based</SelectItem>
                        <SelectItem value="overall">Overall Spending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Budget Scope */}
            {budgetType === "category" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Select Categories</h3>
                  <div className="space-y-4">
                    {Object.entries(CATEGORIES).map(([mainCategory, subCategories]) => (
                      <div key={mainCategory} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={mainCategory}
                            checked={selectedCategories.includes(mainCategory)}
                            onCheckedChange={() => handleCategoryToggle(mainCategory)}
                          />
                          <label
                            htmlFor={mainCategory}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {mainCategory}
                          </label>
                        </div>
                        {selectedCategories.includes(mainCategory) && (
                          <div className="ml-6 flex flex-wrap gap-1">
                            {subCategories.map((subCategory) => (
                              <Badge key={subCategory} variant="secondary" className="text-xs">
                                {subCategory}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {budgetType === "account" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Select Account Types</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ACCOUNT_TYPES.map((accountType) => (
                      <div key={accountType.value} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={accountType.value}
                          checked={selectedAccountTypes.includes(accountType.value)}
                          onCheckedChange={() => handleAccountTypeToggle(accountType.value)}
                        />
                        <accountType.icon className="size-5 text-gray-500" />
                        <label
                          htmlFor={accountType.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {accountType.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Options</h3>
              
              {/* Rollover Settings */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="rollover.enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <RefreshCw className="size-4" />
                          Enable Rollover
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          Carry remaining budget to next period
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("rollover.enabled") && (
                  <FormField
                    control={form.control}
                    name="rollover.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rollover Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rollover type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="remaining">Remaining Amount</SelectItem>
                            <SelectItem value="overspend">Overspend Penalty</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Alert Thresholds */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="alertThresholds.warning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AlertTriangle className="size-4" />
                        Warning Threshold (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alertThresholds.critical"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Critical Threshold (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this budget..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="min-w-24"
              >
                {mutation.isPending ? "Saving..." : initialValues ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
