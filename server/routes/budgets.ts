
import { Router } from "express";
import { connectDB } from "../db.js";
import Budget from "../models/budget.js";
import { Transaction } from "../models/transaction.js";
import { Account } from "../models/account.js";
import { getUserId, requireAuth } from "../middleware/auth.js";

const router = Router();
// Temporarily remove auth requirement for debugging
// router.use(requireAuth);

// Category mapping for budget tracking
const CATEGORY_MAP = {
  "Food & Dining": ["Food & Dining", "Restaurants", "Groceries", "Takeout", "Coffee & Tea", "Alcohol & Bars"],
  "Transportation": ["Transportation", "Gas & Fuel", "Parking", "Car Maintenance", "Public Transport", "Taxi & Rideshare"],
  "Shopping": ["Shopping", "Clothing", "Electronics", "Books", "Gifts", "Home & Garden"],
  "Entertainment": ["Entertainment", "Movies & Shows", "Music", "Games", "Sports", "Travel"],
  "Bills & Utilities": ["Bills & Utilities", "Rent", "Electricity", "Water", "Internet", "Phone", "Insurance"],
  "Healthcare": ["Healthcare", "Doctor", "Pharmacy", "Dental", "Vision", "Medical Equipment"],
  "Personal Care": ["Personal Care", "Salon & Spa", "Gym & Fitness", "Personal Items"],
  "Business": ["Business", "Office Supplies", "Business Travel", "Professional Services"],
  "Education": ["Education", "Tuition", "Books & Supplies", "Online Courses"],
  "Income": ["Income", "Salary", "Freelance", "Investment", "Business", "Other Income"],
  "Transfer": ["Transfer", "Account Transfer", "Payment", "Withdrawal"],
  "Other": ["Other", "Miscellaneous", "Uncategorized"]
};

// Helper function to expand categories to include subcategories
function expandCategories(categories: string[]): string[] {
  const expanded = [];
  for (const category of categories) {
    if (CATEGORY_MAP[category]) {
      expanded.push(...CATEGORY_MAP[category]);
    } else {
      expanded.push(category);
    }
  }
  return expanded;
}

