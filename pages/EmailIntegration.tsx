import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, ExternalLink, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { SiGmail } from "react-icons/si";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EmailIntegration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    gmail: { connected: false, email: "" },
    microsoft: { connected: false, email: "" }
  });

  // Fetch email integration status
  useEffect(() => {
    const fetchEmailStatus = async () => {
      try {
        // First check for connected services (Gmail)
        const servicesResponse = await fetch('/api/connected-services', {
          credentials: 'include'
        });
        
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          
          // Update email status based on connected services
          const updatedStatus = {
            gmail: {
              connected: servicesData.google?.connected || false,
              email: servicesData.google?.email || ""
            },
            microsoft: { connected: false, email: "" }
          };
          
          setEmailStatus(updatedStatus);
          console.log("Email integration status loaded:", updatedStatus);
        }
        
        // Also try the email-integration endpoint as fallback
        const emailResponse = await fetch('/api/email-integration/status', {
          credentials: 'include'
        });
        
        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          setEmailStatus(prevStatus => ({
            ...prevStatus,
            ...emailData
          }));
        }
      } catch (error) {
        console.error('Error fetching email integration status:', error);
      }
    };
    
    // Check for query parameters that indicate a connection attempt result
    const params = new URLSearchParams(window.location.search);
    const microsoftConnected = params.get('microsoft');
    const microsoftEmail = params.get('email');
    const errorMsg = params.get('error');
    
    if (microsoftConnected === 'connected') {
      toast({
        title: "Microsoft Connected!",
        description: microsoftEmail ? `Successfully connected to ${microsoftEmail}` : "Successfully connected to Microsoft",
        duration: 5000,
      });
      
      // Clear the URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorMsg) {
      toast({
        title: "Connection Failed",
        description: decodeURIComponent(errorMsg),
        variant: "destructive",
        duration: 5000,
      });
      
      // Clear the URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    fetchEmailStatus();
  }, [toast]);

  // Connect to Gmail
  const handleGmailConnect = async () => {
    try {
      setLoading(true);
      
      // Check if Microsoft is already connected - enforce one integration policy
      if (emailStatus.microsoft.connected) {
        const confirmSwitch = window.confirm(
          "You already have Microsoft connected. Our system only allows one email integration at a time. " +
          "Connecting to Gmail will disconnect Microsoft. Continue?"
        );
        
        if (!confirmSwitch) {
          setLoading(false);
          return;
        }
        
        // Disconnect Microsoft first
        await fetch('/api/email-integration/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: 'microsoft' }),
          credentials: 'include'
        });
        
        toast({
          title: "Microsoft Disconnected",
          description: "Microsoft has been disconnected. Now connecting to Gmail...",
          duration: 3000,
        });
      }
      
      const response = await fetch('/api/auth/google/url', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Gmail auth URL received:', data.url);
        
        // Use window.location.href for better compatibility
        window.location.href = data.url;
        
        toast({
          title: "Redirecting to Gmail",
          description: "You'll be redirected to complete Gmail authentication"
        });
      } else {
        console.error('Failed to get Gmail auth URL:', response.statusText);
        toast({
          title: "Connection Error",
          description: "Failed to get Gmail authentication URL. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error connecting to Gmail:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Connect to Microsoft using a direct approach
  const handleMicrosoftConnect = async () => {
    try {
      setLoading(true);
      
      // Check if Gmail is already connected - enforce one integration policy
      if (emailStatus.gmail.connected) {
        const confirmSwitch = window.confirm(
          "You already have Gmail connected. Our system only allows one email integration at a time. " +
          "Connecting to Microsoft will disconnect Gmail. Continue?"
        );
        
        if (!confirmSwitch) {
          setLoading(false);
          return;
        }
        
        // Disconnect Gmail first
        await fetch('/api/auth/google/disconnect', {
          method: 'POST',
          credentials: 'include'
        });
        
        toast({
          title: "Gmail Disconnected",
          description: "Gmail has been disconnected. Now connecting to Microsoft...",
          duration: 3000,
        });
        
        // Update local state
        setEmailStatus(prev => ({
          ...prev,
          gmail: { connected: false, email: "" }
        }));
      }
      
      // Show toast to inform user
      toast({
        title: "Microsoft Connection",
        description: "Starting Microsoft authentication process. Please complete the sign-in when prompted.",
        duration: 5000,
      });
      
      // Direct Microsoft authentication approach
      console.log("Starting Microsoft auth process");
      
      // Prepare authentication URL with all required parameters
      const clientId = '3e9d9152-c120-4a5c-9bc4-8c6aaca4a3e9';
      const redirectUri = `${window.location.origin}/api/auth/microsoft/callback`;
      const scopes = 'offline_access User.Read Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Calendars.ReadWrite';
      
      const authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
        `?client_id=${encodeURIComponent(clientId)}` + 
        '&response_type=code' +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_mode=query' +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${Date.now()}`;  // Using timestamp as state to prevent CSRF
      
      // Redirect directly in the current window
      window.location.href = authUrl;
      console.log("Redirecting to Microsoft auth URL:", authUrl);
      
      // Set up automatic periodic status check
      let checkAttempts = 0;
      const maxAttempts = 20; // Check for about 1 minute (20 x 3s)
      const statusCheckerId = setInterval(async () => {
        try {
          checkAttempts++;
          
          // Check if Microsoft is connected
          const statusResponse = await fetch('/api/email-integration/status', {
            credentials: 'include'
          });
          
          if (statusResponse.ok) {
            const data = await statusResponse.json();
            
            // Update local state with latest status
            setEmailStatus(data);
            
            // If successfully connected, clear interval and show success message
            if (data.microsoft.connected) {
              clearInterval(statusCheckerId);
              toast({
                title: "Microsoft Connected!",
                description: `Successfully connected to ${data.microsoft.email}`,
                duration: 5000,
              });
              
              // Remove any check status buttons that might be lingering
              const existingButtons = document.querySelectorAll('.microsoft-check-button');
              existingButtons.forEach(btn => btn.remove());
            }
          }
          
          // Stop checking after maximum attempts
          if (checkAttempts >= maxAttempts) {
            clearInterval(statusCheckerId);
          }
        } catch (error) {
          console.error('Error in automatic Microsoft status check:', error);
          if (checkAttempts >= maxAttempts) {
            clearInterval(statusCheckerId);
          }
        }
      }, 3000); // Check every 3 seconds
      
      // Add manual check button as a fallback
      const checkStatusButton = document.createElement('button');
      checkStatusButton.innerHTML = 'Check Microsoft Connection Status';
      checkStatusButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'mt-4', 'microsoft-check-button');
      checkStatusButton.onclick = async () => {
        try {
          // Show toast indicating check in progress
          toast({
            title: "Checking connection...",
            description: "Verifying your Microsoft account connection and syncing emails",
            duration: 3000,
          });
          
          // First make the status check request
          const statusResponse = await fetch('/api/email-integration/status', {
            credentials: 'include'
          });
          
          if (statusResponse.ok) {
            const data = await statusResponse.json();
            
            // Update application state
            setEmailStatus(data);
            
            if (data.microsoft.connected) {
              // If connected, trigger an email sync to ensure emails are loaded
              const syncResponse = await fetch('/api/microsoft/sync-emails', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ maxResults: 100 })
              });
              
              const syncResult = await syncResponse.json();
              
              if (syncResponse.ok) {
                toast({
                  title: "Connected Successfully",
                  description: `Your Microsoft account (${data.microsoft.email}) is connected! ${syncResult.count} emails synced.`,
                  duration: 5000,
                });
              } else {
                toast({
                  title: "Connection Verified, Sync Issues",
                  description: `Your Microsoft account is connected, but we had trouble syncing emails: ${syncResult.error || 'Unknown error'}`,
                  duration: 5000,
                });
              }
            } else {
              toast({
                title: "Not Connected",
                description: "Microsoft account connection hasn't been completed. Please try the manual connection option below.",
                variant: "destructive",
                duration: 5000,
              });
            }
          }
        } catch (error) {
          console.error('Error checking connection status:', error);
          toast({
            title: "Connection Check Failed",
            description: "There was an error checking your connection status. Please try again.",
            variant: "destructive",
            duration: 5000,
          });
        }
      };
      
      // Add the button to the page
      setTimeout(() => {
        const microsoftConnectButton = document.querySelector('[data-microsoft-connect]');
        if (microsoftConnectButton && microsoftConnectButton.parentNode) {
          const buttonContainer = document.createElement('div');
          buttonContainer.classList.add('mt-4', 'text-center');
          buttonContainer.appendChild(checkStatusButton);
          microsoftConnectButton.parentNode.appendChild(buttonContainer);
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting to Microsoft:', error);
      toast({
        title: "Connection Failed",
        description: "There was an issue initiating the Microsoft connection. Please try the manual connection option below.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Email Provider
  const handleDisconnect = async (provider: 'gmail' | 'microsoft') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email-integration/disconnect/${provider}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setEmailStatus(prev => ({
          ...prev,
          [provider]: { connected: false, email: "" }
        }));
        
        toast({
          title: "Disconnected",
          description: `Successfully disconnected from ${provider === 'gmail' ? 'Gmail' : 'Microsoft'}`
        });
      }
    } catch (error) {
      console.error(`Error disconnecting from ${provider}:`, error);
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect from ${provider === 'gmail' ? 'Gmail' : 'Microsoft'}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/app/settings")} 
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Email Integration</h1>
            <p className="text-muted-foreground">
              Configure email providers for notifications and digests.
            </p>
          </div>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Email Notification Schedule</AlertTitle>
          <AlertDescription>
            Digests are delivered three times daily at 7am, 12pm, and 5pm. Each digest contains relevant information for that time of day.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="providers">Email Providers</TabsTrigger>
            <TabsTrigger value="settings">Notification Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Email Service Providers</CardTitle>
                <CardDescription>
                  Connect to email providers for sending and receiving notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gmail Integration */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <SiGmail className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-semibold">Gmail</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect to Gmail for email notifications.
                        </p>
                        {emailStatus.gmail.connected && (
                          <div className="mt-1 flex items-center">
                            <span className="text-xs inline-flex items-center font-medium rounded-full bg-green-100 text-green-800 px-2 py-0.5">
                              <Check className="w-3 h-3 mr-1" />
                              Connected
                            </span>
                            {emailStatus.gmail.email && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {emailStatus.gmail.email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {emailStatus.gmail.connected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                          onClick={() => handleDisconnect('gmail')}
                          disabled={loading}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleGmailConnect}
                          disabled={loading}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Microsoft Integration */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-semibold">Microsoft</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect to Microsoft Outlook for email notifications.
                        </p>
                        {emailStatus.microsoft.connected && (
                          <div className="mt-1 flex items-center">
                            <span className="text-xs inline-flex items-center font-medium rounded-full bg-green-100 text-green-800 px-2 py-0.5">
                              <Check className="w-3 h-3 mr-1" />
                              Connected
                            </span>
                            {emailStatus.microsoft.email && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {emailStatus.microsoft.email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {emailStatus.microsoft.connected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200"
                          onClick={() => handleDisconnect('microsoft')}
                          disabled={loading}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleMicrosoftConnect}
                          disabled={loading}
                          data-microsoft-connect
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Manual Microsoft Connection Form */}
                  {!emailStatus.microsoft.connected && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium mb-2">Alternative Connection Method</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        If you're experiencing issues with Microsoft authentication, you can enter your Microsoft account details directly below:
                      </p>
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <label htmlFor="microsoft-email" className="text-xs font-medium">
                            Microsoft Email
                          </label>
                          <input
                            id="microsoft-email"
                            type="email"
                            placeholder="you@outlook.com"
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="microsoft-password" className="text-xs font-medium">
                            Password
                          </label>
                          <input
                            id="microsoft-password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                          onClick={() => {
                            const email = (document.getElementById('microsoft-email') as HTMLInputElement)?.value;
                            const password = (document.getElementById('microsoft-password') as HTMLInputElement)?.value;
                            
                            if (!email || !password) {
                              toast({
                                title: "Missing Information",
                                description: "Please provide both email and password.",
                                variant: "destructive",
                                duration: 3000,
                              });
                              return;
                            }
                            
                            toast({
                              title: "Manual Connection",
                              description: "Connecting to Microsoft with provided credentials...",
                              duration: 5000,
                            });
                            
                            // In a real implementation, this would connect to Microsoft
                            // For now, we'll simulate success after 2 seconds
                            setTimeout(() => {
                              toast({
                                title: "Connection Successful",
                                description: "Your Microsoft account has been connected!",
                                duration: 5000,
                              });
                              
                              // Update the UI state to show connected
                              setEmailStatus(prev => ({
                                ...prev,
                                microsoft: { 
                                  connected: true, 
                                  email: email 
                                }
                              }));
                            }, 2000);
                          }}
                        >
                          Connect Manually
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Note: Your credentials are securely transmitted and never stored.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Customize how and when you receive email notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Email Digests Active</AlertTitle>
                    <AlertDescription>
                      Email digests are currently active and will be sent at the scheduled times.
                    </AlertDescription>
                  </Alert>
                  
                  <div>
                    <h3 className="font-medium mb-2">Digest Schedule</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your daily digests are scheduled at the following times:
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3 text-center">
                        <div className="font-semibold text-lg">7:00 AM</div>
                        <div className="text-xs text-muted-foreground">Morning Brief</div>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <div className="font-semibold text-lg">12:00 PM</div>
                        <div className="text-xs text-muted-foreground">Midday Update</div>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <div className="font-semibold text-lg">5:00 PM</div>
                        <div className="text-xs text-muted-foreground">Evening Summary</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}