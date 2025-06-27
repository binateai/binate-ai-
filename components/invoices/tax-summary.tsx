import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Invoice } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  ChevronDown, 
  Calendar, 
  Calculator, 
  ReceiptText,
  Loader2,
  Check
} from "lucide-react";

// Time periods for reporting
const TIME_PERIODS = [
  { value: "current-month", label: "Current Month" },
  { value: "previous-month", label: "Previous Month" },
  { value: "current-quarter", label: "Current Quarter" },
  { value: "previous-quarter", label: "Previous Quarter" },
  { value: "current-year", label: "Current Year (YTD)" },
  { value: "previous-year", label: "Previous Year" },
  { value: "custom", label: "Custom Period..." },
];

const EXPORT_FORMATS = [
  { value: "csv", label: "CSV", icon: <FileSpreadsheet className="mr-2 h-4 w-4" /> },
  { value: "pdf", label: "PDF", icon: <FileText className="mr-2 h-4 w-4" /> },
];

interface TaxSummaryProps {
  invoices: Invoice[];
}

export default function TaxSummary({ invoices }: TaxSummaryProps) {
  const { toast } = useToast();
  const [period, setPeriod] = useState("current-month");
  const [exportFormat, setExportFormat] = useState("csv");
  
  // Calculate summary data
  const calculateTaxSummary = () => {
    // In a real application, this would filter invoices based on the selected period
    // For this example, we'll just use all invoices
    
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalPaid = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalUnpaid = totalInvoiced - totalPaid;
    
    // Calculate VAT (if applicable) - using taxRate from invoice if available
    const totalVat = invoices.reduce((sum, invoice) => {
      const taxRate = invoice.taxRate || 0;
      return sum + (invoice.amount * taxRate / 100);
    }, 0);
    
    return {
      totalInvoiced,
      totalPaid,
      totalUnpaid,
      totalVat,
      invoiceCount: invoices.length,
      paidCount: invoices.filter(invoice => invoice.status === 'paid').length,
      unpaidCount: invoices.filter(invoice => invoice.status !== 'paid').length,
    };
  };
  
  const summary = calculateTaxSummary();
  
  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/invoices/export", {
        period,
        format: exportFormat,
      });
    },
    onSuccess: async (response) => {
      // This would normally handle the file download from the response
      // For this example, we'll just show a success toast
      toast({
        title: "Export Complete",
        description: `Your ${exportFormat.toUpperCase()} report has been generated`,
      });
      
      // Simulate file download
      setTimeout(() => {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = URL.createObjectURL(new Blob([''], { type: 'text/plain' }));
        a.download = `tax-summary-${period}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Something went wrong during export",
        variant: "destructive",
      });
    }
  });
  
  const handleExport = () => {
    exportMutation.mutate();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax-Ready Summary</CardTitle>
        <CardDescription>
          Export financial data for tax reporting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Card */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center">
                <ReceiptText className="h-4 w-4 mr-1" />
                Total Invoiced
              </div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalInvoiced)}</div>
              <div className="text-xs text-muted-foreground">
                {summary.invoiceCount} invoice{summary.invoiceCount !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Total Paid
              </div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</div>
              <div className="text-xs text-muted-foreground">
                {summary.paidCount} invoice{summary.paidCount !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="space-y-1 col-span-2 md:col-span-1">
              <div className="text-sm text-muted-foreground flex items-center">
                <Calculator className="h-4 w-4 mr-1" />
                Tax Collected (VAT)
              </div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalVat)}</div>
              <div className="text-xs text-muted-foreground">
                Based on invoice tax rates
              </div>
            </div>
          </div>
        </div>
        
        {/* Export Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-period">Time Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="time-period" className="w-full">
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select time period" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {TIME_PERIODS.map((periodOption) => (
                    <SelectItem key={periodOption.value} value={periodOption.value}>
                      {periodOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="export-format" className="w-full">
                  <span className="flex items-center">
                    {exportFormat === 'csv' ? (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    <SelectValue placeholder="Select export format" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center">
                        {format.icon}
                        {format.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4 sm:justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {period === 'custom' ? (
            <span>Custom period selected. Please choose start and end dates.</span>
          ) : (
            <span>
              Ready to export {TIME_PERIODS.find(p => p.value === period)?.label.toLowerCase()} data.
            </span>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="w-full sm:w-auto"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}