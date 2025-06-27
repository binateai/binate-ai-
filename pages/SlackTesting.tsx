import { useState, useEffect } from "react";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Send,
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SlackTesting() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [testMessage, setTestMessage] = useState("");
  const [hasSystemIntegration, setHasSystemIntegration] = useState(false);

  // Fetch the Slack integrations when the component mounts
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIsLoading(true);
        setStatusMessage(null);
        
        // Check if we're in a preview environment
        const isPreviewEnvironment = 
          window.location.hostname.includes('.replit.dev') || 
          window.location.hostname.includes('.repl.co');
        
        if (isPreviewEnvironment) {
          console.log('Preview environment detected, using sample Slack integration data');
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Use mock data in preview environment
          const sampleData = {
            success: true,
            integrations: [
              {
                id: 1,
                clientId: 101,
                clientName: "Demo Client 1",
                teamName: "Demo Workspace 1", 
                isDefault: true,
                channelCount: 3
              },
              {
                id: 2,
                clientId: 102,
                clientName: "Demo Client 2",
                teamName: "Demo Workspace 2",
                isDefault: false,
                channelCount: 2
              }
            ],
            hasSystemIntegration: true
          };
          
          setIntegrations(sampleData.integrations);
          setHasSystemIntegration(sampleData.hasSystemIntegration);
          
          // Set the first client as selected by default
          setSelectedClientId("101");
          setIsLoading(false);
          return;
        }
        
        // Production flow - real API call
        const response = await fetch('/api/slack-test/status', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            setIntegrations(data.integrations || []);
            setHasSystemIntegration(data.hasSystemIntegration || false);
            
            // If there are integrations, select the first one by default
            if (data.integrations && data.integrations.length > 0) {
              setSelectedClientId(data.integrations[0].clientId.toString());
            }
          } else {
            setStatusMessage({
              type: 'error',
              message: data.error || 'Failed to load Slack integrations'
            });
          }
        } else if (response.status === 401) {
          setStatusMessage({
            type: 'error',
            message: 'You need to be logged in to access this page'
          });
        } else {
          setStatusMessage({
            type: 'error',
            message: 'Failed to load Slack integrations'
          });
        }
      } catch (error) {
        console.error('Error fetching Slack integrations:', error);
        setStatusMessage({
          type: 'error',
          message: 'An error occurred while fetching Slack integrations'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIntegrations();
  }, []);

  const handleSendTestMessage = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to send",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSending(true);
      setStatusMessage(null);
      
      // Check if we're in a preview environment
      const isPreviewEnvironment = 
        window.location.hostname.includes('.replit.dev') || 
        window.location.hostname.includes('.repl.co');
      
      if (isPreviewEnvironment) {
        console.log('Preview environment detected, simulating test message send');
        console.log(`Would send message "${testMessage}" to client ID: ${selectedClientId || 'system default'}`);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success response
        setStatusMessage({
          type: 'success',
          message: 'Test message sent successfully (Preview Mode)'
        });
        
        toast({
          title: "Message sent",
          description: "Your test message was sent successfully (Preview Mode)"
        });
        
        setIsSending(false);
        return;
      }
      
      // Production flow - real API call
      const response = await fetch('/api/slack-test/send-client-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId || null,
          message: testMessage
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusMessage({
          type: 'success',
          message: data.message || 'Test message sent successfully'
        });
        toast({
          title: "Message sent",
          description: "Your test message was sent successfully"
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: data.error || 'Failed to send test message'
        });
        toast({
          title: "Message failed",
          description: data.error || "Failed to send test message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setStatusMessage({
        type: 'error',
        message: 'An error occurred while sending the test message'
      });
      toast({
        title: "Error",
        description: "An error occurred while sending the message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTestDigest = async () => {
    try {
      setIsSending(true);
      setStatusMessage(null);
      
      // Check if we're in a preview environment
      const isPreviewEnvironment = 
        window.location.hostname.includes('.replit.dev') || 
        window.location.hostname.includes('.repl.co');
      
      if (isPreviewEnvironment) {
        console.log('Preview environment detected, simulating test digest send');
        console.log(`Would send digest to client ID: ${selectedClientId || 'system default'}`);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Simulate success response
        setStatusMessage({
          type: 'success',
          message: 'Test digest sent successfully (Preview Mode)'
        });
        
        toast({
          title: "Digest sent",
          description: "Your test digest was sent successfully (Preview Mode)"
        });
        
        setIsSending(false);
        return;
      }
      
      // Production flow - real API call
      const response = await fetch('/api/slack-test/send-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId || null
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusMessage({
          type: 'success',
          message: data.message || 'Test digest sent successfully'
        });
        toast({
          title: "Digest sent",
          description: "Your test digest was sent successfully"
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: data.error || 'Failed to send test digest'
        });
        toast({
          title: "Digest failed",
          description: data.error || "Failed to send test digest",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test digest:', error);
      setStatusMessage({
        type: 'error',
        message: 'An error occurred while sending the test digest'
      });
      toast({
        title: "Error",
        description: "An error occurred while sending the digest",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSetDefaultIntegration = async (integrationId: number) => {
    try {
      setIsSending(true);
      setStatusMessage(null);
      
      // Check if we're in a preview environment
      const isPreviewEnvironment = 
        window.location.hostname.includes('.replit.dev') || 
        window.location.hostname.includes('.repl.co');
      
      if (isPreviewEnvironment) {
        console.log('Preview environment detected, simulating setting default integration');
        console.log(`Would set integration ID ${integrationId} as default`);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update the UI directly for demo purposes
        setIntegrations(prev => 
          prev.map(integration => ({
            ...integration,
            isDefault: integration.id === integrationId
          }))
        );
        
        // Show success message
        setStatusMessage({
          type: 'success',
          message: 'Default integration set successfully (Preview Mode)'
        });
        
        toast({
          title: "Default updated",
          description: "Default integration updated successfully (Preview Mode)"
        });
        
        setIsSending(false);
        return;
      }
      
      // Production flow - real API call
      const response = await fetch('/api/slack-test/set-default-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the integrations list to show the updated default
        const statusResponse = await fetch('/api/slack-test/status', {
          credentials: 'include'
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setIntegrations(statusData.integrations || []);
          }
        }
        
        setStatusMessage({
          type: 'success',
          message: data.message || 'Default integration set successfully'
        });
        toast({
          title: "Default updated",
          description: data.message || "Default integration updated successfully"
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: data.error || 'Failed to set default integration'
        });
        toast({
          title: "Update failed",
          description: data.error || "Failed to set default integration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error setting default integration:', error);
      setStatusMessage({
        type: 'error',
        message: 'An error occurred while setting the default integration'
      });
      toast({
        title: "Error",
        description: "An error occurred while updating the default",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Slack Testing</h1>
          <p className="text-muted-foreground">
            Test the multi-tenant Slack integration with your clients.
          </p>
        </div>

        {/* Status message */}
        {statusMessage && (
          <Alert variant={statusMessage.type === 'error' ? "destructive" : "default"}>
            {statusMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {statusMessage.message}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Connected Slack Integrations */}
            <Card>
              <CardHeader>
                <CardTitle>Connected Slack Workspaces</CardTitle>
                <CardDescription>
                  View all the Slack workspaces connected to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasSystemIntegration && (
                  <div className="mb-4 p-3 border rounded-md bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      System-level Slack integration is configured.
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      This will be used as a fallback when no client-specific integration is available.
                    </p>
                  </div>
                )}

                {integrations.length > 0 ? (
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div 
                        key={integration.id} 
                        className={`p-4 border rounded-md ${
                          integration.isDefault 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {integration.clientName || 'Unnamed Client'} 
                              {integration.isDefault && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Workspace: {integration.teamName || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Client ID: {integration.clientId} | {integration.channelCount} channels
                            </p>
                          </div>
                          {!integration.isDefault && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSetDefaultIntegration(integration.id)}
                              disabled={isSending}
                            >
                              Set as Default
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border rounded-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      No client-specific Slack integrations found.
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Connect clients to their Slack workspaces in the Slack Settings page.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Message */}
            <Card>
              <CardHeader>
                <CardTitle>Send Test Messages</CardTitle>
                <CardDescription>
                  Send test notifications and digests to Slack.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-select">Select Client</Label>
                    <Select
                      value={selectedClientId}
                      onValueChange={setSelectedClientId}
                      disabled={integrations.length === 0 || isSending}
                    >
                      <SelectTrigger id="client-select">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {integrations.map((integration) => (
                          <SelectItem 
                            key={integration.clientId} 
                            value={integration.clientId.toString()}
                          >
                            {integration.clientName || `Client ${integration.clientId}`}
                            {integration.isDefault ? ' (Default)' : ''}
                          </SelectItem>
                        ))}
                        <SelectItem value="system_default">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-message">Test Message</Label>
                    <Textarea
                      id="test-message"
                      placeholder="Enter your test message here..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="min-h-[100px]"
                      disabled={isSending}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleSendTestMessage}
                      disabled={isSending || !testMessage.trim()}
                      className="w-full sm:flex-1"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleSendTestDigest}
                      disabled={isSending}
                      variant="outline"
                      className="w-full sm:flex-1"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Send Digest
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}