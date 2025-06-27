import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Layout from "@/components/layout/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  MoreHorizontal,
  Plus,
  PencilLine,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Building,
  ListFilter,
  Mail,
  Search,
  Tag,
  Globe,
  RefreshCw,
  CheckSquare,
  ClipboardCheck,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Task and Invoice interfaces based on schema
interface Task {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completed: boolean | null;
  priority: string | null;
  aiGenerated: boolean | null;
  leadId: number | null;
}

interface Invoice {
  id: number;
  userId: number;
  number: string;
  client: string;
  amount: number;
  status: string | null;
  issueDate: Date | null;
  dueDate: Date | null;
  lastEmailDate: Date | null;
  items: any;
  leadId: number | null;
}

// Component to display tasks associated with a lead
function TasksList({ leadId }: { leadId: number }) {
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { leadId }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tasks?leadId=${leadId}`);
      return response.json();
    }
  });

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No tasks associated with this lead yet.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-2 p-2 border rounded-md">
          <div className={`p-1 rounded-full ${task.completed ? "bg-green-100" : "bg-amber-100"}`}>
            {task.completed ? (
              <CheckSquare className="h-4 w-4 text-green-600" />
            ) : (
              <ClipboardCheck className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{task.title}</p>
            {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
          </div>
          <div className="flex flex-col items-end text-xs">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component to display invoices associated with a lead
function InvoicesList({ leadId }: { leadId: number }) {
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", { leadId }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/invoices?leadId=${leadId}`);
      return response.json();
    }
  });

  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No invoices associated with this lead yet.</p>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="mt-3 space-y-2">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="flex items-start gap-2 p-2 border rounded-md">
          <div className={`p-1 rounded-full ${
            invoice.status === 'paid' 
              ? "bg-green-100" 
              : invoice.status === 'overdue' 
                ? "bg-red-100" 
                : "bg-blue-100"
          }`}>
            {invoice.status === 'paid' ? (
              <CheckSquare className="h-4 w-4 text-green-600" />
            ) : invoice.status === 'overdue' ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <DollarSign className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Invoice #{invoice.number}</p>
            <p className="text-xs text-muted-foreground">
              {invoice.dueDate && `Due: ${format(new Date(invoice.dueDate), "MMM d, yyyy")}`}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-medium text-sm">{formatCurrency(invoice.amount)}</span>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${
                invoice.status === 'paid' 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : invoice.status === 'overdue' 
                    ? "border-red-200 text-red-700 bg-red-50"
                    : ""
              }`}
            >
              {invoice.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// Lead type according to schema
interface Lead {
  id: number;
  userId: number;
  name: string;
  email: string;
  company: string | null;
  source: string;
  sourceId: string | null;
  status: string | null;
  priority: string | null;
  value: number | null;
  tags: string[] | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: any;
}

interface LeadFormData {
  name: string;
  email: string;
  company: string;
  source: string;
  status: string;
  priority: string;
  value: string;
  tags: string;
  notes: string;
}

export default function LeadsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "me",
  });
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    company: "",
    source: "manual",
    status: "new",
    priority: "medium",
    value: "0",
    tags: "",
    notes: "",
  });

  // Fetch leads
  const {
    data: leads = [],
    isLoading,
    isError,
  } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/leads");
      return response.json();
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsAddLeadOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Lead>;
    }) => {
      const response = await apiRequest("PATCH", `/api/leads/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsEditLeadOpen(false);
      setCurrentLead(null);
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Process leads mutation
  const processLeadsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/leads/auto-process");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Leads Processed",
        description: `Processed ${data.processed} leads, updated ${data.priorityUpdated} priorities, sent ${data.followUpSent} follow-ups`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to process leads: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Create task for lead mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      dueDate: string;
      priority: string;
      assignedTo: string;
      leadId: number;
    }) => {
      const response = await apiRequest("POST", "/api/tasks", {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsAddTaskOpen(false);
      setTaskFormData({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assignedTo: "me",
      });
      setCurrentLead(null);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for creating a new lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const leadData = {
      name: formData.name,
      email: formData.email,
      company: formData.company || null,
      source: formData.source,
      status: formData.status,
      priority: formData.priority,
      value: formData.value ? parseFloat(formData.value) : 0,
      tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      notes: formData.notes || null,
    };
    createLeadMutation.mutate(leadData);
  };

  // Handle form submission for updating a lead
  const handleUpdateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead) return;
    
    const leadData = {
      name: formData.name,
      email: formData.email,
      company: formData.company || null,
      source: formData.source,
      status: formData.status,
      priority: formData.priority,
      value: formData.value ? parseFloat(formData.value) : 0,
      tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      notes: formData.notes || null,
    };
    
    updateLeadMutation.mutate({ id: currentLead.id, data: leadData });
  };

  // Handle edit lead action
  const handleEditLead = (lead: Lead) => {
    setCurrentLead(lead);
    setFormData({
      name: lead.name || "",
      email: lead.email || "",
      company: lead.company || "",
      source: lead.source || "manual",
      status: lead.status || "new",
      priority: lead.priority || "medium",
      value: lead.value?.toString() || "0",
      tags: lead.tags && Array.isArray(lead.tags) ? lead.tags.join(", ") : "",
      notes: lead.notes || "",
    });
    setIsEditLeadOpen(true);
  };
  
  // Handle create task for lead
  const handleAddTask = (lead: Lead) => {
    setCurrentLead(lead);
    setTaskFormData({
      title: `Follow up with ${lead.name}`,
      description: `Next steps for ${lead.company || 'this lead'}`,
      dueDate: "",
      priority: "medium",
      assignedTo: "me",
    });
    setIsAddTaskOpen(true);
  };
  
  // Handle task input changes
  const handleTaskInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission for creating a new task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead) return;
    
    createTaskMutation.mutate({
      title: taskFormData.title,
      description: taskFormData.description,
      dueDate: taskFormData.dueDate,
      priority: taskFormData.priority,
      assignedTo: taskFormData.assignedTo,
      leadId: currentLead.id,
    });
  };

  // Handle delete lead action
  const handleDeleteLead = (id: number) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate(id);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      company: "",
      source: "manual",
      status: "new",
      priority: "medium",
      value: "0",
      tags: "",
      notes: "",
    });
  };

  // Filter leads based on status and search query
  const filteredLeads = leads.filter((lead) => {
    // Filter by status
    if (filterStatus !== "all" && lead.status !== filterStatus) {
      return false;
    }
    
    // Filter by search query (case insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (lead.name && lead.name.toLowerCase().includes(query)) ||
        (lead.email && lead.email.toLowerCase().includes(query)) ||
        (lead.company && lead.company.toLowerCase().includes(query)) ||
        (lead.notes && lead.notes.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Get counts for each status
  const statusCounts = {
    all: leads.length,
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    qualified: leads.filter((lead) => lead.status === "qualified").length,
    negotiation: leads.filter((lead) => lead.status === "negotiation").length,
    won: leads.filter((lead) => lead.status === "won").length,
    lost: leads.filter((lead) => lead.status === "lost").length,
  };

  // Get status color for badges
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "contacted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "qualified":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "negotiation":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "won":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Get priority color for badges
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Format currency for display
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-destructive text-xl">Failed to load leads data.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-muted-foreground">
            Manage and track your sales leads
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => processLeadsMutation.mutate()}
            disabled={processLeadsMutation.isPending}
          >
            {processLeadsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Process Leads
              </>
            )}
          </Button>
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter the details of your new sales lead.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLead}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select
                        name="source"
                        value={formData.source}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, source: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        name="status"
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        name="priority"
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Value ($)</Label>
                      <Input
                        id="value"
                        name="value"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.value}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="e.g. important, follow-up, new-client"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add any additional notes or details about this lead..."
                      className="h-20"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center">
              <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
              <Label className="mr-2">Status:</Label>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                  <SelectItem value="new">New ({statusCounts.new})</SelectItem>
                  <SelectItem value="contacted">Contacted ({statusCounts.contacted})</SelectItem>
                  <SelectItem value="qualified">Qualified ({statusCounts.qualified})</SelectItem>
                  <SelectItem value="negotiation">Negotiation ({statusCounts.negotiation})</SelectItem>
                  <SelectItem value="won">Won ({statusCounts.won})</SelectItem>
                  <SelectItem value="lost">Lost ({statusCounts.lost})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="overflow-hidden w-full">
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Total: {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              {leads.length === 0 ? (
                <>
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No leads found</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any leads yet. Add your first lead to get started.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsAddLeadOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead
                  </Button>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No matching leads</h3>
                  <p className="text-muted-foreground mt-2">
                    Try adjusting your filters or search query.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setFilterStatus("all");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="w-full min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead style={{width: "30%"}}>Lead</TableHead>
                    <TableHead style={{width: "10%"}}>Status</TableHead>
                    <TableHead style={{width: "10%"}}>Priority</TableHead>
                    <TableHead style={{width: "15%"}}>Source</TableHead>
                    <TableHead style={{width: "10%"}}>Value</TableHead>
                    <TableHead style={{width: "15%"}}>Created</TableHead>
                    <TableHead style={{width: "10%"}} className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <Link to={`/leads/${lead.id}`} className="group flex items-center gap-1 text-foreground hover:text-primary">
                            <span className="font-medium group-hover:underline">{lead.name}</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <span className="text-muted-foreground text-sm">
                            {lead.email}
                          </span>
                          {lead.company && (
                            <span className="text-muted-foreground text-sm flex items-center mt-1">
                              <Building className="h-3 w-3 mr-1" />
                              {lead.company}
                            </span>
                          )}
                          {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lead.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {tag}
                                </span>
                              ))}
                              {lead.tags.length > 2 && (
                                <span 
                                  className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  +{lead.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(lead.status)}
                          variant="outline"
                        >
                          {lead.status || "New"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPriorityColor(lead.priority)}
                          variant="outline"
                        >
                          {lead.priority || "Medium"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {!lead.source || lead.source === "manual" ? (
                            <Tag className="h-4 w-4 mr-1" />
                          ) : lead.source === "email" ? (
                            <Mail className="h-4 w-4 mr-1" />
                          ) : lead.source === "website" ? (
                            <Globe className="h-4 w-4 mr-1" />
                          ) : lead.source === "referral" ? (
                            <User className="h-4 w-4 mr-1" />
                          ) : (
                            <Tag className="h-4 w-4 mr-1" />
                          )}
                          <span className="capitalize">{lead.source || "manual"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(lead.value)}
                      </TableCell>
                      <TableCell>
                        {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLead(lead);
                              }}
                            >
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddTask(lead);
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Add Task
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLead(lead.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the details of this lead.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateLead}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-source">Source</Label>
                  <Select
                    name="source"
                    value={formData.source}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, source: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    name="status"
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-value">Value ($)</Label>
                  <Input
                    id="edit-value"
                    name="value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                <Input
                  id="edit-tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g. important, follow-up, new-client"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes or details about this lead..."
                  className="h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={updateLeadMutation.isPending}
              >
                {updateLeadMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lead Detail View Dialog */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {currentLead?.name}
              {currentLead?.priority && (
                <Badge className={getPriorityColor(currentLead.priority)} variant="outline">
                  {currentLead.priority}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-1" /> {currentLead?.email}
              </div>
              {currentLead?.company && (
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Building className="h-4 w-4 mr-1" /> {currentLead.company}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {currentLead && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className={getStatusColor(currentLead.status)} variant="outline">
                    {currentLead.status || "New"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Source</h4>
                  <div className="flex items-center">
                    {!currentLead.source || currentLead.source === "manual" ? (
                      <Tag className="h-4 w-4 mr-1" />
                    ) : currentLead.source === "email" ? (
                      <Mail className="h-4 w-4 mr-1" />
                    ) : currentLead.source === "website" ? (
                      <Globe className="h-4 w-4 mr-1" />
                    ) : currentLead.source === "referral" ? (
                      <User className="h-4 w-4 mr-1" />
                    ) : (
                      <Tag className="h-4 w-4 mr-1" />
                    )}
                    <span className="capitalize">{currentLead.source || "manual"}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Value</h4>
                  <p className="text-lg font-semibold">{formatCurrency(currentLead.value)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Tags</h3>
                {currentLead.tags && Array.isArray(currentLead.tags) && currentLead.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentLead.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No tags added</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                {currentLead.notes ? (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md whitespace-pre-wrap">
                    {currentLead.notes}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No notes added</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Associated Tasks</h3>
                <div className="flex">
                  <Button 
                    onClick={(e) => {
                      handleAddTask(currentLead);
                      setIsDetailViewOpen(false);
                    }}
                    className="ml-auto"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </div>
                
                {/* Tasks linked to this lead would be displayed here */}
                <TasksList leadId={currentLead.id} />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Associated Invoices</h3>
                {/* Invoices linked to this lead would be displayed here */}
                <InvoicesList leadId={currentLead.id} />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Created: {currentLead.createdAt ? format(new Date(currentLead.createdAt), "PPP") : "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {currentLead.updatedAt ? format(new Date(currentLead.updatedAt), "PPP") : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button 
              variant="outline"
              onClick={() => {
                if (!currentLead) return;
                handleEditLead(currentLead);
                setIsDetailViewOpen(false);
              }}
            >
              <PencilLine className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Task for Lead</DialogTitle>
            <DialogDescription>
              Create a task associated with {currentLead?.name || "this lead"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  name="title"
                  value={taskFormData.title}
                  onChange={handleTaskInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  name="description"
                  value={taskFormData.description}
                  onChange={handleTaskInputChange}
                  placeholder="Enter details about this task..."
                  className="h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-due-date">Due Date</Label>
                  <Input
                    id="task-due-date"
                    name="dueDate"
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={handleTaskInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    name="priority"
                    value={taskFormData.priority}
                    onValueChange={(value) =>
                      setTaskFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assigned-to">Assigned To</Label>
                <Select
                  name="assignedTo"
                  value={taskFormData.assignedTo}
                  onValueChange={(value) =>
                    setTaskFormData((prev) => ({ ...prev, assignedTo: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Who will handle this task?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Me</SelectItem>
                    <SelectItem value="binate_ai">Binate AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </Layout>
  );
}