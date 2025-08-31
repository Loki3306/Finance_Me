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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { formatINR } from "@/lib/inr";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  CreditCard,
  Smartphone,
  Banknote,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  X,
} from "lucide-react";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000];

const CATEGORIES = {
  income: [
    "Salary",
    "Freelance Work",
    "Business Income",
    "Rental Income",
    "Investment Returns",
    "Family Support",
    "Bonus",
    "Refund/Cashback",
    "Gift Received",
    "Side Hustle",
    "Miscellaneous Income",
  ],
  expense: {
    "Food & Dining": [
      "Groceries",
      "Restaurants",
      "Food Delivery",
      "Street Food",
      "Cafe/Tea",
      "Cooking Gas",
    ],
    Transportation: [
      "Petrol/Diesel",
      "Auto/Rickshaw",
      "Taxi/Cab",
      "Bus/Metro",
      "Train/Flight",
      "Car Maintenance",
      "Parking",
    ],
    Shopping: [
      "Clothing",
      "Electronics",
      "Books/Stationery",
      "Home Items",
      "Personal Care",
      "Gifts for Others",
    ],
    "Utilities & Bills": [
      "Electricity Bill",
      "Water Bill",
      "Gas Bill",
      "Internet",
      "Mobile Recharge",
      "DTH/Cable",
    ],
    Healthcare: [
      "Doctor Consultation",
      "Medicines",
      "Hospital Bills",
      "Health Insurance",
      "Lab Tests",
    ],
    Entertainment: [
      "Movies/Theater",
      "OTT Subscriptions",
      "Games",
      "Sports Events",
      "Books/Music",
      "Hobbies",
    ],
    Travel: [
      "Hotels/Accommodation",
      "Flight/Train Tickets",
      "Local Transport",
      "Food & Dining",
      "Travel Shopping",
    ],
    Financial: [
      "Loan EMI",
      "Credit Card Bill",
      "Insurance Premium",
      "Investment/SIP",
      "Bank Charges",
      "Tax Payment",
    ],
    Education: [
      "School/College Fees",
      "Course Fees",
      "Books & Materials",
      "Coaching Classes",
      "Online Courses",
    ],
    "Family & Personal": [
      "Family Support",
      "Kids Expenses",
      "Pet Care",
      "Celebrations",
      "Religious Donations",
    ],
    Miscellaneous: ["Custom Category"],
  },
};

const getAccountIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "upi":
      return <Smartphone size={16} className="text-blue-600" />;
    case "credit_card":
      return <CreditCard size={16} className="text-purple-600" />;
    case "cash":
      return <Banknote size={16} className="text-green-600" />;
    case "bank":
      return <Wallet size={16} className="text-gray-600" />;
    default:
      return <Wallet size={16} className="text-gray-600" />;
  }
};

interface EnhancedEditModalProps {
  transaction: any;
  onClose: () => void;
  isOpen: boolean;
}

export function EnhancedEditModal({ transaction, onClose, isOpen }: EnhancedEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form state
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  // Load accounts and populate form when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      loadAccounts();
      populateForm();
    }
  }, [isOpen, transaction]);

  const loadAccounts = async () => {
    try {
      const res = await apiFetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.filter((a: any) => !a.deletedAt));
      }
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  };

  const populateForm = () => {
    if (!transaction) return;
    
    setAmount(String(transaction.amount));
    setType(transaction.type);
    setAccountId(transaction.accountId);
    setCategory(transaction.category);
    setSubCategory(transaction.subCategory || "");
    setDescription(transaction.description || "");
    
    // Format date and time from transaction date
    const txDate = new Date(transaction.date);
    setDate(txDate.toISOString().split("T")[0]);
    setTime(txDate.toTimeString().slice(0, 5));
  };

  const validateForm = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return "Please enter a valid amount";
    }
    if (!accountId) {
      return "Please select an account";
    }
    if (!category) {
      return "Please select a category";
    }
    if (category === "Custom Category" && !customCategory.trim()) {
      return "Please enter a custom category name";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalCategory =
        category === "Custom Category" ? customCategory : category;
      const payload = {
        amount: Number(amount),
        type,
        accountId,
        category: finalCategory,
        subCategory: subCategory || undefined,
        description: description || undefined,
        date: new Date(`${date}T${time}`).toISOString(),
        paymentMethod:
          accounts.find((a) => a._id === accountId)?.type || "cash",
      };

      const res = await apiFetch(`/api/transactions/${transaction._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update transaction");
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["tx"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] }); // Invalidate budgets when transactions are updated

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCategories = () => {
    const cats =
      type === "income" ? CATEGORIES.income : Object.keys(CATEGORIES.expense);
    if (!categorySearch) return cats;
    return cats.filter((cat) =>
      cat.toLowerCase().includes(categorySearch.toLowerCase()),
    );
  };

  const getSubCategories = () => {
    if (type === "income" || !category || category === "Custom Category")
      return [];
    return (CATEGORIES.expense as any)[category] || [];
  };

  const selectedAccount = accounts.find((a) => a._id === accountId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "income" ? (
              <ArrowUpRight className="text-green-600" />
            ) : (
              <ArrowDownLeft className="text-red-600" />
            )}
            Edit Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Amount</Label>
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
                  ₹{amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Transaction Type Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Transaction Type</Label>
            <div className="flex items-center justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setType("expense")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all",
                  type === "expense"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-200",
                )}
              >
                <ArrowDownLeft size={16} />
                Expense
              </button>
              <button
                onClick={() => setType("income")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all",
                  type === "income"
                    ? "bg-green-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-200",
                )}
              >
                <ArrowUpRight size={16} />
                Income
              </button>
            </div>
          </div>

          {/* Account Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    <div className="flex items-center gap-2">
                      {getAccountIcon(account.type)}
                      <span>{account.name}</span>
                      <span className="text-gray-500 text-xs">
                        ({formatINR(account.balance)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Category</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Search size={16} />
              </div>
              <Input
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {getFilteredCategories().map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCategory(cat);
                    setSubCategory("");
                    setCategorySearch("");
                  }}
                  className="justify-start text-sm"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Custom Category Input */}
            {category === "Custom Category" && (
              <Input
                placeholder="Enter custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}

            {/* Sub-Category Selection */}
            {getSubCategories().length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sub-Category</Label>
                <div className="flex flex-wrap gap-2">
                  {getSubCategories().map((subCat: string) => (
                    <Badge
                      key={subCat}
                      variant={subCategory === subCat ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSubCategory(subCat)}
                    >
                      {subCat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Calendar size={16} />
                </div>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Time</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Clock size={16} />
                </div>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              placeholder="Add notes or merchant details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length}/200
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {loading ? "Saving..." : "Update Transaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}