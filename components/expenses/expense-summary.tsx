import { useState } from "react";
import { Expense } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { expensesToCSV, generateFullExpenseReportCSV, downloadCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ExpenseSummaryProps {
  expenses: Expense[];
  isLoading: boolean;
}

// Utility function to group expenses by category
const groupByCategory = (expenses: Expense[]) => {
  const grouped = expenses.reduce((acc: {[key: string]: number}, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: value / 100, // Convert cents to dollars for display
  }));
};

// Utility to group expenses by month
const groupByMonth = (expenses: Expense[]) => {
  const months: {[key: string]: number} = {};
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!months[monthYear]) {
      months[monthYear] = 0;
    }
    
    months[monthYear] += expense.amount;
  });
  
  return Object.entries(months).map(([name, amount]) => ({
    name,
    amount: amount / 100, // Convert cents to dollars for display
  }));
};

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ expenses, isLoading }) => {
  const { toast } = useToast();
  const [period, setPeriod] = useState("all");
  
  // Filter expenses based on selected period
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    
    switch (period) {
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return expenseDate >= weekAgo;
      case "month":
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return expenseDate >= monthAgo;
      case "quarter":
        const quarterAgo = new Date();
        quarterAgo.setMonth(now.getMonth() - 3);
        return expenseDate >= quarterAgo;
      case "year":
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return expenseDate >= yearAgo;
      default:
        return true;
    }
  });
  
  const categoryData = groupByCategory(filteredExpenses);
  const monthlyData = groupByMonth(filteredExpenses);

  // Calculate the total amount of expenses
  const totalAmount = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  
  // Calculate the average expense amount
  const averageAmount = filteredExpenses.length ? totalAmount / filteredExpenses.length : 0;
  
  // Find the expense with the highest amount
  const highestExpense = filteredExpenses.length ? 
    filteredExpenses.reduce((max, expense) => expense.amount > max.amount ? expense : max, filteredExpenses[0]) :
    null;

  // Count total expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc: {[key: string]: number}, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  // Find the most frequent category
  const mostFrequentCategory = Object.entries(expensesByCategory)
    .reduce((max, [category, count]) => 
      count > (max[1] || 0) ? [category, count] : max, 
      ['', 0]
    )[0];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading expense summary...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expense Summary</h2>
        <div className="flex gap-4 items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          {/* PDF button removed due to compatibility issues */}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              try {
                const periodText = period === 'all' ? 'All_Time' : `Last_${period.charAt(0).toUpperCase() + period.slice(1)}`;
                const csvFilename = `Expense_Summary_${periodText}.csv`;
                
                // Generate CSV
                const csvData = generateFullExpenseReportCSV(filteredExpenses);
                
                // Download the CSV
                downloadCSV(csvData, csvFilename);
                
                toast({
                  title: "CSV exported successfully",
                  description: `Saved as ${csvFilename}`,
                  variant: "default",
                });
              } catch (error) {
                console.error("Error exporting CSV:", error);
                toast({
                  title: "CSV export failed",
                  description: error instanceof Error ? error.message : "Failed to export summary",
                  variant: "destructive",
                });
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalAmount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Expense</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(averageAmount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Highest Expense</CardDescription>
            <CardTitle className="text-2xl">{highestExpense ? formatCurrency(highestExpense.amount) : '$0.00'}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pt-0">
            {highestExpense ? highestExpense.description : 'No expenses'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Category</CardDescription>
            <CardTitle className="text-2xl">{mostFrequentCategory || 'None'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="byCategory" className="space-y-4">
            <TabsList>
              <TabsTrigger value="byCategory">By Category</TabsTrigger>
              <TabsTrigger value="byTime">Over Time</TabsTrigger>
            </TabsList>
            <TabsContent value="byCategory" className="h-[400px]">
              {categoryData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name"
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No expense data available</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="byTime" className="h-[400px]">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="Expense Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No expense data available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSummary;