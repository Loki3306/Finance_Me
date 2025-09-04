import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { formatINR } from "@/lib/inr";
import {
  Search,
  Filter,
  Calendar,
  X,
  ChevronDown,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  SlidersHorizontal,
} from "lucide-react";

interface FilterState {
  search: string;
  dateRange: {
    from: string;
    to: string;
    preset: string;
  };
  accounts: string[];
  types: string[];
  amountRange: [number, number];
  sortBy: string;
}

interface AdvancedFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "quarter" },
  { label: "Custom range", value: "custom" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "date_desc" },
  { label: "Oldest First", value: "date_asc" },
  { label: "Amount (High)", value: "amount_desc" },
  { label: "Amount (Low)", value: "amount_asc" },
];

const TRANSACTION_TYPES = [
  { label: "Income", value: "income", color: "text-green-600" },
  { label: "Expense", value: "expense", color: "text-red-600" },
  { label: "Transfer", value: "transfer", color: "text-blue-600" },
];

const getAccountIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "upi":
      return <Smartphone size={14} className="text-blue-600" />;
    case "credit_card":
      return <CreditCard size={14} className="text-purple-600" />;
    case "cash":
      return <Banknote size={14} className="text-green-600" />;
    case "bank":
      return <Wallet size={14} className="text-gray-600" />;
    default:
      return <Wallet size={14} className="text-gray-600" />;
  }
};

export function AdvancedFilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
}: AdvancedFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load accounts for filter
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts-filter"],
    queryFn: async () => {
      const res = await apiFetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });

  const getDateRange = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case "today":
        return {
          from: today.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return {
          from: yesterday.toISOString().split("T")[0],
          to: yesterday.toISOString().split("T")[0],
        };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return {
          from: weekAgo.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return {
          from: monthAgo.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        };
      case "quarter":
        const quarterAgo = new Date(today);
        quarterAgo.setDate(today.getDate() - 90);
        return {
          from: quarterAgo.toISOString().split("T")[0],
          to: today.toISOString().split("T")[0],
        };
      default:
        return { from: "", to: "" };
    }
  };

  const handleDatePresetChange = (preset: string) => {
    if (preset === "custom") {
      onFiltersChange({
        ...filters,
        dateRange: { ...filters.dateRange, preset, from: "", to: "" },
      });
    } else {
      const { from, to } = getDateRange(preset);
      onFiltersChange({
        ...filters,
        dateRange: { preset, from, to },
      });
    }
  };

  const toggleAccount = (accountId: string) => {
    const newAccounts = filters.accounts.includes(accountId)
      ? filters.accounts.filter((id) => id !== accountId)
      : [...filters.accounts, accountId];

    onFiltersChange({
      ...filters,
      accounts: newAccounts,
    });
  };

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];

    onFiltersChange({
      ...filters,
      types: newTypes,
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.dateRange.preset !== "" ||
      filters.accounts.length > 0 ||
      filters.types.length > 0 ||
      filters.amountRange[0] > 0 ||
      filters.amountRange[1] < 100000
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateRange.preset) count++;
    if (filters.accounts.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.amountRange[0] > 0 || filters.amountRange[1] < 100000) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Primary Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Search transactions, merchants, amounts..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-10 pr-10"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Transaction Type Quick Filters */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          {TRANSACTION_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleType(type.value)}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-all",
                filters.types.includes(type.value)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, sortBy: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-2",
            hasActiveFilters() && "bg-primary/10 border-primary",
          )}
        >
          <Filter size={16} />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
          <ChevronDown
            size={16}
            className={cn("transition-transform", showAdvanced && "rotate-180")}
          />
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X size={16} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Range</Label>
              <Select
                value={filters.dateRange.preset}
                onValueChange={handleDatePresetChange}
              >
                <SelectTrigger>
                  <Calendar size={16} />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filters.dateRange.preset === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange.from}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          from: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.to}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: { ...filters.dateRange, to: e.target.value },
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Amount Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Amount Range</Label>
              <div className="space-y-3">
                <Slider
                  value={filters.amountRange}
                  onValueChange={(value: number[]) =>
                    onFiltersChange({
                      ...filters,
                      amountRange: [value[0], value[1]],
                    })
                  }
                  max={100000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatINR(filters.amountRange[0])}</span>
                  <span>{formatINR(filters.amountRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Account Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Accounts</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {filters.accounts.length > 0
                      ? `${filters.accounts.length} selected`
                      : "Select accounts"}
                    <ChevronDown size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {accounts.map((account: any) => (
                      <div
                        key={account._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={account._id}
                          checked={filters.accounts.includes(account._id)}
                          onCheckedChange={() => toggleAccount(account._id)}
                        />
                        <label
                          htmlFor={account._id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          {getAccountIcon(account.type)}
                          {account.name}
                          <Badge variant="outline" className="text-xs">
                            {formatINR(account.balance)}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <button
                onClick={() => onFiltersChange({ ...filters, search: "" })}
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {filters.dateRange.preset && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {
                DATE_PRESETS.find((p) => p.value === filters.dateRange.preset)
                  ?.label
              }
              <button
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    dateRange: { preset: "", from: "", to: "" },
                  })
                }
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {filters.types.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {TRANSACTION_TYPES.find((t) => t.value === type)?.label}
              <button onClick={() => toggleType(type)}>
                <X size={12} />
              </button>
            </Badge>
          ))}
          {filters.accounts.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.accounts.length} account(s)
              <button
                onClick={() => onFiltersChange({ ...filters, accounts: [] })}
              >
                <X size={12} />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