// Get all budgets for user with filtering
router.get("/", async (req, res) => {
  try {
    console.log("=== BUDGET FETCH START ===");
    console.log("Query params:", req.query);
    
    await connectDB();
    
    // Debug: Check total budgets in database
    const allBudgets = await Budget.find({}).lean();
    console.log("Total budgets in database:", allBudgets.length);
    console.log("All budgets:", JSON.stringify(allBudgets, null, 2));
    
    // For debugging - use a default userId if none provided
    let userId = "debug_user_123"; // Default for testing
    
    try {
      const authUserId = getUserId(req);
      if (authUserId) {
        userId = authUserId;
        console.log("Found authenticated userId:", userId);
      }
    } catch (error) {
      console.log("No auth found for GET request, using default userId:", userId);
    }

    const { period, type, status, account, category } = req.query;

    let budgetFilter: any = { userId, isActive: true };
    
    console.log("Initial budget filter:", budgetFilter);
    
    // Apply filters
    if (period && period !== "all") {
      budgetFilter.period = period;
      console.log("Added period filter:", period);
    }
    if (type && type !== "all") {
      budgetFilter.budgetType = type;
      console.log("Added type filter:", type);
    }

    console.log("Final budget filter:", budgetFilter);

    const budgets = await Budget.find(budgetFilter).sort({ createdAt: -1 });
    console.log("Found budgets count:", budgets.length);
    console.log("Raw budgets:", budgets);

    // Calculate current period progress for each budget
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        const progress = await calculateBudgetProgress(budget, userId);
        return {
          ...budget.toObject(),
          currentPeriod: progress,
        };
      })
    );

    // Apply status filter after progress calculation
    let filteredBudgets = budgetsWithProgress;
    if (status && status !== "all") {
      filteredBudgets = budgetsWithProgress.filter(budget => {
        const progress = budget.currentPeriod?.progressPercentage || 0;
        switch (status) {
          case "on_track": return progress <= 80;
          case "warning": return progress > 80 && progress <= 100;
          case "over_budget": return progress > 100;
          default: return true;
        }
      });
    }

    console.log("Final filtered budgets count:", filteredBudgets.length);
    console.log("=== BUDGET FETCH END ===");
    
    res.json(filteredBudgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

// Get budget analytics
router.get("/analytics", async (req, res) => {
  try {
    await connectDB();
    
    // For debugging - use a default userId if none provided
    let userId = "debug_user_123"; // Default for testing
    
    try {
      const authUserId = getUserId(req);
      if (authUserId) {
        userId = authUserId;
      }
    } catch (error) {
      console.log("No auth found for analytics request, using default userId for debugging");
    }

    const { period = "monthly" } = req.query;

    const budgets = await Budget.find({ userId, isActive: true });
    
    // Calculate analytics for each budget
    const budgetAnalytics = await Promise.all(
      budgets.map(async (budget) => {
        const progress = await calculateBudgetProgress(budget, userId);
        return {
          ...budget.toObject(),
          currentPeriod: progress,
        };
      })
    );

    // Aggregate data for charts and insights
    const totalBudgeted = budgetAnalytics.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetAnalytics.reduce((sum, b) => sum + (b.currentPeriod?.spentAmount || 0), 0);
    const totalRemaining = totalBudgeted - totalSpent;

    // Category breakdown
    const categoryBreakdown = {};
    const accountTypeBreakdown = {};

    for (const budget of budgetAnalytics) {
      if (budget.budgetType === "category" && budget.scope?.categories) {
        for (const category of budget.scope.categories) {
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (budget.currentPeriod?.spentAmount || 0);
        }
      }
      if (budget.budgetType === "account" && budget.scope?.accountTypes) {
        for (const accountType of budget.scope.accountTypes) {
          accountTypeBreakdown[accountType] = (accountTypeBreakdown[accountType] || 0) + (budget.currentPeriod?.spentAmount || 0);
        }
      }
    }

    // Budget performance insights
    const insights = generateBudgetInsights(budgetAnalytics);

    res.json({
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining,
        utilizationRate: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
        budgetCount: budgetAnalytics.length,
        overBudgetCount: budgetAnalytics.filter(b => (b.currentPeriod?.progressPercentage || 0) > 100).length,
      },
      categoryBreakdown,
      accountTypeBreakdown,
      budgets: budgetAnalytics,
      insights,
      chartData: {
        spendingByCategory: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
        spendingByAccount: Object.entries(accountTypeBreakdown).map(([name, value]) => ({ name, value })),
        budgetProgress: budgetAnalytics.map(b => ({
          name: b.name,
          budgeted: b.amount,
          spent: b.currentPeriod?.spentAmount || 0,
          remaining: b.amount - (b.currentPeriod?.spentAmount || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching budget analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Get budget suggestions based on spending patterns
router.get("/suggestions", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    
    // Analyze recent transactions to suggest budgets
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentTransactions = await Transaction.find({
      userId,
      date: { $gte: oneMonthAgo },
      type: "expense",
    });

    // Group by category and calculate averages
    const categorySpending = {};
    recentTransactions.forEach(transaction => {
      const category = transaction.category || "Other";
      categorySpending[category] = (categorySpending[category] || 0) + transaction.amount;
    });

    // Generate suggestions
    const suggestions = Object.entries(categorySpending)
      .filter(([_, amount]) => amount > 1000) // Only suggest for categories with significant spending
      .map(([category, amount]) => ({
        type: "category",
        name: `Monthly ${category} Budget`,
        suggestedAmount: Math.ceil(amount * 1.1), // Suggest 10% more than current spending
        category,
        reason: `Based on ₹${amount} spent on ${category} last month`,
      }))
      .sort((a, b) => b.suggestedAmount - a.suggestedAmount)
      .slice(0, 5); // Top 5 suggestions

    res.json(suggestions);
  } catch (error) {
    console.error("Error generating budget suggestions:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

// Create new budget
router.post("/", async (req, res) => {
  try {
    console.log("=== BUDGET CREATION START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    await connectDB();
    
    // For debugging - use a default userId if none provided
    let userId = "debug_user_123"; // Default for testing
    
    try {
      const authUserId = getUserId(req);
      if (authUserId) {
        userId = authUserId;
        console.log("Found authenticated userId:", userId);
      }
    } catch (error) {
      console.log("No auth found, using default userId for debugging:", userId);
    }
    
    // Ensure userId is always set
    const budgetData = { 
      ...req.body, 
      userId: userId 
    };

    console.log("Final budget data to save:");
    console.log(JSON.stringify(budgetData, null, 2));

    const budget = new Budget(budgetData);
    console.log("About to save budget...");
    
    const savedBudget = await budget.save();
    console.log("Budget saved successfully!");
    console.log("Saved budget ID:", savedBudget._id);
    console.log("=== BUDGET CREATION SUCCESS ===");
    
    res.status(201).json(savedBudget);
  } catch (error) {
    console.log("=== BUDGET CREATION ERROR ===");
    console.error("Error creating budget:", error);
    console.error("Error details:", error.message);
    if (error.errors) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
    }
    console.log("=== END ERROR ===");
    res.status(400).json({ error: error.message });
  }
});

// Update budget
router.put("/:id", async (req, res) => {
  try {
    await connectDB();
    
    // For debugging - use a default userId if none provided
    let userId = "debug_user_123"; // Default for testing
    
    try {
      const authUserId = getUserId(req);
      if (authUserId) {
        userId = authUserId;
      }
    } catch (error) {
      console.log("No auth found for PUT request, using default userId for debugging");
    }

    const { id } = req.params;

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json(budget);
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete budget (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    await connectDB();
    
    // For debugging - use a default userId if none provided
    let userId = "debug_user_123"; // Default for testing
    
    try {
      const authUserId = getUserId(req);
      if (authUserId) {
        userId = authUserId;
      }
    } catch (error) {
      console.log("No auth found for DELETE request, using default userId for debugging");
    }

    const { id } = req.params;

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      { isActive: false },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

// Get budget progress
router.get("/:id/progress", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const budget = await Budget.findOne({ _id: req.params.id, userId });
    
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const progress = await calculateBudgetProgress(budget, userId);
    res.json(progress);
  } catch (error) {
    console.error("Error calculating budget progress:", error);
    res.status(500).json({ error: "Failed to calculate progress" });
  }
});

// Debug endpoint to test budget tracking
router.get("/:id/debug", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const budget = await Budget.findOne({ _id: req.params.id, userId });
    
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const now = new Date();
    const { startDate, endDate } = getBudgetPeriodDates(budget.period, now);

    // Show what filter would be applied
    let transactionFilter: any = {
      userId,
      date: { $gte: startDate, $lte: endDate },
      type: "expense",
      isDeleted: { $ne: true },
    };

    let accountInfo = null;
    if (budget.budgetType === "category" && budget.scope?.categories) {
      const categoryFilter = expandCategories(budget.scope.categories);
      transactionFilter.category = { $in: categoryFilter };
    } else if (budget.budgetType === "account" && budget.scope?.accountTypes) {
      const accounts = await Account.find({ 
        userId, 
        type: { $in: budget.scope.accountTypes },
        isActive: { $ne: false }
      });
      accountInfo = accounts;
      const accountIds = accounts.map(acc => acc._id);
      if (accountIds.length > 0) {
        transactionFilter.accountId = { $in: accountIds };
      }
    }

    const transactions = await Transaction.find(transactionFilter);
    const allTransactions = await Transaction.find({ 
      userId, 
      date: { $gte: startDate, $lte: endDate },
      type: "expense" 
    });

    res.json({
      budget: budget,
      filter: transactionFilter,
      accountInfo,
      matchingTransactions: transactions.length,
      totalTransactions: allTransactions.length,
      transactions: transactions.map(t => ({
        amount: t.amount,
        category: t.category,
        accountId: t.accountId,
        description: t.description,
        date: t.date
      })),
      periodDates: { startDate, endDate }
    });
  } catch (error) {
    console.error("Error debugging budget:", error);
    res.status(500).json({ error: "Debug failed" });
  }
});

// Calculate budget progress for a specific budget
async function calculateBudgetProgress(budget: any, userId: string) {
  const now = new Date();
  const { startDate, endDate } = getBudgetPeriodDates(budget.period, now);

  // Build transaction filter based on budget scope
  let transactionFilter: any = {
    userId,
    date: { $gte: startDate, $lte: endDate },
    type: "expense",
    isDeleted: { $ne: true },
  };

  // Apply scope filters based on budget type
  if (budget.budgetType === "category" && budget.scope?.categories && budget.scope.categories.length > 0) {
    // For category budgets, filter by transaction category (including subcategories)
    const categoryFilter = expandCategories(budget.scope.categories);
    transactionFilter.category = { $in: categoryFilter };
  } else if (budget.budgetType === "account" && budget.scope?.accountTypes && budget.scope.accountTypes.length > 0) {
    // For account type budgets, we need to get accounts of those types first
    const accounts = await Account.find({ 
      userId, 
      type: { $in: budget.scope.accountTypes },
      isActive: { $ne: false }
    });
    const accountIds = accounts.map(acc => acc._id);
    if (accountIds.length > 0) {
      transactionFilter.accountId = { $in: accountIds };
    } else {
      // No accounts found for these types, so no transactions should match
      transactionFilter._id = null; // This will return no results
    }
  } else if (budget.scope?.accountIds && budget.scope.accountIds.length > 0) {
    // For specific account budgets
    transactionFilter.accountId = { $in: budget.scope.accountIds };
  }
  // For "overall" budgets, no additional filtering is needed - it tracks all expenses

  // Get transactions for this period
  const transactions = await Transaction.find(transactionFilter);
  const spentAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate progress percentage
  const progressPercentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

  // Calculate remaining amount
  const remainingAmount = budget.amount - spentAmount;

  // Calculate days remaining in period
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  // Calculate spending velocity (amount per day)
  const dailySpendingRate = daysElapsed > 0 ? spentAmount / daysElapsed : 0;
  const projectedSpending = dailySpendingRate * totalDays;

  return {
    startDate,
    endDate,
    spentAmount,
    remainingAmount,
    progressPercentage: Math.round(progressPercentage),
    daysRemaining,
    dailySpendingRate,
    projectedSpending,
    transactionCount: transactions.length,
    isOverBudget: spentAmount > budget.amount,
    projectedOverspend: projectedSpending > budget.amount,
  };
}

// Generate budget insights
function generateBudgetInsights(budgets: any[]) {
  const insights = [];

  // Check for over-budget situations
  const overBudget = budgets.filter(b => (b.currentPeriod?.progressPercentage || 0) > 100);
  if (overBudget.length > 0) {
    insights.push({
      type: "warning",
      title: "Over Budget Alert",
      message: `${overBudget.length} budget(s) are over the limit`,
      budgets: overBudget.map(b => b.name),
    });
  }

  // Check for projected overspend
  const projectedOverspend = budgets.filter(b => b.currentPeriod?.projectedOverspend);
  if (projectedOverspend.length > 0) {
    insights.push({
      type: "caution",
      title: "Projected Overspend",
      message: `${projectedOverspend.length} budget(s) are projected to exceed limits`,
      budgets: projectedOverspend.map(b => b.name),
    });
  }

  // Check for underutilized budgets
  const underutilized = budgets.filter(b => {
    const progress = b.currentPeriod?.progressPercentage || 0;
    const daysRemaining = b.currentPeriod?.daysRemaining || 0;
    return progress < 50 && daysRemaining < 7; // Less than 50% used with less than 7 days remaining
  });
  if (underutilized.length > 0) {
    insights.push({
      type: "info",
      title: "Underutilized Budgets",
      message: `${underutilized.length} budget(s) have room for more spending`,
      budgets: underutilized.map(b => b.name),
    });
  }

  return insights;
}

// Helper function to get period date ranges
function getBudgetPeriodDates(period: string, date: Date) {
  const now = new Date(date);
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case "daily":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setMilliseconds(-1);
      break;

    case "weekly":
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      endDate.setMilliseconds(-1);
      break;

    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "quarterly":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      break;

    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      throw new Error(`Unsupported period: ${period}`);
  }

  return { startDate, endDate };
}

// Export function to update budget progress when transactions change
export async function updateBudgetsForTransaction(userId: string, transaction: any, operation: 'create' | 'update' | 'delete') {
  try {
    console.log(`=== UPDATING BUDGETS FOR TRANSACTION ${operation.toUpperCase()} ===`);
    console.log('Transaction category:', transaction.category);
    console.log('Transaction type:', transaction.type);
    console.log('Transaction amount:', transaction.amount);
    console.log('UserId:', userId);
    
    await connectDB();
    
    // Only update budgets for expense transactions
    if (transaction.type !== 'expense') {
      console.log('Transaction is not an expense, skipping budget updates');
      return;
    }

    // Find all active budgets for this user that might be affected by this transaction
    const budgets = await Budget.find({ 
      userId, 
      isActive: true 
    });

    console.log(`Found ${budgets.length} active budgets to check`);

    const affectedBudgets = [];

    for (const budget of budgets) {
      let isAffected = false;

      if (budget.budgetType === 'overall') {
        // Overall budgets track all expenses
        isAffected = true;
        console.log(`Budget "${budget.name}" (overall) affected by expense transaction`);
      } else if (budget.budgetType === 'category' && budget.scope?.categories) {
        // Check if transaction category matches budget categories
        const budgetCategories = expandCategories(budget.scope.categories);
        console.log(`Budget "${budget.name}" tracks categories:`, budgetCategories);
        console.log(`Transaction category: "${transaction.category}"`);
        
        if (budgetCategories.includes(transaction.category)) {
          isAffected = true;
          console.log(`✅ Budget "${budget.name}" MATCHES transaction category "${transaction.category}"`);
        } else {
          console.log(`❌ Budget "${budget.name}" does NOT match transaction category "${transaction.category}"`);
        }
      } else if (budget.budgetType === 'account' && transaction.accountId) {
        // Check if transaction account matches budget account scope
        if (budget.scope?.accountIds && budget.scope.accountIds.includes(transaction.accountId)) {
          isAffected = true;
          console.log(`Budget "${budget.name}" (specific accounts) affected by transaction`);
        } else if (budget.scope?.accountTypes) {
          // Check account type
          try {
            const account = await Account.findById(transaction.accountId);
            if (account && budget.scope.accountTypes.includes(account.type)) {
              isAffected = true;
              console.log(`Budget "${budget.name}" (account type: ${account.type}) affected by transaction`);
            }
          } catch (error) {
            console.log(`Error finding account ${transaction.accountId}:`, error.message);
          }
        }
      }

      if (isAffected) {
        affectedBudgets.push(budget);
      }
    }

    console.log(`${affectedBudgets.length} budgets will be updated`);

    // Update progress for all affected budgets
    for (const budget of affectedBudgets) {
      try {
        const progress = await calculateBudgetProgress(budget, userId);
        
        // Update the budget document with new progress
        await Budget.updateOne(
          { _id: budget._id },
          { 
            $set: {
              'currentPeriod.spentAmount': progress.spentAmount,
              'currentPeriod.transactionCount': progress.transactionCount,
              'currentPeriod.progressPercentage': progress.progressPercentage,
              'currentPeriod.lastCalculated': new Date(),
              updatedAt: new Date()
            }
          }
        );

        console.log(`✅ Updated budget "${budget.name}": ₹${progress.spentAmount}/₹${budget.amount} (${progress.progressPercentage.toFixed(1)}%)`);
      } catch (error) {
        console.error(`❌ Error updating budget ${budget.name}:`, error.message);
      }
    }

    console.log('=== BUDGET UPDATE COMPLETE ===');
  } catch (error) {
    console.error('Error in updateBudgetsForTransaction:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

export default router;
