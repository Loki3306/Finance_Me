
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Search, 
  Filter,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { EnhancedBudgetForm } from "@/components/budgets/EnhancedBudgetForm";
import { BudgetAnalytics } from "@/components/budgets/BudgetAnalytics";
import { BudgetFilters } from "@/components/budgets/BudgetFilters";
import { apiFetch } from "@/lib/api";
import { formatINR } from "@/lib/inr";

export default function Budgets() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<string>("monthly");
  const [view, setView] = useState<string>("cards");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    account: "all",
    category: "all"
  });

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ["budgets", period, filters],
    queryFn: async () => {
      console.log("Fetching budgets with params:", { period, filters });
      const params = new URLSearchParams();
      if (period !== "all") params.append("period", period);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "all") params.append(key, value);
      });
      
      const url = `/api/budgets?${params}`;
      console.log("Fetching from URL:", url);
      const res = await apiFetch(url);
      console.log("Response status:", res.status);
      if (!res.ok) throw new Error("Failed to load budgets");
      const data = await res.json();
      console.log("Fetched budgets:", data);
      return data;
    },
  });

  console.log("Current budgets state:", { budgets, isLoading, error });

  const { data: budgetAnalytics = {} } = useQuery({
    queryKey: ["budget-analytics", period],
    queryFn: async () => {
      const res = await apiFetch(`/api/budgets/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete budget");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budget-analytics"] });
    },
  });

  // Filter budgets based on search query
  const filteredBudgets = budgets.filter((budget: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      budget.name.toLowerCase().includes(searchLower) ||
      budget.budgetType.toLowerCase().includes(searchLower) ||
      (budget.scope?.categories || []).some((cat: string) => 
        cat.toLowerCase().includes(searchLower)
      )
    );
  });

  // Calculate summary stats
  const totalBudget = filteredBudgets.reduce((sum: number, b: any) => sum + b.amount, 0);
  const totalSpent = filteredBudgets.reduce((sum: number, b: any) => sum + (b.currentPeriod?.spentAmount || 0), 0);
  const exceededBudgets = filteredBudgets.filter((b: any) => (b.currentPeriod?.progressPercentage || 0) > 100);
  const approachingLimit = filteredBudgets.filter((b: any) => {
    const progress = b.currentPeriod?.progressPercentage || 0;
    return progress >= 80 && progress <= 100;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track spending limits and analyze budget performance
          </p>
        </div>
        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Summary Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-0 bg-white/60 p-5 shadow-md backdrop-blur dark:bg-black/30">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Target className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{filteredBudgets.length}</div>
              <div className="text-xs text-muted-foreground">Active Budgets</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-0 bg-white/60 p-5 shadow-md backdrop-blur dark:bg-black/30">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-green-500/10 text-green-600">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatINR(totalBudget)}</div>
              <div className="text-xs text-muted-foreground">Total Budget</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-0 bg-white/60 p-5 shadow-md backdrop-blur dark:bg-black/30">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatINR(totalSpent)}</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-0 bg-white/60 p-5 shadow-md backdrop-blur dark:bg-black/30">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-red-500/10 text-red-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{exceededBudgets.length}</div>
              <div className="text-xs text-muted-foreground">Over Budget</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
          <Input
            placeholder="Search budgets, categories, accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="cards">
                <Target className="size-4 mr-2" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <PieChart className="size-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content based on view */}
      <Tabs value={view} onValueChange={setView}>
        <TabsContent value="cards">
          {isLoading && (
            <div className="text-center py-12">
              <div className="text-lg">Loading budgets...</div>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12 text-red-600">
              <div className="text-lg">Error loading budgets: {error.message}</div>
            </div>
          )}
          
          {!isLoading && !error && (
            <>
              {/* Budget Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBudgets.map((budget: any) => (
                  <BudgetCard
                    key={budget._id}
                    budget={budget}
                    onEdit={(b) => {
                      setEditing({ id: b._id, ...b });
                      setOpen(true);
                    }}
                    onDelete={(id) => deleteBudget.mutate(id)}
                  />
                ))}
              </div>
              
              {filteredBudgets.length === 0 && (
                <div className="text-center py-12">
                  <Target className="size-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No budgets found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? "Try adjusting your search or filters" : "Create your first budget to start tracking spending"}
                  </p>
                  <Button onClick={() => setOpen(true)}>
                    <Plus className="size-4 mr-2" />
                    Create Budget
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-12">
            <PieChart className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
            <p className="text-gray-600">Advanced budget analytics will be available here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Enhanced Budget Form Modal */}
      <EnhancedBudgetForm
        open={open}
        onOpenChange={setOpen}
        initialValues={editing || undefined}
      />
    </div>
  );
}
