import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Expense } from '@shared/schema';
import { formatCurrency, formatDate } from './utils';

// Add the necessary types for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Generate a PDF expense report
 * @param expenses Array of expense objects
 * @param title Title of the report
 * @param period Period of the report (e.g., "Monthly - April 2025")
 * @returns The generated PDF document
 */
export function generateExpensePDF(
  expenses: Expense[],
  title: string,
  period: string
): jsPDF {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  
  // Add period
  doc.setFontSize(12);
  doc.text(`Period: ${period}`, 14, 30);
  doc.text(`Generated: ${formatDate(new Date())}`, 14, 36);
  
  // Calculate summary data
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const deductibleExpenses = expenses.filter(expense => expense.taxDeductible);
  const deductibleAmount = deductibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Add summary table
  let currentY = 50;
  doc.setFontSize(14);
  doc.text('Summary', 14, 46);
  
  doc.autoTable({
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Expenses', formatCurrency(totalAmount)],
      ['Number of Expenses', expenses.length.toString()],
      ['Tax Deductible Amount', formatCurrency(deductibleAmount)],
      ['Deductible Percentage', `${totalAmount > 0 ? Math.round((deductibleAmount / totalAmount) * 100) : 0}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  // Get the final Y position
  // @ts-ignore - this actually works with jsPDF-AutoTable despite the type error
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  currentY = finalY + 15;
  
  // Add expense details
  doc.setFontSize(14);
  doc.text('Expense Details', 14, currentY - 5);
  
  // Create table for expense details
  const tableBody = expenses.map(expense => [
    formatDate(expense.date),
    expense.description,
    expense.category,
    formatCurrency(expense.amount),
    expense.taxDeductible ? 'Yes' : 'No',
    expense.vendor || '-',
  ]);
  
  doc.autoTable({
    startY: currentY,
    head: [['Date', 'Description', 'Category', 'Amount', 'Deductible', 'Vendor']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { cellPadding: 1, fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 40 }, // Description
      2: { cellWidth: 35 }, // Category
      3: { cellWidth: 25 }, // Amount
      4: { cellWidth: 20 }, // Deductible
      5: { cellWidth: 35 }, // Vendor
    },
  });
  
  return doc;
}

/**
 * Generate a PDF tax report with tax breakdown
 * @param expenses Array of expense objects, should be filtered to include only tax deductible expenses
 * @param title Title of the report
 * @param period Period of the report (e.g., "2025")
 * @returns The generated PDF document
 */
export function generateTaxReportPDF(
  expenses: Expense[],
  title: string,
  period: string
): jsPDF {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  
  // Add period
  doc.setFontSize(12);
  doc.text(`Tax Year: ${period}`, 14, 30);
  doc.text(`Generated: ${formatDate(new Date())}`, 14, 36);
  
  // Calculate summary data
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalTaxAmount = expenses.reduce((sum, expense) => {
    const taxAmount = expense.taxRate ? (expense.amount * expense.taxRate) / 100 : 0;
    return sum + taxAmount;
  }, 0);
  
  // Group by category
  const expensesByCategory = expenses.reduce((acc: {[key: string]: number}, expense) => {
    const category = expense.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {});
  
  // Add summary info
  let currentY = 46;
  doc.setFontSize(14);
  doc.text('Tax Deduction Summary', 14, currentY);
  currentY += 4;
  
  // Add summary table
  doc.autoTable({
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Deductible Expenses', formatCurrency(totalAmount)],
      ['Number of Deductible Expenses', expenses.length.toString()],
      ['Total VAT/Tax Amount', formatCurrency(totalTaxAmount)],
      ['Net Deductible Amount', formatCurrency(totalAmount - totalTaxAmount)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  // Get the final Y position
  // @ts-ignore - this actually works with jsPDF-AutoTable despite the type error
  const finalY1 = (doc as any).lastAutoTable.finalY || 120;
  currentY = finalY1 + 15;
  
  // Add category breakdown
  doc.setFontSize(14);
  doc.text('Category Breakdown', 14, currentY - 5);
  
  // Create table for category breakdown
  const categoryBody = Object.entries(expensesByCategory).map(([category, amount]) => [
    category,
    formatCurrency(amount),
    `${totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0}%`,
  ]);
  
  doc.autoTable({
    startY: currentY,
    head: [['Category', 'Amount', '% of Total']],
    body: categoryBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  // Get the final Y position
  // @ts-ignore - this actually works with jsPDF-AutoTable despite the type error
  const finalY2 = (doc as any).lastAutoTable.finalY || 180;
  currentY = finalY2 + 15;
  
  // Add expense details
  doc.setFontSize(14);
  doc.text('Deductible Expense Details', 14, currentY - 5);
  
  // Create table for expense details
  const tableBody = expenses.map(expense => {
    const taxAmount = expense.taxRate ? (expense.amount * expense.taxRate) / 100 : 0;
    return [
      formatDate(expense.date),
      expense.description,
      expense.category,
      formatCurrency(expense.amount),
      `${expense.taxRate || 0}%`,
      formatCurrency(taxAmount),
      formatCurrency(expense.amount - taxAmount),
    ];
  });
  
  doc.autoTable({
    startY: currentY,
    head: [['Date', 'Description', 'Category', 'Amount', 'Tax Rate', 'Tax Amount', 'Net Amount']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { cellPadding: 1, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 }, // Date
      1: { cellWidth: 35 }, // Description
      2: { cellWidth: 30 }, // Category
      3: { cellWidth: 25 }, // Amount
      4: { cellWidth: 15 }, // Tax Rate
      5: { cellWidth: 25 }, // Tax Amount
      6: { cellWidth: 25 }, // Net Amount
    },
  });
  
  return doc;
}

/**
 * Downloads a PDF file
 * @param doc PDF document
 * @param filename Filename to save as
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}