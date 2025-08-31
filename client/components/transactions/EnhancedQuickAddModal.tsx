import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  X
} from "lucide-react";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000];

const CATEGORIES = {
  income: [
    "Salary", "Freelance Work", "Business Income", "Rental Income", 
    "Investment Returns", "Family Support", "Bonus", "Refund/Cashback",
    "Gift Received", "Side Hustle", "Miscellaneous Income"
  ],
  expense: {
    "Food & Dining": ["Groceries", "Restaurants", "Food Delivery", "Street Food", "Cafe/Tea", "Cooking Gas"],
    "Transportation": ["Petrol/Diesel", "Auto/Rickshaw", "Taxi/Cab", "Bus/Metro", "Train/Flight", "Car Maintenance", "Parking"],
    "Shopping": ["Clothing", "Electronics", "Books/Stationery", "Home Items", "Personal Care", "Gifts for Others"],
    "Utilities & Bills": ["Electricity Bill", "Water Bill", "Gas Bill", "Internet", "Mobile Recharge", "DTH/Cable"],
    "Healthcare": ["Doctor Consultation", "Medicines", "Hospital Bills", "Health Insurance", "Lab Tests"],
    "Entertainment": ["Movies/Theater", "OTT Subscriptions", "Games", "Sports Events", "Books/Music", "Hobbies"],
    "Travel": ["Hotels/Accommodation", "Flight/Train Tickets", "Local Transport", "Food & Dining", "Travel Shopping"],
    "Financial": ["Loan EMI", "Credit Card Bill", "Insurance Premium", "Investment/SIP", "Bank Charges", "Tax Payment"],
    "Education": ["School/College Fees", "Course Fees", "Books & Materials", "Coaching Classes", "Online Courses"],
    "Family & Personal": ["Family Support", "Kids Expenses", "Pet Care", "Celebrations", "Religious Donations"],
    "Miscellaneous": ["Custom Category"]
  }
};

const getAccountIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'upi': return <Smartphone size={16} className="text-blue-600" />;
    case 'credit_card': return <CreditCard size={16} className="text-purple-600" />;
    case 'cash': return <Banknote size={16} className="text-green-600" />;
    case 'bank': return <Wallet size={16} className="text-gray-600" />;
    default: return <Wallet size={16} className="text-gray-600" />;
  }
};

export function EnhancedQuickAddModal() {
  const [open, setOpen] = useState(false);
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  // Data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  // Load accounts when modal opens
  useEffect(() => {
    if (open) {
      loadAccounts();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("ff:openQuickAdd" as any, onOpen);
    return () => window.removeEventListener("ff:openQuickAdd" as any, onOpen);
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await apiFetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.filter((a: any) => !a.deletedAt));
        if (data.length > 0) setAccountId(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const resetForm = () => {
    setAmount("");
    setType("expense");
    setCategory("");
    setSubCategory("");
    setCustomCategory("");
    setDescription("");
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    setError(null);
    setCategorySearch("");
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
      const finalCategory = category === "Custom Category" ? customCategory : category;
      const payload = {
        amount: Number(amount),
        type,
        accountId,
        category: finalCategory,
        subCategory: subCategory || undefined,
        description: description || undefined,
        date: new Date(`${date}T${time}`).toISOString(),
        paymentMethod: accounts.find(a => a._id === accountId)?.type || 'cash'
      };

      const res = await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["tx"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      
      setOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCategories = () => {
    const cats = type === 'income' ? CATEGORIES.income : Object.keys(CATEGORIES.expense);
    if (!categorySearch) return cats;
    return cats.filter(cat => 
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  };

  const getSubCategories = () => {
    if (type === 'income' || !category || category === "Custom Category") return [];
    return (CATEGORIES.expense as any)[category] || [];
  };

  const selectedAccount = accounts.find(a => a._id === accountId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'income' ? (
              <ArrowUpRight className="text-green-600" />
            ) : (
              <ArrowDownLeft className="text-red-600" />
            )}
            Quick Add Transaction
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
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-gray-500">₹</span>
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
                    : "text-gray-600 hover:bg-gray-200"
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
                    : "text-gray-600 hover:bg-gray-200"
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
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    <div className="flex items-center gap-2">
                      {getAccountIcon(account.type)}
                      <span>{account.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {formatINR(account.balance)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <div className="text-sm text-gray-500">
                Current balance: {formatINR(selectedAccount.balance)}
                {type === 'expense' && Number(amount) > selectedAccount.balance && selectedAccount.type !== 'credit_card' && (
                  <span className="text-red-500 ml-2">⚠️ Insufficient balance</span>
                )}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Category</Label>
            
            {/* Category Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-10"
              />
              {categorySearch && (
                <button
                  onClick={() => setCategorySearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {getFilteredCategories().map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setSubCategory("");
                    setCustomCategory("");
                  }}
                  className={cn(
                    "p-2 text-sm rounded-lg border text-left transition-all",
                    category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-category Selection */}
          {getSubCategories().length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sub-category</Label>
              <div className="flex flex-wrap gap-2">
                {getSubCategories().map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setSubCategory(subCategory === subCat ? "" : subCat)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-full border transition-all",
                      subCategory === subCat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {subCat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Category Input */}
          {category === "Custom Category" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Custom Category Name</Label>
              <Input
                placeholder="Enter category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date</Label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
            <Label className="text-sm font-medium">Description (Optional)</Label>
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
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {loading ? "Saving..." : "Save Transaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
