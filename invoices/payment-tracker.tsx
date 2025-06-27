import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Invoice } from "@shared/schema";
import { format, isAfter, differenceInDays } from "date-fns";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Banknote, 
  Calendar, 
  Mail,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentTrackerProps {
  invoices: Invoice[];
}

export default function PaymentTracker({ invoices }: PaymentTrackerProps) {
  const { toast } = useToast();
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [showFilter, setShowFilter] = useState<string>("all");
  
  // Get the current date
  const today = new Date();
  
  // Filter invoices based on user selection
  const filteredInvoices = invoices.filter(invoice => {
    if (showFilter === "all") return true;
    if (showFilter === "overdue") {
      return (
        invoice.status === "overdue" || 
        (invoice.status === "pending" && invoice.dueDate && isAfter(today, new Date(invoice.dueDate)))
      );
    }
    if (showFilter === "pending") return invoice.status === "pending";
    if (showFilter === "paid") return invoice.status === "paid";
    return true;
  });
  
  // Calculate days overdue or days until due
  const calculateDueDays = (invoice: Invoice) => {
    if (!invoice.dueDate) return { text: "No due date", color: "text-muted-foreground" };
    
    const dueDate = new Date(invoice.dueDate);
    const diffDays = differenceInDays(dueDate, today);
    
    if (invoice.status === "paid") {
      return { text: "Paid", color: "text-green-600 dark:text-green-400" };
    }
    
    if (diffDays < 0) {
      // Overdue
      return { 
        text: `${Math.abs(diffDays)} days overdue`, 
        color: "text-red-600 dark:text-red-400" 
      };
    } else if (diffDays === 0) {
      // Due today
      return { 
        text: "Due today", 
        color: "text-amber-600 dark:text-amber-400 font-medium" 
      };
    } else {
      // Due in the future
      return { 
        text: `Due in ${diffDays} days`, 
        color: diffDays <= 3 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground" 
      };
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { color: string, icon: JSX.Element }> = {
      paid: { 
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-20 dark:text-green-400", 
        icon: <CheckCircle className="h-4 w-4 mr-1" /> 
      },
      pending: { 
        color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:bg-opacity-20 dark:text-amber-400", 
        icon: <Clock className="h-4 w-4 mr-1" /> 
      },
      overdue: { 
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400", 
        icon: <AlertTriangle className="h-4 w-4 mr-1" /> 
      },
      draft: { 
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", 
        icon: <FileText className="h-4 w-4 mr-1" /> 
      },
    };
    
    const safeStatus = status || "draft";
    const { color, icon } = statusMap[safeStatus] || statusMap.draft;
    
    return (
      <Badge className={`${color} flex items-center`}>
        {icon}
        <span>{safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}</span>
      </Badge>
    );
  };
  
  // Toggle selection of an invoice
  const toggleInvoiceSelection = (invoiceId: number) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };
  
  // Toggle selection of all visible invoices
  const toggleAllInvoices = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    }
  };
  
  // Mutation for marking invoices as paid
  const markAsPaidMutation = useMutation({
    mutationFn: async (invoiceIds: number[]) => {
      const promises = invoiceIds.map(id => 
        apiRequest("PATCH", `/api/invoices/${id}`, {
          status: "paid",
          paymentDate: new Date().toISOString()
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: `${selectedInvoices.length} invoice(s) marked as paid`,
      });
      setSelectedInvoices([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoices",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for sending reminder emails
  const sendReminderMutation = useMutation({
    mutationFn: async (invoiceIds: number[]) => {
      const promises = invoiceIds.map(id => 
        apiRequest("POST", `/api/invoices/${id}/follow-up`, {})
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Reminders Sent",
        description: `Follow-up emails sent for ${selectedInvoices.length} invoice(s)`,
      });
      setSelectedInvoices([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminders",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating invoice statuses
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/invoices/update-statuses", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice statuses have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update statuses",
        variant: "destructive",
      });
    }
  });
  
  // Handle marking selected invoices as paid
  const handleMarkAsPaid = () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to mark as paid",
        variant: "destructive",
      });
      return;
    }
    
    markAsPaidMutation.mutate(selectedInvoices);
  };
  
  // Handle sending reminders for selected invoices
  const handleSendReminders = () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to send reminders",
        variant: "destructive",
      });
      return;
    }
    
    sendReminderMutation.mutate(selectedInvoices);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Payment Tracker</CardTitle>
            <CardDescription>Track and manage invoice payments</CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex border rounded-md overflow-hidden">
              <Button 
                variant={showFilter === "all" ? "default" : "ghost"} 
                className="rounded-none h-9"
                onClick={() => setShowFilter("all")}
              >
                All
              </Button>
              <Button 
                variant={showFilter === "pending" ? "default" : "ghost"} 
                className="rounded-none h-9"
                onClick={() => setShowFilter("pending")}
              >
                Pending
              </Button>
              <Button 
                variant={showFilter === "overdue" ? "default" : "ghost"} 
                className="rounded-none h-9"
                onClick={() => setShowFilter("overdue")}
              >
                Overdue
              </Button>
              <Button 
                variant={showFilter === "paid" ? "default" : "ghost"} 
                className="rounded-none h-9"
                onClick={() => setShowFilter("paid")}
              >
                Paid
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => updateStatusMutation.mutate()}
              disabled={updateStatusMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh Statuses</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length === 0 ? (
          <div className="text-center p-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-2 font-medium">No invoices found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {showFilter !== "all" 
                ? `No ${showFilter} invoices found. Try changing the filter.` 
                : "You don't have any invoices yet."}
            </p>
          </div>
        ) : (
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={
                        filteredInvoices.length > 0 && 
                        selectedInvoices.length === filteredInvoices.length
                      }
                      onCheckedChange={toggleAllInvoices}
                    />
                  </TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map(invoice => {
                  const dueDays = calculateDueDays(invoice);
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}</div>
                          <div className={`text-xs ${dueDays.color}`}>
                            {dueDays.text}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Mark as Paid"
                            onClick={() => {
                              setSelectedInvoices([invoice.id]);
                              handleMarkAsPaid();
                            }}
                            disabled={invoice.status === 'paid'}
                          >
                            <Banknote className="h-4 w-4" />
                            <span className="sr-only">Mark as Paid</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Send Reminder"
                            onClick={() => {
                              setSelectedInvoices([invoice.id]);
                              handleSendReminders();
                            }}
                            disabled={invoice.status === 'paid' || !invoice.dueDate}
                          >
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Send Reminder</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {filteredInvoices.length > 0 && (
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            {selectedInvoices.length} of {filteredInvoices.length} selected
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminders}
              disabled={selectedInvoices.length === 0 || sendReminderMutation.isPending}
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendReminderMutation.isPending ? "Sending..." : "Send Reminders"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAsPaid}
              disabled={selectedInvoices.length === 0 || markAsPaidMutation.isPending}
            >
              <Banknote className="h-4 w-4 mr-2" />
              {markAsPaidMutation.isPending ? "Updating..." : "Mark as Paid"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}