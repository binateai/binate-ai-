import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Route, Switch, useParams } from "wouter";
import { initializeRouteHandling } from "./utils/route-handler";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import Dashboard from "@/pages/dashboard";
import Emails from "@/pages/emails";
import AppRedirect from "@/components/app-redirect";
import Calendar from "@/pages/calendar";
import Tasks from "@/pages/tasks";
import Leads from "@/pages/leads";
import LeadDetail from "@/pages/lead-detail";
import Invoices from "@/pages/invoices";
import Expenses from "@/pages/expenses";
import Settings from "@/pages/settings";
import EmailIntegration from "@/pages/EmailIntegration";
import ActivitySummary from "@/pages/ActivitySummary";
import MicrosoftAuthPage from "@/pages/MicrosoftAuthPage";
import GoogleTest from "@/pages/google-test";
import DomainDiagnostic from "@/pages/domain-diagnostic";
import OAuthStatus from "@/pages/oauth-status";
import DbStatus from "@/pages/db-status";
import DomainSync from "@/pages/domain-sync";
import HostConfig from "@/pages/host-config";
import AuthStatus from "@/pages/auth-status";
import LandingPage from "@/pages/landing-page";
import BetaSignups from "@/pages/admin/beta-signups";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrentUserProvider } from "./hooks/use-current-user";
import { ServiceConnectionHandler } from "@/components/service-connection-handler";

// Structure:
// 1. QueryClientProvider (for React Query)
// 2. ThemeProvider (for dark/light mode)
// 3. TooltipProvider (for UI tooltips)
// 4. CurrentUserProvider (for user data)
// 5. Routing

// Component to handle lead detail route parameters
const LeadDetailRoute = () => {
  const params = useParams();
  return <LeadDetail id={params.id || ''} />;
};

// Define routes
const AppRoutes = () => (
  <Switch>
    {/* Public routes */}
    <Route path="/" component={LandingPage} />
    <Route path="/auth" component={AuthPage} />
    
    {/* App routes */}
    <Route path="/app" component={AppRedirect} />
    <ProtectedRoute path="/app/dashboard" component={Dashboard} />
    <ProtectedRoute path="/app/emails" component={Emails} />
    <ProtectedRoute path="/app/calendar" component={Calendar} />
    <ProtectedRoute path="/app/tasks" component={Tasks} />
    <ProtectedRoute path="/app/leads" component={Leads} />
    <ProtectedRoute path="/app/leads/:id" component={LeadDetailRoute} />
    <ProtectedRoute path="/app/invoices" component={Invoices} />
    <ProtectedRoute path="/app/expenses" component={Expenses} />
    <ProtectedRoute path="/app/activity" component={ActivitySummary} />
    <ProtectedRoute path="/app/settings" component={Settings} />
    <ProtectedRoute path="/app/settings/email" component={EmailIntegration} />
    <ProtectedRoute path="/app/microsoft-auth" component={MicrosoftAuthPage} />
    <ProtectedRoute path="/app/auth/microsoft/direct-auth" component={MicrosoftAuthPage} />
    <ProtectedRoute path="/api/auth/microsoft/direct-auth" component={MicrosoftAuthPage} />
    <ProtectedRoute path="/app/ai-assistant" component={Dashboard} />
    
    {/* Admin routes */}
    <ProtectedRoute path="/app/admin/beta-signups" component={BetaSignups} />
    
    {/* Public marketing routes */}
    
    {/* Diagnostic routes (kept for development) */}
    <Route path="/google-test" component={GoogleTest} />
    <Route path="/domain-diagnostic" component={DomainDiagnostic} />
    <Route path="/oauth-status" component={OAuthStatus} />
    <Route path="/db-status" component={DbStatus} />
    <Route path="/domain-sync" component={DomainSync} />
    <Route path="/host-config" component={HostConfig} />
    <Route path="/auth-status" component={AuthStatus} />
    
    <Route component={NotFound} />
  </Switch>
);

// Initialize route handling for SPA on binateai.com
// This helps fix blank pages in production
initializeRouteHandling();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CurrentUserProvider>
            <Toaster />
            <ServiceConnectionHandler />
            <AppRoutes />
          </CurrentUserProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);