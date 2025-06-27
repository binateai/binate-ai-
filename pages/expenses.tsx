import { useState } from "react";
import Layout from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Expense, InsertExpense } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CalendarIcon, Plus, Download, Trash, Filter, ChevronDown, UploadCloud } from "lucide-react";

// UI Components
import ExpenseSummary from "@/components/expenses/expense-summary";
import ExpenseReports from "@/components/expenses/expense-reports";
import TaxDeductions from "@/components/expenses/tax-deductions";

const ExpenseCategories = [
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

const PaymentMethods = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "Bank Transfer",
  "PayPal",
  "Venmo",
  "Other"
];

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(3, "Description is required"),
  category: z.string().min(1, "Category is required"),
  date: z.date({ required_error: "Date is required" }),
  vendor: z.string().optional(),
  paymentMethod: z.string().optional(),
  taxDeductible: z.boolean().default(true),
  taxRate: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export default function ExpensesPage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [previewUrl, setPreviewUrl] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      description: "",
      category: "",
      date: new Date(),
      vendor: "",
      paymentMethod: "",
      taxDeductible: true,
      taxRate: "0",
      notes: "",
      receiptUrl: "",
    },
  });

  const { 
    data: expenses = [], 
    isLoading,
    refetch: refetchExpenses,
    error: expensesError
  } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      try {
        console.log("Fetching expenses...");
        const res = await apiRequest("GET", "/api/expenses");
        const data = await res.json();
        console.log("Expenses data received:", data);
        return data;
      } catch (error) {
        console.error("Error fetching expenses:", error);
        return [];
      }
    },
  });
  
  // Log important data for debugging
  console.log("Expenses state:", { count: expenses.length, loading: isLoading, error: expensesError });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Convert form data to proper InsertExpense format
      const expenseData: Partial<InsertExpense> = {
        // Convert dollar amount to cents for database storage
        amount: parseInt(data.amount.replace(/[^\d.]/g, "")) * 100 as unknown as number,
        description: data.description,
        category: data.category,
        date: data.date,
        vendor: data.vendor || undefined,
        paymentMethod: data.paymentMethod || undefined,
        taxDeductible: data.taxDeductible,
        taxRate: data.taxRate ? parseInt(data.taxRate.toString()) : 0,
        notes: data.notes || undefined,
        receiptUrl: data.receiptUrl || undefined,
      };

      console.log("Submitting expense:", expenseData);
      const res = await apiRequest("POST", "/api/expenses", expenseData);
      return await res.json();
    },
    onSuccess: () => {
      // Explicitly refetch expenses after successful submission
      refetchExpenses();
      setOpen(false);
      form.reset();
      setPreviewUrl('');
      toast({
        title: "Expense created",
        description: "Your expense has been successfully tracked.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create expense: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    createExpenseMutation.mutate(data);
  }

  // Function to upload receipt with file selection
  const handleReceiptUpload = () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf';
    
    // When a file is selected
    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        
        // For preview purposes
        const previewUrl = URL.createObjectURL(file);
        setPreviewUrl(previewUrl);
        
        // Create FormData to send to server
        const formData = new FormData();
        formData.append('receipt', file);
        
        try {
          // Show loading toast
          toast({
            title: "Uploading receipt...",
            description: "Please wait while we upload your receipt.",
          });
          
          // Send file to server
          const response = await fetch('/api/receipts/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload receipt');
          }
          
          const data = await response.json();
          
          console.log("Receipt upload response:", data);
          
          // Set the receipt URL to the download URL provided by the server
          // Make sure to use the direct URL that can be opened in a browser
          form.setValue("receiptUrl", data.downloadUrl);
          
          toast({
            title: "Receipt uploaded",
            description: `File "${file.name}" has been successfully uploaded.`,
            variant: "default",
          });
        } catch (error) {
          console.error('Error uploading receipt:', error);
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to upload receipt",
            variant: "destructive",
          });
        }
      }
    };
    
    // Trigger file selection dialog
    fileInput.click();
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Expense Tracker</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="$0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    formatDate(field.value)
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe your expense" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ExpenseCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PaymentMethods.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor/Merchant</FormLabel>
                        <FormControl>
                          <Input placeholder="Who did you pay?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxDeductible"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Tax Deductible</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional details here"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Receipt Image</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={handleReceiptUpload}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    </div>
                    {form.watch("receiptUrl") && (
                      <div className="mt-2 space-y-2">
                        <Badge variant="outline" className="bg-green-50">
                          Receipt uploaded
                        </Badge>
                        <div className="max-h-40 overflow-hidden rounded-md border mt-2">
                          <img 
                            src={form.watch("receiptUrl")} 
                            alt="Receipt" 
                            className="w-full h-auto object-contain" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? "Saving..." : "Save Expense"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="all">All Expenses</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="tax">Tax Deductions</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Expense Transactions</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Manage and track all your business expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-6">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading expenses...</p>
                  </div>
                ) : expenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(new Date(expense.date))}</TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>{expense.vendor || "-"}</TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            {expense.taxDeductible && <Badge variant="secondary">Deductible</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {expense.receiptUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    // Open the file in a new window instead of direct download
                                    if (expense.receiptUrl && typeof expense.receiptUrl === 'string') {
                                      window.open(expense.receiptUrl, '_blank');
                                    } else {
                                      console.error('Invalid receipt URL:', expense.receiptUrl);
                                    }
                                  }}
                                  title="View Receipt"
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">View Receipt</span>
                                </Button>
                              )}
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-6">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium">No expenses yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get started by adding your first business expense.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <ExpenseSummary expenses={expenses || []} isLoading={isLoading} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ExpenseReports expenses={expenses || []} isLoading={isLoading} />
          </TabsContent>

          {/* Tax Deductions Tab */}
          <TabsContent value="tax">
            <TaxDeductions expenses={expenses || []} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}