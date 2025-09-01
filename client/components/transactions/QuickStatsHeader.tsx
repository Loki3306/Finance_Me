import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { formatINR } from "@/lib/inr";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickStatsHeaderProps {
  onPeriodChange?: (period: string) => void;
  selectedPeriod?: string;
}

const PERIOD_OPTIONS = [
  { value: "today", label: "Today", icon: <Clock size={14} /> },
  { value: "week", label: "This Week", icon: <Calendar size={14} /> },
  { value: "month", label: "This Month", icon: <Calendar size={14} /> },
  { value: "all", label: "All Time", icon: <TrendingUp size={14} /> },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "IST (India)", offset: "+05:30" },
  { value: "UTC", label: "UTC", offset: "+00:00" },
  { value: "America/New_York", label: "EST (New York)", offset: "-05:00" },
  { value: "America/Los_Angeles", label: "PST (Los Angeles)", offset: "-08:00" },
  { value: "Europe/London", label: "GMT (London)", offset: "+00:00" },
  { value: "Asia/Tokyo", label: "JST (Tokyo)", offset: "+09:00" },
  { value: "Australia/Sydney", label: "AEST (Sydney)", offset: "+10:00" },
];

export function QuickStatsHeader({
  onPeriodChange,
  selectedPeriod = "today",
}: QuickStatsHeaderProps) {
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("Asia/Kolkata"); // Default to IST

  // Load timezone preference from localStorage on mount
  useEffect(() => {
    const savedTimezone = localStorage.getItem("finance-me-timezone");
    if (savedTimezone && TIMEZONE_OPTIONS.some(tz => tz.value === savedTimezone)) {
      setSelectedTimezone(savedTimezone);
    }
  }, []);

  // Save timezone preference to localStorage when changed
  const handleTimezoneChange = (timezone: string) => {
    setSelectedTimezone(timezone);
    localStorage.setItem("finance-me-timezone", timezone);
  };

  // Get date range based on selected period and timezone (memoized to prevent infinite loops)
  const { from, to } = useMemo(() => {
    console.log(`🔄 QuickStatsHeader: Recalculating date range for ${selectedPeriod} in ${selectedTimezone}`);
    
    const getDateRange = (period: string, timezone: string) => {
      // Use a fixed reference time for consistent calculations
      const now = new Date();
      
      // Helper function to convert date to specific timezone and get start/end of day
      const getDateInTimezone = (date: Date, timezone: string, startOfDay = true) => {
        try {
          const dateInTz = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
          const tzDate = new Date(date.getTime() + (dateInTz.getTime() - date.getTime()));
          
          if (startOfDay) {
            tzDate.setHours(0, 0, 0, 0);
          } else {
            tzDate.setHours(23, 59, 59, 999);
          }
          
          return tzDate;
        } catch (error) {
          console.warn(`Invalid timezone: ${timezone}, falling back to UTC`);
          // Fallback to UTC if timezone is invalid
          const utcDate = new Date(date);
          if (startOfDay) {
            utcDate.setUTCHours(0, 0, 0, 0);
          } else {
            utcDate.setUTCHours(23, 59, 59, 999);
          }
          return utcDate;
        }
      };
      
      switch (period) {
        case "today":
          const todayStart = getDateInTimezone(now, timezone, true);
          const todayEnd = getDateInTimezone(now, timezone, false);
          return {
            from: todayStart.toISOString(),
            to: todayEnd.toISOString(),
          };
        case "week":
          try {
            const weekDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
            const dayOfWeek = weekDate.getDay();
            const weekStart = new Date(weekDate);
            weekStart.setDate(weekDate.getDate() - dayOfWeek);
            const weekStartInTz = getDateInTimezone(weekStart, timezone, true);
            
            return {
              from: weekStartInTz.toISOString(),
              to: now.toISOString(),
            };
          } catch (error) {
            console.warn(`Week calculation failed for timezone: ${timezone}`);
            // Fallback calculation
            const weekStart = new Date(now);
            weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
            weekStart.setUTCHours(0, 0, 0, 0);
            return {
              from: weekStart.toISOString(),
              to: now.toISOString(),
            };
          }
        case "month":
          try {
            const monthDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthStartInTz = getDateInTimezone(monthStart, timezone, true);
            
            return {
              from: monthStartInTz.toISOString(),
              to: now.toISOString(),
            };
          } catch (error) {
            console.warn(`Month calculation failed for timezone: ${timezone}`);
            // Fallback calculation
            const monthStart = new Date(now);
            monthStart.setUTCDate(1);
            monthStart.setUTCHours(0, 0, 0, 0);
            return {
              from: monthStart.toISOString(),
              to: now.toISOString(),
            };
          }
        case "all":
        default:
          // For "all time", don't specify date range to get all transactions
          return { from: null, to: null };
      }
    };

    const result = getDateRange(selectedPeriod, selectedTimezone);
    console.log(`📅 QuickStatsHeader: Date range calculated - from: ${result.from}, to: ${result.to}`);
    return result;
  }, [selectedPeriod, selectedTimezone]); // Only recalculate when period or timezone changes

  // Fetch transactions for the selected period
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["transactions", "stats", selectedPeriod, selectedTimezone, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Only add date filters if they exist (for "all time", we don't want date filters)
      if (from) params.set("startDate", from);
      if (to) params.set("endDate", to);
      params.set("limit", "1000"); // Get all transactions for calculation

      console.log(`🔍 QuickStatsHeader: Fetching transactions for ${selectedPeriod} in ${selectedTimezone}`);
      console.log(`📅 Date range: ${from || 'no start date'} to ${to || 'no end date'}`);
      console.log(`🔗 API URL: /api/transactions?${params.toString()}`);

      const res = await apiFetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) {
        console.error(`❌ QuickStatsHeader: API failed with status ${res.status}`);
        throw new Error("Failed to fetch transactions");
      }
      
      const data = await res.json();
      console.log(`✅ QuickStatsHeader: Received ${data.length} transactions for ${selectedPeriod}`);
      return data;
    },
    enabled: true, // Always enabled - let the API handle the filtering
    staleTime: 0, // Always fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch on mount
    retry: 2, // Reduce retry attempts
  });

  // Calculate stats
  const stats = transactions.reduce(
    (acc: any, tx: any) => {
      const amount = Math.abs(tx.amount);

      if (tx.type === "income") {
        acc.income += amount;
      } else if (tx.type === "expense") {
        acc.expense += amount;
      }

      acc.total += 1;
      return acc;
    },
    { income: 0, expense: 0, total: 0 },
  );

  const netAmount = stats.income - stats.expense;
  const isPositive = netAmount >= 0;

  const handlePeriodChange = (period: string) => {
    if (period !== selectedPeriod) {
      setAnimatingCard("all");
      setTimeout(() => setAnimatingCard(null), 300);
      onPeriodChange?.(period);
    }
  };

  const StatCard = ({
    title,
    amount,
    icon,
    color,
    bgColor,
    textColor,
    type,
  }: {
    title: string;
    amount: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    textColor: string;
    type: string;
  }) => (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
        "hover:shadow-lg hover:scale-105 transform",
        bgColor,
        animatingCard === "all" && "animate-pulse",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-medium", textColor)}>{title}</p>
          <p className={cn("text-2xl font-bold mt-1", textColor)}>
            {type !== "count" &&
              (type === "income" ? "+" : type === "expense" ? "-" : "")}
            {type === "count" ? amount : formatINR(amount)}
          </p>
          {type === "net" && (
            <p
              className={cn(
                "text-xs mt-1",
                isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {isPositive ? "Surplus" : "Deficit"}
            </p>
          )}
        </div>
        <div className={cn("p-2 rounded-lg", color)}>{icon}</div>
      </div>

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform translate-x-full animate-shimmer" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Period Filter Chips and Timezone Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "hover:shadow-md transform hover:scale-105",
                selectedPeriod === option.value
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary/20",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {/* Timezone Selector */}
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-gray-500" />
          <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tz.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{tz.offset}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Income"
          amount={stats.income}
          icon={<ArrowUpRight size={20} className="text-white" />}
          color="bg-green-500"
          bgColor="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          textColor="text-green-900 dark:text-green-100"
          type="income"
        />

        <StatCard
          title="Expense"
          amount={stats.expense}
          icon={<ArrowDownLeft size={20} className="text-white" />}
          color="bg-red-500"
          bgColor="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          textColor="text-red-900 dark:text-red-100"
          type="expense"
        />

        <StatCard
          title="Net Amount"
          amount={Math.abs(netAmount)}
          icon={<DollarSign size={20} className="text-white" />}
          color={isPositive ? "bg-blue-500" : "bg-orange-500"}
          bgColor={
            isPositive
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
          }
          textColor={
            isPositive
              ? "text-blue-900 dark:text-blue-100"
              : "text-orange-900 dark:text-orange-100"
          }
          type="net"
        />

        <StatCard
          title="Transactions"
          amount={stats.total}
          icon={<ArrowLeftRight size={20} className="text-white" />}
          color="bg-purple-500"
          bgColor="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
          textColor="text-purple-900 dark:text-purple-100"
          type="count"
        />
      </div>

      {/* Period Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {TIMEZONE_OPTIONS.find((tz) => tz.value === selectedTimezone)?.label}
          </Badge>
          {isLoading && (
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
              Loading...
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              Error loading data
            </span>
          )}
        </div>

        {stats.total > 0 && (
          <div className="text-xs">
            Average per transaction:{" "}
            {formatINR((stats.income + stats.expense) / stats.total)}
          </div>
        )}
      </div>
    </div>
  );
}
