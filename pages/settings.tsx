import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { 
  User, 
  Shield, 
  BellRing, 
  Brush, 
  Lock, 
  Workflow, 
  Zap, 
  RefreshCw,
  Settings,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [navigate, setLocation] = useLocation();
  
  // User details state
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    avatar: ""
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: false,
    aiResponseStyle: "friendly",
    autonomousMode: "semi_manual"
  });
  
  // Connected services state
  const [connectedServices, setConnectedServices] = useState({
    slack: false,
    microsoft: false,
    google: false,
    stripe: false,
    sendgrid: false,
    openai: false
  });
  
  // Connected services details state with additional info
  const [servicesDetails, setServicesDetails] = useState({
    slack: { connected: false, username: "", displayName: "Slack" },
    microsoft: { connected: false, username: "", displayName: "Microsoft" },
    google: { connected: false, username: "", displayName: "Google" },
    stripe: { connected: false, username: "", displayName: "Stripe" },
    sendgrid: { connected: false, username: "", displayName: "SendGrid" },
    openai: { connected: false, username: "", displayName: "OpenAI" }
  });
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false
  });
  
  // Fetch user data when component mounts
  useEffect(() => {
    async function fetchUserData() {
      setIsLoading(true);
      
      try {
        // Fetch user data from API
        const response = await fetch("/api/user", {
          credentials: "include"
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("User data:", userData);
          
          // Update user profile with data from API
          setUserProfile({
            name: userData?.name || "",
            email: userData?.email || "",
            avatar: userData?.avatar || "",
          });
          
          // Update preferences with user data
          setPreferences({
            emailNotifications: userData?.preferences?.emailNotifications ?? true,
            darkMode: theme === "dark",
            aiResponseStyle: userData?.preferences?.aiResponseStyle || "friendly",
            autonomousMode: userData?.preferences?.autonomousMode || "semi_manual",
          });
        } else if (response.status === 401 || response.status === 403) {
          // User is not authenticated, redirect to login page
          toast({
            title: "Authentication required",
            description: "Please log in to access settings.",
            variant: "destructive"
          });
          window.location.href = "/auth";
          return;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // On error, also redirect to auth page
        toast({
          title: "Session expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        window.location.href = "/auth";
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    // Fetch connected services
    async function fetchConnectedServices() {
      try {
        // Fetch connected services from API
        const [googleResponse, microsoftResponse, slackResponse, stripeResponse] = await Promise.all([
          fetch("/api/auth/google/connected", { credentials: "include" }),
          fetch("/api/microsoft/connected", { credentials: "include" }),
          fetch("/api/slack/connected", { credentials: "include" }),
          fetch("/api/payment/stripe/connected", { credentials: "include" })
        ]);
        
        // Process Google response
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          setConnectedServices(prev => ({ ...prev, google: googleData.connected }));
          setServicesDetails(prev => ({ 
            ...prev, 
            google: { 
              ...prev.google, 
              connected: googleData.connected,
              username: googleData.email || "",
              displayName: "Google"
            }
          }));
        }
        
        // Process Microsoft response
        if (microsoftResponse.ok) {
          const microsoftData = await microsoftResponse.json();
          setConnectedServices(prev => ({ ...prev, microsoft: microsoftData.connected }));
          setServicesDetails(prev => ({ 
            ...prev, 
            microsoft: { 
              ...prev.microsoft, 
              connected: microsoftData.connected,
              username: microsoftData.details?.email || "",
              displayName: "Microsoft"
            }
          }));
        }
        
        // Process Slack response
        if (slackResponse.ok) {
          const slackData = await slackResponse.json();
          setConnectedServices(prev => ({ ...prev, slack: slackData.connected }));
          setServicesDetails(prev => ({ 
            ...prev, 
            slack: { 
              ...prev.slack, 
              connected: slackData.connected,
              username: slackData.teamName || "",
              displayName: "Slack"
            }
          }));
        }
        
        // Process Stripe response
        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          setConnectedServices(prev => ({ ...prev, stripe: stripeData.connected }));
          setServicesDetails(prev => ({ 
            ...prev, 
            stripe: { 
              ...prev.stripe, 
              connected: stripeData.connected,
              username: stripeData.accountEmail || "",
              displayName: "Stripe"
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching connected services:', error);
        // Show toast message for connected services error
        toast({
          title: "Error",
          description: "Failed to retrieve connected services information.",
          variant: "destructive"
        });
      }
    }
    
    fetchUserData();
    fetchConnectedServices();
  }, [theme, toast, navigate]);
  
  // Handle form submission for profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(userProfile)
      });
      
      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
          variant: "default"
        });
        
        // Update queryClient with new user data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive"
      });
    }
  };
  
  // Handle preferences changes and submission
  const handlePreferencesUpdate = async () => {
    // Update theme based on dark mode preference
    setTheme(preferences.darkMode ? "dark" : "light");
    
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          aiResponseStyle: preferences.aiResponseStyle,
          autonomousMode: preferences.autonomousMode
        })
      });
      
      if (response.ok) {
        toast({
          title: "Preferences updated",
          description: "Your preferences have been updated successfully.",
          variant: "default"
        });
        
        // Invalidate queryClient
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update preferences");
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your preferences.",
        variant: "destructive"
      });
    }
  };
  
  // Handle disconnecting a service
  const handleDisconnectService = async (serviceName: string) => {
    let endpoint = '';
    let key = '';
    
    // Determine the endpoint and state key based on the service name
    switch (serviceName) {
      case 'Google':
        endpoint = '/api/auth/google/disconnect';
        key = 'google';
        break;
      case 'Microsoft':
        endpoint = '/api/microsoft/disconnect';
        key = 'microsoft';
        break;
      case 'Slack':
        endpoint = '/api/slack/disconnect';
        key = 'slack';
        break;
      case 'Stripe':
        endpoint = '/api/payment/stripe/disconnect';
        key = 'stripe';
        break;
      default:
        toast({
          title: "Error",
          description: `Unknown service: ${serviceName}`,
          variant: "destructive"
        });
        return;
    }
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        // Update state to reflect the disconnection
        setConnectedServices(prev => ({ ...prev, [key]: false }));
        setServicesDetails(prev => ({ 
          ...prev, 
          [key]: { 
            ...prev[key as keyof typeof prev],
            connected: false,
            username: ""
          }
        }));
        
        toast({
          title: "Service disconnected",
          description: `${serviceName} has been disconnected successfully.`,
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to disconnect ${serviceName}`);
      }
    } catch (error: any) {
      toast({
        title: "Disconnection failed",
        description: error.message || `An error occurred while disconnecting ${serviceName}.`,
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="h-full flex justify-center items-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-3">
              <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-6 w-full bg-gray-200 rounded"></div>
              <div className="h-6 w-5/6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={userProfile.name}
                      onChange={e => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={userProfile.email}
                      onChange={e => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Your email address" 
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Your email address is used for authentication and cannot be changed.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input 
                      id="avatar" 
                      value={userProfile.avatar}
                      onChange={e => setUserProfile(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="https://example.com/avatar.png" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a URL to an image that will be used as your avatar.
                    </p>
                  </div>
                  
                  <Button type="submit">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications about updates and activity.
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={preferences.emailNotifications}
                      onCheckedChange={checked => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use dark theme for the application interface.
                      </p>
                    </div>
                    <Switch 
                      id="dark-mode" 
                      checked={preferences.darkMode}
                      onCheckedChange={checked => setPreferences(prev => ({ ...prev, darkMode: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="ai-style">AI Response Style</Label>
                    <Select 
                      value={preferences.aiResponseStyle}
                      onValueChange={value => setPreferences(prev => ({ ...prev, aiResponseStyle: value }))}
                    >
                      <SelectTrigger id="ai-style">
                        <SelectValue placeholder="Select response style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Set how you want the AI assistant to respond to your queries.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="autonomous-mode">Autonomous Mode</Label>
                    <Select 
                      value={preferences.autonomousMode}
                      onValueChange={value => setPreferences(prev => ({ ...prev, autonomousMode: value }))}
                    >
                      <SelectTrigger id="autonomous-mode">
                        <SelectValue placeholder="Select autonomous mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual (Approval required for all actions)</SelectItem>
                        <SelectItem value="semi_manual">Semi-Manual (Approval for important actions)</SelectItem>
                        <SelectItem value="semi_automatic">Semi-Automatic (Notify on important actions)</SelectItem>
                        <SelectItem value="automatic">Fully Automatic (Act independently)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Control how autonomous the AI assistant should be when performing tasks.
                    </p>
                  </div>
                </div>
                
                <Button onClick={handlePreferencesUpdate}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>
                  Manage your connected services and integrations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Integration */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-red-600">
                          <path 
                            fill="currentColor" 
                            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-semibold">
                          {servicesDetails.google.displayName || "Google"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Connect to Gmail, Calendar, and Docs.
                        </p>
                        {servicesDetails.google.connected && servicesDetails.google.username && (
                          <div className="mt-1 flex items-center">
                            <span className="text-xs inline-flex items-center font-medium rounded-full bg-green-100 text-green-800 px-2 py-0.5">
                              <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-500"></span>
                              Connected
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {servicesDetails.google.username}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {connectedServices.google ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                        onClick={() => handleDisconnectService("Google")}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center"
                        asChild
                      >
                        <Link href="/api/auth/google">
                          <Zap className="mr-2 h-4 w-4" />
                          Connect
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Microsoft Integration */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600">
                          <path 
                            fill="currentColor" 
                            d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-semibold">
                          {servicesDetails.microsoft.displayName || "Microsoft"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Connect to Outlook, OneDrive, and Microsoft 365.
                        </p>
                        {servicesDetails.microsoft.connected && servicesDetails.microsoft.username && (
                          <div className="mt-1 flex items-center">
                            <span className="text-xs inline-flex items-center font-medium rounded-full bg-green-100 text-green-800 px-2 py-0.5">
                              <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-500"></span>
                              Connected
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {servicesDetails.microsoft.username}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {connectedServices.microsoft ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                        onClick={() => handleDisconnectService("Microsoft")}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center"
                        asChild
                      >
                        <Link href="/api/microsoft/auth">
                          <Zap className="mr-2 h-4 w-4" />
                          Connect
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Stripe Integration */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24">
                          <path 
                            fill="currentColor" 
                            d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-semibold">
                          {servicesDetails.stripe.displayName || "Stripe"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          For payment processing and invoicing.
                        </p>
                        {servicesDetails.stripe.connected && servicesDetails.stripe.username && (
                          <div className="mt-1 flex items-center">
                            <span className="text-xs inline-flex items-center font-medium rounded-full bg-green-100 text-green-800 px-2 py-0.5">
                              <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-500"></span>
                              Connected
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {servicesDetails.stripe.username}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {connectedServices.stripe ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                        onClick={() => handleDisconnectService("Stripe")}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center"
                        asChild
                      >
                        <Link href="/api/payment/stripe/connect">
                          <Zap className="mr-2 h-4 w-4" />
                          Connect
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Coming Soon Section */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-base font-semibold mb-2">Additional Integrations Coming Soon</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We're constantly working on adding more integrations to enhance your experience.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-sm">Zoom Integration</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-sm">Notion Integration</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-sm">GitHub Integration</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your security settings and account protection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Change your password to keep your account secure.
                  </p>
                  <Button variant="outline" className="flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Enable 2FA
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}