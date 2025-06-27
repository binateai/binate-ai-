import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatsCard from "@/components/dashboard/stats-card";
import WelcomeSection from "@/components/dashboard/welcome-section";
import EmailCard from "@/components/dashboard/email-card";
import TaskCard from "@/components/dashboard/task-card";
import CalendarCard from "@/components/dashboard/calendar-card";
import AiChat from "@/components/dashboard/ai-chat";
import InvoiceCard from "@/components/dashboard/invoice-card";
import LeadsCard from "@/components/dashboard/leads-card";
import { Loader2, MessageSquare } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [_, navigate] = useLocation();
  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 60000, // Refresh every minute
  });
  
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks"],
  });
  
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/events"],
  });
  
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/invoices"],
  });
  
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ["/api/leads"],
  });
  
  const isLoading = isLoadingUser || isLoadingStats || isLoadingTasks || isLoadingEvents || isLoadingInvoices || isLoadingLeads;
  
  return (
    <Layout>
      {/* Quick Access Banner - DEVELOPMENT ONLY */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex flex-col">
          <div className="font-medium mb-2">🔧 Development Quick Access</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <a 
              href="/google-test" 
              className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-2 rounded text-center text-sm font-medium transition-colors"
            >
              Google OAuth Test
            </a>
            <a 
              href="/settings" 
              className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-2 rounded text-center text-sm font-medium transition-colors"
            >
              Settings Page
            </a>
            <a 
              href="/auth" 
              className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-2 rounded text-center text-sm font-medium transition-colors"
            >
              Auth Page
            </a>
            <a 
              href="/" 
              className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-2 rounded text-center text-sm font-medium transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Welcome Section */}
          <WelcomeSection user={user} />
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard 
              title="Unread Emails" 
              value={stats?.unreadEmails || 0} 
              icon="email" 
              color="blue"
              action="View all"
              actionLink="/emails"
            />
            <StatsCard 
              title="Upcoming Meetings" 
              value={(stats?.todayMeetings || 0) + (stats?.upcomingMeetings || 0)} 
              icon="event" 
              color="green"
              action="View calendar"
              actionLink="/app/calendar"
            />
            <StatsCard 
              title="Pending Tasks" 
              value={stats?.pendingTasks || 0} 
              icon="task" 
              color="amber"
              action="View tasks"
              actionLink="/app/tasks"
            />
            <StatsCard 
              title="Unpaid Invoices" 
              value={stats?.unpaidInvoices || 0} 
              icon="receipt" 
              color="purple"
              isMonetary={true}
              action="Generate invoice"
              actionLink="/app/invoices"
            />
          </div>
          
          {/* Slack Integration Access */}
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              onClick={() => navigate("/app/settings/slack")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Slack Integration Settings
            </Button>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Email & Tasks */}
            <div className="lg:col-span-2 space-y-6">
              <EmailCard />
              <TaskCard tasks={tasks || []} />
              <LeadsCard leads={leads || []} />
            </div>
            
            {/* Right Column - Calendar & Assistant Features */}
            <div className="space-y-6">
              <CalendarCard events={events || []} />
              <AiChat />
              <InvoiceCard invoices={invoices || []} />
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
