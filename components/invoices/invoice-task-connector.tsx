import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@shared/schema";
import { format, addDays, isPast, differenceInDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface InvoiceTaskConnectorProps {
  invoice: Invoice;
}

export default function InvoiceTaskConnector({ invoice }: InvoiceTaskConnectorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [taskCreated, setTaskCreated] = useState(false);

  // Create a task related to an invoice
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setTaskCreated(true);
      toast({
        title: "Task created",
        description: "A follow-up task has been created for this invoice",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Only create a task if we haven't already and it meets criteria
    if (!taskCreated) {
      // Logic to determine if we need to create a task
      const needsPaymentTask = invoice.status === "pending" && 
                             invoice.dueDate && 
                             differenceInDays(new Date(invoice.dueDate), new Date()) <= 3;
      
      const needsFollowUpTask = invoice.status === "overdue";
      
      // Create a payment reminder task
      if (needsPaymentTask) {
        const dueDate = new Date(invoice.dueDate!);
        const taskDueDate = new Date();
        
        // Task is due today or one day before actual invoice due date
        if (differenceInDays(dueDate, taskDueDate) <= 1) {
          taskDueDate.setHours(9, 0, 0, 0); // Set to 9 AM
          
          createTaskMutation.mutate({
            title: `Payment reminder for invoice #${invoice.number}`,
            description: `Send a payment reminder for invoice #${invoice.number} to ${invoice.client} for ${formatCurrency(invoice.amount)}. Due date: ${format(dueDate, "MMM d, yyyy")}`,
            dueDate: taskDueDate.toISOString(),
            priority: "high",
            assignedTo: "binate_ai",
            estimatedTime: 15,
            leadId: invoice.leadId, 
            completed: false
          });
        }
      }
      
      // Create a follow-up task for overdue invoices
      if (needsFollowUpTask) {
        const taskDueDate = new Date();
        taskDueDate.setHours(10, 0, 0, 0); // Set to 10 AM
        
        createTaskMutation.mutate({
          title: `Follow up on overdue invoice #${invoice.number}`,
          description: `Invoice #${invoice.number} for ${invoice.client} (${formatCurrency(invoice.amount)}) is overdue. Contact client to request payment.`,
          dueDate: taskDueDate.toISOString(),
          priority: "high",
          assignedTo: "binate_ai",
          estimatedTime: 20,
          leadId: invoice.leadId,
          completed: false
        });
      }
    }
  }, [invoice, taskCreated]);

  return null; // This is a non-visual component
}