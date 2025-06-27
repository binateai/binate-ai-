import Layout from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Invoice, InvoiceItem } from "@shared/schema";
import { formatCurrency, formatDate, generateInvoiceNumber } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Download, 
  Mail,
  FileCheck,
  FileText,
  FileClock,
  FileMinus,
  LayoutDashboard
} from "lucide-react";

// Import our new invoice components
import BookkeepingDashboard from "@/components/invoices/bookkeeping-dashboard";
import PaymentTracker from "@/components/invoices/payment-tracker";
import AutomatedFollowUps from "@/components/invoices/automated-follow-ups";
import TaxSummary from "@/components/invoices/tax-summary";
import InvoiceCategorization from "@/components/invoices/invoice-categorization";
import InvoiceTaskConnector from "@/components/invoices/invoice-task-connector";

export default function Invoices() {
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });
  
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [newInvoice, setNewInvoice] = useState({
    number: generateInvoiceNumber(),
    client: "",
    dueDate: "",
    category: "",
    taxRate: 0,
    items: [{ 
      description: "", 
      quantity: 1, 
      unitPrice: 0, 
      total: 0,
      category: "",
      tags: []
    }] as InvoiceItem[],
  });
  
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoice: any) => {
      return apiRequest("POST", "/api/invoices", invoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice created",
        description: "Your invoice has been successfully created.",
      });
      setOpen(false);
      setNewInvoice({
        number: generateInvoiceNumber(),
        client: "",
        dueDate: "",
        category: "",
        taxRate: 0,
        items: [{ 
          description: "", 
          quantity: 1, 
          unitPrice: 0, 
          total: 0,
          category: "",
          tags: []
        }],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateInvoice = () => {
    // Calculate total amount
    const totalAmount = newInvoice.items.reduce(
      (sum, item) => sum + item.total,
      0
    );
    
    createInvoiceMutation.mutate({
      number: newInvoice.number,
      client: newInvoice.client,
      amount: totalAmount,
      dueDate: newInvoice.dueDate ? new Date(newInvoice.dueDate).toISOString() : undefined,
      items: newInvoice.items,
      status: "pending",
      category: newInvoice.category,
      taxRate: newInvoice.taxRate,
    });
  };
  
  const updateItemField = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total for the updated item
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : updatedItems[index].quantity;
      const unitPrice = field === "unitPrice" ? value : updatedItems[index].unitPrice;
      updatedItems[index].total = quantity * unitPrice;
    }
    
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };
  
  const addInvoiceItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [
        ...newInvoice.items,
        { 
          description: "", 
          quantity: 1, 
          unitPrice: 0, 
          total: 0,
          category: "",
          tags: []
        },
      ],
    });
  };
  
  const removeInvoiceItem = (index: number) => {
    const updatedItems = [...newInvoice.items];
    updatedItems.splice(index, 1);
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };
  
  const getTotalAmount = () => {
    return newInvoice.items.reduce((sum, item) => sum + item.total, 0);
  };
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, icon: JSX.Element }> = {
      paid: { 
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-20 dark:text-green-400", 
        icon: <FileCheck className="h-4 w-4 mr-1" /> 
      },
      pending: { 
        color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:bg-opacity-20 dark:text-amber-400", 
        icon: <FileClock className="h-4 w-4 mr-1" /> 
      },
      overdue: { 
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400", 
        icon: <FileMinus className="h-4 w-4 mr-1" /> 
      },
      draft: { 
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", 
        icon: <FileText className="h-4 w-4 mr-1" /> 
      },
    };
    
    const { color, icon } = statusMap[status] || statusMap.draft;
    
    return (
      <Badge className={`${color} flex items-center`}>
        {icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Create a new invoice for your client. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={newInvoice.number}
                      onChange={(e) => setNewInvoice({ ...newInvoice, number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client">Client</Label>
                    <Input
                      id="client"
                      placeholder="Client name"
                      value={newInvoice.client}
                      onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={newInvoice.taxRate}
                      onChange={(e) => setNewInvoice({ 
                        ...newInvoice, 
                        taxRate: Number(e.target.value) 
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Items</Label>
                    <Button variant="outline" size="sm" onClick={addInvoiceItem}>
                      Add Item
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newInvoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateItemField(index, "description", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItemField(index, "quantity", parseInt(e.target.value))}
                              className="w-16 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.unitPrice}
                              onChange={(e) => updateItemField(index, "unitPrice", parseFloat(e.target.value))}
                              className="w-24 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeInvoiceItem(index)}
                              disabled={newInvoice.items.length === 1}
                            >
                              &times;
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Subtotal:
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getTotalAmount())}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Tax ({newInvoice.taxRate}%):
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getTotalAmount() * (newInvoice.taxRate / 100))}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getTotalAmount() * (1 + newInvoice.taxRate / 100))}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleCreateInvoice}
                  disabled={createInvoiceMutation.isPending || !newInvoice.client || getTotalAmount() === 0}
                >
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-background border">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-muted">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-muted">
              <FileText className="h-4 w-4 mr-2" />
              All Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-muted">
              <FileCheck className="h-4 w-4 mr-2" />
              Payment Tracker
            </TabsTrigger>
            <TabsTrigger value="follow-ups" className="data-[state=active]:bg-muted">
              <Mail className="h-4 w-4 mr-2" />
              Follow-Ups
            </TabsTrigger>
            <TabsTrigger value="tax" className="data-[state=active]:bg-muted">
              <Download className="h-4 w-4 mr-2" />
              Tax Summary
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-muted">
              <FileText className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>
        
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            {isLoading ? (
              <div className="text-center p-6">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading invoices...</p>
              </div>
            ) : (
              <BookkeepingDashboard invoices={invoices || []} />
            )}
          </TabsContent>
          
          {/* All Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>All Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-6">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading invoices...</p>
                  </div>
                ) : invoices && invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice: Invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.number}</TableCell>
                          <TableCell>{invoice.client}</TableCell>
                          <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status || 'pending')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {/* Hidden component that connects invoices to tasks */}
                              <InvoiceTaskConnector invoice={invoice} />
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Mail className="h-4 w-4" />
                                <span className="sr-only">Email</span>
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
                    <h3 className="mt-2 text-lg font-medium">No invoices yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get started by creating a new invoice for your client.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Invoice
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payment Tracker Tab */}
          <TabsContent value="payments">
            {isLoading ? (
              <div className="text-center p-6">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading invoice data...</p>
              </div>
            ) : (
              <PaymentTracker invoices={invoices || []} />
            )}
          </TabsContent>
          
          {/* Follow-Ups Tab */}
          <TabsContent value="follow-ups">
            <AutomatedFollowUps />
          </TabsContent>
          
          {/* Tax Summary Tab */}
          <TabsContent value="tax">
            {isLoading ? (
              <div className="text-center p-6">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading invoice data...</p>
              </div>
            ) : (
              <TaxSummary invoices={invoices || []} />
            )}
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="categories">
            {isLoading ? (
              <div className="text-center p-6">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading invoice data...</p>
              </div>
            ) : (
              <InvoiceCategorization invoices={invoices || []} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
