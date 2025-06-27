import { useState } from "react";
import { Expense } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Calendar, Filter, ChevronDown } from "lucide-react";
import { expensesToCSV, generateFullExpenseReportCSV, generateTaxReportCSV, downloadCSV } from "@/lib/export-utils";
import { generateExpensePDF, generateTaxReportPDF, downloadPDF } from "@/lib/pdf-utils";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ExpenseReportsProps {
  expenses: Expense[];
  isLoading: boolean;
}

// Report periods
const reportPeriods = [
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "year", label: "Annual" },
  { value: "custom", label: "Custom Range" },
];

// Report types
const reportTypes = [
  { value: "summary", label: "Summary Report" },
  { value: "detailed", label: "Detailed Expenses" },
  { value: "category", label: "Category Breakdown" },
  { value: "tax", label: "Tax Deduction Report" },
];

const ExpenseReports: React.FC<ExpenseReportsProps> = ({ expenses, isLoading }) => {
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportType, setReportType] = useState("summary");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Filter expenses for the selected period and year
  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const expenseYear = expenseDate.getFullYear();
    
    if (expenseYear.toString() !== year) {
      return false;
    }

    const expenseMonth = expenseDate.getMonth();
    const currentMonth = new Date().getMonth();
    
    switch (reportPeriod) {
      case "month":
        // Current month
        return expenseMonth === currentMonth;
      case "quarter":
        // Current quarter
        const currentQuarter = Math.floor(currentMonth / 3);
        const expenseQuarter = Math.floor(expenseMonth / 3);
        return expenseQuarter === currentQuarter;
      case "year":
        // Current year
        return true;
      default:
        return true;
    }
  });

  // Calculate report data
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Get expenses grouped by category
  const expensesByCategory = filteredExpenses.reduce((acc: {[key: string]: number}, expense) => {
    const category = expense.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {});

  // Get tax deductible amount
  const taxDeductibleAmount = filteredExpenses
    .filter(expense => expense.taxDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading expense reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expense Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  {reportPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-none self-end space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    All Expenses
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Tax Deductible Only
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Non-Deductible Only
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    High to Low (Amount)
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Low to High (Amount)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Expenses</SheetTitle>
                    <SheetDescription>
                      Customize your expense report view with advanced filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Categories</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {['Office Supplies', 'Travel', 'Business Meals', 'Software', 'Equipment'].map((cat) => (
                          <div className="flex items-center space-x-2" key={cat}>
                            <Checkbox id={`cat-${cat}`} />
                            <Label htmlFor={`cat-${cat}`}>{cat}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Payment Method</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer'].map((method) => (
                          <div className="flex items-center space-x-2" key={method}>
                            <Checkbox id={`pm-${method}`} />
                            <Label htmlFor={`pm-${method}`}>{method}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Amount Range</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs">Min Amount</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            className="w-full mt-1 rounded-md border border-input px-3 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Max Amount</label>
                          <input 
                            type="number" 
                            placeholder="5000"
                            className="w-full mt-1 rounded-md border border-input px-3 py-1 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Tax Status</h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="tax-deductible" />
                        <Label htmlFor="tax-deductible">Tax Deductible Only</Label>
                      </div>
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button type="submit">Apply Filters</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Report header */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {reportTypes.find(t => t.value === reportType)?.label || 'Report'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {reportPeriods.find(p => p.value === reportPeriod)?.label || 'Period'} • {year}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                {/* PDF button removed due to compatibility issues */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    try {
                      // Get appropriate filename based on report type
                      const reportTypeName = reportTypes.find(t => t.value === reportType)?.label || 'Report';
                      const periodName = reportPeriods.find(p => p.value === reportPeriod)?.label || 'Period';
                      const filename = `${reportTypeName.replace(' ', '_')}_${periodName}_${year}.csv`;
                      
                      let csvData = '';
                      
                      // Generate different CSV data based on report type
                      if (reportType === 'tax') {
                        csvData = generateTaxReportCSV(filteredExpenses);
                      } else if (reportType === 'summary') {
                        csvData = generateFullExpenseReportCSV(filteredExpenses);
                      } else {
                        // Default to detailed expense list
                        csvData = expensesToCSV(filteredExpenses, true);
                      }
                      
                      // Download the CSV
                      downloadCSV(csvData, filename);
                      
                      toast({
                        title: "Report exported successfully",
                        description: `Saved as ${filename}`,
                        variant: "default",
                      });
                    } catch (error) {
                      console.error("Error exporting CSV:", error);
                      toast({
                        title: "Export failed",
                        description: error instanceof Error ? error.message : "Failed to export report",
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="font-semibold text-xl">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Expenses</p>
                <p className="font-semibold text-xl">{filteredExpenses.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Deductible</p>
                <p className="font-semibold text-xl">{formatCurrency(taxDeductibleAmount)}</p>
              </div>
            </div>
          </div>

          {/* Report content based on type */}
          {reportType === "summary" && (
            <div className="space-y-4">
              <h3 className="font-medium">Summary by Category</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <TableRow key={category}>
                      <TableCell className="font-medium">{category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                      <TableCell className="text-right">
                        {totalAmount ? `${((amount / totalAmount) * 100).toFixed(1)}%` : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "detailed" && (
            <div className="space-y-4">
              <h3 className="font-medium">Detailed Expenses</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.vendor || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "category" && (
            <div className="space-y-4">
              <h3 className="font-medium">Category Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(expensesByCategory).map(([category, amount]) => {
                    const count = filteredExpenses.filter(e => e.category === category).length;
                    const average = count > 0 ? amount / count : 0;
                    
                    return (
                      <TableRow key={category}>
                        <TableCell className="font-medium">{category}</TableCell>
                        <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(average)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "tax" && (
            <div className="space-y-4">
              <h3 className="font-medium">Tax Deduction Report</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Tax Rate</TableHead>
                    <TableHead className="text-right">Tax Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses
                    .filter(expense => expense.taxDeductible)
                    .map((expense) => {
                      const taxAmount = expense.taxRate ? (expense.amount * expense.taxRate) / 100 : 0;
                      
                      return (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell className="text-right">{expense.taxRate || 0}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(taxAmount)}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseReports;