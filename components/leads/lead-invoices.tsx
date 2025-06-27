import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Invoice } from "@shared/schema";
import { Plus, FileText, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import InvoiceTaskConnector from "@/components/invoices/invoice-task-connector";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeadInvoicesProps {
  leadId: number;
}

export default function LeadInvoices({ leadId }: LeadInvoicesProps) {
  const { toast } = useToast();
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    number: "",
    amount: 0,
    client: "",
    dueDate: "",
    status: "pending",
    items: [] as Array<{ description: string; quantity: number; unitPrice: number; total: number }>,
  });
  const [currentItem, setCurrentItem] = useState({
    description: "",
    quantity: 1,
    unitPrice: 0,
  });

  // Fetch invoices related to this lead
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/leads", leadId, "invoices"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/leads/${leadId}/invoices`);
      return await response.json();
    },
  });

  // Create a new invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoice: any) => {
      const response = await apiRequest("POST", "/api/invoices", {
        ...invoice,
        leadId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "invoices"] });
      setShowInvoiceDialog(false);
      setNewInvoice({
        number: "",
        amount: 0,
        client: "",
        dueDate: "",
        status: "pending",
        items: [],
      });
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    const total = currentItem.quantity * currentItem.unitPrice;
    setNewInvoice({
      ...newInvoice,
      items: [
        ...newInvoice.items,
        {
          ...currentItem,
          total,
        },
      ],
      amount: newInvoice.amount + total,
    });
    setCurrentItem({
      description: "",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = newInvoice.items[index];
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index),
      amount: newInvoice.amount - itemToRemove.total,
    });
  };

  const handleCreateInvoice = () => {
    createInvoiceMutation.mutate({
      number: newInvoice.number,
      client: newInvoice.client,
      amount: newInvoice.amount,
      status: newInvoice.status,
      dueDate: newInvoice.dueDate ? new Date(newInvoice.dueDate) : null,
      items: newInvoice.items,
    });
  };

  const openCreateInvoiceDialog = () => {
    // Generate invoice number based on date and random number
    const today = new Date();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${randomNum}`;
    
    setNewInvoice({
      number: invoiceNumber,
      amount: 0,
      client: "",
      dueDate: "",
      status: "pending",
      items: [],
    });
    setShowInvoiceDialog(true);
  };

  function getStatusBadge(status: string | null) {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Invoices</CardTitle>
        <Button onClick={openCreateInvoiceDialog} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          New Invoice
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No invoices associated with this lead yet.
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="border rounded-md p-3 space-y-2 bg-card"
              >
                {/* Hidden component that connects invoices to tasks */}
                <InvoiceTaskConnector invoice={invoice} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{invoice.number}</span>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>
                
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {invoice.dueDate ? (
                      <span>Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}</span>
                    ) : (
                      <span>No due date</span>
                    )}
                  </div>
                  
                  {invoice.status === "overdue" && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>Overdue</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Invoice Dialog */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for this lead.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Invoice Number</Label>
                  <Input
                    id="number"
                    value={newInvoice.number}
                    onChange={(e) => setNewInvoice({ ...newInvoice, number: e.target.value })}
                    placeholder="INV-2025-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Input
                    id="client"
                    value={newInvoice.client}
                    onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })}
                    placeholder="Client name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newInvoice.status}
                    onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Invoice Items</Label>
                {newInvoice.items.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted text-muted-foreground text-xs">
                        <tr>
                          <th className="p-2 text-left">Description</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Unit Price</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {newInvoice.items.map((item, index) => (
                          <tr key={index} className="text-sm">
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2 text-right">{formatCurrency(item.total)}</td>
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <span className="sr-only">Remove</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M18 6 6 18" />
                                  <path d="m6 6 12 12" />
                                </svg>
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="font-medium bg-muted/50">
                          <td colSpan={3} className="p-2 text-right">
                            Total:
                          </td>
                          <td className="p-2 text-right">
                            {formatCurrency(newInvoice.amount)}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="grid grid-cols-12 gap-2 pt-2">
                  <div className="col-span-6">
                    <Input
                      placeholder="Description"
                      value={currentItem.description}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Unit Price"
                      value={currentItem.unitPrice}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddItem}
                      disabled={!currentItem.description || currentItem.unitPrice <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={!newInvoice.number || !newInvoice.client || newInvoice.items.length === 0}
              >
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}