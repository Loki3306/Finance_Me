import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export function QuickStatsHeader({
  onPeriodChange,
  selectedPeriod = "today",
}: QuickStatsHeaderProps) {
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);

  // Get date range based on selected period
  const getDateRange = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return {
          from: today.toISOString(),
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          from: weekStart.toISOString(),
          to: now.toISOString(),
        };
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          from: monthStart.toISOString(),
          to: now.toISOString(),
        };
      default:
        return { from: undefined, to: undefined };
    }
  };

  const { from, to } = getDateRange(selectedPeriod);

  // Fetch transactions for the selected period
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions-stats", selectedPeriod, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("startDate", from);
      if (to) params.set("endDate", to);
      params.set("limit", "1000"); // Get all transactions for calculation

      const res = await apiFetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
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
      {/* Period Filter Chips */}
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
          {isLoading && (
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
              Loading...
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
