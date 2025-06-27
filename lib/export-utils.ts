import { Expense } from "@shared/schema";
import { formatDate, formatCurrency } from "./utils";

/**
 * Converts an array of expenses to CSV format
 * @param expenses Array of expense objects
 * @param includeReceipts Whether to include receipt URLs
 * @returns CSV string
 */
export function expensesToCSV(expenses: Expense[], includeReceipts: boolean = false): string {
  // Define headers based on whether to include receipts
  let headers = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Vendor",
    "Payment Method",
    "Tax Deductible",
    "Tax Rate",
    "Tax Amount",
    "Notes"
  ];
  
  if (includeReceipts) {
    headers.push("Receipt URL");
  }
  
  // Create CSV header row
  let csv = headers.join(",") + "\n";
  
  // Add each expense as a row
  expenses.forEach(expense => {
    const taxAmount = expense.taxRate ? (expense.amount * expense.taxRate) / 100 : 0;
    const formattedAmount = formatCurrency(expense.amount).replace("$", "");
    const formattedTaxAmount = formatCurrency(taxAmount).replace("$", "");
    
    // Clean and format values to prevent CSV injection and ensure proper formatting
    let row = [
      formatDate(expense.date),
      `"${(expense.description || "").replace(/"/g, '""')}"`,
      `"${(expense.category || "").replace(/"/g, '""')}"`,
      formattedAmount,
      `"${(expense.vendor || "").replace(/"/g, '""')}"`,
      `"${(expense.paymentMethod || "").replace(/"/g, '""')}"`,
      expense.taxDeductible ? "Yes" : "No",
      `${expense.taxRate || 0}%`,
      formattedTaxAmount,
      `"${(expense.notes || "").replace(/"/g, '""')}"`
    ];
    
    if (includeReceipts) {
      row.push(`"${expense.receiptUrl || ""}"`);
    }
    
    csv += row.join(",") + "\n";
  });
  
  return csv;
}

/**
 * Generates a tax report CSV with VAT breakdown
 * @param expenses Array of expense objects
 * @returns CSV string
 */
export function generateTaxReportCSV(expenses: Expense[]): string {
  // Create headers
  const headers = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Vendor",
    "Tax Deductible",
    "Tax Rate",
    "VAT/Tax Amount",
    "Net Amount"
  ];
  
  let csv = headers.join(",") + "\n";
  
  // Add each deductible expense as a row
  expenses
    .filter(expense => expense.taxDeductible)
    .forEach(expense => {
      const taxAmount = expense.taxRate ? (expense.amount * expense.taxRate) / 100 : 0;
      const netAmount = expense.amount - taxAmount;
      
      const formattedAmount = formatCurrency(expense.amount).replace("$", "");
      const formattedTaxAmount = formatCurrency(taxAmount).replace("$", "");
      const formattedNetAmount = formatCurrency(netAmount).replace("$", "");
      
      const row = [
        formatDate(expense.date),
        `"${(expense.description || "").replace(/"/g, '""')}"`,
        `"${(expense.category || "").replace(/"/g, '""')}"`,
        formattedAmount,
        `"${(expense.vendor || "").replace(/"/g, '""')}"`,
        "Yes",
        `${expense.taxRate || 0}%`,
        formattedTaxAmount,
        formattedNetAmount
      ];
      
      csv += row.join(",") + "\n";
    });
  
  return csv;
}

/**
 * Creates a summary CSV for expense analysis
 * @param expenses Array of expense objects
 * @param period The time period (e.g., "month", "quarter", "year")
 * @returns CSV string with summary information
 */
