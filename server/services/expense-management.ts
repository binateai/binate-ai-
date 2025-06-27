import { storage } from "../storage";
import { categorizeExpense } from "../ai-service";

/**
 * Supported expense categories
 */
export const EXPENSE_CATEGORIES = [
  "Advertising",
  "Auto",
  "Business Meals",
  "Education",
  "Entertainment",
  "Equipment",
  "Home Office",
  "Insurance",
  "Legal",
  "Maintenance",
  "Office Supplies",
  "Professional Fees",
  "Rent",
  "Software",
  "Subscriptions",
  "Travel",
  "Utilities",
  "Other"
];

/**
 * Get all uncategorized expenses for a user
 */
export async function getUncategorizedExpenses(userId: number) {
  try {
    const expenses = await storage.getExpensesByUserId(userId);
    return expenses.filter(expense => !expense.category || expense.category === 'Uncategorized');
  } catch (error) {
    console.error(`Error getting uncategorized expenses for user ${userId}:`, error);
    return [];
  }
}

/**
 * Suggest a category for an expense description
 */
export async function suggestExpenseCategory(description: string): Promise<string | null> {
  if (!description) return null;
  
  try {
    const category = await categorizeExpense(description, EXPENSE_CATEGORIES);
    
    if (category && EXPENSE_CATEGORIES.includes(category)) {
      return category;
    }
    
    return null;
  } catch (error) {
    console.error(`Error suggesting category for expense: ${description}`, error);
    return null;
  }
}

/**
 * Analyze expense patterns for a user
 */
export async function analyzeExpensePatterns(userId: number) {
  try {
    const expenses = await storage.getExpensesByUserId(userId);
    
    if (expenses.length === 0) {
      return {
        totalExpenses: 0,
        categorySummary: {},
        monthlySummary: {},
        insights: []
      };
    }
    
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group expenses by category
    const categorySummary: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categorySummary[category] = (categorySummary[category] || 0) + expense.amount;
    });
    
    // Group expenses by month
    const monthlySummary: Record<string, number> = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlySummary[monthKey] = (monthlySummary[monthKey] || 0) + expense.amount;
    });
    
    // Generate insights
    const insights: string[] = [];
    
    // Top expense categories
    const topCategories = Object.entries(categorySummary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (topCategories.length > 0) {
      insights.push(`Your top expense category is ${topCategories[0][0]} at $${topCategories[0][1].toFixed(2)}`);
    }
    
    // Monthly trends
    const monthlyEntries = Object.entries(monthlySummary);
    if (monthlyEntries.length >= 2) {
      monthlyEntries.sort((a, b) => a[0].localeCompare(b[0]));
      const currentMonth = monthlyEntries[monthlyEntries.length - 1];
      const previousMonth = monthlyEntries[monthlyEntries.length - 2];
      
      const change = ((currentMonth[1] - previousMonth[1]) / previousMonth[1]) * 100;
      
      if (Math.abs(change) > 10) {
        insights.push(
          `Your expenses ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to last month`
        );
      }
    }
    
    return {
      totalExpenses,
      categorySummary,
      monthlySummary,
      insights
    };
  } catch (error) {
    console.error(`Error analyzing expense patterns for user ${userId}:`, error);
    return {
      totalExpenses: 0,
      categorySummary: {},
      monthlySummary: {},
      insights: []
    };
  }
}

/**
 * Calculate tax deductions for a user
 */
export async function calculateTaxDeductions(userId: number) {
  try {
    const expenses = await storage.getExpensesByUserId(userId);
    
    // Filter for deductible expenses
    // Note: This is a simplified approach to tax deductions. In real life, tax rules are more complex.
    const deductibleCategories = [
      "Advertising",
      "Business Meals",
      "Education",
      "Equipment",
      "Home Office",
      "Insurance",
      "Legal",
      "Maintenance",
      "Office Supplies",
      "Professional Fees",
      "Rent",
      "Software",
      "Subscriptions",
      "Travel",
      "Utilities"
    ];
    
    const deductibleExpenses = expenses.filter(expense => 
      deductibleCategories.includes(expense.category || '')
    );
    
    // Calculate total deductions
    const totalDeductions = deductibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Group by category
    const deductionsByCategory: Record<string, number> = {};
    deductibleExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      deductionsByCategory[category] = (deductionsByCategory[category] || 0) + expense.amount;
    });
    
    return {
      totalDeductions,
      deductionsByCategory,
      deductibleExpenses
    };
  } catch (error) {
    console.error(`Error calculating tax deductions for user ${userId}:`, error);
    return {
      totalDeductions: 0,
      deductionsByCategory: {},
      deductibleExpenses: []
    };
  }
}