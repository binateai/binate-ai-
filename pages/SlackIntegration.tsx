import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SiSlack } from 'react-icons/si';
import { Loader2, AlertCircle, Check, X, Clock } from 'lucide-react';

// Interface for Slack integration data
interface SlackIntegration {
  id: number;
  clientId: number | null;
  clientName: string | null;
  teamName: string | null;
  channelCount: number;
  isDefault: boolean;
  isConnected: boolean;
}

// Interface for Slack status
interface SlackStatus {
  success: boolean;
  integrations: SlackIntegration[];
  hasSystemIntegration: boolean;
}

// Client interface
interface Client {
  id: number;
  name: string;
  hasSlackIntegration: boolean;
}

const SlackIntegration: React.FC = () => {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Fetch Slack integration status
  const { 
    data: slackStatus, 
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus
  } = useQuery<SlackStatus>({ 
    queryKey: ['/api/slack-test/status'],
    retry: 1,
  });
  
  // Fetch clients
  const {
    data: clientsData,
    isLoading: isLoadingClients,
  } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    retry: 1
  });
  
  // Set selected client when data is loaded
  useEffect(() => {
    if (clientsData && clientsData.length > 0 && !selectedClient) {
      setSelectedClient(clientsData[0].id);
    }
  }, [clientsData, selectedClient]);
  
  // Set up clients when data is loaded
  useEffect(() => {
    if (clientsData) {
      // Map integration data to clients
      const clientsWithStatus = clientsData.map(client => {
        const hasIntegration = slackStatus?.integrations.some(
          integration => integration.clientId === client.id
        ) || false;
        
        return {
          ...client,
          hasSlackIntegration: hasIntegration
        };
      });
      
      setClients(clientsWithStatus);
    }
  }, [clientsData, slackStatus]);
  
  // Send test message mutation
  const sendTestMessage = useMutation({
    mutationFn: (data: { clientId: number | null, message: string }) => {
      return apiRequest('POST', '/api/slack-test/send-client-message', data);
    },
    onSuccess: () => {
      toast({
        title: 'Test message sent',
        description: 'A test notification has been sent to Slack',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send test message',
        description: String(error),
        variant: 'destructive',
      });
    }
  });
  
  // Set default integration mutation
  const setDefaultIntegration = useMutation({
    mutationFn: (integrationId: number) => {
      return apiRequest('POST', '/api/slack-test/set-default-integration', { integrationId });
    },
    onSuccess: () => {
      toast({
        title: 'Default integration updated',
        description: 'The default Slack integration has been set',
      });
      refetchStatus();
    },
    onError: (error) => {
      toast({
        title: 'Failed to set default integration',
        description: String(error),
        variant: 'destructive',
      });
    }
  });
  
  // Send test digest mutation
  const sendTestDigest = useMutation({
    mutationFn: (clientId: number | null) => {
      return apiRequest('POST', '/api/slack-test/send-digest', { clientId });
    },
    onSuccess: () => {
      toast({
        title: 'Test digest sent',
        description: 'A test digest has been sent to Slack',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send test digest',
        description: String(error),
        variant: 'destructive',
      });
    }
  });
  
  // Handle connect to Slack
  const handleConnectSlack = (clientId: number | null) => {
    // Redirect to Slack OAuth page with client ID
    const clientParam = clientId ? `&client_id=${clientId}` : '';
    window.location.href = `/api/integrations/slack/start${clientParam}`;
  };
  
  // Get integration for selected client
  const getClientIntegration = (clientId: number | null) => {
    if (!slackStatus) return null;
    
    return slackStatus.integrations.find(
      integration => integration.clientId === clientId
    );
  };
  
  // Get integration status text and color
  const getIntegrationStatus = (integration: SlackIntegration | null | undefined) => {
    if (!integration) {
      return { text: 'Not Connected', color: 'bg-red-100 text-red-800', icon: <X className="h-4 w-4" /> };
    }
    
    if (integration.isConnected) {
      return { text: 'Connected', color: 'bg-green-100 text-green-800', icon: <Check className="h-4 w-4" /> };
    }
    
    return { text: 'Connection Error', color: 'bg-amber-100 text-amber-800', icon: <AlertCircle className="h-4 w-4" /> };
  };
  
  // Handle send test message
  const handleSendTestMessage = (clientId: number | null) => {
    sendTestMessage.mutate({ 
      clientId, 
      message: `Test message from Binate AI at ${new Date().toLocaleTimeString()}`
    });
  };
  
  // Handle set as default
  const handleSetAsDefault = (integrationId: number) => {
    setDefaultIntegration.mutate(integrationId);
  };
  
  // Handle send test digest
  const handleSendTestDigest = (clientId: number | null) => {
    sendTestDigest.mutate(clientId);
  };
  
  // Loading state
  if (isLoadingStatus || isLoadingClients) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        <p className="mt-4 text-lg text-gray-600">Loading Slack integrations...</p>
      </div>
    );
  }
  
  // Error state
  if (statusError) {
    return (
      <Alert variant="destructive" className="mx-auto my-8 max-w-3xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading Slack integrations</AlertTitle>
        <AlertDescription>
          {String(statusError)}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <SiSlack className="h-8 w-8 text-[#4A154B] mr-3" />
        <div>
          <h1 className="text-2xl font-bold">Slack Integrations</h1>
          <p className="text-gray-500">Connect and manage Slack workspaces for your clients</p>
        </div>
      </div>
      
      <Tabs defaultValue="clients" className="mb-8">
        <TabsList>
          <TabsTrigger value="clients">Client Workspaces</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>
        
        {/* Client workspaces tab */}
        <TabsContent value="clients">
          {clients.length === 0 ? (
            <Alert className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No clients found</AlertTitle>
              <AlertDescription>
                Add clients to your account to connect their Slack workspaces.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {clients.map(client => {
                  const integration = getClientIntegration(client.id);
                  const status = getIntegrationStatus(integration);
                  
                  return (
                    <Card 
                      key={client.id} 
                      className={`cursor-pointer transition-shadow hover:shadow-md ${
                        selectedClient === client.id ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      onClick={() => setSelectedClient(client.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{client.name}</CardTitle>
                          <Badge variant="outline" className={`${status.color} flex items-center gap-1`}>
                            {status.icon}
                            {status.text}
                          </Badge>
                        </div>
                        <CardDescription>
                          {integration ? (
                            <>Workspace: {integration.teamName || 'Unknown'}</>
                          ) : (
                            <>No Slack workspace connected</>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        {integration ? (
                          <div className="flex items-center text-xs text-gray-500">
                            {integration.isDefault && (
                              <Badge variant="secondary" className="mr-2">Default</Badge>
                            )}
                            {integration.channelCount} {integration.channelCount === 1 ? 'channel' : 'channels'}
                          </div>
                        ) : null}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              
              {/* Selected client details */}
              {selectedClient !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {clients.find(c => c.id === selectedClient)?.name || 'Client'} Slack Configuration
                    </CardTitle>
                    <CardDescription>
                      Manage Slack integration for this client
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const integration = getClientIntegration(selectedClient);
                      const status = getIntegrationStatus(integration);
                      
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="font-semibold">Status:</span>
                            <Badge className={`${status.color} flex items-center gap-1`}>
                              {status.icon}
                              {status.text}
                            </Badge>
                          </div>
                          
                          {integration ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <span className="font-semibold block">Workspace:</span>
                                  <span>{integration.teamName || 'Unknown'}</span>
                                </div>
                                <div>
                                  <span className="font-semibold block">Connected Channels:</span>
                                  <span>{integration.channelCount || 0}</span>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <span className="font-semibold block mb-1">Default Integration:</span>
                                <div className="flex items-center">
                                  {integration.isDefault ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      This is the default integration
                                    </Badge>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleSetAsDefault(integration.id)}
                                      disabled={setDefaultIntegration.isPending}
                                    >
                                      {setDefaultIntegration.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Set as Default
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              <Separator className="my-4" />
                              
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  onClick={() => handleSendTestMessage(selectedClient)}
                                  disabled={sendTestMessage.isPending}
                                  variant="outline"
                                >
                                  {sendTestMessage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Send Test Message
                                </Button>
                                
                                <Button
                                  onClick={() => handleSendTestDigest(selectedClient)}
                                  disabled={sendTestDigest.isPending}
                                  variant="outline"
                                >
                                  {sendTestDigest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Send Test Digest
                                </Button>
                                
                                <Button
                                  onClick={() => handleConnectSlack(selectedClient)}
                                  variant="outline"
                                >
                                  Reconnect Slack
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <p className="mb-4 text-gray-600">
                                This client doesn't have Slack connected yet. Connect their workspace to enable notifications.
                              </p>
                              <Button 
                                onClick={() => handleConnectSlack(selectedClient)}
                                className="bg-[#4A154B] hover:bg-[#3b1139]"
                              >
                                <SiSlack className="mr-2 h-4 w-4" />
                                Connect to Slack
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        {/* System settings tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Slack Integration</CardTitle>
              <CardDescription>
                The system Slack integration is used as a fallback when a client doesn't have their own workspace connected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slackStatus?.hasSystemIntegration ? (
                <div>
                  <Badge className="bg-green-100 text-green-800 mb-4 flex items-center w-fit gap-1">
                    <Check className="h-4 w-4" />
                    System Integration Configured
                  </Badge>
                  
                  <p className="mb-4 text-gray-600">
                    The system Slack integration is configured and working.
                    All notifications that don't have a client-specific integration will be sent to this Slack workspace.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleSendTestMessage(null)}
                      disabled={sendTestMessage.isPending}
                      variant="outline"
                    >
                      {sendTestMessage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Test Message
                    </Button>
                    
                    <Button
                      onClick={() => handleSendTestDigest(null)}
                      disabled={sendTestDigest.isPending}
                      variant="outline"
                    >
                      {sendTestDigest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Test Digest
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Alert className="mb-4 bg-amber-100 border-amber-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No System Integration</AlertTitle>
                    <AlertDescription>
                      The system Slack integration is not configured. Please set the SLACK_BOT_TOKEN and SLACK_CHANNEL_ID environment variables.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notification Schedule</CardTitle>
              <CardDescription>
                Configure the schedule for sending digests and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Morning Digest</CardTitle>
                      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        7:00 AM
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Daily summary of upcoming tasks, meetings, and due invoices.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Midday Update</CardTitle>
                      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        12:00 PM
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Updates on new leads, upcoming meetings, and tasks due today.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Evening Summary</CardTitle>
                      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        5:00 PM
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      End-of-day summary and preview of tomorrow's schedule.
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Real-time Notifications</h3>
                <p className="text-gray-600 mb-4">
                  In addition to scheduled digests, real-time notifications are sent for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Tasks due within 30 minutes</li>
                  <li>Meetings starting in 15 minutes</li>
                  <li>High-priority tasks and flagged items</li>
                  <li>New lead opportunities</li>
                  <li>Overdue invoices</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SlackIntegration;