export function generateExpenseSummaryCSV(
  expenses: Expense[],
  period: string = "month"
): string {
  // Get total amount
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Get total by category
  const expensesByCategory = expenses.reduce(
    (acc: { [key: string]: number }, expense) => {
      const category = expense.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    },
    {}
  );
  
  // Get tax deductible amount
  const taxDeductibleAmount = expenses
    .filter(expense => expense.taxDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Get total tax amount
  const totalTaxAmount = expenses.reduce(
    (sum, expense) => {
      const taxAmount = expense.taxRate ? (expense.amount * expense.taxRate) / 100 : 0;
      return sum + taxAmount;
    },
    0
  );
  
  // Create CSV
  let csv = "Expense Summary\n";
  csv += `Period,${period}\n`;
  csv += `Date Generated,${formatDate(new Date())}\n\n`;
  
  csv += "Summary Metrics\n";
  csv += `Total Expenses,${formatCurrency(totalAmount).replace("$", "")}\n`;
  csv += `Tax Deductible Expenses,${formatCurrency(taxDeductibleAmount).replace("$", "")}\n`;
  csv += `Total Tax/VAT,${formatCurrency(totalTaxAmount).replace("$", "")}\n\n`;
  
  csv += "Expenses by Category\n";
  csv += "Category,Amount,Percentage\n";
  
  Object.entries(expensesByCategory).forEach(([category, amount]) => {
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    csv += `"${category}",${formatCurrency(amount).replace("$", "")},${percentage.toFixed(2)}%\n`;
  });
  
  return csv;
}

/**
 * Downloads data as a CSV file
 * @param data CSV string content
 * @param filename Filename to save as
 */
export function downloadCSV(data: string, filename: string): void {
  // Create a blob with the CSV data
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  
  // Trigger the download and clean up
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generates a full expense report with deductible and non-deductible sections
 * @param expenses Array of expense objects
 * @returns CSV string with the full report
 */
export function generateFullExpenseReportCSV(expenses: Expense[]): string {
  const deductible = expenses.filter(expense => expense.taxDeductible);
  const nonDeductible = expenses.filter(expense => !expense.taxDeductible);
  
  let csv = "EXPENSE REPORT\n";
  csv += `Date Generated,${formatDate(new Date())}\n\n`;
  
  csv += "SUMMARY\n";
  csv += `Total Expenses,${formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0)).replace("$", "")}\n`;
  csv += `Deductible Expenses,${formatCurrency(deductible.reduce((sum, exp) => sum + exp.amount, 0)).replace("$", "")}\n`;
  csv += `Non-Deductible Expenses,${formatCurrency(nonDeductible.reduce((sum, exp) => sum + exp.amount, 0)).replace("$", "")}\n\n`;
  
  // Deductible Expenses Section
  csv += "DEDUCTIBLE EXPENSES\n";
  csv += "Date,Description,Category,Amount,Vendor,Payment Method,Tax Rate,Tax Amount,Notes\n";
  
  deductible.forEach(expense => {
    const taxAmount = expense.taxRate ? (expense.amount * expense.taxRate) / 100 : 0;
    const formattedAmount = formatCurrency(expense.amount).replace("$", "");
    const formattedTaxAmount = formatCurrency(taxAmount).replace("$", "");
    
    const row = [
      formatDate(expense.date),
      `"${(expense.description || "").replace(/"/g, '""')}"`,
      `"${(expense.category || "").replace(/"/g, '""')}"`,
      formattedAmount,
      `"${(expense.vendor || "").replace(/"/g, '""')}"`,
      `"${(expense.paymentMethod || "").replace(/"/g, '""')}"`,
      `${expense.taxRate || 0}%`,
      formattedTaxAmount,
      `"${(expense.notes || "").replace(/"/g, '""')}"`
    ];
    
    csv += row.join(",") + "\n";
  });
  
  csv += "\nNON-DEDUCTIBLE EXPENSES\n";
  csv += "Date,Description,Category,Amount,Vendor,Payment Method,Notes\n";
  
  nonDeductible.forEach(expense => {
    const formattedAmount = formatCurrency(expense.amount).replace("$", "");
    
    const row = [
      formatDate(expense.date),
      `"${(expense.description || "").replace(/"/g, '""')}"`,
      `"${(expense.category || "").replace(/"/g, '""')}"`,
      formattedAmount,
      `"${(expense.vendor || "").replace(/"/g, '""')}"`,
      `"${(expense.paymentMethod || "").replace(/"/g, '""')}"`,
      `"${(expense.notes || "").replace(/"/g, '""')}"`
    ];
    
    csv += row.join(",") + "\n";
  });
  
  return csv;
}