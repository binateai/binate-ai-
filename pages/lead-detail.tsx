import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building, Mail, Tag, Globe, User, PencilLine, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/layout";
import { Lead } from "@shared/schema";
import LeadTasks from "@/components/leads/lead-tasks";
import LeadInvoices from "@/components/leads/lead-invoices";
import { Link } from "wouter";

interface LeadDetailProps {
  id: string;
}

export default function LeadDetail({ id }: LeadDetailProps) {
  const { toast } = useToast();
  const leadId = parseInt(id);
  
  // Fetch lead details
  const { data: lead, isLoading, isError } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/leads/${leadId}`);
      return response.json();
    },
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  // Helper functions
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "contacted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      case "qualified":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100";
      case "negotiation":
        return "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100";
      case "closed":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "lost":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold mb-2">Lead Not Found</h2>
          <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/leads">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link to="/leads">
              <Button variant="ghost" size="sm" className="mr-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            {lead.priority && (
              <Badge className={`ml-3 ${getPriorityColor(lead.priority)}`} variant="outline">
                {lead.priority}
              </Badge>
            )}
          </div>
          <Link to={`/leads/edit/${lead.id}`}>
            <Button variant="outline" size="sm">
              <PencilLine className="h-4 w-4 mr-2" />
              Edit Lead
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <div className="flex items-center text-lg">
                  <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
                {lead.company && (
                  <div className="flex items-center text-lg">
                    <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>{lead.company}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-muted-foreground">Status</h4>
                    <Badge className={`${getStatusColor(lead.status)}`} variant="outline">
                      {lead.status || "New"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-muted-foreground">Source</h4>
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
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-muted-foreground">Value</h4>
                    <p className="text-lg font-semibold">{formatCurrency(lead.value)}</p>
                  </div>
                </div>
                
                {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
                  <div className="pt-4">
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {lead.notes && (
                  <div className="pt-4">
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Notes</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md whitespace-pre-wrap">
                      {lead.notes}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t mt-4">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Created: {lead.createdAt ? format(new Date(lead.createdAt), "PPP") : "N/A"}
                    </div>
                    <div>
                      Last updated: {lead.updatedAt ? format(new Date(lead.updatedAt), "PPP") : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 space-y-6">
            {/* We'll add a summary card here later */}
            <div className="bg-card border rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Lead Activity</h3>
              <div className="flex flex-col text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Created</span>
                  <span>{lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status</span>
                  <Badge variant="outline">{lead.status || "New"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority Level</span>
                  <Badge variant="outline">{lead.priority || "Medium"}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Use our new specialized components */}
          <LeadTasks leadId={lead.id} />
          <LeadInvoices leadId={lead.id} />
        </div>
      </div>
    </Layout>
  );
}