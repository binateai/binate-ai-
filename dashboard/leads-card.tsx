import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  MessagesSquare, 
  CheckCircle, 
  PieChart, 
  BadgeAlert, 
  BadgeCheck,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@shared/schema";

interface LeadsCardProps {
  leads: Lead[];
}

export default function LeadsCard({ leads }: LeadsCardProps) {

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Leads Management
          </CardTitle>
          <CardDescription>No leads in your pipeline yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Start tracking potential customers by adding your first lead
          </p>
          <Link href="/leads">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Your First Lead
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Calculate lead stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === "new").length;
  const contactedLeads = leads.filter(lead => lead.status === "contacted").length;
  const qualifiedLeads = leads.filter(lead => lead.status === "qualified").length;
  const inNegotiation = leads.filter(lead => lead.status === "negotiation").length;
  const wonLeads = leads.filter(lead => lead.status === "won").length;
  const lostLeads = leads.filter(lead => lead.status === "lost").length;

  // Calculate high priority leads
  const highPriorityLeads = leads.filter(lead => lead.priority === "high");
  
  // Calculate total potential value
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Leads Pipeline
          </div>
          <Badge variant="outline" className="ml-auto">
            {totalLeads} Total
          </Badge>
        </CardTitle>
        <CardDescription>
          Track your sales funnel
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Lead Pipeline Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <div className="flex items-center text-blue-600 dark:text-blue-400 mb-1">
                <UserPlus className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">New</span>
              </div>
              <p className="text-lg font-semibold">{newLeads}</p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
              <div className="flex items-center text-yellow-600 dark:text-yellow-400 mb-1">
                <MessagesSquare className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Contacted</span>
              </div>
              <p className="text-lg font-semibold">{contactedLeads}</p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
              <div className="flex items-center text-purple-600 dark:text-purple-400 mb-1">
                <BadgeCheck className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Qualified</span>
              </div>
              <p className="text-lg font-semibold">{qualifiedLeads}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
              <div className="flex items-center text-orange-600 dark:text-orange-400 mb-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Negotiating</span>
              </div>
              <p className="text-lg font-semibold">{inNegotiation}</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <div className="flex items-center text-green-600 dark:text-green-400 mb-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Won</span>
              </div>
              <p className="text-lg font-semibold">{wonLeads}</p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              <div className="flex items-center text-red-600 dark:text-red-400 mb-1">
                <BadgeAlert className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Lost</span>
              </div>
              <p className="text-lg font-semibold">{lostLeads}</p>
            </div>
          </div>
          
          {/* Pipeline Value */}
          <div className="border p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-primary mb-1">
                <PieChart className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Pipeline Value</span>
              </div>
              <p className="text-lg font-semibold">{formatCurrency(totalValue)}</p>
            </div>
          </div>
          
          {/* High Priority Leads */}
          {highPriorityLeads.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">High Priority Leads</h4>
              <div className="space-y-2">
                {highPriorityLeads.slice(0, 2).map(lead => (
                  <Link to={`/leads/${lead.id}`} key={lead.id} className="block hover:no-underline">
                    <div className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company || "No company"}</p>
                      </div>
                      <Badge 
                        className={`
                          ${lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
                          ${lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                          ${lead.status === 'qualified' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : ''}
                          ${lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : ''}
                          ${lead.status === 'won' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
                          ${lead.status === 'lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : ''}
                        `}
                        variant="outline"
                      >
                        {lead.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
              {highPriorityLeads.length > 2 && (
                <p className="text-xs text-muted-foreground mt-2">
                  + {highPriorityLeads.length - 2} more high priority leads
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link to="/leads" className="w-full">
          <Button 
            variant="outline" 
            className="w-full"
          >
            View All Leads
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}