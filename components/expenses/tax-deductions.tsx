import { useState } from "react";
import { Expense } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Download, FileText } from "lucide-react";
import { generateTaxReportCSV, expensesToCSV, downloadCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

interface TaxDeductionsProps {
  expenses: Expense[];
  isLoading: boolean;
}

// Predefined tax categories based on common business deductions
const TAX_CATEGORIES = [
  { id: "office", name: "Office Expenses", deductiblePercentage: 100 },
  { id: "travel", name: "Travel", deductiblePercentage: 100 },
  { id: "meals", name: "Business Meals", deductiblePercentage: 50 },
  { id: "auto", name: "Auto Expenses", deductiblePercentage: 80 },
  { id: "home_office", name: "Home Office", deductiblePercentage: 100 },
  { id: "insurance", name: "Business Insurance", deductiblePercentage: 100 },
  { id: "professional", name: "Professional Services", deductiblePercentage: 100 },
  { id: "education", name: "Education", deductiblePercentage: 100 },
  { id: "software", name: "Software & Subscriptions", deductiblePercentage: 100 },
  { id: "other", name: "Other Expenses", deductiblePercentage: 100 },
];

// Colors for chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// Map expense categories to tax categories
const mapExpenseToTaxCategory = (expenseCategory: string): string => {
  const categoryMap: Record<string, string> = {
    "Office Supplies": "office",
    "Travel": "travel",
    "Business Meals": "meals",
    "Auto": "auto",
    "Home Office": "home_office",
    "Insurance": "insurance",
    "Legal": "professional",
    "Professional Fees": "professional",
    "Education": "education",
    "Software": "software",
    "Subscriptions": "software",
  };

  return categoryMap[expenseCategory] || "other";
};

const TaxDeductions: React.FC<TaxDeductionsProps> = ({ expenses, isLoading }) => {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear().toString());
  const [view, setView] = useState("summary");
  const { toast } = useToast();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Filter expenses for the selected tax year
  const yearExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear().toString() === taxYear;
  });

  // Calculate tax deductible expenses
  const deductibleExpenses = yearExpenses.filter(expense => expense.taxDeductible);
  
  // Group expenses by tax category
  const expensesByTaxCategory = deductibleExpenses.reduce((acc: Record<string, number>, expense) => {
    const taxCategory = mapExpenseToTaxCategory(expense.category);
    
    if (!acc[taxCategory]) {
      acc[taxCategory] = 0;
    }
    
    acc[taxCategory] += expense.amount;
    return acc;
  }, {});

  // Calculate totals
  const totalExpenses = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalDeductible = deductibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const deductiblePercentage = totalExpenses > 0 ? (totalDeductible / totalExpenses) * 100 : 0;

  // Prepare data for charts
  const taxCategoryData = Object.entries(expensesByTaxCategory).map(([id, amount]) => {
    const category = TAX_CATEGORIES.find(cat => cat.id === id) || 
      { id, name: id.charAt(0).toUpperCase() + id.slice(1), deductiblePercentage: 100 };
      
    return {
      name: category.name,
      value: amount / 100, // Convert cents to dollars for display
      deductiblePercentage: category.deductiblePercentage
    };
  });

  // Group expenses by quarter
  const expensesByQuarter = deductibleExpenses.reduce((acc: Record<string, number>, expense) => {
    const date = new Date(expense.date);
    const quarter = `Q${Math.floor(date.getMonth() / 3) + 1}`;
    
    if (!acc[quarter]) {
      acc[quarter] = 0;
    }
    
    acc[quarter] += expense.amount;
    return acc;
  }, {});

  // Prepare data for quarterly chart
  const quarterlyData = ["Q1", "Q2", "Q3", "Q4"].map(quarter => ({
    name: quarter,
    amount: (expensesByQuarter[quarter] || 0) / 100 // Convert cents to dollars
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading tax deductions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Deductions</h2>
        <div className="flex gap-4">
          <Select value={taxYear} onValueChange={setTaxYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tax Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline"
            onClick={() => {
              try {
                // Generate CSV version only
                const csvFilename = `Tax_Report_${taxYear}.csv`;
                
                // Generate CSV
                const csvData = generateTaxReportCSV(deductibleExpenses);
                downloadCSV(csvData, csvFilename);
                
                toast({
                  title: "Tax report exported successfully",
                  description: `Saved as ${csvFilename}`,
                  variant: "default",
                });
              } catch (error) {
                console.error("Error exporting tax report:", error);
                toast({
                  title: "Export failed",
                  description: error instanceof Error ? error.message : "Failed to export tax report",
                  variant: "destructive",
                });
              }
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Tax Report
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              try {
                const csvFilename = `Tax_Deductions_${taxYear}.csv`;
                
                // Generate CSV only
                const csvData = expensesToCSV(deductibleExpenses, true);
                downloadCSV(csvData, csvFilename);
                
                toast({
                  title: "Tax deductions exported successfully",
                  description: `Saved as ${csvFilename}`,
                  variant: "default",
                });
              } catch (error) {
                console.error("Error exporting deductions:", error);
                toast({
                  title: "Export failed",
                  description: error instanceof Error ? error.message : "Failed to export tax deductions",
                  variant: "destructive",
                });
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalExpenses)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tax Deductible</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalDeductible)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <Progress value={deductiblePercentage} className="h-2" />
              <span className="text-xs text-muted-foreground">{deductiblePercentage.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deductible Records</CardDescription>
            <CardTitle className="text-2xl">{deductibleExpenses.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-muted-foreground">
              {deductibleExpenses.length} of {yearExpenses.length} expenses are tax deductible
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deduction Summary for {taxYear}</CardTitle>
              <CardDescription>
                Overview of your tax deductions by category and quarter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[350px]">
                  <h3 className="text-sm font-medium mb-4">Deductions by Category</h3>
                  {taxCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taxCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {taxCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No deduction data available</p>
                    </div>
                  )}
                </div>
                <div className="h-[350px]">
                  <h3 className="text-sm font-medium mb-4">Quarterly Deductions</h3>
                  {quarterlyData.some(d => d.amount > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={quarterlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                        <Bar dataKey="amount" fill="#8884d8" name="Deductible Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No quarterly data available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tax Tips</CardTitle>
              <CardDescription>
                Optimize your tax deductions with these suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-green-50 mt-1">Tip</Badge>
                  <p>Keep receipts for all business expenses, including small purchases.</p>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-green-50 mt-1">Tip</Badge>
                  <p>Track mileage for business travel using a dedicated app or logbook.</p>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-green-50 mt-1">Tip</Badge>
                  <p>Business meals are typically only 50% deductible, track them separately.</p>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="bg-green-50 mt-1">Tip</Badge>
                  <p>Consider consulting with a tax professional for specific deduction advice.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Deduction Categories</CardTitle>
              <CardDescription>
                Breakdown of expenses by tax deduction category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Typical Deductible %</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Deductible Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TAX_CATEGORIES.map((category) => {
                    const amount = expensesByTaxCategory[category.id] || 0;
                    const deductibleAmount = (amount * category.deductiblePercentage) / 100;
                    
                    // Skip categories with no expenses
                    if (amount === 0) return null;
                    
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="max-w-[200px]">
                          {getCategoryDescription(category.id)}
                        </TableCell>
                        <TableCell className="text-center">{category.deductiblePercentage}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(deductibleAmount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Tax Deductible Records</CardTitle>
              <CardDescription>
                Individual expense records that are tax deductible
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deductibleExpenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tax Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductibleExpenses.sort((a, b) => {
                      // Sort by date descending
                      return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }).map((expense) => {
                      const taxCategory = mapExpenseToTaxCategory(expense.category);
                      const categoryInfo = TAX_CATEGORIES.find(cat => cat.id === taxCategory);
                      
                      return (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{categoryInfo?.name || "Other Expenses"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">No tax deductible expenses recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to get descriptions for tax categories
function getCategoryDescription(categoryId: string): string {
  const descriptions: Record<string, string> = {
    office: "Office supplies, stationery, and equipment",
    travel: "Business travel including flights, hotels, and transportation",
    meals: "Business meals and entertainment (typically 50% deductible)",
    auto: "Business use of personal vehicle, fuel, insurance, and maintenance",
    home_office: "Portion of home expenses if used regularly for business",
    insurance: "Business insurance premiums",
    professional: "Legal, accounting, and professional services",
    education: "Professional development, courses, and training",
    software: "Software, apps, and subscription services",
    other: "Other business expenses not categorized elsewhere",
  };
  
  return descriptions[categoryId] || "Business expenses";
}

export default TaxDeductions;