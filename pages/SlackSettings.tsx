import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  BadgeCheck, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  Info, 
  Calendar, 
  Clock8,
  Bell 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define TypeScript interfaces for better type checking
interface SlackIntegration {
  connected: boolean;
  workspace?: string;
  channel?: string;
  clientName?: string;
  availableChannels?: Array<{id: string; name: string}>;
}

interface Client {
  id: number;
  name: string;
}

const SlackSettings = () => {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Fetch client list for the dropdown
  const { data: clients } = useQuery<any, Error, Client[]>({
    queryKey: ['/api/clients'],
    select: (data) => data || []
  });

  // Fetch current Slack connection status
  const { data: slackStatus, refetch: refetchSlackStatus, isError } = useQuery<any, Error, SlackIntegration>({
    queryKey: ['/api/integrations/slack/status'],
    select: (data) => data || { connected: false },
    // Prevent requests from failing in preview environment
    retry: (failureCount, error) => {
      const isPreviewEnv = window.location.hostname.includes('.replit.dev') || 
                         window.location.hostname.includes('.repl.co');
      if (isPreviewEnv && failureCount >= 1) {
        console.log("Preview environment detected, not retrying failed Slack status request");
        return false;
      }
      return failureCount < 3;
    },
    // Add fallback data for preview environment or when API fails
    onError: () => {
      const isPreviewEnv = window.location.hostname.includes('.replit.dev') || 
                         window.location.hostname.includes('.repl.co');
      if (isPreviewEnv) {
        console.log("Preview environment detected, using mock Slack status data");
        return {
          connected: false,
          workspace: "Preview Workspace",
          channel: "general"
        };
      }
    }
  });

  // Handle connecting to Slack
  const handleConnectSlack = async () => {
    setIsConnecting(true);
    try {
      // Check if we're in a preview environment
      const isPreviewEnvironment = 
        window.location.hostname.includes('.replit.dev') || 
        window.location.hostname.includes('.repl.co');
      
      if (isPreviewEnvironment) {
        // In preview environment, simulate successful connection
        console.log('Preview environment detected, simulating Slack connection');
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the UI directly
        toast({
          title: "Connected (Preview Mode)",
          description: "Successfully connected to Slack in preview mode",
        });
        
        // Force refresh the status
        refetchSlackStatus();
        setIsConnecting(false);
        return;
      }
      
      // Production flow - actual API call
      const response = await fetch('/api/integrations/slack/authorize', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate auth URL: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.url) {
        // Open the Slack OAuth URL in a new window
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to generate Slack authentication URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Slack connection error:", error);
      toast({
        title: "Connection Failed",
        description: "We couldn't connect to Slack. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle disconnecting from Slack
  const handleDisconnectSlack = async () => {
    try {
      // Check if we're in a preview environment
      const isPreviewEnvironment = 
        window.location.hostname.includes('.replit.dev') || 
        window.location.hostname.includes('.repl.co');
      
      if (isPreviewEnvironment) {
        // In preview environment, simulate successful disconnection
        console.log('Preview environment detected, simulating Slack disconnection');
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success message
        toast({
          title: "Disconnected (Preview Mode)",
          description: "Successfully disconnected from Slack in preview mode",
        });
        
        // Force refresh the status
        refetchSlackStatus();
        return;
      }
      
      // Production flow - actual API call
      const response = await fetch('/api/integrations/slack/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient === 'all' ? null : selectedClient
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to disconnect: ${response.status}`);
      }
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Slack",
      });
      
      refetchSlackStatus();
    } catch (error) {
      console.error("Slack disconnection error:", error);
      toast({
        title: "Disconnection Failed",
        description: "We couldn't disconnect from Slack. Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto">
      <div className="space-y-6 p-6 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Slack Integration</h2>
          <p className="text-muted-foreground">
            Connect Binate AI to your Slack workspace to receive structured notifications
          </p>
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Connection Card */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Slack Connection Status</CardTitle>
                  <CardDescription>Connect to your Slack workspace</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24">
                    <path 
                      fill="currentColor" 
                      d="M6 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0-10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-10 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {slackStatus?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-600">
                    <BadgeCheck className="w-5 h-5" />
                    <span className="font-medium">Connected to Slack</span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Workspace:</span>
                      <span className="text-sm">{slackStatus.workspace || 'Default Workspace'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Channel:</span>
                      <span className="text-sm">#{slackStatus.channel || 'general'}</span>
                    </div>
                    {slackStatus.clientName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Client:</span>
                        <span className="text-sm">{slackStatus.clientName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Not connected to Slack</span>
                  </div>
                  
                  <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Why connect to Slack?</AlertTitle>
                    <AlertDescription>
                      Receive structured, 3× daily digests with task summaries, client updates, and important notifications directly in your Slack workspace.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between bg-slate-50 rounded-b-lg border-t p-4">
              {clients && clients.length > 0 && (
                <Select 
                  value={selectedClient} 
                  onValueChange={(value) => setSelectedClient(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients (Organization)</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {slackStatus?.connected ? (
                <Button 
                  variant="outline" 
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                  onClick={handleDisconnectSlack}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  onClick={handleConnectSlack} 
                  disabled={isConnecting}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {isConnecting ? "Connecting..." : "Connect to Slack"}
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Notification Schedule Card */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Schedule</CardTitle>
              <CardDescription>Configure when you receive Slack notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3 rounded-md border p-3">
                  <Clock8 className="h-5 w-5 text-slate-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Daily Digests</p>
                    <p className="text-xs text-muted-foreground">
                      Receive a summary of tasks, emails, and updates three times a day
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      7 AM
                    </div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      12 PM
                    </div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      5 PM
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 rounded-md border p-3">
                  <Bell className="h-5 w-5 text-slate-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Real-time Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Get instant alerts for high-priority items and urgent tasks
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                      Urgent
                    </div>
                    <div className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
                      Due Soon
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Future customization settings */}
              <div className="pt-2 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="enable-daily">Notification Preferences (Coming Soon)</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="enable-daily" disabled defaultChecked />
                    <label 
                      htmlFor="enable-daily" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enable daily digests
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="enable-urgent" disabled defaultChecked />
                  <label 
                    htmlFor="enable-urgent" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Enable urgent notifications
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SlackSettings;