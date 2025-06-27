import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Zap, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface SlackSettingsProps {
  connected?: boolean;
  username?: string;
}

export default function SlackSettings({ connected, username }: SlackSettingsProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleConnectSlack = () => {
    // Navigate to Slack authorization page or connection flow
    window.open('/api/connect-service/slack', '_self');
    
    toast({
      title: "Connecting to Slack",
      description: "Please complete the authentication process"
    });
  };
  
  const handleDisconnectSlack = async () => {
    try {
      const response = await fetch('/api/disconnect-service/slack', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Service disconnected",
          description: "Successfully disconnected from Slack"
        });
        
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error("Error disconnecting from Slack:", error);
      toast({
        title: "Disconnection failed",
        description: "Failed to disconnect from Slack. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24">
              <path 
                fill="currentColor" 
                d="M6 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0-10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-10 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-base font-semibold">Slack</h3>
            <p className="text-sm text-muted-foreground">
              Manage client notification preferences and integration settings.
            </p>
            {connected && (
              <div className="mt-1 flex items-center">
                <span className="text-xs inline-flex items-center font-medium rounded-full bg-green-100 text-green-800 px-2 py-0.5">
                  <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-500"></span>
                  Connected
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {username || "Slack Workspace"}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          {connected ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
              onClick={handleDisconnectSlack}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center"
              onClick={handleConnectSlack}
            >
              <Zap className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}